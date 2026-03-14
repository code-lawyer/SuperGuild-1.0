'use client';

import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';

interface WalletGatePageProps {
    children: ReactNode;
}

/**
 * 页面级钱包门控组件。
 * 未连接钱包时，整个页面替换为连接钱包引导。
 * 与 RequireWallet（按钮级别）不同，这是全页面覆盖。
 */
export function WalletGatePage({ children }: WalletGatePageProps) {
    const { isConnected } = useAccount();
    const { openConnectModal } = useConnectModal();
    const [mounted, setMounted] = useState(false);
    const t = useT();

    useEffect(() => setMounted(true), []);

    // SSR 阶段不渲染，避免 hydration 不匹配
    if (!mounted) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (isConnected) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full flex flex-col items-center text-center"
            >
                {/* Icon */}
                <div className="w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[48px] text-primary">
                        account_balance_wallet
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                    {t.common.walletGateTitle}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    {t.common.walletGateDesc1}<br />
                    {t.common.walletGateDesc2}
                </p>

                {/* Connect Button */}
                <button
                    onClick={() => openConnectModal?.()}
                    className="ag-btn-primary px-8 py-3.5 text-sm"
                >
                    <span className="material-symbols-outlined !text-[20px]">link</span>
                    {t.common.connectWallet}
                </button>

                {/* Hint */}
                <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                    {t.common.walletGateHint}
                </p>
            </motion.div>
        </div>
    );
}

