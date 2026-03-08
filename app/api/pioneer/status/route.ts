import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export async function GET(request: Request) {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
        return NextResponse.json({ isPioneer: false })
    }

    const { data } = await supabase
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
    const { count } = await supabase
        .from('pioneer_codes')
        .select('code', { count: 'exact', head: true })
        .is('claimed_by', null)

    return NextResponse.json({
        isPioneer: false,
        remainingSlots: count ?? 0,
    })
}
