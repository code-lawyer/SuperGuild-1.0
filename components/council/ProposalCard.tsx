'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { RequireWallet } from '@/components/ui/RequireWallet';
import {
    useProposalOnchain,
    useUserProposalState,
    useCosign,
    ProposalData,
    StatusLabels,
    ProposalStatus,
} from '@/hooks/useProposals';

interface ProposalCardProps {
    proposal: ProposalData;
    threshold: number;
    index?: number;
}

export function ProposalCard({ proposal, threshold, index = 0 }: ProposalCardProps) {
    const { totalVCPSignaled, status: onchainStatus, cosignerCount } = useProposalOnchain(proposal.onchain_id);
    const { hasCosigned } = useUserProposalState(proposal.onchain_id);
    const cosignMutation = useCosign();

    const effectiveStatus = onchainStatus ?? 0;
    const isSignaling = effectiveStatus === ProposalStatus.Signaling;
    const isActive = effectiveStatus === ProposalStatus.Active;
    const thresholdMet = totalVCPSignaled >= threshold && threshold > 0;

    // 进度百分比
    const progressPercent = threshold > 0 ? Math.min(100, (totalVCPSignaled / threshold) * 100) : 0;

    const handleCosign = () => {
        if (!proposal.onchain_id) return;
        cosignMutation.mutate({
            proposalDbId: proposal.id,
            onchainId: proposal.onchain_id,
        });
    };

    // 状态颜色
    const statusColor = isActive || thresholdMet
        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        : 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 dark:shadow-[0_0_15px_rgba(249,115,22,0.1)]';

    const statusLabel = thresholdMet && isSignaling
        ? 'Threshold Met'
        : StatusLabels[effectiveStatus] || 'Signaling';

    return (
        <GlassCard
            className="hover:border-orange-500/30 transition-colors"
            hoverEffect={false}
            transition={{ delay: index * 0.08 }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md font-mono">
                            #{proposal.onchain_id ? `SP-${String(proposal.onchain_id).padStart(3, '0')}` : '…'}
                        </span>
                        <span className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-md ${statusColor} ${thresholdMet ? 'animate-pulse' : ''}`}>
                            {statusLabel}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {proposal.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {proposal.body}
                    </p>
                </div>

                {/* Proposer info */}
                <div className="shrink-0 flex items-center gap-2 text-xs text-slate-400">
                    <span className="material-symbols-outlined !text-[14px]">person</span>
                    <span className="font-mono">{proposal.proposer_address.slice(0, 6)}&hellip;{proposal.proposer_address.slice(-4)}</span>
                </div>
            </div>

            {/* Attachment Links */}
            {proposal.attachment_urls && proposal.attachment_urls.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {proposal.attachment_urls.map((url, idx) => (
                        <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs rounded-lg hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                        >
                            <span className="material-symbols-outlined !text-[14px]">link</span>
                            附件 {idx + 1}
                        </a>
                    ))}
                </div>
            )}

            {/* Signaling Progress */}
            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        {thresholdMet ? (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined !text-[16px] text-emerald-500">check_circle</span>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Signaling Complete</p>
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Signaling Progress</p>
                        )}
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                                {totalVCPSignaled.toLocaleString()}
                            </span>
                            <span className="text-sm font-semibold text-slate-400">
                                / {threshold.toLocaleString()} VCP (1% Threshold)
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{cosignerCount} 位联署人</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-xs font-bold ${thresholdMet ? 'text-emerald-500' : 'text-orange-500'}`}>
                            {progressPercent.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className={`h-2 w-full rounded-full overflow-hidden ${thresholdMet ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {thresholdMet ? (
                        <div className="h-full bg-emerald-500 w-full rounded-full" />
                    ) : (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                        />
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    {isSignaling && !thresholdMet && (
                        <RequireWallet onAuthorized={handleCosign}>
                            {(handleClick) => (
                                <button
                                    onClick={handleClick}
                                    disabled={hasCosigned || cosignMutation.isPending}
                                    className="px-5 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-orange-600 border border-orange-500/30 hover:bg-orange-500 hover:text-white transition-colors transition-transform shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 disabled:hover:text-orange-600"
                                >
                                    {hasCosigned ? '已联署 ✓' : cosignMutation.isPending ? '签名中…' : '附议联署'}
                                </button>
                            )}
                        </RequireWallet>
                    )}
                    {(isActive || thresholdMet) && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl w-full">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <span className="material-symbols-outlined !text-[20px]">rocket_launch</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">已进入链上表决</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-500">前往曜石刻刀参与投票</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
