# SuperGuild 三大核心功能模块设计文档

> **确认日期**: 2026-03-06
> **状态**: 已与产品负责人逐节确认，设计定稿
> **适用阶段**: Phase 10 起全面落地

---

## 产品架构总览

SuperGuild 的全部核心功能围绕三大模块展开，辅以身份声誉系统作为基础底座：

```
┌──────────────────────────────────────────────────────┐
│              身份与声誉底座                            │
│  钱包地址 = 唯一身份 · VCP = 链上信誉 · NFT = 特权门控  │
├─────────────────┬──────────────────┬─────────────────┤
│  万能中后台      │   任务协作系统    │   DAO 治理系统  │
│  服务货架        │   P2P 协作       │   星火广场       │
│  知识交付        │   链上结算       │   链上治理       │
└─────────────────┴──────────────────┴─────────────────┘
```

---

## 一、万能中后台

> **实现状态**: ✅ 已实现（2026-03-09 完成三频道拆分重构）

### 1.1 定位

为超级个体提供货架化的非创造性后勤服务，稳定币一站式解锁，消除独立运营的隐性壁垒。

### 1.2 三大频道与路由结构

| 频道 | 路由 | 定位 | 展示模式 |
|------|------|------|---------|
| **基础设施** | `/services/infrastructure` | 超级个体数字基座 | 3 列 Grid + 详情 Modal |
| **核心服务** | `/services/core` | 专项业务解决方案（多分类） | 左侧分类导航 + 2 列 Grid + 详情 Modal |
| **专家咨询** | `/services/consulting` | 一对一专家资源对接 | 分类 Tab + 3 列 Expert Grid + 专家 Modal |

**服务入口页**: `/services` — 三频道卡片入口，引导进入对应子页面

**核心服务频道示例：** 法律合规、财税统筹、IP 防御、跨境贸易、自媒体运维

### 1.3 页面交互模式

所有服务详情均通过 **Modal 弹层** 展示，不跳转新页面：

```
基础设施卡片点击 → InfraModal（描述 + 文档列表 + 价格 + 激活按钮）
核心服务方案点击 → SolutionModal（描述 + 文档列表 + 价格 + Calendly/联系方式）
专家卡片点击 → ExpertModal（头像 + 标签 + 描述 + 费用 + Calendly 预约）
```

共享组件：`components/services/ServiceModal.tsx`（backdrop + motion panel + ESC 关闭）、`ServiceModalHeader`

### 1.4 支付解锁机制

**基础设施频道**：USDC 链上激活，写入 `service_access` 表，当前 MVP 阶段使用模拟交易哈希（上主网前需替换为真实合约调用）。

**核心服务 / 专家咨询**：通过 `payload_config.url` 配置外链（Calendly 预约 / 微信二维码 / 其他联系方式），无链上操作。

### 1.5 数据结构

**DB 表：`services`**（`channel` 字段区分频道，`parent_id` 支持父子层级）

```sql
services
  id          UUID PK
  channel     INT (1=基础设施, 2=核心服务, 3=专家咨询)
  parent_id   UUID NULL FK→services(id)  -- 子项引用父类别
  title       TEXT
  description TEXT
  icon        TEXT  -- Material Symbols 图标名
  price       NUMERIC  -- USDC 价格（channel=1 激活价）
  price_usdc  NUMERIC NULL  -- channel=1 专用，覆盖 price（支持 0）
  expert_avatar_url TEXT NULL  -- channel=3 专家头像
  expert_tags TEXT[] NULL  -- channel=3 技能标签数组
  payload_config JSONB  -- 联系/预约配置
  is_active   BOOL DEFAULT true
```

`services.payload_config`（JSONB）结构：

```jsonc
// 基础设施/核心服务：文档附件列表
{
  "type": "document" | "calendly" | "qr_contact",
  "url": "https://...",               // Calendly 链接或二维码图片 URL
  "documents": [                      // 附件列表
    { "name": "文件名", "url": "...", "size": "4.8MB" }
  ]
}

// 专家咨询：联系/预约
{
  "type": "calendly" | "contact",
  "url": "https://calendly.com/..."   // Calendly 直接预约链接
}
```

### 1.6 Admin 管理

Admin 面板（`/admin/services`）提供完整 CRUD：
- **频道筛选**：全部 / 基础设施 / 核心服务 / 专家咨询 四个 filter 按钮
- **父子层级**：channel=2/3 可选 parent_id 将服务归入父类别
- **条件字段**：channel=1 显示 price_usdc；channel=3 显示 expert_avatar_url + expert_tags
- **级联删除**：删除父类别时先删所有子项，再删父记录
- **频道输入**：`<select>` 下拉，避免非法值

**Admin 准入：** Token #3（The First Flame）NFT 门控

---

## 二、任务协作系统

### 2.1 定位

去中心化的 P2P 协作协议。资金由 GuildEscrow 智能合约全程托管，乐观惩罚机制保障双方权益，AI Oracle 客观铸造 VCP 声誉。

### 2.2 完整状态机

```
OPEN
  ↓ 承接人申请
PENDING_APPROVAL
  ↓ 发布者同意
LOCKED
  ↓ 执行中
ACTIVE
  ↓ 凭证提交
PENDING
  ├──→ 发布者确认 / 7天超时      → SETTLED ──→ AI Oracle mint VCP
  └──→ 发布者申请仲裁            → DISPUTED
                                     ↓ Hand of Justice 投票
                                   SETTLED（含惩罚执行）
任意阶段 ──→ CANCELLED（含诚意金逻辑）
```

### 2.3 预算与改价机制

| 任务阶段 | 发布者改价权限 | 规则 |
|----------|--------------|------|
| `OPEN` | 自由修改 | 无限制 |
| `LOCKED` 后 | 需承接人链上签名同意 | 双方共识才生效 |
| 承接人拒绝改价 | 发布者可强制下架 | **扣除 10% 预算作诚意金转给承接人，90% 退还发布者** |

### 2.4 里程碑结构

发布者创建任务时定义里程碑，每个里程碑包含：

| 字段 | 类型 | 是否必填 |
|------|------|----------|
| 标题 | String | 是 |
| 金额占比 | Int (0-100) | 是，总和必须等于 100 |
| 交付物类型 | Enum（代码 / 文档 / 设计稿 / 其他） | 否 |
| 验收标准描述 | Text | 否 |
| 参考链接 | Array\<URL\> | 否 |

> **原则：** 结构化字段为引导工具，非强制约束。发布者主动确认即视为里程碑完成，无需格式验证。

### 2.5 凭证提交

单个里程碑支持复合凭证提交：

- **外部链接**（多条）：GitHub PR、Commit、网页、文档 URL 等
- **上传文件**（多个）：图片、PDF、压缩包等，存储于 Supabase Storage

提交后：
1. 所有凭证的复合 Hash 签名上链（`GuildEscrow.submitProof()`）
2. 触发 7 天乐观倒计时（链上区块时间戳）
3. `proofs` 表写入记录（**禁止 DELETE / UPDATE，只能新增**）

### 2.6 结算分支（链上自动执行）

```
承接人调用 submitProof() 上链
         ↓
    7 天倒计时开始
         ↓
  ┌──────┴──────┐
  │             │
发布者确认    7天无操作
confirmMilestone()  autoRelease()
  │             │
  └──────┬──────┘
         ↓
   USDC 自动释放至承接人
         ↓
   所有里程碑 SETTLED？
    是 → AI Oracle 触发 → mint VCP
    否 → 继续下一个里程碑

发布者申请仲裁 disputeMilestone()
   → 10% 报酬强制划入国库（沉没成本）
   → Hand of Justice NFT (#4) 持有者进入仲裁庭投票
   → 多数票裁决：败诉方没收全部报酬 + 可能进黑名单
```

> **设计原则：** 只有发布者可以触发争议。承接人受乐观自动释放机制保护，无需额外仲裁救济。

### 2.7 VCP 铸造机制

所有里程碑 SETTLED 后触发。分两个阶段：

#### MVP 阶段（当前）— 等级制固定产出

发布者创建任务时选择等级，按等级铸造固定 VCP：

| 等级 | 最低报酬 | VCP 产出 | 最低里程碑 | PoW 要求 |
|------|---------|---------|-----------|---------|
| S | 5,000 USDC | 500 | ≥ 3 | 必须提交凭证 URL |
| A | 2,000 USDC | 300 | ≥ 3 | 必须提交凭证 URL |
| B | 800 USDC | 150 | 不限 | 不限 |
| C | 300 USDC | 80 | 不限 | 不限 |
| D | 100 USDC | 40 | 不限 | 不限 |
| E | 0 USDC | 10 | 不限 | 不限 |

**反作弊机制（详见 `docs/plans/2026-03-07-vcp-minting-mechanism-design.md`）：**
- 冷却期：同一发布者+承接人组合 7 天内只铸造一次
- 快速确认检测：最近 10 次中 ≥ 5 次在 2 分钟内确认 → 双向冻结 30 天
- 月度上限：单地址每月最多铸造 1,000 VCP

#### 远期（AI Oracle 上线后）— 动态评估产出

```
VCP = floor(baseScore × complexityScore × qualityScore × efficiencyScore)
```

| 维度 | 范围 | 说明 |
|------|------|------|
| baseScore | `min(100, max(5, ln(budget) × 5))` | 由任务预算决定 |
| complexityScore | 0.5 – 2.0 | 机械复制 → 前沿研究 |
| qualityScore | 0.8 – 1.2 | 勉强达标 → 超预期 |
| efficiencyScore | 0.8 – 1.2 | 严重拖延 → 极高效 |

PoW 抓取策略：GitHub PR/Commit/Repo → Jina Reader → 原始文本兜底

---

## 三、DAO 治理系统

### 3.1 定位

完全去中心化的协议自治体系。VCP 持有者通过星火广场孵化提案，达到联署门槛后由 Rhythm AI 转码上链，经投票和 Timelock 后自动执行。

### 3.2 星火广场（Spark Square）— 提案孵化

**职责：** 提案发布 + 社区联署（无讨论功能）

**权限：** 任何 VCP 持有者均可发布提案（零门槛）

**联署门槛：** 已铸造 VCP 的持有钱包总数 × 1%（动态门槛，随社区成长而提升）

```
示例：当前 200 个钱包持有 VCP → 门槛 = 2 个钱包联署
      未来 1000 个钱包持有 VCP → 门槛 = 10 个钱包联署
```

> 门槛设计保证早期社区灵活，成长后治理趋于严肃。

### 3.3 完整治理生命周期

```
① 发布提案（星火广场）
   任意 VCP 持有者，填写标题 + 内容 + 预期执行效果
         ↓
② 联署阶段
   其他 VCP 持有者联署，达到「持钱包总数 1%」门槛
         ↓
③ Rhythm AI 转码
   读取提案上下文 → 生成结构化 Calldata
   （修改协议参数 / 国库拨款 / 其他链上操作）
         ↓
④ 链上投票
   任意 VCP 持有者投票
   票重 = VCP 余额 + 特权 NFT 加成
   投票期结束，统计赞成 / 反对
         ↓
⑤ Timelock 延迟
   给社区紧急干预窗口（可否决异常提案）
         ↓
⑥ 自动执行
   SparkGovernor 合约执行 Calldata
```

### 3.4 投票权重

```
投票权重 = VCP 余额（基础票重）+ NFT 加成
```

NFT 加成规则（待 DAO 治理确定具体数值，以下为建议初始值）：

| NFT | Token ID | 建议加成 |
|-----|----------|----------|
| The First Flame | #3 | +500 VCP 等值票重 |
| Hand of Justice | #4 | +300 VCP 等值票重 |
| Pioneer Memorial | #1 | +200 VCP 等值票重 |

### 3.5 治理范围

DAO 提案可以决定：
- **协议参数**：仲裁罚款比例、VCP 算法权重、联署门槛比例、Timelock 时长等
- **国库资金**：拨款给开发、运营、生态建设等用途
- **任何可编码的链上操作**：只要 Rhythm AI 能将其转化为合法 Calldata

---

## 四、跨模块连接关系

```
万能中后台  ──────────────────────────────────────────┐
  USDC 服务购买收入流入协议国库                         │
                                                      ↓
任务协作系统 ─── GuildEscrow 仲裁罚款 (10%) ──→  协议国库
  所有里程碑 SETTLED ──→ AI Oracle ──→ mint VCP       │
                                         ↓            │
                                    VCP 积累           │
                                         ↓            ↓
                              DAO 治理投票权重    国库资金
                                         ↓
                                    星火广场提案
                                         ↓
                              联署 → Rhythm 转码 → 链上执行
                              （可修改上述所有协议参数）
```

---

## 五、身份与声誉底座（贯穿三大模块）

| 资产 | 标准 | 职责 |
|------|------|------|
| VCP 信誉积分 | 改良 ERC-20（不可转让） | DAO 投票权重、星火广场提案权、服务门控（未来） |
| 特权 NFT | ERC-1155（Manifold，Sepolia） | 功能门控（Admin、仲裁庭、Pioneer） |
| 勋章 NFT | ERC-721 + ERC-7496（Arbitrum） | 3D 可进化声誉展示，Dynamic Traits 驱动 |

**特权 NFT 门控映射：**

| Token | 功能 |
|-------|------|
| #1 Pioneer Memorial | 创始成员标识 |
| #2 Lantern Keeper's Withered Lamp | 社区守护者标识 |
| #3 The First Flame | Admin 面板准入 |
| #4 Hand of Justice | 仲裁庭投票准入 |
| #5 Beacon of the Forerunner | Pioneer 功能门控 |

---

*本文档为 SuperGuild 核心功能模块的设计定稿，所有内容已与产品负责人逐节确认。*
*开发实现请以本文档为准，如有调整需同步更新此文件。*

---

## 附录索引

各子系统的详细设计规格见 **[产品设计附录](./2026-03-06-core-modules-appendix.md)**：

| 附录 | 主题 | 实现状态 |
|------|------|----------|
| A | 特权 NFT 体系与 BadgeWall | ✅ 已实现 |
| B | 柴薪王座（Cinder Throne） | ✅ 视觉完成，AI 待接入 |
| C | VCP 铸造机制（等级制 + 反作弊） | ⚠️ 等级表+冷却期+月度上限已实现，刷单检测/PoW 强制待做 |
| D | 双轨支付模式 | ✅ 已实现 |
| E | 万能中后台三频道重构 | ✅ 已实现（2026-03-09） |
