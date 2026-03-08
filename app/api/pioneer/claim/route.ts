import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createClient } from '@supabase/supabase-js'
import vcpAbi from '@/constants/VCPTokenV2.json'
import { VCP_TOKEN } from '@/constants/nft-config'
import { PRIMARY_CHAIN, getAlchemyRpcUrl, PRIMARY_CHAIN_ID } from '@/constants/chain-config'
import { createRateLimiter } from '@/utils/rate-limit'

const limiter = createRateLimiter({ windowMs: 60_000, max: 5 })

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export async function POST(request: Request) {
    const limited = limiter.check(request)
    if (limited) return limited

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

        // ─── 4. Atomic claim: UPDATE only if code exists AND is unclaimed ───
        // This prevents race conditions: only the first concurrent request succeeds
        const { data: claimedRows, error: claimError } = await supabase
            .from('pioneer_codes')
            .update({
                claimed_by: address.toLowerCase(),
                claimed_at: new Date().toISOString(),
            })
            .eq('code', code.toUpperCase())
            .is('claimed_by', null)
            .select()

        if (claimError) {
            console.error('Claim lock error:', claimError)
            return NextResponse.json({ error: 'claim_failed' }, { status: 500 })
        }

        if (!claimedRows || claimedRows.length === 0) {
            // Either code doesn't exist or was already claimed by another request
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

        let txHash: `0x${string}`
        try {
            txHash = await walletClient.writeContract({
                address: VCP_TOKEN.address,
                abi: vcpAbi,
                functionName: 'mint',
                args: [address, BigInt(100), `Pioneer: ${code}`],
            })

            // Wait for confirmation
            await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
        } catch (mintError: any) {
            // Mint failed — rollback the claim lock so the code can be reused
            console.error('VCP mint failed, rolling back claim lock:', mintError)
            await supabase
                .from('pioneer_codes')
                .update({ claimed_by: null, claimed_at: null })
                .eq('code', code.toUpperCase())

            return NextResponse.json(
                { error: mintError?.shortMessage || 'mint_failed' },
                { status: 500 }
            )
        }

        // ─── 6. Update tx_hash (claimed_by/claimed_at already set in step 4) ───
        await supabase
            .from('pioneer_codes')
            .update({ tx_hash: txHash })
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
