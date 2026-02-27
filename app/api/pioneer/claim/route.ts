import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'
import { createClient } from '@supabase/supabase-js'
import vcpAbi from '@/constants/VCPTokenV2.json'

const VCP_ADDRESS = '0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C' as const

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
    try {
        const { code, address, signature } = await request.json()

        // ─── 1. Validate input ───
        if (!code || !address || !signature) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
        }

        // ─── 2. Verify EIP-191 signature (prevent address spoofing) ───
        const message = `I am claiming Pioneer code ${code} for address ${address}`
        const valid = await verifyMessage({ address, message, signature })
        if (!valid) {
            return NextResponse.json({ error: '签名验证失败' }, { status: 403 })
        }

        // ─── 3. Check if address already claimed any code ───
        const { data: existingClaim } = await supabase
            .from('pioneer_codes')
            .select('code')
            .eq('claimed_by', address.toLowerCase())
            .limit(1)
            .single()

        if (existingClaim) {
            return NextResponse.json({ error: '该地址已领取过拓世者奖励' }, { status: 409 })
        }

        // ─── 4. Check if code exists and is unused ───
        const { data: codeRecord, error: codeError } = await supabase
            .from('pioneer_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single()

        if (codeError || !codeRecord) {
            return NextResponse.json({ error: '无效的邀请码' }, { status: 404 })
        }

        if (codeRecord.claimed_by) {
            return NextResponse.json({ error: '该邀请码已被使用' }, { status: 409 })
        }

        // ─── 5. Mint 100 VCP via hot wallet ───
        const privateKey = process.env.HOT_WALLET_PRIVATE_KEY as `0x${string}`
        if (!privateKey) {
            return NextResponse.json({ error: '服务器配置错误' }, { status: 500 })
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

        const txHash = await walletClient.writeContract({
            address: VCP_ADDRESS,
            abi: vcpAbi,
            functionName: 'mint',
            args: [address, BigInt(100), `Pioneer: ${code}`],
        })

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash: txHash })

        // ─── 6. Update Supabase record ───
        await supabase
            .from('pioneer_codes')
            .update({
                claimed_by: address.toLowerCase(),
                claimed_at: new Date().toISOString(),
                tx_hash: txHash,
            })
            .eq('code', code.toUpperCase())

        return NextResponse.json({
            success: true,
            txHash,
            message: '恭喜成为拓世者！100 VCP 已发放到你的钱包。',
        })
    } catch (error: any) {
        console.error('Pioneer claim error:', error)
        return NextResponse.json(
            { error: error?.shortMessage || error?.message || '领取失败，请稍后重试' },
            { status: 500 }
        )
    }
}
