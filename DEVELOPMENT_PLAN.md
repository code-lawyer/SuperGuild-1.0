# Super Guild 开发计划 (v9.0 - 测试网公测预备版)

> **最后更新**: 2026-03-10
> **核心架构**: Arbitrum Sepolia + Next.js 15 + Wagmi v3 + R3F (3D Canvas)
> **合约状态**: VCP (UUPS Proxy) + MedalNFT + GuildEscrow + DirectPay + MockUSDC 已部署 (Arbitrum Sepolia)
> **当前阶段**: Phase 10 ✅ 全部完成 → 测试网公测启动中

---

## 一、项目定位

Super Guild 是一个 **去中心化的超级个体协作与主权系统**。彻底抛弃对 Web2 信任体、中心化管理员及服务器端裁判的依赖。通过 3D 全景数字宇宙映射，并在最核心的任务审核环节中采用"乐观惩罚机制 (Optimistic Penalty)"，打造绝对由社群成员博弈与代码裁决的"赛博避难所"。

**核心断舍离与升级**：

1. **纯净 Web3 登录**：去除一切对等 Web2（Twitter、GitHub、Discord）绑定的代码痕迹，仅凭借加密钱包私钥签名宣誓主权。
2. **完全去中心化的机制转移 - 乐观验证与裁判惩罚**：不再部署运行中心化的服务端裁判逻辑去评估代码并盲发声誉分。系统改为"成员提交记录并自行预发款/分，社区基于高阶 NFT 筹码启动链上仲裁判罪"的高效乐观范式。
3. **AI 作为中枢人格 "Rhythm" 引领交互**：剥离原有的 Eliza 后台业务硬耦合，将前端打造成预留给外部大语言模型（如 OpenAI API 并附带 Function Calling 能力）接入的基座。这个 AI 将以 "Rhythm" 的人格形态诞生，在未来承担**任务意图执行**、**DAO 治理议案代码转化**，并**永驻具备视觉冲击力的柴薪王座**三大核心职责。
4. **沉浸式视觉的加码**：Globe 和 SpaceStation 以及柴薪王座等超维 3D 的完成确立了项目的美学走向。

---

## 二、去中心化架构蓝图

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                     │
│  HUD Console / Spark Square / Services / Collab             │
│  UI: R3F Canvas (Globe, Space Stations, Cinder Throne)       │
│  [AI Avatar Engine (Rhythm) - Driven by external LLM API]    │
├─────────────────────────────────────────────────────────────┤
│                 Web3 Auth & Interfacing                      │
│     Wagmi v3 & RainbowKit (Wallet Verification Only)         │
│     SIWE JWT Auth Layer (wallet-signature → Supabase JWT)    │
├─────────────────────────────────────────────────────────────┤
│                   Supabase (PostgreSQL)                      │
│ Tables: profiles / pioneer_codes / settlements / tasks       │
│ *Role limitation tightened: pure state cache without fiat    │
├─────────────────────────────────────────────────────────────┤
│                 Protocol Layer (Arbitrum)                    │
│   - VCPTokenV2 (UUPS Proxy) & 动态门控系统                    │
│   - GuildEscrow (单一共享合约, 乐观惩罚 + 仲裁)                 │
│   - DirectPay (零余额即转合约, self_managed 模式)              │
│   - VCP Indexer (Supabase Edge Function + Alchemy Webhook)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、已完成阶段 ✅

### Phase 6: 基建与原生代币机制

- [x] **智能合约基底**: VCP (UUPS Proxy) 与 MedalNFT 部署至 Arbitrum Sepolia。

### Phase 7: Pioneer 面板与抗审查公告设计

- [x] **创世发放**: 基于 ECDSA 脱水签名的冷确认（防抢夺机制），用户兑换 `SG-XXXXXX` 即发资产。
- [x] **纯粹 BBS 网络节点化**: 实现 Pioneer Post 系统的组件（未来星火广场雏形）。
- [x] **UI 操作面板**: 包含了对公会任务与内容的展示终端（原中心化 Admin 面板彻底废除，转向完全 DAO 提案面板）。

### Phase 8: 历史债务清理与路线纠偏 💥

- [x] **清算 Web2 模块**: 完全清理了现存项目中的 `api/social` 等任何抓取 GitHub、Twitter、Discord 的代码与 UI。
- [x] **精简 AI 代码与确立 Rhythm 人格基座**: 完全删除 `eliza-add` 库和冗余实现，为即将到来的大语言模型 Function Calling 接口与 "Rhythm" 人格体系腾出极简的技术底层架构。

### Phase 9: 视觉奇观层 (The 3D Space)

- [x] **前端自研的超写实宇宙**: `Globe.tsx`（大区环境自转）与 `SpaceStation.tsx`（中区环境巡航）作为底层。
- [x] **荣誉微观实体渲染**: `BadgeShowcaseModal.tsx` 完成渲染，支持 Hand of Justice / Beacon of the Forerunner GLB 模型。

### Phase 10: 链上乐观惩罚机制 + 全系统闭环 ✅ (2026-03-10 全部完成)

**已部署合约：**
- `GuildEscrow`: `0x8828c3fe2f579a70057714e4034d8c8f91232a60` (Arbitrum Sepolia)
- `DirectPay`: `0xDc0f7BF5c7C026f8000e00a40d0f93a28c04bf65` (Arbitrum Sepolia)
- `MockUSDC`: `0xdd0a2bf984d690c9cdd613603094d7455fc63e06` (Arbitrum Sepolia)

#### 10.1 GuildEscrow 合约与链上闭环
- [x] **GuildEscrow 合约部署**: 单一共享合约，`deposit / submitProof / confirmMilestone / disputeMilestone / autoRelease / resolveDispute / cancel`，支持多里程碑、10% 仲裁罚没国库。
- [x] **前端 useGuildEscrow hook**: 封装所有链上调用，EscrowStep 状态机驱动 UI。
- [x] **协作详情页链上闭环**: 发布者 `approveAndDeposit`，承接人 `submitProofOnChain`，发布者 `confirmMilestone / disputeMilestone`。
- [x] **Hash 提交与 7 天确认机制**: 承接人提交凭证时上链哈希，触发乐观倒计时。

#### 10.2 双轨支付模式
- [x] **DirectPay 合约部署**: 零余额即转合约，~30 行代码，ReentrancyGuard + SafeERC20。
- [x] **self_managed 模式完整实现**: 跳过 LOCKED/DISPUTED，USDC 直付 + Paid 事件 + 50% VCP 乘数。
- [x] **guild_managed 模式已接线**: 前端完整但 MVP 禁用入口（显示 Coming Soon）。

#### 10.3 仲裁庭
- [x] **仲裁庭前端**: `dispute_votes` 表 + `useDisputeVotes` hook + Hand of Justice (#4) NFT 门控。
- [x] **首席仲裁官轮换**: `/api/council/arbitration/chief` 通过 Alchemy NFT API 真实查询链上 Token #4 持有者，每日轮换，10 分钟服务端缓存。
- [x] **投票系统**: 仲裁员可投票，票数记入 DB。

#### 10.4 VCP 铸造与反作弊
- [x] **VCP Indexer (Supabase Edge Function)**: 同时监听 `MilestoneSettled` (100% VCP) 和 `Paid` (50% VCP)。
- [x] **反作弊**: 7 天冷却期（同一 publisher+worker 组合）+ 月度 1000 VCP 上限。
- [x] **幂等性**: `settlement_key` 去重，防止重复铸造。
- [x] **MilestoneSettled publisher 解析**: 通过 Supabase 反查 collaborations 表获取 publisher。

#### 10.5 万能中后台
- [x] **三频道拆分重构**: 基础设施/核心服务/专家咨询独立路由与 UI 模式。
- [x] **真实 USDC 支付**: 基础设施频道从 mock tx hash 升级为 ERC-20 `transfer` 到 SERVICE_TREASURY。
- [x] **Admin CRUD**: 频道筛选、父子层级、条件字段、级联删除。

#### 10.6 安全审计修复（6 项 CRITICAL）
- [x] **C1**: 仲裁庭首席轮换 — 从 hardcoded mock 改为 Alchemy NFT API 真实查询。
- [x] **C2**: 基础设施假交易哈希 — 替换为真实 USDC transfer。
- [x] **C3**: AdminGuard 后门钱包 — 移除 `ADMIN_FALLBACK_WALLET`，纯 NFT 门控。
- [x] **C4**: Header admin 检测 — 从 env-var 白名单迁移到 `useNFTGate` Token #3。
- [x] **C5**: VCP indexer MilestoneSettled 冷却期缺失 — 补充 publisher 反查 + 冷却检查。
- [x] **C6**: Supabase Admin 占位符 — Proxy 延迟初始化，build-time 安全。

#### 10.7 NFT 门控稳定性（测试网公测预备）
- [x] **双源验证架构**: `useNFTGate` + `usePrivilegeNFTs` 主源 wagmi RPC + 后备 `/api/nft/verify` (Alchemy NFT REST API)。
- [x] **激进缓存**: 客户端 staleTime 5 分钟 + 服务端 5 分钟地址级缓存。
- [x] **Fail-closed 安全模型**: 两源都失败时 `hasNFT=false`，永不在错误时放行。

#### 10.8 其他
- [x] **Admin 权限 Token #3 门控**: `AdminGuard.tsx` + `Header.tsx` 统一使用 `useNFTGate`。
- [x] **Supabase RLS 收紧**: 敏感表写入策略已收紧至 service_role。
- [x] **SIWE JWT Auth 层**: `/api/auth/wallet` 钱包签名验证 + Supabase 兼容 JWT 签发。
- [x] **主网迁移 env 化**: `constants/chain-config.ts`，所有 chainId 和合约地址 env 驱动。
- [x] **API 全面 Rate Limiting**: 所有 API 路由使用 `createRateLimiter`。
- [x] **i18n 全面合规**: 所有页面硬编码文字迁移至 `lib/i18n` 双语字典。
- [x] **GLB 模型 CDN 迁移**: 从 `/public/models/` 迁移至 Supabase Storage。

---

## 四、当前状态：测试网公测 🟢

**公测就绪度评估（2026-03-10）：**

| 维度 | 状态 | 说明 |
|------|------|------|
| 核心协作闭环（self_managed） | ✅ 完整 | 创建→申请→审批→凭证→支付→VCP 全链路 |
| NFT 门控 | ✅ 稳定 | 双源验证，测试网 RPC 不稳定已解决 |
| 万能中后台 | ✅ 完整 | 三频道+真实支付 |
| VCP 铸造 | ✅ 完整 | 反作弊+幂等 |
| DAO 治理 | ✅ UI 完整 | 提案/联署/投票可用 |
| 仲裁庭 | ⚠️ UI 演示 | 投票功能可用，链上结算未实现（MVP 不触发） |
| 安全 | ⚠️ 测试网可接受 | Auth 层已有，RLS 部分启用，主网前需加固 |

---

## 五、下一阶段开发计划 🔲

### Phase 11: "柴薪王座"与 Rhythm 全能人格构建 (The Agent Throne)

- [ ] **长老 persona agent 聊天**: 接入 LLM API，石碑点击后进入真实对话。
- [ ] **Rhythm 聊天界面**: 正二十面体锚点 → 打开聊天面板，System Prompt 注入公会上下文。
- [ ] **任务生成意图拦截 (Function Calling)**: 「用户自然语言发单 → Rhythm 填充里程碑参数 → Wagmi 签名上链」。
- [ ] **DAO 议案 → 链上 Calldata 自动生成**: Rhythm 读取提案上下文 → 翻译为 Governor/Timelock 所需 ABI + Calldata → 用户一键提交。
- [ ] **真实链上成员数据接入柴薪王座**: 替换 mock 长老数据，从 `profiles WHERE vcp_cache >= threshold` 读取。

### Phase 11.5: 主网预备（安全加固）

- [ ] **Supabase RLS 全表覆盖**: `collaborations`, `milestones`, `proofs` 等核心表启用写入 RLS。
- [ ] **Supabase Auth 层全面接入**: 前端集成 SIWE 签名登录流程，所有 Supabase 请求携带 JWT。
- [ ] **Faucet 页面隐藏**: `IS_MAINNET` 守卫，主网自动隐藏。
- [ ] **仲裁庭链上结算**: 投票结果触发 GuildEscrow 链上释放/罚没（等 guild_managed 模式启用后实现）。
- [ ] **VCP 反作弊完善**: 刷单检测（快速确认）+ S/A 级 PoW 强制 + 最低里程碑数校验。
- [ ] **合约安全审计**: GuildEscrow + VCPTokenV2，专业审计或同行 review。

### Phase 12: 资产与数据确权的去信任闭环

- [ ] **存储去信任化 (Arweave Bridge)**: 将 `.glb` 模型与勋章素材迁移至 Arweave 网络，使用 KTX2 纹理压缩。
- [ ] **前端读取全节点化 (Ponder Indexing)**: 部署 Ponder 替代直接 RPC 轮询。
- [ ] **MedalNFT Dynamic Traits 接入**: 链上 Dynamic Traits 数据接入 3D 渲染参数。

### Phase 13: 账户与终端极客无感迭代

- [ ] **Paymaster 无感交互**: 探索 ERC-4337 和 Session Keys + Passkey 支持。

### Phase 14: 主网爆破 (Mainnet Blastoff)

- [ ] **基于 Arbitrum One 与完整 DAO 权力的创世合约重启与交接。**
- [ ] 详见 `docs/plans/2026-03-10-mainnet-launch-division.md` 分工表。

---

## 六、文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 核心模块设计 | `docs/plans/2026-03-06-core-modules-design.md` | 三大模块设计定稿 |
| 产品设计附录 | `docs/plans/2026-03-06-core-modules-appendix.md` | 子系统详细规格 (A-E) |
| 深度审计报告 | `docs/plans/2026-03-10-deep-audit-report.md` | 42 项审计发现 (6C/12H/11M/8L/5R) |
| 主网分工表 | `docs/plans/2026-03-10-mainnet-launch-division.md` | 人工 vs Claude 分工清单 |
| 测试网测试方案 | `docs/plans/2026-03-09-testnet-test-plan.md` | 公测用例与 Bug 模板 |
| 三频道重构设计 | `docs/plans/2026-03-09-services-redesign.md` | 万能中后台拆分方案 |
| 代码审计报告 | `docs/plans/2026-03-08-code-audit-report.md` | 首次审计 29 项修复 |
