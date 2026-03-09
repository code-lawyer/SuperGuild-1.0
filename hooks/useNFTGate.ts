'use client';

import React from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { PRIVILEGE_CHAIN_ID, IS_MAINNET } from '@/constants/chain-config';

/**
 * Dev/testnet fallback — DISABLED.
 * Previously allowed NEXT_PUBLIC_DEV_MOCK_NFTS=true to bypass all gates.
 * Now each guard has its own fallback logic (e.g. AdminGuard checks wallet address).
 */
const DEV_MOCK_NFTS = false;

// Basic ERC1155 ABI for balanceOf
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
    const chainId = useChainId();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const { data: balance, isLoading, isError, refetch } = useReadContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: address ? [address, tokenId] : undefined,
        chainId: PRIVILEGE_CHAIN_ID,
        query: {
            enabled: !!address && isConnected && !DEV_MOCK_NFTS,
            retry: 3,
            retryDelay: 1500,
        }
    });

    const hasNFT = DEV_MOCK_NFTS
        ? (isMounted && isConnected)
        : (isMounted && balance !== undefined && balance > BigInt(0));
    const isWrongChain = false;

    return {
        hasNFT,
        isLoading: DEV_MOCK_NFTS ? !isMounted : (!isMounted || isLoading),
        isError: DEV_MOCK_NFTS ? false : (isMounted && isError),
        isConnected: isMounted && isConnected,
        isWrongChain,
        address: isMounted ? address : undefined,
        refetch,
    };
}
