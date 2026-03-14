'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState, useCallback, ReactNode } from 'react';
import { useT } from '@/lib/i18n';

interface RequireWalletProps {
    children: (handleClick: () => void) => ReactNode;
    onAuthorized: () => void;
}

/**
 * Wrapper that intercepts an action and shows wallet connect prompt if not connected.
 * Usage:
 *   <RequireWallet onAuthorized={() => doSomething()}>
 *     {(handleClick) => <button onClick={handleClick}>Action</button>}
 *   </RequireWallet>
 */
export function RequireWallet({ children, onAuthorized }: RequireWalletProps) {
    const { isConnected } = useAccount();
    const { openConnectModal } = useConnectModal();
    const [showPrompt, setShowPrompt] = useState(false);
    const t = useT();

    const handleClick = useCallback(() => {
        if (isConnected) {
            onAuthorized();
        } else if (openConnectModal) {
            openConnectModal();
        } else {
            setShowPrompt(true);
        }
    }, [isConnected, onAuthorized, openConnectModal]);

    return (
        <>
            {children(handleClick)}
            {showPrompt && (
                <WalletPromptModal onClose={() => setShowPrompt(false)} />
            )}
        </>
    );
}

function WalletPromptModal({ onClose }: { onClose: () => void }) {
    const t = useT();
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-surface-dark rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="material-symbols-outlined !text-[48px] text-primary mb-4 block">
                    account_balance_wallet
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {t.common.connectWallet}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {t.errors.walletRequired}
                </p>
                <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-primary text-white font-semibold text-sm"
                >
                    {t.common.cancel}
                </button>
            </div>
        </div>
    );
}
