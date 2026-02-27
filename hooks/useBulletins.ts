'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';

export interface BulletinAttachment {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
    mime_type: string | null;
}

export interface Bulletin {
    id: string;
    title: string;
    content: string;
    category: string;
    is_pinned: boolean;
    author: string;
    created_at: string;
    updated_at: string;
    bulletin_attachments?: BulletinAttachment[];
}

export function useBulletins(category?: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['bulletins', category],
        queryFn: async () => {
            let query = supabase
                .from('bulletins')
                .select(`
                    *,
                    bulletin_attachments (*)
                `)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Bulletin[];
        },
    });

    return {
        bulletins: data ?? [],
        isLoading,
        error,
    };
}
