import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { SignJWT } from 'jose';
import { createRateLimiter } from '@/utils/rate-limit';
import { supabaseAdmin } from '@/lib/supabase/admin';

const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/**
 * POST /api/auth/wallet
 *
 * Verifies an EIP-191 wallet signature and returns a Supabase-compatible JWT.
 * The JWT can be used as the Authorization header for all Supabase PostgREST requests,
 * enabling Row Level Security policies that check `auth.jwt()->>'wallet_address'`.
 *
 * Body: { address, signature, nonce }
 * Returns: { token, expiresAt }
 */
export async function POST(req: NextRequest) {
    const limited = limiter.check(req);
    if (limited) return limited;

    try {
        const { address, signature, nonce } = await req.json();

        if (!address || !signature || !nonce) {
            return NextResponse.json(
                { error: 'Missing address, signature, or nonce' },
                { status: 400 },
            );
        }

        // Validate nonce format: must be "superguild-auth:<address>:<timestamp>"
        const nonceParts = nonce.split(':');
        if (nonceParts.length !== 3 || nonceParts[0] !== 'superguild-auth') {
            return NextResponse.json({ error: 'Invalid nonce format' }, { status: 400 });
        }

        const nonceTimestamp = parseInt(nonceParts[2], 10);
        const now = Date.now();

        // Nonce must be within 5 minutes
        if (isNaN(nonceTimestamp) || Math.abs(now - nonceTimestamp) > 5 * 60_000) {
            return NextResponse.json({ error: 'Nonce expired' }, { status: 400 });
        }

        // Nonce must not have been used before (persistent check across serverless instances)
        const { data: usedNonce } = await supabaseAdmin
            .from('auth_nonces')
            .select('nonce')
            .eq('nonce', nonce)
            .maybeSingle();
        if (usedNonce) {
            return NextResponse.json({ error: 'Nonce already used' }, { status: 400 });
        }

        // Construct the message that was signed
        const message = `Sign in to SuperGuild\n\nNonce: ${nonce}`;

        // Verify EIP-191 signature
        const valid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        });

        if (!valid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Mark nonce as used — persisted in Supabase, survives serverless cold starts
        await supabaseAdmin
            .from('auth_nonces')
            .insert({ nonce, expires_at: new Date(now + 5 * 60_000).toISOString() });

        // Cleanup expired nonces (best-effort, non-blocking)
        void supabaseAdmin
            .from('auth_nonces')
            .delete()
            .lt('expires_at', new Date(now).toISOString());

        // Sign a Supabase-compatible JWT
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            console.error('SUPABASE_JWT_SECRET not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const secret = new TextEncoder().encode(jwtSecret);
        const walletAddress = address.toLowerCase();

        // Token valid for 24 hours
        const expiresAt = Math.floor(now / 1000) + 24 * 60 * 60;

        const token = await new SignJWT({
            // Standard Supabase JWT claims
            aud: 'authenticated',
            role: 'authenticated',
            sub: walletAddress,
            // Custom claim for RLS policies
            wallet_address: walletAddress,
            iss: 'supabase',
        })
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime(expiresAt)
            .sign(secret);

        return NextResponse.json({ token, expiresAt });
    } catch (error) {
        console.error('[auth/wallet] Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}

/**
 * GET /api/auth/wallet — Generate a nonce for signing
 */
export async function GET(req: NextRequest) {
    const limited = limiter.check(req);
    if (limited) return limited;

    const address = req.nextUrl.searchParams.get('address');
    if (!address) {
        return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
    }

    const nonce = `superguild-auth:${address.toLowerCase()}:${Date.now()}`;
    return NextResponse.json({ nonce });
}
