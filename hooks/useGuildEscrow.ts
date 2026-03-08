'use client';

import { useCallback, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract, useReadContract } from 'wagmi';
import { keccak256, toHex, parseUnits } from 'viem';
import { GUILD_ESCROW, MOCK_USDC } from '@/constants/nft-config';
import GuildEscrowABI from '@/constants/GuildEscrow.json';

// ── Utilities ────────────────────────────────────────────────────────────────

/** Convert Supabase collaboration UUID to on-chain bytes32 identifier */
export function toCollabId(uuid: string): `0x${string}` {
    return keccak256(toHex(uuid));
}

/** Convert milestone percentages + total budget to USDC amounts (6 decimals) */
export function toMilestoneAmounts(
    milestones: { amount_percentage: number }[],
    totalBudget: number,
): bigint[] {
    return milestones.map(m =>
        parseUnits(
            ((totalBudget * m.amount_percentage) / 100).toFixed(6),
            6,
        ),
    );
}

// ── Minimal ERC-20 ABI ───────────────────────────────────────────────────────

const erc20Abi = [
    {
        name: 'approve',
        type: 'function' as const,
        inputs: [
            { name: 'spender', type: 'address' as const },
            { name: 'amount', type: 'uint256' as const },
        ],
        outputs: [{ name: '', type: 'bool' as const }],
        stateMutability: 'nonpayable' as const,
    },
    {
        name: 'balanceOf',
        type: 'function' as const,
        inputs: [{ name: 'account', type: 'address' as const }],
        outputs: [{ name: '', type: 'uint256' as const }],
        stateMutability: 'view' as const,
    },
] as const;

// ── Step tracking for UI ─────────────────────────────────────────────────────

export type EscrowStep =
    | 'idle'
    | 'approving'   // USDC approve tx
    | 'depositing'  // GuildEscrow.deposit tx
    | 'submitting'  // GuildEscrow.submitProof tx
    | 'confirming'  // GuildEscrow.confirmMilestone tx
    | 'disputing'   // GuildEscrow.disputeMilestone tx
    | 'cancelling'  // GuildEscrow.cancel tx
    | 'done'
    | 'error';

// ── Main hook ────────────────────────────────────────────────────────────────

export function useGuildEscrow() {
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const [step, setStep] = useState<EscrowStep>('idle');
    const [error, setError] = useState<string | null>(null);

    const chainId = GUILD_ESCROW.chainId;

    // ── Approve USDC + Deposit (two sequential txs) ──
    // NOTE: These are two separate transactions. If approve succeeds but deposit fails,
    // the USDC allowance remains (harmless — scoped to GuildEscrow contract only).
    // A future improvement could use Permit2 or multicall for atomicity.

    const approveAndDeposit = useCallback(async (
        collabUUID: string,
        worker: `0x${string}`,
        milestones: { amount_percentage: number }[],
        totalBudget: number,
    ) => {
        try {
            setStep('approving');
            setError(null);

            const amounts = toMilestoneAmounts(milestones, totalBudget);
            const total = amounts.reduce((a, b) => a + b, 0n);
            const collabId = toCollabId(collabUUID);

            // Step 1: Approve USDC spending
            const approveHash = await writeContractAsync({
                address: MOCK_USDC.address,
                abi: erc20Abi,
                functionName: 'approve',
                args: [GUILD_ESCROW.address, total],
                chainId,
            });
            await publicClient!.waitForTransactionReceipt({ hash: approveHash, timeout: 60_000 });

            // Step 2: Deposit into escrow
            setStep('depositing');
            const depositHash = await writeContractAsync({
                address: GUILD_ESCROW.address,
                abi: GuildEscrowABI,
                functionName: 'deposit',
                args: [collabId, worker, amounts],
                chainId,
            });
            const receipt = await publicClient!.waitForTransactionReceipt({ hash: depositHash, timeout: 60_000 });

            setStep('done');
            return receipt;
        } catch (err: any) {
            setStep('error');
            setError(err.shortMessage || err.message);
            throw err;
        }
    }, [writeContractAsync, publicClient, chainId]);

    // ── Submit Proof on-chain ──

    const submitProofOnChain = useCallback(async (
        collabUUID: string,
        milestoneIdx: number,
        contentHash: `0x${string}`,
    ) => {
        try {
            setStep('submitting');
            setError(null);

            const hash = await writeContractAsync({
                address: GUILD_ESCROW.address,
                abi: GuildEscrowABI,
                functionName: 'submitProof',
                args: [toCollabId(collabUUID), BigInt(milestoneIdx), contentHash],
                chainId,
            });
            const receipt = await publicClient!.waitForTransactionReceipt({ hash, timeout: 60_000 });

            setStep('done');
            return receipt;
        } catch (err: any) {
            setStep('error');
            setError(err.shortMessage || err.message);
            throw err;
        }
    }, [writeContractAsync, publicClient, chainId]);

    // ── Confirm Milestone on-chain ──

    const confirmMilestoneOnChain = useCallback(async (
        collabUUID: string,
        milestoneIdx: number,
    ) => {
        try {
            setStep('confirming');
            setError(null);

            const hash = await writeContractAsync({
                address: GUILD_ESCROW.address,
                abi: GuildEscrowABI,
                functionName: 'confirmMilestone',
                args: [toCollabId(collabUUID), BigInt(milestoneIdx)],
                chainId,
            });
            const receipt = await publicClient!.waitForTransactionReceipt({ hash, timeout: 60_000 });

            setStep('done');
            return receipt;
        } catch (err: any) {
            setStep('error');
            setError(err.shortMessage || err.message);
            throw err;
        }
    }, [writeContractAsync, publicClient, chainId]);

    // ── Dispute Milestone on-chain ──

    const disputeMilestoneOnChain = useCallback(async (
        collabUUID: string,
        milestoneIdx: number,
    ) => {
        try {
            setStep('disputing');
            setError(null);

            const hash = await writeContractAsync({
                address: GUILD_ESCROW.address,
                abi: GuildEscrowABI,
                functionName: 'disputeMilestone',
                args: [toCollabId(collabUUID), BigInt(milestoneIdx)],
                chainId,
            });
            const receipt = await publicClient!.waitForTransactionReceipt({ hash, timeout: 60_000 });

            setStep('done');
            return receipt;
        } catch (err: any) {
            setStep('error');
            setError(err.shortMessage || err.message);
            throw err;
        }
    }, [writeContractAsync, publicClient, chainId]);

    // ── Cancel Escrow on-chain ──

    const cancelEscrow = useCallback(async (collabUUID: string) => {
        try {
            setStep('cancelling');
            setError(null);

            const hash = await writeContractAsync({
                address: GUILD_ESCROW.address,
                abi: GuildEscrowABI,
                functionName: 'cancel',
                args: [toCollabId(collabUUID)],
                chainId,
            });
            const receipt = await publicClient!.waitForTransactionReceipt({ hash, timeout: 60_000 });

            setStep('done');
            return receipt;
        } catch (err: any) {
            setStep('error');
            setError(err.shortMessage || err.message);
            throw err;
        }
    }, [writeContractAsync, publicClient, chainId]);

    const reset = useCallback(() => {
        setStep('idle');
        setError(null);
    }, []);

    return {
        approveAndDeposit,
        submitProofOnChain,
        confirmMilestoneOnChain,
        disputeMilestoneOnChain,
        cancelEscrow,
        step,
        error,
        reset,
        isPending: !['idle', 'done', 'error'].includes(step),
    };
}

// ── Read: USDC Balance ───────────────────────────────────────────────────────

export function useUSDCBalance() {
    const { address } = useAccount();
    return useReadContract({
        address: MOCK_USDC.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: MOCK_USDC.chainId,
        query: { enabled: !!address },
    });
}

// ── Read: Is All Settled ─────────────────────────────────────────────────────

export function useIsAllSettled(collabUUID: string | undefined) {
    const collabId = collabUUID ? toCollabId(collabUUID) : undefined;
    return useReadContract({
        address: GUILD_ESCROW.address,
        abi: GuildEscrowABI,
        functionName: 'isAllSettled',
        args: collabId ? [collabId] : undefined,
        chainId: GUILD_ESCROW.chainId,
        query: { enabled: !!collabId },
    });
}
