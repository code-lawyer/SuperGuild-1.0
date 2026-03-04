'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CouncilPage() {
    const t = useT();

    const modules = [
        {
            title: t.council.sparkPlaza,
            desc: t.council.sparkPlazaDesc,
            href: '/council/proposals',
            icon: 'auto_awesome_motion',
            color: 'from-orange-500 to-red-500'
        },
        {
            title: t.council.handOfJustice,
            desc: t.council.handOfJusticeDesc,
            href: '/council/arbitration',
            icon: 'gavel',
            color: 'from-blue-500 to-indigo-500'
        },
        {
            title: t.council.throneOfKindling,
            desc: t.council.throneOfKindlingDesc,
            href: '/council/ai',
            icon: 'psychology',
            color: 'from-emerald-500 to-teal-500'
        },
        {
            title: t.council.obsidianStele,
            desc: t.council.obsidianSteleDesc,
            href: '/council/records',
            icon: 'history_edu',
            color: 'from-purple-500 to-pink-500'
        }
    ];

    return (
        <div className="relative selection:bg-primary/20">

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full h-full min-h-[calc(100vh-80px)]">
                <PageHeader
                    title={t.council.title}
                    description={t.council.subtitle}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
                    {modules.map((m, index) => (
                        <motion.div
                            key={m.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={m.href}
                                className="group relative flex flex-col p-8 bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-colors transition-transform duration-500 overflow-hidden h-full"
                                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="absolute bottom-4 right-4 text-[100px] font-black text-slate-100 dark:text-slate-800/20 select-none pointer-events-none z-0 leading-none">
                                    {`0${index + 1}`}
                                </div>

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6 shadow-sm group-hover:border-primary/30 transition-colors transition-transform">
                                        <span className={`material-symbols-outlined !text-[28px] bg-gradient-to-br ${m.color} bg-clip-text text-transparent`}>
                                            {m.icon}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 group-hover:text-primary transition-colors font-mono">
                                        {m.title}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
                                        {m.desc}
                                    </p>
                                </div>

                                <div className="mt-auto pt-8 flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-colors transition-transform translate-y-2 group-hover:translate-y-0">
                                    <span>{t.council.access}</span>
                                    <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* System Stats Footer */}
                <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-6 pb-12 flex flex-wrap justify-between items-center gap-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span>Governance Status: Active</span>
                        </div>
                        <div className="w-[2px] h-3 bg-slate-200 dark:bg-slate-800" />
                        <span>Security: Secure</span>
                    </div>
                    <div className="flex items-center gap-6 text-slate-400/80">
                        <span>{`Latency: ${Math.floor(Math.random() * 20 + 10)}ms`}</span>
                        <span className="font-mono text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">
                            {`ID: SG-${Date.now().toString(16).slice(-6).toUpperCase()}`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
