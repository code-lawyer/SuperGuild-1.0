import { NextResponse } from 'next/server';
import { createRateLimiter } from '@/utils/rate-limit';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { PRIVILEGE_CHAIN_ID } from '@/constants/chain-config';
import { getAlchemyRpcUrl } from '@/constants/chain-config';

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

// Map chain IDs to Alchemy NFT API subdomains
const alchemyNftSubdomain: Record<number, string> = {
    11155111: 'eth-sepolia',
    1: 'eth-mainnet',
};

/**
 * Fetch Token #4 (Hand of Justice) holders from Alchemy NFT API.
 * Falls back to empty array if API is unavailable.
 */
async function fetchJusticeHolders(alchemyKey: string): Promise<string[]> {
    const subdomain = alchemyNftSubdomain[PRIVILEGE_CHAIN_ID];
    if (!subdomain) {
        console.warn(`[chief] No Alchemy NFT subdomain for chain ${PRIVILEGE_CHAIN_ID}`);
        return [];
    }

    const tokenId = PRIVILEGE_NFT.tokens.HAND_OF_JUSTICE.id.toString();
    const contractAddress = PRIVILEGE_NFT.address;

    // Use Alchemy's getOwnersForContract with tokenId filter
    const url = `https://${subdomain}.g.alchemy.com/nft/v3/${alchemyKey}/getOwnersForContract?contractAddress=${contractAddress}&withTokenBalances=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
            console.warn(`[chief] Alchemy NFT API returned ${res.status}`);
            return [];
        }

        const data = await res.json();
        // Filter for owners who hold Token #4
        const holders: string[] = [];
        if (data.owners) {
            for (const owner of data.owners) {
                // Each owner has tokenBalances array
                if (owner.tokenBalances) {
                    const hasJustice = owner.tokenBalances.some(
                        (tb: { tokenId: string; balance: number }) =>
                            tb.tokenId === tokenId && tb.balance > 0
                    );
                    if (hasJustice) {
                        holders.push(owner.ownerAddress.toLowerCase());
                    }
                }
            }
        }

        return holders;
    } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') {
            console.warn('[chief] Alchemy NFT API timed out');
        } else {
            console.warn('[chief] Alchemy NFT API error:', e.message);
        }
        return [];
    }
}

// In-memory cache (refresh every 10 minutes)
let holdersCache: string[] = [];
let holdersCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
    const limited = limiter.check(request);
    if (limited) return limited;

    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_ID || '';
    if (!alchemyKey) {
        return NextResponse.json(
            { error: 'Alchemy API key not configured' },
            { status: 503 },
        );
    }

    // Refresh cache if stale
    const now = Date.now();
    if (now - holdersCacheTime > CACHE_TTL || holdersCache.length === 0) {
        const fetched = await fetchJusticeHolders(alchemyKey);
        if (fetched.length > 0) {
            holdersCache = fetched;
            holdersCacheTime = now;
        }
    }

    if (holdersCache.length === 0) {
        return NextResponse.json({
            chiefArbitrator: null,
            rotationsCompleted: 0,
            nextRotation: null,
            totalKeepers: 0,
        });
    }

    // Rotate chief daily based on day-of-year
    const start = new Date(2026, 0, 1);
    const daysSinceStart = Math.floor((now - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentIndex = daysSinceStart % holdersCache.length;
    const currentChief = holdersCache[currentIndex];

    // Next rotation at midnight
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + 1);
    nextRotation.setHours(0, 0, 0, 0);

    return NextResponse.json({
        chiefArbitrator: currentChief,
        rotationsCompleted: daysSinceStart,
        nextRotation: nextRotation.toISOString(),
        totalKeepers: holdersCache.length,
    });
}
