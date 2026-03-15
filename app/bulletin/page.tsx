'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useBulletins, type Bulletin } from '@/hooks/useBulletins';
import { SquareLoader } from '@/components/ui/SquareLoader';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from '@/components/ui/Markdown';

const categoryStyle: Record<string, string> = {
    general: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    update: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    event: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export default function GuildBulletinPage() {
    const t = useT();
    const [activeCategory, setActiveCategory] = useState('guild');
    const { bulletins, isLoading } = useBulletins(activeCategory);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const categories = [
        { key: 'guild', label: t.common.all },
        { key: 'general', label: t.bulletin.general },
        { key: 'update', label: t.bulletin.update },
        { key: 'event', label: t.bulletin.event },
    ];

    return (
        <div className="relative min-h-screen selection:bg-primary/20">
            {/* Terminal Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col relative z-10">
                <PageHeader
                    title={t.bulletin.title}
                    description={t.bulletin.subtitle}
                />

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-10">
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`px-5 py-2 text-xs font-bold transition-colors rounded-lg ${activeCategory === cat.key
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-primary border border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Bulletin List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <SquareLoader />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary/60 animate-pulse">{t.common.loading}</span>
                    </div>
                ) : bulletins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                        <span className="material-symbols-outlined !text-[48px] text-slate-300 mb-4">notifications_off</span>
                        <p className="text-sm font-semibold text-slate-500">{t.bulletin.noBulletins}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 pb-32">
                        {bulletins.map((b: Bulletin) => {
                            const isExpanded = expandedId === b.id;
                            const hasAttachments = b.bulletin_attachments && b.bulletin_attachments.length > 0;
                            return (
                                <motion.div
                                    layout
                                    key={b.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`group border transition-colors duration-300 relative overflow-hidden ${isExpanded
                                        ? 'border-primary/40 bg-white dark:bg-bg-dark shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]'
                                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:border-primary/30 hover:translate-x-1'
                                        }`}
                                    style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}
                                >
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                                        className="w-full text-left p-6 md:p-8 flex items-start gap-6"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                {b.is_pinned && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-tighter">
                                                        <span className="material-symbols-outlined !text-[12px]">push_pin</span>
                                                        {t.bulletin.pinned}
                                                    </span>
                                                )}
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-black border uppercase tracking-tighter ${categoryStyle[b.category] || categoryStyle.general}`}>
                                                    {b.category}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{`ID: ${b.id.split('-')[0]}`}</span>
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
                                                {b.title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 uppercase tracking-[0.1em]">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[14px]">corporate_fare</span>
                                                    SuperGuild
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[14px]">schedule</span>
                                                    {new Date(b.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-4 h-full">
                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white border-primary rotate-180' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                                                <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-8 pb-8 md:px-10 md:pb-10 border-t border-slate-100 dark:border-slate-800/50 pt-8 mt-2">
                                                    <div className="mb-8">
                                                        <Markdown content={b.content} />
                                                    </div>

                                                    {b.category === 'squad_signal' && b.squad_signal_meta && (
                                                        <div className="mt-3 space-y-2 mb-6">
                                                            <div className="flex items-center gap-2 text-[11px] font-bold text-primary/70 uppercase tracking-wider">
                                                                <span className="material-symbols-outlined !text-[14px]">group</span>
                                                                {t.quests.squadRoles}
                                                            </div>
                                                            {(b.squad_signal_meta as any).roles?.map((role: any, i: number) => (
                                                                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                                                                    <div>
                                                                        <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{role.title}</span>
                                                                        <div className="flex gap-1 mt-1 flex-wrap">
                                                                            {(role.tags || []).map((tag: string) => (
                                                                                <span key={tag} className="text-[10px] font-mono text-slate-400">#{tag}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right shrink-0 ml-4">
                                                                        <span className="text-[13px] font-black text-primary">{role.budget} USDC</span>
                                                                        <p className="text-[10px] text-slate-400">{role.slots} {t.quests.roleSlots}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(b.squad_signal_meta as any).parent_collab_id && (
                                                                <a
                                                                    href={`/collaborations/${(b.squad_signal_meta as any).parent_collab_id}`}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 mt-1 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined !text-[12px]">open_in_new</span>
                                                                    {t.quests.squadSourceTask}：{(b.squad_signal_meta as any).parent_collab_title}
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}

                                                    {hasAttachments && (
                                                        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-1 h-3 bg-primary" />
                                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                                    {t.bulletin.attachments}
                                                                </h4>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {b.bulletin_attachments!.map(att => (
                                                                    <a
                                                                        key={att.id}
                                                                        href={att.file_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-3 px-4 py-3 rounded border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary/40 hover:bg-primary/5 transition-colors group/att"
                                                                    >
                                                                        <span className="material-symbols-outlined !text-[20px] text-primary opacity-60">description</span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover/att:text-primary">{att.file_name}</div>
                                                                            {att.file_size && (
                                                                                <div className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-tighter">
                                                                                    {(att.file_size / 1024 / 1024).toFixed(2)} MB
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className="material-symbols-outlined !text-[18px] text-slate-400 group-hover/att:text-primary transition-colors">download</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
