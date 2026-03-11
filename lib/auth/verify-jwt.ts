import { jwtVerify } from 'jose';

/**
 * Verify a Supabase-compatible JWT (issued by /api/auth/wallet)
 * and extract the wallet_address claim.
 *
 * Returns lowercase wallet address on success, null on failure.
 */
export async function verifyWalletJWT(authHeader: string | null): Promise<string | null> {
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
        console.error('[verifyWalletJWT] SUPABASE_JWT_SECRET not configured');
        return null;
    }

    try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret, {
            audience: 'authenticated',
            issuer: 'supabase',
        });

        const wallet = payload.wallet_address;
        if (typeof wallet !== 'string' || !/^0x[a-f0-9]{40}$/.test(wallet)) {
            return null;
        }

        return wallet;
    } catch {
        return null;
    }
}
