import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/auth/verify-admin';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/**
 * POST /api/admin/bulletins — Create or update a bulletin
 * DELETE /api/admin/bulletins — Delete a bulletin
 *
 * Requires: EIP-191 signature + Token #3 (First Flame) NFT
 */
export async function POST(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;

    try {
        const body = await req.json();
        const { id, title, content, category, is_pinned, address, signature } = body;

        const action = id ? `update-bulletin:${id}` : 'create-bulletin';
        const auth = await verifyAdmin({ address, signature, action });
        if ('error' in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const payload = {
            title: title.trim(),
            content: content.trim(),
            category: category || '公告',
            is_pinned: !!is_pinned,
        };

        if (id) {
            // Update
            const { error } = await supabaseAdmin
                .from('bulletins')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, action: 'updated' });
        } else {
            // Create
            const { data, error } = await supabaseAdmin
                .from('bulletins')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, action: 'created', bulletin: data });
        }
    } catch (error: any) {
        console.error('[admin/bulletins] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;

    try {
        const body = await req.json();
        const { id, address, signature } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing bulletin id' }, { status: 400 });
        }

        const auth = await verifyAdmin({ address, signature, action: `delete-bulletin:${id}` });
        if ('error' in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { error } = await supabaseAdmin
            .from('bulletins')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[admin/bulletins] Delete error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
