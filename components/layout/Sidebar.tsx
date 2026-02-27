'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n';

const navItems = [
    { icon: 'dashboard', href: '/', labelKey: 'dashboard' as const },
    { icon: 'hub', href: '/services', labelKey: 'services' as const },
    { icon: 'group', href: '/collaborations', labelKey: 'bounties' as const },
    { icon: 'person', href: '/profile', labelKey: 'profile' as const },
];

export default function Sidebar() {
    const pathname = usePathname();
    const t = useT();

    return (
        <aside className="w-64 flex-shrink-0 border-r border-border-light dark:border-border-dark bg-white dark:bg-surface-dark flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border-light dark:border-border-dark">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-primary/10 rounded-xl p-2">
                        <span className="material-symbols-outlined text-primary !text-[24px]">token</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">SuperGuild</h1>
                        <p className="text-slate-500 text-xs font-medium">Protocol v2</p>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {navItems.map(item => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                {item.icon}
                            </span>
                            {t.nav[item.labelKey]}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
