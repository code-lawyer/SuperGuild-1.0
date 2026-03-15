'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';

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
    squad_signal_meta?: Record<string, any> | null;
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

export interface SquadRole {
    title: string;
    tags: string[];
    budget: number;
    slots: number;
}

export interface CreateSquadSignalInput {
    parentCollabId: string;
    parentCollabTitle: string;
    description: string;
    roles: SquadRole[];
    /** i18n-aware title prefix, e.g. "[Squad Slot]" */
    slotTitlePrefix?: string;
    /** i18n-aware description prefix, e.g. "Sourced from squad signal. Role:" */
    slotDescPrefix?: string;
}

export function useCreateSquadSignal() {
    const queryClient = useQueryClient();
    const { address } = useAccount();

    return useMutation({
        mutationFn: async (input: CreateSquadSignalInput) => {
            if (!address) throw new Error('Wallet not connected');

            // 1. Fetch parent collab info (also used for auth check)
            const { data: parent } = await supabase
                .from('collaborations')
                .select('initiator_id, provider_id, grade, category, payment_mode, deadline, reference_links, reward_token')
                .eq('id', input.parentCollabId)
                .single();

            if (!parent) throw new Error('Parent collab not found');

            // Only the provider of the parent collab can create squad signals
            if (parent.provider_id?.toLowerCase() !== address.toLowerCase()) {
                throw new Error('Only the task provider can create squad signals');
            }

            const titlePrefix = input.slotTitlePrefix ?? '[Squad Slot]';
            const descPrefix = input.slotDescPrefix ?? 'Sourced from squad signal. Role:';

            // 2. Create one child collab per role
            const rolesWithCollabs = await Promise.all(
                input.roles.map(async (role) => {
                    const { data: childCollab, error } = await supabase
                        .from('collaborations')
                        .insert({
                            initiator_id: parent.initiator_id,
                            title: `${titlePrefix} ${role.title} — ${input.parentCollabTitle}`,
                            description: `${descPrefix} ${role.title}`,
                            grade: parent.grade || 'E',
                            category: parent.category || 'other',
                            tags: role.tags,
                            total_budget: role.budget * role.slots,
                            slot_budget: role.budget,
                            max_providers: role.slots,
                            slots_taken: 0,
                            reward_token: parent.reward_token || 'USDC',
                            payment_mode: parent.payment_mode || 'self_managed',
                            deadline: parent.deadline,
                            reference_links: parent.reference_links || [],
                            parent_collab_id: input.parentCollabId,
                            status: 'OPEN',
                        })
                        .select('id')
                        .single();

                    if (error) throw error;
                    return { ...role, child_collab_id: childCollab!.id };
                })
            );

            return rolesWithCollabs;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
        },
    });
}
