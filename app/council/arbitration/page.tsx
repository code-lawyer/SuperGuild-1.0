'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';
import { useNFTGate } from '@/hooks/useNFTGate';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDisputedCollabs, useDisputeVotesForMilestone, useCastDisputeVote, DisputedCollab } from '@/hooks/useDisputeVotes';
import { useProfileByAddress, displayName } from '@/hooks/useProfile';
import { useAccount } from 'wagmi';

export default function HandOfJusticePage() {
    const t = useT();
    const { address } = useAccount();
    const { hasNFT: hasJustice, isLoading, isConnected } = useNFTGate({
        contractAddress: PRIVILEGE_NFT.address,
        tokenId: PRIVILEGE_NFT.tokens.HAND_OF_JUSTICE.id,
    });
    const { openConnectModal } = useConnectModal();
    const { data: disputedCollabs, isLoading: isLoadingDisputes } = useDisputedCollabs();

    return (
        <div className="relative selection:bg-primary/20">
            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full h-full min-h-[calc(100vh-80px)]">
                <PageHeader
                    title={t.council.handOfJustice}
                    description={t.council.handOfJusticeDesc}
                />

                {!isConnected ? (
                    /* Connect Wallet Gate */
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
                                {t.council.arbitrationConnectDesc}
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
                        title={t.council.arbitrationAuthenticating}
                        description={t.council.arbitrationCheckingCreds}
                        iconColor="animate-spin text-slate-300 dark:text-slate-700"
                    />
                ) : !hasJustice ? (
                    /* NFT Gate */
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
                                {t.council.handOfJustice}
                            </h2>
                            <p className="text-blue-100/50 text-lg leading-relaxed mb-10 font-medium">
                                {t.council.arbitrationNFTRequiredDesc}
                            </p>
                            <div className="flex items-center gap-3 text-sm font-bold text-blue-400/80 bg-blue-900/20 px-6 py-3 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                                <span className="material-symbols-outlined !text-[20px]">lock</span>
                                <span className="tracking-wide">{t.council.arbitrationNFTRequired}</span>
                            </div>
                        </motion.div>
                    </div>
                ) : isLoadingDisputes ? (
                    <EmptyState
                        icon="hourglass_top"
                        title={t.council.arbitrationFetchingChief}
                        description={t.council.arbitrationFetchingChiefDesc}
                        iconColor="animate-spin text-slate-300 dark:text-slate-700"
                    />
                ) : !disputedCollabs || disputedCollabs.length === 0 ? (
                    /* No disputes */
                    <EmptyState
                        className="mt-12 py-32"
                        icon="check_circle"
                        title={t.council.noDisputes}
                        description={t.council.noDisputesDesc}
                        iconColor="text-green-500"
                    />
                ) : (
                    /* Dispute Cases */
                    <div className="mt-8 flex flex-col gap-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined !text-[22px] text-rose-500">gavel</span>
                            {t.council.disputeCases}
                            <span className="ml-2 text-sm font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
                                {disputedCollabs.length}
                            </span>
                        </h3>

                        {disputedCollabs.map(dc => (
                            <DisputeCaseCard
                                key={dc.collaboration.id}
                                dispute={dc}
                                currentAddress={address}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Dispute Case Card ──

function DisputeCaseCard({ dispute, currentAddress }: { dispute: DisputedCollab; currentAddress?: string }) {
    const t = useT();
    const { collaboration: collab, milestones, disputedMilestone } = dispute;
    const { data: initiatorProfile } = useProfileByAddress(collab.initiator_id);
    const { data: providerProfile } = useProfileByAddress(collab.provider_id ?? '');
    const { data: votes } = useDisputeVotesForMilestone(disputedMilestone?.id);
    const castVote = useCastDisputeVote();

    const [voteChoice, setVoteChoice] = useState<boolean | null>(null); // true=worker, false=publisher
    const [reason, setReason] = useState('');

    const amount = disputedMilestone
        ? ((disputedMilestone.amount_percentage / 100) * collab.total_budget).toFixed(0)
        : '0';

    const workerVotes = votes?.filter(v => v.worker_won).length ?? 0;
    const publisherVotes = votes?.filter(v => !v.worker_won).length ?? 0;
    const hasVoted = votes?.some(v => v.voter_address.toLowerCase() === currentAddress?.toLowerCase());

    const handleVote = async () => {
        if (voteChoice === null || !disputedMilestone) return;
        await castVote.mutateAsync({
            collabId: collab.id,
            milestoneId: disputedMilestone.id,
            workerWon: voteChoice,
            reason: reason || undefined,
        });
        setVoteChoice(null);
        setReason('');
    };

    return (
        <GlassCard className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider rounded">
                            {t.council.statusDisputed}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                            {collab.id.slice(0, 8)}...
                        </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{collab.title}</h4>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t.council.escrowLocked}</p>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {collab.total_budget.toLocaleString()} USDC
                    </div>
                </div>
            </div>

            {/* Disputed Milestone Info */}
            {disputedMilestone && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-500/20">
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">
                        {t.council.milestoneDisputed}: Milestone {disputedMilestone.sort_order}
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {disputedMilestone.title} — <span className="font-mono">{amount} USDC</span> ({disputedMilestone.amount_percentage}%)
                    </p>
                    <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">info</span>
                        {t.council.penaltyNote}
                    </p>
                </div>
            )}

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t.council.initiatorSide}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {displayName(initiatorProfile, collab.initiator_id)}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                        {collab.initiator_id.slice(0, 6)}...{collab.initiator_id.slice(-4)}
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t.council.providerSide}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {collab.provider_id ? displayName(providerProfile, collab.provider_id) : '—'}
                    </p>
                    {collab.provider_id && (
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                            {collab.provider_id.slice(0, 6)}...{collab.provider_id.slice(-4)}
                        </p>
                    )}
                </div>
            </div>

            {/* Vote Tally */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.council.voteTally}</p>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t.council.workerVotes}: {workerVotes}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t.council.publisherVotes}: {publisherVotes}
                        </span>
                    </div>
                    <div className="flex-1" />
                    <span className="text-xs font-mono text-slate-400">
                        {(workerVotes + publisherVotes)} votes
                    </span>
                </div>
                {(workerVotes + publisherVotes) > 0 && (
                    <div className="mt-2 h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${(workerVotes / (workerVotes + publisherVotes)) * 100}%` }}
                        />
                        <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${(publisherVotes / (workerVotes + publisherVotes)) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Cast Vote */}
            {hasVoted ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20">
                    <span className="material-symbols-outlined !text-[18px] text-green-500">check_circle</span>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">{t.council.voteAlready}</span>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {t.council.castVote}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setVoteChoice(true)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${
                                voteChoice === true
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-transparent text-blue-500 border-blue-500/30 hover:bg-blue-500/10'
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[18px]">person</span>
                            {t.council.voteForWorker}
                        </button>
                        <button
                            onClick={() => setVoteChoice(false)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${
                                voteChoice === false
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-transparent text-amber-500 border-amber-500/30 hover:bg-amber-500/10'
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[18px]">storefront</span>
                            {t.council.voteForPublisher}
                        </button>
                    </div>

                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={t.council.voteReasonPlaceholder}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
                    />

                    <button
                        onClick={handleVote}
                        disabled={voteChoice === null || castVote.isPending}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-blue-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {castVote.isPending ? (
                            <span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined !text-[18px]">how_to_vote</span>
                        )}
                        {t.council.castVote}
                    </button>
                </div>
            )}
        </GlassCard>
    );
}
