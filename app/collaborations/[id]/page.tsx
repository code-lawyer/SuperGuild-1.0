'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
    useCollaborationDetail,
    useApplyToCollab,
    useCollabApplications,
    useApproveApplication,
    useRejectApplication,
    useAbandonCollaboration,
    useCancelCollaboration,
    useConfirmMilestone,
    useHoldMilestone,
    useDisputeCollaboration,
    CollabStatus,
    CollabApplication,
} from '@/hooks/useCollaborations';
import { useGuildEscrow, EscrowStep } from '@/hooks/useGuildEscrow';
import { useDirectPay } from '@/hooks/useDirectPay';
import { useT } from '@/lib/i18n';
import Markdown from '@/components/ui/Markdown';
import { useProfileByAddress, displayName } from '@/hooks/useProfile';
import MilestoneTimeline from '@/components/collaborations/MilestoneTimeline';
import UploadProofDialog from '@/components/collaborations/UploadProofDialog';
import MintTestUSDC from '@/components/collaborations/MintTestUSDC';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { SquareLoader } from '@/components/ui/SquareLoader';
import { safeHref } from '@/lib/utils';

function useStatusConfig() {
    const t = useT();
    return {
        OPEN: { label: t.common.open, badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20' },
        PENDING_APPROVAL: { label: t.common.pendingApproval, badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20' },
        LOCKED: { label: t.common.locked, badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20' },
        ACTIVE: { label: t.common.inProgress, badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' },
        PENDING: { label: t.common.pending, badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20' },
        SETTLED: { label: t.common.settled, badgeClass: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20' },
        DISPUTED: { label: t.common.disputed, badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20' },
        CANCELLED: { label: t.common.cancelled, badgeClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/20' },
    } as Record<CollabStatus, { label: string; badgeClass: string }>;
}

export default function CollaborationDetailPage() {
    const t = useT();
    const statusConfig = useStatusConfig();
    const params = useParams();
    const id = params.id as string;
    const { address } = useAccount();

    const { data, isLoading, error } = useCollaborationDetail(id);
    const { data: applications } = useCollabApplications(id);
    const applyToCollab = useApplyToCollab();
    const approveApp = useApproveApplication();
    const rejectApp = useRejectApplication();
    const abandonCollab = useAbandonCollaboration();
    const cancelCollab = useCancelCollaboration();
    const confirmMs = useConfirmMilestone();
    const holdMs = useHoldMilestone();
    const disputeCollab = useDisputeCollaboration();
    const escrow = useGuildEscrow();
    const directPay = useDirectPay();

    const [applyMessage, setApplyMessage] = useState('');
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [proofMilestoneId, setProofMilestoneId] = useState<string | null>(null);
    const [proofMilestoneSortOrder, setProofMilestoneSortOrder] = useState<number>(0);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-6">
                <SquareLoader />
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/60 animate-pulse">{t.common.loading}</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <span className="material-symbols-outlined !text-[40px]">error</span>
                <p className="text-sm font-medium">{t.common.noData}</p>
                <Link href="/collaborations" className="ag-btn-secondary text-xs">{t.quests.backToList}</Link>
            </div>
        );
    }

    const { collaboration: collab, milestones, proofs } = data;
    const status = statusConfig[collab.status] || statusConfig.OPEN;
    const isInitiator = address?.toLowerCase() === collab.initiator_id?.toLowerCase();
    const isProvider = address?.toLowerCase() === collab.provider_id?.toLowerCase();
    const isGuildManaged = collab.payment_mode === 'guild_managed';

    const completedMs = milestones.filter(m => m.status === 'CONFIRMED');
    const releasedPct = completedMs.reduce((sum, m) => sum + m.amount_percentage, 0);
    const releasedAmount = ((releasedPct / 100) * collab.total_budget).toFixed(0);
    const remainingAmount = (collab.total_budget - Number(releasedAmount)).toFixed(0);

    return (
        <WalletGatePage>
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 flex flex-col gap-8 pb-24">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-slate-400 dark:text-slate-500">
                    <Link href="/collaborations" className="hover:text-primary transition-colors">{t.quests.questList}</Link>
                    <span className="material-symbols-outlined text-[16px] mx-2">chevron_right</span>
                    <span className="text-slate-900 dark:text-white font-medium">{collab.title}</span>
                </div>

                {/* Hero */}
                <div className="flex justify-between items-start gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.badgeClass}`}>
                                {status.label}
                            </span>
                            {collab.deadline && (
                                <span className="text-[12px] text-slate-400 font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[14px]">schedule</span>
                                    {t.quests.deadlinePrefix} {new Date(collab.deadline).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{collab.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <UserBadge role="initiator" address={collab.initiator_id!} isSelf={isInitiator} />
                            {collab.provider_id && (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    <UserBadge role="provider" address={collab.provider_id} isSelf={isProvider} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 shrink-0 flex-wrap justify-end">
                        {collab.status === 'OPEN' && !isInitiator && address && (() => {
                            const myApp = applications?.find(a => a.applicant_id.toLowerCase() === address.toLowerCase());
                            const hasApplied = !!myApp;
                            return (
                                <button
                                    onClick={() => { if (!hasApplied) setShowApplyForm(true); }}
                                    disabled={hasApplied}
                                    className={hasApplied ? 'ag-btn-secondary opacity-50 cursor-not-allowed' : 'ag-btn-primary'}
                                >
                                    <span className="material-symbols-outlined !text-[18px]">{hasApplied ? 'schedule' : 'handshake'}</span>
                                    {hasApplied ? t.common.pending : t.quests.pendingQuests}
                                </button>
                            );
                        })()}
                        {isInitiator && !['SETTLED', 'CANCELLED'].includes(collab.status) && (
                            <button onClick={() => setShowCancelConfirm(true)} className="ag-btn-secondary text-red-500 hover:bg-red-50 hover:border-red-200">
                                <span className="material-symbols-outlined !text-[18px]">cancel</span>
                                {t.quests.cancelQuest}
                            </button>
                        )}
                        {isProvider && ['LOCKED', 'ACTIVE'].includes(collab.status) && (
                            <button onClick={() => setShowAbandonConfirm(true)} className="ag-btn-secondary text-amber-500 hover:bg-amber-50 hover:border-amber-200">
                                <span className="material-symbols-outlined !text-[18px]">flag</span>
                                {t.quests.abandonQuest}
                            </button>
                        )}
                    </div>
                </div>

                {/* Apply Form Modal */}
                {showApplyForm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-[#121317]/30 backdrop-blur-sm" onClick={() => setShowApplyForm(false)} />
                        <div className="relative ag-card p-8 max-w-md w-full space-y-5">
                            <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">{t.quests.applyPitch}</h3>
                            <textarea
                                value={applyMessage}
                                onChange={(e) => setApplyMessage(e.target.value)}
                                placeholder={t.quests.applyPitchPlaceholder}
                                rows={5}
                                className="w-full bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/8 transition-colors transition-transform resize-none"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowApplyForm(false)} className="ag-btn-secondary flex-1">{t.common.cancel}</button>
                                <button
                                    onClick={async () => {
                                        await applyToCollab.mutateAsync({ collabId: collab.id, message: applyMessage });
                                        setShowApplyForm(false);
                                    }}
                                    disabled={applyToCollab.isPending || !applyMessage.trim()}
                                    className="ag-btn-primary flex-1"
                                >
                                    {applyToCollab.isPending ? '…' : t.common.submit}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Applicant Screening */}
                {isInitiator && collab.status === 'OPEN' && applications && applications.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white px-2">{t.quests.viewApplicants}</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {applications.filter(a => a.status === 'PENDING').map((app: CollabApplication) => (
                                <ApplicantReviewCard
                                    key={app.id}
                                    application={app}
                                    onApprove={async () => {
                                        if (isGuildManaged) {
                                            await escrow.approveAndDeposit(
                                                collab.id,
                                                app.applicant_id as `0x${string}`,
                                                milestones,
                                                collab.total_budget,
                                            );
                                        }
                                        await approveApp.mutateAsync({ collabId: collab.id, applicationId: app.id, applicantId: app.applicant_id });
                                        escrow.reset();
                                    }}
                                    onReject={async () => {
                                        await rejectApp.mutateAsync({ collabId: collab.id, applicationId: app.id, applicantId: app.applicant_id });
                                    }}
                                    isApproving={approveApp.isPending || escrow.isPending}
                                    isRejecting={rejectApp.isPending}
                                    escrowStep={isGuildManaged ? escrow.step : undefined}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Application status for current user */}
                {!isInitiator && (() => {
                    const myApp = applications?.find(a => a.applicant_id.toLowerCase() === address?.toLowerCase());
                    if (!myApp || collab.status !== 'OPEN') return null;
                    if (myApp.status === 'REJECTED') {
                        return (
                            <div className="ag-card p-6 bg-red-50/50 border-red-200/40 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">block</span>
                                    <span className="text-sm font-medium text-red-800">{t.quests.applicationRejected}</span>
                                </div>
                                <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest">{t.quests.rejectProvider}</span>
                            </div>
                        );
                    }
                    return (
                        <div className="ag-card p-6 bg-amber-50/50 border-amber-200/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-amber-500">schedule</span>
                                <span className="text-sm font-medium text-amber-800">{t.quests.applicationPending}</span>
                            </div>
                            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">{t.common.pending}</span>
                        </div>
                    );
                })()}

                {/* Task Details */}
                {(collab.description || collab.delivery_standard || (collab.reference_links && collab.reference_links.length > 0)) && (
                    <div className="ag-card p-8 space-y-6">
                        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined !text-[20px] text-primary">description</span>
                            {t.quests.questDetails}
                        </h3>

                        {collab.description && (
                            <div>
                                <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.quests.questDescription}</p>
                                <p className="text-[14px] text-[#45474D] leading-relaxed whitespace-pre-wrap">{collab.description}</p>
                            </div>
                        )}

                        {collab.delivery_standard && (
                            <div>
                                <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.quests.deliveryStandard}</p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-semibold border border-emerald-100/60">
                                    <span className="material-symbols-outlined !text-[16px]">verified</span>
                                    {collab.delivery_standard}
                                </div>
                            </div>
                        )}

                        {collab.reference_links && collab.reference_links.length > 0 && (
                            <div>
                                <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t.quests.referenceLinks}</p>
                                <div className="space-y-2">
                                    {collab.reference_links.map((ref: any, i: number) => (
                                        <a key={i} href={safeHref(ref.url)} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-[14px] text-primary hover:underline font-medium">
                                            <span className="material-symbols-outlined !text-[16px]">link</span>
                                            {ref.label || ref.url}
                                            <span className="material-symbols-outlined !text-[12px]">open_in_new</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(isInitiator || isProvider) && (collab.status === 'LOCKED' || collab.status === 'ACTIVE' || collab.status === 'SETTLED') && collab.secret_content && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined !text-[18px] text-primary">lock_open</span>
                                    <p className="text-[12px] font-bold text-primary uppercase tracking-wider">{t.quests.secretDetails}</p>
                                </div>
                                <div className="ag-card p-6 bg-slate-50 border-slate-200">
                                    <Markdown content={collab.secret_content} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Escrow Monitor — guild_managed only */}
                {isGuildManaged && <div className="relative">
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-8 border border-slate-200 dark:border-slate-700/60 shadow-antigravity flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-1.5 rounded-lg text-primary">
                                        <span className="material-symbols-outlined text-[20px]">lock</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.quests.escrowMonitor}</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                                    {collab.total_budget.toLocaleString()}
                                </span>
                                <span className="text-xl font-medium text-slate-400 dark:text-slate-500">USDC</span>
                            </div>
                            <p className="text-sm text-slate-400 dark:text-slate-500">{t.quests.totalValueLocked}</p>
                            {isInitiator && <MintTestUSDC />}
                        </div>

                        <div className="flex-1 w-full bg-[#F0F1F5]/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/60">
                            <div className="flex justify-between text-sm font-medium mb-3">
                                <span className="text-slate-900 dark:text-white">{t.quests.fundsReleased}</span>
                                <span className="text-primary">{releasedPct}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-3 relative">
                                <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-colors transition-transform duration-700" style={{ width: `${releasedPct}%` }} />
                                {milestones.reduce((acc: number[], ms, i) => {
                                    const pos = (acc[i - 1] || 0) + ms.amount_percentage;
                                    acc.push(pos);
                                    return acc;
                                }, []).slice(0, -1).map((pos, i) => (
                                    <div key={i} className="absolute top-0 h-full w-0.5 bg-white/30" style={{ left: `${pos}%` }} />
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                                <span>{releasedAmount} USDC {t.quests.paid}</span>
                                <span>{remainingAmount} USDC {t.quests.remaining}</span>
                            </div>
                        </div>
                    </div>
                </div>}

                {/* Milestone Console */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white px-2">{t.quests.milestoneConsole}</h3>
                    {milestones.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-700/60 p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                            <span className="material-symbols-outlined !text-[48px] block mb-4 opacity-20">flag</span>
                            {t.quests.noMilestones}
                        </div>
                    ) : (
                        <MilestoneTimeline
                            milestones={milestones}
                            proofs={proofs}
                            totalBudget={collab.total_budget}
                            isInitiator={isInitiator}
                            isProvider={isProvider}
                            collabStatus={collab.status}
                            escrowStep={escrow.step}
                            onSubmitProof={(msId: string, sortOrder: number) => {
                                setProofMilestoneId(msId);
                                setProofMilestoneSortOrder(sortOrder);
                            }}
                            onConfirm={async (msId: string, sortOrder: number) => {
                                if (isGuildManaged) {
                                    await escrow.confirmMilestoneOnChain(collab.id, sortOrder - 1);
                                } else {
                                    // Self-managed: pay via DirectPay contract
                                    const ms = milestones.find(m => m.id === msId);
                                    const milestoneAmount = ms ? (collab.total_budget * ms.amount_percentage) / 100 : 0;
                                    await directPay.payMilestone(
                                        collab.id,
                                        collab.provider_id as `0x${string}`,
                                        milestoneAmount,
                                    );
                                }
                                await confirmMs.mutateAsync({ milestoneId: msId, collabId: collab.id });
                                escrow.reset();
                                directPay.reset();
                            }}
                            onHold={isInitiator ? async (msId: string) => {
                                await holdMs.mutateAsync({ milestoneId: msId, collabId: collab.id });
                            } : undefined}
                            onDispute={isGuildManaged ? async (msId: string, sortOrder: number) => {
                                await escrow.disputeMilestoneOnChain(collab.id, sortOrder - 1);
                                await disputeCollab.mutateAsync(collab.id);
                                escrow.reset();
                            } : undefined}
                        />
                    )}
                </div>

                {/* Cancel Confirm Dialog */}
                {showCancelConfirm && (
                    <ConfirmDialog
                        title={t.quests.confirmCancelTitle}
                        body={releasedPct > 0
                            ? t.quests.confirmCancelBodyPaid.replace('{amount}', releasedAmount).replace('{pct}', String(releasedPct))
                            : t.quests.confirmCancelBodyEmpty
                        }
                        confirmLabel={t.quests.confirmCancel}
                        confirmClass="bg-red-500 hover:bg-red-600 text-white"
                        isLoading={cancelCollab.isPending || escrow.isPending}
                        onConfirm={async () => {
                            if (isGuildManaged && ['LOCKED', 'ACTIVE'].includes(collab.status)) {
                                await escrow.cancelEscrow(collab.id);
                            }
                            await cancelCollab.mutateAsync(collab.id);
                            escrow.reset();
                            setShowCancelConfirm(false);
                        }}
                        onCancel={() => setShowCancelConfirm(false)}
                    />
                )}

                {/* Abandon Confirm Dialog */}
                {showAbandonConfirm && (
                    <ConfirmDialog
                        title={t.quests.confirmAbandonTitle}
                        body={t.quests.confirmAbandonBody}
                        confirmLabel={t.quests.confirmAbandon}
                        confirmClass="bg-amber-500 hover:bg-amber-600 text-white"
                        isLoading={abandonCollab.isPending}
                        onConfirm={async () => {
                            await abandonCollab.mutateAsync(collab.id);
                            setShowAbandonConfirm(false);
                        }}
                        onCancel={() => setShowAbandonConfirm(false)}
                    />
                )}

                {/* Escrow Status Banner */}
                {escrow.isPending && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#121317] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                        <span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>
                        <span className="text-sm font-medium">
                            {escrow.step === 'approving' && t.quests.escrowApproving}
                            {escrow.step === 'depositing' && t.quests.escrowDepositing}
                            {escrow.step === 'submitting' && t.quests.escrowSubmitting}
                            {escrow.step === 'confirming' && t.quests.escrowConfirming}
                            {escrow.step === 'disputing' && t.quests.escrowDisputing}
                            {escrow.step === 'cancelling' && t.quests.escrowCancelling}
                        </span>
                    </div>
                )}

                {escrow.error && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <span className="material-symbols-outlined !text-[18px]">error</span>
                        <span className="text-sm font-medium">{escrow.error}</span>
                        <button onClick={escrow.reset} className="text-xs underline ml-2">{t.common.cancel}</button>
                    </div>
                )}

                {/* DirectPay status banner (self-managed) */}
                {!isGuildManaged && directPay.isPending && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#121317] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                        <span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>
                        <span className="text-sm font-medium">
                            {directPay.step === 'approving' && t.payment.approving}
                            {directPay.step === 'paying' && t.payment.paying}
                        </span>
                    </div>
                )}
                {!isGuildManaged && directPay.error && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <span className="material-symbols-outlined !text-[18px]">error</span>
                        <span className="text-sm font-medium">{directPay.error}</span>
                        <button onClick={directPay.reset} className="text-xs underline ml-2">{t.common.cancel}</button>
                    </div>
                )}

                {/* Upload Proof Dialog */}
                <UploadProofDialog
                    milestoneId={proofMilestoneId ?? ''}
                    collabId={collab.id}
                    milestoneSortOrder={proofMilestoneSortOrder}
                    isOpen={!!proofMilestoneId}
                    onClose={() => setProofMilestoneId(null)}
                    isGuildManaged={isGuildManaged}
                />
            </div>
        </WalletGatePage>
    );
}

// ── Sub-components ──

function UserBadge({ role, address, isSelf }: { role: 'initiator' | 'provider'; address: string; isSelf: boolean }) {
    const t = useT();
    const { data: profile } = useProfileByAddress(address);
    return (
        <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">
                {role === 'initiator' ? 'person' : 'engineering'}
            </span>
            <span className="font-medium text-slate-900 dark:text-white">{displayName(profile, address)}</span>
            {isSelf && <span className="text-primary text-[10px] ml-0.5">{t.quests.you}</span>}
        </span>
    );
}

function ApplicantReviewCard({
    application,
    onApprove,
    onReject,
    isApproving,
    isRejecting,
    escrowStep,
}: {
    application: CollabApplication;
    onApprove: () => void;
    onReject: () => void;
    isApproving: boolean;
    isRejecting: boolean;
    escrowStep?: EscrowStep;
}) {
    const t = useT();
    const profile = application.applicant_profile;
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);

    return (
        <div className="ag-card p-6 space-y-4 border-slate-200/60 hover:border-primary/40 transition-colors transition-transform group">
            {/* Header: avatar + name + actions */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[15px] shrink-0">
                        {(profile?.username || application.applicant_id)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/profile?address=${application.applicant_id}`}
                            className="text-[15px] font-bold text-slate-900 dark:text-white hover:text-primary transition-colors"
                        >
                            {displayName(profile, application.applicant_id)}
                        </Link>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{application.applicant_id.slice(0, 6)}&hellip;{application.applicant_id.slice(-4)}</p>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => setShowRejectConfirm(true)}
                        disabled={isRejecting || isApproving}
                        className="px-4 py-2 text-[12px] font-bold rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        {isRejecting ? '…' : t.quests.rejectProvider}
                    </button>
                    <button
                        onClick={onApprove}
                        disabled={isApproving || isRejecting}
                        className="ag-btn-primary !px-4 !py-2 !text-[12px] shadow-none"
                    >
                        {isApproving
                            ? (escrowStep === 'approving' ? 'USDC...' : escrowStep === 'depositing' ? 'Escrow...' : '…')
                            : t.quests.approveProvider}
                    </button>
                </div>
            </div>

            {/* Profile info: bio + contact + VCP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left: bio + pitch */}
                <div className="space-y-3">
                    {profile?.bio && (
                        <p className="text-[13px] text-[#45474D] leading-relaxed line-clamp-3">{profile.bio}</p>
                    )}
                    <div className="bg-[#F8F9FC] rounded-xl p-4">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.quests.applyPitch}</p>
                        <p className="text-[13px] text-[#45474D] leading-relaxed italic">
                            &ldquo;{application.message || t.quests.noApplicationMessage}&rdquo;
                        </p>
                    </div>
                </div>

                {/* Right: contact + stats */}
                <div className="space-y-3">
                    <div className="bg-[#F8F9FC] rounded-xl p-4 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.quests.contactEmail.replace('Email', 'Contact')}</p>
                        {profile?.contact_email ? (
                            <div className="flex items-center gap-2 text-[13px] text-[#45474D]">
                                <span className="material-symbols-outlined !text-[14px] text-primary">mail</span>
                                <span>{profile.contact_email}</span>
                            </div>
                        ) : null}
                        {profile?.contact_telegram ? (
                            <div className="flex items-center gap-2 text-[13px] text-[#45474D]">
                                <span className="material-symbols-outlined !text-[14px] text-primary">send</span>
                                <span>{profile.contact_telegram}</span>
                            </div>
                        ) : null}
                        {!profile?.contact_email && !profile?.contact_telegram && (
                            <p className="text-[12px] text-[#B8BACA] italic">{t.quests.noContact}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {(profile?.vcp_cache ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary">
                                <span className="material-symbols-outlined !text-[14px]">token</span>
                                {profile!.vcp_cache} {t.quests.vcpScore}
                            </span>
                        )}
                        {profile?.portfolio && (
                            <a href={safeHref(profile.portfolio)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] text-primary font-semibold hover:underline">
                                <span className="material-symbols-outlined !text-[14px]">work</span>
                                {t.quests.portfolio}
                            </a>
                        )}
                        <Link
                            href={`/profile?address=${application.applicant_id}`}
                            className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500 font-semibold hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined !text-[14px]">person</span>
                            {t.quests.viewProfile}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Reject confirmation inline */}
            {showRejectConfirm && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[13px] font-bold text-red-700">{t.quests.confirmRejectTitle}</p>
                        <p className="text-[12px] text-red-600 mt-0.5">{t.quests.confirmRejectBody}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => setShowRejectConfirm(false)} className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-400 dark:text-slate-500 hover:bg-slate-50">{t.common.cancel}</button>
                        <button
                            onClick={async () => { await onReject(); setShowRejectConfirm(false); }}
                            disabled={isRejecting}
                            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                            {isRejecting ? '…' : t.quests.rejectProvider}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ConfirmDialog({
    title, body, confirmLabel, confirmClass, isLoading, onConfirm, onCancel,
}: {
    title: string;
    body: string;
    confirmLabel: string;
    confirmClass: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const t = useT();
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#121317]/30 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative ag-card p-8 max-w-md mx-4 space-y-5">
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-[14px] text-slate-400 dark:text-slate-500 leading-relaxed">{body}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="ag-btn-secondary flex-1">{t.common.cancel}</button>
                    <button onClick={onConfirm} disabled={isLoading} className={`flex-1 px-5 py-2.5 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition-colors transition-transform ${confirmClass}`}>
                        {isLoading && <span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
