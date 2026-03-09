'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';
import { ServiceModal, ServiceModalHeader } from '@/components/services/ServiceModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoreServicesPage() {
    const t = useT();
    const { services, isLoading } = useServices(2);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedSolution, setSelectedSolution] = useState<Service | null>(null);

    const categories = services;
    const activeCat = activeCategory
        ? categories.find(c => c.id === activeCategory)
        : categories[0];

    return (
        <ServicePageLayout title={t.services.entry_core_title} description={t.services.entry_core_desc}>
            {isLoading ? (
                <div className="flex items-center justify-center py-32 text-slate-400">
                    <span className="material-symbols-outlined animate-spin !text-[40px] text-primary">progress_activity</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest mt-8">
                    [ {t.services.noServices} ]
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6 mt-8">
                    {/* Category Nav */}
                    <aside className="w-full md:w-56 shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.services.core_select_category}</p>
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-tight transition-colors border-l-2 ${
                                        (activeCat?.id === cat.id)
                                            ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {cat.icon && <span className="material-symbols-outlined !text-[16px]">{cat.icon}</span>}
                                        {cat.title}
                                    </div>
                                    <span className="text-[10px] font-normal text-slate-400 mt-0.5 block">
                                        {cat.children?.length ?? 0} {t.services.solutions_count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Solutions Grid */}
                    <div className="flex-1 min-w-0">
                        {activeCat && (
                            <>
                                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-4">
                                    {activeCat.title}
                                </h2>
                                {(!activeCat.children || activeCat.children.length === 0) ? (
                                    <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                                        [ {t.services.noServices} ]
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeCat.children.map((sol, i) => (
                                            <motion.div
                                                key={sol.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                onClick={() => setSelectedSolution(sol)}
                                                className="cursor-pointer group border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 p-5 hover:border-emerald-500/40 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.15)] transition-all"
                                                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)" }}
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    {sol.icon && (
                                                        <div className="w-8 h-8 bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined !text-[16px] text-emerald-500">{sol.icon}</span>
                                                        </div>
                                                    )}
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">{sol.title}</h4>
                                                </div>
                                                {sol.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{sol.description}</p>
                                                )}
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">
                                                        {sol.price > 0 ? `${sol.price} USDC` : t.services.price_negotiable}
                                                    </span>
                                                    <span className="text-xs text-emerald-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                        {t.services.view_detail} <span className="material-symbols-outlined !text-[12px]">arrow_forward</span>
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Solution Modal */}
            <AnimatePresence>
                {selectedSolution && (
                    <SolutionModal
                        service={selectedSolution}
                        onClose={() => setSelectedSolution(null)}
                    />
                )}
            </AnimatePresence>
        </ServicePageLayout>
    );
}

function SolutionModal({ service: s, onClose }: { service: Service; onClose: () => void }) {
    const t = useT();
    const payloadType = s.payload_config?.type;

    return (
        <ServiceModal onClose={onClose} maxWidth="max-w-md">
            <ServiceModalHeader title={s.title} onClose={onClose} />
            <div className="p-6 space-y-4">
                {s.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
                )}

                {s.documents && s.documents.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.services.infra_docs}</p>
                        <div className="space-y-1">
                            {s.documents.map((doc, i) => (
                                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-primary hover:underline py-1">
                                    <span className="material-symbols-outlined !text-[14px]">attach_file</span>
                                    {doc.name}
                                    <span className="text-slate-400">({doc.size})</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.services.infra_price_label}</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {s.price > 0 ? `${s.price} USDC` : t.services.price_negotiable}
                    </span>
                </div>

                {payloadType === 'calendly' && s.payload_config?.url && (
                    <a href={s.payload_config.url} target="_blank" rel="noopener noreferrer"
                        className="block w-full py-3 bg-primary text-white text-xs font-black uppercase tracking-widest text-center hover:bg-primary/90 transition-colors"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                        {t.services.consulting_book}
                    </a>
                )}
                {(payloadType === 'qr_contact') && s.payload_config?.url && (
                    <div className="text-center">
                        <p className="text-xs text-slate-400 mb-2">{t.services.core_contact}</p>
                        <img src={s.payload_config.url} alt={s.title} className="mx-auto max-w-[160px]" />
                    </div>
                )}
                {!payloadType && (
                    <p className="text-xs text-slate-400 text-center py-2">{t.services.core_contact}</p>
                )}
            </div>
        </ServiceModal>
    );
}
