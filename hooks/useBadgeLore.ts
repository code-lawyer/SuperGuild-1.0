import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';

export interface BadgeLore {
    token_id: number;
    name_zh: string;
    name_en: string;
    origin_zh: string;
    origin_en: string;
    symbolism_zh: string;
    symbolism_en: string;
    lore_zh: string;
    lore_en: string;
    updated_at: string;
}

export function useBadgeLore() {
    return useQuery({
        queryKey: ['badge_lore'],
        queryFn: async (): Promise<BadgeLore[]> => {
            const { data, error } = await supabase
                .from('badge_lore')
                .select('*')
                .order('token_id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateBadgeLore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (lore: Partial<BadgeLore> & { token_id: number }) => {
            const { error } = await supabase
                .from('badge_lore')
                .upsert({ ...lore, updated_at: new Date().toISOString() }, { onConflict: 'token_id' });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['badge_lore'] });
        },
    });
}
