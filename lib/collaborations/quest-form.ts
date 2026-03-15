import { useT } from '@/lib/i18n';

export interface MilestoneInput {
    title: string;
    amount_percentage: number;
}

export interface ReferenceLink {
    label: string;
    url: string;
}

export const GRADE_CONFIG: Record<string, { minBudget: number; vcp: number; minMilestones: number; color: string; bg: string; border: string }> = {
    S: { minBudget: 5000, vcp: 500, minMilestones: 3, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20' },
    A: { minBudget: 2000, vcp: 300, minMilestones: 3, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
    B: { minBudget: 800, vcp: 150, minMilestones: 1, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
    C: { minBudget: 300, vcp: 80, minMilestones: 1, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
    D: { minBudget: 100, vcp: 40, minMilestones: 1, color: 'text-cyan-500', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
    E: { minBudget: 0, vcp: 10, minMilestones: 1, color: 'text-slate-400', bg: 'bg-slate-400/5', border: 'border-slate-400/20' },
};

export const CATEGORIES = [
    { value: 'development', icon: 'code' },
    { value: 'design', icon: 'palette' },
    { value: 'content', icon: 'article' },
    { value: 'audit', icon: 'security' },
    { value: 'operations', icon: 'campaign' },
    { value: 'research', icon: 'science' },
    { value: 'other', icon: 'more_horiz' },
] as const;

export function useDeliveryPresets() {
    const t = useT();
    return [
        { label: t.quests.deliveryDesign, value: t.quests.deliveryDesignFull },
        { label: t.quests.deliveryCode, value: t.quests.deliveryCodeFull },
        { label: t.quests.deliveryDoc, value: t.quests.deliveryDocFull },
        { label: t.quests.deliveryVideo, value: t.quests.deliveryVideoFull },
        { label: t.quests.deliveryDeploy, value: t.quests.deliveryDeployFull },
    ];
}
