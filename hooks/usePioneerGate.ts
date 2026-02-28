'use client';

import { useAccount, useReadContract, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const PIONEER_NFT_ADDRESS = '0x46486Aa0aCC327Ac55b6402AdF4A31598987C400';
const PIONEER_TOKEN_ID = BigInt(5);

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

export function usePioneerGate() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    const { data: balance, isLoading } = useReadContract({
        address: PIONEER_NFT_ADDRESS,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: address ? [address, PIONEER_TOKEN_ID] : undefined,
        chainId: sepolia.id,
        query: {
            enabled: !!address && isConnected,
        }
    });

    const isPioneer = (balance !== undefined && balance > BigInt(0));
    const isWrongChain = chainId !== sepolia.id;

    return {
        isPioneer,
        isLoading,
        isConnected,
        isWrongChain,
        address
    };
}
