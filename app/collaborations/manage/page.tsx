'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { useMyCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import { PageHeader } from '@/components/ui/PageHeader';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { RequireWallet } from '@/components/ui/RequireWallet';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';

export default function MyDeskPage() {
    const t = useT();
    const router = useRouter();
    const { address } = useAccount();
    const { data: myCollabs, isLoading } = useMyCollaborations();
    const [roleFilter, setRoleFilter] = useState<'all' | 'published' | 'accepted'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const statusTabs = [
        { key: 'all', label: t.quests.allQuests },
        { key: 'active', label: t.quests.activeQuests, statuses: ['ACTIVE', 'LOCKED'] },
        { key: 'pending', label: t.quests.pendingQuests, statuses: ['OPEN', 'PENDING_APPROVAL'] },
        { key: 'completed', label: t.quests.completedQuests, statuses: ['SETTLED'] },
        { key: 'cancelled', label: t.quests.cancelledQuests, statuses: ['CANCELLED', 'DISPUTED'] },
    ];

    const statusStyle: Record<string, string> = {
        OPEN: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20',
        PENDING_APPROVAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',
        ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
        LOCKED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20',
        SETTLED: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20',
        CANCELLED: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/20',
        DISPUTED: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20',
    };

    const statusLabel: Record<string, string> = {
        OPEN: t.common.open,
        PENDING_APPROVAL: t.common.pendingApproval,
        ACTIVE: t.common.inProgress,
        LOCKED: t.common.locked,
        SETTLED: t.common.settled,
        CANCELLED: t.common.cancelled,
        DISPUTED: t.common.disputed,
    };

    const filtered = useMemo(() => {
        let items = myCollabs ?? [];
        const addrLower = address?.toLowerCase();

        // Role filter
        if (roleFilter === 'published') {
            items = items.filter(c => c.initiator_id?.toLowerCase() === addrLower);
        } else if (roleFilter === 'accepted') {
            items = items.filter(c =>
                c.provider_id?.toLowerCase() === addrLower ||
                c.pending_provider_id?.toLowerCase() === addrLower
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            const tab = statusTabs.find(t => t.key === statusFilter);
            if (tab?.statuses) {
                items = items.filter(c => tab.statuses!.includes(c.status));
            }
        }

        return items;
    }, [myCollabs, roleFilter, statusFilter, address]);

    const isInitiator = (c: Collaboration) => c.initiator_id?.toLowerCase() === address?.toLowerCase();
    const isCancelled = (c: Collaboration) => c.status === 'CANCELLED';

    return (
        <WalletGatePage>
            <div className="relative min-h-screen selection:bg-primary/20">
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]" />
                </div>

                <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col relative z-10 min-h-screen">
                    <PageHeader
                        title={t.quests.myDesk}
                        description={t.quests.myDeskDesc}
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

                    {/* Role Toggle */}
                    <div className="flex items-center gap-1 mb-4 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg w-fit">
                        {([
                            { key: 'all' as const, label: t.quests.allQuests, icon: 'apps' },
                            { key: 'published' as const, label: t.quests.publishedByMe, icon: 'campaign' },
                            { key: 'accepted' as const, label: t.quests.acceptedByMe, icon: 'engineering' },
                        ]).map(item => (
                            <button
                                key={item.key}
                                onClick={() => setRoleFilter(item.key)}
                                className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${roleFilter === item.key
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <span className="material-symbols-outlined !text-[14px]">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`px-5 py-2 text-xs font-bold transition-colors rounded-lg ${statusFilter === tab.key
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-primary border border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
                            <span className="material-symbols-outlined animate-spin !text-[40px] text-primary">progress_activity</span>
                            <span className="text-xs font-mono uppercase tracking-widest animate-pulse">Scanning Nexus Nodes...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                            <span className="material-symbols-outlined !text-[48px] text-slate-300 mb-4">work_off</span>
                            <p className="text-sm font-semibold text-slate-500">{t.quests.noMyQuests}</p>
                            <p className="text-xs text-slate-400 mt-2">{t.quests.noMyQuestsDesc}</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-24">
                            {filtered.map((c: Collaboration, index: number) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <div className={`bg-white dark:bg-slate-900/60 border rounded-xl p-6 transition-all ${isCancelled(c)
                                        ? 'border-slate-200/40 dark:border-slate-800/40 opacity-60'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-md'
                                    }`}>
                                        {/* Cancelled overlay banner */}
                                        {isCancelled(c) && (
                                            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                                                <span className="material-symbols-outlined !text-[16px] text-gray-400">block</span>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.quests.questCancelledDesc}</span>
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: main info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusStyle[c.status]}`}>
                                                        {statusLabel[c.status]}
                                                    </span>
                                                    {c.grade && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">{t.quests.grade} {c.grade}</span>
                                                    )}
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {isInitiator(c) ? t.quests.publishedByMe : t.quests.acceptedByMe}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{c.title}</h3>

                                                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                                    {c.description || t.quests.noDescription}
                                                </p>

                                                {/* Meta row */}
                                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined !text-[14px]">payments</span>
                                                        <span className="font-bold text-slate-600 dark:text-slate-300">{c.total_budget}</span> USDC
                                                    </span>
                                                    {c.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined !text-[14px]">schedule</span>
                                                            {t.quests.deadlinePrefix} {new Date(c.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
                                                        {new Date(c.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right: action */}
                                            <div className="shrink-0 flex flex-col items-end gap-3">
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{c.total_budget}</span>
                                                    <span className="text-sm text-primary font-bold ml-1">USDC</span>
                                                </div>

                                                {!isCancelled(c) && (
                                                    <Link
                                                        href={`/collaborations/${c.id}`}
                                                        className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                                                    >
                                                        {t.quests.viewDetail}
                                                        <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
                                                    </Link>
                                                )}
                                                {isCancelled(c) && (
                                                    <Link
                                                        href={`/collaborations/${c.id}`}
                                                        className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-500 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                                                    >
                                                        {t.quests.viewDetail}
                                                        <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </WalletGatePage>
    );
}
