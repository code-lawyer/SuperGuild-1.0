'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react';
import { useI18n, useT } from '@/lib/i18n';
import NotificationDrawer from '@/components/ui/NotificationDrawer';

export default function Header() {
    const pathname = usePathname();
    const { isConnected } = useAccount();
    const [mounted, setMounted] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const { locale, setLocale } = useI18n();
    const t = useT();

    useEffect(() => setMounted(true), []);

    const navItems = [
        { href: '/', label: t.nav.dashboard },
        { href: '/services', label: t.nav.services },
        { href: '/collaborations', label: t.nav.bounties },
        { href: '/bulletin', label: t.nav.docs },
    ];

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark">
                <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="text-primary transition-transform duration-500 group-hover:rotate-180">
                            <span className="material-symbols-outlined !text-[28px] font-light">token</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SuperGuild</h1>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm font-medium transition-colors ${pathname === item.href
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <button
                            onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/30 transition-all text-xs font-bold"
                            title="Switch language"
                        >
                            {locale === 'en' ? '中' : 'EN'}
                        </button>

                        {/* Notifications */}
                        {mounted && isConnected && (
                            <button
                                onClick={() => setNotifOpen(true)}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/30 transition-all"
                            >
                                <span className="material-symbols-outlined !text-[20px]">notifications</span>
                            </button>
                        )}

                        {/* Wallet */}
                        {mounted && (
                            <ConnectButton.Custom>
                                {({ account, chain, openConnectModal, openAccountModal, mounted: walletMounted }) => {
                                    if (!walletMounted) return null;
                                    if (!account) {
                                        return (
                                            <button
                                                onClick={openConnectModal}
                                                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
                                            >
                                                {t.common.connectWallet}
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            onClick={openAccountModal}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-full hover:border-primary/50 transition-colors group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                                {account.displayName}
                                            </span>
                                            <span className="material-symbols-outlined !text-[16px] text-slate-400 group-hover:text-primary">
                                                expand_more
                                            </span>
                                        </button>
                                    );
                                }}
                            </ConnectButton.Custom>
                        )}

                        {/* Profile Avatar */}
                        {mounted && isConnected && (
                            <Link href="/profile" className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-400 p-[2px]">
                                <div className="rounded-full w-full h-full bg-white dark:bg-bg-dark flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[18px] text-primary">person</span>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        </>
    );
}
