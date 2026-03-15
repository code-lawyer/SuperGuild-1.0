# SuperGuild — 产品功能概览

> **定位**：面向 AI 时代超级个体的去中心化协作协议与基础设施。通过智能合约和 NFT 取代中心化管理员，实现无需许可的 P2P 协作、链上声誉铸造和 DAO 自治。
>
> **当前状态**：测试网公测中（Arbitrum Sepolia + Sepolia ETH）

---

## 目录

1. [首页（Landing Page）](#1-首页)
2. [星火广场（Bulletin）](#2-星火广场bulletin)
3. [万能中后台（Services）](#3-万能中后台services)
4. [冒险大厅（Collaborations）](#4-冒险大厅collaborations)
5. [灯塔议会（Council）](#5-灯塔议会council)
6. [个人档案（Profile）](#6-个人档案profile)
7. [管理面板（Admin）](#7-管理面板admin)
8. [通知系统](#8-通知系统)
9. [NFT 特权体系](#9-nft-特权体系)
10. [VCP 声誉系统](#10-vcp-声誉系统)

---

## 1. 首页

**路径**：`/`

**功能**：品牌落地页，引导用户进入协作大厅。

**内容区块**：
- **Hero**：打字机动效标题 + 粒子/3D 地球背景 + 空间站装饰，CTA 按钮「开始冒险」（已连接钱包直跳协作大厅，未连接则触发钱包弹窗）
- **核心价值**：滚动触发的文字渐显动效，逐段阐述四大支柱（P2P 协作、零费率、乐观惩罚机制、链上声誉）
- **Footer**：版权信息 + 文档链接

**入口要求**：无需连接钱包

---

## 2. 星火广场（Bulletin）

**导航标签**：Bulletin

### 2.1 公告板 `/bulletin`

**功能**：平台官方公告发布与展示，类似 Discord 公告频道的链上版本。

**用户操作**：
- 浏览所有公告（支持置顶）
- 查看公告详情（含附件、完整正文）
- **需连接钱包**才能查看受限内容

**公告分类**：由管理员在后台设置（category 字段）

### 2.2 先驱者计划 `/bulletin/pioneer`

**功能**：初代成员专属空间，先驱者可发布帖子，记录社区建立过程的历史。

**门控规则**：
- **查看**：所有人可见
- **发帖**：持有 Token #5「Beacon of the Forerunner」NFT 的先驱者，或通过有效邀请码加入的成员
- 发帖需 EIP-191 签名验证身份

**展示**：瀑布流卡片，显示作者地址、时间、内容摘要

---

## 3. 万能中后台（Services）

**导航标签**：Autonomous Office（自治办公室）

**概念**：货架化服务商城，提供法律/财税/IP/跨境/技术等稳定币计费服务，用 USDC 支付。

### 频道入口 `/services`

三个频道卡片入口，视觉区分明显：

### 3.1 基础设施频道 `/services/infrastructure`

**定位**：标准化工具与基础服务（类似 AWS Marketplace）

**交互**：
- 网格卡片展示服务列表（价格 + 描述）
- 点击卡片弹出详情 Modal
- **购买**：钱包签名确认 → USDC 转账至服务金库 → 记录解锁状态

### 3.2 核心服务频道 `/services/core`

**定位**：中等复杂度的专业服务包

**交互**：
- 左侧分类导航 + 右侧两列卡片
- 弹出详情后可购买（同上支付流程）

### 3.3 专家咨询频道 `/services/consulting`

**定位**：一对一专家顾问匹配

**交互**：
- Tab 切换专家分类
- 专家卡片显示头像、标签、简介
- 联系专家（弹出联系方式 Modal）

**支付流程**（三频道通用）：
```
用户点击购买 → USDC approve → transferFrom → service_access 表写入解锁记录
```

---

## 4. 冒险大厅（Collaborations）

**导航标签**：Adventurer Hall（冒险者大厅）

**概念**：零费率 P2P 协作市场。发布者发单、接单者申请，资金链上托管（GuildEscrow）或直接 P2P 转账（DirectPay）。

### 4.1 任务大厅 `/collaborations`

**功能**：浏览所有公开任务（OPEN 状态，不显示已取消）

**筛选条件**：
- 任务等级：S / A / B / C / D / E
- 预算范围：低（<100 USDC）/ 中（100–500）/ 高（>500）
- 状态：全部 / 开放 / 进行中 / 待审核

**卡片信息**：任务标题、描述摘要、等级、预算、截止日期、当前状态

### 4.2 发布任务 `/collaborations/create`

**需要**：连接钱包

**填写内容**：
- 基本信息：标题、描述、等级、预算（USDC）
- 里程碑设置：可添加多个里程碑，设置各自百分比
- 支付模式选择：
  - `self_managed`（DirectPay）：无托管，P2P 直转，0.5x VCP 倍率
  - `guild_managed`（GuildEscrow）：合约托管，里程碑自动释放，1x VCP 倍率（MVP 阶段仅开放 self_managed）

### 4.3 任务详情 `/collaborations/[id]`

**发布者视角**：
- 查看所有申请者列表
- 批准/拒绝申请（OPEN → PENDING_APPROVAL → LOCKED → ACTIVE）
- 确认里程碑完成（触发 USDC 释放）
- 发起争议（Dispute，进入仲裁流程）

**接单者视角**：
- 提交申请（附自我介绍）
- 上传凭证（Proof of Work）：文字描述 + GitHub 链接等
- 查看里程碑状态

**协作状态机**：
```
OPEN → PENDING_APPROVAL → LOCKED → ACTIVE → PENDING → SETTLED
                                                      → DISPUTED
                                         → CANCELLED
```

### 4.4 任务管理 `/collaborations/manage`

**功能**：管理自己发布或参与的所有任务

**视图切换**：
- 「我发布的」：可操作状态推进
- 「我参与的」：查看进度、提交凭证

---

## 5. 灯塔议会（Council）

**导航标签**：Lantern Council（灯塔议会）

**概念**：链上 DAO 治理系统，基于 SparkGovernor 合约 + NFT 门控。

### 5.1 议案广场 `/council/proposals`

**功能**：提交和投票 DAO 议案

**发起议案**：
- 需要持有一定数量 VCP 代币（门槛由链上 Governor 合约设定）
- 填写标题、内容、链上 Calldata（可选）
- 联署机制：议案发起后需收集足够联署才可进入投票

**投票**：
- 投票权重 = VCP 持有量
- 支持 / 反对 / 弃权
- 投票期结束后链上结算

**统计**：显示活跃议案数、总票数、历史通过率

### 5.2 仲裁庭 `/council/arbitration`

**功能**：协作争议的链上仲裁

**门控**：持有 Token #4「Hand of Justice」NFT

**流程**：
- 展示当前所有 DISPUTED 状态协作
- 仲裁员查看双方凭证
- 投票裁决（支持发布者 / 支持接单者）
- 投票写入 DB，待链上结算（主网前完成）

**惩罚机制**（合约设计）：
- 违约方 10% 保证金罚没入国库
- Hand of Justice 多签裁决

### 5.3 AI 顾问 `/council/ai`

**功能**：AI Oracle 聊天界面（Phase 11 预留，当前为入口页）

**规划**：Rhythm AI 人格 agent，支持自然语言发单、议案生成

### 5.4 议事录 `/council/records`

**功能**：已结束议案的历史记录存档，链上事件日志

---

## 6. 个人档案（Profile）

**路径**：`/profile`（自己）| `/profile?address=0x...`（他人）

**需要**：连接钱包

### 布局

左右两栏设计：

**左栏（身份锚）**：
- 头像（可上传替换，存储于 Supabase Storage）
- 用户名
- 个人简介
- 钱包地址（可点击复制）
- 作品集链接
- 加入时间 + 所在链

**右栏（内容深度）**：
- VCP 信誉分 + 已完成数 + 进行中数（横排精密进度条）
- 近期协作贡献列表（含状态指示点）
- 特权 NFT 勋章墙（可点击进入 3D 展示 Modal）
- 先驱者卡片

### 编辑个人资料

点击「Edit Profile」打开 Modal：
- 修改用户名、简介、作品集链接
- 更新联系方式（Email / Telegram，服务器端 AES-256-GCM 加密存储）
- 保存需持有有效 JWT（钱包签名登录后自动获取）

### 3D 勋章展示

持有特权 NFT 后，勋章墙展示对应徽章。点击徽章进入三维旋转展示（React Three Fiber 渲染 GLB 模型）。

---

## 7. 管理面板（Admin）

**路径**：`/admin`

**门控**：持有 Token #3「The First Flame」NFT，或特定管理员钱包地址

### 7.1 仪表盘 `/admin`

平台数据概览：用户数、协作总量、近期活动

### 7.2 公告管理 `/admin/bulletins`

- 创建/编辑/删除公告
- 支持 Markdown 富文本、附件上传
- 设置置顶、分类、发布状态
- 所有操作需 EIP-191 钱包签名验证

### 7.3 服务计划管理 `/admin/services`

- 三频道服务的增删改
- 设置服务名称、描述、价格（USDC）、频道归属、父级分类
- 专家频道额外字段：头像 URL、专家标签
- 级联删除（删父级同时删子项）

### 7.4 先驱者管理 `/admin/pioneer`

- 生成/吊销先驱者邀请码
- 邀请码通过 ECDSA 签名校验，防伪造
- 查看已使用邀请码列表

### 7.5 VCP 排行榜 `/admin/leaderboard`

- 全平台 VCP 持有量排名
- 显示地址、用户名、VCP 数值

### 7.6 勋章介绍编辑 `/admin/badges`

- 为 5 枚特权 NFT 编写中英文描述
- 内容显示在用户档案的勋章墙
- 所有写入通过 API 路由走 `supabaseAdmin`（绕过 RLS）

### 7.7 测试水龙头 `/admin/faucet`

- 向指定地址 mint MockUSDC（测试网专用）
- **主网上线前必须移除或加 IS_MAINNET 守卫**

---

## 8. 通知系统

**触发入口**：Header 右侧铃铛图标（已连接钱包时显示，未读数红点）

**打开方式**：点击铃铛 → 右侧滑出抽屉（NotificationDrawer）

**通知类型**：
- 协作相关：有人申请你的任务、申请被批准/拒绝、里程碑确认、争议发起
- 治理相关：议案进入投票、投票结果
- 系统：公告发布

**操作**：标记已读（单条 / 全部）

---

## 9. NFT 特权体系

**合约**：Privilege NFT ERC-1155（Sepolia ETH）
`0x46486Aa0aCC327Ac55b6402AdF4A31598987C400`

| Token ID | 名称 | 功能 |
|----------|------|------|
| #1 | Pioneer Memorial | 创始成员纪念徽章 |
| #2 | Lantern Keeper's Withered Lamp | 社区守护者标识 |
| #3 | The First Flame | 管理员面板准入 |
| #4 | Hand of Justice | 仲裁庭投票权 |
| #5 | Beacon of the Forerunner | 先驱者发帖权限 |

**双源验证架构**：
- 主源：wagmi RPC（`balanceOf`，staleTime 5min）
- 备源：`/api/nft/verify`（Alchemy NFT REST API，不同基础设施）
- Fail-closed：两源均失败 → `hasNFT = false`，永不在错误时放行

**跨链查询**：Privilege NFT 在 Sepolia ETH，用户无需手动切链，wagmi 通过 `chainId` 参数强制读取。

---

## 10. VCP 声誉系统

**VCP（Value Contribution Points）**：平台原生声誉代币，链上铸造，不可转让。

**合约**：VCPTokenV2（Arbitrum Sepolia）
`0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C`

### 获取方式

| 途径 | 倍率 | 说明 |
|------|------|------|
| 完成 guild_managed 协作 | 1.0x | 合约托管模式，AI Oracle 评分后 mint |
| 完成 self_managed 协作 | 0.5x | P2P 模式，平台人工核验（测试网） |
| 治理参与 | TBD | 投票、联署等 |

### AI Oracle 评分流程（guild_managed）

```
所有里程碑 SETTLED
  → 热钱包监听合约事件
  → 抓取凭证 PoW（GitHub PR/Commit/Repo + Jina Reader）
  → LLM 打分：VCP = floor(baseScore × complexityScore × qualityScore × efficiencyScore)
  → 热钱包调用 VCPTokenV2.mint(to, amount, reason)
  → vcp_settlements 表幂等锁防重复 mint
```

### 用途

- **DAO 投票权重**：持有 VCP 越多，议案投票权越重
- **议案发起门槛**：需持有一定数量 VCP 才能在 Spark Plaza 发起议案
- **个人档案展示**：VCP 分数显示为社区可见的链上声誉证明

---

## 附：技术架构快览

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 App Router + React 19 + Tailwind CSS v4 |
| Web3 | Wagmi v3 + Viem + RainbowKit |
| 数据库 | Supabase（PostgreSQL + Storage + Realtime + RLS） |
| 状态管理 | TanStack Query v5 |
| 3D | React Three Fiber + Three.js |
| 动效 | Framer Motion |
| 链 | Arbitrum Sepolia（主合约）+ Sepolia ETH（特权 NFT）|
| 身份验证 | EIP-191 钱包签名 + JWT，服务端 `verify-jwt.ts` 校验 |
| PII 加密 | AES-256-GCM（contact_email / contact_telegram 字段）|

---

*文档更新日期：2026-03-15 · Phase 10 ✅ 完成，Phase 11.5 Tier 1+2 ✅ 完成，测试网公测中*
