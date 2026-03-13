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
                    <div className="flex gap-0 mt-8 border border-slate-200 dark:border-zinc-800 overflow-x-auto">
                        {categories.map((cat, ci) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`relative shrink-0 px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] border-r border-slate-200 dark:border-zinc-800 transition-all last:border-r-0 ${
                                    (activeCat?.id === cat.id)
                                        ? 'bg-violet-500/8 dark:bg-violet-500/8 text-violet-500'
                                        : 'bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                                }`}
                            >
                                {activeCat?.id === cat.id && (
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-purple-500" />
                                )}
                                {cat.title}
                                <span className={`ml-2 text-[9px] ${activeCat?.id === cat.id ? 'text-violet-400' : 'text-slate-400 dark:text-zinc-600'}`}>
                                    [{cat.children?.length ?? 0}]
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Expert Grid */}
                    <div className="mt-0 border border-t-0 border-slate-200 dark:border-zinc-800">
                        {!activeCat || !activeCat.children || activeCat.children.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                                [ {t.services.consulting_no_experts} ]
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 dark:bg-zinc-800">
                                {activeCat.children.map((expert, i) => {
                                    const isUnlocked = unlockedIds.includes(expert.id);
                                    return (
                                        <motion.div
                                            key={expert.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setSelectedExpert(expert)}
                                            className="cursor-pointer group bg-white dark:bg-zinc-950 p-6 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-all relative overflow-hidden border border-transparent hover:border-violet-500/30"
                                        >
                                            {/* Corner accent on hover */}
                                            <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-violet-500/0 group-hover:border-t-violet-500/30 transition-all duration-200" />

                                            {/* Avatar + name row */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="relative shrink-0">
                                                    {expert.expert_avatar_url ? (
                                                        <img src={expert.expert_avatar_url} alt={expert.title}
                                                            className="w-14 h-14 object-cover border border-slate-200 dark:border-zinc-700 group-hover:border-violet-500/40 transition-colors"
                                                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }} />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"
                                                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                                                            <span className="material-symbols-outlined !text-[24px] text-violet-400">person</span>
                                                        </div>
                                                    )}
                                                    {isUnlocked && (
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center">
                                                            <span className="material-symbols-outlined !text-[8px] text-white">check</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">{expert.title}</h4>
                                                    {expert.expert_tags && expert.expert_tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {expert.expert_tags.slice(0, 3).map((tag, ti) => (
                                                                <span key={ti} className="px-1.5 py-0.5 bg-violet-500/8 text-violet-500 dark:text-violet-400 text-[8px] font-bold border border-violet-500/20 uppercase tracking-wide">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {expert.description && (
                                                <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed line-clamp-2 mb-4">{expert.description}</p>
                                            )}

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                                                {expert.price > 0 ? (
                                                    <span className="text-xs font-black font-mono text-slate-700 dark:text-zinc-200">
                                                        {expert.price} <span className="text-slate-400 dark:text-zinc-500 font-normal">USDC / {t.services.per_session}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-zinc-600 font-mono">{t.services.price_negotiable}</span>
                                                )}
                                                {isUnlocked ? (
                                                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <span className="material-symbols-outlined !text-[11px]">check_circle</span>
                                                        {t.services.infra_activated}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-violet-500 font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                        {t.services.consulting_book} <span className="material-symbols-outlined !text-[11px]">arrow_forward</span>
                                                    </span>
                                                )}
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
                // Read baseFee directly from latest block to avoid stale wallet estimates
                const block = await publicClient!.getBlock({ blockTag: 'latest' });
                const baseFee = block.baseFeePerGas ?? 25_000_000n;
                const maxFeePerGas = baseFee * 2n;
                const maxPriorityFeePerGas = 1_000_000n;
                const hash = await writeContractAsync({
                    address: MOCK_USDC.address,
                    abi: ERC20_APPROVE_ABI,
                    functionName: 'transfer',
                    args: [SERVICE_TREASURY.address, amount],
                    chainId: PRIMARY_CHAIN_ID,
                    maxFeePerGas,
                    maxPriorityFeePerGas,
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
