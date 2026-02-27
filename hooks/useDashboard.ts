'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';

export function useDashboard() {
    const { address } = useAccount();

    // Guild-wide aggregate stats
    const { data: guildStats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['guild-stats'],
        queryFn: async () => {
            const [servicesRes, collabsRes, profilesRes] = await Promise.all([
                supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('collaborations').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
            ]);

            return {
                totalServices: servicesRes.count ?? 0,
                totalCollaborations: collabsRes.count ?? 0,
                totalMembers: profilesRes.count ?? 0,
            };
        },
    });

    // Recent activity for current user
    const { data: recentActivity, isLoading: isActivityLoading } = useQuery({
        queryKey: ['recent-activity', address],
        queryFn: async () => {
            if (!address) return [];

            // Fetch recent collaborations involving this user
            const { data: collabs, error } = await supabase
                .from('collaborations')
                .select('id, title, status, total_budget, created_at')
                .or(`initiator_id.eq.${address},provider_id.eq.${address}`)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return collabs ?? [];
        },
        enabled: !!address,
    });

    // Recent service access for current user
    const { data: recentAccess, isLoading: isAccessLoading } = useQuery({
        queryKey: ['recent-access', address],
        queryFn: async () => {
            if (!address) return [];

            const { data, error } = await supabase
                .from('service_access')
                .select('id, service_id, created_at')
                .eq('wallet_address', address)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!address,
    });

    return {
        guildStats: guildStats ?? { totalServices: 0, totalCollaborations: 0, totalMembers: 0 },
        recentActivity: recentActivity ?? [],
        recentAccess: recentAccess ?? [],
        isLoading: isStatsLoading || isActivityLoading || isAccessLoading,
    };
}
