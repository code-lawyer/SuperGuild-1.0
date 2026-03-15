# Task System Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 SuperGuild 任务系统添加三项功能：任务分类+标签、广播多名额模式、组队信号。

**Architecture:** 复用现有 `collaborations` 表，通过新增字段扩展（category/tags/slot_budget/max_providers/slots_taken/parent_collab_id）。广播模式下，Approve Application 时自动创建子协作实例，复用全部现有 1:1 结算流程。组队信号复用 `bulletins` 表（新增 `squad_signal` category + `squad_signal_meta` JSONB 列）。

**Tech Stack:** Next.js 15 App Router, Supabase, TanStack Query v5, TypeScript strict, Tailwind CSS v4, Framer Motion, pnpm

**Design Doc:** `docs/plans/2026-03-15-task-system-phase2-design.md`

---

## Phase A：数据库迁移

### Task 1：collaborations 表扩展

**Files:**
- Create: `supabase/migrations/20260315020000_task_phase2_categories_broadcast.sql`

**Step 1: 写迁移文件**

```sql
-- supabase/migrations/20260315020000_task_phase2_categories_broadcast.sql

-- 1. Category + Tags
ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_collabs_category ON collaborations(category);
CREATE INDEX IF NOT EXISTS idx_collabs_tags ON collaborations USING GIN(tags);

-- 2. Broadcast (multi-slot) mode
ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS slot_budget NUMERIC,
  ADD COLUMN IF NOT EXISTS max_providers INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS slots_taken INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_collab_id UUID REFERENCES collaborations(id);

CREATE INDEX IF NOT EXISTS idx_collabs_parent ON collaborations(parent_collab_id);

-- 3. Back-fill existing rows
UPDATE collaborations
SET slot_budget = total_budget
WHERE slot_budget IS NULL;

-- 4. Add FULLY_BOOKED to status machine (optional: keep as string, no enum change needed)
-- status column is already TEXT, no migration needed for FULLY_BOOKED
```

**Step 2: 应用迁移（通过 Supabase MCP）**

执行 `mcp__supabase__apply_migration` with the SQL above.

**Step 3: 验证**

通过 Supabase MCP `execute_sql`:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'collaborations'
  AND column_name IN ('category','tags','slot_budget','max_providers','slots_taken','parent_collab_id')
ORDER BY column_name;
```
预期：返回6行

**Step 4: Commit**
```bash
git add supabase/migrations/20260315020000_task_phase2_categories_broadcast.sql
git commit -m "feat(db): add category, tags, broadcast slots to collaborations"
```

---

### Task 2：bulletins 表扩展（组队信号）

**Files:**
- Create: `supabase/migrations/20260315030000_task_phase2_squad_signal.sql`

**Step 1: 写迁移文件**

```sql
-- supabase/migrations/20260315030000_task_phase2_squad_signal.sql

ALTER TABLE bulletins
  ADD COLUMN IF NOT EXISTS squad_signal_meta JSONB;

-- squad_signal_meta schema (for reference, not enforced at DB level):
-- {
--   "parent_collab_id": "uuid",
--   "parent_collab_title": "string",
--   "roles": [
--     { "child_collab_id": "uuid", "title": "string",
--       "tags": ["string"], "budget": number, "slots": number }
--   ]
-- }

COMMENT ON COLUMN bulletins.squad_signal_meta IS
  'Populated only when category = ''squad_signal''. Contains parent_collab_id, parent_collab_title, and roles array.';
```

**Step 2: 应用迁移**

执行 `mcp__supabase__apply_migration`.

**Step 3: Commit**
```bash
git add supabase/migrations/20260315030000_task_phase2_squad_signal.sql
git commit -m "feat(db): add squad_signal_meta to bulletins"
```

---

## Phase B：TypeScript 类型 + i18n

### Task 3：更新 Collaboration 类型

**Files:**
- Modify: `hooks/useCollaborations.ts:13-32` (Collaboration interface)
- Modify: `hooks/useCollaborations.ts:143-156` (CreateCollabInput interface)

**Step 1: 更新 Collaboration interface**

在 `hooks/useCollaborations.ts` 第 32 行 `}` 之前，在 `escrow_address` 字段后追加：

```typescript
    category: string;
    tags: string[];
    slot_budget: number | null;
    max_providers: number;
    slots_taken: number;
    parent_collab_id: string | null;
```

**Step 2: 更新 CollabStatus 类型（第10行）**

```typescript
export type CollabStatus = 'OPEN' | 'PENDING_APPROVAL' | 'LOCKED' | 'ACTIVE' | 'PENDING' | 'SETTLED' | 'DISPUTED' | 'CANCELLED' | 'FULLY_BOOKED';
```

**Step 3: 更新 CreateCollabInput interface（第143行）**

在 `milestones` 字段前新增：

```typescript
    category?: string;
    tags?: string[];
    slot_budget?: number;
    max_providers?: number;
```

**Step 4: Commit**
```bash
git add hooks/useCollaborations.ts
git commit -m "feat(types): add category, tags, broadcast fields to Collaboration type"
```

---

### Task 4：i18n 新增文案

**Files:**
- Modify: `lib/i18n/zh.ts`
- Modify: `lib/i18n/en.ts`

**Step 1: zh.ts — 在 `quests` 块末尾（`escrowDone` 等之后，块的右花括号前）新增**

```typescript
        // 分类与标签
        categoryLabel: '任务分类',
        categoryRequired: '请选择任务分类',
        tagsLabel: '技能标签（选填）',
        tagsPlaceholder: '输入标签后按 Enter，例如：solidity、react...',
        tagsHint: '最多 8 个标签，每个不超过 20 字',
        catDevelopment: '开发',
        catDesign: '设计',
        catContent: '内容',
        catAudit: '安全审计',
        catOperations: '运营增长',
        catResearch: '研究咨询',
        catOther: '其他',
        filterCategory: '分类',
        // 广播模式
        slotBudgetLabel: '每名额报酬（USDC）',
        maxProvidersLabel: '名额数量',
        totalBudgetHint: '总支出：{total} USDC',
        slotsProgress: '{taken}/{max} 名额已承接',
        fullyBooked: '名额已满',
        // 组队信号
        squadSignal: '发起组队',
        viewSquadSignal: '查看组队信号',
        squadSignalDesc: '发布组队公告，招募队友共同完成此任务',
        squadRoles: '岗位设置',
        addRole: '添加岗位',
        roleTitle: '岗位名称',
        roleTags: '所需技能',
        roleBudget: '报酬（USDC）',
        roleSlots: '人数',
        squadDescription: '组队说明',
        squadDescPlaceholder: '介绍你的组队思路、分工方案...',
        publishSquadSignal: '发布组队信号',
        squadSignalSuccess: '组队信号已发布',
        squadSignalError: '发布失败',
        squadSourceTask: '来源任务',
        squadRecruiting: '招募中',
        squadFilled: '已满员',
```

**Step 2: en.ts — 对应位置新增（结构与 zh.ts 完全一致）**

```typescript
        // Category & Tags
        categoryLabel: 'Task Category',
        categoryRequired: 'Please select a category',
        tagsLabel: 'Skill Tags (optional)',
        tagsPlaceholder: 'Press Enter to add tags, e.g. solidity, react...',
        tagsHint: 'Up to 8 tags, 20 chars each',
        catDevelopment: 'Development',
        catDesign: 'Design',
        catContent: 'Content',
        catAudit: 'Security Audit',
        catOperations: 'Operations',
        catResearch: 'Research',
        catOther: 'Other',
        filterCategory: 'Category',
        // Broadcast mode
        slotBudgetLabel: 'Reward per Slot (USDC)',
        maxProvidersLabel: 'Number of Slots',
        totalBudgetHint: 'Total payout: {total} USDC',
        slotsProgress: '{taken}/{max} slots taken',
        fullyBooked: 'Fully Booked',
        // Squad Signal
        squadSignal: 'Form Squad',
        viewSquadSignal: 'View Squad Signal',
        squadSignalDesc: 'Post a squad bulletin to recruit teammates for this task',
        squadRoles: 'Roles',
        addRole: 'Add Role',
        roleTitle: 'Role Name',
        roleTags: 'Required Skills',
        roleBudget: 'Reward (USDC)',
        roleSlots: 'Slots',
        squadDescription: 'Squad Description',
        squadDescPlaceholder: 'Describe your squad plan, division of work...',
        publishSquadSignal: 'Publish Squad Signal',
        squadSignalSuccess: 'Squad signal published',
        squadSignalError: 'Failed to publish',
        squadSourceTask: 'Source Task',
        squadRecruiting: 'Recruiting',
        squadFilled: 'Filled',
```

**Step 3: Commit**
```bash
git add lib/i18n/zh.ts lib/i18n/en.ts
git commit -m "feat(i18n): add phase2 keys — category, tags, broadcast, squad signal"
```

---

## Phase C：功能一 — 分类 + 标签

### Task 5：更新 useCreateCollaboration hook

**Files:**
- Modify: `hooks/useCollaborations.ts:174-194` (insert payload)

**Step 1: 在 collaborations insert 的 payload 中新增字段**

在 `grade: input.grade || 'E',` 之后新增：

```typescript
                    category: input.category || 'other',
                    tags: input.tags || [],
                    slot_budget: input.slot_budget ?? input.total_budget,
                    max_providers: input.max_providers || 1,
                    slots_taken: 0,
```

**Step 2: Commit**
```bash
git add hooks/useCollaborations.ts
git commit -m "feat(hook): pass category/tags/slots fields in createCollaboration"
```

---

### Task 6：创建页 — 分类选择器 + 标签输入

**Files:**
- Modify: `app/collaborations/create/page.tsx`

**Step 1: 新增 state**

在 `const [paymentMode, setPaymentMode]` 之后新增：

```typescript
    const [category, setCategory] = useState('other');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
```

**Step 2: 定义分类配置（在 GRADE_CONFIG 之后）**

```typescript
const CATEGORIES = [
    { value: 'development', icon: 'code' },
    { value: 'design', icon: 'palette' },
    { value: 'content', icon: 'article' },
    { value: 'audit', icon: 'security' },
    { value: 'operations', icon: 'campaign' },
    { value: 'research', icon: 'science' },
    { value: 'other', icon: 'more_horiz' },
] as const;
```

**Step 3: 标签处理函数（在 handleSubmit 之前）**

```typescript
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
```

**Step 4: 将 category + tags 加入 handleSubmit**

在 `createCollab.mutateAsync({` 调用中新增：

```typescript
                category,
                tags,
```

**Step 5: JSX — 在 Grade 选择器之后插入分类选择器**

```tsx
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
                                        className={`p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1 text-center ${
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
```

**Step 6: Commit**
```bash
git add app/collaborations/create/page.tsx
git commit -m "feat(create): add category selector and tags input"
```

---

### Task 7：大厅页 — 分类过滤 + 卡片标签

**Files:**
- Modify: `app/collaborations/page.tsx`

**Step 1: 新增 filterCategory state**

在 `const [filterStatus, setFilterStatus]` 之后：

```typescript
    const [filterCategory, setFilterCategory] = useState<string>('all');
```

**Step 2: 在 filtered useMemo 中加入 category 过滤**

在 `if (filterStatus !== 'all')` 块之后：

```typescript
        if (filterCategory !== 'all') {
            items = items.filter(c => c.category === filterCategory);
        }
```

更新 `PerspectiveTransition` 的 id 以包含 filterCategory：

```typescript
id={`lobby-${filterGrade}-${filterBudget}-${filterStatus}-${filterCategory}`}
```

**Step 3: 定义分类标签映射（在 statusLabel 之后）**

```typescript
    const categoryLabel: Record<string, string> = {
        all: t.quests.filterAll,
        development: t.quests.catDevelopment,
        design: t.quests.catDesign,
        content: t.quests.catContent,
        audit: t.quests.catAudit,
        operations: t.quests.catOperations,
        research: t.quests.catResearch,
        other: t.quests.catOther,
    };

    const CATEGORY_KEYS = ['development', 'design', 'content', 'audit', 'operations', 'research', 'other'] as const;
```

**Step 4: 在 filter panel 中加入 Category 行**

在 Budget 过滤行 `</div>` 之后、filter panel 外层 `</div>` 之前插入：

```tsx
                            {/* Category */}
                            <div className="flex items-center gap-4 px-5 py-3">
                                <span className="w-14 shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                                    {t.quests.filterCategory}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(['all', ...CATEGORY_KEYS]).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilterCategory(cat)}
                                            className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${
                                                filterCategory === cat
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-primary border border-zinc-200 dark:border-zinc-700 hover:border-primary/40 bg-white dark:bg-zinc-900'
                                            }`}
                                        >
                                            {categoryLabel[cat]}
                                        </button>
                                    ))}
                                </div>
                            </div>
```

**Step 5: 在 Reset button 的条件中加入 filterCategory**

```typescript
{(filterStatus !== 'all' || filterGrade !== 'all' || filterBudget !== 'all' || filterCategory !== 'all') && (
```

更新 reset onClick：

```typescript
onClick={() => { setFilterStatus('all'); setFilterGrade('all'); setFilterBudget('all'); setFilterCategory('all'); }}
```

**Step 6: 任务卡片 — 在底部 footer 中展示 category badge + tags**

在卡片 footer `<div className="pt-4 border-t ...">` 内，日期时间之后添加：

```tsx
                                                {/* Category + Tags */}
                                                {(c.category && c.category !== 'other' || (c.tags && c.tags.length > 0)) && (
                                                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 group-hover:border-white/20 transition-colors">
                                                        {c.category && c.category !== 'other' && (
                                                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded group-hover:bg-white/10 group-hover:text-white/60 transition-colors">
                                                                {categoryLabel[c.category] || c.category}
                                                            </span>
                                                        )}
                                                        {(c.tags || []).slice(0, 3).map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-white/40 transition-colors">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
```

**Step 7: Commit**
```bash
git add app/collaborations/page.tsx
git commit -m "feat(lobby): add category filter row and tag display on cards"
```

---

## Phase D：功能二 — 广播模式（多名额）

### Task 8：创建页 — 预算区块重构为 slot_budget × max_providers

**Files:**
- Modify: `app/collaborations/create/page.tsx`

**Step 1: 新增 state**

在 `const [category, setCategory]` 之后新增：

```typescript
    const [slotBudget, setSlotBudget] = useState('');
    const [maxProviders, setMaxProviders] = useState(1);
```

**Step 2: 更新 isValid（将 totalBudget 相关换成 slotBudget）**

找到 `Number(totalBudget) > 0 &&` 和 `budgetMeetsGrade` 相关逻辑，整体替换：

```typescript
    const gradeConf = GRADE_CONFIG[grade];
    const budgetMeetsGrade = Number(slotBudget) >= gradeConf.minBudget;
    const totalBudgetDisplay = Number(slotBudget) * maxProviders;
    const milestonesMeetGrade = milestones.length >= gradeConf.minMilestones;

    const isValid =
        title.trim() &&
        description.trim() &&
        Number(slotBudget) > 0 &&
        budgetMeetsGrade &&
        milestonesMeetGrade &&
        totalPercentage === 100 &&
        milestones.every((m: MilestoneInput) => m.title.trim()) &&
        finalDelivery.trim() &&
        paymentMode === 'self_managed';
```

**Step 3: 更新 handleSubmit 传参**

```typescript
            const result = await createCollab.mutateAsync({
                title: title.trim(),
                description: description.trim(),
                grade,
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
```

**Step 4: 替换 Budget JSX 区块**

找到 `{/* Budget */}` 注释块，整体替换为：

```tsx
                    {/* Budget — slot_budget × max_providers */}
                    <div className="fade-up">
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                            {t.quests.slotBudgetLabel} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3 items-start">
                            {/* Slot Budget */}
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    value={slotBudget}
                                    onChange={(e) => setSlotBudget(e.target.value)}
                                    placeholder="500"
                                    min="0"
                                    className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors tabular-nums shadow-sm"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <span className="text-[14px] font-black text-slate-400">USDC</span>
                                </div>
                            </div>
                            {/* × symbol */}
                            <div className="pt-3.5 text-[18px] font-black text-slate-300 select-none">×</div>
                            {/* Max Providers */}
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
```

**Step 5: 更新里程碑 USDC 实时计算（totalBudget → slotBudget）**

搜索 `Number(totalBudget) * ms.amount_percentage` 替换为 `Number(slotBudget) * ms.amount_percentage`

**Step 6: Commit**
```bash
git add app/collaborations/create/page.tsx
git commit -m "feat(create): broadcast mode — slot_budget × max_providers budget UI"
```

---

### Task 9：useApproveApplication — 多名额时创建子协作

**Files:**
- Modify: `hooks/useCollaborations.ts:709-765` (useApproveApplication)

**Step 1: 修改 mutationFn 读取更多父协作信息**

将 `select('payment_mode')` 改为：

```typescript
            const { data: collabInfo } = await supabase
                .from('collaborations')
                .select('payment_mode, title, description, grade, category, tags, slot_budget, total_budget, max_providers, slots_taken, milestones(id, sort_order, title, amount_percentage), initiator_id, deadline, delivery_standard, reference_links, secret_content, reward_token')
                .eq('id', collabId)
                .single();
```

**Step 2: 在现有 `if (collabErr)` 之前，插入多名额分支逻辑**

将整个 mutationFn 主体替换为：

```typescript
        mutationFn: async ({ collabId, applicationId, applicantId }: { collabId: string; applicationId: string; applicantId: string }) => {
            const { data: collabInfo } = await supabase
                .from('collaborations')
                .select(`
                    payment_mode, title, description, grade, category, tags,
                    slot_budget, total_budget, max_providers, slots_taken,
                    initiator_id, deadline, delivery_standard, reference_links,
                    secret_content, reward_token
                `)
                .eq('id', collabId)
                .single();

            if (!collabInfo) throw new Error('Collaboration not found');

            const isMultiSlot = (collabInfo.max_providers || 1) > 1;
            const nextStatus = collabInfo.payment_mode === 'self_managed' ? 'ACTIVE' : 'LOCKED';

            if (isMultiSlot) {
                // ── Multi-slot: create child collab instance ──
                const slotBudget = collabInfo.slot_budget ?? collabInfo.total_budget;

                // 1. Create child collaboration
                const { data: childCollab, error: childErr } = await supabase
                    .from('collaborations')
                    .insert({
                        initiator_id: collabInfo.initiator_id,
                        provider_id: applicantId,
                        title: collabInfo.title,
                        description: collabInfo.description,
                        grade: collabInfo.grade,
                        category: collabInfo.category || 'other',
                        tags: collabInfo.tags || [],
                        total_budget: slotBudget,
                        slot_budget: slotBudget,
                        max_providers: 1,
                        slots_taken: 1,
                        reward_token: collabInfo.reward_token || 'USDC',
                        payment_mode: collabInfo.payment_mode,
                        deadline: collabInfo.deadline,
                        delivery_standard: collabInfo.delivery_standard,
                        reference_links: collabInfo.reference_links || [],
                        secret_content: collabInfo.secret_content,
                        parent_collab_id: collabId,
                        status: nextStatus,
                    })
                    .select()
                    .single();

                if (childErr) throw childErr;

                // 2. Fetch parent milestones and clone to child
                const { data: parentMilestones } = await supabase
                    .from('milestones')
                    .select('sort_order, title, amount_percentage')
                    .eq('collab_id', collabId)
                    .order('sort_order', { ascending: true });

                if (parentMilestones && parentMilestones.length > 0) {
                    const { error: msErr } = await supabase
                        .from('milestones')
                        .insert(parentMilestones.map(m => ({
                            collab_id: childCollab.id,
                            sort_order: m.sort_order,
                            title: m.title,
                            amount_percentage: m.amount_percentage,
                            status: 'INCOMPLETE',
                        })));
                    if (msErr) throw msErr;
                }

                // 3. Increment parent slots_taken
                const newSlotsTaken = (collabInfo.slots_taken || 0) + 1;
                const parentNextStatus = newSlotsTaken >= collabInfo.max_providers ? 'FULLY_BOOKED' : 'OPEN';

                await supabase
                    .from('collaborations')
                    .update({ slots_taken: newSlotsTaken, status: parentNextStatus })
                    .eq('id', collabId);

            } else {
                // ── Single slot: original behavior ──
                const { error: collabErr } = await supabase
                    .from('collaborations')
                    .update({ provider_id: applicantId, status: nextStatus })
                    .eq('id', collabId);
                if (collabErr) throw collabErr;
            }

            // Mark this application accepted, others rejected (for single-slot only)
            await supabase
                .from('collaboration_applications')
                .update({ status: 'ACCEPTED' })
                .eq('id', applicationId);

            if (!isMultiSlot) {
                await supabase
                    .from('collaboration_applications')
                    .update({ status: 'REJECTED' })
                    .eq('collab_id', collabId)
                    .neq('id', applicationId);
            }

            // Notify the approved provider
            const { data: collab } = await supabase.from('collaborations').select('title').eq('id', collabId).single();
            if (collab) {
                await createNotification({
                    user_address: applicantId,
                    type: 'ACCEPT_APPROVED',
                    title: '你的承接申请已通过！',
                    body: `「${collab.title}」的发布人已选择你作为合作伙伴。`,
                    metadata: { collab_id: collabId },
                });
            }
        },
```

**Step 3: Commit**
```bash
git add hooks/useCollaborations.ts
git commit -m "feat(hook): useApproveApplication — create child collab for multi-slot mode"
```

---

### Task 10：大厅 — 过滤子协作 + 名额进度条

**Files:**
- Modify: `hooks/useCollaborations.ts:93-107` (useLobbyCollaborations)
- Modify: `app/collaborations/page.tsx` (card UI)

**Step 1: useLobbyCollaborations — 排除子协作**

在 `.neq('status', 'CANCELLED')` 之后新增：

```typescript
                .is('parent_collab_id', null)  // 只展示顶级任务，子协作不出现在大厅
```

**Step 2: 大厅卡片 — 多名额进度条**

在卡片 header row `<div className="flex items-start justify-between">` 的 grade badge 之后，新增：

```tsx
                                                {(c.max_providers || 1) > 1 && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border shrink-0 ${
                                                        c.status === 'FULLY_BOOKED'
                                                            ? 'bg-slate-200/50 text-slate-500 border-slate-300/30'
                                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    }`}>
                                                        {c.status === 'FULLY_BOOKED'
                                                            ? t.quests.fullyBooked
                                                            : t.quests.slotsProgress
                                                                .replace('{taken}', String(c.slots_taken || 0))
                                                                .replace('{max}', String(c.max_providers))
                                                        }
                                                    </span>
                                                )}
```

**Step 3: Commit**
```bash
git add hooks/useCollaborations.ts app/collaborations/page.tsx
git commit -m "feat(lobby): hide child collabs, show slot progress badge on cards"
```

---

## Phase E：功能三 — 组队信号

### Task 11：useCreateSquadSignal hook

**Files:**
- Modify: `hooks/useBulletins.ts` (追加 hook)

**Step 1: 定义 SquadRole 类型并追加到文件末尾**

```typescript
export interface SquadRole {
    title: string;
    tags: string[];
    budget: number;
    slots: number;
}

export interface CreateSquadSignalInput {
    parentCollabId: string;
    parentCollabTitle: string;
    description: string;
    roles: SquadRole[];
}

export function useCreateSquadSignal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateSquadSignalInput) => {
            // 1. Create one child collab per role (with max_providers = role.slots)
            const rolesWithCollabs = await Promise.all(
                input.roles.map(async (role) => {
                    // Fetch parent collab info for cloning
                    const { data: parent } = await supabase
                        .from('collaborations')
                        .select('initiator_id, grade, category, payment_mode, deadline, reference_links, reward_token')
                        .eq('id', input.parentCollabId)
                        .single();

                    if (!parent) throw new Error('Parent collab not found');

                    const { data: childCollab, error } = await supabase
                        .from('collaborations')
                        .insert({
                            initiator_id: parent.initiator_id,
                            title: `[组队岗位] ${role.title} — ${input.parentCollabTitle}`,
                            description: `来源于组队信号。岗位：${role.title}`,
                            grade: parent.grade || 'E',
                            category: parent.category || 'other',
                            tags: role.tags,
                            total_budget: role.budget * role.slots,
                            slot_budget: role.budget,
                            max_providers: role.slots,
                            slots_taken: 0,
                            reward_token: parent.reward_token || 'USDC',
                            payment_mode: parent.payment_mode || 'self_managed',
                            deadline: parent.deadline,
                            reference_links: parent.reference_links || [],
                            parent_collab_id: input.parentCollabId,
                            status: 'OPEN',
                        })
                        .select('id')
                        .single();

                    if (error) throw error;
                    return { ...role, child_collab_id: childCollab.id };
                })
            );

            // 2. Create squad_signal bulletin
            const { data: bulletin, error: bulletinErr } = await supabase
                .from('bulletins')
                .insert({
                    title: `组队招募：${input.parentCollabTitle}`,
                    content: input.description,
                    category: 'squad_signal',
                    is_pinned: false,
                    squad_signal_meta: {
                        parent_collab_id: input.parentCollabId,
                        parent_collab_title: input.parentCollabTitle,
                        roles: rolesWithCollabs,
                    },
                })
                .select('id')
                .single();

            if (bulletinErr) throw bulletinErr;
            return bulletin;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bulletins'] });
            queryClient.invalidateQueries({ queryKey: ['collaborations'] });
        },
    });
}
```

注意：需要在文件顶部补充 import：
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
```
（检查是否已存在，按需添加）

**Step 2: Commit**
```bash
git add hooks/useBulletins.ts
git commit -m "feat(hook): add useCreateSquadSignal — creates child collabs + bulletin"
```

---

### Task 12：SquadSignalModal 组件

**Files:**
- Create: `components/collaborations/SquadSignalModal.tsx`

**Step 1: 创建组件文件**

```tsx
'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useCreateSquadSignal, type SquadRole } from '@/hooks/useBulletins';
import { toast } from '@/components/ui/use-toast';

interface Props {
    collabId: string;
    collabTitle: string;
    onClose: () => void;
}

export function SquadSignalModal({ collabId, collabTitle, onClose }: Props) {
    const t = useT();
    const createSignal = useCreateSquadSignal();

    const [description, setDescription] = useState('');
    const [roles, setRoles] = useState<SquadRole[]>([
        { title: '', tags: [], budget: 0, slots: 1 }
    ]);
    const [tagInputs, setTagInputs] = useState<string[]>(['']);

    const addRole = () => {
        setRoles([...roles, { title: '', tags: [], budget: 0, slots: 1 }]);
        setTagInputs([...tagInputs, '']);
    };

    const removeRole = (i: number) => {
        if (roles.length <= 1) return;
        setRoles(roles.filter((_, idx) => idx !== i));
        setTagInputs(tagInputs.filter((_, idx) => idx !== i));
    };

    const updateRole = (i: number, field: keyof SquadRole, val: any) => {
        const updated = [...roles];
        (updated[i] as any)[field] = val;
        setRoles(updated);
    };

    const addRoleTag = (i: number, raw: string) => {
        const tag = raw.trim().toLowerCase().slice(0, 20);
        if (tag && !roles[i].tags.includes(tag) && roles[i].tags.length < 5) {
            updateRole(i, 'tags', [...roles[i].tags, tag]);
        }
        const newInputs = [...tagInputs];
        newInputs[i] = '';
        setTagInputs(newInputs);
    };

    const removeRoleTag = (roleIdx: number, tag: string) => {
        updateRole(roleIdx, 'tags', roles[roleIdx].tags.filter(t => t !== tag));
    };

    const isValid = description.trim() && roles.every(r => r.title.trim() && r.budget > 0);

    const handleSubmit = async () => {
        if (!isValid) return;
        try {
            await createSignal.mutateAsync({
                parentCollabId: collabId,
                parentCollabTitle: collabTitle,
                description: description.trim(),
                roles,
            });
            toast({ title: t.quests.squadSignalSuccess });
            onClose();
        } catch (e: any) {
            toast({ title: t.quests.squadSignalError, description: e?.message, variant: 'destructive' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xl">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">{t.quests.squadSignal}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Source task */}
                    <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
                        <p className="text-[11px] font-bold text-primary/60 uppercase tracking-wider">{t.quests.squadSourceTask}</p>
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{collabTitle}</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {t.quests.squadDescription} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={t.quests.squadDescPlaceholder}
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    {/* Roles */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{t.quests.squadRoles}</label>
                            <button onClick={addRole} className="text-[12px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[14px]">add</span>
                                {t.quests.addRole}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {roles.map((role, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-400">#{i + 1}</span>
                                        {roles.length > 1 && (
                                            <button onClick={() => removeRole(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined !text-[16px]">remove_circle</span>
                                            </button>
                                        )}
                                    </div>
                                    {/* Role title */}
                                    <input
                                        type="text"
                                        value={role.title}
                                        onChange={e => updateRole(i, 'title', e.target.value)}
                                        placeholder={t.quests.roleTitle}
                                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-[13px] text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                    />
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5 items-center min-h-[36px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 focus-within:border-primary">
                                        {role.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                                                {tag}
                                                <button onClick={() => removeRoleTag(i, tag)}>
                                                    <span className="material-symbols-outlined !text-[11px]">close</span>
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInputs[i] || ''}
                                            onChange={e => { const ni = [...tagInputs]; ni[i] = e.target.value; setTagInputs(ni); }}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addRoleTag(i, tagInputs[i] || ''); } }}
                                            placeholder={t.quests.roleTags}
                                            className="flex-1 min-w-[80px] bg-transparent text-[12px] text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none"
                                        />
                                    </div>
                                    {/* Budget + Slots */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                value={role.budget || ''}
                                                onChange={e => updateRole(i, 'budget', Number(e.target.value))}
                                                placeholder="300"
                                                min="0"
                                                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 pr-14 text-[13px] text-slate-900 dark:text-white focus:outline-none focus:border-primary tabular-nums"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">USDC</span>
                                        </div>
                                        <div className="w-20">
                                            <input
                                                type="number"
                                                value={role.slots}
                                                onChange={e => updateRole(i, 'slots', Math.max(1, parseInt(e.target.value) || 1))}
                                                min="1"
                                                max="10"
                                                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-[13px] text-center text-slate-900 dark:text-white focus:outline-none focus:border-primary tabular-nums"
                                            />
                                            <p className="text-[10px] text-slate-400 text-center mt-1">{t.quests.roleSlots}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || createSignal.isPending}
                        className="w-full py-3.5 bg-primary text-white font-bold text-[14px] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
                    >
                        {createSignal.isPending
                            ? <><span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span> {t.quests.creating}</>
                            : <><span className="material-symbols-outlined !text-[16px]">group_add</span> {t.quests.publishSquadSignal}</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
```

**Step 2: Commit**
```bash
git add components/collaborations/SquadSignalModal.tsx
git commit -m "feat(component): SquadSignalModal — multi-role squad recruitment UI"
```

---

### Task 13：任务详情页 — 组队信号入口

**Files:**
- Modify: `app/collaborations/[id]/page.tsx`

**Step 1: 找到文件并读取操作区块**

任务详情页是一个较长的文件。搜索 `useAbandonCollaboration` 的引用处（承接人操作区），在该区块附近新增组队信号状态和触发按钮。

在文件顶部 imports 区新增：

```typescript
import { SquadSignalModal } from '@/components/collaborations/SquadSignalModal';
```

**Step 2: 在 state 区新增 modal 状态**

```typescript
const [showSquadModal, setShowSquadModal] = useState(false);
```

**Step 3: 找到承接人操作区域（provider 视角）**

在 `status === 'ACTIVE'` 且 `address === provider_id` 的条件块中，在"放弃任务"按钮之前新增：

```tsx
{/* Squad Signal — 承接人可发起组队 */}
<button
    onClick={() => setShowSquadModal(true)}
    className="ag-btn-secondary flex items-center gap-2 text-[13px] py-2.5 px-4"
>
    <span className="material-symbols-outlined !text-[16px]">group_add</span>
    {t.quests.squadSignal}
</button>
```

**Step 4: 在页面 return 的末尾（WalletGatePage 关闭标签之前）新增 Modal**

```tsx
{showSquadModal && collaboration && (
    <SquadSignalModal
        collabId={collaboration.id}
        collabTitle={collaboration.title}
        onClose={() => setShowSquadModal(false)}
    />
)}
```

**Step 5: Commit**
```bash
git add app/collaborations/[id]/page.tsx
git commit -m "feat(detail): add 'Form Squad' button for active providers"
```

---

### Task 14：星火广场 — squad_signal 卡片样式

**Files:**
- Modify: `app/bulletin/page.tsx` 或 bulletins 展示组件（搜索 `useBulletins` 的调用处）

**Step 1: 定位 bulletin 卡片渲染逻辑**

找到渲染单条 bulletin 的 JSX，在 category 展示逻辑旁边新增 squad_signal 的处理分支：

```tsx
{bulletin.category === 'squad_signal' && bulletin.squad_signal_meta && (
    <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-bold text-primary/70 uppercase tracking-wider">
            <span className="material-symbols-outlined !text-[14px]">group</span>
            {t.quests.squadRoles}
        </div>
        {(bulletin.squad_signal_meta as any).roles?.map((role: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{role.title}</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {(role.tags || []).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-mono text-slate-400">#{tag}</span>
                        ))}
                    </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                    <span className="text-[13px] font-black text-primary">{role.budget} USDC</span>
                    <p className="text-[10px] text-slate-400">{role.slots} 名额</p>
                </div>
            </div>
        ))}
        {(bulletin.squad_signal_meta as any).parent_collab_id && (
            <a
                href={`/collaborations/${(bulletin.squad_signal_meta as any).parent_collab_id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 mt-1"
            >
                <span className="material-symbols-outlined !text-[12px]">open_in_new</span>
                {t.quests.squadSourceTask}：{(bulletin.squad_signal_meta as any).parent_collab_title}
            </a>
        )}
    </div>
)}
```

**Step 2: 更新 Bulletin type**

在 `hooks/useBulletins.ts` 的 `Bulletin` interface 中新增：

```typescript
    squad_signal_meta?: Record<string, any> | null;
```

**Step 3: Commit**
```bash
git add app/bulletin/page.tsx hooks/useBulletins.ts
git commit -m "feat(bulletins): render squad_signal cards with role list"
```

---

## Phase F：验收测试清单

完成所有 Task 后，在 `localhost:3000` 手动验证：

| 场景 | 预期结果 |
|------|---------|
| 创建任务 → 选择 Category + Tags | DB 记录写入正确分类和标签 |
| 大厅 → Category 过滤按 `开发` | 只展示 category = development 的任务 |
| 大厅卡片 → 有 tags 的任务 | 显示 #tag1 #tag2 |
| 创建任务 → 名额数设为 3 | 预算显示"共 X USDC" |
| 多名额任务 → Approve 第1个申请 | 创建子协作，父协作显示"1/3 名额" |
| 多名额任务 → Approve 第3个申请 | 父协作状态 = FULLY_BOOKED |
| 子协作不出现在大厅 | 大厅只显示 parent_collab_id IS NULL 的任务 |
| ACTIVE 承接人 → 点击"发起组队" | SquadSignalModal 打开 |
| 填写组队信号 → 发布 | bulletins 中出现 squad_signal 卡片，有岗位列表 |
| 点击来源任务链接 | 跳转到父任务详情 |
