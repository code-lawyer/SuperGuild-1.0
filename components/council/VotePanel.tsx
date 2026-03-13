'use client';

import { useState, useEffect } from 'react';
import { RequireWallet } from '@/components/ui/RequireWallet';
import { useT } from '@/lib/i18n';
import {
    useProposalOnchain,
    useUserProposalState,
    useCastVote,
    useFinalizeProposal,
    ProposalData,
    ProposalStatus,
} from '@/hooks/useProposals';

interface VotePanelProps {
    proposal: ProposalData;
}

function useCountdown(deadline: number, endedLabel: string) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!deadline) return;

        const tick = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = deadline - now;
            if (remaining <= 0) {
                setTimeLeft(endedLabel);
                return;
            }
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            const s = remaining % 60;
            setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return timeLeft;
}

export function VotePanel({ proposal }: VotePanelProps) {
    const t = useT();
    const {
        votesFor,
        votesAgainst,
        status: onchainStatus,
        votingDeadline,
    } = useProposalOnchain(proposal.onchain_id);

    const { hasVoted } = useUserProposalState(proposal.onchain_id);
    const voteMutation = useCastVote();
    const finalizeMutation = useFinalizeProposal();

    const timeLeft = useCountdown(votingDeadline, t.council.voteEnded);
    const totalVotes = votesFor + votesAgainst;
    const forPercent = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 50;
    const againstPercent = totalVotes > 0 ? (votesAgainst / totalVotes) * 100 : 50;

    const isActive = onchainStatus === ProposalStatus.Active;
    const isPassed = onchainStatus === ProposalStatus.Passed;
    const isRejected = onchainStatus === ProposalStatus.Rejected;
    const isFinished = isPassed || isRejected;
    const votingEnded = votingDeadline > 0 && Math.floor(Date.now() / 1000) > votingDeadline;
    const canFinalize = isActive && votingEnded;

    const handleVote = (support: boolean) => {
        if (!proposal.onchain_id) return;
        voteMutation.mutate({
            proposalDbId: proposal.id,
            onchainId: proposal.onchain_id,
            support,
        });
    };

    const handleFinalize = () => {
        if (!proposal.onchain_id) return;
        finalizeMutation.mutate({
            proposalDbId: proposal.id,
            onchainId: proposal.onchain_id,
        });
    };

    return (
        <div className="w-full bg-white dark:bg-slate-900/40 rounded-2xl border border-purple-500/30 p-8 flex flex-col shadow-lg shadow-purple-500/5">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md font-mono">
                            #{proposal.onchain_id ? `OS-${String(proposal.onchain_id).padStart(3, '0')}` : '…'}
                        </span>
                        {isActive && !votingEnded && (
                            <span className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                Voting Live
                            </span>
                        )}
                        {isPassed && (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                Passed
                            </span>
                        )}
                        {isRejected && (
                            <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                Rejected
                            </span>
                        )}
                        {canFinalize && (
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                Awaiting Finalization
                            </span>
                        )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-mono">
                        {proposal.title}
                    </h3>
                </div>
                {isActive && !votingEnded && (
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time Remaining</p>
                        <div className="text-xl font-mono font-bold text-purple-500 tabular-nums">
                            {timeLeft}
                        </div>
                    </div>
                )}
            </div>

            {/* Vote Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* FOR */}
                <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined !text-[80px] text-emerald-500">thumb_up</span>
                    </div>
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">For</h4>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mb-2 tabular-nums">
                        {votesFor.toLocaleString()} VCP
                    </div>
                    <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-colors transition-transform duration-500" style={{ width: `${forPercent}%` }} />
                    </div>
                </div>

                {/* AGAINST */}
                <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-50 dark:bg-rose-900/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined !text-[80px] text-rose-500">thumb_down</span>
                    </div>
                    <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2">Against</h4>
                    <div className="text-3xl font-black text-rose-600 dark:text-rose-500 mb-2 tabular-nums">
                        {votesAgainst.toLocaleString()} VCP
                    </div>
                    <div className="w-full bg-rose-200 dark:bg-rose-900/50 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-colors transition-transform duration-500" style={{ width: `${againstPercent}%` }} />
                    </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                {isFinished ? (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t.council.finalResult} <span className={isPassed ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {isPassed ? t.council.statusPassed : t.council.statusRejected}
                        </span>
                    </p>
                ) : totalVotes > 0 ? (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t.council.currentProjection} <span className={votesFor > votesAgainst ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                            {votesFor > votesAgainst ? t.council.statusPassed : t.council.statusRejected}
                        </span>
                    </p>
                ) : (
                    <p className="text-sm text-slate-400">{t.council.noVotesYet}</p>
                )}

                <div className="flex gap-3">
                    {proposal.create_tx_hash && (
                        <a
                            href={`https://sepolia.arbiscan.io/tx/${proposal.create_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            View Contract
                        </a>
                    )}
                    {canFinalize && (
                        <button
                            onClick={handleFinalize}
                            disabled={finalizeMutation.isPending}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                            {finalizeMutation.isPending ? t.council.settling : t.council.settleProposal}
                        </button>
                    )}
                    {isActive && !votingEnded && !hasVoted && (
                        <RequireWallet onAuthorized={() => handleVote(false)}>
                            {(handleClick) => (
                                <button
                                    onClick={handleClick}
                                    disabled={voteMutation.isPending}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-rose-600 border border-rose-300 dark:border-rose-800 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors transition-transform disabled:opacity-50"
                                >
                                    Vote Against
                                </button>
                            )}
                        </RequireWallet>
                    )}
                    {isActive && !votingEnded && !hasVoted && (
                        <RequireWallet onAuthorized={() => handleVote(true)}>
                            {(handleClick) => (
                                <button
                                    onClick={handleClick}
                                    disabled={voteMutation.isPending}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
                                >
                                    Vote For
                                </button>
                            )}
                        </RequireWallet>
                    )}
                    {hasVoted && (
                        <span className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 border border-slate-200 dark:border-slate-700">
                            {t.council.alreadyVoted}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
