'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { useGovernorStats } from '@/hooks/useProposals';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CouncilPage() {
    const t = useT();
    const { proposalCount, totalSupply, threshold, isLoading } = useGovernorStats();

    const modules = [
        {
            title: t.council.sparkPlaza,
            desc: t.council.sparkPlazaDesc,
            href: '/council/proposals',
            icon: 'auto_awesome_motion',
            accent: 'text-amber-500',
            accentBg: 'bg-amber-500/8',
            accentBorder: 'group-hover:border-amber-500/30',
            stat: proposalCount > 0 ? `${proposalCount}` : null,
            statLabel: t.council.proposalCount,
        },
        {
            title: t.council.handOfJustice,
            desc: t.council.handOfJusticeDesc,
            href: '/council/arbitration',
            icon: 'gavel',
            accent: 'text-blue-500',
            accentBg: 'bg-blue-500/8',
            accentBorder: 'group-hover:border-blue-500/30',
            stat: null,
            statLabel: null,
        },
        {
            title: t.council.throneOfKindling,
            desc: t.council.throneOfKindlingDesc,
            href: '/council/ai',
            icon: 'psychology',
            accent: 'text-emerald-500',
            accentBg: 'bg-emerald-500/8',
            accentBorder: 'group-hover:border-emerald-500/30',
            stat: null,
            statLabel: null,
        },
        {
            title: t.council.obsidianStele,
            desc: t.council.obsidianSteleDesc,
            href: '/council/records',
            icon: 'history_edu',
            accent: 'text-purple-500',
            accentBg: 'bg-purple-500/8',
            accentBorder: 'group-hover:border-purple-500/30',
            stat: null,
            statLabel: null,
        },
    ];

    return (
        <div className="relative selection:bg-primary/20">
            {/* Subtle grid background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full min-h-[calc(100vh-80px)] relative z-10">
                <PageHeader
                    title={t.council.title}
                    description={t.council.subtitle}
                />

                {/* Live governance stats bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-center gap-6 mb-10 px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white/60 dark:bg-slate-900/40"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.council.governanceStatus}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">VCP</span>
                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                            {isLoading ? '—' : totalSupply.toLocaleString()}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">1%</span>
                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                            {isLoading ? '—' : threshold.toLocaleString()}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined !text-[14px] text-slate-400">description</span>
                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                            {isLoading ? '—' : proposalCount}
                        </span>
                    </div>
                </motion.div>

                {/* Module cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-24">
                    {modules.map((m, index) => (
                        <motion.div
                            key={m.href}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.08 }}
                        >
                            <Link
                                href={m.href}
                                className={`group relative flex flex-col p-7 bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 ${m.accentBorder} rounded-xl hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 transition-all duration-300 overflow-hidden h-full`}
                            >
                                {/* Top accent line */}
                                <div className={`absolute top-0 left-0 right-0 h-[2px] ${m.accentBg} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                {/* Corner index */}
                                <div className="absolute top-5 right-6 text-[11px] font-mono font-bold text-slate-300 dark:text-slate-700 select-none">
                                    {`0${index + 1}`}
                                </div>

                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-lg ${m.accentBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105`}>
                                    <span className={`material-symbols-outlined !text-[22px] ${m.accent}`}>
                                        {m.icon}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 font-mono group-hover:text-primary transition-colors">
                                    {m.title}
                                </h3>

                                {/* Description */}
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-5 max-w-[320px]">
                                    {m.desc}
                                </p>

                                {/* Footer: stat + enter link */}
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                    {m.stat ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[20px] font-black text-slate-800 dark:text-slate-200 tabular-nums">{m.stat}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.statLabel}</span>
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-all group-hover:gap-2.5">
                                        <span>{t.council.access}</span>
                                        <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
