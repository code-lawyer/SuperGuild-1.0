/**
 * AI 裁判评估 Prompt + 权重矩阵
 *
 * 此文件是 AI Oracle 的"宪法"，代码完全开源可审计。
 * 社区可通过 DAO 投票修改权重参数。
 */

import type { PoWResult } from './parsePoW'

// ── 评估结果类型 ──
export interface OracleEvaluation {
    isValid: boolean        // PoW 是否与任务相关
    vcpAmount: number       // 最终发放的 VCP 数量
    complexityScore: number // 难度系数 0.5 - 2.0
    qualityScore: number    // 质量系数 0.8 - 1.2
    efficiencyScore: number // 效率系数 0.8 - 1.2
    reasoning: string       // AI 的评估理由（存入链下记录）
}

// ── 基准分计算 ──
export function calculateBaseScore(budgetUSD: number): number {
    // ln(budget) × 5，最低 5 分最高 100 分
    if (budgetUSD <= 0) return 5
    return Math.min(100, Math.max(5, Math.round(Math.log(budgetUSD) * 5)))
}

// ── 最终 VCP 计算 ──
export function calculateFinalVCP(
    baseScore: number,
    complexity: number,
    quality: number,
    efficiency: number
): number {
    const raw = baseScore * complexity * quality * efficiency
    return Math.max(0, Math.floor(raw))
}

// ── 构建 LLM 评估 Prompt ──
export function buildEvaluationPrompt(params: {
    taskTitle: string
    taskDescription: string | null
    deliveryStandard: string | null
    budgetUSD: number
    milestones: { title: string | null; percentage: number }[]
    durationDays: number
    powResults: PoWResult[]
}): string {
    const baseScore = calculateBaseScore(params.budgetUSD)

    const powSection = params.powResults.map((p, i) => {
        if (!p.success) {
            return `### PoW #${i + 1}: ${p.url}\n**状态**: 抓取失败 (${p.content})\n`
        }
        // Truncate very long PoW to avoid token overflow
        const truncated = p.content.length > 20_000
            ? p.content.slice(0, 20_000) + '\n\n...[内容已截断]'
            : p.content
        return `### PoW #${i + 1}: ${p.url}\n**来源**: ${p.source} | **字符数**: ${p.charCount}\n\n${truncated}\n`
    }).join('\n---\n\n')

    return `你是 Super Guild 的 AI 裁判 (Oracle)。你的职责是公平、客观地评估一项已完成的任务，并决定应发放多少 VCP (Voice & Credit Points) 信誉积分。

## 评估规则（硬编码，不可违反）

1. **无 PoW = 0 VCP**：如果所有 PoW 链接都抓取失败或内容为空，isValid 必须为 false，vcpAmount 为 0。
2. **PoW 必须与任务相关**：如果 PoW 内容明显与任务描述无关（如提交了一个无关项目的链接），isValid 为 false。
3. **不要被金额迷惑**：高预算不等于高 VCP。一个 10000 USD 的任务如果只是复制粘贴，难度系数应该很低。
4. **鼓励真实贡献**：复杂的技术工作、创造性设计、深度研究应获得更高的评分。

## 权重矩阵

| 维度 | 系数范围 | 说明 |
|:-----|:---------|:-----|
| complexityScore | 0.5 - 2.0 | 0.5=机械复制 1.0=标准开发 1.5=复杂系统 2.0=前沿研究/密码学 |
| qualityScore | 0.8 - 1.2 | 0.8=勉强达标 1.0=合格 1.2=超预期出色 |
| efficiencyScore | 0.8 - 1.2 | 0.8=严重拖延 1.0=正常 1.2=极高效 |

**基准分**: ${baseScore} (由 ln(${params.budgetUSD}) × 5 计算得出)
**最终公式**: VCP = floor(${baseScore} × complexity × quality × efficiency)

## 待评估的任务

**标题**: ${params.taskTitle}
**描述**: ${params.taskDescription || '(无描述)'}
**交付标准**: ${params.deliveryStandard || '(无明确标准)'}
**预算**: ${params.budgetUSD} USD
**耗时**: ${params.durationDays} 天
**里程碑**: ${params.milestones.map(m => `${m.title || '未命名'} (${m.percentage}%)`).join(' → ')}

## 提交的工作量证明 (PoW)

${powSection || '⚠️ 无任何 PoW 提交'}

## 输出格式

请严格输出以下 JSON 格式，不要包含任何其他文字：

\`\`\`json
{
  "isValid": true/false,
  "complexityScore": 0.5-2.0,
  "qualityScore": 0.8-1.2,
  "efficiencyScore": 0.8-1.2,
  "vcpAmount": <计算结果>,
  "reasoning": "<100字以内的中文评估摘要>"
}
\`\`\`
`
}

// ── 解析 LLM 响应 ──
export function parseLLMResponse(raw: string): OracleEvaluation | null {
    try {
        // Extract JSON from markdown code block or raw text
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return null

        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonStr.trim())

        // Validate and clamp values
        const isValid = Boolean(parsed.isValid)
        const complexity = Math.min(2.0, Math.max(0.5, Number(parsed.complexityScore) || 1.0))
        const quality = Math.min(1.2, Math.max(0.8, Number(parsed.qualityScore) || 1.0))
        const efficiency = Math.min(1.2, Math.max(0.8, Number(parsed.efficiencyScore) || 1.0))

        return {
            isValid,
            vcpAmount: isValid ? (Number(parsed.vcpAmount) || 0) : 0,
            complexityScore: complexity,
            qualityScore: quality,
            efficiencyScore: efficiency,
            reasoning: String(parsed.reasoning || '').slice(0, 500),
        }
    } catch {
        return null
    }
}
