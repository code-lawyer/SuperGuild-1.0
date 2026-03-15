import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount, useSignMessage } from 'wagmi';

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
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();

    return useMutation({
        mutationFn: async (lore: Partial<BadgeLore> & { token_id: number }) => {
            if (!address) throw new Error('Wallet not connected');

            const action = `upsert-badge-lore:${lore.token_id}`;
            const message = `SuperGuild Admin Action\nAction: ${action}\nAddress: ${address}`;
            const signature = await signMessageAsync({ message });

            const res = await fetch('/api/admin/badge-lore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lore, address, signature }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Failed to save badge lore');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['badge_lore'] });
        },
    });
}
