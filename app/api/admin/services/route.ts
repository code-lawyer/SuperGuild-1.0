import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/auth/verify-admin';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/**
 * POST /api/admin/services — Create or update a service
 * DELETE /api/admin/services — Delete a service (with cascade)
 *
 * Requires: EIP-191 signature + Token #3 (First Flame) NFT
 */
export async function POST(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;

    try {
        const body = await req.json();
        const { id, address, signature, ...fields } = body;

        const action = id ? `update-service:${id}` : 'create-service';
        const auth = await verifyAdmin({ address, signature, action });
        if ('error' in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        if (!fields.title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const payload = {
            title: fields.title.trim(),
            description: fields.description || '',
            price: fields.price ?? 0,
            channel: fields.channel ?? 1,
            category: fields.category || '',
            icon: fields.icon || 'hub',
            is_active: fields.is_active ?? true,
            currency: 'USDC',
            unlock_type: 'ITEM',
            sort_order: fields.sort_order ?? 0,
            documents: fields.documents || [],
            price_usdc: fields.price_usdc ?? null,
            expert_avatar_url: fields.expert_avatar_url || null,
            expert_tags: fields.expert_tags || null,
            parent_id: fields.parent_id || null,
        };

        if (id) {
            const { error } = await supabaseAdmin
                .from('services')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, action: 'updated' });
        } else {
            const { data, error } = await supabaseAdmin
                .from('services')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, action: 'created', service: data });
        }
    } catch (error: any) {
        console.error('[admin/services] Error:', error);
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
            return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
        }

        const auth = await verifyAdmin({ address, signature, action: `delete-service:${id}` });
        if ('error' in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        // Cascade: delete child items first
        await supabaseAdmin.from('services').delete().eq('parent_id', id);
        const { error } = await supabaseAdmin.from('services').delete().eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[admin/services] Delete error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
