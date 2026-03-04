'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { VotePanel } from '@/components/council/VotePanel';
import { VotePanelSkeleton } from '@/components/council/VotePanelSkeleton';
import { useProposalsList, ProposalStatus } from '@/hooks/useProposals';

export default function ObsidianStelePage() {
    const t = useT();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    // 查询状态为 ACTIVE 的提案（正在投票）
    const { data: activeProposals, isLoading: isActiveLoading } = useProposalsList('ACTIVE');
    // 查询已完成的提案（PASSED 或 REJECTED）
    const { data: allProposals, isLoading: isHistoryLoading } = useProposalsList();

    const historyProposals = allProposals?.filter(
        p => p.status === 'PASSED' || p.status === 'REJECTED'
    ) ?? [];

    return (
        <div className="relative selection:bg-primary/20">
            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full h-full min-h-[calc(100vh-80px)]">
                <PageHeader
                    title={t.council.obsidianStele}
                    description={t.council.obsidianSteleDesc}
                />

                {/* Tabs */}
                <div className="mt-8 flex items-center justify-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors transition-transform ${activeTab === 'active'
                                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            链上投票中
                            {activeProposals && activeProposals.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-full">
                                    {activeProposals.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors transition-transform ${activeTab === 'history'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            历史决议
                        </button>
                    </div>
                </div>

                <div className="mt-12 relative flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'active' ? (
                            <motion.div
                                key="active"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col gap-6"
                            >
                                {isActiveLoading ? (
                                    <VotePanelSkeleton />
                                ) : activeProposals && activeProposals.length > 0 ? (
                                    activeProposals.map(proposal => (
                                        <VotePanel key={proposal.id} proposal={proposal} />
                                    ))
                                ) : (
                                    <div className="text-center py-24">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                                            <span className="material-symbols-outlined !text-[40px] text-slate-300 dark:text-slate-600">how_to_vote</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-2">暂无进行中的投票</h3>
                                        <p className="text-sm text-slate-400 dark:text-slate-600">当提案在星火广场达到 1% VCP 阈值后，将自动进入链上表决</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col gap-4"
                            >
                                {isHistoryLoading ? (
                                    <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                                ) : historyProposals.length > 0 ? (
                                    historyProposals.map((proposal, index) => {
                                        const isPassed = proposal.status === 'PASSED';
                                        const opacity = Math.max(30, 100 - index * 15);

                                        return (
                                            <motion.div
                                                key={proposal.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 flex items-center justify-between hover:opacity-100 transition-colors transition-transform cursor-default"
                                                style={{ opacity: opacity / 100 }}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${isPassed
                                                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                        : 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                        <span className="material-symbols-outlined">
                                                            {isPassed ? 'check_circle' : 'cancel'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="text-xs font-mono font-bold text-slate-500">
                                                                #{proposal.onchain_id ? `OS-${String(proposal.onchain_id).padStart(3, '0')}` : '...'}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-400">
                                                                {new Date(proposal.created_at).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                                            {proposal.title}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${isPassed
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                                                        : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                                                        }`}>
                                                        {isPassed ? 'Passed' : 'Rejected'}
                                                    </span>
                                                    {proposal.create_tx_hash && (
                                                        <a
                                                            href={`https://sepolia.arbiscan.io/tx/${proposal.create_tx_hash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block mt-2 text-[10px] font-mono text-slate-400 hover:text-purple-500 transition-colors"
                                                        >
                                                            {proposal.create_tx_hash.slice(0, 10)}&hellip;
                                                        </a>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-24">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                                            <span className="material-symbols-outlined !text-[40px] text-slate-300 dark:text-slate-600">history_edu</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-2">暂无历史决议</h3>
                                        <p className="text-sm text-slate-400 dark:text-slate-600">已完成的链上投票将记录于此</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
