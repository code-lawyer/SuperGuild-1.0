import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/**
 * POST /api/council/proposals/withdraw
 *
 * Withdraw a SIGNALING proposal. Only the proposer can do this.
 * Requires EIP-191 signature proving address ownership.
 * Uses supabaseAdmin to bypass RLS (authorization is enforced here).
 */
export async function POST(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;

    try {
        const { proposalId, address, signature } = await req.json();

        if (!proposalId || !address || !signature) {
            return NextResponse.json({ error: 'Missing proposalId, address, or signature' }, { status: 400 });
        }

        // 1. Verify EIP-191 signature
        const message = `SuperGuild Withdraw Proposal\nProposal: ${proposalId}\nAddress: ${address}`;
        const valid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        });
        if (!valid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        const lowerAddress = address.toLowerCase();

        // 2. Fetch proposal and verify ownership + status
        const { data: proposal, error: fetchError } = await supabaseAdmin
            .from('proposals')
            .select('id, status, proposer_address')
            .eq('id', proposalId)
            .single();

        if (fetchError || !proposal) {
            return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
        }
        if (proposal.proposer_address.toLowerCase() !== lowerAddress) {
            return NextResponse.json({ error: 'Forbidden: not the proposer' }, { status: 403 });
        }
        if (proposal.status !== 'SIGNALING') {
            return NextResponse.json({ error: 'Proposal cannot be withdrawn in its current status' }, { status: 409 });
        }

        // 3. Update status to CANCELLED
        const { error: updateError } = await supabaseAdmin
            .from('proposals')
            .update({ status: 'CANCELLED' })
            .eq('id', proposalId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[proposals/withdraw] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
