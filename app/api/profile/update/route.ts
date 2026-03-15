import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyWalletJWT } from '@/lib/auth/verify-jwt';
import { encryptPII } from '@/lib/crypto.server';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/**
 * POST /api/profile/update
 *
 * Server-side profile update that encrypts PII fields (contact_email,
 * contact_telegram) before writing to the database.
 *
 * Auth: JWT in Authorization header.
 */
export async function POST(req: NextRequest) {
    const limited = limiter.check(req);
    if (limited) return limited;

    const wallet = await verifyWalletJWT(req.headers.get('authorization'));
    if (!wallet) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
        username?: string;
        bio?: string;
        contact_email?: string;
        contact_telegram?: string;
        portfolio?: string;
        avatar_url?: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { username, bio, contact_email, contact_telegram, portfolio, avatar_url } = body;

    if (!username?.trim()) {
        return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }
    if (!contact_email?.trim() && !contact_telegram?.trim()) {
        return NextResponse.json({ error: 'At least one contact method is required' }, { status: 400 });
    }

    // Encrypt PII fields before storage
    const encryptedEmail = contact_email?.trim()
        ? encryptPII(contact_email.trim())
        : null;
    const encryptedTelegram = contact_telegram?.trim()
        ? encryptPII(contact_telegram.trim())
        : null;

    const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
            wallet_address: wallet,
            username: username.trim(),
            bio: bio?.trim() || null,
            contact_email: encryptedEmail,
            contact_telegram: encryptedTelegram,
            portfolio: portfolio?.trim() || null,
            profile_completed: true,
            ...(avatar_url !== undefined && { avatar_url }),
        });

    if (error) {
        console.error('[profile/update] DB error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
