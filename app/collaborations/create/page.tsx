'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { useCreateCollaboration } from '@/hooks/useCollaborations';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { WalletGatePage } from '@/components/ui/WalletGatePage';

interface MilestoneInput {
    title: string;
    amount_percentage: number;
}

interface ReferenceLink {
    label: string;
    url: string;
}

const GRADE_CONFIG: Record<string, { minBudget: number; vcp: number; minMilestones: number; color: string; bg: string; border: string }> = {
    S: { minBudget: 5000, vcp: 500, minMilestones: 3, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20' },
    A: { minBudget: 2000, vcp: 300, minMilestones: 3, color: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
    B: { minBudget: 800, vcp: 150, minMilestones: 1, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
    C: { minBudget: 300, vcp: 80, minMilestones: 1, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
    D: { minBudget: 100, vcp: 40, minMilestones: 1, color: 'text-cyan-500', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
    E: { minBudget: 0, vcp: 10, minMilestones: 1, color: 'text-slate-400', bg: 'bg-slate-400/5', border: 'border-slate-400/20' },
};

const CATEGORIES = [
    { value: 'development', icon: 'code' },
    { value: 'design', icon: 'palette' },
    { value: 'content', icon: 'article' },
    { value: 'audit', icon: 'security' },
    { value: 'operations', icon: 'campaign' },
    { value: 'research', icon: 'science' },
    { value: 'other', icon: 'more_horiz' },
] as const;

function useDeliveryPresets() {
    const t = useT();
    return [
        { label: t.quests.deliveryDesign, value: t.quests.deliveryDesignFull },
        { label: t.quests.deliveryCode, value: t.quests.deliveryCodeFull },
        { label: t.quests.deliveryDoc, value: t.quests.deliveryDocFull },
        { label: t.quests.deliveryVideo, value: t.quests.deliveryVideoFull },
        { label: t.quests.deliveryDeploy, value: t.quests.deliveryDeployFull },
    ];
}

export default function CreateCollaborationPage() {
    const t = useT();
    const router = useRouter();
    const createCollab = useCreateCollaboration();
    const { isAuthenticated, signIn, isAuthenticating } = useAuth();
    const DELIVERY_PRESETS = useDeliveryPresets();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [grade, setGrade] = useState('E');
    const [rewardToken, setRewardToken] = useState('USDC');
    const [secretContent, setSecretContent] = useState('');
    const [referenceLinks, setReferenceLinks] = useState<ReferenceLink[]>([]);
    const [deadline, setDeadline] = useState('');
    const [deliveryStandard, setDeliveryStandard] = useState('');
    const [customDelivery, setCustomDelivery] = useState('');
    const [paymentMode, setPaymentMode] = useState<'self_managed' | 'guild_managed'>('self_managed');
    const [category, setCategory] = useState('other');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [slotBudget, setSlotBudget] = useState('');
    const [maxProviders, setMaxProviders] = useState(1);
    const [milestones, setMilestones] = useState<MilestoneInput[]>([
        { title: '', amount_percentage: 100 },
    ]);

    const gradeConf = GRADE_CONFIG[grade];
    const budgetMeetsGrade = Number(slotBudget) >= gradeConf.minBudget;
    const totalBudgetDisplay = Number(slotBudget) * maxProviders;
    const milestonesMeetGrade = milestones.length >= gradeConf.minMilestones;

    const totalPercentage = milestones.reduce((sum: number, m: MilestoneInput) => sum + m.amount_percentage, 0);
    const finalDelivery = deliveryStandard === 'custom' ? customDelivery : deliveryStandard;
    const isValid =
        title.trim() &&
        description.trim() &&
        Number(slotBudget) > 0 &&
        budgetMeetsGrade &&
        milestonesMeetGrade &&
        totalPercentage === 100 &&
        milestones.every((m: MilestoneInput) => m.title.trim()) &&
        finalDelivery.trim() &&
        paymentMode === 'self_managed'; // MVP: guild_managed not yet open

    const addMilestone = () => setMilestones([...milestones, { title: '', amount_percentage: 0 }]);
    const removeMilestone = (i: number) => {
        if (milestones.length <= 1) return;
        setMilestones(milestones.filter((_: MilestoneInput, idx: number) => idx !== i));
    };
    const updateMilestone = (i: number, field: keyof MilestoneInput, val: string | number) => {
        const updated = [...milestones];
        if (field === 'amount_percentage') updated[i][field] = Number(val);
        else updated[i][field] = val as string;
        setMilestones(updated);
    };

    const addRef = () => setReferenceLinks([...referenceLinks, { label: '', url: '' }]);
    const removeRef = (i: number) => setReferenceLinks(referenceLinks.filter((_, idx) => idx !== i));
    const updateRef = (i: number, field: keyof ReferenceLink, val: string) => {
        const updated = [...referenceLinks];
        updated[i][field] = val;
        setReferenceLinks(updated);
    };

    const addTag = (raw: string) => {
        const tag = raw.trim().toLowerCase().replace(/[^a-z0-9\-_\u4e00-\u9fff]/g, '').slice(0, 20);
        if (tag && !tags.includes(tag) && tags.length < 8) {
            setTags([...tags, tag]);
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const handleSubmit = async () => {
        if (!isValid) return;

        // Ensure user is authenticated before writing
        if (!isAuthenticated) {
            const ok = await signIn();
            if (!ok) {
                toast({ title: t.common.connectWallet, description: t.quests.authRequiredDesc, variant: 'destructive' });
                return;
            }
        }

        try {
            const result = await createCollab.mutateAsync({
                title: title.trim(),
                description: description.trim(),
                grade: grade,
                reward_token: rewardToken,
                total_budget: Number(slotBudget) * maxProviders,
                slot_budget: Number(slotBudget),
                max_providers: maxProviders,
                category,
                tags,
                secret_content: secretContent.trim(),
                payment_mode: paymentMode,
                reference_links: referenceLinks.filter((r: ReferenceLink) => r.url.trim()),
                deadline: deadline || undefined,
                delivery_standard: finalDelivery.trim(),
                milestones,
            });
            router.push(`/collaborations/${result.id}`);
        } catch (e: any) {
            console.error('Failed to create collaboration:', e);
            toast({ title: t.quests.createFailed, description: e?.message ?? 'Unknown error', variant: 'destructive' });
        }
    };

    return (
        <WalletGatePage>
            <div className="max-w-[640px] mx-auto px-6 py-16">
                <Link href="/collaborations" className="inline-flex items-center gap-2 text-[14px] text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white transition-colors duration-200 mb-10 font-medium">
                    <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                    {t.quests.backToList}
                </Link>

                <div className="space-y-10">
                    {/* Header */}
                    <div className="fade-up">
                        <h1 className="text-[clamp(28px,4vw,36px)] font-[450] text-slate-900 dark:text-white tracking-[-0.02em] mb-2">
                            {t.quests.createNewQuest}
                        </h1>
                        <p className="text-slate-400 dark:text-slate-500 text-[15px] font-medium">{t.quests.createNewQuestDesc}</p>
                    </div>

                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.grade} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {[
                                { key: 'S', label: t.quests.gradeS },
                                { key: 'A', label: t.quests.gradeA },
                                { key: 'B', label: t.quests.gradeB },
                                { key: 'C', label: t.quests.gradeC },
                                { key: 'D', label: t.quests.gradeD },
                                { key: 'E', label: t.quests.gradeE },
                            ].map((g) => {
                                const conf = GRADE_CONFIG[g.key];
                                return (
                                    <button
                                        key={g.key}
                                        onClick={() => setGrade(g.key)}
                                        className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-0.5 ${grade === g.key
                                            ? `ring-2 ring-primary border-primary ${conf.bg}`
                                            : 'bg-white border-slate-200 dark:border-slate-700 hover:border-primary/40'
                                            }`}
                                    >
                                        <span className={`text-[16px] font-black ${conf.color}`}>{g.label}</span>
                                        <span className="text-[10px] text-[#B8BACA] font-bold">{conf.vcp} {t.quests.gradeVcp}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {gradeConf.minBudget > 0 && (
                            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-2">
                                {t.quests.gradeMinBudget}: {gradeConf.minBudget} USDC
                                {gradeConf.minMilestones > 1 && <> · {t.quests.gradeMinMilestones}: {gradeConf.minMilestones}</>}
                            </p>
                        )}
                        {gradeConf.minMilestones > 1 && milestones.length > 1 && !milestonesMeetGrade && (
                            <p className="text-[12px] text-red-500 font-medium mt-1">{t.quests.gradeMilestoneTooFew}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.categoryLabel} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                            {CATEGORIES.map((cat) => {
                                const labelKey = `cat${cat.value.charAt(0).toUpperCase() + cat.value.slice(1)}` as keyof typeof t.quests;
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setCategory(cat.value)}
                                        className={`p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                                            category === cat.value
                                                ? 'ring-2 ring-primary border-primary bg-primary/5'
                                                : 'bg-white border-slate-200 dark:border-slate-700 hover:border-primary/40'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined !text-[18px] ${category === cat.value ? 'text-primary' : 'text-slate-400'}`}>
                                            {cat.icon}
                                        </span>
                                        <span className={`text-[10px] font-bold ${category === cat.value ? 'text-primary' : 'text-slate-500'}`}>
                                            {t.quests[labelKey as keyof typeof t.quests] as string}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.tagsLabel}
                        </label>
                        <div className="min-h-[48px] w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 flex flex-wrap gap-2 items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/8 transition-colors">
                            {tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[12px] font-bold rounded-full">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined !text-[12px]">close</span>
                                    </button>
                                </span>
                            ))}
                            {tags.length < 8 && (
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    onBlur={() => tagInput && addTag(tagInput)}
                                    placeholder={tags.length === 0 ? t.quests.tagsPlaceholder : ''}
                                    className="flex-1 min-w-[120px] bg-transparent text-[13px] text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none"
                                />
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">{t.quests.tagsHint}</p>
                    </div>

                    {/* Title */}
                    <div className="fade-up fade-up-delay-1">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.questTitleLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t.quests.questTitlePlaceholder}
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform duration-200 shadow-sm"
                        />
                    </div>

                    {/* Description */}
                    <div className="fade-up fade-up-delay-2">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.questDescLabel} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.quests.questDescPlaceholder}
                            rows={5}
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform duration-200 shadow-sm resize-none"
                        />
                    </div>

                    {/* Reference Links */}
                    <div className="fade-up">
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.quests.referenceLinks}</label>
                            <button onClick={addRef} className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[14px]">add</span>
                                {t.quests.addLink}
                            </button>
                        </div>
                        {referenceLinks.length === 0 && (
                            <p className="text-[13px] text-[#B8BACA] italic">{t.quests.noReferences}</p>
                        )}
                        <div className="space-y-2">
                            {referenceLinks.map((ref: ReferenceLink, i: number) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ref.label}
                                        onChange={(e) => updateRef(i, 'label', e.target.value)}
                                        placeholder={t.quests.linkLabel}
                                        className="w-1/3 bg-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors transition-transform"
                                    />
                                    <input
                                        type="url"
                                        value={ref.url}
                                        onChange={(e) => updateRef(i, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 bg-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors transition-transform"
                                    />
                                    <button onClick={() => removeRef(i)} className="text-[#D1D5E0] hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined !text-[18px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deadline */}
                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.deadlineLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform duration-200 shadow-sm"
                        />
                    </div>

                    {/* Delivery Standard */}
                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.deliveryStandardLabel} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {DELIVERY_PRESETS.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => { setDeliveryStandard(p.value); setCustomDelivery(''); }}
                                    className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors transition-transform duration-200 ${deliveryStandard === p.value
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-white text-[#45474D] border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:text-primary'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                            <button
                                onClick={() => setDeliveryStandard('custom')}
                                className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors transition-transform duration-200 ${deliveryStandard === 'custom'
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-[#45474D] border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:text-primary'
                                    }`}
                            >
                                {t.quests.customLabel}
                            </button>
                        </div>
                        {deliveryStandard === 'custom' && (
                            <input
                                type="text"
                                value={customDelivery}
                                onChange={(e) => setCustomDelivery(e.target.value)}
                                placeholder={t.quests.customDeliveryPlaceholder}
                                className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform duration-200 shadow-sm"
                            />
                        )}
                    </div>

                    {/* Budget — slot_budget × max_providers */}
                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.slotBudgetLabel} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3 items-start">
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    value={slotBudget}
                                    onChange={(e) => setSlotBudget(e.target.value)}
                                    placeholder="500"
                                    min="0"
                                    className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors duration-200 tabular-nums shadow-sm"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <span className="text-[14px] font-black text-slate-400">USDC</span>
                                </div>
                            </div>
                            <div className="pt-3.5 text-[18px] font-black text-slate-300 select-none">×</div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    value={maxProviders}
                                    onChange={(e) => setMaxProviders(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                                    min="1"
                                    max="20"
                                    className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-[14px] text-center text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 tabular-nums shadow-sm"
                                />
                                <p className="text-[10px] text-slate-400 text-center mt-1">{t.quests.maxProvidersLabel}</p>
                            </div>
                        </div>
                        {Number(slotBudget) > 0 && maxProviders > 1 && (
                            <p className="text-[12px] text-primary font-semibold mt-2">
                                {t.quests.totalBudgetHint.replace('{total}', totalBudgetDisplay.toString())}
                            </p>
                        )}
                        {Number(slotBudget) > 0 && !budgetMeetsGrade && (
                            <p className="text-[12px] text-red-500 font-medium mt-1">{t.quests.gradeBudgetTooLow}</p>
                        )}
                    </div>

                    {/* Secret Details */}
                    <div className="fade-up">
                        <div className="flex items-center gap-2 mb-2.5">
                            <label className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {t.quests.secretDetails}
                            </label>
                            <span className="material-symbols-outlined !text-[16px] text-primary" title={t.quests.secretDetailsDesc}>lock</span>
                        </div>
                        <p className="text-[12px] text-slate-400 mb-3">{t.quests.secretDetailsDesc}</p>
                        <textarea
                            value={secretContent}
                            onChange={(e) => setSecretContent(e.target.value)}
                            placeholder={t.quests.secretPlaceholder}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform duration-200 shadow-sm resize-none"
                        />
                    </div>

                    {/* Payment Mode */}
                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.payment.modeTitle} <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[13px] text-slate-400 dark:text-slate-500 mb-3">{t.payment.modeSectionDesc}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Self-Managed — selectable */}
                            <button
                                type="button"
                                onClick={() => setPaymentMode('self_managed')}
                                className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                                    paymentMode === 'self_managed'
                                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                                        : 'bg-white border-slate-200 dark:border-slate-700 hover:border-primary/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[14px] font-bold text-slate-900 dark:text-white">{t.payment.selfManaged}</span>
                                    <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                        {t.payment.selfManagedVcp}
                                    </span>
                                </div>
                                <p className="text-[12px] text-slate-400 dark:text-slate-500">{t.payment.selfManagedDesc}</p>
                            </button>

                            {/* Guild Managed — disabled (Coming Soon) */}
                            <div
                                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#F8F9FC] opacity-50 cursor-not-allowed relative"
                                title={t.payment.comingSoonTooltip}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[14px] font-bold text-slate-400 dark:text-slate-500">{t.payment.guildManaged}</span>
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-[#E8EAF0] px-2 py-0.5 rounded-full">
                                        {t.payment.comingSoon}
                                    </span>
                                </div>
                                <p className="text-[12px] text-[#B8BACA]">{t.payment.guildManagedDesc}</p>
                            </div>
                        </div>

                        {/* Risk warning */}
                        {paymentMode === 'self_managed' && (
                            <div className="mt-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                                <p className="text-[12px] text-amber-700 leading-relaxed">
                                    {t.payment.selfManagedWarning}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Milestones */}
                    <div className="fade-up">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.quests.milestoneBreakdown}</label>
                            <span className={`text-[13px] font-bold tabular-nums ${totalPercentage === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {t.quests.totalLabel}: {totalPercentage}%
                            </span>
                        </div>

                        <div className="space-y-3">
                            {milestones.map((ms: MilestoneInput, i: number) => (
                                <div key={i} className="ag-card p-5 flex items-start gap-3">
                                    <span className="text-[12px] font-bold text-[#D1D5E0] pt-3 shrink-0 tabular-nums">#{i + 1}</span>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={ms.title}
                                            onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                                            placeholder={t.quests.milestoneTitlePlaceholder}
                                            className="w-full bg-[#F8F9FC] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-colors transition-transform duration-200"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={ms.amount_percentage}
                                                onChange={(e) => updateMilestone(i, 'amount_percentage', e.target.value)}
                                                min="0"
                                                max="100"
                                                className="w-24 bg-[#F8F9FC] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[14px] text-slate-900 dark:text-white focus:outline-none focus:border-primary tabular-nums"
                                            />
                                            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-bold">%</span>
                                            {Number(slotBudget) > 0 && (
                                                <span className="text-[13px] text-slate-400 dark:text-slate-500 ml-2 tabular-nums">
                                                    ≈ {((Number(slotBudget) * ms.amount_percentage) / 100).toFixed(0)} USDC
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {milestones.length > 1 && (
                                        <button onClick={() => removeMilestone(i)} className="text-[#D1D5E0] hover:text-red-500 transition-colors duration-200 pt-3" aria-label="Remove milestone">
                                            <span className="material-symbols-outlined !text-[18px]">remove_circle</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button onClick={addMilestone} className="ag-btn-secondary w-full mt-4 py-3 text-[13px]">
                            <span className="material-symbols-outlined !text-[16px]">add_circle</span>
                            {t.quests.addMilestone}
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || createCollab.isPending}
                        className="ag-btn-primary w-full py-4 text-[14px] font-bold"
                    >
                        {createCollab.isPending ? (
                            <>
                                <span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>
                                {t.quests.creating}
                            </>
                        ) : t.quests.publishQuest}
                    </button>

                    {totalPercentage !== 100 && milestones.length > 0 && (
                        <p className="text-[13px] text-red-500 font-medium text-center">
                            ⚠ {t.quests.percentageMustBe100} ({t.quests.currentPct}: {totalPercentage}%)
                        </p>
                    )}
                </div>
            </div>
        </WalletGatePage>
    );
}
