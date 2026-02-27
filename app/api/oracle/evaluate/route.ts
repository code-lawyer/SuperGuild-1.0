import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'
import { createClient } from '@supabase/supabase-js'
import { parseAllPoWs } from '@/lib/oracle/parsePoW'
import {
    buildEvaluationPrompt,
    parseLLMResponse,
    calculateBaseScore,
    calculateFinalVCP,
} from '@/lib/oracle/prompt'
import vcpAbi from '@/constants/VCPTokenV2.json'

const VCP_ADDRESS = '0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C' as const

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
    const LLM_KEY = process.env.ORACLE_LLM_API_KEY
    const LLM_MODEL = process.env.ORACLE_LLM_MODEL || 'claude-sonnet-4-20250514'

    // ─── 休眠守卫：无 Key 则跳过 ───
    if (!LLM_KEY) {
        return NextResponse.json({
            skipped: true,
            reason: 'Oracle not configured. Set ORACLE_LLM_API_KEY to activate.',
        })
    }

    try {
        const { collabId } = await request.json()
        if (!collabId) {
            return NextResponse.json({ error: '缺少 collabId' }, { status: 400 })
        }

        // ─── 1. 幂等性检查 ───
        const { data: existing } = await supabase
            .from('vcp_settlements')
            .select('id')
            .eq('collab_id', collabId)
            .limit(1)
            .single()

        if (existing) {
            return NextResponse.json({
                skipped: true,
                reason: 'Already evaluated',
                settlementId: existing.id,
            })
        }

        // ─── 2. 读取任务数据 ───
        const { data: collab, error: collabErr } = await supabase
            .from('collaborations')
            .select('*')
            .eq('id', collabId)
            .eq('status', 'SETTLED')
            .single()

        if (collabErr || !collab) {
            return NextResponse.json({ error: '任务不存在或未结算' }, { status: 404 })
        }

        const { data: milestones } = await supabase
            .from('milestones')
            .select('*')
            .eq('collab_id', collabId)
            .order('sort_order', { ascending: true })

        const milestoneIds = (milestones ?? []).map((m: any) => m.id)
        let proofs: any[] = []
        if (milestoneIds.length > 0) {
            const { data } = await supabase
                .from('proofs')
                .select('*')
                .in('milestone_id', milestoneIds)
            proofs = data ?? []
        }

        // ─── 3. 抓取 PoW ───
        const powUrls = proofs.map((p: any) => p.content_url).filter(Boolean)
        const powResults = powUrls.length > 0 ? await parseAllPoWs(powUrls) : []

        // ─── 4. 计算持续时间 ───
        const createdAt = new Date(collab.created_at)
        const settledAt = new Date(collab.updated_at || Date.now())
        const durationDays = Math.max(1, Math.round((settledAt.getTime() - createdAt.getTime()) / 86400000))

        // ─── 5. 构建 Prompt 并调用 LLM ───
        const prompt = buildEvaluationPrompt({
            taskTitle: collab.title,
            taskDescription: collab.description,
            deliveryStandard: collab.delivery_standard,
            budgetUSD: collab.total_budget,
            milestones: (milestones ?? []).map((m: any) => ({
                title: m.title,
                percentage: m.amount_percentage,
            })),
            durationDays,
            powResults,
        })

        const llmResponse = await callLLM(LLM_KEY, LLM_MODEL, prompt)
        const evaluation = parseLLMResponse(llmResponse)

        if (!evaluation) {
            console.error('Oracle: Failed to parse LLM response:', llmResponse)
            return NextResponse.json({ error: 'AI 评估响应解析失败' }, { status: 500 })
        }

        // ─── 6. 重算 VCP (用我们自己的公式，不完全信任 LLM 的数学) ───
        const baseScore = calculateBaseScore(collab.total_budget)
        const finalVCP = evaluation.isValid
            ? calculateFinalVCP(
                baseScore,
                evaluation.complexityScore,
                evaluation.qualityScore,
                evaluation.efficiencyScore
            )
            : 0

        // ─── 7. 链上铸币 (仅当 VCP > 0) ───
        let txHash: `0x${string}` | null = null

        if (finalVCP > 0 && collab.provider_id) {
            const privateKey = process.env.HOT_WALLET_PRIVATE_KEY as `0x${string}`
            if (!privateKey) {
                return NextResponse.json({ error: '热钱包未配置' }, { status: 500 })
            }

            const account = privateKeyToAccount(privateKey)
            const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_ID
            const rpcUrl = alchemyKey
                ? `https://arb-sepolia.g.alchemy.com/v2/${alchemyKey}`
                : undefined

            const walletClient = createWalletClient({
                account,
                chain: arbitrumSepolia,
                transport: http(rpcUrl),
            })

            const publicClient = createPublicClient({
                chain: arbitrumSepolia,
                transport: http(rpcUrl),
            })

            txHash = await walletClient.writeContract({
                address: VCP_ADDRESS,
                abi: vcpAbi,
                functionName: 'mint',
                args: [
                    collab.provider_id,
                    BigInt(finalVCP),
                    `Settlement: ${collabId.slice(0, 8)}`,
                ],
            })

            await publicClient.waitForTransactionReceipt({ hash: txHash })
        }

        // ─── 8. 记录存证 ───
        await supabase.from('vcp_settlements').insert({
            collab_id: collabId,
            provider_address: collab.provider_id,
            vcp_amount: finalVCP,
            ai_reasoning: evaluation.reasoning,
            ai_model: LLM_MODEL,
            tx_hash: txHash,
            pow_urls: powUrls,
        })

        return NextResponse.json({
            success: true,
            vcpAmount: finalVCP,
            txHash,
            reasoning: evaluation.reasoning,
            details: {
                baseScore,
                complexity: evaluation.complexityScore,
                quality: evaluation.qualityScore,
                efficiency: evaluation.efficiencyScore,
                isValid: evaluation.isValid,
            },
        })
    } catch (error: any) {
        console.error('Oracle evaluation error:', error)
        return NextResponse.json(
            { error: error?.message || '评估失败' },
            { status: 500 }
        )
    }
}

// ─── LLM 调用抽象层 ───
// 支持 Claude (Anthropic) 和 OpenAI 格式
async function callLLM(apiKey: string, model: string, prompt: string): Promise<string> {
    // Detect provider from model name
    const isClaude = model.toLowerCase().includes('claude')
    const isGemini = model.toLowerCase().includes('gemini')

    if (isClaude) {
        return callAnthropic(apiKey, model, prompt)
    } else if (isGemini) {
        return callGemini(apiKey, model, prompt)
    } else {
        return callOpenAI(apiKey, model, prompt)
    }
}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Anthropic API error: ${res.status} ${err}`)
    }

    const data = await res.json()
    return data.content?.[0]?.text || ''
}

async function callOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a fair and objective AI judge for a decentralized collaboration platform.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 1024,
            temperature: 0.3,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenAI API error: ${res.status} ${err}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
            }),
        }
    )

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gemini API error: ${res.status} ${err}`)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
