'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';
import { ServiceModal, ServiceModalHeader } from '@/components/services/ServiceModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { supabase } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { MOCK_USDC, SERVICE_TREASURY } from '@/constants/nft-config';
import { PRIMARY_CHAIN_ID } from '@/constants/chain-config';
import { ERC20_APPROVE_ABI } from '@/constants/direct-pay-config';

export default function InfrastructurePage() {
    const t = useT();
    const { services, isLoading, unlockedIds } = useServices(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    return (
        <ServicePageLayout title={t.services.entry_infra_title} description={t.services.entry_infra_desc}>
            {isLoading ? (
                <div className="flex items-center justify-center py-32 text-slate-400 gap-4">
                    <span className="material-symbols-outlined animate-spin !text-[40px] text-primary">progress_activity</span>
                </div>
            ) : services.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                    [ {t.services.noServices} ]
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px mt-8 bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800">
                    {services.map((s, i) => {
                        const isUnlocked = unlockedIds.includes(s.id);
                        const serviceId = `S-${String(i + 1).padStart(3, '0')}`;
                        return (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => setSelectedService(s)}
                                className="cursor-pointer group bg-white dark:bg-zinc-950 p-6 hover:bg-slate-50 dark:hover:bg-zinc-900/80 transition-all relative overflow-hidden border border-transparent hover:border-cyan-500/30"
                            >
                                {/* Left accent bar on hover */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top" />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"
                                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)" }}>
                                            <span className="material-symbols-outlined !text-[18px] text-cyan-400">{s.icon || 'settings_input_component'}</span>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-600 uppercase">{serviceId}</span>
                                    </div>
                                    {isUnlocked ? (
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                            {t.services.infra_activated}
                                        </span>
                                    ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 group-hover:bg-cyan-400 transition-colors" />
                                    )}
                                </div>

                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono mb-2 leading-snug">{s.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed line-clamp-2">{s.description}</p>

                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                                        {s.price_usdc != null ? `${s.price_usdc} USDC` : s.price > 0 ? `${s.price} USDC` : 'Free'}
                                    </span>
                                    <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                        {t.services.view_detail} <span className="material-symbols-outlined !text-[12px]">arrow_forward</span>
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedService && (
                    <InfraModal
                        service={selectedService}
                        isUnlocked={unlockedIds.includes(selectedService.id)}
                        onClose={() => setSelectedService(null)}
                    />
                )}
            </AnimatePresence>
        </ServicePageLayout>
    );
}

function InfraModal({ service: s, isUnlocked, onClose }: {
    service: Service;
    isUnlocked: boolean;
    onClose: () => void;
}) {
    const t = useT();
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const [step, setStep] = useState<'idle' | 'approving' | 'paying' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const priceUsdc = s.price_usdc != null ? s.price_usdc : s.price;
    const isFree = priceUsdc === 0;

    const handleActivate = async () => {
        if (!address) return;
        setErrorMsg(null);
        try {
            let txHash: string;

            if (isFree) {
                // Free service — no on-chain tx needed, use deterministic hash
                txHash = `free_${s.id}_${address.toLowerCase()}`;
            } else {
                // Real USDC payment: transfer to SERVICE_TREASURY
                const amount = parseUnits(String(priceUsdc), MOCK_USDC.decimals);

                // Step 1: USDC transfer (no approve needed — using transfer, not transferFrom)
                setStep('paying');
                // Read baseFee directly from latest block to avoid stale wallet estimates
                const block = await publicClient!.getBlock({ blockTag: 'latest' });
                const baseFee = block.baseFeePerGas ?? 25_000_000n;
                const maxFeePerGas = baseFee * 2n;           // 2× headroom
                const maxPriorityFeePerGas = 1_000_000n;    // 0.001 gwei tip
                const hash = await writeContractAsync({
                    address: MOCK_USDC.address,
                    abi: ERC20_APPROVE_ABI,
                    functionName: 'transfer',
                    args: [SERVICE_TREASURY.address, amount],
                    chainId: PRIMARY_CHAIN_ID,
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                });

                // Wait for confirmation
                if (publicClient) {
                    await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
                }

                txHash = hash;
            }

            // Record unlock in database
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
            queryClient.invalidateQueries({ queryKey: ['services', 1] });
        } catch (e: any) {
            setErrorMsg(e?.shortMessage ?? e?.message ?? 'Unknown error');
            setStep('error');
        }
    };

    const activateLabel = step === 'approving' ? t.services.infra_approving
        : step === 'paying' ? t.services.infra_paying
        : t.services.infra_activate;

    return (
        <ServiceModal onClose={onClose}>
            <ServiceModalHeader title={s.title} icon={s.icon || 'settings_input_component'} onClose={onClose} />
            <div className="p-6 space-y-5">
                {s.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{s.description}</p>
                )}

                <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.services.infra_price_label}</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                        {s.price_usdc != null ? `${s.price_usdc} USDC` : s.price > 0 ? `${s.price} USDC` : 'Free'}
                    </span>
                </div>

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

                {(isUnlocked || step === 'done') ? (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                        <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                        {t.services.infra_activated}
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleActivate}
                            disabled={step === 'approving' || step === 'paying'}
                            className="w-full py-3 bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-primary/90 transition-colors"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
                        >
                            {step === 'error' ? t.services.retry : activateLabel}
                        </button>
                        {errorMsg && (
                            <p className="text-xs text-red-400 mt-2">{errorMsg}</p>
                        )}
                    </>
                )}
            </div>
        </ServiceModal>
    );
}
