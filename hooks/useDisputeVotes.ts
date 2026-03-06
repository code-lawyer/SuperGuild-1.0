'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract } from 'wagmi';
import { supabase } from '@/utils/supabase/client';
import { useCollaborationDetail, Collaboration, Milestone } from './useCollaborations';
import { toCollabId } from './useGuildEscrow';
import { GUILD_ESCROW } from '@/constants/nft-config';
import GuildEscrowABI from '@/constants/GuildEscrow.json';

// ── Fetch all DISPUTED collaborations ──

export interface DisputedCollab {
    collaboration: Collaboration;
    milestones: Milestone[];
    disputedMilestone: Milestone | null;
}

export function useDisputedCollabs() {
    return useQuery({
        queryKey: ['collaborations', 'disputed'],
        queryFn: async () => {
            const { data: collabs, error } = await supabase
                .from('collaborations')
                .select('*')
                .eq('status', 'DISPUTED')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            if (!collabs || collabs.length === 0) return [];

            // For each disputed collab, fetch its milestones
            const results: DisputedCollab[] = [];
            for (const collab of collabs) {
                const { data: milestones } = await supabase
                    .from('milestones')
                    .select('*')
                    .eq('collab_id', collab.id)
                    .order('sort_order', { ascending: true });

                const ms = (milestones ?? []) as Milestone[];
                // The disputed milestone is the one with SUBMITTED status (dispute happens after submission)
                const disputedMs = ms.find(m => m.status === 'SUBMITTED') ?? null;

                results.push({
                    collaboration: collab as Collaboration,
                    milestones: ms,
                    disputedMilestone: disputedMs,
                });
            }

            return results;
        },
        refetchInterval: 30000, // poll every 30s
    });
}

// ── Read on-chain milestone data ──

export function useOnChainMilestone(collabUUID: string | undefined, milestoneIdx: number | undefined) {
    const collabId = collabUUID ? toCollabId(collabUUID) : undefined;
    const enabled = !!collabId && milestoneIdx !== undefined;

    return useReadContract({
        address: GUILD_ESCROW.address,
        abi: GuildEscrowABI,
        functionName: 'getMilestone',
        args: enabled ? [collabId, BigInt(milestoneIdx)] : undefined,
        chainId: GUILD_ESCROW.chainId,
        query: { enabled },
    });
}

// ── Dispute vote types ──

export interface DisputeVote {
    id: string;
    collab_id: string;
    milestone_id: string;
    voter_address: string;
    worker_won: boolean;
    reason: string | null;
    created_at: string;
}

// ── Fetch votes for a milestone ──

export function useDisputeVotesForMilestone(milestoneId: string | undefined) {
    return useQuery({
        queryKey: ['dispute_votes', milestoneId],
        queryFn: async () => {
            if (!milestoneId) return [];
            const { data, error } = await supabase
                .from('dispute_votes')
                .select('*')
                .eq('milestone_id', milestoneId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return (data ?? []) as DisputeVote[];
        },
        enabled: !!milestoneId,
    });
}

// ── Cast a vote ──

export function useCastDisputeVote() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            collabId,
            milestoneId,
            workerWon,
            reason,
        }: {
            collabId: string;
            milestoneId: string;
            workerWon: boolean;
            reason?: string;
        }) => {
            if (!address) throw new Error('Wallet not connected');

            const { error } = await supabase
                .from('dispute_votes')
                .upsert({
                    collab_id: collabId,
                    milestone_id: milestoneId,
                    voter_address: address,
                    worker_won: workerWon,
                    reason: reason || null,
                }, { onConflict: 'milestone_id,voter_address' });

            if (error) throw error;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['dispute_votes', vars.milestoneId] });
        },
    });
}
