import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hasPrivilegeNFT } from '@/lib/auth/verify-nft';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/**
 * POST /api/council/arbitration/vote
 *
 * Cast a dispute vote. Requires:
 * 1. EIP-191 signature proving wallet ownership
 * 2. Token #4 (Hand of Justice) NFT
 */
export async function POST(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;

    try {
        const { collabId, milestoneId, workerWon, reason, address, signature } = await req.json();

        if (!collabId || !milestoneId || workerWon === undefined || !address || !signature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify signature
        const message = `SuperGuild Dispute Vote\nCollab: ${collabId}\nMilestone: ${milestoneId}\nVote: ${workerWon ? 'worker' : 'publisher'}\nAddress: ${address}`;
        const valid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        });
        if (!valid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        // 2. Verify Token #4 (Hand of Justice) NFT
        const hasJustice = await hasPrivilegeNFT(
            address.toLowerCase() as `0x${string}`,
            PRIVILEGE_NFT.tokens.HAND_OF_JUSTICE.id,
        );
        if (!hasJustice) {
            return NextResponse.json({ error: 'Forbidden: Hand of Justice NFT required' }, { status: 403 });
        }

        // 3. Upsert vote (one vote per voter per milestone)
        const { error } = await supabaseAdmin
            .from('dispute_votes')
            .upsert({
                collab_id: collabId,
                milestone_id: milestoneId,
                voter_address: address.toLowerCase(),
                worker_won: workerWon,
                reason: reason || null,
            }, { onConflict: 'milestone_id,voter_address' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[council/arbitration/vote] Error:', error);
        return NextResponse.json({ error: error.message || 'Vote failed' }, { status: 500 });
    }
}
