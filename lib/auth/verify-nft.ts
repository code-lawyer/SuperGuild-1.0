import { createPublicClient, http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { PRIVILEGE_CHAIN_ID } from '@/constants/chain-config';

const ERC1155_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'account', type: 'address' },
            { internalType: 'uint256', name: 'id', type: 'uint256' },
        ],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const chain = PRIVILEGE_CHAIN_ID === 1 ? mainnet : sepolia;
const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
});

/**
 * Server-side check: does `address` own at least 1 of Privilege NFT `tokenId`?
 *
 * Returns true/false. On RPC error, returns false (fail-closed).
 */
export async function hasPrivilegeNFT(
    address: `0x${string}`,
    tokenId: bigint,
): Promise<boolean> {
    try {
        const balance = await publicClient.readContract({
            address: PRIVILEGE_NFT.address,
            abi: ERC1155_ABI,
            functionName: 'balanceOf',
            args: [address, tokenId],
        });
        return balance > 0n;
    } catch (e) {
        console.warn(`[verify-nft] RPC check failed for ${address}, token ${tokenId}:`, e);
        return false; // fail-closed
    }
}
