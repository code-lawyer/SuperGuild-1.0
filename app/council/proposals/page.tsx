'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useAccount } from 'wagmi';
import { PageHeader } from '@/components/ui/PageHeader';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { RequireWallet } from '@/components/ui/RequireWallet';
import { CreateProposalModal } from '@/components/council/CreateProposalModal';
import { ProposalCard } from '@/components/council/ProposalCard';
import { ProposalSkeleton } from '@/components/ui/ProposalSkeleton';
import { useProposalsList, useGovernorStats } from '@/hooks/useProposals';
import { useVCP } from '@/hooks/useVCP';

export default function SparkPlazaPage() {
    const t = useT();
    const { address } = useAccount();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // 链上数据
    const { threshold, totalSupply, proposalCount } = useGovernorStats();
    const { data: proposals, isLoading } = useProposalsList();
    const { vcp: userVCP } = useVCP();

    return (
        <div className="relative selection:bg-primary/20">
            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full h-full min-h-[calc(100vh-80px)]">
                <PageHeader
                    title={t.council.sparkPlaza}
                    description={t.council.sparkPlazaDesc}
                    action={
                        <RequireWallet onAuthorized={() => setShowCreateModal(true)}>
                            {(handleClick) => (
                                <MagneticButton
                                    onClick={handleClick}
                                    className="px-6 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl transition-colors transition-transform shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined !text-[18px]">bolt</span>
                                    {t.council.initiateProposal}
                                </MagneticButton>
                            )}
                        </RequireWallet>
                    }
                />

                {/* System Stats Bar */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'VCP 总量', value: totalSupply.toLocaleString(), icon: 'token' },
                        { label: '1% 阈值', value: `${threshold.toLocaleString()} VCP`, icon: 'trending_up' },
                        { label: '总提案数', value: String(proposalCount), icon: 'description' },
                        { label: '你的 VCP', value: address ? (userVCP ?? 0).toLocaleString() : '—', icon: 'account_balance_wallet' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px] text-slate-500">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Proposals List */}
                <div className="mt-12 flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex flex-col gap-6">
                            {[1, 2].map(i => (
                                <ProposalSkeleton key={i} />
                            ))}
                        </div>
                    ) : proposals && proposals.length > 0 ? (
                        proposals.map((proposal, index) => (
                            <ProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                threshold={threshold}
                                index={index}
                            />
                        ))
                    ) : (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[40px] text-slate-300 dark:text-slate-600">auto_awesome_motion</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-2">暂无提案</h3>
                            <p className="text-sm text-slate-400 dark:text-slate-600">成为第一个发起提案的人吧</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <CreateProposalModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
}
