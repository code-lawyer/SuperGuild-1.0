'use client';

import React from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';

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

    const { data: balance, isLoading } = useReadContract({
        address: contractAddress,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: address ? [address, tokenId] : undefined,
        chainId: sepolia.id,
        query: {
            enabled: !!address && isConnected,
        }
    });

    const hasNFT = isMounted && (balance !== undefined && balance > BigInt(0));
    // 跨链查询已通过 chainId: sepolia.id 强制读取，用户不需要切换网络
    const isWrongChain = false;

    return {
        hasNFT,
        isLoading: !isMounted || isLoading,
        isConnected: isMounted && isConnected,
        isWrongChain,
        address: isMounted ? address : undefined
    };
}
