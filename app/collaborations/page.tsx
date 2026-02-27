'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { useMyCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import { PageHeader } from '@/components/ui/PageHeader';
import { PerspectiveTransition } from '@/components/ui/PerspectiveTransition';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { RequireWallet } from '@/components/ui/RequireWallet';
import { useRouter } from 'next/navigation';

export default function CollaborationsPage() {
    const t = useT();
    const router = useRouter();
    const { data: collabs, isLoading } = useMyCollaborations();
    const [activeTab, setActiveTab] = useState('all');

    const tabs = [
        { key: 'all', label: t.quests.allQuests },
        { key: 'active', label: t.quests.activeQuests, statuses: ['ACTIVE', 'LOCKED'] },
        { key: 'pending', label: t.quests.pendingQuests, statuses: ['OPEN', 'PENDING_APPROVAL'] },
        { key: 'completed', label: t.quests.completedQuests, statuses: ['SETTLED'] },
        { key: 'cancelled', label: t.quests.cancelledQuests, statuses: ['CANCELLED', 'DISPUTED'] },
    ];

    const items = collabs ?? [];
    const currentTab = tabs.find(t => t.key === activeTab);
    const filtered = activeTab === 'all' ? items : items.filter((c: Collaboration) => currentTab?.statuses?.includes(c.status));

    const statusStyle: Record<string, string> = {
        OPEN: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
        PENDING_APPROVAL: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30',
        ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
        LOCKED: 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/30',
        SETTLED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        CANCELLED: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
        DISPUTED: 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30',
    };

    const statusLabel: Record<string, string> = {
        OPEN: t.common.pending,
        PENDING_APPROVAL: t.common.pending,
        ACTIVE: t.common.active,
        LOCKED: t.common.locked,
        SETTLED: t.common.completed,
        CANCELLED: t.common.cancelled,
        DISPUTED: t.common.disputed,
    };

    return (
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col min-h-screen">
            <PageHeader
                title={t.quests.title}
                description={t.quests.subtitle}
                action={
                    <RequireWallet onAuthorized={() => router.push('/collaborations/create')}>
                        {(handleClick) => (
                            <MagneticButton
                                onClick={handleClick}
                                className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined !text-[18px]">add</span>
                                {t.quests.newQuest}
                            </MagneticButton>
                        )}
                    </RequireWallet>
                }
            />

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key
                            ? 'bg-primary text-white'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <PerspectiveTransition
                id={activeTab}
                direction={tabs.findIndex(t => t.key === activeTab)}
                className="flex-grow pb-24"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <span className="material-symbols-outlined animate-spin !text-[32px]">progress_activity</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="material-symbols-outlined !text-[48px] text-slate-300 mb-4">task_alt</span>
                        <p className="text-lg font-semibold text-slate-500 mb-1">{t.quests.noQuests}</p>
                        <p className="text-sm text-slate-400">{activeTab === 'all' ? t.quests.noQuestsDesc : t.quests.noQuestsFilterDesc}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((c: Collaboration) => (
                            <Link
                                key={c.id}
                                href={`/collaborations/${c.id}`}
                                className="group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-antigravity-hover transition-all duration-300 hover:-translate-y-1 block"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 pr-2">
                                        {c.title}
                                    </h4>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${statusStyle[c.status] || ''}`}>
                                        {statusLabel[c.status] || c.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6 min-h-[40px]">{c.description || ''}</p>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[14px]">payments</span>
                                        {c.total_budget ? `${c.total_budget} VCP` : '-'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </PerspectiveTransition>
        </div>
    );
}
