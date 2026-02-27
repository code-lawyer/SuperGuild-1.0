'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { supabase } from '@/utils/supabase/client';

export interface SBT {
    id: string;
    name: string;
    description?: string;
    token_id?: string;
    image_url?: string;
    earned_at?: string;
}

/**
 * Fetch SBT medals for the connected user.
 * MVP: reads from supabase sbt_medals table.
 * If the table doesn't exist yet, returns an empty array.
 */
export function useSBTs() {
    const { address } = useAccount();

    return useQuery<SBT[]>({
        queryKey: ['sbts', address],
        queryFn: async () => {
            if (!address) return [];
            try {
                const { data, error } = await supabase
                    .from('sbt_medals')
                    .select('*')
                    .eq('owner_address', address)
                    .order('earned_at', { ascending: false });

                if (error) {
                    // Table might not exist yet in MVP
                    console.warn('[useSBTs] Query failed (table may not exist):', error.message);
                    return [];
                }
                return (data ?? []) as SBT[];
            } catch {
                return [];
            }
        },
        enabled: !!address,
    });
}
