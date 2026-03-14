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

// filter:
//   'pioneer'       → only pioneer beacons
//   'guild'         → all except pioneer (admin-published)
//   'general' | 'update' | 'event' → exact category match
//   undefined | 'all' → no filter
export function useBulletins(filter?: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['bulletins', filter],
        queryFn: async () => {
            let query = supabase
                .from('bulletins')
                .select(`
                    *,
                    bulletin_attachments (*)
                `)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (filter === 'guild') {
                query = query.neq('category', 'pioneer');
            } else if (filter && filter !== 'all') {
                query = query.eq('category', filter);
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
