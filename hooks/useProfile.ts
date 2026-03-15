'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { useT } from '@/lib/i18n';

// contact_email and contact_telegram are encrypted at rest via AES-256-GCM.
// Writes go through /api/profile/update (server-side encryption).
// Reads return encrypted values — only collaboration partners should decrypt via API.
export interface Profile {
    wallet_address: string;
    username: string | null;
    bio: string | null;
    contact_email: string | null;
    contact_telegram: string | null;
    portfolio: string | null;
    profile_completed: boolean;
    vcp_cache: number;
    avatar_url: string | null;
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
                .eq('wallet_address', address.toLowerCase())
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

// ── Get profile by wallet address (for display names + public view) ──
export function useProfileByAddress(addr: string | null | undefined) {
    const addrLower = addr?.toLowerCase();
    return useQuery({
        queryKey: ['profile', addrLower],
        queryFn: async () => {
            if (!addrLower) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('wallet_address, username, bio, portfolio, profile_completed, vcp_cache, avatar_url')
                .eq('wallet_address', addrLower)
                .single();

            if (error) return null;
            return data as Pick<Profile, 'wallet_address' | 'username' | 'bio' | 'portfolio' | 'profile_completed' | 'vcp_cache' | 'avatar_url'>;
        },
        enabled: !!addrLower,
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
    const t = useT();

    return useMutation({
        mutationFn: async (input: {
            username: string;
            bio?: string;
            contact_email?: string;
            contact_telegram?: string;
            portfolio?: string;
            avatar_url?: string;
        }) => {
            if (!address) throw new Error(t.errors.connectWallet);

            if (!input.username?.trim()) throw new Error(t.errors.usernameRequired);

            // PII fields are encrypted server-side in /api/profile/update
            const token = typeof window !== 'undefined'
                ? localStorage.getItem('superguild_auth_token')
                : null;

            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(input),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || t.errors.retryLater);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', address] });
            queryClient.invalidateQueries({ queryKey: ['profile', address?.toLowerCase()] });
            toast({ title: t.profile.profileUpdated });
        },
        onError: (error: Error) => {
            toast({ title: t.errors.retryLater, description: error?.message });
        },
    });
}

// ── Upload avatar to Supabase Storage ──
export function useUploadAvatar() {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const t = useT();

    return useMutation({
        mutationFn: async (file: File) => {
            if (!address) throw new Error(t.errors.connectWallet);
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${address.toLowerCase()}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true, contentType: file.type });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({ wallet_address: address.toLowerCase(), avatar_url: publicUrl }, { onConflict: 'wallet_address' });
            if (updateError) throw updateError;

            return publicUrl;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', address?.toLowerCase()] });
            queryClient.invalidateQueries({ queryKey: ['profile', address] });
            toast({ title: t.profile.avatarUpdated });
        },
        onError: (error: Error) => {
            toast({ title: t.profile.avatarUploadFailed, description: error?.message || t.errors.retryLater });
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

            const earnedList = earned ?? [];
            const totalEarned = earnedList.reduce((sum, c) => sum + Number(c.total_budget), 0);
            const totalSpent = (spent ?? []).reduce((sum, c) => sum + Number(c.total_budget), 0);

            return { completed: earnedList.length, totalEarned, totalSpent };
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
