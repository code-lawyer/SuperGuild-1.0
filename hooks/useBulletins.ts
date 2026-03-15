'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
}

export function useCreateSquadSignal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateSquadSignalInput) => {
            // 1. Fetch parent collab info
            const { data: parent } = await supabase
                .from('collaborations')
                .select('initiator_id, grade, category, payment_mode, deadline, reference_links, reward_token')
                .eq('id', input.parentCollabId)
                .single();

            if (!parent) throw new Error('Parent collab not found');

            // 2. Create one child collab per role
            const rolesWithCollabs = await Promise.all(
                input.roles.map(async (role) => {
                    const { data: childCollab, error } = await supabase
                        .from('collaborations')
                        .insert({
                            initiator_id: parent.initiator_id,
                            title: `[组队岗位] ${role.title} — ${input.parentCollabTitle}`,
                            description: `来源于组队信号。岗位：${role.title}`,
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

            // 3. Create squad_signal bulletin
            const { data: bulletin, error: bulletinErr } = await supabase
                .from('bulletins')
                .insert({
                    title: `组队招募：${input.parentCollabTitle}`,
                    content: input.description,
                    category: 'squad_signal',
                    is_pinned: false,
                    squad_signal_meta: {
                        parent_collab_id: input.parentCollabId,
                        parent_collab_title: input.parentCollabTitle,
                        roles: rolesWithCollabs,
                    },
                })
                .select('id')
                .single();

            if (bulletinErr) throw bulletinErr;
            return bulletin;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bulletins'] });
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
        },
    });
}
