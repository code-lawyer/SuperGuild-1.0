# 任务系统 Phase 2 设计文档

> **版本**: v1.0
> **日期**: 2026-03-15
> **前置文档**: `docs/plans/2026-03-13-task-system-architecture.md`（Phase 1 架构基准）
> **适用范围**: 任务分类体系、广播模式（多名额）、组队信号 三项新功能的设计权威依据

---

## 一、背景与目标

Phase 1 任务系统已建立完整的 P2P 协作状态机和双轨支付架构。Phase 2 针对以下三个痛点进行扩展：

1. **可发现性差** — 任务无分类，大量任务堆在同一大厅，难以精准定向找到相关任务
2. **只支持 1:1 协作** — 多人需求的任务无法表达，发布方不得不把任务拆成多个独立协作
3. **团队协作无基础设施** — 承接人需要招募协作者时，只能用链下手段，无声誉记录

三项功能均以**向后兼容**为约束条件，不破坏任何现有协作流程。

---

## 二、功能一：任务分类体系（Category + Tags）

### 2.1 设计决策

采用**混合模式**：固定一级分类（7个） + 自由标签（tags）。

- 一级分类由平台固定，确保大厅可导航
- tags 由发布人自由填写，提供语义粒度，为 Rhythm AI 语义检索备好结构

### 2.2 数据层

`collaborations` 表新增两列：

```sql
ALTER TABLE collaborations
  ADD COLUMN category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';

-- 建议加索引
CREATE INDEX idx_collaborations_category ON collaborations(category);
CREATE INDEX idx_collaborations_tags ON collaborations USING GIN(tags);
```

**一级分类枚举值：**

| 值 | 中文标签 | 典型任务 |
|----|----------|---------|
| `development` | 开发 | 前端、合约、全栈、API |
| `design` | 设计 | UI/UX、品牌、插画 |
| `content` | 内容 | 写作、翻译、视频、文档 |
| `audit` | 安全审计 | 合约审计、渗透测试 |
| `operations` | 运营增长 | 社媒、社区、市场 |
| `research` | 研究咨询 | 调研、分析、战略 |
| `other` | 其他 | 兜底分类 |

### 2.3 UI 层

**创建页 (`/collaborations/create`)：**
- 在 Grade 选择器之后，新增 Category chip 组（必填）
- 在 Tags 区域新增自由标签输入（可选，Enter 或逗号分隔，最多 8 个，每个最长 20 字符）

**大厅页 (`/collaborations`)：**
- 在现有 Status / Grade / Budget 三行过滤器下方，新增 **Category** 过滤行
- 任务卡片底部展示分类 badge + 最多 3 个 tags 标签

**Rhythm AI 接入点（预备）：**
- `category` + `tags` 字段作为任务 embedding 的结构化元数据
- 后续 Rhythm 可做 `SELECT ... WHERE category = $1 AND tags @> ARRAY[$2]` 的向量检索预过滤

---

## 三、功能二：广播模式（多名额）

### 3.1 设计决策

**模板 + 子协作实例**：原始协作作为模板保持 OPEN 状态展示剩余名额；每次有申请人被 approve，系统自动创建一个子协作实例（完整复制里程碑），走正常 1:1 结算流程。

**兼容性保证：** `max_providers = 1`（默认值）时，行为与现有系统完全一致，无任何破坏性变更。

### 3.2 数据层

`collaborations` 表新增字段：

```sql
ALTER TABLE collaborations
  ADD COLUMN slot_budget NUMERIC,         -- 每名额报酬（USDC）
  ADD COLUMN max_providers INT DEFAULT 1, -- 总名额数（1 = 单人模式，向后兼容）
  ADD COLUMN slots_taken INT DEFAULT 0,   -- 已承接名额计数
  ADD COLUMN parent_collab_id UUID REFERENCES collaborations(id);
                                          -- 子协作指向父协作（NULL = 独立任务）
```

**字段语义调整：**

| 字段 | 原语义 | Phase 2 语义 |
|------|--------|-------------|
| `total_budget` | 总报酬 | 展示用（= `slot_budget × max_providers`），单人模式下与 `slot_budget` 相等 |
| `slot_budget` | 新增 | 单名额报酬，链上支付金额以此为准 |

> 存量单名额任务：`slot_budget = total_budget`，`max_providers = 1`，migration 自动补全。

### 3.3 状态机扩展

多名额任务的父协作状态机：

```
OPEN（names额可申请）
  → slots_taken < max_providers：持续接受申请
  → slots_taken = max_providers：父协作状态 → FULLY_BOOKED
  → 所有子协作 SETTLED：父协作 → SETTLED
  → 任意时刻可 CANCELLED
```

子协作实例走正常 1:1 状态机：`ACTIVE → PENDING → SETTLED`

### 3.4 业务流程

```
发布人创建任务
  └── max_providers = N, slot_budget = 500 USDC
       total_budget（展示）= 500 × N

申请人申请父协作 → 发布人 approve
  └── 系统动作：
       1. 创建子协作记录（parent_collab_id = 父ID）
          - 复制标题、描述、grade、category、tags、里程碑定义
          - provider_id = 申请人地址
          - total_budget = slot_budget（子协作独立结算）
          - status = ACTIVE（self_managed）/ LOCKED（guild_managed）
       2. 父协作 slots_taken +1
       3. 父协作 slots_taken = max_providers → 父协作 status = FULLY_BOOKED
       4. 通知申请人（ACCEPT_APPROVED）

子协作里程碑结算（走标准流程）
  └── 子协作 SETTLED 后，若所有子协作均 SETTLED → 父协作 SETTLED
```

### 3.5 UI 层

**创建页：**
- 预算区域重构为双输入：`每名额报酬（USDC）` × `名额数量`，实时显示总预算
- 名额数量默认 1，≥ 2 时展示多名额提示

**大厅卡片：**
- 多名额任务在卡片底部显示名额进度：`[已承接 2 / 共 3 名额]` + 进度条
- `FULLY_BOOKED` 状态下，卡片显示"名额已满"badge，仍可查看详情

**任务详情页：**
- 多名额任务新增"承接人列表"区块，展示每个已承接人的头像/地址缩写 + 其子协作进度
- 发布人视角可跳转到各子协作详情

---

## 四、功能三：组队信号（Squad Signal）

### 4.1 设计决策

组队信号是**社交层**，不改变核心结算架构。承接人承接任务后，可在平台内发布一条"组队公告"，引用原任务，并创建对应的子协作岗位（child collab）。其他人申请并承接子协作，走标准 self_managed 结算流程。

**关键决定：**
- 组队信号以特殊类型的公告（bulletin）实现，复用现有 `bulletins` 表
- 每个岗位对应一个子协作（`parent_collab_id` 指向父任务）
- 承接人自行支付队友报酬（发布子协作并付款），平台只做协调，不做托管分配

### 4.2 数据层

**复用 `bulletins` 表，新增类型：**

```sql
-- bulletins.type 新增枚举值
-- 现有：'text' | 'pioneer_exclusive'
-- 新增：'squad_signal'

ALTER TABLE bulletins
  ADD COLUMN squad_signal_meta JSONB;
  -- 仅 type = 'squad_signal' 时有值
```

`squad_signal_meta` 结构：

```jsonc
{
  "parent_collab_id": "uuid",      // 引用的原始任务 ID
  "parent_collab_title": "string", // 冗余存储，防止任务被撤销后断链
  "roles": [
    {
      "child_collab_id": "uuid",   // 创建时写入
      "title": "string",           // 岗位名称，e.g. "前端开发"
      "tags": ["react", "nextjs"], // 技能标签
      "budget": 300,               // 单岗报酬 USDC
      "slots": 1                   // 岗位人数（支持多名额）
    }
  ]
}
```

**子协作：** 即 Phase 2 的多名额子协作，`parent_collab_id` 指向父任务，`initiator_id` = 承接人地址（承接人变为子协作的发布人）。

### 4.3 业务流程

```
承接人处于 ACTIVE 状态的任务详情页
  └── 点击"发起组队" → 打开 SquadSignalModal

填写组队信号：
  - 组队说明（为什么需要队友，团队分工思路）
  - 若干岗位：岗位名称 + 技能 tags + 报酬 + 名额数

确认发布
  └── 系统动作（事务）：
       1. 为每个岗位创建子协作（status = OPEN, initiator_id = 当前承接人）
       2. 创建 bulletin（type = 'squad_signal', squad_signal_meta 含所有信息）
       3. 返回 bulletin URL

组队信号在"星火广场（bulletins）"展示：
  - 顶部显示"招募中 · 引用任务 [父任务标题]"
  - 每个岗位卡片：名称、技能标签、报酬、名额，含"申请加入"按钮
  - 点击申请 → 跳转到对应子协作详情，走正常申请流程

后续：
  - 承接人审核子协作申请，approve 后队友进入子协作 ACTIVE
  - 队友完成里程碑 → 承接人通过 DirectPay 释放子协作报酬
  - 组队信号岗位实时显示"已满/招募中"
```

### 4.4 UI 层

**任务详情页（承接人视角）：**
- `ACTIVE` 状态下，顶部操作区新增"发起组队"按钮（仅承接人可见）
- 若已发起过组队信号，改为"查看组队信号"链接

**SquadSignalModal 组件：**
- 说明文本输入
- 岗位编辑器：动态增减岗位，每岗位有名称 + tags + 报酬 + 名额
- 预览：将创建 N 个子协作 + 1 条公告
- 提交按钮（触发事务）

**星火广场（bulletins）：**
- `squad_signal` 类型的公告使用独特的卡片样式（招募状态标识、岗位列表、进度展示）
- 大厅支持按类型筛选，可单独查看组队信号

---

## 五、兼容性与迁移

### 5.1 存量数据迁移

```sql
-- 为存量任务填充新字段默认值
UPDATE collaborations
SET
  category = 'other',
  tags = '{}',
  slot_budget = total_budget,
  max_providers = 1,
  slots_taken = 0
WHERE category IS NULL;
```

### 5.2 向后兼容保证

| 场景 | 行为 |
|------|------|
| `max_providers = 1` 的任务 | 完全走原有 1:1 流程，UI 无变化 |
| 无 `category` 的老任务 | 显示为"其他"分类，不影响过滤 |
| 无 `tags` 的老任务 | tags 为空数组，不在标签区展示 |

### 5.3 RLS 策略补充

```sql
-- squad_signal bulletins：仅 ACTIVE 协作的承接人可发布
-- 对应 API 层校验：provider_id = msg.sender + collab.status = 'ACTIVE'

-- 子协作创建：initiator_id = msg.sender（承接人变发布人）
-- 复用现有 collaborations INSERT 策略
```

---

## 六、新增 Hooks 索引

| Hook | 职责 |
|------|------|
| `useCreateSquadSignal` | 事务：创建子协作 + 发布公告 |
| `useSquadSignalsByCollab(collabId)` | 查询任务关联的组队信号 |
| `useChildCollaborations(parentId)` | 查询父任务下所有子协作 |

---

## 七、迭代路线更新

### Phase 2a（当前优先）
- [x] 分类 + Tags：DB 迁移 + 创建/过滤 UI
- [x] 广播模式：DB 迁移 + 子协作创建逻辑 + 大厅卡片
- [x] 组队信号：SquadSignalModal + bulletins 类型扩展

### Phase 2b（Rhythm 接入）
- [ ] tags + category 写入 embedding pipeline
- [ ] Rhythm 自然语言任务推荐（`/tasks related to: ${query}`）

### 远期（Phase 13+）
- [ ] 组队信号的链上声誉聚合（团队贡献记录到 MedalNFT Dynamic Traits）
