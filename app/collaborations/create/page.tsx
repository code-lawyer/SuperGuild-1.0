'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCollaboration } from '@/hooks/useCollaborations';
import Link from 'next/link';

interface MilestoneInput {
    title: string;
    amount_percentage: number;
}

interface ReferenceLink {
    label: string;
    url: string;
}

const DELIVERY_PRESETS = [
    { label: '设计稿', value: '设计稿（Figma / PSD / AI）' },
    { label: '代码仓库', value: '代码仓库（GitHub / GitLab）' },
    { label: '文档', value: '文档（在线文档链接）' },
    { label: '演示视频', value: '演示视频（录屏或 Demo）' },
    { label: '线上部署', value: '线上部署（可访问 URL）' },
];

export default function CreateCollaborationPage() {
    const router = useRouter();
    const createCollab = useCreateCollaboration();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [referenceLinks, setReferenceLinks] = useState<ReferenceLink[]>([]);
    const [deadline, setDeadline] = useState('');
    const [deliveryStandard, setDeliveryStandard] = useState('');
    const [customDelivery, setCustomDelivery] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [milestones, setMilestones] = useState<MilestoneInput[]>([
        { title: '', amount_percentage: 100 },
    ]);

    const totalPercentage = milestones.reduce((sum, m) => sum + m.amount_percentage, 0);
    const finalDelivery = deliveryStandard === 'custom' ? customDelivery : deliveryStandard;
    const isValid =
        title.trim() &&
        description.trim() &&
        Number(totalBudget) > 0 &&
        totalPercentage === 100 &&
        milestones.every(m => m.title.trim()) &&
        finalDelivery.trim();

    const addMilestone = () => setMilestones([...milestones, { title: '', amount_percentage: 0 }]);
    const removeMilestone = (i: number) => {
        if (milestones.length <= 1) return;
        setMilestones(milestones.filter((_, idx) => idx !== i));
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

    const handleSubmit = async () => {
        if (!isValid) return;
        try {
            const result = await createCollab.mutateAsync({
                title: title.trim(),
                description: description.trim(),
                reference_links: referenceLinks.filter(r => r.url.trim()),
                deadline: deadline || undefined,
                delivery_standard: finalDelivery.trim(),
                total_budget: Number(totalBudget),
                milestones,
            });
            router.push(`/collaborations/${result.id}`);
        } catch (e: any) {
            console.error('创建协作失败:', e);
        }
    };

    return (
        <div className="max-w-[640px] mx-auto px-6 py-16">
            <Link href="/collaborations" className="inline-flex items-center gap-2 text-[14px] text-[#6A6A71] hover:text-[#121317] transition-colors duration-200 mb-10 font-medium">
                <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                返回列表
            </Link>

            <div className="space-y-10">
                {/* Header */}
                <div className="fade-up">
                    <h1 className="text-[clamp(28px,4vw,36px)] font-[450] text-[#121317] tracking-[-0.02em] mb-2">
                        发起新协作
                    </h1>
                    <p className="text-[#6A6A71] text-[15px] font-medium">详细描述任务内容，让潜在承接人充分了解需求。</p>
                </div>

                {/* Title */}
                <div className="fade-up fade-up-delay-1">
                    <label className="block text-[12px] font-bold text-[#6A6A71] mb-2.5 uppercase tracking-wider">
                        任务标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例如：品牌视觉设计 / DApp 前端开发…"
                        className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-5 py-3.5 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all duration-200 shadow-sm"
                    />
                </div>

                {/* Description */}
                <div className="fade-up fade-up-delay-2">
                    <label className="block text-[12px] font-bold text-[#6A6A71] mb-2.5 uppercase tracking-wider">
                        任务详情 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="详细描述任务背景、目标、范围、技能要求等…"
                        rows={5}
                        className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-5 py-3.5 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all duration-200 shadow-sm resize-none"
                    />
                </div>

                {/* Reference Links */}
                <div className="fade-up">
                    <div className="flex items-center justify-between mb-2.5">
                        <label className="text-[12px] font-bold text-[#6A6A71] uppercase tracking-wider">参考资料</label>
                        <button onClick={addRef} className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[14px]">add</span>
                            添加链接
                        </button>
                    </div>
                    {referenceLinks.length === 0 && (
                        <p className="text-[13px] text-[#B8BACA] italic">暂无参考资料，点击上方添加</p>
                    )}
                    <div className="space-y-2">
                        {referenceLinks.map((ref, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    type="text"
                                    value={ref.label}
                                    onChange={(e) => updateRef(i, 'label', e.target.value)}
                                    placeholder="标题（选填）"
                                    className="w-1/3 bg-white border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-[13px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary transition-all"
                                />
                                <input
                                    type="url"
                                    value={ref.url}
                                    onChange={(e) => updateRef(i, 'url', e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 bg-white border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-[13px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary transition-all"
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
                    <label className="block text-[12px] font-bold text-[#6A6A71] mb-2.5 uppercase tracking-wider">
                        截止日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-5 py-3.5 text-[14px] text-[#121317] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all duration-200 shadow-sm"
                    />
                </div>

                {/* Delivery Standard */}
                <div className="fade-up">
                    <label className="block text-[12px] font-bold text-[#6A6A71] mb-2.5 uppercase tracking-wider">
                        交付标准 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {DELIVERY_PRESETS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => { setDeliveryStandard(p.value); setCustomDelivery(''); }}
                                className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all duration-200 ${deliveryStandard === p.value
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-[#45474D] border-[#E8EAF0] hover:border-primary/30 hover:text-primary'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                        <button
                            onClick={() => setDeliveryStandard('custom')}
                            className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all duration-200 ${deliveryStandard === 'custom'
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white text-[#45474D] border-[#E8EAF0] hover:border-primary/30 hover:text-primary'
                                }`}
                        >
                            自定义
                        </button>
                    </div>
                    {deliveryStandard === 'custom' && (
                        <input
                            type="text"
                            value={customDelivery}
                            onChange={(e) => setCustomDelivery(e.target.value)}
                            placeholder="请描述你的交付标准…"
                            className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-5 py-3.5 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all duration-200 shadow-sm"
                        />
                    )}
                </div>

                {/* Budget */}
                <div className="fade-up">
                    <label className="block text-[12px] font-bold text-[#6A6A71] mb-2.5 uppercase tracking-wider">
                        总预算 (USDT) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(e.target.value)}
                        placeholder="500"
                        min="0"
                        className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-5 py-3.5 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all duration-200 tabular-nums shadow-sm"
                    />
                </div>

                {/* Milestones */}
                <div className="fade-up">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[12px] font-bold text-[#6A6A71] uppercase tracking-wider">里程碑拆解</label>
                        <span className={`text-[13px] font-bold tabular-nums ${totalPercentage === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                            合计: {totalPercentage}%
                        </span>
                    </div>

                    <div className="space-y-3">
                        {milestones.map((ms, i) => (
                            <div key={i} className="ag-card p-5 flex items-start gap-3">
                                <span className="text-[12px] font-bold text-[#D1D5E0] pt-3 shrink-0 tabular-nums">#{i + 1}</span>
                                <div className="flex-1 space-y-3">
                                    <input
                                        type="text"
                                        value={ms.title}
                                        onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                                        placeholder="里程碑标题…"
                                        className="w-full bg-[#F8F9FC] border border-[#E8EAF0] rounded-xl px-4 py-2.5 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all duration-200"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={ms.amount_percentage}
                                            onChange={(e) => updateMilestone(i, 'amount_percentage', e.target.value)}
                                            min="0"
                                            max="100"
                                            className="w-24 bg-[#F8F9FC] border border-[#E8EAF0] rounded-xl px-3 py-2.5 text-[14px] text-[#121317] focus:outline-none focus:border-primary tabular-nums"
                                        />
                                        <span className="text-[12px] text-[#6A6A71] font-bold">%</span>
                                        {Number(totalBudget) > 0 && (
                                            <span className="text-[13px] text-[#6A6A71] ml-2 tabular-nums">
                                                ≈ {((Number(totalBudget) * ms.amount_percentage) / 100).toFixed(0)} USDT
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
                        添加里程碑
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
                            创建中…
                        </>
                    ) : '发布协作任务'}
                </button>

                {totalPercentage !== 100 && milestones.length > 0 && (
                    <p className="text-[13px] text-red-500 font-medium text-center">
                        ⚠ 里程碑占比之和必须等于 100%（当前: {totalPercentage}%）
                    </p>
                )}
            </div>
        </div>
    );
}
