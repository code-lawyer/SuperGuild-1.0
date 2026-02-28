'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';

export default function ObsidianStelePage() {
    const t = useT();

    return (
        <div className="relative min-h-screen selection:bg-primary/20">
            {/* Terminal Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col relative z-10 w-full min-h-screen">
                <PageHeader
                    title={t.council.obsidianStele}
                    description={t.council.obsidianSteleDesc}
                />

                <div className="mt-12 flex flex-col items-center justify-center py-40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center"
                    >
                        <span className="material-symbols-outlined !text-[64px] text-slate-300 dark:text-slate-700 mb-6 animate-pulse">
                            auto_stories
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                            Archives are Empty
                        </h3>
                        <p className="text-sm text-slate-500 font-semibold tracking-wide uppercase">
                            Registry Status: Active
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
