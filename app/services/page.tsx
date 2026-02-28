'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequireWallet } from '@/components/ui/RequireWallet';
import { motion, AnimatePresence } from 'framer-motion';

// Channel metadata with Protocol Aesthetic styling
const channels = [
    {
        id: 1,
        icon: 'terminal',
        gradient: 'from-blue-500 to-cyan-400',
        borderColor: 'border-blue-500/30',
        glowColor: 'rgba(59, 130, 246, 0.5)',
    },
    {
        id: 2,
        icon: 'security_update_good',
        gradient: 'from-emerald-500 to-teal-400',
        borderColor: 'border-emerald-500/30',
        glowColor: 'rgba(16, 185, 129, 0.5)',
    },
    {
        id: 3,
        icon: 'person_search',
        gradient: 'from-purple-500 to-pink-400',
        borderColor: 'border-purple-500/30',
        glowColor: 'rgba(168, 85, 247, 0.5)',
    },
];

export default function ServicesPage() {
    const t = useT();
    const { services, isLoading, unlockedIds, unlockService } = useServices();
    const [expandedChannel, setExpandedChannel] = useState<number | null>(1);
    const [expandedService, setExpandedService] = useState<string | null>(null);

    const channelLabels: Record<number, { title: string; desc: string }> = {
        1: { title: t.services.infrastructure, desc: t.services.infrastructureDesc },
        2: { title: t.services.specialized, desc: t.services.specializedDesc },
        3: { title: t.services.consulting, desc: t.services.consultingDesc },
    };

    const allServices = services ?? [];
    const channelServices = (channelId: number) => allServices.filter(s => s.channel === channelId);

    return (
        <div className="relative min-h-screen selection:bg-primary/20">
            {/* Terminal Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col relative z-10 w-full min-h-screen">
                <PageHeader
                    title={t.services.heroTitle}
                    description={t.services.heroDescription}
                />

                <section className="space-y-6 flex-grow pb-32">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
                            <span className="material-symbols-outlined animate-spin shadow-glow !text-[40px] text-primary">progress_activity</span>
                            <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">Loading Services...</span>
                        </div>
                    ) : (
                        channels.map((ch, index) => {
                            const label = channelLabels[ch.id];
                            const items = channelServices(ch.id);
                            const isExpanded = expandedChannel === ch.id;

                            return (
                                <motion.div
                                    key={ch.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative border transition-all duration-500 overflow-hidden bg-white/50 dark:bg-slate-900/30 ${isExpanded ? `shadow-[0_20px_50px_-20px_${ch.glowColor}] ${ch.borderColor}` : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                    style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
                                >
                                    {/* Channel Header */}
                                    <button
                                        onClick={() => setExpandedChannel(isExpanded ? null : ch.id)}
                                        className="w-full flex flex-col md:flex-row md:items-center gap-6 p-8 text-left group"
                                    >
                                        <div className={`w-16 h-16 rounded-sm border ${ch.borderColor} bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform`}>
                                            <div className="absolute inset-x-0 top-0 h-[1px] bg-white opacity-20" />
                                            <span className={`material-symbols-outlined !text-[32px] bg-gradient-to-br ${ch.gradient} bg-clip-text text-transparent drop-shadow-sm`}>
                                                {ch.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono">
                                                    {label?.title}
                                                </h3>
                                                <div className="h-[2px] w-8 bg-primary/20" />
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                                                {label?.desc}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0 mt-4 md:mt-0">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Available Services</span>
                                                <span className="text-lg font-bold text-primary">
                                                    {items.length.toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <div className={`w-10 h-10 border flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white border-primary rotate-180' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                                                <span className="material-symbols-outlined !text-[24px]">expand_more</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Service List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-100 dark:border-slate-800/50 overflow-hidden"
                                            >
                                                {items.length === 0 ? (
                                                    <div className="p-12 text-center text-slate-400 font-mono text-xs uppercase tracking-widest bg-slate-50/50 dark:bg-black/20">
                                                        {`[ ${t.services.noServices || 'NO_SERVICES_INDEXED'} ]`}
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                        {items.map(s => (
                                                            <ServiceItem
                                                                key={s.id}
                                                                service={s}
                                                                isUnlocked={unlockedIds?.includes(s.id)}
                                                                isExpanded={expandedService === s.id}
                                                                onToggleExpand={() => setExpandedService(expandedService === s.id ? null : s.id)}
                                                                onUnlock={unlockService}
                                                                t={t}
                                                                channelColor={ch.gradient}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </section>

                {/* Protocol Footer info */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Status: Online (Base Mainnet)</span>
                    </div>
                    <span>{`System ID: ${Math.random().toString(16).slice(2, 10).toUpperCase()}`}</span>
                </div>
            </div>
        </div>
    );
}

// ── Service Item ──
function ServiceItem({
    service: s,
    isUnlocked,
    isExpanded,
    onToggleExpand,
    onUnlock,
    t,
    channelColor
}: {
    service: Service;
    isUnlocked: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onUnlock: (id: string) => void;
    t: any;
    channelColor: string;
}) {
    const hasChildren = s.children && s.children.length > 0;

    return (
        <div className="group/item relative">
            <div className="flex flex-col md:flex-row md:items-center gap-6 px-8 py-6 hover:bg-primary/5 transition-colors relative">
                {/* Visual Indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover/item:bg-primary transition-colors" />

                {/* Icon */}
                <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-primary shrink-0 transition-transform group-hover/item:scale-110">
                    <span className="material-symbols-outlined !text-[24px]">
                        {s.icon || 'settings_input_component'}
                    </span>
                </div>

                {/* Title + description */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {s.title}
                        </h4>
                        {isUnlocked && (
                            <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider">
                                Active
                            </span>
                        )}
                    </div>
                    {s.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                            {s.description}
                        </p>
                    )}
                </div>

                {/* Price & Actions */}
                <div className="shrink-0 flex items-center gap-8 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Usage Cost</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                            {isUnlocked ? (
                                <span className="text-emerald-500">Free</span>
                            ) : s.price > 0 ? (
                                `${s.price.toFixed(2)} ${s.currency || 'USDC'}`
                            ) : (
                                'Free'
                            )}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {isUnlocked ? (
                            <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest transition-all hover:bg-primary dark:hover:bg-primary dark:hover:text-white" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%)" }}>
                                {t.common.manage}
                            </button>
                        ) : (
                            <RequireWallet onAuthorized={() => onUnlock(s.id)}>
                                {(handleClick) => (
                                    <button
                                        onClick={handleClick}
                                        className="px-6 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all"
                                        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%)" }}
                                    >
                                        {t.common.activate}
                                    </button>
                                )}
                            </RequireWallet>
                        )}

                        {hasChildren && (
                            <button
                                onClick={onToggleExpand}
                                className={`w-8 h-8 flex items-center justify-center transition-all ${isExpanded ? 'text-primary' : 'text-slate-400'}`}
                            >
                                <span className={`material-symbols-outlined !text-[22px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sub-services */}
            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/50 dark:bg-black/20"
                    >
                        <div className="ml-16 mr-8 mb-6 mt-2 border-l-2 border-primary/20 bg-white/50 dark:bg-slate-800/30 divide-y divide-slate-100 dark:divide-slate-800/50">
                            {s.children!.map(child => (
                                <div key={child.id} className="flex items-center gap-4 px-6 py-4 group/sub hover:bg-primary/5 transition-colors">
                                    <span className="material-symbols-outlined !text-[14px] text-primary opacity-40">subdirectory_arrow_right</span>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{child.title}</h5>
                                        {child.description && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">{child.description}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-black font-mono text-slate-600 dark:text-slate-300">
                                            {child.price > 0 ? `${child.price.toFixed(2)} USDC` : '0.00 USDC'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
