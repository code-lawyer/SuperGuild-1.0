'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';
import { ServiceModal, ServiceModalHeader } from '@/components/services/ServiceModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultingPage() {
    const t = useT();
    const { services, isLoading } = useServices(3);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedExpert, setSelectedExpert] = useState<Service | null>(null);

    const categories = services;
    const activeCat = activeCategory
        ? categories.find(c => c.id === activeCategory)
        : categories[0];

    return (
        <ServicePageLayout title={t.services.entry_consulting_title} description={t.services.entry_consulting_desc}>
            {isLoading ? (
                <div className="flex items-center justify-center py-32">
                    <span className="material-symbols-outlined animate-spin !text-[40px] text-primary">progress_activity</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest mt-8">
                    [ {t.services.noServices} ]
                </div>
            ) : (
                <>
                    {/* Category Tabs */}
                    <div className="flex gap-2 mt-8 overflow-x-auto pb-1">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`shrink-0 px-5 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                                    (activeCat?.id === cat.id)
                                        ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-purple-500/40 hover:text-purple-400'
                                }`}
                            >
                                {cat.title}
                                <span className="ml-2 text-slate-400">({cat.children?.length ?? 0})</span>
                            </button>
                        ))}
                    </div>

                    {/* Expert Grid */}
                    <div className="mt-6">
                        {!activeCat || !activeCat.children || activeCat.children.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                                [ {t.services.consulting_no_experts} ]
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeCat.children.map((expert, i) => (
                                    <motion.div
                                        key={expert.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedExpert(expert)}
                                        className="cursor-pointer group border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 p-5 hover:border-purple-500/40 hover:shadow-[0_10px_30px_-10px_rgba(168,85,247,0.15)] transition-all"
                                        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)" }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            {expert.expert_avatar_url ? (
                                                <img src={expert.expert_avatar_url} alt={expert.title}
                                                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                    <span className="material-symbols-outlined !text-[22px] text-purple-400">person</span>
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white">{expert.title}</h4>
                                                {expert.expert_tags && expert.expert_tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {expert.expert_tags.slice(0, 2).map((tag, ti) => (
                                                            <span key={ti} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 text-[9px] font-bold border border-purple-500/20 uppercase">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {expert.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{expert.description}</p>
                                        )}
                                        <div className="mt-3 flex items-center justify-end">
                                            <span className="text-xs text-purple-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                {t.services.consulting_book} <span className="material-symbols-outlined !text-[12px]">arrow_forward</span>
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Expert Modal */}
            <AnimatePresence>
                {selectedExpert && (
                    <ExpertModal expert={selectedExpert} onClose={() => setSelectedExpert(null)} />
                )}
            </AnimatePresence>
        </ServicePageLayout>
    );
}

function ExpertModal({ expert: e, onClose }: { expert: Service; onClose: () => void }) {
    const t = useT();

    return (
        <ServiceModal onClose={onClose} maxWidth="max-w-md">
            <ServiceModalHeader
                title={e.title}
                avatar={e.expert_avatar_url ?? null}
                onClose={onClose}
            />
            <div className="p-6 space-y-4">
                {e.expert_tags && e.expert_tags.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.services.consulting_expertise}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {e.expert_tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold border border-purple-500/20 uppercase tracking-wide">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {e.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{e.description}</p>
                )}

                {e.price > 0 && (
                    <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.services.consulting_fee}</span>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">{e.price} USDC {t.services.per_session}</span>
                    </div>
                )}

                {e.payload_config?.type === 'calendly' && e.payload_config?.url ? (
                    <a href={e.payload_config.url} target="_blank" rel="noopener noreferrer"
                        className="block w-full py-3 bg-purple-600 text-white text-xs font-black uppercase tracking-widest text-center hover:bg-purple-700 transition-colors"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                        {t.services.consulting_book}
                    </a>
                ) : e.payload_config?.url ? (
                    <a href={e.payload_config.url} target="_blank" rel="noopener noreferrer"
                        className="block w-full py-3 border border-purple-500 text-purple-500 text-xs font-black uppercase tracking-widest text-center hover:bg-purple-500/10 transition-colors">
                        {t.services.consulting_contact}
                    </a>
                ) : (
                    <p className="text-xs text-slate-400 text-center py-2">{t.services.consulting_contact}</p>
                )}
            </div>
        </ServiceModal>
    );
}
