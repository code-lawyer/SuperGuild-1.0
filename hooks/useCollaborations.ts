'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { useAccount } from 'wagmi';
import { useAuth } from '@/providers/AuthProvider';
import { createNotification } from './useNotifications';

export type CollabStatus = 'OPEN' | 'PENDING_APPROVAL' | 'LOCKED' | 'ACTIVE' | 'PENDING' | 'SETTLED' | 'DISPUTED' | 'CANCELLED';
export type MilestoneStatus = 'INCOMPLETE' | 'SUBMITTED' | 'CONFIRMED';

export interface Collaboration {
    id: string;
    initiator_id: string;
    provider_id: string | null;
    pending_provider_id: string | null;
    title: string;
    description: string | null;
    reference_links: { label?: string; url: string }[];
    deadline: string | null;
    delivery_standard: string | null;
    total_budget: number;
    reward_token: string;
    grade: string;
    secret_content: string | null;
    status: CollabStatus;
    payment_mode: 'self_managed' | 'guild_managed';
    escrow_address: string | null;
    created_at: string;
    updated_at: string;
}

export interface Milestone {
    id: string;
    collab_id: string;
    sort_order: number;
    amount_percentage: number;
    status: MilestoneStatus;
    title: string | null;
}

export interface Proof {
    id: string;
    milestone_id: string;
    submitter_id: string;
    content_url: string;
    content_hash: string;
    submitted_at: string;
}

// ── List collaborations for current user ──
export function useMyCollaborations() {
    const { address } = useAccount();

    return useQuery({
        queryKey: ['collaborations', address],
        queryFn: async () => {
            if (!address) return [];
            // Validate address format before interpolating into query string
            if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return [];
            // Query with both checksummed and lowercase addresses for robustness
            const addrLower = address.toLowerCase();
            const { data, error } = await supabase
                .from('collaborations')
                .select('*')
                .or(`initiator_id.eq.${address},initiator_id.eq.${addrLower},provider_id.eq.${address},provider_id.eq.${addrLower},pending_provider_id.eq.${address},pending_provider_id.eq.${addrLower}`)
                .neq('status', 'CANCELLED')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Collaboration[];
        },
        enabled: !!address,
    });
}

// ── List all open collaborations ──
export function useOpenCollaborations() {
    return useQuery({
        queryKey: ['collaborations', 'open'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('collaborations')
                .select('*')
                .eq('status', 'OPEN')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Collaboration[];
        },
    });
}

// ── Get single collaboration with milestones + proofs ──
export function useCollaborationDetail(id: string) {
    return useQuery({
        queryKey: ['collaboration', id],
        queryFn: async () => {
            const [collabRes, milestonesRes] = await Promise.all([
                supabase.from('collaborations').select('*').eq('id', id).single(),
                supabase.from('milestones').select('*').eq('collab_id', id).order('sort_order', { ascending: true }),
            ]);

            if (collabRes.error) throw collabRes.error;

            const milestoneIds = (milestonesRes.data ?? []).map((m: any) => m.id);
            let proofs: Proof[] = [];
            if (milestoneIds.length > 0) {
                const { data: proofData } = await supabase
                    .from('proofs')
                    .select('*')
                    .in('milestone_id', milestoneIds)
                    .order('submitted_at', { ascending: true });
                proofs = (proofData ?? []) as Proof[];
            }

            return {
                collaboration: collabRes.data as Collaboration,
                milestones: (milestonesRes.data ?? []) as Milestone[],
                proofs,
            };
        },
        enabled: !!id,
    });
}

// ── Create collaboration ──
export interface CreateCollabInput {
    title: string;
    description?: string;
    reference_links?: { label?: string; url: string }[];
    deadline?: string;
    delivery_standard?: string;
    total_budget: number;
    reward_token?: string;
    grade?: string;
    secret_content?: string;
    secret_attachments?: any[];
    payment_mode?: 'self_managed' | 'guild_managed';
    milestones: { title: string; amount_percentage: number }[];
}

export function useCreateCollaboration() {
    const { address } = useAccount();
    const { isAuthenticated, signIn } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateCollabInput) => {
            if (!address) throw new Error('请先连接钱包');

            // Ensure authenticated before writing (RLS requires auth)
            if (!isAuthenticated) {
                const ok = await signIn();
                if (!ok) throw new Error('Authentication required — please sign the message in your wallet');
            }

            const { data: collab, error: collabErr } = await supabase
                .from('collaborations')
                .insert({
                    initiator_id: address,
                    title: input.title,
                    description: input.description || null,
                    reference_links: input.reference_links || [],
                    deadline: input.deadline || null,
                    delivery_standard: input.delivery_standard || null,
                    total_budget: input.total_budget,
                    reward_token: input.reward_token || 'USDC',
                    grade: input.grade || 'E',
                    secret_content: input.secret_content || null,
                    secret_attachments: input.secret_attachments || [],
                    payment_mode: input.payment_mode || 'self_managed',
                    status: 'OPEN',
                })
                .select()
                .single();

            if (collabErr) throw collabErr;

            const milestonesPayload = input.milestones.map((m, i) => ({
                collab_id: collab.id,
                sort_order: i + 1,
                title: m.title,
                amount_percentage: m.amount_percentage,
                status: 'INCOMPLETE',
            }));

            const { error: msErr } = await supabase
                .from('milestones')
                .insert(milestonesPayload);

            if (msErr) throw msErr;
            return collab as Collaboration;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
        },
    });
}

// ── Apply to accept (sets pending_provider_id, status → PENDING_APPROVAL) ──
export function useApplyToAccept() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collabId: string) => {
            if (!address) throw new Error('请先连接钱包');

            // Get collab to find initiator
            const { data: collab } = await supabase
                .from('collaborations')
                .select('initiator_id, title')
                .eq('id', collabId)
                .single();

            const { error } = await supabase
                .from('collaborations')
                .update({ pending_provider_id: address, status: 'PENDING_APPROVAL' })
                .eq('id', collabId)
                .eq('status', 'OPEN');

            if (error) throw error;

            // Notify the initiator
            if (collab) {
                // Get applicant profile for display
                const { data: applicantProfile } = await supabase
                    .from('profiles')
                    .select('username, bio, portfolio')
                    .eq('wallet_address', address)
                    .single();

                await createNotification({
                    user_address: collab.initiator_id.toLowerCase(),
                    type: 'ACCEPT_REQUEST',
                    title: '有人申请承接你的任务',
                    body: `「${collab.title}」收到承接申请`,
                    metadata: {
                        collab_id: collabId,
                        applicant_address: address,
                        applicant_username: applicantProfile?.username,
                        applicant_bio: applicantProfile?.bio,
                        applicant_portfolio: applicantProfile?.portfolio,
                    },
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
        },
    });
}

// ── Approve provider (initiator confirms the pending provider) ──
export function useApproveProvider() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collabId: string) => {
            if (!address) throw new Error('请先连接钱包');

            // Get pending provider and verify caller is initiator
            const { data: collab } = await supabase
                .from('collaborations')
                .select('pending_provider_id, title, initiator_id, payment_mode')
                .eq('id', collabId)
                .single();

            if (!collab?.pending_provider_id) throw new Error('No pending provider');
            if (collab.initiator_id.toLowerCase() !== address.toLowerCase()) {
                throw new Error('Only the initiator can approve providers');
            }

            // Self-managed skips LOCKED (no on-chain escrow), goes straight to ACTIVE
            const nextStatus = collab.payment_mode === 'self_managed' ? 'ACTIVE' : 'LOCKED';

            const { error } = await supabase
                .from('collaborations')
                .update({
                    provider_id: collab.pending_provider_id,
                    pending_provider_id: null,
                    status: nextStatus,
                })
                .eq('id', collabId)
                .eq('status', 'PENDING_APPROVAL');

            if (error) throw error;

            // Notify the provider: accepted + share initiator contact
            const { data: initiatorProfile } = await supabase
                .from('profiles')
                .select('username, contact_email, contact_telegram')
                .eq('wallet_address', collab.initiator_id)
                .single();

            await createNotification({
                user_address: collab.pending_provider_id,
                type: 'ACCEPT_APPROVED',
                title: '你的承接申请已通过！',
                body: `「${collab.title}」的发布人已同意你的承接申请。`,
                metadata: {
                    collab_id: collabId,
                    initiator_contact_email: initiatorProfile?.contact_email,
                    initiator_contact_telegram: initiatorProfile?.contact_telegram,
                    initiator_username: initiatorProfile?.username,
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
        },
    });
}

// ── Reject provider ──
export function useRejectProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collabId: string) => {
            const { data: collab } = await supabase
                .from('collaborations')
                .select('pending_provider_id, title')
                .eq('id', collabId)
                .single();

            const { error } = await supabase
                .from('collaborations')
                .update({ pending_provider_id: null, status: 'OPEN' })
                .eq('id', collabId)
                .eq('status', 'PENDING_APPROVAL');

            if (error) throw error;

            if (collab?.pending_provider_id) {
                await createNotification({
                    user_address: collab.pending_provider_id,
                    type: 'ACCEPT_REJECTED',
                    title: '承接申请未通过',
                    body: `「${collab.title}」的发布人拒绝了你的承接申请。`,
                    metadata: { collab_id: collabId },
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
        },
    });
}

// ── Abandon collaboration (provider gives up) ──
export function useAbandonCollaboration() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collabId: string) => {
            if (!address) throw new Error('请先连接钱包');

            const { data: collab } = await supabase
                .from('collaborations')
                .select('initiator_id, title')
                .eq('id', collabId)
                .single();

            const { error } = await supabase
                .from('collaborations')
                .update({ provider_id: null, status: 'OPEN' })
                .eq('id', collabId)
                .eq('provider_id', address);

            if (error) throw error;

            if (collab) {
                await createNotification({
                    user_address: collab.initiator_id,
                    type: 'PROVIDER_ABANDONED',
                    title: '承接人已放弃任务',
                    body: `「${collab.title}」的承接人放弃了该任务，任务已重新开放。`,
                    metadata: { collab_id: collabId },
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
        },
    });
}

// ── Cancel collaboration (initiator cancels, paid milestones not refunded) ──
export function useCancelCollaboration() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collabId: string) => {
            if (!address) throw new Error('请先连接钱包');

            const { data: collab } = await supabase
                .from('collaborations')
                .select('provider_id, pending_provider_id, title')
                .eq('id', collabId)
                .single();

            const { error } = await supabase
                .from('collaborations')
                .update({ status: 'CANCELLED' })
                .eq('id', collabId)
                .eq('initiator_id', address);

            if (error) throw error;

            // Notify provider if exists
            const notifyAddr = collab?.provider_id || collab?.pending_provider_id;
            if (notifyAddr) {
                await createNotification({
                    user_address: notifyAddr,
                    type: 'TASK_CANCELLED',
                    title: '任务已被发布人撤销',
                    body: `「${collab?.title}」已被发布人撤销。`,
                    metadata: { collab_id: collabId },
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
        },
    });
}

// ── Submit proof for a milestone ──
export function useSubmitProofMutation() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ milestoneId, contentUrl, contentHash }: {
            milestoneId: string;
            contentUrl: string;
            contentHash: string;
        }) => {
            if (!address) throw new Error('请先连接钱包');

            const { error: proofErr } = await supabase
                .from('proofs')
                .insert({
                    milestone_id: milestoneId,
                    submitter_id: address,
                    content_url: contentUrl,
                    content_hash: contentHash,
                });
            if (proofErr) throw proofErr;

            const { error: msErr } = await supabase
                .from('milestones')
                .update({ status: 'SUBMITTED' })
                .eq('id', milestoneId);
            if (msErr) throw msErr;

            // Transition collab to ACTIVE on first proof submission
            const { data: ms } = await supabase
                .from('milestones')
                .select('collab_id')
                .eq('id', milestoneId)
                .single();
            if (ms) {
                await supabase
                    .from('collaborations')
                    .update({ status: 'ACTIVE' })
                    .eq('id', ms.collab_id)
                    .eq('status', 'LOCKED');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
        },
    });
}

// ── Confirm a milestone (initiator only) ──
export function useConfirmMilestone() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ milestoneId, collabId }: { milestoneId: string; collabId: string }) => {
            const { error } = await supabase
                .from('milestones')
                .update({ status: 'CONFIRMED' })
                .eq('id', milestoneId);
            if (error) throw error;

            const { data: remaining } = await supabase
                .from('milestones')
                .select('id')
                .eq('collab_id', collabId)
                .neq('status', 'CONFIRMED');

            if (remaining && remaining.length === 0) {
                await supabase
                    .from('collaborations')
                    .update({ status: 'SETTLED' })
                    .eq('id', collabId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
        },
    });
}

// ── Dispute a collaboration (sets status to DISPUTED) ──
export function useDisputeCollaboration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collabId: string) => {
            const { error } = await supabase
                .from('collaborations')
                .update({ status: 'DISPUTED' })
                .eq('id', collabId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
        },
    });
}

// ── Applicant & Applications Logic ──

export interface CollabApplication {
    id: string;
    collab_id: string;
    applicant_id: string;
    message: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    created_at: string;
    applicant_profile?: {
        username: string | null;
        bio: string | null;
        contact_email: string | null;
        contact_telegram: string | null;
        portfolio: string | null;
        vcp_cache: number;
    };
}

// ── Apply to a collaboration (Adventurer side) ──
export function useApplyToCollab() {
    const { address } = useAccount();
    const { isAuthenticated, signIn } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ collabId, message }: { collabId: string; message: string }) => {
            if (!address) throw new Error('请先连接钱包');

            if (!isAuthenticated) {
                const ok = await signIn();
                if (!ok) throw new Error('Authentication required');
            }

            // Insert into collaboration_applications
            const { error: appErr } = await supabase
                .from('collaboration_applications')
                .insert({
                    collab_id: collabId,
                    applicant_id: address,
                    message: message,
                    status: 'PENDING',
                });

            if (appErr) throw appErr;

            // Get collab for notification
            const { data: collab } = await supabase
                .from('collaborations')
                .select('initiator_id, title')
                .eq('id', collabId)
                .single();

            if (collab) {
                await createNotification({
                    user_address: collab.initiator_id,
                    type: 'ACCEPT_REQUEST',
                    title: '有人申请承接你的任务',
                    body: `「${collab.title}」收到并正在排队申请`,
                    metadata: {
                        collab_id: collabId,
                        applicant_address: address,
                    },
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collab_applications'] });
        },
    });
}

// ── List applications for a quest (Initiator side) ──
export function useCollabApplications(collabId: string) {
    return useQuery({
        queryKey: ['collab_applications', collabId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('collaboration_applications')
                .select(`
                    *,
                    applicant_profile:profiles!collaboration_applications_applicant_id_fkey(username, bio, contact_email, contact_telegram, portfolio, vcp_cache)
                `)
                .eq('collab_id', collabId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as CollabApplication[];
        },
        enabled: !!collabId,
    });
}

// ── Approve an application (Initiator side) ──
export function useApproveApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ collabId, applicationId, applicantId }: { collabId: string; applicationId: string; applicantId: string }) => {
            // Check payment_mode to determine next status
            const { data: collabInfo } = await supabase
                .from('collaborations')
                .select('payment_mode')
                .eq('id', collabId)
                .single();

            // Self-managed skips LOCKED (no on-chain escrow), goes straight to ACTIVE
            const nextStatus = collabInfo?.payment_mode === 'self_managed' ? 'ACTIVE' : 'LOCKED';

            // 1. Update collaboration state
            const { error: collabErr } = await supabase
                .from('collaborations')
                .update({
                    provider_id: applicantId,
                    status: nextStatus,
                })
                .eq('id', collabId);

            if (collabErr) throw collabErr;

            // 2. Update application states (one accepted, others rejected or left as is)
            await supabase
                .from('collaboration_applications')
                .update({ status: 'ACCEPTED' })
                .eq('id', applicationId);

            await supabase
                .from('collaboration_applications')
                .update({ status: 'REJECTED' })
                .eq('collab_id', collabId)
                .neq('id', applicationId);

            // 3. Notify the approved provider
            const { data: collab } = await supabase.from('collaborations').select('title').eq('id', collabId).single();
            if (collab) {
                await createNotification({
                    user_address: applicantId,
                    type: 'ACCEPT_APPROVED',
                    title: '你的承接申请已通过！',
                    body: `「${collab.title}」的发布人已选择你作为合作伙伴。`,
                    metadata: { collab_id: collabId },
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
            queryClient.invalidateQueries({ queryKey: ['collab_applications'] });
        },
    });
}

// ── Reject an application (Initiator side) ──
export function useRejectApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ collabId, applicationId, applicantId }: { collabId: string; applicationId: string; applicantId: string }) => {
            const { error } = await supabase
                .from('collaboration_applications')
                .update({ status: 'REJECTED' })
                .eq('id', applicationId);

            if (error) throw error;

            // Notify the rejected applicant
            const { data: collab } = await supabase.from('collaborations').select('title').eq('id', collabId).single();
            if (collab) {
                await createNotification({
                    user_address: applicantId.toLowerCase(),
                    type: 'ACCEPT_REJECTED',
                    title: '你的承接申请未通过',
                    body: `「${collab.title}」的发布人已拒绝你的申请。`,
                    metadata: { collab_id: collabId },
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collab_applications'] });
        },
    });
}

// ── Keep legacy export for backward compat ──
export const useAcceptCollaboration = useApplyToAccept;
