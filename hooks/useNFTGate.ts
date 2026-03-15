'use client';

import React from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { PRIVILEGE_CHAIN_ID } from '@/constants/chain-config';

/**
 * Dual-source NFT gate with aggressive caching.
 *
 * Primary:  wagmi RPC balanceOf (staleTime 5 min)
 * Fallback: /api/nft/verify (Alchemy NFT REST API — different infra, more reliable)
 *
 * On testnet, Sepolia RPC is unreliable. This dual-source design ensures:
 * - If RPC works → instant response, cached 5 min
 * - If RPC fails → transparent fallback to HTTP API, user sees no error
 * - Security: fail-closed (both fail → hasNFT=false, never grants access on error)
 */

const ERC1155_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'account', type: 'address' },
            { name: 'id', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

export function useNFTGate({
    contractAddress,
    tokenId
}: {
    contractAddress: `0x${string}`,
    tokenId: bigint
}) {
    const { address, isConnected } = useAccount();
    const [isMounted, setIsMounted] = React.useState(false);
    const [fallbackBalance, setFallbackBalance] = React.useState<bigint | null>(null);
    const [fallbackLoading, setFallbackLoading] = React.useState(false);
    const fallbackAttempted = React.useRef(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // ── Primary: wagmi RPC with aggressive caching ──────────────────────────
    const { data: balance, isLoading, isError, refetch } = useReadContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: address ? [address, tokenId] : undefined,
        chainId: PRIVILEGE_CHAIN_ID,
        query: {
            enabled: !!address && isConnected,
            retry: 2,
            retryDelay: 1000,
            staleTime: 5 * 60_000,    // Cache success for 5 min
            gcTime: 30 * 60_000,      // Keep in memory for 30 min
        }
    });

    // Contract call failed at the call level (wagmi isError stays false when
    // the RPC request succeeds but the contract call itself reverts/returns null).
    const rpcCallFailed = !isLoading && balance === undefined && !isError;

    // ── Fallback: Alchemy NFT REST API via server route ─────────────────────
    React.useEffect(() => {
        const primaryFailed = isError || rpcCallFailed;
        if (!isMounted || !address || !primaryFailed || fallbackAttempted.current || fallbackLoading) return;
        fallbackAttempted.current = true;
        setFallbackLoading(true);

        fetch(`/api/nft/verify?address=${address}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.balances) {
                    const tid = tokenId.toString();
                    const bal = data.balances[tid] ?? 0;
                    setFallbackBalance(BigInt(bal));
                }
            })
            .catch(() => { /* fail-closed: fallbackBalance stays null */ })
            .finally(() => setFallbackLoading(false));
    }, [isMounted, address, isError, rpcCallFailed, tokenId, fallbackLoading]);

    // Reset fallback when address changes
    React.useEffect(() => {
        fallbackAttempted.current = false;
        setFallbackBalance(null);
    }, [address]);

    // ── Combined result ─────────────────────────────────────────────────────
    const anyPrimaryFailed = isError || rpcCallFailed;
    const effectiveBalance = balance ?? fallbackBalance;
    const hasNFT = isMounted && effectiveBalance !== undefined && effectiveBalance !== null && effectiveBalance > BigInt(0);
    const stillLoading = !isMounted || isLoading || (anyPrimaryFailed && fallbackLoading);
    const bothFailed = isMounted && anyPrimaryFailed && !fallbackLoading && fallbackBalance === null;

    return {
        hasNFT,
        isLoading: stillLoading,
        isError: bothFailed,
        isConnected: isMounted && isConnected,
        isWrongChain: false,
        address: isMounted ? address : undefined,
        refetch: () => {
            fallbackAttempted.current = false;
            setFallbackBalance(null);
            return refetch();
        },
    };
}
