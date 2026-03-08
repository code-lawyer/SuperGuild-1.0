import { keccak256, encodeAbiParameters, parseAbiParameters, SignableMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/utils/rate-limit';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_ADDRESS_PRIVATE_KEY as `0x${string}`;
const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(req: NextRequest) {
  const limited = limiter.check(req);
  if (limited) return limited;

  try {
    const { nickname, avatar, socialAccount, subject } = await req.json();

    if (!nickname || !avatar || !socialAccount || !subject) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify private key format
    if (!SIGNER_PRIVATE_KEY || !SIGNER_PRIVATE_KEY.startsWith('0x') || SIGNER_PRIVATE_KEY.length !== 66) {
      throw new Error('Invalid SIGNER_PRIVATE_KEY format');
    }

    // Include timestamp to prevent signature replay (5-min validity window)
    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    // Construct message with timestamp for replay protection
    const message = encodeAbiParameters(
      parseAbiParameters('string, string, string, address, uint256'),
      [nickname, avatar, socialAccount, subject as `0x${string}`, timestamp]
    );

    // Calculate message hash
    const messageHash = keccak256(message);

    // Create account
    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

    // Sign the message
    const signature = await account.signMessage({
      message: { raw: messageHash } as SignableMessage
    });

    return NextResponse.json({
      signature,
      nickname,
      avatar,
      socialAccount,
      timestamp: Number(timestamp),
    });
  } catch (error) {
    console.error('Error in profile signing:', error);
    return NextResponse.json(
      { error: 'Failed to sign message' },
      { status: 500 }
    );
  }
}