import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createClient } from '@supabase/supabase-js'
import vcpAbi from '@/constants/VCPTokenV2.json'
import { VCP_TOKEN } from '@/constants/nft-config'
import { PRIMARY_CHAIN, getAlchemyRpcUrl, PRIMARY_CHAIN_ID } from '@/constants/chain-config'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export async function POST(request: Request) {
    const supabase = getSupabase()
    try {
        const { code, address, signature } = await request.json()

        // ─── 1. Validate input ───
        if (!code || !address || !signature) {
            return NextResponse.json({ error: 'missing_params' }, { status: 400 })
        }

        // ─── 2. Verify EIP-191 signature (prevent address spoofing) ───
        const message = `I am claiming Pioneer code ${code} for address ${address}`
        const valid = await verifyMessage({ address, message, signature })
        if (!valid) {
            return NextResponse.json({ error: 'invalid_signature' }, { status: 403 })
        }

        // ─── 3. Check if address already claimed any code ───
        const { data: existingClaim } = await supabase
            .from('pioneer_codes')
            .select('code')
            .eq('claimed_by', address.toLowerCase())
            .limit(1)
            .single()

        if (existingClaim) {
            return NextResponse.json({ error: 'already_claimed' }, { status: 409 })
        }

        // ─── 4. Check if code exists and is unused ───
        const { data: codeRecord, error: codeError } = await supabase
            .from('pioneer_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single()

        if (codeError || !codeRecord) {
            return NextResponse.json({ error: 'invalid_code' }, { status: 404 })
        }

        if (codeRecord.claimed_by) {
            return NextResponse.json({ error: 'code_used' }, { status: 409 })
        }

        // ─── 5. Mint 100 VCP via hot wallet ───
        const privateKey = process.env.HOT_WALLET_PRIVATE_KEY as `0x${string}`
        if (!privateKey) {
            return NextResponse.json({ error: 'server_config_error' }, { status: 500 })
        }

        const account = privateKeyToAccount(privateKey)
        const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_ID
        const rpcUrl = alchemyKey
            ? getAlchemyRpcUrl(PRIMARY_CHAIN_ID, alchemyKey)
            : undefined

        const walletClient = createWalletClient({
            account,
            chain: PRIMARY_CHAIN,
            transport: http(rpcUrl),
        })

        const publicClient = createPublicClient({
            chain: PRIMARY_CHAIN,
            transport: http(rpcUrl),
        })

        const txHash = await walletClient.writeContract({
            address: VCP_TOKEN.address,
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
        })
    } catch (error: any) {
        console.error('Pioneer claim error:', error)
        return NextResponse.json(
            { error: error?.shortMessage || error?.message || 'claim_failed' },
            { status: 500 }
        )
    }
}
