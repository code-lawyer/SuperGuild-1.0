'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';

export interface Service {
    id: string;
    channel: number;       // 1=基础设施, 2=核心服务, 3=协同共创
    category: string;
    title: string;
    description?: string;
    price: number;
    currency: string;      // 'USDC'
    icon?: string;
    sort_order: number;
    parent_id?: string | null;
    unlock_type: 'CATEGORY' | 'ITEM';
    payload_config: {
        type?: 'markdown' | 'download' | 'calendly' | 'qr_contact' | 'redeem_code';
        url?: string;
        link?: string;
    };
    is_active: boolean;
    created_at: string;
    children?: Service[];
}

export function useServices(channelFilter?: number) {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    // Fetch services, optionally filtered by channel
    const { data: services, isLoading: isServicesLoading, error: servicesError } = useQuery({
        queryKey: ['services', channelFilter],
        queryFn: async () => {
            let query = supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (channelFilter) {
                query = query.eq('channel', channelFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Build parent-child hierarchy
            const all = data as Service[];
            const parents = all.filter(s => !s.parent_id);
            const children = all.filter(s => s.parent_id);
            parents.forEach(p => {
                p.children = children.filter(c => c.parent_id === p.id);
            });
            return parents;
        }
    });

    // Fetch which services the current user has unlocked
    const { data: unlockedIds, isLoading: isAccessLoading } = useQuery({
        queryKey: ['service_access', address],
        queryFn: async () => {
            if (!address) return [];

            const { data, error } = await supabase
                .from('service_access')
                .select('target_id')
                .eq('user_address', address);

            if (error) throw error;
            return data.map(row => row.target_id) as string[];
        },
        enabled: !!address,
    });

    // Mock Purchase Mutation (MVP — real chain payment comes later)
    const unlockMutation = useMutation({
        mutationFn: async (serviceId: string) => {
            if (!address) throw new Error("请先连接钱包");

            // TODO: 后续替换为链上 USDT transfer + 验证
            console.log(`[useServices] MVP 模拟支付：解锁服务 ${serviceId}...`);
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { error } = await supabase
                .from('service_access')
                .insert([{
                    user_address: address,
                    target_id: serviceId,
                    tx_hash: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                }]);

            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service_access', address] });
        }
    });

    return {
        services: services ?? [],
        unlockedIds: unlockedIds ?? [],
        isLoading: isServicesLoading || isAccessLoading,
        error: servicesError,
        unlockService: unlockMutation.mutateAsync,
        isUnlocking: unlockMutation.isPending,
    };
}
