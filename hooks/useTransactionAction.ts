import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { parseEther } from 'viem';

interface UseTransactionOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    successMessage?: string;
    errorMessage?: string;
}

export function useTransactionAction() {
    const { toast } = useToast();
    const [isPending, setIsPending] = useState(false);
    const { data: hash, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const executeTransaction = async (
        contractRequest: any,
        options: UseTransactionOptions = {}
    ) => {
        setIsPending(true);
        try {
            const txHash = await writeContractAsync(contractRequest);

            if (options.successMessage) {
                toast({
                    title: "Transaction Submitted",
                    description: "Waiting for confirmation...",
                });
            }
            return txHash;
        } catch (error: any) {
            console.error('Transaction error:', error);
            toast({
                title: "Transaction Failed",
                description: options.errorMessage || error?.shortMessage || error?.message || "Unknown error occurred",
                variant: "destructive",
            });
            options.onError?.(error);
            setIsPending(false);
            throw error;
        }
    };

    return {
        executeTransaction,
        hash,
        isPending: isPending || isConfirming,
        isConfirming,
        isConfirmed,
        setIsPending,
    };
}
