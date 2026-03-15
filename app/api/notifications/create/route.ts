import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyWalletJWT } from '@/lib/auth/verify-jwt';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/**
 * POST /api/notifications/create
 *
 * Server-side notification creation using service_role key.
 * Requires a valid JWT — the caller must be authenticated.
 * This prevents unauthenticated spam while keeping service_role for the write.
 */
export async function POST(req: NextRequest) {
    const limited = limiter.check(req);
    if (limited) return limited;

    // Require a valid JWT (wallet must be connected)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await verifyWalletJWT(`Bearer ${token}`);
    if (!wallet) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let body: {
        user_address: string;
        type: string;
        title: string;
        body?: string;
        metadata?: Record<string, unknown>;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { user_address, type, title } = body;
    if (!user_address || !type || !title) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate user_address is a valid Ethereum address
    if (!/^0x[0-9a-fA-F]{40}$/i.test(user_address)) {
        return NextResponse.json({ error: 'Invalid user_address' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('notifications').insert({
        user_address: user_address.toLowerCase(),
        type,
        title,
        body: body.body || null,
        metadata: body.metadata || {},
    });

    if (error) {
        console.error('[notifications/create] DB error:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
