# 万用中后台重构 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将万用中后台从单一 `/services` 页面重构为三频道独立子路由，支持 Modal 详情、动态子项和专家列表，基础设施频道接入 USDC 支付。

**Architecture:** 新增 `/services/infrastructure`、`/services/core`、`/services/consulting` 三个独立 Next.js App Router 页面；`/services` 变为入口跳转页；详情交互全部用 Modal（不开新路由）；`services` 表新增三个字段；`useServices` hook 扩展类型；Admin 面板增加字段录入支持。

**Tech Stack:** Next.js 15 App Router, React 19, Supabase, TanStack Query v5, Wagmi v3, Framer Motion, Tailwind CSS v4

---

## Task 1: DB Migration — 新增三个字段

**Files:**
- No new files; run migration via Supabase MCP

**Step 1: 执行 SQL migration**

```sql
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS expert_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS expert_tags TEXT[],
  ADD COLUMN IF NOT EXISTS price_usdc NUMERIC;
```

**Step 2: 验证字段已添加**

在 Supabase 控制台或通过 MCP 查询 `SELECT column_name FROM information_schema.columns WHERE table_name='services'`，确认三个字段存在。

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(services): add expert_avatar_url, expert_tags, price_usdc columns to services table"
```

---

## Task 2: 扩展 `useServices` Hook 类型

**Files:**
- Modify: `hooks/useServices.ts`

**Step 1: 扩展 `Service` interface**

在 `hooks/useServices.ts` 的 `Service` interface 中添加：

```ts
export interface Service {
    // ...existing fields...
    price_usdc?: number | null;
    expert_avatar_url?: string | null;
    expert_tags?: string[] | null;
    documents?: { name: string; url: string; size: string }[];
}
```

**Step 2: 确认 select 查询覆盖新字段**

`useServices` 中已用 `.select('*')`，无需修改查询语句，新字段自动包含。

**Step 3: Commit**

```bash
git add hooks/useServices.ts
git commit -m "feat(services): extend Service type with expert_avatar_url, expert_tags, price_usdc"
```

---

## Task 3: i18n 文案新增

**Files:**
- Modify: `lib/i18n/zh.ts`
- Modify: `lib/i18n/en.ts`

**Step 1: 在 zh.ts 的 `services` 节点下添加**

找到 `services:` 对象，添加以下键（在现有键之后）：

```ts
// 入口页
entry_title: '万用中后台',
entry_subtitle: '选择你需要的服务频道',
entry_infra_title: '基础设施',
entry_infra_desc: '法律、财税、IP 保护等基础合规服务，按套餐激活',
entry_core_title: '专项服务',
entry_core_desc: '定制化解决方案，按需购买单项',
entry_consulting_title: '专家咨询',
entry_consulting_desc: '直接对接领域专家，预约一对一咨询',
// 基础设施频道
infra_activate: '激活服务',
infra_activated: '已激活',
infra_docs: '附件文档',
infra_price_label: '套餐价格',
infra_approving: '授权中...',
infra_paying: '支付中...',
// 专项服务频道
core_select_category: '选择分类',
core_solution_detail: '解决方案详情',
core_contact: '联系获取',
// 专家咨询频道
consulting_book: '预约咨询',
consulting_contact: '联系专家',
consulting_expertise: '专长领域',
consulting_no_experts: '暂无专家',
```

**Step 2: 在 en.ts 的 `services` 节点下添加对应英文**

```ts
entry_title: 'Autonomous Office',
entry_subtitle: 'Choose your service channel',
entry_infra_title: 'Base Infrastructure',
entry_infra_desc: 'Legal, tax, IP protection and compliance packages',
entry_core_title: 'Core Services',
entry_core_desc: 'Customized solutions, purchase individually',
entry_consulting_title: 'Expert Consulting',
entry_consulting_desc: 'Connect directly with domain experts, book 1-on-1',
infra_activate: 'Activate',
infra_activated: 'Active',
infra_docs: 'Attachments',
infra_price_label: 'Package Price',
infra_approving: 'Approving...',
infra_paying: 'Processing...',
core_select_category: 'Select Category',
core_solution_detail: 'Solution Detail',
core_contact: 'Contact to Get',
consulting_book: 'Book Session',
consulting_contact: 'Contact Expert',
consulting_expertise: 'Expertise',
consulting_no_experts: 'No experts yet',
```

**Step 3: Commit**

```bash
git add lib/i18n/zh.ts lib/i18n/en.ts
git commit -m "feat(services): add i18n keys for three-channel redesign"
```

---

## Task 4: `/services` 入口页重写

**Files:**
- Modify: `app/services/page.tsx`

**Step 1: 将 `/services/page.tsx` 替换为入口页**

完整替换内容：

```tsx
'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import Link from 'next/link';
import { motion } from 'framer-motion';

const channels = [
    {
        href: '/services/infrastructure',
        icon: 'terminal',
        gradient: 'from-blue-500 to-cyan-400',
        borderColor: 'border-blue-500/30',
        glowColor: 'rgba(59, 130, 246, 0.3)',
        titleKey: 'entry_infra_title' as const,
        descKey: 'entry_infra_desc' as const,
    },
    {
        href: '/services/core',
        icon: 'security_update_good',
        gradient: 'from-emerald-500 to-teal-400',
        borderColor: 'border-emerald-500/30',
        glowColor: 'rgba(16, 185, 129, 0.3)',
        titleKey: 'entry_core_title' as const,
        descKey: 'entry_core_desc' as const,
    },
    {
        href: '/services/consulting',
        icon: 'person_search',
        gradient: 'from-purple-500 to-pink-400',
        borderColor: 'border-purple-500/30',
        glowColor: 'rgba(168, 85, 247, 0.3)',
        titleKey: 'entry_consulting_title' as const,
        descKey: 'entry_consulting_desc' as const,
    },
];

export default function ServicesPage() {
    const t = useT();

    return (
        <WalletGatePage>
            <div className="relative min-h-screen">
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>
                <div className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
                    <PageHeader
                        title={t.services.entry_title}
                        description={t.services.entry_subtitle}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        {channels.map((ch, i) => (
                            <motion.div
                                key={ch.href}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link
                                    href={ch.href}
                                    className={`block p-8 border ${ch.borderColor} bg-white/50 dark:bg-slate-900/30 hover:shadow-[0_20px_50px_-20px_${ch.glowColor}] transition-all group`}
                                    style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
                                >
                                    <div className={`w-14 h-14 rounded-sm border ${ch.borderColor} bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                                        <span className={`material-symbols-outlined !text-[28px] bg-gradient-to-br ${ch.gradient} bg-clip-text text-transparent`}>
                                            {ch.icon}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono mb-2">
                                        {t.services[ch.titleKey]}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {t.services[ch.descKey]}
                                    </p>
                                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                                        <span>进入频道</span>
                                        <span className="material-symbols-outlined !text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </WalletGatePage>
    );
}
```

**Step 2: Commit**

```bash
git add app/services/page.tsx
git commit -m "feat(services): replace single-page with three-channel entry page"
```

---

## Task 5: 基础设施频道页 `/services/infrastructure`

**Files:**
- Create: `app/services/infrastructure/page.tsx`

**Step 1: 创建目录和文件**

```tsx
'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { PageHeader } from '@/components/ui/PageHeader';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useAuth } from '@/providers/AuthProvider';

// MockUSDC ABI (approve only)
const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
    },
] as const;

const MOCK_USDC = process.env.NEXT_PUBLIC_MOCK_USDC as `0x${string}`;

export default function InfrastructurePage() {
    const t = useT();
    const { services, isLoading, unlockedIds } = useServices(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    return (
        <WalletGatePage>
            <div className="relative min-h-screen">
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>
                <div className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
                    <PageHeader
                        title={t.services.entry_infra_title}
                        description={t.services.entry_infra_desc}
                    />

                    {isLoading ? (
                        <div className="flex items-center justify-center py-32 text-slate-400 gap-4">
                            <span className="material-symbols-outlined animate-spin !text-[40px] text-primary">progress_activity</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                            {services.map((s, i) => {
                                const isUnlocked = unlockedIds.includes(s.id);
                                return (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedService(s)}
                                        className="cursor-pointer group border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 p-6 hover:border-blue-500/40 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.2)] transition-all"
                                        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)" }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500">
                                                <span className="material-symbols-outlined !text-[22px]">{s.icon || 'settings_input_component'}</span>
                                            </div>
                                            {isUnlocked && (
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider">
                                                    {t.services.infra_activated}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{s.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{s.description}</p>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                                                {s.price_usdc ? `${s.price_usdc} USDC` : s.price > 0 ? `${s.price} USDC` : 'Free'}
                                            </span>
                                            <span className="text-xs text-primary font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                详情 <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedService && (
                    <InfraModal
                        service={selectedService}
                        isUnlocked={unlockedIds.includes(selectedService.id)}
                        onClose={() => setSelectedService(null)}
                    />
                )}
            </AnimatePresence>
        </WalletGatePage>
    );
}

function InfraModal({ service: s, isUnlocked, onClose }: {
    service: Service;
    isUnlocked: boolean;
    onClose: () => void;
}) {
    const t = useT();
    const { address } = useAccount();
    const { supabase } = useAuth();
    const [step, setStep] = useState<'idle' | 'approving' | 'paying' | 'done' | 'error'>('idle');
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

    const { writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

    const handleActivate = async () => {
        if (!address || !s.price_usdc) return;
        try {
            setStep('approving');
            // For now: just write to service_access (mock payment flow)
            // TODO: replace with real USDC approve + contract call
            await new Promise(r => setTimeout(r, 800));
            setStep('paying');
            await new Promise(r => setTimeout(r, 800));
            const { error } = await supabase
                .from('service_access')
                .insert([{
                    user_address: address.toLowerCase(),
                    target_id: s.id,
                    tx_hash: `MOCK_INFRA_${Date.now()}`,
                }]);
            if (error) throw error;
            setStep('done');
        } catch (e) {
            console.error(e);
            setStep('error');
        }
    };

    const activateLabel = step === 'approving' ? t.services.infra_approving
        : step === 'paying' ? t.services.infra_paying
        : t.services.infra_activate;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-[18px] text-blue-500">{s.icon || 'settings_input_component'}</span>
                        </div>
                        <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">{s.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <span className="material-symbols-outlined !text-[20px]">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Description */}
                    {s.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.services.infra_price_label}</span>
                        <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                            {s.price_usdc ? `${s.price_usdc} USDC` : s.price > 0 ? `${s.price} USDC` : 'Free'}
                        </span>
                    </div>

                    {/* Attached Docs */}
                    {s.documents && s.documents.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.services.infra_docs}</p>
                            <div className="space-y-1">
                                {s.documents.map((doc, i) => (
                                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs text-primary hover:underline py-1">
                                        <span className="material-symbols-outlined !text-[14px]">attach_file</span>
                                        {doc.name}
                                        <span className="text-slate-400">({doc.size})</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action */}
                    {(isUnlocked || step === 'done') ? (
                        <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                            <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                            {t.services.infra_activated}
                        </div>
                    ) : (
                        <button
                            onClick={handleActivate}
                            disabled={step !== 'idle' && step !== 'error'}
                            className="w-full py-3 bg-primary text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-primary/90 transition-colors"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
                        >
                            {step === 'error' ? '重试' : activateLabel}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
```

**Step 2: Commit**

```bash
git add app/services/infrastructure/page.tsx
git commit -m "feat(services): add infrastructure channel page with modal detail + mock payment"
```

---

## Task 6: 专项服务频道页 `/services/core`

**Files:**
- Create: `app/services/core/page.tsx`

**Step 1: 创建文件**

```tsx
'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { PageHeader } from '@/components/ui/PageHeader';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoreServicesPage() {
    const t = useT();
    const { services, isLoading } = useServices(2);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedSolution, setSelectedSolution] = useState<Service | null>(null);

    // services from useServices already has parent-child hierarchy
    // parents = categories, parent.children = solutions
    const categories = services; // channel=2, parent_id=null (parents only)
    const activeCat = activeCategory
        ? categories.find(c => c.id === activeCategory)
        : categories[0];

    return (
        <WalletGatePage>
            <div className="relative min-h-screen">
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>
                <div className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
                    <PageHeader
                        title={t.services.entry_core_title}
                        description={t.services.entry_core_desc}
                    />

                    {isLoading ? (
                        <div className="flex items-center justify-center py-32 text-slate-400">
                            <span className="material-symbols-outlined animate-spin !text-[40px] text-primary">progress_activity</span>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-6 mt-8">
                            {/* Category Nav */}
                            <aside className="w-full md:w-56 shrink-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.services.core_select_category}</p>
                                <div className="space-y-1">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-tight transition-colors border-l-2 ${
                                                (activeCategory === cat.id || (!activeCategory && categories[0]?.id === cat.id))
                                                    ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {cat.icon && <span className="material-symbols-outlined !text-[16px]">{cat.icon}</span>}
                                                {cat.title}
                                            </div>
                                            <span className="text-[10px] font-normal text-slate-400 mt-0.5 block">
                                                {(cat.children?.length ?? 0)} 项方案
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </aside>

                            {/* Solutions Grid */}
                            <div className="flex-1 min-w-0">
                                {activeCat && (
                                    <>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-4">
                                            {activeCat.title}
                                        </h2>
                                        {(!activeCat.children || activeCat.children.length === 0) ? (
                                            <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                                                [ NO_SOLUTIONS_INDEXED ]
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {activeCat.children.map((sol, i) => (
                                                    <motion.div
                                                        key={sol.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        onClick={() => setSelectedSolution(sol)}
                                                        className="cursor-pointer group border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 p-5 hover:border-emerald-500/40 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.15)] transition-all"
                                                        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)" }}
                                                    >
                                                        <div className="flex items-start gap-3 mb-3">
                                                            {sol.icon && (
                                                                <div className="w-8 h-8 bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                                    <span className="material-symbols-outlined !text-[16px] text-emerald-500">{sol.icon}</span>
                                                                </div>
                                                            )}
                                                            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">{sol.title}</h4>
                                                        </div>
                                                        {sol.description && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{sol.description}</p>
                                                        )}
                                                        <div className="mt-3 flex items-center justify-between">
                                                            <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">
                                                                {sol.price > 0 ? `${sol.price} USDC` : '面议'}
                                                            </span>
                                                            <span className="text-xs text-emerald-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                                查看 <span className="material-symbols-outlined !text-[12px]">arrow_forward</span>
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Solution Modal */}
            <AnimatePresence>
                {selectedSolution && (
                    <SolutionModal
                        service={selectedSolution}
                        onClose={() => setSelectedSolution(null)}
                    />
                )}
            </AnimatePresence>
        </WalletGatePage>
    );
}

function SolutionModal({ service: s, onClose }: { service: Service; onClose: () => void }) {
    const t = useT();
    const payloadType = s.payload_config?.type;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">{s.title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <span className="material-symbols-outlined !text-[20px]">close</span>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {s.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
                    )}
                    <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">价格</span>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                            {s.price > 0 ? `${s.price} USDC` : '面议'}
                        </span>
                    </div>
                    {/* CTA based on payload type */}
                    {payloadType === 'calendly' && s.payload_config?.url && (
                        <a href={s.payload_config.url} target="_blank" rel="noopener noreferrer"
                            className="block w-full py-3 bg-primary text-white text-xs font-black uppercase tracking-widest text-center hover:bg-primary/90 transition-colors"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                            预约时间
                        </a>
                    )}
                    {(payloadType === 'qr_contact' || payloadType === 'redeem_code') && s.payload_config?.url && (
                        <div className="text-center">
                            <p className="text-xs text-slate-400 mb-2">{t.services.core_contact}</p>
                            <img src={s.payload_config.url} alt="contact" className="mx-auto max-w-[160px]" />
                        </div>
                    )}
                    {!payloadType && (
                        <p className="text-xs text-slate-400 text-center">{t.services.core_contact}</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
```

**Step 2: Commit**

```bash
git add app/services/core/page.tsx
git commit -m "feat(services): add core services channel page with category nav + solution modal"
```

---

## Task 7: 专家咨询频道页 `/services/consulting`

**Files:**
- Create: `app/services/consulting/page.tsx`

**Step 1: 创建文件**

```tsx
'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useServices, type Service } from '@/hooks/useServices';
import { PageHeader } from '@/components/ui/PageHeader';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultingPage() {
    const t = useT();
    const { services, isLoading } = useServices(3);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedExpert, setSelectedExpert] = useState<Service | null>(null);

    const categories = services; // channel=3 parents (categories)
    const activeCat = activeCategory
        ? categories.find(c => c.id === activeCategory)
        : categories[0];

    return (
        <WalletGatePage>
            <div className="relative min-h-screen">
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>
                <div className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
                    <PageHeader
                        title={t.services.entry_consulting_title}
                        description={t.services.entry_consulting_desc}
                    />

                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <span className="material-symbols-outlined animate-spin !text-[40px] text-primary">progress_activity</span>
                        </div>
                    ) : (
                        <>
                            {/* Category Tabs */}
                            <div className="flex gap-2 mt-8 overflow-x-auto pb-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`shrink-0 px-5 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                                            (activeCategory === cat.id || (!activeCategory && categories[0]?.id === cat.id))
                                                ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-purple-500/40 hover:text-purple-400'
                                        }`}
                                    >
                                        {cat.title}
                                        <span className="ml-2 text-slate-400">({cat.children?.length ?? 0})</span>
                                    </button>
                                ))}
                            </div>

                            {/* Expert Grid */}
                            <div className="mt-6">
                                {!activeCat || !activeCat.children || activeCat.children.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                                        [ {t.services.consulting_no_experts} ]
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeCat.children.map((expert, i) => (
                                            <motion.div
                                                key={expert.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => setSelectedExpert(expert)}
                                                className="cursor-pointer group border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 p-5 hover:border-purple-500/40 hover:shadow-[0_10px_30px_-10px_rgba(168,85,247,0.15)] transition-all"
                                                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)" }}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    {expert.expert_avatar_url ? (
                                                        <img src={expert.expert_avatar_url} alt={expert.title}
                                                            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                            <span className="material-symbols-outlined !text-[22px] text-purple-400">person</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{expert.title}</h4>
                                                        {expert.expert_tags && expert.expert_tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {expert.expert_tags.slice(0, 2).map((tag, ti) => (
                                                                    <span key={ti} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 text-[9px] font-bold border border-purple-500/20 uppercase">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {expert.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{expert.description}</p>
                                                )}
                                                <div className="mt-3 flex items-center justify-end">
                                                    <span className="text-xs text-purple-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                        {t.services.consulting_book} <span className="material-symbols-outlined !text-[12px]">arrow_forward</span>
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Expert Modal */}
            <AnimatePresence>
                {selectedExpert && (
                    <ExpertModal expert={selectedExpert} onClose={() => setSelectedExpert(null)} />
                )}
            </AnimatePresence>
        </WalletGatePage>
    );
}

function ExpertModal({ expert: e, onClose }: { expert: Service; onClose: () => void }) {
    const t = useT();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={ev => ev.stopPropagation()}
                className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        {e.expert_avatar_url ? (
                            <img src={e.expert_avatar_url} alt={e.title} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px] text-purple-400">person</span>
                            </div>
                        )}
                        <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">{e.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <span className="material-symbols-outlined !text-[20px]">close</span>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Tags */}
                    {e.expert_tags && e.expert_tags.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.services.consulting_expertise}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {e.expert_tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold border border-purple-500/20 uppercase tracking-wide">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bio */}
                    {e.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{e.description}</p>
                    )}

                    {/* Price */}
                    {e.price > 0 && (
                        <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">咨询费用</span>
                            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{e.price} USDC / 次</span>
                        </div>
                    )}

                    {/* CTA */}
                    {e.payload_config?.type === 'calendly' && e.payload_config?.url ? (
                        <a href={e.payload_config.url} target="_blank" rel="noopener noreferrer"
                            className="block w-full py-3 bg-purple-600 text-white text-xs font-black uppercase tracking-widest text-center hover:bg-purple-700 transition-colors"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                            {t.services.consulting_book}
                        </a>
                    ) : e.payload_config?.url ? (
                        <a href={e.payload_config.url} target="_blank" rel="noopener noreferrer"
                            className="block w-full py-3 border border-purple-500 text-purple-500 text-xs font-black uppercase tracking-widest text-center hover:bg-purple-500/10 transition-colors">
                            {t.services.consulting_contact}
                        </a>
                    ) : (
                        <p className="text-xs text-slate-400 text-center">{t.services.consulting_contact}</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
```

**Step 2: Commit**

```bash
git add app/services/consulting/page.tsx
git commit -m "feat(services): add expert consulting channel page with category tabs + expert modal"
```

---

## Task 8: 更新 Header 导航链接

**Files:**
- Modify: `components/layout/Header.tsx`

**Step 1: 找到 services 的 subItems，将 hash anchors 替换为真实路由**

找到以下代码块（约第 36-43 行）：

```ts
{
    label: t.nav.services,
    href: '/services',
    subItems: [
        { label: t.nav.sub_services_infra, href: '/services#infra' },
        { label: t.nav.sub_services_core, href: '/services#core' },
        { label: t.nav.sub_services_co_create, href: '/services#co-create' },
    ]
},
```

替换为：

```ts
{
    label: t.nav.services,
    href: '/services',
    subItems: [
        { label: t.nav.sub_services_infra, href: '/services/infrastructure' },
        { label: t.nav.sub_services_core, href: '/services/core' },
        { label: t.nav.sub_services_co_create, href: '/services/consulting' },
    ]
},
```

**Step 2: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(services): update header nav from hash anchors to real sub-routes"
```

---

## Task 9: Admin 面板扩展新字段

**Files:**
- Modify: `app/admin/services/page.tsx`

**Step 1: 添加三个新字段的 state**

在现有 `const [uploading, setUploading] = useState(false);` 之后添加：

```ts
// New fields for channel-specific data
const [priceUsdc, setPriceUsdc] = useState<number | ''>('');
const [expertAvatarUrl, setExpertAvatarUrl] = useState('');
const [expertTags, setExpertTags] = useState(''); // comma-separated input
```

**Step 2: 在 `handleEdit` 中填充新字段**

在 `setIsEditing(true);` 之前添加：

```ts
setPriceUsdc(service.price_usdc ?? '');
setExpertAvatarUrl(service.expert_avatar_url || '');
setExpertTags((service.expert_tags || []).join(', '));
```

**Step 3: 在 `handleCreateNew` 中重置新字段**

在 `setIsEditing(true);` 之前添加：

```ts
setPriceUsdc('');
setExpertAvatarUrl('');
setExpertTags('');
```

**Step 4: 在 `handleSave` 的 payload 中包含新字段**

将 payload 对象扩展：

```ts
const payload = {
    title, description, price, channel, category, icon,
    is_active: isActive, currency: 'USDC', unlock_type: 'ITEM', sort_order: 0,
    documents,
    price_usdc: priceUsdc !== '' ? Number(priceUsdc) : null,
    expert_avatar_url: expertAvatarUrl || null,
    expert_tags: expertTags ? expertTags.split(',').map(t => t.trim()).filter(Boolean) : null,
};
```

**Step 5: 在表单 UI 中添加条件渲染字段**

在 icon 输入框之后，根据 `channel` 值显示对应字段：

```tsx
{/* channel=1: price_usdc */}
{channel === 1 && (
    <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            价格 (USDC, 链上精确值)
        </label>
        <input
            type="number"
            value={priceUsdc}
            onChange={e => setPriceUsdc(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="例: 299"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm rounded focus:outline-none focus:border-primary"
        />
    </div>
)}

{/* channel=3 (parent item = expert): avatar + tags */}
{channel === 3 && (
    <>
        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                专家头像 URL
            </label>
            <input
                type="text"
                value={expertAvatarUrl}
                onChange={e => setExpertAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm rounded focus:outline-none focus:border-primary"
            />
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                专长标签 (逗号分隔)
            </label>
            <input
                type="text"
                value={expertTags}
                onChange={e => setExpertTags(e.target.value)}
                placeholder="合同法, 知识产权, 跨境合规"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm rounded focus:outline-none focus:border-primary"
            />
        </div>
    </>
)}
```

**Step 6: 在列表视图增加 channel 筛选标签**

在列表顶部添加 channel 标签（在现有 "新增服务" 按钮旁边）：

```tsx
{/* Channel filter badges */}
<div className="flex gap-2 text-xs">
    {[0,1,2,3].map(ch => (
        <button key={ch} /* filter state logic */ className="...">
            {ch === 0 ? '全部' : ch === 1 ? '基础设施' : ch === 2 ? '专项服务' : '专家咨询'}
        </button>
    ))}
</div>
```

> 注意：channel filter 需要在 Admin 组件中新增 `const [channelFilter, setChannelFilter] = useState(0);` 并在渲染列表时用 `services.filter(s => channelFilter === 0 || s.channel === channelFilter)` 过滤。

**Step 7: Commit**

```bash
git add app/admin/services/page.tsx
git commit -m "feat(admin): extend services panel with price_usdc, expert_avatar_url, expert_tags fields + channel filter"
```

---

## Task 10: Service interface 补全 documents 字段 + 验证

**Files:**
- Modify: `hooks/useServices.ts`

**Step 1: 确认 `Service` interface 包含 `documents` 字段**

`documents` 字段已在 Admin 的本地类型中定义，但 `hooks/useServices.ts` 的 `Service` interface 缺失。添加：

```ts
documents?: { name: string; url: string; size: string }[] | null;
```

**Step 2: 验证三个频道页能正确拿到 children**

`useServices(channelFilter)` 在 `queryFn` 中已做 parent-child hierarchy build。验证 channel=2/3 时 `parents.children` 数组正确填充：

- channel=2: parents = 分类, children = 解决方案（parent_id 指向分类）
- channel=3: parents = 咨询大类, children = 具体专家

**Step 3: Commit**

```bash
git add hooks/useServices.ts
git commit -m "fix(services): add documents field to Service interface"
```

---

## Task 11: 构建验证

**Step 1: 运行 lint**

```bash
pnpm lint
```

期望：0 errors（warnings 可接受）

**Step 2: 运行构建**

```bash
pnpm build
```

期望：Build successful, no TypeScript errors

**Step 3: 如有类型错误，逐一修复**

常见问题：
- `t.services.xxx` — 检查 i18n 文件是否已添加对应键
- `expert_avatar_url` / `expert_tags` 未在 Service interface — 确认 Task 2 已执行
- `price_usdc` 类型不匹配 — 确认 `number | null | undefined`

**Step 4: 最终 Commit**

```bash
git add -A
git commit -m "fix: resolve build errors from services restructure"
```

---

## 完成后验证清单

- [ ] `/services` 显示三张频道卡片，点击跳转正确
- [ ] `/services/infrastructure` 展示 channel=1 服务卡片，点击弹出 Modal
- [ ] Modal 中显示描述、价格、文档附件、激活按钮
- [ ] `/services/core` 左侧显示 channel=2 分类，切换分类正确展示子方案
- [ ] 点击解决方案弹出 Modal，含 CTA 按钮
- [ ] `/services/consulting` 顶部 Tab 切换分类，展示专家卡片
- [ ] 专家卡片显示头像（有则显示图片，无则显示 placeholder）和 tags
- [ ] 点击专家弹出 Modal，有 Calendly 链接则显示预约按钮
- [ ] Header 三个子链接跳转到正确路由
- [ ] Admin `/admin/services` 中 channel=1 表单有 `price_usdc` 输入框
- [ ] Admin channel=3 表单有 `expert_avatar_url` 和 `expert_tags` 输入框
- [ ] Admin 列表有 channel 筛选功能
