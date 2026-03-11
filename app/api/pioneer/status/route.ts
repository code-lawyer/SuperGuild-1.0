import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createRateLimiter } from '@/utils/rate-limit'

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 })

export async function GET(request: Request) {
    const limited = limiter.check(request)
    if (limited) return limited
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
        return NextResponse.json({ isPioneer: false })
    }

    const { data } = await supabaseAdmin
        .from('pioneer_codes')
        .select('claimed_at, tx_hash')
        .eq('claimed_by', address.toLowerCase())
        .limit(1)
        .single()

    if (data) {
        return NextResponse.json({
            isPioneer: true,
            claimedAt: data.claimed_at,
            txHash: data.tx_hash,
        })
    }

    // Check remaining slots
    const { count } = await supabaseAdmin
        .from('pioneer_codes')
        .select('code', { count: 'exact', head: true })
        .is('claimed_by', null)

    return NextResponse.json({
        isPioneer: false,
        remainingSlots: count ?? 0,
    })
}
