import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

const { address: CONTRACT, chainId, tokens } = PRIVILEGE_NFT;

const erc1155Abi = [
    {
        type: 'function',
        name: 'balanceOfBatch',
        inputs: [
            { name: 'accounts', type: 'address[]' },
            { name: 'ids', type: 'uint256[]' },
        ],
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
    },
] as const;

const TOKEN_LIST = Object.values(tokens).sort((a, b) =>
    Number(a.id) - Number(b.id)
);

/**
 * Batch-query all Privilege NFT balances with dual-source fallback.
 *
 * Primary:  wagmi RPC balanceOfBatch (staleTime 5 min)
 * Fallback: /api/nft/verify (Alchemy NFT REST API)
 */
export function usePrivilegeNFTs() {
    const { address } = useAccount();
    const [fallbackBalances, setFallbackBalances] = useState<number[] | null>(null);
    const [fallbackLoading, setFallbackLoading] = useState(false);
    const fallbackAttempted = useRef(false);

    // ── Primary: wagmi RPC ──────────────────────────────────────────────────
    const { data, isLoading, isError, refetch } = useReadContracts({
        contracts: address && CONTRACT ? [
            {
                address: CONTRACT,
                abi: erc1155Abi,
                functionName: 'balanceOfBatch',
                chainId,
                args: [
                    TOKEN_LIST.map(() => address),
                    TOKEN_LIST.map(t => t.id),
                ],
            }
        ] : [],
        query: {
            staleTime: 5 * 60_000,
            gcTime: 30 * 60_000,
            retry: 2,
            retryDelay: 1000,
        },
    });

    const rpcBalances = data?.[0]?.result as readonly bigint[] | undefined;
    // Contract call failed at the call level (status='failure') even though
    // the RPC request itself succeeded — isError stays false in this case,
    // so we check explicitly for a completed query with no usable result.
    const rpcCallFailed = !isLoading && data !== undefined && data.length > 0
        && (data[0]?.status === 'failure' || rpcBalances === undefined);

    // ── Fallback: Alchemy NFT REST API ──────────────────────────────────────
    useEffect(() => {
        const primaryFailed = isError || rpcCallFailed;
        if (!address || !primaryFailed || fallbackAttempted.current || fallbackLoading) return;
        fallbackAttempted.current = true;
        setFallbackLoading(true);

        fetch(`/api/nft/verify?address=${address}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.balances) {
                    const bals = TOKEN_LIST.map(t => {
                        const tid = t.id.toString();
                        return Number(data.balances[tid] ?? 0);
                    });
                    setFallbackBalances(bals);
                }
            })
            .catch(() => { /* fail-closed */ })
            .finally(() => setFallbackLoading(false));
    }, [address, isError, fallbackLoading]);

    // Reset fallback when address changes
    useEffect(() => {
        fallbackAttempted.current = false;
        setFallbackBalances(null);
    }, [address]);

    // ── Combined result ─────────────────────────────────────────────────────
    const balanceNums = rpcBalances
        ? TOKEN_LIST.map((_, i) => Number(rpcBalances[i] ?? BigInt(0)))
        : fallbackBalances
            ? fallbackBalances
            : TOKEN_LIST.map(() => 0);

    const [hasPioneer, hasLantern, hasFlame, hasJustice, hasBeacon] =
        balanceNums.map(b => b > 0);

    const handleRefetch = useCallback(() => {
        fallbackAttempted.current = false;
        setFallbackBalances(null);
        return refetch();
    }, [refetch]);

    const anyPrimaryFailed = isError || rpcCallFailed;

    return {
        hasPioneer,
        hasLantern,
        hasFlame,
        hasJustice,
        hasBeacon,
        balances: balanceNums,
        isLoading: isLoading || (anyPrimaryFailed && fallbackLoading),
        isError: anyPrimaryFailed && !fallbackLoading && fallbackBalances === null,
        refetch: handleRefetch,
    };
}
