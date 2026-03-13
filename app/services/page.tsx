'use client';

import { useT } from '@/lib/i18n';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';

const channels = [
    {
        href: '/services/infrastructure',
        icon: 'terminal',
        num: '01',
        accentClass: 'text-cyan-400',
        glowClass: 'hover:shadow-[0_0_40px_-8px_rgba(34,211,238,0.25)] hover:border-cyan-500/50',
        topBarClass: 'from-cyan-500 to-blue-500',
        iconBg: 'bg-cyan-500/10 border-cyan-500/20',
        iconColor: 'text-cyan-400',
        titleKey: 'entry_infra_title' as const,
        descKey: 'entry_infra_desc' as const,
    },
    {
        href: '/services/core',
        icon: 'security_update_good',
        num: '02',
        accentClass: 'text-emerald-400',
        glowClass: 'hover:shadow-[0_0_40px_-8px_rgba(52,211,153,0.25)] hover:border-emerald-500/50',
        topBarClass: 'from-emerald-500 to-teal-400',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-400',
        titleKey: 'entry_core_title' as const,
        descKey: 'entry_core_desc' as const,
    },
    {
        href: '/services/consulting',
        icon: 'person_search',
        num: '03',
        accentClass: 'text-violet-400',
        glowClass: 'hover:shadow-[0_0_40px_-8px_rgba(167,139,250,0.25)] hover:border-violet-500/50',
        topBarClass: 'from-violet-500 to-purple-500',
        iconBg: 'bg-violet-500/10 border-violet-500/20',
        iconColor: 'text-violet-400',
        titleKey: 'entry_consulting_title' as const,
        descKey: 'entry_consulting_desc' as const,
    },
];

export default function ServicesPage() {
    const t = useT();

    return (
        <ServicePageLayout title={t.services.entry_title} description={t.services.entry_subtitle}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px mt-8 bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800">
                {channels.map((ch, i) => (
                    <motion.div
                        key={ch.href}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-white dark:bg-zinc-950"
                    >
                        <Link
                            href={ch.href}
                            className={`relative flex flex-col h-full p-8 border border-transparent transition-all duration-300 group overflow-hidden ${ch.glowClass}`}
                        >
                            {/* Top gradient accent bar — appears on hover */}
                            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${ch.topBarClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            {/* Ghost channel number */}
                            <div className={`absolute -bottom-4 -right-2 font-mono text-[7rem] font-black leading-none ${ch.accentClass} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-300 pointer-events-none select-none`}>
                                {ch.num}
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Channel label */}
                                <div className={`text-[9px] font-mono font-bold ${ch.accentClass} uppercase tracking-[0.25em] mb-5`}>
                                    // CH_{ch.num}
                                </div>

                                {/* Icon */}
                                <div className={`w-11 h-11 ${ch.iconBg} border flex items-center justify-center mb-6`}
                                    style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)" }}>
                                    <span className={`material-symbols-outlined !text-[22px] ${ch.iconColor}`}>
                                        {ch.icon}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono mb-3 leading-tight">
                                    {t.services[ch.titleKey]}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed flex-1">
                                    {t.services[ch.descKey]}
                                </p>

                                {/* CTA */}
                                <div className={`mt-8 pt-5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between`}>
                                    <span className={`text-[10px] font-bold ${ch.accentClass} uppercase tracking-[0.2em]`}>
                                        {t.services.enter_channel}
                                    </span>
                                    <span className={`material-symbols-outlined !text-[18px] ${ch.accentClass} group-hover:translate-x-1.5 transition-transform duration-200`}>
                                        arrow_forward
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </ServicePageLayout>
    );
}
