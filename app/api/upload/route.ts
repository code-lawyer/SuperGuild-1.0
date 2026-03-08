import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 15 });

export async function POST(req: NextRequest) {
  const limited = limiter.check(req);
  if (limited) return limited;

  try {
    const formData = await req.formData();

    // Validate file size and type
    const file = formData.get('smfile') as File | null;
    if (file) {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 415 });
      }
    }

    const response = await fetch("https://sm.ms/api/v2/upload", {
      method: "POST",
      headers: {
        'Authorization': process.env.SMMS_TOKEN || '',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}