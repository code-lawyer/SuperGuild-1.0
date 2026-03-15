'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react';
import { useI18n, useT } from '@/lib/i18n';
import NotificationDrawer from '@/components/ui/NotificationDrawer';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useNFTGate } from '@/hooks/useNFTGate';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import LogoMark from '@/components/ui/LogoMark';
import { ADMIN_FALLBACK_WALLET } from '@/constants/admin-config';

export default function Header() {
    const pathname = usePathname();
    const { isConnected, address } = useAccount();
    const [mounted, setMounted] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { locale, setLocale } = useI18n();
    const t = useT();
    const { data: unreadCount } = useUnreadCount();
    const { hasNFT: hasAdminNFT } = useNFTGate({
        contractAddress: PRIVILEGE_NFT.address,
        tokenId: PRIVILEGE_NFT.tokens.FIRST_FLAME.id,
    });
    const isAdmin = hasAdminNFT || address?.toLowerCase() === ADMIN_FALLBACK_WALLET;

    useEffect(() => setMounted(true), []);

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const navItems = [
        {
            label: t.nav.docs,
            href: '/bulletin',
            subItems: [
                { label: t.nav.sub_docs_announcements, href: '/bulletin' },
                { label: t.nav.sub_docs_pioneers, href: '/bulletin/pioneer' },
            ]
        },
        {
            label: t.nav.services,
            href: '/services',
            subItems: [
                { label: t.nav.sub_services_infra, href: '/services/infrastructure' },
                { label: t.nav.sub_services_core, href: '/services/core' },
                { label: t.nav.sub_services_co_create, href: '/services/consulting' },
            ]
        },
        {
            label: t.nav.bounties,
            href: '/collaborations',
            subItems: [
                { label: t.nav.sub_bounties_lobby, href: '/collaborations' },
                { label: t.nav.sub_bounties_post, href: '/collaborations/create' },
                { label: t.nav.sub_bounties_manage, href: '/collaborations/manage' },
            ]
        },
        {
            label: t.nav.governance,
            href: '/council',
            subItems: [
                { label: t.nav.sub_council_proposals, href: '/council/proposals' },
                { label: t.nav.sub_council_arbitration, href: '/council/arbitration' },
                { label: t.nav.sub_council_ai, href: '/council/ai' },
                { label: t.nav.sub_council_records, href: '/council/records' },
            ]
        }
    ];

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 group cursor-pointer relative z-10 active:scale-95 transition-transform duration-150 select-none"
                        aria-label="SuperGuild home"
                    >
                        {/* SVG emblem — guild-knot motif */}
                        <div className="text-primary transition-all duration-500 ease-out group-hover:scale-110 group-hover:[filter:drop-shadow(0_0_10px_#137fec80)]">
                            <LogoMark size={30} />
                        </div>
                        {/* Wordmark */}
                        <span className="text-[17px] font-black tracking-[-0.02em] text-slate-900 dark:text-white leading-none">
                            SuperGuild
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-4 lg:gap-8">
                        {navItems.map((item, idx) => (
                            <div key={idx} className="relative group/nav">
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-1.5 py-5 text-sm font-bold transition-colors transition-transform ${pathname.startsWith(item.href) && item.href !== '/'
                                        ? 'text-primary'
                                        : 'text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary'
                                        }`}
                                >
                                    {item.label}
                                    <span className="material-symbols-outlined !text-[18px] opacity-40 group-hover/nav:opacity-100 group-hover/nav:rotate-180 transition-colors transition-transform duration-300">
                                        arrow_drop_down
                                    </span>
                                </Link>

                                {/* Dropdown Menu */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-colors transition-transform duration-300 z-50">
                                    <div className="w-64 p-2 rounded-xl bg-white/95 dark:bg-bg-dark/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_0_30px_rgba(var(--primary),0.15)] flex flex-col relative overflow-hidden">
                                        {/* Top glowing edge */}
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                                        {item.subItems.map((sub, sIdx) => (
                                            <Link
                                                key={sIdx}
                                                href={sub.href}
                                                className="px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors transition-transform flex items-center gap-2 group/sub relative"
                                            >
                                                <span className="truncate">{sub.label}</span>
                                                <span className="material-symbols-outlined !text-[18px] ml-auto opacity-0 -translate-x-2 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-colors transition-transform text-primary">
                                                    chevron_right
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <button
                            onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
                            className="flex items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/30 transition-colors transition-transform text-xs font-bold"
                            title="Switch language"
                            aria-label="Toggle language between English and Chinese"
                        >
                            {locale === 'en' ? '中' : 'EN'}
                        </button>

                        {/* Notifications */}
                        {mounted && isConnected && (
                            <button
                                onClick={() => setNotifOpen(true)}
                                className="relative flex items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/30 transition-colors transition-transform"
                                aria-label="Open notifications"
                                title="Notifications"
                            >
                                <span className="material-symbols-outlined !text-[20px] pointer-events-none">notifications</span>
                                {(unreadCount ?? 0) > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-sm">
                                        {unreadCount! > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Wallet — desktop only */}
                        <div className="hidden md:block">
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
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-full hover:border-primary/50 transition-colors group"
                                            >
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {account.displayName}
                                                </span>
                                                <span className="material-symbols-outlined !text-[18px] text-slate-400 group-hover:text-primary transition-colors">
                                                    expand_more
                                                </span>
                                            </button>
                                        );
                                    }}
                                </ConnectButton.Custom>
                            )}
                        </div>

                        {/* Admin Link */}
                        {isAdmin && (
                            <Link href="/admin" className="min-w-[44px] min-h-[44px] rounded-full ring-2 ring-amber-400/40 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center hover:ring-amber-400/70 transition-all" title="Admin Panel" aria-label="Admin Panel">
                                <span className="material-symbols-outlined !text-[18px] text-amber-500 pointer-events-none">admin_panel_settings</span>
                            </Link>
                        )}

                        {/* Profile Avatar */}
                        {mounted && isConnected && (
                            <Link href="/profile" className="min-w-[44px] min-h-[44px] rounded-full ring-2 ring-primary/30 bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:ring-primary/60 transition-all" title="My Profile" aria-label="My Profile">
                                <span className="material-symbols-outlined !text-[18px] text-primary pointer-events-none">person</span>
                            </Link>
                        )}

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileOpen(o => !o)}
                            className="md:hidden flex items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/30 transition-colors"
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        >
                            <span className="material-symbols-outlined !text-[22px]">
                                {mobileOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-bg-dark">
                        <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col gap-1">
                            {navItems.map((item, idx) => (
                                <div key={idx}>
                                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                                        {item.label}
                                    </p>
                                    {item.subItems.map((sub, sIdx) => (
                                        <Link
                                            key={sIdx}
                                            href={sub.href}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                                pathname === sub.href
                                                    ? 'text-primary bg-primary/5'
                                                    : 'text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined !text-[16px] text-primary/40">arrow_right</span>
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            ))}

                            {/* Mobile wallet */}
                            <div className="pt-4 pb-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                {mounted && (
                                    <ConnectButton.Custom>
                                        {({ account, openConnectModal, openAccountModal, mounted: walletMounted }) => {
                                            if (!walletMounted) return null;
                                            if (!account) {
                                                return (
                                                    <button
                                                        onClick={openConnectModal}
                                                        className="w-full ag-btn-primary py-3 text-sm"
                                                    >
                                                        {t.common.connectWallet}
                                                    </button>
                                                );
                                            }
                                            return (
                                                <button
                                                    onClick={openAccountModal}
                                                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{account.address}</span>
                                                    <span className="material-symbols-outlined !text-[18px] text-slate-400 ml-auto shrink-0">expand_more</span>
                                                </button>
                                            );
                                        }}
                                    </ConnectButton.Custom>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        </>
    );
}
