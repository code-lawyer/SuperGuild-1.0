'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';
import { useLanternGate } from '@/hooks/useLanternGate';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function HandOfJusticePage() {
    const t = useT();
    const { isLantern, isLoading, isConnected, address } = useLanternGate();
    const { openConnectModal } = useConnectModal();

    const [chiefData, setChiefData] = useState<any>(null);
    const [isFetchingChief, setIsFetchingChief] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        if (isLantern && address) {
            setIsFetchingChief(true);
            setFetchError(false);
            fetch(`/api/council/arbitration/chief?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    setChiefData(data);
                    setIsFetchingChief(false);
                })
                .catch(err => {
                    console.error("Failed to fetch chief:", err);
                    setFetchError(true);
                    setIsFetchingChief(false);
                });
        }
    }, [isLantern, address]);

    const isChief = chiefData?.chiefArbitrator?.toLowerCase() === address?.toLowerCase();

    return (
        <div className="relative selection:bg-primary/20">

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full h-full min-h-[calc(100vh-80px)]">
                <PageHeader
                    title={t.council.handOfJustice}
                    description={t.council.handOfJusticeDesc}
                />

                {!isConnected ? (
                    <div className="mt-12 overflow-hidden relative rounded-3xl border border-slate-800 bg-[#0a0f18] flex flex-col items-center justify-center py-40 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6"
                        >
                            <div className="w-20 h-20 mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[40px] text-amber-400">account_balance_wallet</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-6 font-mono">
                                {t.common.connectWallet}
                            </h2>
                            <p className="text-amber-100/50 text-lg leading-relaxed mb-10 font-medium">
                                请先连接钱包以访问公义之手仲裁庭。
                            </p>
                            <button
                                onClick={() => openConnectModal?.()}
                                className="flex items-center gap-3 text-sm font-bold text-amber-400 bg-amber-900/20 px-8 py-4 rounded-xl border border-amber-500/20 backdrop-blur-sm hover:bg-amber-900/40 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined !text-[20px]">wallet</span>
                                <span className="tracking-wide uppercase">{t.common.connectWallet}</span>
                            </button>
                        </motion.div>
                    </div>
                ) : isLoading ? (
                    <EmptyState
                        icon="hourglass_top"
                        title="Authenticating..."
                        description="Checking on-chain credentials"
                        iconColor="animate-spin text-slate-300 dark:text-slate-700"
                    />
                ) : !isLantern ? (
                    <div className="mt-12 overflow-hidden relative rounded-3xl border border-slate-800 bg-[#0a0f18] flex flex-col items-center justify-center py-40 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6"
                        >
                            <div className="w-20 h-20 mb-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                                <span className="material-symbols-outlined !text-[40px] text-blue-400">gavel</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-6 font-mono">
                                The Hand of Justice
                            </h2>
                            <p className="text-blue-100/50 text-lg leading-relaxed mb-10 font-medium">
                                The realm of decentralized arbitration. Only those who bear the Sentinel Lantern's true mark may enter the grand court to oversee and judge disputes.
                            </p>
                            <div className="flex items-center gap-3 text-sm font-bold text-blue-400/80 bg-blue-900/20 px-6 py-3 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                                <span className="material-symbols-outlined !text-[20px]">lock</span>
                                <span className="tracking-wide">LANTERN KEEPER NFT REQUIRED TO ENTER</span>
                            </div>
                        </motion.div>
                    </div>
                ) : isFetchingChief ? (
                    <EmptyState
                        icon="hourglass_top"
                        title="Consulting API..."
                        description="Consulting the Obsidian Stele to fetch the current Chief Arbitrator"
                        iconColor="animate-spin text-slate-300 dark:text-slate-700"
                    />
                ) : fetchError ? (
                    <EmptyState
                        icon="warning"
                        title="Connection Lost"
                        description="Failed to synchronize with the Obsidian Stele. Please try again later."
                        iconColor="text-rose-500"
                    />
                ) : isChief ? (
                    /* Chief Arbitrator View */
                    <div className="mt-12 flex flex-col gap-6">
                        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                            <div>
                                <h3 className="text-lg font-black text-blue-500 uppercase tracking-wider mb-1">
                                    Chief Arbitrator Active
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    You have been selected to preside over the current disputes. Your mandate expires at {new Date(chiefData.nextRotation).toLocaleDateString()}.
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <span className="material-symbols-outlined !text-[24px] text-blue-500">gavel</span>
                            </div>
                        </div>

                        {/* Mock Dispute to format */}
                        <GlassCard className="p-8">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider rounded">Disputed</span>
                                        <span className="text-xs font-mono font-bold text-slate-500">Quest #Q-8492</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Implement ZK Login Flow</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Escrow Locked</p>
                                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">2,500 USDC</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Initiator (Client)</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        "The developer delivered the code, but the zero-knowledge proofs fail 20% of the time on mainnet due to gas limit estimations. The milestone spec clearly stated it must be production-ready."
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Provider (Dev)</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        "The issue is with Polygon's RPC nodes dropping the intensive proof payloads, not the code itself. The code passed all testnet cases. This is an infrastructure issue beyond my scope."
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                    Draft Arbitration Report
                                </label>
                                <textarea
                                    className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors transition-transform placeholder:text-slate-400"
                                    placeholder="Detail your findings, evidence analysis, and proposed resolution (e.g., 50/50 split, 100% refund, or 100% pay)..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                                    Submit Report to Jury
                                </button>
                            </div>
                        </GlassCard>
                    </div>
                ) : (
                    /* Jury View (Standard View for other Keepers) */
                    <div className="mt-12 flex flex-col gap-6">
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                                    Jury Duty Active
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    The current Chief Arbitrator ({chiefData?.chiefArbitrator?.slice(0, 6)}...{chiefData?.chiefArbitrator?.slice(-4)}) is drafting a report for Quest #Q-8492.
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-300 dark:border-slate-600">
                                <span className="material-symbols-outlined !text-[24px] text-slate-500">group</span>
                            </div>
                        </div>

                        <EmptyState
                            className="mt-0 py-32"
                            icon="pending_actions"
                            title="Awaiting Chief's Report"
                            description="No reports require your vote currently. Once the Chief Arbitrator submits a resolution, you will have 48 hours to cast your vote."
                            iconColor="font-light text-slate-300 dark:text-slate-700"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
