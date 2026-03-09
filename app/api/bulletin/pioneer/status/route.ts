import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

export async function GET(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Missing address' }, { status: 400 });
        }

        const { data: lastPost, error: fetchError } = await supabaseAdmin
            .from('bulletins')
            .select('created_at')
            .eq('author', address)
            .eq('category', 'pioneer')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        if (!lastPost) {
            return NextResponse.json({ canPost: true, daysRemaining: 0 });
        }

        const lastPostDate = new Date(lastPost.created_at);
        const now = new Date();
        const daysSince = (now.getTime() - lastPostDate.getTime()) / (1000 * 3600 * 24);

        if (daysSince >= 7) {
            return NextResponse.json({ canPost: true, daysRemaining: 0 });
        }

        return NextResponse.json({
            canPost: false,
            daysRemaining: Math.ceil(7 - daysSince),
        });
    } catch (error: any) {
        console.error('Pioneer status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
