'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { useMyCollaborations, useOpenCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import { PageHeader } from '@/components/ui/PageHeader';
import { PerspectiveTransition } from '@/components/ui/PerspectiveTransition';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { RequireWallet } from '@/components/ui/RequireWallet';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CollaborationsPage() {
    const t = useT();
    const router = useRouter();
    const { data: myCollabs, isLoading: myLoading } = useMyCollaborations();
    const { data: openCollabs, isLoading: openLoading } = useOpenCollaborations();
    const [view, setView] = useState<'marketplace' | 'mine'>('marketplace');
    const [activeTab, setActiveTab] = useState('all');

    const tabs = [
        { key: 'all', label: t.quests.allQuests },
        { key: 'active', label: t.quests.activeQuests, statuses: ['ACTIVE', 'LOCKED'] },
        { key: 'pending', label: t.quests.pendingQuests, statuses: ['OPEN', 'PENDING_APPROVAL'] },
        { key: 'completed', label: t.quests.completedQuests, statuses: ['SETTLED'] },
        { key: 'cancelled', label: t.quests.cancelledQuests, statuses: ['CANCELLED', 'DISPUTED'] },
    ];

    const isMarketplace = view === 'marketplace';
    const isLoading = isMarketplace ? openLoading : myLoading;
    const items = isMarketplace ? (openCollabs ?? []) : (myCollabs ?? []);
    const currentTab = tabs.find(tab => tab.key === activeTab);
    const filtered = isMarketplace
        ? items
        : activeTab === 'all'
            ? items
            : items.filter((c: Collaboration) => currentTab?.statuses?.includes(c.status));

    const statusStyle: Record<string, string> = {
        OPEN: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        PENDING_APPROVAL: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        LOCKED: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
        SETTLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
        DISPUTED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };

    const statusLabel: Record<string, string> = {
        OPEN: t.quests.pendingQuests,
        PENDING_APPROVAL: t.quests.pendingQuests,
        ACTIVE: t.quests.activeQuests,
        LOCKED: t.common.locked,
        SETTLED: t.quests.completedQuests,
        CANCELLED: t.quests.cancelledQuests,
        DISPUTED: t.common.disputed,
    };

    return (
        <WalletGatePage>
            <div className="relative min-h-screen selection:bg-primary/20">
                {/* Terminal Grid Background */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]" />
                </div>

                <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col relative z-10 min-h-screen">
                    <PageHeader
                        title={t.quests.title}
                        description={t.quests.subtitle}
                        action={
                            <RequireWallet onAuthorized={() => router.push('/collaborations/create')}>
                                {(handleClick) => (
                                    <MagneticButton
                                        onClick={handleClick}
                                        className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl transition-colors transition-transform flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">add</span>
                                        {t.quests.newQuest}
                                    </MagneticButton>
                                )}
                            </RequireWallet>
                        }
                    />

                    {/* View Toggle: Marketplace vs My Quests */}
                    <div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => { setView('marketplace'); setActiveTab('all'); }}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${isMarketplace
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[14px] align-middle mr-1">storefront</span>
                            {t.quests.marketplace}
                        </button>
                        <button
                            onClick={() => { setView('mine'); setActiveTab('all'); }}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${!isMarketplace
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[14px] align-middle mr-1">person</span>
                            {t.quests.myQuests}
                        </button>
                    </div>

                    {/* Status Tabs (only for My Quests view) */}
                    {!isMarketplace && (
                        <div className="flex flex-wrap gap-2 mb-10">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-5 py-2 text-xs font-bold transition-colors transition-transform rounded-lg ${activeTab === tab.key
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-primary border border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content Grid */}
                    <PerspectiveTransition
                        id={`${view}-${activeTab}`}
                        direction={isMarketplace ? 0 : tabs.findIndex(t => t.key === activeTab)}
                        className="flex-grow pb-24"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
                                <span className="material-symbols-outlined animate-spin shadow-glow !text-[40px] text-primary">progress_activity</span>
                                <span className="text-xs font-mono uppercase tracking-widest animate-pulse">Scanning Nexus Nodes...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                <span className="material-symbols-outlined !text-[48px] text-slate-300 mb-4">dataset_linked</span>
                                <p className="text-sm font-semibold text-slate-500">
                                    {isMarketplace ? t.quests.noOpenQuests : t.quests.noQuests}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    {isMarketplace
                                        ? t.quests.noOpenQuestsDesc
                                        : activeTab === 'all' ? t.quests.noQuestsDesc : t.quests.noQuestsFilterDesc}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filtered.map((c: Collaboration, index: number) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={`/collaborations/${c.id}`}
                                            className="group relative flex flex-col h-full bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-colors transition-transform duration-300 hover:translate-x-1 hover:-translate-y-1 block p-1 overflow-hidden"
                                            style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)" }}
                                        >
                                            <div className="p-6 flex flex-col h-full bg-white dark:bg-[#0a0f18] relative overflow-hidden" style={{ clipPath: "polygon(0 0, calc(100% - 19px) 0, 100% 19px, 100% 100%, 0 100%)" }}>
                                                {/* Accent corner */}
                                                <div className="absolute top-0 right-0 w-8 h-8 bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none" />

                                                <div className="flex items-start justify-between mb-4 gap-4">
                                                    <div className="space-y-1 overflow-hidden">
                                                        <div className="text-[9px] font-mono text-primary font-bold tracking-widest uppercase mb-1">
                                                            {`NODE_ID: ${c.id.split('-')[0].toUpperCase()}`}
                                                        </div>
                                                        <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 md:h-[3.5rem] leading-[1.2] tracking-tight">
                                                            {c.title}
                                                        </h4>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black border uppercase tracking-tighter shrink-0 ${statusStyle[c.status] || ''}`}>
                                                        {statusLabel[c.status] || c.status}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 flex-grow leading-relaxed">
                                                    {c.description || t.quests.noDescription}
                                                </p>

                                                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t.quests.budget}</span>
                                                        <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                                                            {c.total_budget || '0'}
                                                            <span className="text-[11px] text-primary font-semibold">USDC</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                        <span className="material-symbols-outlined !text-[16px] text-slate-400 group-hover:text-primary">schedule</span>
                                                        <span className="text-[11px] text-slate-500 font-medium">
                                                            {new Date(c.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </PerspectiveTransition>
                </div>
            </div>
        </WalletGatePage>
    );
}
