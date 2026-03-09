import { NextResponse } from 'next/server';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

export async function POST(request: Request) {
  const limited = limiter.check(request);
  if (limited) return limited;
  try {
    const body = await request.json();

    const response = await fetch('https://api.thegraph.com/subgraphs/name/verax/linea-sepolia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GraphQL query error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}