import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyWalletJWT } from '@/lib/auth/verify-jwt';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 15 });

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BUCKET = 'bulletin-images';

/**
 * POST /api/upload
 *
 * Uploads an image to Supabase Storage (bulletin-images bucket).
 * Migrated from sm.ms to eliminate third-party dependency.
 * Requires authenticated JWT.
 */
export async function POST(req: NextRequest) {
    const limited = limiter.check(req);
    if (limited) return limited;

    // Require auth
    const wallet = await verifyWalletJWT(req.headers.get('authorization'));
    if (!wallet) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('smfile') as File | null;
    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, gif, webp' }, { status: 415 });
    }

    // Ensure bucket exists (idempotent)
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true }).catch(() => {
        // Bucket already exists — ignore error
    });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const path = `${wallet.toLowerCase()}/${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadError) {
        console.error('[upload] Storage error:', uploadError);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    // Return sm.ms-compatible response shape so callers don't need updating
    return NextResponse.json({
        success: true,
        code: 'success',
        data: {
            url: publicUrl,
            filename: file.name,
            size: file.size,
            storageProvider: 'supabase',
        },
    });
}
