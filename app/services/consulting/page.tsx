'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';
import { ServiceModal, ServiceModalHeader } from '@/components/services/ServiceModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { supabase } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { MOCK_USDC, SERVICE_TREASURY } from '@/constants/nft-config';
import { PRIMARY_CHAIN_ID } from '@/constants/chain-config';
import { ERC20_APPROVE_ABI } from '@/constants/direct-pay-config';

export default function ConsultingPage() {
    const t = useT();
    const { services, isLoading, unlockedIds } = useServices(3);
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
                                {activeCat.children.map((expert, i) => {
                                    const isUnlocked = unlockedIds.includes(expert.id);
                                    return (
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
                                            <div className="mt-3 flex items-center justify-between">
                                                {expert.price > 0 && (
                                                    <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">
                                                        {expert.price} USDC {t.services.per_session}
                                                    </span>
                                                )}
                                                <span className="text-xs font-bold ml-auto flex items-center gap-1">
                                                    {isUnlocked ? (
                                                        <span className="text-emerald-500 flex items-center gap-1">
                                                            <span className="material-symbols-outlined !text-[12px]">check_circle</span>
                                                            {t.services.infra_activated}
                                                        </span>
                                                    ) : (
                                                        <span className="text-purple-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                            {t.services.consulting_book} <span className="material-symbols-outlined !text-[12px]">arrow_forward</span>
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Expert Modal */}
            <AnimatePresence>
                {selectedExpert && (
                    <ExpertModal
                        expert={selectedExpert}
                        isUnlocked={unlockedIds.includes(selectedExpert.id)}
                        onClose={() => setSelectedExpert(null)}
                    />
                )}
            </AnimatePresence>
        </ServicePageLayout>
    );
}

function ExpertModal({ expert: e, isUnlocked, onClose }: { expert: Service; isUnlocked: boolean; onClose: () => void }) {
    const t = useT();
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const [step, setStep] = useState<'idle' | 'paying' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const priceUsdc = e.price_usdc != null ? e.price_usdc : e.price;
    const isFree = priceUsdc === 0;
    const hasPaidPrice = priceUsdc > 0;

    const handlePurchase = async () => {
        if (!address) return;
        setErrorMsg(null);
        try {
            let txHash: string;

            if (isFree) {
                txHash = `free_${e.id}_${address.toLowerCase()}`;
            } else {
                const amount = parseUnits(String(priceUsdc), MOCK_USDC.decimals);
                setStep('paying');
                const hash = await writeContractAsync({
                    address: MOCK_USDC.address,
                    abi: ERC20_APPROVE_ABI,
                    functionName: 'transfer',
                    args: [SERVICE_TREASURY.address, amount],
                    chainId: PRIMARY_CHAIN_ID,
                });
                if (publicClient) {
                    await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
                }
                txHash = hash;
            }

            const { error } = await supabase
                .from('service_access')
                .insert([{
                    user_address: address.toLowerCase(),
                    target_id: e.id,
                    tx_hash: txHash,
                }]);
            if (error) throw error;
            setStep('done');
            queryClient.invalidateQueries({ queryKey: ['service_access', address] });
            queryClient.invalidateQueries({ queryKey: ['services', 3] });
        } catch (err: any) {
            setErrorMsg(err?.shortMessage ?? err?.message ?? 'Unknown error');
            setStep('error');
        }
    };

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
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{e.description}</p>
                )}

                {hasPaidPrice && (
                    <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.services.consulting_fee}</span>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">{priceUsdc} USDC {t.services.per_session}</span>
                    </div>
                )}

                {/* Payment / Booking section */}
                {(isUnlocked || step === 'done') ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                            <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                            {t.services.purchase_done}
                        </div>
                        {e.payload_config?.type === 'calendly' && e.payload_config?.url && (
                            <a href={e.payload_config.url} target="_blank" rel="noopener noreferrer"
                                className="block w-full py-3 bg-purple-600 text-white text-xs font-black uppercase tracking-widest text-center hover:bg-purple-700 transition-colors"
                                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                                {t.services.consulting_book}
                            </a>
                        )}
                        {e.payload_config?.url && e.payload_config?.type !== 'calendly' && (
                            <a href={e.payload_config.url} target="_blank" rel="noopener noreferrer"
                                className="block w-full py-3 border border-purple-500 text-purple-500 text-xs font-black uppercase tracking-widest text-center hover:bg-purple-500/10 transition-colors">
                                {t.services.consulting_contact}
                            </a>
                        )}
                    </div>
                ) : hasPaidPrice ? (
                    <>
                        <button
                            onClick={handlePurchase}
                            disabled={step === 'paying'}
                            className="w-full py-3 bg-purple-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-purple-700 transition-colors"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
                        >
                            {step === 'paying' ? t.services.purchase_paying
                                : step === 'error' ? t.services.retry
                                : `${t.services.book_and_pay} — ${priceUsdc} USDC`}
                        </button>
                        {errorMsg && (
                            <p className="text-xs text-red-400 mt-2">{errorMsg}</p>
                        )}
                    </>
                ) : (
                    /* No price — show contact directly */
                    <>
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
                    </>
                )}
            </div>
        </ServiceModal>
    );
}
