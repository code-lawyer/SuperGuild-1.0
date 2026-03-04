'use client';

import { Milestone, Proof } from '@/hooks/useCollaborations';

interface MilestoneTimelineProps {
    milestones: Milestone[];
    proofs: Proof[];
    totalBudget: number;
    isInitiator: boolean;
    isProvider: boolean;
    onSubmitProof: (milestoneId: string) => void;
    onConfirm: (milestoneId: string) => void;
}

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
    INCOMPLETE: { label: 'LOCKED', badgeClass: 'text-[#6A6A71] bg-slate-100' },
    SUBMITTED: { label: 'IN REVIEW', badgeClass: 'text-amber-600 bg-amber-50' },
    CONFIRMED: { label: 'COMPLETED', badgeClass: 'text-green-600 bg-green-50' },
};

export default function MilestoneTimeline({
    milestones,
    proofs,
    totalBudget,
    isInitiator,
    isProvider,
    onSubmitProof,
    onConfirm,
}: MilestoneTimelineProps) {
    // Determine which milestone is "active" (first non-CONFIRMED)
    const activeIndex = milestones.findIndex(m => m.status !== 'CONFIRMED');

    return (
        <div className="space-y-4">
            {milestones.map((ms, index) => {
                const isCompleted = ms.status === 'CONFIRMED';
                const isActive = index === activeIndex;
                const isLocked = index > activeIndex && activeIndex >= 0;
                const msProofs = proofs.filter(p => p.milestone_id === ms.id);
                const amount = ((ms.amount_percentage / 100) * totalBudget).toFixed(0);
                const config = statusConfig[ms.status] || statusConfig.PENDING;

                // Completed milestone
                if (isCompleted) {
                    return (
                        <div key={ms.id} className="bg-white rounded-xl border border-[#E8EAF0]/60 p-6 flex items-start gap-4 opacity-75 hover:opacity-100 transition-opacity">
                            <div className="mt-1 flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-base font-bold text-[#121317]">
                                        Milestone {index + 1}: {ms.title}
                                    </h4>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${config.badgeClass}`}>
                                        {config.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[#6A6A71]">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">payments</span>
                                        {amount} USDT ({ms.amount_percentage}%)
                                    </span>
                                    {msProofs.length > 0 && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <a className="text-primary hover:underline flex items-center gap-1 cursor-pointer" href={msProofs[0].content_url} target="_blank" rel="noopener">
                                                View Deliverable
                                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }

                // Active milestone
                if (isActive) {
                    return (
                        <div key={ms.id} className="relative bg-white rounded-xl border-l-4 border-l-primary border-y border-r border-[#E8EAF0]/60 p-6 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-transform">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 animate-pulse">
                                        <span className="text-xs font-bold">{index + 1}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-[#121317]">
                                            Milestone {index + 1}: {ms.title}
                                        </h4>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ring-1 ring-inset ring-blue-700/10 ${ms.status === 'SUBMITTED' ? config.badgeClass : 'text-primary bg-blue-50'}`}>
                                            {ms.status === 'SUBMITTED' ? config.label : 'IN PROGRESS'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#6A6A71] mb-1">
                                        <span className="font-mono">{amount} USDT</span> · {ms.amount_percentage}% of total budget
                                    </p>

                                    {/* Submitted proofs */}
                                    {msProofs.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {msProofs.map(proof => (
                                                <div key={proof.id} className="bg-[#F0F1F5]/50 rounded-lg p-3 border border-[#E8EAF0]/60 flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-[16px] text-emerald-500">task_alt</span>
                                                    <a href={proof.content_url} target="_blank" rel="noopener" className="text-sm text-primary hover:underline truncate flex-1">
                                                        {proof.content_url}
                                                    </a>
                                                    <span className="text-[10px] font-mono text-[#6A6A71] shrink-0">
                                                        {proof.content_hash?.slice(0, 8)}...
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Area */}
                                    {isProvider && ms.status === 'INCOMPLETE' && (
                                        <div className="mt-6 bg-[#F0F1F5]/50 rounded-lg p-5 border border-dashed border-slate-300">
                                            <label className="block text-xs font-bold text-[#6A6A71] uppercase tracking-wide mb-3">Submit Deliverable</label>
                                            <button
                                                onClick={() => onSubmitProof(ms.id)}
                                                className="bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md shadow-primary/20 transition-colors transition-transform flex items-center gap-2"
                                            >
                                                <span>Submit for Review</span>
                                                <span className="material-symbols-outlined text-[18px]">send</span>
                                            </button>
                                        </div>
                                    )}

                                    {isInitiator && ms.status === 'SUBMITTED' && (
                                        <div className="mt-6 flex gap-3">
                                            <button
                                                onClick={() => onConfirm(ms.id)}
                                                className="bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md shadow-primary/20 transition-colors transition-transform flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                Approve & Release {amount} USDT
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }

                // Locked milestone
                return (
                    <div key={ms.id} className="bg-[#F0F1F5]/50 rounded-xl border border-[#E8EAF0]/60 p-6 flex items-start gap-4 opacity-60">
                        <div className="mt-1 flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-[#6A6A71] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-base font-medium text-[#45474D]">
                                    Milestone {index + 1}: {ms.title}
                                </h4>
                                <span className="text-xs font-bold text-[#6A6A71] bg-slate-100 px-2 py-1 rounded">
                                    LOCKED
                                </span>
                            </div>
                            <p className="text-sm text-[#6A6A71]">{amount} USDT · {ms.amount_percentage}%</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
