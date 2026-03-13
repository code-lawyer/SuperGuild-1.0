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
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: t.council.vcpTotal, value: totalSupply.toLocaleString(), icon: 'token', accent: 'text-primary' },
                        { label: t.council.vcpThreshold, value: `${threshold.toLocaleString()} VCP`, icon: 'trending_up', accent: 'text-amber-500' },
                        { label: t.council.proposalCount, value: String(proposalCount), icon: 'description', accent: 'text-purple-500' },
                        { label: t.council.yourVcp, value: address ? (userVCP ?? 0).toLocaleString() : '—', icon: 'account_balance_wallet', accent: 'text-emerald-500' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3"
                        >
                            <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center shrink-0">
                                <span className={`material-symbols-outlined !text-[18px] ${stat.accent}`}>{stat.icon}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
                                <p className="text-base font-black text-slate-900 dark:text-white font-mono tabular-nums leading-tight">{stat.value}</p>
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
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[28px] text-slate-400 dark:text-slate-500">auto_awesome_motion</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-500 dark:text-slate-400 mb-2">{t.council.noProposals}</h3>
                            <p className="text-sm text-slate-400 dark:text-slate-500">{t.council.noProposalsDesc}</p>
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
