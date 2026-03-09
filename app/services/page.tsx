'use client';

import { useT } from '@/lib/i18n';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';

const channels = [
    {
        href: '/services/infrastructure',
        icon: 'terminal',
        gradient: 'from-blue-500 to-cyan-400',
        borderColor: 'border-blue-500/30',
        titleKey: 'entry_infra_title' as const,
        descKey: 'entry_infra_desc' as const,
    },
    {
        href: '/services/core',
        icon: 'security_update_good',
        gradient: 'from-emerald-500 to-teal-400',
        borderColor: 'border-emerald-500/30',
        titleKey: 'entry_core_title' as const,
        descKey: 'entry_core_desc' as const,
    },
    {
        href: '/services/consulting',
        icon: 'person_search',
        gradient: 'from-purple-500 to-pink-400',
        borderColor: 'border-purple-500/30',
        titleKey: 'entry_consulting_title' as const,
        descKey: 'entry_consulting_desc' as const,
    },
];

export default function ServicesPage() {
    const t = useT();

    return (
        <ServicePageLayout title={t.services.entry_title} description={t.services.entry_subtitle}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {channels.map((ch, i) => (
                    <motion.div
                        key={ch.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Link
                            href={ch.href}
                            className={`block p-8 border ${ch.borderColor} bg-white/50 dark:bg-slate-900/30 hover:shadow-lg transition-all group`}
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
                        >
                            <div className={`w-14 h-14 rounded-sm border ${ch.borderColor} bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                                <span className={`material-symbols-outlined !text-[28px] bg-gradient-to-br ${ch.gradient} bg-clip-text text-transparent`}>
                                    {ch.icon}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono mb-2">
                                {t.services[ch.titleKey]}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                {t.services[ch.descKey]}
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                                <span>{t.services.enter_channel}</span>
                                <span className="material-symbols-outlined !text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </ServicePageLayout>
    );
}
