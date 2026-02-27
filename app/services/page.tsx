'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequireWallet } from '@/components/ui/RequireWallet';

// Channel metadata
const channels = [
    {
        id: 1,
        icon: 'hub',
        gradient: 'from-blue-500 to-cyan-400',
        bgLight: 'bg-blue-50',
        bgDark: 'dark:bg-blue-900/20',
    },
    {
        id: 2,
        icon: 'shield',
        gradient: 'from-emerald-500 to-teal-400',
        bgLight: 'bg-emerald-50',
        bgDark: 'dark:bg-emerald-900/20',
    },
    {
        id: 3,
        icon: 'handshake',
        gradient: 'from-purple-500 to-pink-400',
        bgLight: 'bg-purple-50',
        bgDark: 'dark:bg-purple-900/20',
    },
];

export default function ServicesPage() {
    const t = useT();
    const { services, isLoading, unlockedIds, unlockService } = useServices();
    const [expandedChannel, setExpandedChannel] = useState<number | null>(null);
    const [expandedService, setExpandedService] = useState<string | null>(null);

    // Channel labels from i18n
    const channelLabels: Record<number, { title: string; desc: string }> = {
        1: { title: t.services.infrastructure, desc: '为超级个体打造的数字基座，提供基础作业规范和安全保障' },
        2: { title: t.services.specialized, desc: '确保每一分利润都在阳光下合法避险，提供专业的业务服务方案' },
        3: { title: t.services.consulting, desc: '连接资源与机会的生态网络，为超级个体提供专业顾问服务' },
    };

    const allServices = services ?? [];

    // Group services by channel
    const channelServices = (channelId: number) => allServices.filter(s => s.channel === channelId);

    return (
        <div className="flex-grow w-full max-w-[1280px] mx-auto px-6 flex flex-col min-h-screen">
            <PageHeader
                title={t.services.heroTitle}
                description={t.services.heroDescription}
            />

            <section className="space-y-4 flex-grow pb-24">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <span className="material-symbols-outlined animate-spin !text-[32px]">progress_activity</span>
                    </div>
                ) : (
                    channels.map(ch => {
                        const label = channelLabels[ch.id];
                        const items = channelServices(ch.id);
                        const isExpanded = expandedChannel === ch.id;

                        return (
                            <div key={ch.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-surface-dark shadow-sm">
                                {/* Channel Header */}
                                <button
                                    onClick={() => setExpandedChannel(isExpanded ? null : ch.id)}
                                    className="w-full flex items-center gap-4 p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className={`w-14 h-14 rounded-xl ${ch.bgLight} ${ch.bgDark} flex items-center justify-center shrink-0`}>
                                        <span className={`material-symbols-outlined !text-[28px] bg-gradient-to-br ${ch.gradient} bg-clip-text text-transparent`}>
                                            {ch.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {label?.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                            {label?.desc}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                                            {items.length} 项服务
                                        </span>
                                        <span className={`material-symbols-outlined !text-[24px] text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    </div>
                                </button>

                                {/* Expanded Service List */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 dark:border-slate-800">
                                        {items.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                暂无服务方案
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                {items.map(s => (
                                                    <ServiceItem
                                                        key={s.id}
                                                        service={s}
                                                        isUnlocked={unlockedIds?.includes(s.id)}
                                                        isExpanded={expandedService === s.id}
                                                        onToggleExpand={() => setExpandedService(expandedService === s.id ? null : s.id)}
                                                        onUnlock={unlockService}
                                                        t={t}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-100 dark:border-slate-800 py-12 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined !text-[20px]">token</span>
                        <span className="text-sm font-medium">{t.footer.copyright}</span>
                    </div>
                    <div className="flex gap-8">
                        <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.privacy}</a>
                        <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.terms}</a>
                        <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.documentation}</a>
                        <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.support}</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ── Service Item (with optional sub-services) ──
function ServiceItem({
    service: s,
    isUnlocked,
    isExpanded,
    onToggleExpand,
    onUnlock,
    t,
}: {
    service: Service;
    isUnlocked: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onUnlock: (id: string) => void;
    t: ReturnType<typeof useT>;
}) {
    const hasChildren = s.children && s.children.length > 0;

    return (
        <div>
            <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined !text-[22px] font-light">
                        {s.icon || 'article'}
                    </span>
                </div>

                {/* Title + description row */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {s.title}
                    </h4>
                    {s.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {s.description}
                        </p>
                    )}
                </div>

                {/* Price */}
                <span className="text-xs font-mono text-slate-400 shrink-0">
                    {isUnlocked ? (
                        <span className="text-emerald-500">{t.common.active}</span>
                    ) : s.price > 0 ? (
                        `${s.price} ${s.currency || 'USDC'}`
                    ) : (
                        '免费'
                    )}
                </span>

                {/* Action buttons */}
                <div className="shrink-0 flex items-center gap-2">
                    {isUnlocked ? (
                        <button className="px-4 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700">
                            {t.common.manage}
                        </button>
                    ) : (
                        <RequireWallet onAuthorized={() => onUnlock(s.id)}>
                            {(handleClick) => (
                                <button
                                    onClick={handleClick}
                                    className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-colors"
                                >
                                    {t.common.activate}
                                </button>
                            )}
                        </RequireWallet>
                    )}

                    {/* Expand arrow for items with children */}
                    {hasChildren && (
                        <button onClick={onToggleExpand} className="p-1">
                            <span className={`material-symbols-outlined !text-[18px] text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-services */}
            {hasChildren && isExpanded && (
                <div className="ml-14 mr-6 mb-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {s.children!.map(child => (
                        <div key={child.id} className="flex items-center gap-3 px-4 py-3">
                            <span className="material-symbols-outlined !text-[16px] text-slate-400">subdirectory_arrow_right</span>
                            <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{child.title}</h5>
                                {child.description && (
                                    <p className="text-xs text-slate-400 truncate">{child.description}</p>
                                )}
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                                {child.price > 0 ? `${child.price} ${child.currency || 'USDC'}` : '免费'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
