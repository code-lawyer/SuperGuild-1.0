import { verifyMessage } from 'viem';
import { hasPrivilegeNFT } from './verify-nft';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { ADMIN_FALLBACK_WALLET } from '@/constants/admin-config';

/**
 * Verify that a request comes from a Token #3 (First Flame) NFT holder.
 *
 * Requires EIP-191 signature proving address ownership + server-side NFT check.
 * Returns the verified lowercase address on success, or an error string on failure.
 */
export async function verifyAdmin(body: {
    address?: string;
    signature?: string;
    action?: string;
}): Promise<{ address: string } | { error: string; status: number }> {
    const { address, signature, action } = body;

    if (!address || !signature || !action) {
        return { error: 'Missing address, signature, or action', status: 400 };
    }

    // 1. Verify signature proves address ownership
    const message = `SuperGuild Admin Action\nAction: ${action}\nAddress: ${address}`;
    const valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
    });
    if (!valid) {
        return { error: 'Invalid signature', status: 403 };
    }

    // 2. Verify admin access: fallback wallet bypass OR Token #3 (First Flame) NFT
    const isFallbackWallet = address.toLowerCase() === ADMIN_FALLBACK_WALLET;
    if (!isFallbackWallet) {
        const hasNFT = await hasPrivilegeNFT(
            address.toLowerCase() as `0x${string}`,
            PRIVILEGE_NFT.tokens.FIRST_FLAME.id,
        );
        if (!hasNFT) {
            return { error: 'Forbidden: First Flame NFT required', status: 403 };
        }
    }

    return { address: address.toLowerCase() };
}
