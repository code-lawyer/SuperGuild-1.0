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

export default function CoreServicesPage() {
    const t = useT();
    const { services, isLoading, unlockedIds } = useServices(2);
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
                <div className="flex flex-col md:flex-row gap-0 mt-8 border border-slate-200 dark:border-zinc-800">
                    {/* Category Nav — file tree style */}
                    <aside className="w-full md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/50">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
                            <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                                // {t.services.core_select_category}
                            </p>
                        </div>
                        <div className="py-2">
                            {categories.map((cat, ci) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full text-left px-4 py-2.5 transition-all relative group/nav ${
                                        (activeCat?.id === cat.id)
                                            ? 'bg-emerald-500/8 dark:bg-emerald-500/8 text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                                    }`}
                                >
                                    {activeCat?.id === cat.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500" />
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-slate-300 dark:text-zinc-700">{String(ci + 1).padStart(2, '0')}</span>
                                        {cat.icon && <span className="material-symbols-outlined !text-[14px]">{cat.icon}</span>}
                                        <span className="text-xs font-bold uppercase tracking-tight truncate">{cat.title}</span>
                                    </div>
                                    <div className="mt-0.5 pl-9">
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-600">
                                            {cat.children?.length ?? 0} {t.services.solutions_count}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Solutions Grid */}
                    <div className="flex-1 min-w-0 bg-white dark:bg-zinc-950">
                        {activeCat && (
                            <>
                                {/* Category header bar */}
                                <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                                    {activeCat.icon && (
                                        <span className="material-symbols-outlined !text-[16px] text-emerald-500">{activeCat.icon}</span>
                                    )}
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-mono">
                                        {activeCat.title}
                                    </h2>
                                    <span className="ml-auto text-[10px] font-mono text-slate-400 dark:text-zinc-600">
                                        {activeCat.children?.length ?? 0} modules
                                    </span>
                                </div>

                                {(!activeCat.children || activeCat.children.length === 0) ? (
                                    <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                                        [ {t.services.noServices} ]
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-zinc-800 p-px">
                                        {activeCat.children.map((sol, i) => {
                                            const isUnlocked = unlockedIds.includes(sol.id);
                                            return (
                                                <motion.div
                                                    key={sol.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    onClick={() => setSelectedSolution(sol)}
                                                    className="cursor-pointer group bg-white dark:bg-zinc-950 p-5 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-all relative overflow-hidden border border-transparent hover:border-emerald-500/30"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top" />

                                                    <div className="flex items-start gap-3 mb-3">
                                                        {sol.icon && (
                                                            <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="material-symbols-outlined !text-[14px] text-emerald-500">{sol.icon}</span>
                                                            </div>
                                                        )}
                                                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight font-mono">{sol.title}</h4>
                                                    </div>
                                                    {sol.description && (
                                                        <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed line-clamp-2">{sol.description}</p>
                                                    )}
                                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                                                        <span className="text-xs font-bold font-mono text-slate-700 dark:text-zinc-300">
                                                            {sol.price > 0 ? `${sol.price} USDC` : t.services.price_negotiable}
                                                        </span>
                                                        {isUnlocked ? (
                                                            <span className="text-emerald-500 text-[10px] font-bold uppercase flex items-center gap-1">
                                                                <span className="material-symbols-outlined !text-[11px]">check_circle</span>
                                                                {t.services.infra_activated}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                                {t.services.view_detail} <span className="material-symbols-outlined !text-[11px]">arrow_forward</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
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
                        isUnlocked={unlockedIds.includes(selectedSolution.id)}
                        onClose={() => setSelectedSolution(null)}
                    />
                )}
            </AnimatePresence>
        </ServicePageLayout>
    );
}

function SolutionModal({ service: s, isUnlocked, onClose }: { service: Service; isUnlocked: boolean; onClose: () => void }) {
    const t = useT();
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const [step, setStep] = useState<'idle' | 'paying' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const payloadType = s.payload_config?.type;
    const priceUsdc = s.price_usdc != null ? s.price_usdc : s.price;
    const isFree = priceUsdc === 0;
    const hasPaidPrice = priceUsdc > 0;

    const handlePurchase = async () => {
        if (!address) return;
        setErrorMsg(null);
        try {
            let txHash: string;

            if (isFree) {
                txHash = `free_${s.id}_${address.toLowerCase()}`;
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
                    target_id: s.id,
                    tx_hash: txHash,
                }]);
            if (error) throw error;
            setStep('done');
            queryClient.invalidateQueries({ queryKey: ['service_access', address] });
            queryClient.invalidateQueries({ queryKey: ['services', 2] });
        } catch (e: any) {
            setErrorMsg(e?.shortMessage ?? e?.message ?? 'Unknown error');
            setStep('error');
        }
    };

    return (
        <ServiceModal onClose={onClose} maxWidth="max-w-md">
            <ServiceModalHeader title={s.title} onClose={onClose} />
            <div className="p-6 space-y-4">
                {s.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{s.description}</p>
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
                        {hasPaidPrice ? `${priceUsdc} USDC` : t.services.price_negotiable}
                    </span>
                </div>

                {/* Payment / Unlock section */}
                {(isUnlocked || step === 'done') ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                            <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                            {t.services.purchase_done}
                        </div>
                        {/* Show contact/calendly after purchase */}
                        {payloadType === 'calendly' && s.payload_config?.url && (
                            <a href={s.payload_config.url} target="_blank" rel="noopener noreferrer"
                                className="block w-full py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest text-center hover:bg-emerald-700 transition-colors"
                                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                                {t.services.consulting_book}
                            </a>
                        )}
                        {payloadType === 'qr_contact' && s.payload_config?.url && (
                            <div className="text-center">
                                <p className="text-xs text-slate-400 mb-2">{t.services.core_contact}</p>
                                <img src={s.payload_config.url} alt={s.title} className="mx-auto max-w-[160px]" />
                            </div>
                        )}
                    </div>
                ) : hasPaidPrice ? (
                    <>
                        <button
                            onClick={handlePurchase}
                            disabled={step === 'paying'}
                            className="w-full py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
                        >
                            {step === 'paying' ? t.services.purchase_paying
                                : step === 'error' ? t.services.retry
                                : `${t.services.purchase} — ${priceUsdc} USDC`}
                        </button>
                        {errorMsg && (
                            <p className="text-xs text-red-400 mt-2">{errorMsg}</p>
                        )}
                    </>
                ) : (
                    /* Free or negotiable — show contact directly */
                    <>
                        {payloadType === 'calendly' && s.payload_config?.url && (
                            <a href={s.payload_config.url} target="_blank" rel="noopener noreferrer"
                                className="block w-full py-3 bg-primary text-white text-xs font-black uppercase tracking-widest text-center hover:bg-primary/90 transition-colors"
                                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                                {t.services.consulting_book}
                            </a>
                        )}
                        {payloadType === 'qr_contact' && s.payload_config?.url && (
                            <div className="text-center">
                                <p className="text-xs text-slate-400 mb-2">{t.services.core_contact}</p>
                                <img src={s.payload_config.url} alt={s.title} className="mx-auto max-w-[160px]" />
                            </div>
                        )}
                        {!payloadType && (
                            <p className="text-xs text-slate-400 text-center py-2">{t.services.core_contact}</p>
                        )}
                    </>
                )}
            </div>
        </ServiceModal>
    );
}
