import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/auth/verify-admin';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/**
 * POST /api/admin/badge-lore — Upsert badge lore entry
 *
 * Requires: EIP-191 signature + Token #3 (First Flame) NFT or fallback wallet
 */
export async function POST(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;

    try {
        const body = await req.json();
        const { address, signature, token_id, ...loreFields } = body;

        if (!token_id || typeof token_id !== 'number') {
            return NextResponse.json({ error: 'token_id is required' }, { status: 400 });
        }

        const action = `upsert-badge-lore:${token_id}`;
        const auth = await verifyAdmin({ address, signature, action });
        if ('error' in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { error } = await supabaseAdmin
            .from('badge_lore')
            .upsert(
                { token_id, ...loreFields, updated_at: new Date().toISOString() },
                { onConflict: 'token_id' },
            );

        if (error) {
            console.error('[badge-lore] DB error:', error);
            return NextResponse.json({ error: 'Failed to save badge lore' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[badge-lore] Unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
