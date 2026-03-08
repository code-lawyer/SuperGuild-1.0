import { NextResponse } from 'next/server';

// ⚠️ MOCK DATA — Replace with on-chain query (Alchemy getNFTOwners or Subgraph)
// TODO: Query Hand of Justice (Token #4) holders from PRIVILEGE_NFT contract
//       and rotate chief based on on-chain epoch or block timestamp
const MOCK_HOLDERS = [
    '0x2668b81db197cd1F9d82136C70d473ED2B2B4aE5', // Random mock address
    '0x1234567890123456789012345678901234567890',
    '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01',
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mockAddress = searchParams.get('address');

    // 1. In production, fetch actual NFT holders from Viem / Subgraph / Alchemy
    // 2. Determine the current epoch (e.g. 1 epoch = 1 dispute or 1 day timer)

    // For now, let's rotate based on the day of the year to simulate rotation
    const start = new Date(2026, 0, 1);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Inject the user's address into the mock array to make sure they can test the feature
    const activeHolders = [...MOCK_HOLDERS];
    if (mockAddress && !activeHolders.includes(mockAddress)) {
        activeHolders.push(mockAddress);
    }

    const currentIndex = diff % activeHolders.length;
    const currentChief = activeHolders[currentIndex];

    // Calculate tomorrow at midnight for the next rotation mock
    const nextRotation = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return NextResponse.json({
        chiefArbitrator: currentChief,
        rotationsCompleted: diff,
        nextRotation: nextRotation.toISOString(),
        totalKeepers: activeHolders.length
    });
}
