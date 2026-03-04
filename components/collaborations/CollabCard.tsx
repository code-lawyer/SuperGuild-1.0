'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import type { Collaboration } from '@/hooks/useCollaborations';

interface CollabCardProps {
    collab: Collaboration;
}

const statusStyle: Record<string, string> = {
    OPEN: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    PENDING_APPROVAL: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400',
    LOCKED: 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400',
    SETTLED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
    CANCELLED: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400',
    DISPUTED: 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
};

export default function CollabCard({ collab }: CollabCardProps) {
    const t = useT();

    const statusLabels: Record<string, string> = {
        OPEN: t.common.pending,
        PENDING_APPROVAL: t.common.pending,
        ACTIVE: t.common.active,
        LOCKED: t.common.locked,
        SETTLED: t.common.completed,
        CANCELLED: t.common.cancelled,
        DISPUTED: t.common.disputed,
    };

    return (
        <Link
            href={`/collaborations/${collab.id}`}
            className="group bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-antigravity-hover transition-colors transition-transform duration-300 hover:-translate-y-1 block"
        >
            <div className="flex items-start justify-between mb-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 pr-2">
                    {collab.title}
                </h4>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${statusStyle[collab.status] || ''}`}>
                    {statusLabels[collab.status] || collab.status}
                </span>
            </div>

            <p className="text-sm text-slate-500 line-clamp-2 mb-6 min-h-[40px]">{collab.description || ''}</p>

            <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[14px]">payments</span>
                    {collab.total_budget ? `${collab.total_budget} VCP` : '-'}
                </span>
                <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
                    {new Date(collab.created_at).toLocaleDateString()}
                </span>
            </div>
        </Link>
    );
}
