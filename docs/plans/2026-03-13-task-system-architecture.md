# 任务系统完整架构文档 (Task System Architecture)

> **版本**: v1.0
> **日期**: 2026-03-13
> **适用范围**: 本文档是任务系统（冒险者大厅）所有后续开发和迭代的唯一技术权威依据

---

## 一、系统定位

任务系统是 SuperGuild 的核心业务模块，实现**无许可的 P2P 协作**。发布人（initiator）通过智能合约发布任务并托管报酬，承接人（provider）交付里程碑后，系统自动或人工确认并释放资金。全过程无中心化管理员介入。

---

## 二、状态机 (State Machine)

```
                    ┌──────────────────────────────────────────────────┐
                    │              任意阶段 → CANCELLED                 │
                    └──────────────────────────────────────────────────┘

OPEN ──→ PENDING_APPROVAL ──┬──→ ACTIVE ──→ (里程碑循环) ──→ SETTLED
                            │       ↑
                            └──→ LOCKED ──→ ACTIVE   (仅 guild_managed)

                            ACTIVE ──→ DISPUTED  (仅 guild_managed)
```

### 状态定义

| 状态 | 含义 | 触发条件 | 允许操作 |
|------|------|----------|----------|
| `OPEN` | 招募中 | 任务创建 | 冒险者申请承接 |
| `PENDING_APPROVAL` | 待审批 | 有人申请（旧模式，已被 applications 队列取代） | 发布人审核 |
| `LOCKED` | 已锁仓 | guild_managed: escrow deposit 完成 | 承接人提交首个凭证 |
| `ACTIVE` | 进行中 | self_managed: 发布人 approve application<br>guild_managed: 首个凭证提交 | 提交/验收里程碑 |
| `SETTLED` | 已结算 | 全部里程碑 CONFIRMED | 无（终态） |
| `DISPUTED` | 争议中 | 发布人发起链上争议 | Hand of Justice 投票 |
| `CANCELLED` | 已撤销 | 发布人主动撤销 | 无（终态，只读展示） |

### 里程碑子状态机

```
INCOMPLETE ──→ SUBMITTED ──┬──→ CONFIRMED  (发布人确认并释放报酬)
       ↑                    │
       └────────────────────┘  (发布人暂缓，要求修改)
```

| 状态 | 含义 |
|------|------|
| `INCOMPLETE` | 未完成 / 等待提交 / 被暂缓退回 |
| `SUBMITTED` | 已提交，等待发布人验收 |
| `CONFIRMED` | 已确认，报酬已释放 |

---

## 三、角色与权限矩阵

| 角色 | 定义 | 核心权限 |
|------|------|----------|
| **发布人 (initiator)** | `collaborations.initiator_id` | 创建任务、审核申请人（approve/reject）、验收里程碑（confirm/hold/dispute）、撤销任务 |
| **承接人 (provider)** | `collaborations.provider_id` | 提交凭证 (proof)、放弃任务 |
| **申请人** | `collaboration_applications.applicant_id` | 浏览 OPEN 任务并提交申请 |
| **旁观者** | 任意已连接钱包用户 | 浏览 Lobby 全部非 SETTLED 任务 |

---

## 四、核心流程详解

### 4.1 发布任务

**路由**: `/collaborations/create`
**Hook**: `useCreateCollaboration()`

1. 填写：标题、描述、等级 (S/A/B/C/D/E)、报酬 (USDC)、交付标准、参考资料、私密内容
2. 拆解里程碑：每个里程碑有标题 + 百分比，加和必须 = 100%
3. 选择支付模式：self_managed（当前 MVP 唯一可选）/ guild_managed（Coming Soon）
4. 等级约束：S/A 级最低 3 个里程碑，报酬有最低门槛
5. 写入 `collaborations` 表 + `milestones` 表 → 状态 `OPEN`

### 4.2 申请承接

**Hook**: `useApplyToCollab()`

1. 冒险者在任务详情页提交 pitch message
2. 写入 `collaboration_applications` 表，状态 `PENDING`
3. 通知发布人 (`ACCEPT_REQUEST`)

### 4.3 审核申请人

**Hook**: `useApproveApplication()` / `useRejectApplication()`

发布人在详情页看到申请人卡片（头像、bio、联系方式、VCP、作品集、pitch），可以：

- **Approve** → `provider_id` 写入 collaboration, 其余申请标记 REJECTED
  - self_managed → 直接进入 `ACTIVE`
  - guild_managed → 进入 `LOCKED`（需要链上 escrow deposit）
  - 通知承接人 (`ACCEPT_APPROVED`)
- **Reject** → 申请标记 `REJECTED`，通知承接人 (`ACCEPT_REJECTED`)

### 4.4 提交凭证

**Hook**: `useSubmitProofMutation()`
**组件**: `UploadProofDialog`

1. 承接人点击活跃里程碑的"提交审核"
2. 弹出对话框，填入交付物链接 + SHA-256 hash
3. 写入 `proofs` 表（**只增不删不改**）
4. 里程碑状态 → `SUBMITTED`
5. guild_managed 额外动作：链上 `submitProof(collabId, msIdx, contentHashBytes32)` → 触发 7 天窗口
6. 通知发布人 (`MILESTONE_SUBMITTED`)

### 4.5 验收里程碑

**组件**: `MilestoneTimeline`

发布人有三个操作选项：

#### 确认并释放 (Confirm & Release)
**Hook**: `useConfirmMilestone()` + `useDirectPay()` / `useGuildEscrow()`

- self_managed: 调用 DirectPay 合约 `pay(collabId, worker, amount)` → USDC 直转承接人
- guild_managed: 调用 GuildEscrow `confirmMilestoneOnChain(collabId, msIdx)` → 释放锁仓
- 里程碑 → `CONFIRMED`
- 全部里程碑 CONFIRMED → 协作 → `SETTLED`

#### 暂缓 (Hold)
**Hook**: `useHoldMilestone()`

- 里程碑从 `SUBMITTED` 退回 `INCOMPLETE`
- 不释放报酬
- 通知承接人 (`MILESTONE_HELD`) 要求修改
- 承接人可重新提交凭证

#### 争议 (Dispute) — 仅 guild_managed
**Hook**: `useDisputeCollaboration()` + `useGuildEscrow()`

- 链上 `disputeMilestoneOnChain()` → 10% 罚没入国库
- 协作 → `DISPUTED`
- 交由 Hand of Justice (#4 NFT) 仲裁投票

### 4.6 撤销任务

**Hook**: `useCancelCollaboration()`

- 发布人可在 SETTLED 之前任意阶段撤销
- 已支付的里程碑报酬不退
- 协作 → `CANCELLED`（终态，只读）
- guild_managed 额外：`cancelEscrow()` 退回未释放资金
- 通知对方 (`TASK_CANCELLED`)
- **CANCELLED 任务继续显示在 My Desk，但不可编辑不可操作**

### 4.7 放弃任务

**Hook**: `useAbandonCollaboration()`

- 承接人可在 LOCKED/ACTIVE 阶段放弃
- 协作退回 `OPEN`，provider_id 清空
- 通知发布人 (`PROVIDER_ABANDONED`)

---

## 五、双轨支付架构

> 详见 `docs/plans/2026-03-12-payment-mode-architecture.md`

| 维度 | self_managed (DirectPay) | guild_managed (GuildEscrow) |
|------|--------------------------|----------------------------|
| **合约** | `0xDc0f7BF5c7C026f8000e00a40d0f93a28c04bf65` | `0x8828c3fe2f579a70057714e4034d8c8f91232a60` |
| **资金流** | USDC 通过 DirectPay 直转承接人 | USDC 锁入 GuildEscrow，按里程碑释放 |
| **链上证据** | 无（凭证仅在 Supabase） | contentHash 上链 (bytes32) |
| **7 天窗口** | 无 | 有，合约强制执行 |
| **仲裁** | 不可用 | 10% 罚没 + Hand of Justice 投票 |
| **VCP 倍率** | 0.5x | 1.0x |
| **当前状态** | **MVP 已激活** | 已实现 ~80%，等安全审计后激活 |

### 支付流程 (self_managed)

```
发布人点击 "确认并释放"
  → DirectPay hook 检查 USDC allowance
  → (不足) approve USDC → 等待确认
  → pay(collabIdBytes32, workerAddress, amount) → USDC 直转
  → 等待链上确认
  → Supabase: milestone.status = CONFIRMED
  → 全部 CONFIRMED → collab.status = SETTLED
```

---

## 六、数据模型

### 6.1 主表关系

```
collaborations (1) ──→ (N) milestones ──→ (N) proofs
collaborations (1) ──→ (N) collaboration_applications
```

### 6.2 字段定义

#### `collaborations` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID (PK) | 任务唯一标识 |
| `initiator_id` | String | 发布人钱包地址 |
| `provider_id` | String? | 承接人钱包地址（approve 后写入） |
| `pending_provider_id` | String? | 旧模式兼容字段 |
| `title` | String | 任务标题 |
| `description` | Text? | 任务描述 |
| `reference_links` | JSONB | 参考资料 `[{label?, url}]` |
| `deadline` | Timestamp? | 截止日期 |
| `delivery_standard` | String? | 交付标准 |
| `total_budget` | Numeric | 总报酬 (USDC) |
| `reward_token` | String | 报酬代币（默认 USDC） |
| `grade` | String | 等级 S/A/B/C/D/E |
| `secret_content` | Text? | 私密内容（仅当事人可见） |
| `status` | Enum | 状态机当前状态 |
| `payment_mode` | Enum | `self_managed` / `guild_managed` |
| `escrow_address` | String? | 链上托管合约地址 |
| `created_at` | Timestamp | 创建时间 |
| `updated_at` | Timestamp | 更新时间 |

#### `milestones` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID (PK) | 里程碑 ID |
| `collab_id` | UUID (FK) | 关联任务 |
| `sort_order` | Int | 顺序 (1-indexed) |
| `title` | String? | 里程碑标题 |
| `amount_percentage` | Int | 报酬占比 (0-100) |
| `status` | Enum | INCOMPLETE / SUBMITTED / CONFIRMED |

#### `proofs` 表 (**只增不删不改**)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID (PK) | 凭证 ID |
| `milestone_id` | UUID (FK) | 关联里程碑 |
| `submitter_id` | String | 提交者地址 |
| `content_url` | Text | 交付物链接 |
| `content_hash` | String | SHA-256 哈希 |
| `submitted_at` | Timestamp | 提交时间 |

#### `collaboration_applications` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID (PK) | 申请 ID |
| `collab_id` | UUID (FK) | 关联任务 |
| `applicant_id` | String | 申请人地址 |
| `message` | Text | Pitch 内容 |
| `status` | Enum | PENDING / ACCEPTED / REJECTED |
| `created_at` | Timestamp | 申请时间 |

---

## 七、页面架构

| 页面 | 路由 | 职责 | 数据源 |
|------|------|------|--------|
| **Lobby（任务大厅）** | `/collaborations` | 展示所有非 SETTLED 任务，按时间排序，支持等级/报酬/状态三组筛选 | `useLobbyCollaborations()` |
| **My Desk（我的工作台）** | `/collaborations/manage` | 展示用户发布+承接的全部任务（含 CANCELLED），按角色/状态筛选，详细信息卡片 | `useMyCollaborations()` |
| **任务详情** | `/collaborations/[id]` | 完整工作台：申请人审核、里程碑控制台、托管监控、凭证链 | `useCollaborationDetail()` |
| **发布任务** | `/collaborations/create` | 创建表单：等级、里程碑、支付模式 | `useCreateCollaboration()` |

### 7.1 Lobby 筛选逻辑

- **状态筛选**: All / OPEN / ACTIVE / PENDING_APPROVAL / CANCELLED
- **等级筛选**: All / S / A / B / C / D / E
- **报酬筛选**: All / < 500 USDC / 500–2000 USDC / > 2000 USDC
- 排序：`created_at DESC`（时间倒序），不做默认排序调整

### 7.2 My Desk 筛选逻辑

- **角色筛选**: 全部 / 我发布的 / 我承接的
- **状态标签页**: 全部 / 进行中 / 待处理 / 已完成 / 已取消
- CANCELLED 任务显示为灰色只读卡片，带"已撤销"banner

---

## 八、通知链路

| 事件 | 通知类型 | 接收方 | 说明 |
|------|----------|--------|------|
| 冒险者申请承接 | `ACCEPT_REQUEST` | 发布人 | 显示申请人信息 |
| 申请通过 | `ACCEPT_APPROVED` | 承接人 | 含发布人联系方式 |
| 申请拒绝 | `ACCEPT_REJECTED` | 承接人 | |
| 提交里程碑凭证 | `MILESTONE_SUBMITTED` | 发布人 | 提醒验收 |
| 暂缓里程碑 | `MILESTONE_HELD` | 承接人 | 要求修改 |
| 承接人放弃 | `PROVIDER_ABANDONED` | 发布人 | 任务重新开放 |
| 任务撤销 | `TASK_CANCELLED` | 承接人 | |

### 通知展示

- Header 通知铃铛有**红点 badge** 显示未读数量
- 抽屉面板按日期分组（今天/昨天/更早）
- 60 秒轮询刷新

---

## 九、Hooks 索引

| Hook | 文件 | 职责 |
|------|------|------|
| `useLobbyCollaborations` | `hooks/useCollaborations.ts` | Lobby 数据源，全部非 SETTLED |
| `useMyCollaborations` | 同上 | My Desk 数据源，当前用户关联的全部任务（含 CANCELLED） |
| `useCollaborationDetail` | 同上 | 单个任务详情 + 里程碑 + 凭证 |
| `useCreateCollaboration` | 同上 | 创建任务 |
| `useApplyToCollab` | 同上 | 申请承接 |
| `useCollabApplications` | 同上 | 查询申请人列表 |
| `useApproveApplication` | 同上 | 审批申请 |
| `useRejectApplication` | 同上 | 拒绝申请 |
| `useConfirmMilestone` | 同上 | 确认里程碑 (DB 层) |
| `useHoldMilestone` | 同上 | 暂缓里程碑，退回 INCOMPLETE |
| `useDisputeCollaboration` | 同上 | 发起争议 |
| `useAbandonCollaboration` | 同上 | 承接人放弃 |
| `useCancelCollaboration` | 同上 | 发布人撤销 |
| `useSubmitProofMutation` | 同上 | 提交凭证 |
| `useDirectPay` | `hooks/useDirectPay.ts` | self_managed 链上支付 |
| `useGuildEscrow` | `hooks/useGuildEscrow.ts` | guild_managed 链上托管（预备） |

---

## 十、组件索引

| 组件 | 文件 | 职责 |
|------|------|------|
| `MilestoneTimeline` | `components/collaborations/MilestoneTimeline.tsx` | 里程碑时间线（完成/活跃/锁定三种视觉），包含提交/验收/暂缓/争议操作区 |
| `UploadProofDialog` | `components/collaborations/UploadProofDialog.tsx` | 凭证上传弹窗，SHA-256 哈希，guild_managed 分支含链上提交 |
| `MintTestUSDC` | `components/collaborations/MintTestUSDC.tsx` | 测试网 USDC 铸造（仅开发用） |
| `ApplicantReviewCard` | `app/collaborations/[id]/page.tsx` (内嵌) | 申请人审核卡片：头像/bio/联系方式/VCP/pitch/approve/reject |
| `ConfirmDialog` | 同上 (内嵌) | 通用确认弹窗 |

---

## 十一、已知局限与技术债

| 问题 | 影响 | 计划修复 |
|------|------|----------|
| self_managed 无链上证据 | 凭证仅在 Supabase，无链上锚定 | guild_managed 激活后自动解决 |
| MetaMask gas 估算偶发失败 | Sepolia 测试网 baseFee 波动导致 | 主网切换后自然解决 |
| Alchemy 403 限流 | 高频操作时 RPC 请求被限 | 主网使用付费 API Key |
| 无实时推送 | 通知靠 60s 轮询 | Phase 12 接入 Supabase Realtime |
| proofs 表无 RLS | 任何人可 INSERT | Phase 11.5 RLS 加固 |

---

## 十二、迭代路线

### 近期 (Phase 11.5)
- [ ] Supabase RLS 覆盖 `collaborations`, `milestones`, `proofs` 写入保护
- [ ] guild_managed 模式安全审计后激活
- [ ] 仲裁庭链上结算闭环

### 中期 (Phase 12)
- [ ] Ponder 索引层替代直接 RPC 轮询
- [ ] Supabase Realtime 替代通知轮询
- [ ] 任务搜索功能（全文检索）

### 远期 (Phase 13-14)
- [ ] Rhythm AI 自然语言发单
- [ ] ERC-4337 无感交互
- [ ] Arbitrum One 主网部署
