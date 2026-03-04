'use client';

import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';

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
                className="max-w-md w-full text-center"
            >
                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[48px] text-primary">
                        account_balance_wallet
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                    连接钱包以继续
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    此页面需要验证你的链上身份。<br />
                    请连接你的钱包以访问完整功能。
                </p>

                {/* Connect Button */}
                <button
                    onClick={() => openConnectModal?.()}
                    className="px-8 py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-colors transition-transform flex items-center gap-2 mx-auto"
                >
                    <span className="material-symbols-outlined !text-[20px]">link</span>
                    连接钱包
                </button>

                {/* Hint */}
                <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                    支持 MetaMask、Coinbase Wallet、WalletConnect 等
                </p>
            </motion.div>
        </div>
    );
}
