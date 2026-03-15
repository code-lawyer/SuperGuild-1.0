'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';
import { useT } from '@/lib/i18n';

export interface Notification {
    id: string;
    user_address: string;
    type: string;
    title: string;
    body: string | null;
    metadata: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

// ── List notifications for the current user ──
export function useMyNotifications() {
    const { address } = useAccount();

    return useQuery({
        queryKey: ['notifications', address],
        queryFn: async () => {
            if (!address) return [];
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_address', address)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data as Notification[];
        },
        enabled: !!address,
        refetchInterval: 60_000, // poll every 15s
    });
}

// ── Unread count ──
export function useUnreadCount() {
    const { address } = useAccount();

    return useQuery({
        queryKey: ['notifications-unread', address],
        queryFn: async () => {
            if (!address) return 0;
            const { count, error } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_address', address)
                .eq('is_read', false);
            if (error) return 0;
            return count ?? 0;
        },
        enabled: !!address,
        refetchInterval: 60_000,
    });
}

// ── Mark notification as read ──
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    const { address } = useAccount();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', address] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread', address] });
        },
    });
}

// ── Mark all as read ──
export function useMarkAllRead() {
    const queryClient = useQueryClient();
    const { address } = useAccount();

    return useMutation({
        mutationFn: async () => {
            if (!address) return;
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_address', address)
                .eq('is_read', false);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', address] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread', address] });
        },
    });
}

// ── Delete a notification (only allowed for own read notifications) ──
export function useDeleteNotification() {
    const queryClient = useQueryClient();
    const { address } = useAccount();
    const t = useT();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            if (!address) throw new Error(t.errors.connectWallet);
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_address', address);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', address] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread', address] });
        },
    });
}

// ── Helper: create a notification via server-side API (service_role only) ──
// Direct client INSERT is disabled (RLS policy removed for security).
export async function createNotification(input: {
    user_address: string;
    type: string;
    title: string;
    body?: string;
    metadata?: Record<string, any>;
}) {
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('superguild_auth_token')
        : null;

    await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            user_address: input.user_address,
            type: input.type,
            title: input.title,
            body: input.body,
            metadata: input.metadata,
        }),
    });
    // Silently ignore failures — notifications are best-effort
}
