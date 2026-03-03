'use client';

import { useNFTGate } from './useNFTGate';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

/**
 * 仲裁庭 (Hand of Justice) 页面门控。
 * 检查用户是否持有 Token #4 — Hand of Justice (公义之手)。
 */
export function useLanternGate() {
    const { hasNFT, ...rest } = useNFTGate({
        contractAddress: PRIVILEGE_NFT.address,
        tokenId: PRIVILEGE_NFT.tokens.HAND_OF_JUSTICE.id,
    });

    return {
        isLantern: hasNFT,
        ...rest
    };
}
