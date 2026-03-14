'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { useLobbyCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import { PageHeader } from '@/components/ui/PageHeader';
import { PerspectiveTransition } from '@/components/ui/PerspectiveTransition';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { RequireWallet } from '@/components/ui/RequireWallet';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SquareLoader } from '@/components/ui/SquareLoader';

const GRADES = ['S', 'A', 'B', 'C', 'D', 'E'] as const;
const BUDGET_RANGES = ['all', 'low', 'mid', 'high'] as const;

export default function CollaborationsPage() {
    const t = useT();
    const router = useRouter();
    const { data: lobbyCollabs, isLoading } = useLobbyCollaborations();

    const [filterGrade, setFilterGrade] = useState<string>('all');
    const [filterBudget, setFilterBudget] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const statusStyle: Record<string, string> = {
        OPEN: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        PENDING_APPROVAL: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        LOCKED: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
        CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
        DISPUTED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };

    const statusLabel: Record<string, string> = {
        OPEN: t.common.open,
        PENDING_APPROVAL: t.common.pendingApproval,
        ACTIVE: t.quests.activeQuests,
        LOCKED: t.common.locked,
        CANCELLED: t.quests.cancelledQuests,
        DISPUTED: t.common.disputed,
    };

    const statusFilters = [
        { key: 'all', label: t.quests.filterAll },
        { key: 'OPEN', label: t.common.open },
        { key: 'ACTIVE', label: t.quests.activeQuests },
        { key: 'PENDING_APPROVAL', label: t.common.pendingApproval },
    ];

    const budgetLabel: Record<string, string> = {
        all: t.quests.filterAll,
        low: t.quests.budgetLow,
        mid: t.quests.budgetMid,
        high: t.quests.budgetHigh,
    };

    const filtered = useMemo(() => {
        let items = lobbyCollabs ?? [];

        if (filterGrade !== 'all') {
            items = items.filter(c => c.grade === filterGrade);
        }

        if (filterBudget !== 'all') {
            items = items.filter(c => {
                if (filterBudget === 'low') return c.total_budget < 500;
                if (filterBudget === 'mid') return c.total_budget >= 500 && c.total_budget <= 2000;
                if (filterBudget === 'high') return c.total_budget > 2000;
                return true;
            });
        }

        if (filterStatus !== 'all') {
            items = items.filter(c => c.status === filterStatus);
        }

        return items;
    }, [lobbyCollabs, filterGrade, filterBudget, filterStatus]);

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

                    {/* ── Filter Panel ── */}
                    <div className="mb-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)" }}
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[14px] text-primary">filter_list</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                                    {t.quests.filterStatus.replace(':', '')} &amp; {t.quests.filterGrade.replace(':', '')} &amp; {t.quests.filterBudget.replace(':', '')}
                                </span>
                            </div>
                            {(filterStatus !== 'all' || filterGrade !== 'all' || filterBudget !== 'all') && (
                                <button
                                    onClick={() => { setFilterStatus('all'); setFilterGrade('all'); setFilterBudget('all'); }}
                                    className="text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined !text-[12px]">close</span>
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Filter rows */}
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {/* Status */}
                            <div className="flex items-center gap-4 px-5 py-3">
                                <span className="w-14 shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                                    {t.quests.filterStatus.replace(':', '')}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {statusFilters.map(sf => (
                                        <button
                                            key={sf.key}
                                            onClick={() => setFilterStatus(sf.key)}
                                            className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${
                                                filterStatus === sf.key
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary border border-zinc-200 dark:border-zinc-700 hover:border-primary/40 bg-white dark:bg-zinc-900'
                                            }`}
                                        >
                                            {sf.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grade */}
                            <div className="flex items-center gap-4 px-5 py-3">
                                <span className="w-14 shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                                    {t.quests.filterGrade.replace(':', '')}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(['all', ...GRADES]).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setFilterGrade(g)}
                                            className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${
                                                filterGrade === g
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary border border-zinc-200 dark:border-zinc-700 hover:border-primary/40 bg-white dark:bg-zinc-900'
                                            }`}
                                        >
                                            {g === 'all' ? t.quests.filterAll : g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Budget */}
                            <div className="flex items-center gap-4 px-5 py-3">
                                <span className="w-14 shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                                    {t.quests.filterBudget.replace(':', '')}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {BUDGET_RANGES.map(b => (
                                        <button
                                            key={b}
                                            onClick={() => setFilterBudget(b)}
                                            className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${
                                                filterBudget === b
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary border border-zinc-200 dark:border-zinc-700 hover:border-primary/40 bg-white dark:bg-zinc-900'
                                            }`}
                                        >
                                            {budgetLabel[b]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Results header ── */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-0.5 h-4 bg-primary" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                <span className="text-primary">{filtered.length}</span> {t.quests.title}
                            </span>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <PerspectiveTransition
                        id={`lobby-${filterGrade}-${filterBudget}-${filterStatus}`}
                        direction={0}
                        className="flex-grow pb-24"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6">
                                <SquareLoader />
                                <span className="text-xs font-mono uppercase tracking-widest text-primary/60 animate-pulse">Scanning Nexus Nodes...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                <span className="material-symbols-outlined !text-[48px] text-slate-300 mb-4">dataset_linked</span>
                                <p className="text-sm font-semibold text-slate-500">
                                    {t.quests.noOpenQuests}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    {t.quests.noOpenQuestsDesc}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map((c: Collaboration, index: number) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
                                        className="h-full"
                                    >
                                        <Link
                                            href={`/collaborations/${c.id}`}
                                            className="sg-task-card group relative flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-900/60 dark:hover:border-slate-600/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300"
                                        >
                                            {/* Top accent bar — color per status */}
                                            <div className={`h-0.5 w-full ${
                                                c.status === 'OPEN' ? 'bg-blue-400' :
                                                c.status === 'ACTIVE' ? 'bg-emerald-400' :
                                                c.status === 'PENDING_APPROVAL' ? 'bg-amber-400' :
                                                'bg-slate-200 dark:bg-slate-700'
                                            }`} />

                                            <div className="p-5 flex flex-col h-full">
                                                {/* Header row */}
                                                <div className="flex items-start justify-between mb-3 gap-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[9px] font-mono text-primary/70 font-bold tracking-widest uppercase">
                                                            {c.id.split('-')[0].toUpperCase()}
                                                        </span>
                                                        {c.grade && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/10">
                                                                {c.grade}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusStyle[c.status] || ''}`}>
                                                        {statusLabel[c.status] || c.status}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors duration-300 line-clamp-2 leading-snug mb-2 tracking-tight">
                                                    {c.title}
                                                </h4>

                                                {/* Description */}
                                                <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-white/70 transition-colors duration-300 font-medium line-clamp-2 leading-relaxed flex-grow mb-4">
                                                    {c.description || t.quests.noDescription}
                                                </p>

                                                {/* Footer */}
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 group-hover:border-white/20 transition-colors duration-300 flex items-center justify-between gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] text-slate-400 group-hover:text-white/50 transition-colors duration-300 uppercase tracking-wider font-bold">{t.quests.budget}</span>
                                                        <span className="text-base font-black text-slate-900 dark:text-white group-hover:text-white transition-colors duration-300 flex items-baseline gap-1 leading-none">
                                                            {c.total_budget || '0'}
                                                            <span className="text-[10px] text-primary group-hover:text-cyan-300 transition-colors duration-300 font-bold">USDC</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-white/50 transition-colors duration-300">
                                                        <span className="material-symbols-outlined !text-[14px]">schedule</span>
                                                        <span className="text-[10px] font-medium">
                                                            {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
