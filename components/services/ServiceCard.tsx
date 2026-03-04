'use client';

import { useT } from '@/lib/i18n';
import type { Service } from '@/hooks/useServices';

interface ServiceCardProps {
    service: Service;
    isUnlocked?: boolean;
    onUnlock?: () => void;
    isUnlocking?: boolean;
}

export default function ServiceCard({ service, isUnlocked, onUnlock, isUnlocking }: ServiceCardProps) {
    const t = useT();

    const iconMap: Record<string, string> = {
        infrastructure: 'hub',
        specialized: 'build',
        consulting: 'support_agent',
    };

    return (
        <div className="group relative bg-white dark:bg-surface-dark rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-antigravity-hover transition-colors transition-transform duration-300 hover:-translate-y-1">
            {/* Status dot */}
            <div className={`absolute top-8 right-8 w-2 h-2 rounded-full ${isUnlocked ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-200 dark:bg-slate-600 group-hover:bg-emerald-400'
                } transition-colors`} />

            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined !text-[28px] font-light">
                    {iconMap[service.category] || 'widgets'}
                </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{service.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 min-h-[40px]">
                {service.payload_config?.type || ''}
            </p>

            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-mono text-slate-400">
                    {isUnlocked ? <span className="text-emerald-500">{t.common.active}</span> : `${service.price} VCP`}
                </span>
                {isUnlocked ? (
                    <button className="px-5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                        {t.common.manage}
                    </button>
                ) : (
                    <button
                        onClick={onUnlock}
                        disabled={isUnlocking}
                        className="px-5 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-colors shadow-lg shadow-slate-200 dark:shadow-none disabled:opacity-50"
                    >
                        {isUnlocking ? (
                            <span className="material-symbols-outlined animate-spin !text-[16px]">progress_activity</span>
                        ) : (
                            t.common.activate
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
