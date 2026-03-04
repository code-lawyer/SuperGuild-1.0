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
    useAbandonCollaboration,
    useCancelCollaboration,
    useConfirmMilestone,
    CollabStatus,
    CollabApplication,
} from '@/hooks/useCollaborations';
import { useT } from '@/lib/i18n';
import Markdown from '@/components/ui/Markdown';
import { useProfileByAddress, displayName } from '@/hooks/useProfile';
import MilestoneTimeline from '@/components/collaborations/MilestoneTimeline';
import UploadProofDialog from '@/components/collaborations/UploadProofDialog';
import { WalletGatePage } from '@/components/ui/WalletGatePage';

const statusConfig: Record<CollabStatus, { label: string; badgeClass: string }> = {
    OPEN: { label: '开放', badgeClass: 'bg-blue-50 text-blue-700 ring-blue-700/10' },
    PENDING_APPROVAL: { label: '待审批', badgeClass: 'bg-amber-50 text-amber-700 ring-amber-700/10' },
    LOCKED: { label: '已锁定', badgeClass: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' },
    ACTIVE: { label: '进行中', badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10' },
    PENDING: { label: '待审核', badgeClass: 'bg-purple-50 text-purple-700 ring-purple-700/10' },
    SETTLED: { label: '已结算', badgeClass: 'bg-green-50 text-green-700 ring-green-700/10' },
    DISPUTED: { label: '争议中', badgeClass: 'bg-red-50 text-red-700 ring-red-700/10' },
    CANCELLED: { label: '已撤销', badgeClass: 'bg-gray-50 text-gray-700 ring-gray-700/10' },
};

export default function CollaborationDetailPage() {
    const t = useT();
    const params = useParams();
    const id = params.id as string;
    const { address } = useAccount();

    const { data, isLoading, error } = useCollaborationDetail(id);
    const { data: applications } = useCollabApplications(id);
    const applyToCollab = useApplyToCollab();
    const approveApp = useApproveApplication();
    const abandonCollab = useAbandonCollaboration();
    const cancelCollab = useCancelCollaboration();
    const confirmMs = useConfirmMilestone();

    const [applyMessage, setApplyMessage] = useState('');
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [proofMilestoneId, setProofMilestoneId] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#6A6A71] space-y-4">
                <span className="material-symbols-outlined !text-[40px] animate-spin">progress_activity</span>
                <p className="text-sm font-medium">Loading workspace&hellip;</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#6A6A71] space-y-4">
                <span className="material-symbols-outlined !text-[40px]">error</span>
                <p className="text-sm font-medium">Unable to load quest workspace</p>
                <Link href="/collaborations" className="ag-btn-secondary text-xs">Back to list</Link>
            </div>
        );
    }

    const { collaboration: collab, milestones, proofs } = data;
    const status = statusConfig[collab.status] || statusConfig.OPEN;
    const isInitiator = address?.toLowerCase() === collab.initiator_id?.toLowerCase();
    const isProvider = address?.toLowerCase() === collab.provider_id?.toLowerCase();

    const completedMs = milestones.filter(m => m.status === 'CONFIRMED');
    const releasedPct = completedMs.reduce((sum, m) => sum + m.amount_percentage, 0);
    const releasedAmount = ((releasedPct / 100) * collab.total_budget).toFixed(0);
    const remainingAmount = (collab.total_budget - Number(releasedAmount)).toFixed(0);

    return (
        <WalletGatePage>
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 flex flex-col gap-8 pb-24">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-[#6A6A71]">
                    <Link href="/collaborations" className="hover:text-primary transition-colors">任务列表</Link>
                    <span className="material-symbols-outlined text-[16px] mx-2">chevron_right</span>
                    <span className="text-[#121317] font-medium">{collab.title}</span>
                </div>

                {/* Hero */}
                <div className="flex justify-between items-start gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.badgeClass}`}>
                                {status.label}
                            </span>
                            {collab.deadline && (
                                <span className="text-[12px] text-[#6A6A71] font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[14px]">schedule</span>
                                    截止 {new Date(collab.deadline).toLocaleDateString('zh-CN')}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#121317] tracking-tight mb-3">{collab.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-[#6A6A71]">
                            <UserBadge label="发布人" address={collab.initiator_id!} isSelf={isInitiator} />
                            {collab.provider_id && (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    <UserBadge label="承接人" address={collab.provider_id} isSelf={isProvider} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 shrink-0 flex-wrap justify-end">
                        {/* Apply to accept */}
                        {collab.status === 'OPEN' && !isInitiator && address && (
                            <button
                                onClick={() => setShowApplyForm(true)}
                                className="ag-btn-primary"
                            >
                                <span className="material-symbols-outlined !text-[18px]">handshake</span>
                                {t.quests.pendingQuests}
                            </button>
                        )}

                        {/* Initiator: Cancel */}
                        {isInitiator && !['SETTLED', 'CANCELLED'].includes(collab.status) && (
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="ag-btn-secondary text-red-500 hover:bg-red-50 hover:border-red-200"
                            >
                                <span className="material-symbols-outlined !text-[18px]">cancel</span>
                                撤销任务
                            </button>
                        )}

                        {/* Provider: Abandon */}
                        {isProvider && ['LOCKED', 'ACTIVE'].includes(collab.status) && (
                            <button
                                onClick={() => setShowAbandonConfirm(true)}
                                className="ag-btn-secondary text-amber-500 hover:bg-amber-50 hover:border-amber-200"
                            >
                                <span className="material-symbols-outlined !text-[18px]">flag</span>
                                放弃任务
                            </button>
                        )}
                    </div>
                </div>

                {/* Apply Form Modal (Adventurer side) */}
                {showApplyForm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-[#121317]/30 backdrop-blur-sm" onClick={() => setShowApplyForm(false)} />
                        <div className="relative ag-card p-8 max-w-md w-full space-y-5">
                            <h3 className="text-[18px] font-bold text-[#121317]">{t.quests.applyPitch}</h3>
                            <textarea
                                value={applyMessage}
                                onChange={(e) => setApplyMessage(e.target.value)}
                                placeholder={t.quests.applyPitchPlaceholder}
                                rows={5}
                                className="w-full bg-slate-50 border border-[#E8EAF0] rounded-2xl px-5 py-3.5 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:ring-2 focus:ring-primary/8 transition-colors transition-transform resize-none"
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

                {/* Applicant Screening (Initiator side) */}
                {isInitiator && collab.status === 'OPEN' && applications && applications.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#121317] px-2">{t.quests.viewApplicants}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {applications.map((app: CollabApplication) => (
                                <ApplicantReviewCard
                                    key={app.id}
                                    application={app}
                                    onApprove={() => approveApp.mutateAsync({ collabId: collab.id, applicationId: app.id, applicantId: app.applicant_id })}
                                    isApproving={approveApp.isPending}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Application status for current user (if applicant) */}
                {!isInitiator && applications?.find(a => a.applicant_id.toLowerCase() === address?.toLowerCase()) && collab.status === 'OPEN' && (
                    <div className="ag-card p-6 bg-amber-50/50 border-amber-200/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-amber-500">schedule</span>
                            <span className="text-sm font-medium text-amber-800">你的承接申请正在等待发布人审核</span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Pending</span>
                    </div>
                )}

                {/* Task Details */}
                {(collab.description || collab.delivery_standard || (collab.reference_links && collab.reference_links.length > 0)) && (
                    <div className="ag-card p-8 space-y-6">
                        <h3 className="text-[16px] font-bold text-[#121317] flex items-center gap-2">
                            <span className="material-symbols-outlined !text-[20px] text-primary">description</span>
                            任务详情
                        </h3>

                        {collab.description && (
                            <div>
                                <p className="text-[12px] font-bold text-[#6A6A71] uppercase tracking-wider mb-2">任务描述</p>
                                <p className="text-[14px] text-[#45474D] leading-relaxed whitespace-pre-wrap">{collab.description}</p>
                            </div>
                        )}

                        {collab.delivery_standard && (
                            <div>
                                <p className="text-[12px] font-bold text-[#6A6A71] uppercase tracking-wider mb-2">交付标准</p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-semibold border border-emerald-100/60">
                                    <span className="material-symbols-outlined !text-[16px]">verified</span>
                                    {collab.delivery_standard}
                                </div>
                            </div>
                        )}

                        {collab.reference_links && collab.reference_links.length > 0 && (
                            <div>
                                <p className="text-[12px] font-bold text-[#6A6A71] uppercase tracking-wider mb-2">参考资料</p>
                                <div className="space-y-2">
                                    {collab.reference_links.map((ref: any, i: number) => (
                                        <a
                                            key={i}
                                            href={ref.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-[14px] text-primary hover:underline font-medium"
                                        >
                                            <span className="material-symbols-outlined !text-[16px]">link</span>
                                            {ref.label || ref.url}
                                            <span className="material-symbols-outlined !text-[12px]">open_in_new</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Secret Details (Unlocked) */}
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

                {/* Escrow Monitor */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
                    <div className="relative bg-white rounded-xl p-8 border border-[#E8EAF0]/60 shadow-antigravity flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-1.5 rounded-lg text-primary">
                                        <span className="material-symbols-outlined text-[20px]">lock</span>
                                    </div>
                                    <span className="text-sm font-bold text-[#6A6A71] uppercase tracking-wider">Escrow Monitor</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-5xl font-black text-[#121317] tracking-tight tabular-nums">
                                    {collab.total_budget.toLocaleString()}
                                </span>
                                <span className="text-xl font-medium text-[#6A6A71]">USDC</span>
                            </div>
                            <p className="text-sm text-[#6A6A71]">Total Value Locked</p>
                        </div>

                        <div className="flex-1 w-full bg-[#F0F1F5]/50 rounded-xl p-6 border border-[#E8EAF0]/60">
                            <div className="flex justify-between text-sm font-medium mb-3">
                                <span className="text-[#121317]">Funds Released</span>
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
                            <div className="flex justify-between text-xs text-[#6A6A71]">
                                <span>{releasedAmount} USDC 已支付</span>
                                <span>{remainingAmount} USDC 剩余</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Milestone Console */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[#121317] px-2">里程碑控制台</h3>
                    {milestones.length === 0 ? (
                        <div className="bg-white rounded-xl border border-[#E8EAF0]/60 p-12 text-center text-[#6A6A71] text-sm">
                            <span className="material-symbols-outlined !text-[48px] block mb-4 opacity-20">flag</span>
                            暂无里程碑
                        </div>
                    ) : (
                        <MilestoneTimeline
                            milestones={milestones}
                            proofs={proofs}
                            totalBudget={collab.total_budget}
                            isInitiator={isInitiator}
                            isProvider={isProvider}
                            onSubmitProof={(msId: string) => setProofMilestoneId(msId)}
                            onConfirm={(msId: string) => confirmMs.mutateAsync({ milestoneId: msId, collabId: collab.id })}
                        />
                    )}
                </div>

                {/* Cancel Confirm Dialog */}
                {showCancelConfirm && (
                    <ConfirmDialog
                        title="确认撤销任务？"
                        body={releasedPct > 0
                            ? `已支付的 ${releasedAmount} USDC（${releasedPct}%）不予退回。确定要撤销吗？`
                            : '任务撤销后将对所有人不可见。确定要撤销吗？'
                        }
                        confirmLabel="确认撤销"
                        confirmClass="bg-red-500 hover:bg-red-600 text-white"
                        isLoading={cancelCollab.isPending}
                        onConfirm={async () => {
                            await cancelCollab.mutateAsync(collab.id);
                            setShowCancelConfirm(false);
                        }}
                        onCancel={() => setShowCancelConfirm(false)}
                    />
                )}

                {/* Abandon Confirm Dialog */}
                {showAbandonConfirm && (
                    <ConfirmDialog
                        title="确认放弃任务？"
                        body="放弃后任务将重新开放，其他人可以承接。"
                        confirmLabel="确认放弃"
                        confirmClass="bg-amber-500 hover:bg-amber-600 text-white"
                        isLoading={abandonCollab.isPending}
                        onConfirm={async () => {
                            await abandonCollab.mutateAsync(collab.id);
                            setShowAbandonConfirm(false);
                        }}
                        onCancel={() => setShowAbandonConfirm(false)}
                    />
                )}

                {/* Upload Proof Dialog */}
                <UploadProofDialog
                    milestoneId={proofMilestoneId ?? ''}
                    isOpen={!!proofMilestoneId}
                    onClose={() => setProofMilestoneId(null)}
                />
            </div>
        </WalletGatePage>
    );
}

// ── Sub-components ──

function UserBadge({ label, address, isSelf }: { label: string; address: string; isSelf: boolean }) {
    const { data: profile } = useProfileByAddress(address);
    return (
        <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">
                {label === '发布人' ? 'person' : 'engineering'}
            </span>
            <span className="font-medium text-[#121317]">{displayName(profile, address)}</span>
            {isSelf && <span className="text-primary text-[10px] ml-0.5">(你)</span>}
        </span>
    );
}

function ApplicantReviewCard({
    application,
    onApprove,
    isApproving,
}: {
    application: CollabApplication;
    onApprove: () => void;
    isApproving: boolean;
}) {
    const { data: profile } = useProfileByAddress(application.applicant_id);

    return (
        <div className="ag-card p-6 space-y-4 border-slate-200/60 hover:border-primary/40 transition-colors transition-transform group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[14px]">
                        {(profile?.username || application.applicant_id)[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-[#121317]">{displayName(profile, application.applicant_id)}</p>
                        <p className="text-[11px] text-[#6A6A71] font-mono">{application.applicant_id.slice(0, 6)}&hellip;{application.applicant_id.slice(-4)}</p>
                    </div>
                </div>
                <button
                    onClick={onApprove}
                    disabled={isApproving}
                    className="ag-btn-primary !px-4 !py-2 !text-[12px] shadow-none"
                >
                    {isApproving ? '…' : '确认承接'}
                </button>
            </div>

            <div className="bg-[#F8F9FC] rounded-xl p-4">
                <p className="text-[13px] text-[#45474D] leading-relaxed italic">
                    “{application.message || '该申请人未提供具体方案说明。'}”
                </p>
            </div>

            {profile?.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] text-primary font-semibold hover:underline">
                    <span className="material-symbols-outlined !text-[14px]">work</span>
                    作品集资料
                </a>
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
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#121317]/30 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative ag-card p-8 max-w-md mx-4 space-y-5">
                <h3 className="text-[18px] font-bold text-[#121317]">{title}</h3>
                <p className="text-[14px] text-[#6A6A71] leading-relaxed">{body}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="ag-btn-secondary flex-1">取消</button>
                    <button onClick={onConfirm} disabled={isLoading} className={`flex-1 px-5 py-2.5 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition-colors transition-transform ${confirmClass}`}>
                        {isLoading && <span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
