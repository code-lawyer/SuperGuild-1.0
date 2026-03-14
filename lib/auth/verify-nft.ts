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

const alchemySubdomain: Record<number, string> = {
    11155111: 'eth-sepolia',
    1: 'eth-mainnet',
};

/**
 * Alchemy REST API fallback for server-side NFT verification.
 * Used when direct RPC call fails (Sepolia is unreliable).
 */
async function hasPrivilegeNFTAlchemy(
    address: `0x${string}`,
    tokenId: bigint,
): Promise<boolean> {
    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_ID;
    const subdomain = alchemySubdomain[PRIVILEGE_CHAIN_ID];
    if (!alchemyKey || !subdomain) return false;

    const url = `https://${subdomain}.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner`
        + `?owner=${address}`
        + `&contractAddresses[]=${PRIVILEGE_NFT.address}`
        + `&withMetadata=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return false;
        const data = await res.json();
        const tid = tokenId.toString();
        return data.ownedNfts?.some((nft: { tokenId: string }) => nft.tokenId === tid) ?? false;
    } catch {
        clearTimeout(timeout);
        return false;
    }
}

/**
 * Server-side check: does `address` own at least 1 of Privilege NFT `tokenId`?
 *
 * Dual-source: primary RPC → fallback Alchemy REST API.
 * Fail-closed: both fail → false (never grants access on error).
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
        console.warn(`[verify-nft] RPC check failed for ${address}, token ${tokenId}, trying Alchemy fallback:`, e);
        return hasPrivilegeNFTAlchemy(address, tokenId);
    }
}
