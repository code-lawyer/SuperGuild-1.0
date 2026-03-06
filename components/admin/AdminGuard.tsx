'use client';

import { useT } from '@/lib/i18n';
import { useNFTGate } from '@/hooks/useNFTGate';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const t = useT();
    const { hasNFT, isLoading, isConnected } = useNFTGate({
        contractAddress: PRIVILEGE_NFT.address,
        tokenId: PRIVILEGE_NFT.tokens.FIRST_FLAME.id,
    });
    const { openConnectModal } = useConnectModal();

    if (!isConnected) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500">{t.admin.connectWalletDesc}</p>
                <button
                    onClick={() => openConnectModal?.()}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition-colors"
                >
                    {t.common.connectWallet}
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500">
                {t.common.loading}
            </div>
        );
    }

    if (!hasNFT) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
                <div className="w-16 h-16 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined !text-[32px] text-red-400">lock</span>
                </div>
                <p className="text-sm font-bold text-red-400 tracking-widest uppercase">{t.admin.nftRequired}</p>
                <p className="text-sm text-slate-500 max-w-sm">{t.admin.accessDeniedDesc}</p>
            </div>
        );
    }

    return <>{children}</>;
}
