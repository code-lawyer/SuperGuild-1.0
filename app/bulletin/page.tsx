'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useBulletins, type Bulletin } from '@/hooks/useBulletins';
import { PageHeader } from '@/components/ui/PageHeader';

export default function BulletinPage() {
    const t = useT();
    const [activeCategory, setActiveCategory] = useState('all');
    const { bulletins, isLoading } = useBulletins(activeCategory);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const categories = [
        { key: 'all', label: t.common.all },
        { key: 'general', label: t.bulletin.general },
        { key: 'update', label: t.bulletin.update },
        { key: 'event', label: t.bulletin.event },
    ];

    const categoryStyle: Record<string, string> = {
        general: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        update: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        event: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    };

    const categoryLabel: Record<string, string> = {
        general: t.bulletin.general,
        update: t.bulletin.update,
        event: t.bulletin.event,
    };

    return (
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col min-h-screen">
            <PageHeader
                title={t.bulletin.title}
                description={t.bulletin.subtitle}
            />

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6">
                {categories.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.key
                            ? 'bg-primary text-white'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Bulletin List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <span className="material-symbols-outlined animate-spin !text-[32px]">progress_activity</span>
                </div>
            ) : bulletins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined !text-[48px] text-slate-300 mb-4">campaign</span>
                    <p className="text-lg font-semibold text-slate-500 mb-1">{t.bulletin.noBulletins}</p>
                </div>
            ) : (
                <div className="space-y-4 pb-24">
                    {bulletins.map((b: Bulletin) => {
                        const isExpanded = expandedId === b.id;
                        const hasAttachments = b.bulletin_attachments && b.bulletin_attachments.length > 0;
                        return (
                            <div
                                key={b.id}
                                className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-antigravity-hover transition-all duration-300 overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                                    className="w-full text-left p-6 flex items-start gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {b.is_pinned && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                    <span className="material-symbols-outlined !text-[12px]">push_pin</span>
                                                    {t.bulletin.pinned}
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle[b.category] || categoryStyle.general}`}>
                                                {categoryLabel[b.category] || b.category}
                                            </span>
                                            {hasAttachments && (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <span className="material-symbols-outlined !text-[14px]">attach_file</span>
                                                    {b.bulletin_attachments!.length}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 truncate">
                                            {b.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>{b.author}</span>
                                            <span>{new Date(b.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className={`material-symbols-outlined !text-[20px] text-slate-400 transition-transform duration-200 mt-1 ${isExpanded ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                            {b.content}
                                        </div>

                                        {hasAttachments && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                    {t.bulletin.attachments}
                                                </h4>
                                                <div className="space-y-2">
                                                    {b.bulletin_attachments!.map(att => (
                                                        <a
                                                            key={att.id}
                                                            href={att.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                                                        >
                                                            <span className="material-symbols-outlined !text-[18px] text-primary">description</span>
                                                            <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{att.file_name}</span>
                                                            {att.file_size && (
                                                                <span className="text-xs text-slate-400">
                                                                    {(att.file_size / 1024 / 1024).toFixed(1)} MB
                                                                </span>
                                                            )}
                                                            <span className="material-symbols-outlined !text-[16px] text-slate-400">download</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
