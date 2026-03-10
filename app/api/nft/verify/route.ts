import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/utils/rate-limit';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { PRIVILEGE_CHAIN_ID } from '@/constants/chain-config';

const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });

const alchemyNftSubdomain: Record<number, string> = {
    11155111: 'eth-sepolia',
    1: 'eth-mainnet',
};

// ── Server-side cache: address → { balances, timestamp } ────────────────────
const cache = new Map<string, { balances: Record<string, number>; ts: number }>();
const CACHE_TTL = 5 * 60_000; // 5 minutes

// Cleanup stale entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of cache) {
        if (now - val.ts > CACHE_TTL * 2) cache.delete(key);
    }
}, 10 * 60_000);

/**
 * GET /api/nft/verify?address=0x...
 *
 * Returns Privilege NFT balances for the given address using Alchemy NFT API
 * (HTTP REST, not RPC — different infrastructure, more reliable on testnet).
 *
 * Response: { balances: { "1": 1, "2": 0, "3": 1, "4": 0, "5": 0 }, cached: boolean }
 */
export async function GET(req: NextRequest) {
    const limited = limiter.check(req);
    if (limited) return limited;

    const address = req.nextUrl.searchParams.get('address')?.toLowerCase();
    if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    // Check server cache
    const cached = cache.get(address);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json({ balances: cached.balances, cached: true });
    }

    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_ID || '';
    const subdomain = alchemyNftSubdomain[PRIVILEGE_CHAIN_ID];
    if (!alchemyKey || !subdomain) {
        return NextResponse.json({ error: 'NFT API not configured' }, { status: 503 });
    }

    const contractAddress = PRIVILEGE_NFT.address;
    const url = `https://${subdomain}.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner`
        + `?owner=${address}`
        + `&contractAddresses[]=${contractAddress}`
        + `&withMetadata=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
            console.warn(`[nft/verify] Alchemy NFT API returned ${res.status}`);
            // Return stale cache if available
            if (cached) {
                return NextResponse.json({ balances: cached.balances, cached: true, stale: true });
            }
            return NextResponse.json({ error: 'NFT API unavailable' }, { status: 503 });
        }

        const data = await res.json();

        // Build balance map for all 5 tokens
        const allTokens = Object.values(PRIVILEGE_NFT.tokens);
        const balances: Record<string, number> = {};
        for (const t of allTokens) {
            balances[t.id.toString()] = 0;
        }

        // Parse Alchemy response: ownedNfts[].tokenId
        if (data.ownedNfts) {
            for (const nft of data.ownedNfts) {
                const tid = nft.tokenId;
                if (tid in balances) {
                    balances[tid] = Number(nft.balance ?? 1);
                }
            }
        }

        // Update cache
        cache.set(address, { balances, ts: Date.now() });

        return NextResponse.json({ balances, cached: false });
    } catch (e: any) {
        clearTimeout(timeout);
        console.warn(`[nft/verify] Error:`, e.name === 'AbortError' ? 'timeout' : e.message);

        // Return stale cache if available
        if (cached) {
            return NextResponse.json({ balances: cached.balances, cached: true, stale: true });
        }
        return NextResponse.json({ error: 'NFT verification failed' }, { status: 503 });
    }
}
