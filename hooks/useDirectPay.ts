'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, keccak256, toBytes } from 'viem';
import { DIRECT_PAY_ADDRESS, DIRECT_PAY_ABI, ERC20_APPROVE_ABI } from '@/constants/direct-pay-config';
import { MOCK_USDC } from '@/constants/nft-config';
import { PRIMARY_CHAIN_ID } from '@/constants/chain-config';

export type DirectPayStep = 'idle' | 'approving' | 'paying' | 'done' | 'error';

/**
 * Hook for self-managed collab payments via DirectPay contract.
 * Flow: check allowance → approve if needed → call pay()
 */
export function useDirectPay() {
    const { address } = useAccount();
    const [step, setStep] = useState<DirectPayStep>('idle');
    const [error, setError] = useState<string | null>(null);

    const { writeContractAsync } = useWriteContract();

    // Check current USDC allowance for DirectPay contract
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: MOCK_USDC.address,
        abi: ERC20_APPROVE_ABI,
        functionName: 'allowance',
        args: address ? [address, DIRECT_PAY_ADDRESS] : undefined,
        chainId: PRIMARY_CHAIN_ID,
        query: { enabled: !!address },
    });

    /**
     * Pay a milestone via DirectPay contract.
     * @param collabId    Supabase collaboration UUID (will be keccak256 hashed to bytes32)
     * @param worker      Worker wallet address
     * @param usdcAmount  Amount in human-readable USDC (e.g. 500 for $500)
     */
    async function payMilestone(collabId: string, worker: `0x${string}`, usdcAmount: number) {
        if (!address) throw new Error('Wallet not connected');
        setError(null);

        const amount = parseUnits(String(usdcAmount), MOCK_USDC.decimals);
        const collabIdBytes32 = keccak256(toBytes(collabId));

        try {
            // Step 1: Approve if allowance is insufficient
            const currentAllowance = allowance ?? BigInt(0);
            if (currentAllowance < amount) {
                setStep('approving');
                await writeContractAsync({
                    address: MOCK_USDC.address,
                    abi: ERC20_APPROVE_ABI,
                    functionName: 'approve',
                    args: [DIRECT_PAY_ADDRESS, amount],
                    chainId: PRIMARY_CHAIN_ID,
                });
                await refetchAllowance();
            }

            // Step 2: Pay via DirectPay contract (atomic: USDC passes through instantly)
            setStep('paying');
            await writeContractAsync({
                address: DIRECT_PAY_ADDRESS,
                abi: DIRECT_PAY_ABI,
                functionName: 'pay',
                args: [collabIdBytes32, worker, amount],
                chainId: PRIMARY_CHAIN_ID,
            });

            setStep('done');
        } catch (e: any) {
            setError(e?.shortMessage ?? e?.message ?? 'Unknown error');
            setStep('error');
        }
    }

    function reset() {
        setStep('idle');
        setError(null);
    }

    return { payMilestone, step, error, reset, isPending: step === 'approving' || step === 'paying' };
}
