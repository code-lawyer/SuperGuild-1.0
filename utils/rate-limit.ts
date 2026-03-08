/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per IP address.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   // In your route handler:
 *   const limited = limiter.check(request);
 *   if (limited) return limited; // Returns a 429 Response
 */

import { NextResponse } from 'next/server';

interface RateLimiterOptions {
    /** Time window in milliseconds */
    windowMs: number;
    /** Max requests per window */
    max: number;
}

interface Entry {
    count: number;
    resetAt: number;
}

export function createRateLimiter({ windowMs, max }: RateLimiterOptions) {
    const store = new Map<string, Entry>();

    // Periodic cleanup to prevent memory leak
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now > entry.resetAt) store.delete(key);
        }
    }, windowMs * 2);

    return {
        check(request: Request): NextResponse | null {
            const forwarded = request.headers.get('x-forwarded-for');
            const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
            const now = Date.now();

            let entry = store.get(ip);
            if (!entry || now > entry.resetAt) {
                entry = { count: 0, resetAt: now + windowMs };
                store.set(ip, entry);
            }

            entry.count++;

            if (entry.count > max) {
                return NextResponse.json(
                    { error: 'too_many_requests' },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
                        },
                    },
                );
            }

            return null; // Not limited
        },
    };
}
