'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useReadContract, useReadContracts, useWriteContract, usePublicClient } from 'wagmi';
import { keccak256, toBytes, parseUnits } from 'viem';
import { supabase } from '@/utils/supabase/client';
import { SPARK_GOVERNOR, MOCK_USDC, VCP_TOKEN } from '@/constants/nft-config';
import sparkGovernorAbi from '@/constants/SparkGovernor.json';
import vcpAbi from '@/constants/VCPTokenV2.json';
import { toast } from '@/components/ui/use-toast';

// ── ERC-20 approve ABI (minimal) ──
const erc20ApproveAbi = [
    {
        type: 'function',
        name: 'approve',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'allowance',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
] as const;

// ── 提案状态枚举 ──
export const ProposalStatus = {
    Signaling: 0,
    Active: 1,
    Passed: 2,
    Rejected: 3,
    Canceled: 4,
} as const;

export const StatusLabels: Record<number, string> = {
    0: 'Signaling',
    1: 'Active',
    2: 'Passed',
    3: 'Rejected',
    4: 'Canceled',
};

// ── 类型定义 ──
export interface ProposalData {
    id: string;
    onchain_id: number | null;
    proposer_address: string;
    title: string;
    body: string;
    attachment_urls: string[] | null;
    status: string;
    create_tx_hash: string | null;
    activated_at: string | null;
    created_at: string;
}

export interface CosignerData {
    id: string;
    proposal_id: string;
    cosigner_address: string;
    vcp_amount: number | null;
    tx_hash: string | null;
    created_at: string;
}

// ═══════════════════════════════════════
// 读取合约数据
// ═══════════════════════════════════════

/** 读取治理合约全局状态 */
export function useGovernorStats() {
    // Governor 合约查询（proposalCount + getThreshold）
    const { data: govData, isLoading: govLoading } = useReadContracts({
        contracts: SPARK_GOVERNOR.address ? [
            {
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'proposalCount',
                chainId: SPARK_GOVERNOR.chainId,
            },
            {
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'getThreshold',
                chainId: SPARK_GOVERNOR.chainId,
            },
        ] : [],
    });

    // VCP totalSupply 独立查询（不依赖 Governor 合约是否可用）
    const { data: supplyData, isLoading: supplyLoading } = useReadContract({
        address: VCP_TOKEN.address,
        abi: vcpAbi,
        functionName: 'totalSupply',
        chainId: VCP_TOKEN.chainId,
        query: { enabled: true },
    });

    return {
        proposalCount: govData?.[0]?.status === 'success' ? Number(govData[0].result) : 0,
        threshold: govData?.[1]?.status === 'success' ? Number(govData[1].result) : 0,
        totalSupply: supplyData !== undefined ? Number(supplyData) : 0,
        isLoading: govLoading || supplyLoading,
    };
}

/** 读取单个链上提案 */
export function useProposalOnchain(onchainId: number | null) {
    const { data: proposal, isLoading: isProposalLoading } = useReadContract({
        address: SPARK_GOVERNOR.address,
        abi: sparkGovernorAbi,
        functionName: 'getProposal',
        args: onchainId ? [BigInt(onchainId)] : undefined,
        chainId: SPARK_GOVERNOR.chainId,
        query: { enabled: !!onchainId && !!SPARK_GOVERNOR.address },
    });

    const { data: deadline } = useReadContract({
        address: SPARK_GOVERNOR.address,
        abi: sparkGovernorAbi,
        functionName: 'getVotingDeadline',
        args: onchainId ? [BigInt(onchainId)] : undefined,
        chainId: SPARK_GOVERNOR.chainId,
        query: { enabled: !!onchainId && !!SPARK_GOVERNOR.address },
    });

    const parsed = proposal as any;

    return {
        proposer: parsed?.proposer as string | undefined,
        totalVCPSignaled: parsed?.totalVCPSignaled ? Number(parsed.totalVCPSignaled) : 0,
        votesFor: parsed?.votesFor ? Number(parsed.votesFor) : 0,
        votesAgainst: parsed?.votesAgainst ? Number(parsed.votesAgainst) : 0,
        status: parsed?.status as number | undefined,
        cosignerCount: parsed?.cosignerCount ? Number(parsed.cosignerCount) : 0,
        activatedAt: parsed?.activatedAt ? Number(parsed.activatedAt) : 0,
        votingDeadline: deadline ? Number(deadline) : 0,
        isLoading: isProposalLoading,
    };
}

/** 检查当前用户是否已联署/已投票 */
export function useUserProposalState(onchainId: number | null) {
    const { address } = useAccount();

    const { data } = useReadContracts({
        contracts: (onchainId && address && SPARK_GOVERNOR.address) ? [
            {
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'hasCosigned',
                args: [BigInt(onchainId), address],
                chainId: SPARK_GOVERNOR.chainId,
            },
            {
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'hasVoted',
                args: [BigInt(onchainId), address],
                chainId: SPARK_GOVERNOR.chainId,
            },
        ] : [],
    });

    return {
        hasCosigned: data?.[0]?.result as boolean | undefined ?? false,
        hasVoted: data?.[1]?.result as boolean | undefined ?? false,
    };
}

// ═══════════════════════════════════════
// Supabase 查询
// ═══════════════════════════════════════

/** 获取提案列表 */
export function useProposalsList(status?: string) {
    return useQuery({
        queryKey: ['proposals', status],
        queryFn: async () => {
            let query = supabase
                .from('proposals')
                .select('*')
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data ?? []) as ProposalData[];
        },
    });
}

/** 获取提案的联署人列表 */
export function useProposalCosigners(proposalId: string | undefined) {
    return useQuery({
        queryKey: ['proposal-cosigners', proposalId],
        queryFn: async () => {
            if (!proposalId) return [];
            const { data, error } = await supabase
                .from('proposal_cosigners')
                .select('*')
                .eq('proposal_id', proposalId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return (data ?? []) as CosignerData[];
        },
        enabled: !!proposalId,
    });
}

// ═══════════════════════════════════════
// 写入操作 (合约交互 + Supabase 记录)
// ═══════════════════════════════════════

/** 创建提案 (USDC approve → createProposal → Supabase 记录) */
export function useCreateProposal() {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient({ chainId: SPARK_GOVERNOR.chainId });

    return useMutation({
        mutationFn: async (params: { title: string; body: string; attachmentUrls: string[] }) => {
            if (!address) throw new Error('请先连接钱包');
            if (!SPARK_GOVERNOR.address) throw new Error('SparkGovernor 合约未配置');
            if (!MOCK_USDC.address) throw new Error('USDC 合约未配置');

            // 1. 先存入 Supabase，获取 proposalId
            const { data: dbRecord, error: dbError } = await supabase
                .from('proposals')
                .insert({
                    proposer_address: address.toLowerCase(),
                    title: params.title,
                    body: params.body,
                    attachment_urls: params.attachmentUrls.length > 0 ? params.attachmentUrls : null,
                    status: 'SIGNALING',
                })
                .select('id')
                .single();

            if (dbError || !dbRecord) throw new Error('数据库写入失败');

            const proposalId = dbRecord.id;
            const contentHash = keccak256(toBytes(proposalId));

            // 2. Approve USDC
            toast({ title: '步骤 1/2: 授权 USDC...' });
            await writeContractAsync({
                address: MOCK_USDC.address,
                abi: erc20ApproveAbi,
                functionName: 'approve',
                args: [SPARK_GOVERNOR.address, parseUnits('1', 6)],
                chainId: SPARK_GOVERNOR.chainId,
            });

            // 3. Create proposal on-chain
            toast({ title: '步骤 2/2: 创建提案...' });
            const createTx = await writeContractAsync({
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'createProposal',
                args: [contentHash],
                chainId: SPARK_GOVERNOR.chainId,
            });

            // 4. 等待交易确认，读取链上 proposalCount 作为 onchainId
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash: createTx });
            }
            const onchainId = publicClient ? await publicClient.readContract({
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'proposalCount',
            }) : null;

            // 5. 更新 Supabase 记录（回写 onchain_id + tx_hash）
            await supabase
                .from('proposals')
                .update({
                    create_tx_hash: createTx,
                    onchain_id: onchainId ? Number(onchainId) : null,
                })
                .eq('id', proposalId);

            return { proposalId, txHash: createTx };
        },
        onSuccess: () => {
            toast({ title: '✅ 提案创建成功！' });
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
        },
        onError: (error: any) => {
            toast({ title: '❌ 提案创建失败', description: error?.shortMessage || error?.message });
        },
    });
}

/** 附议联署 */
export function useCosign() {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient({ chainId: SPARK_GOVERNOR.chainId });

    return useMutation({
        mutationFn: async (params: { proposalDbId: string; onchainId: number }) => {
            if (!address) throw new Error('请先连接钱包');
            if (!SPARK_GOVERNOR.address) throw new Error('SparkGovernor 合约未配置');

            // 读取联署人的 VCP 余额
            let vcpAmount = 0;
            if (publicClient) {
                const balance = await publicClient.readContract({
                    address: VCP_TOKEN.address,
                    abi: vcpAbi,
                    functionName: 'balanceOf',
                    args: [address],
                });
                vcpAmount = Number(balance);
            }

            const tx = await writeContractAsync({
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'cosign',
                args: [BigInt(params.onchainId)],
                chainId: SPARK_GOVERNOR.chainId,
            });

            // 记录到 Supabase（含 vcp_amount）
            await supabase.from('proposal_cosigners').insert({
                proposal_id: params.proposalDbId,
                cosigner_address: address.toLowerCase(),
                vcp_amount: vcpAmount,
                tx_hash: tx,
            });

            return { txHash: tx };
        },
        onSuccess: () => {
            toast({ title: '✅ 联署成功！' });
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
            queryClient.invalidateQueries({ queryKey: ['proposal-cosigners'] });
        },
        onError: (error: any) => {
            toast({ title: '❌ 联署失败', description: error?.shortMessage || error?.message });
        },
    });
}

/** 链上投票（自动检查 delegate） */
export function useCastVote() {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient({ chainId: SPARK_GOVERNOR.chainId });

    return useMutation({
        mutationFn: async (params: { proposalDbId: string; onchainId: number; support: boolean }) => {
            if (!address) throw new Error('请先连接钱包');
            if (!SPARK_GOVERNOR.address) throw new Error('SparkGovernor 合约未配置');

            // 检查投票权重，如果为 0 则自动 delegate 给自己
            if (publicClient) {
                const votes = await publicClient.readContract({
                    address: VCP_TOKEN.address,
                    abi: vcpAbi,
                    functionName: 'getVotes',
                    args: [address],
                });
                if (Number(votes) === 0) {
                    toast({ title: '⚡ 首次投票需激活投票权...' });
                    const delegateTx = await writeContractAsync({
                        address: VCP_TOKEN.address,
                        abi: vcpAbi,
                        functionName: 'delegate',
                        args: [address],
                        chainId: VCP_TOKEN.chainId,
                    });
                    await publicClient.waitForTransactionReceipt({ hash: delegateTx });
                }
            }

            toast({ title: '🗳️ 提交投票中...' });
            const tx = await writeContractAsync({
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'castVote',
                args: [BigInt(params.onchainId), params.support],
                chainId: SPARK_GOVERNOR.chainId,
            });

            // 记录到 Supabase
            await supabase.from('proposal_votes').insert({
                proposal_id: params.proposalDbId,
                voter_address: address.toLowerCase(),
                support: params.support,
                weight: 0, // 链上已记录真实权重
                tx_hash: tx,
            });

            return { txHash: tx };
        },
        onSuccess: () => {
            toast({ title: '✅ 投票成功！' });
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
        },
        onError: (error: any) => {
            toast({ title: '❌ 投票失败', description: error?.shortMessage || error?.message });
        },
    });
}

/** 结算提案（同步 Supabase 状态） */
export function useFinalizeProposal() {
    const queryClient = useQueryClient();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient({ chainId: SPARK_GOVERNOR.chainId });

    return useMutation({
        mutationFn: async (params: { proposalDbId: string; onchainId: number }) => {
            if (!SPARK_GOVERNOR.address) throw new Error('SparkGovernor 合约未配置');

            const tx = await writeContractAsync({
                address: SPARK_GOVERNOR.address,
                abi: sparkGovernorAbi,
                functionName: 'finalizeProposal',
                args: [BigInt(params.onchainId)],
                chainId: SPARK_GOVERNOR.chainId,
            });

            // 等待交易确认后，读取链上结果并同步到 Supabase
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash: tx });
                const onchainProposal = await publicClient.readContract({
                    address: SPARK_GOVERNOR.address,
                    abi: sparkGovernorAbi,
                    functionName: 'getProposal',
                    args: [BigInt(params.onchainId)],
                }) as any;

                const finalStatus = Number(onchainProposal.status) === 2 ? 'PASSED' : 'REJECTED';
                await supabase
                    .from('proposals')
                    .update({ status: finalStatus })
                    .eq('id', params.proposalDbId);
            }

            return { txHash: tx };
        },
        onSuccess: () => {
            toast({ title: '✅ 提案已结算！' });
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
        },
        onError: (error: any) => {
            toast({ title: '❌ 结算失败', description: error?.shortMessage || error?.message });
        },
    });
}
