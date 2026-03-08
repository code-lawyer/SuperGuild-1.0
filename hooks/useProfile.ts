'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';

// TODO: contact_email and contact_telegram are stored in plaintext.
// Before mainnet, encrypt at-rest or move to a separate encrypted table.
export interface Profile {
    wallet_address: string;
    username: string | null;
    bio: string | null;
    contact_email: string | null;
    contact_telegram: string | null;
    portfolio: string | null;
    profile_completed: boolean;
    vcp_cache: number;
    created_at: string;
}

export interface Medal {
    id: string;
    user_address: string;
    medal_type: 'PIONEER' | 'LANTERN' | 'FLAME';
    token_id: string;
    minted_at: string;
}

// ── Get current user's profile ──
export function useMyProfile() {
    const { address } = useAccount();

    return useQuery({
        queryKey: ['profile', address],
        queryFn: async () => {
            if (!address) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('wallet_address', address)
                .single();

            if (error && error.code === 'PGRST116') {
                return {
                    wallet_address: address,
                    username: null,
                    bio: null,
                    contact_email: null,
                    contact_telegram: null,
                    portfolio: null,
                    profile_completed: false,
                    vcp_cache: 0,
                    created_at: new Date().toISOString(),
                } as Profile;
            }

            if (error) throw error;
            return data as Profile;
        },
        enabled: !!address,
    });
}

// ── Get profile by wallet address (for display names) ──
export function useProfileByAddress(addr: string | null | undefined) {
    return useQuery({
        queryKey: ['profile', addr],
        queryFn: async () => {
            if (!addr) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('wallet_address, username, bio, portfolio, profile_completed')
                .eq('wallet_address', addr)
                .single();

            if (error) return null;
            return data as Pick<Profile, 'wallet_address' | 'username' | 'bio' | 'portfolio' | 'profile_completed'>;
        },
        enabled: !!addr,
    });
}

// ── Get multiple profiles at once (batch) ──
export function useProfilesByAddresses(addresses: string[]) {
    const uniqueAddrs = [...new Set(addresses.filter(Boolean))];
    return useQuery({
        queryKey: ['profiles-batch', uniqueAddrs.sort().join(',')],
        queryFn: async () => {
            if (!uniqueAddrs.length) return {};
            const { data, error } = await supabase
                .from('profiles')
                .select('wallet_address, username, bio, portfolio')
                .in('wallet_address', uniqueAddrs);
            if (error) return {};
            const map: Record<string, { username: string | null; bio: string | null; portfolio: string | null }> = {};
            (data ?? []).forEach((p: any) => { map[p.wallet_address] = p; });
            return map;
        },
        enabled: uniqueAddrs.length > 0,
    });
}

// ── Get user medals ──
export function useUserMedals() {
    const { address } = useAccount();

    return useQuery({
        queryKey: ['medals', address],
        queryFn: async () => {
            if (!address) return [];
            const { data, error } = await supabase
                .from('user_medals')
                .select('*')
                .eq('user_address', address);
            if (error) throw error;
            return data as Medal[];
        },
        enabled: !!address,
    });
}

// ── Update profile (all fields) ──
export function useUpdateMyProfile() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            username: string;
            bio?: string;
            contact_email?: string;
            contact_telegram?: string;
            portfolio?: string;
        }) => {
            if (!address) throw new Error('请先连接钱包');

            // Must have username and at least one contact method
            if (!input.username?.trim()) throw new Error('代号为必填项');
            if (!input.contact_email?.trim() && !input.contact_telegram?.trim()) {
                throw new Error('请至少填写一种联系方式（Email 或 Telegram）');
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    wallet_address: address,
                    username: input.username.trim(),
                    bio: input.bio?.trim() || null,
                    contact_email: input.contact_email?.trim() || null,
                    contact_telegram: input.contact_telegram?.trim() || null,
                    portfolio: input.portfolio?.trim() || null,
                    profile_completed: true,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', address] });
        },
    });
}

// ── Profile collaboration stats ──
export function useProfileStats() {
    const { address } = useAccount();

    return useQuery({
        queryKey: ['profile-stats', address],
        queryFn: async () => {
            if (!address) return { completed: 0, totalEarned: 0, totalSpent: 0 };

            const { count: completed } = await supabase
                .from('collaborations')
                .select('id', { count: 'exact', head: true })
                .eq('provider_id', address)
                .eq('status', 'SETTLED');

            const { data: earned } = await supabase
                .from('collaborations')
                .select('total_budget')
                .eq('provider_id', address)
                .eq('status', 'SETTLED');

            const { data: spent } = await supabase
                .from('collaborations')
                .select('total_budget')
                .eq('initiator_id', address)
                .eq('status', 'SETTLED');

            const totalEarned = (earned ?? []).reduce((sum, c) => sum + Number(c.total_budget), 0);
            const totalSpent = (spent ?? []).reduce((sum, c) => sum + Number(c.total_budget), 0);

            return { completed: completed ?? 0, totalEarned, totalSpent };
        },
        enabled: !!address,
    });
}

// ── Helper: display name for an address ──
export function displayName(profile: { username?: string | null } | null | undefined, address?: string | null): string {
    if (profile?.username) return profile.username;
    if (address) return `${address.slice(0, 6)}…${address.slice(-4)}`;
    return 'Anonymous';
}
