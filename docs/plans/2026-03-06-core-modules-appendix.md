# SuperGuild 产品设计附录

> **父文档**: `2026-03-06-core-modules-design.md`（三大核心功能模块设计）
> **本文档**: 各子系统的详细设计规格，按主题归档
> **维护规则**: 每个章节标注实现状态（✅ 已实现 / ⚠️ 部分实现 / 🔲 待实现），随开发推进更新

---

## 附录 A：特权 NFT 体系与 BadgeWall

> 原始文档: `2026-03-06-privilege-nft-design.md` · 状态: ✅ 全部实现

### A.1 五大特权 NFT 定义

**合约**: ERC-1155 (Manifold) · Sepolia ETH · `0x46486Aa0aCC327Ac55b6402AdF4A31598987C400`

| Token ID | 英文名 | 中文名 | 特权 | 门控位置 |
|----------|--------|--------|------|----------|
| #1 | Pioneer Memorial | 拓世者纪念章 | VCP 获取速度 ×1.05 | AI Oracle 结算时应用 |
| #2 | Lantern Keeper's Withered Lamp | 提灯人枯盏 | DAO 投票权重 ×1.1 | SparkGovernor 投票权重计算 |
| #3 | The First Flame | 初火 | Admin 面板准入 + 无需联署直接推进提案 | `/admin` 路由 + 星火广场 |
| #4 | Hand of Justice | 公义之手 | 仲裁庭准入（查看案卷 + 投票裁决） | `/council/arbitration` 路由 |
| #5 | Beacon of the Forerunner | 先驱者灯塔 | 公告板自由发帖权 | Pioneer Post 发布入口 |

### A.2 特权详细说明

**#1 拓世者纪念章** — 创世 100 名 Pioneer 的专属勋章，通过邀请码 `SG-XXXXXX` 领取。AI Oracle 计算 VCP 时检查持有状态，若持有则 `vcpAmount × 1.05`。纯被动加成，无功能门控。

**#2 提灯人枯盏** — 社区守护者身份标识。SparkGovernor 计票时 `votingWeight = vcpBalance × 1.1`（仅对持有者）。与仲裁庭无关。

**#3 初火** — 核心贡献者标识，数量极少。Admin 面板准入凭证。在星火广场可绕过联署门槛，直接将提案推入链上投票。

**#4 公义之手** — 公会资深老兵专属。持有者可进入仲裁庭查看争议案卷并投票，多数票决定裁决结果。

**#5 先驱者灯塔** — 控制星火广场内容质量。仅持有者可发布公告，普通 VCP 持有者只能查看和联署。

### A.3 门控 Hook 使用规范

| 场景 | Hook | Token |
|------|------|-------|
| Admin 面板准入 | `useNFTGate(3)` | #3 |
| 仲裁庭准入 | `useNFTGate(4)` | #4 |
| 公告板发帖权 | `useNFTGate(5)` / `usePioneerGate` | #5 |
| DAO 投票权重 | `usePrivilegeNFTs().hasLantern` | #2 |
| VCP 速度加成 | `usePrivilegeNFTs().hasPioneer` | #1 |
| 批量查询 | `usePrivilegeNFTs()` | 全部 5 个 |

### A.4 BadgeWall 架构

- **展示规则**: 只展示已持有的 NFT，未持有的完全隐藏
- **配置驱动**: 徽章定义集中在 `nft-config.ts`，新增 NFT 只需添加配置 + GLB 文件
- **渲染流程**: `nft-config.tokens` → `balanceOfBatch` 链上查询 → 过滤 `balance > 0` → 按 Token ID 排列 → R3F Canvas 渲染 GLB 模型
- **GLB 模型**: 已迁移至 Supabase Storage CDN，通过 `computeNormalizedScale` 自动归一化尺寸

---

## 附录 B：柴薪王座（Cinder Throne）

> 原始文档: `2026-03-07-cinder-throne-design.md` · 状态: ✅ 视觉实现完成，AI 功能待接入

### B.1 定位

`/council/ai` 页面。面向公会资深成员的 3D 观察空间，非管理工具。13 块旋转石碑代表长老，中心正二十面体是 Rhythm AI 的视觉锚点。

**当前阶段仅实现视觉层，AI 交互属于 Phase 11 后续工作。**

### B.2 视觉规格

| 元素 | 规格 |
|------|------|
| 背景 | 白色 `#ffffff`，无暗色容器 |
| Canvas | 嵌入页面，高度 `70vh` |
| 相机 | `position=[0, 6, 20]`, `FOV=50` |
| 照明 | 柔和 ambient + directional，黑白对比 |

### B.3 3D 组件

**正二十面体（Rhythm 锚点）**
- `icosahedronGeometry` radius `1.8`, detail `0`
- 材质: 亚光黑 `#111111`, `roughness: 0.3, metalness: 0.6`
- 线框叠加: `#333333`, opacity `0.4`
- 动画: Y 轴 `delta × 0.4` + X 轴漂移 `delta × 0.1`
- Hover 显示 `RHYTHM · CORE` 标签

**石碑（长老）**
- `boxGeometry(1.2, 3.5, 0.08)` — 薄矩形碑
- 材质: `#0a0a0a`, `roughness: 0.5, metalness: 0.3`
- 数量: 固定 13 块，轨道半径 `6`
- 浮动: `sin(time + index × phaseOffset) × 0.25`

### B.4 交互

- Hover 石碑 → 系统暂停旋转 → 石碑 Y 轴翻转 180° 面向相机 → 弹出代号 + VCP + 「与 TA 交流」按钮
- 离开 → 石碑归位 → 系统恢复
- 按钮点击 → 弹窗显示 spinner + 「连接中...」（stub，待 Phase 11 接入真实 agent）

### B.5 数据

当前使用 13 条 mock 数据（代号格式 `ARBITER-∆N`）。未来接入: `profiles WHERE vcp_cache >= totalVCPSupply × 0.01`。

### B.6 待实现（Phase 11+）

- 🔲 长老 persona agent 聊天
- 🔲 Rhythm 聊天界面
- 🔲 真实链上成员数据接入
- 🔲 正二十面体替换为 GLB 模型

---

## 附录 C：VCP 铸造机制（等级制 + 反作弊）

> 原始文档: `2026-03-07-vcp-minting-mechanism-design.md` · 状态: ⚠️ 等级表已实现，反作弊未实现

### C.1 背景

AI Oracle（LLM 动态评估）属于 Phase 11+，MVP 阶段采用**等级制固定产出 + 反作弊机制**作为过渡方案。

### C.2 任务等级与 VCP 产出

发布者创建协作时选择等级（`collaborations.grade` 字段），系统按等级发放固定 VCP。

| 等级 | 最低报酬 (USDC) | VCP 铸造量 | 最低里程碑数 | PoW 要求 |
|------|-----------------|-----------|-------------|---------|
| S | 5,000 | 500 | ≥ 3 | 必须提交凭证 URL |
| A | 2,000 | 300 | ≥ 3 | 必须提交凭证 URL |
| B | 800 | 150 | 不限 | 不限 |
| C | 300 | 80 | 不限 | 不限 |
| D | 100 | 40 | 不限 | 不限 |
| E | 0 | 10 | 不限 | 不限 |

**校验方式**: 前端根据 deposit 金额限制可选等级 → 等级存入 Supabase → bot 读取等级决定铸造量。

**实现状态**: ✅ `grade` 字段已存在于 DB，前端可选。

### C.3 反作弊机制

#### C.3.1 冷却期 ✅

同一 `(publisher, worker)` 地址组合，7 天内只铸造一次 VCP。indexer 铸造前查询 `vcp_settlements` 检查。（DirectPay 事件已实现，MilestoneSettled 因 publisher 不在事件数据中暂跳过）

#### C.3.2 最低里程碑数 🔲

S/A 级任务要求 ≥ 3 个里程碑。前端创建时校验。

#### C.3.3 S/A 级 PoW 强制要求 🔲

S/A 级提交凭证时 `contentHash` 不得为空，前端强制要求至少一条凭证 URL。

#### C.3.4 快速确认检测（刷单检测） 🔲

- 窗口: 某地址最近 10 次协作
- 触发: ≥ 5 次在 `submitProof` 后 2 分钟内被确认
- 惩罚: 发布者 + 承接人双向冻结 30 天内不铸造 VCP
- 解除: 冻结期内完成一笔确认耗时 > 24h 的协作自动解冻

#### C.3.5 月度上限 ✅

单地址每月最多铸造 1,000 VCP。indexer 铸造前查累计量。

### C.4 铸造触发流程

```
MilestoneSettled 事件 → 查幂等 key → 读 grade + publisher
  → 反作弊检查: 冷却期 → 冻结状态 → 月度上限
  → 查等级对应 VCP 量
  → VCP.mint(worker, amount, reason)
  → 写入 vcp_settlements
```

### C.5 所需 DB 变更 🔲

`vcp_settlements` 表需新增:

| 字段 | 类型 | 说明 |
|------|------|------|
| `publisher_address` | text | 冷却期检查用 |
| `grade` | text | S/A/B/C/D/E |
| `confirmed_at` | timestamptz | 确认时间 |
| `submitted_at` | timestamptz | 提交时间 |
| `anti_cheat_passed` | boolean | 是否通过反作弊 |
| `skip_reason` | text | 跳过原因 |

### C.6 远期升级路径（AI Oracle）

等级制产出替换为 `lib/oracle/prompt.ts` 动态公式：
```
VCP = floor(baseScore × complexityScore × qualityScore × efficiencyScore)
```
反作弊机制保留，仅替换铸造量计算逻辑。S/A 级历史协作可回溯审计（已留存 PoW）。

---

## 附录 D：双轨支付模式

> 原始文档: `2026-03-08-dual-payment-mode-design.md` · 状态: ✅ 已实现

### D.1 背景

GuildEscrow 合约未经审计，MVP 阶段通过「自行管理」模式规避锁仓风险，同时保留「公会托管」接口为 V2 升级做准备。

### D.2 两种模式对比

| | 自行管理 (Self-Managed) | 公会托管 (Guild-Managed) |
|--|----------------------|----------------------|
| 资金路径 | 发布者 → DirectPay → 承接人（即收即转） | 发布者 → GuildEscrow 锁仓 → 结算释放 |
| 合约余额 | 永远为 0 | 有余额 |
| VCP 奖励 | **50%** | **100%** |
| 仲裁庭 | ❌ | ✅ Hand of Justice #4 |
| 7 天乐观释放 | ❌ | ✅ |
| 拒付保护 | ❌ 平台不介入 | ✅ 自动释放兜底 |
| MVP 状态 | ✅ 已开放 | 🔒 显示「尚未开放」 |

### D.3 DirectPay 合约

**地址 (Arbitrum Sepolia)**: `0xDc0f7BF5c7C026f8000e00a40d0f93a28c04bf65`

设计原则：~30 行代码，合约余额永远为 0，原子执行，无 owner 权限，无可升级性。

```solidity
function pay(bytes32 collabId, address worker, uint256 amount) external nonReentrant
// safeTransferFrom(msg.sender → worker) + emit Paid(collabId, publisher, worker, amount)
```

安全特性: ReentrancyGuard + SafeERC20 + immutable USDC + custom errors。

### D.4 状态机变更

**自行管理** — 跳过 LOCKED 和 DISPUTED:
```
OPEN → PENDING_APPROVAL → ACTIVE → PENDING → SETTLED
                        → CANCELLED
```

**公会托管** — 完整流程:
```
OPEN → PENDING_APPROVAL → LOCKED → ACTIVE → PENDING → SETTLED / DISPUTED
                                           → CANCELLED
```

### D.5 DB 字段

```sql
collaborations.payment_mode TEXT NOT NULL DEFAULT 'self_managed'
  CHECK (payment_mode IN ('self_managed', 'guild_managed'))
```

### D.6 VCP 索引

VCP Indexer 同时监听两种事件:
- `MilestoneSettled` (GuildEscrow) → 1.0x VCP
- `Paid` (DirectPay) → 0.5x VCP (`Math.floor(usdcAmount × 0.5)`)

### D.7 前端行为

- 创建页: 模式选择卡片，guild_managed 禁用并显示 Coming Soon
- 详情页: self_managed 隐藏 Escrow Monitor，里程碑付款走 DirectPay；guild_managed 走原有 GuildEscrow
- 风险提示: 选择 self_managed 时显示黄色警告（i18n `t.payment.selfManagedWarning`）

### D.8 已知风险（已接受）

1. 承接人无链上保护 — 通过 UI 风险提示和声誉机制约束
2. VCP 低质量滥用 — 50% 乘数降低薅羊毛收益，结合 AI Oracle 进一步过滤
3. 公会托管入口保留但禁用 — 为 V2 平滑升级预留

---

---

## 附录 E：万能中后台三频道重构（2026-03-09）

> 实施日期: 2026-03-09 · 状态: ✅ 全部实现

### E.1 背景

原 `/services` 为单一列表页，无法体现三频道的差异化体验。本次重构将其拆分为 4 个独立路由，每个频道有专属 UI 模式。

### E.2 路由结构

```
/services                   — 入口页（三频道卡片 + 跳转链接）
/services/infrastructure    — 基础设施（useServices(1)，Grid + InfraModal）
/services/core              — 核心服务（useServices(2)，左侧分类导航 + SolutionModal）
/services/consulting        — 专家咨询（useServices(3)，Tab + ExpertModal）
```

### E.3 新增 DB 字段（已 migrate）

```sql
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_usdc NUMERIC;
ALTER TABLE services ADD COLUMN IF NOT EXISTS expert_avatar_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS expert_tags TEXT[];
```

### E.4 共享组件

| 组件 | 路径 | 职责 |
|------|------|------|
| `ServicePageLayout` | `components/services/ServicePageLayout.tsx` | 统一页面框架（WalletGatePage + 背景网格 + PageHeader） |
| `ServiceModal` | `components/services/ServiceModal.tsx` | 通用 Modal（backdrop + motion panel + ESC 关闭） |
| `ServiceModalHeader` | `components/services/ServiceModal.tsx` | Modal 头部（头像 / 图标 + 标题 + 关闭按钮） |

### E.5 频道特性说明

**频道 1 — 基础设施**
- `useServices(1)` 返回扁平列表（无父子层级）
- 显示 `isUnlocked` 激活状态（查 `service_access` 表）
- Modal 有「激活」按钮，MVP 使用 mock tx hash（主网前需替换真实合约调用）
- `price_usdc != null` 判断以正确处理 0 元服务

**频道 2 — 核心服务**
- `useServices(2)` 返回带 `children` 的父子树（父 = 分类，子 = 方案）
- 左侧导航切换分类，右侧 2 列 Grid 展示方案
- SolutionModal 支持 Calendly 链接 + 微信二维码两种联系方式

**频道 3 — 专家咨询**
- `useServices(3)` 返回带 `children` 的父子树（父 = 专业方向，子 = 专家）
- 顶部 Tab 切换方向，3 列 Expert Grid
- 专家卡片展示头像（圆形，默认占位图）+ 标签（最多显示 2 个）
- ExpertModal 展示完整标签列表 + Calendly 预约按钮

### E.6 Admin 变更

Admin `/admin/services` 新增：
- 频道筛选 filter（全部/基础设施/核心服务/专家咨询）
- `parent_id` 下拉（channel=2/3 可选父类别，channel=1 隐藏）
- `price_usdc` 输入（channel=1 专用，用于精确控制激活价格，支持 0）
- `expert_avatar_url` + `expert_tags` 输入（channel=3 专用）
- channel 从 `<input type="number">` 改为 `<select>`（防止非法值）
- 删除逻辑：先 `DELETE WHERE parent_id=id`，再删自身（级联安全）

### E.7 i18n 新增 Keys

两个语言文件均已同步添加：

**`t.services.*`**: `entry_title`, `entry_subtitle`, `entry_infra_title/desc`, `entry_core_title/desc`, `entry_consulting_title/desc`, `enter_channel`, `infra_activated`, `infra_activate`, `infra_approving`, `infra_paying`, `infra_price_label`, `infra_docs`, `core_select_category`, `solutions_count`, `core_contact`, `consulting_book`, `consulting_contact`, `consulting_expertise`, `consulting_no_experts`, `consulting_fee`, `per_session`, `noServices`, `price_negotiable`, `retry`, `view_detail`

**`t.admin.*`**: `channelFilter_all`, `channelFilter_1/2/3`, `parentId`, `parentId_none`, `parentId_placeholder`, `priceUsdc`, `priceUsdc_placeholder`, `expertAvatar`, `expertAvatar_placeholder`, `expertTags`, `expertTags_placeholder`, `childItem`

---

*本文档为 `core-modules-design.md` 的产品设计附录，汇集各子系统详细规格。*
*随开发推进更新各章节实现状态标记。*
