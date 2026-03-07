# Super Guild 开发计划 (v8.0 - 链上结算闭环版)

> **最后更新**: 2026-03-06
> **核心架构**: Arbitrum Sepolia + Next.js 15 + Wagmi v3 + R3F (3D Canvas)
> **合约状态**: VCP (UUPS Proxy) + MedalNFT + GuildEscrow 已部署 (Arbitrum Sepolia)

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
├─────────────────────────────────────────────────────────────┤
│                   Supabase (PostgreSQL)                      │
│ Tables: profiles / pioneer_codes / settlements / tasks       │
│ *Role limitation tightened: pure state cache without fiat    │
├─────────────────────────────────────────────────────────────┤
│                 Protocol Layer (Arbitrum)                    │
│   - VCPTokenV2 (UUPS Proxy) & 动态门控系统                    │
│   - GuildEscrow (单一共享合约, 乐观惩罚 + 仲裁)                 │
│   - Resolver Bot (autoRelease / resolveDispute / VCP mint)   │
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

### Phase 10: 链上乐观惩罚机制落地 ✅ (2026-03-06 完成)

**已部署合约：**
- `GuildEscrow`: `0x8828c3fe2f579a70057714e4034d8c8f91232a60` (Arbitrum Sepolia)

- [x] **GuildEscrow 合约部署**: 单一共享合约，`deposit / submitProof / confirmMilestone / disputeMilestone / autoRelease / resolveDispute / cancel`，支持多里程碑、10% 仲裁罚没国库。
- [x] **前端 useGuildEscrow hook**: 封装所有链上调用，EscrowStep 状态机驱动 UI（approving → depositing → submitting → confirming → disputing → done/error）。
- [x] **协作详情页链上闭环**: 发布者 `approveAndDeposit`，承接人 `submitProofOnChain`，发布者 `confirmMilestone / disputeMilestone`，悬浮 Escrow 状态横幅实时反馈。
- [x] **Hash 提交与 7 天确认机制**: 承接人提交凭证时上链哈希，触发乐观倒计时；发布人主动确认或超时 autoRelease 均自动释放 USDC。
- [x] **状态机修复**: LOCKED → ACTIVE 在首次提交凭证时自动流转。
- [x] **仲裁扣点与"公义之手"治理门控**: 发布人触发争议时链上罚没 10% 入国库；案件推送至 `/council/arbitration`，仅 Hand of Justice NFT (#4) 持有者可投票，票数达阈值后 Resolver Bot 自动执行 `resolveDispute()`。
- [x] **仲裁庭前端**: `dispute_votes` 表 + `useDisputeVotes` hook + 真实链上争议数据，替换全部 mock 数据。
- [x] **Resolver Bot** (`scripts/resolver-bot.ts`): 三合一后端守护进程——autoRelease 超时释放 / resolveDispute 仲裁执行 / VCP mint 监听 MilestoneSettled 事件自动铸造声誉积分，每 60 秒轮询，幂等性由 `vcp_settlements` 表保障。
- [x] **i18n 全面合规**: 协作创建、协作列表、协作详情、仲裁庭页面所有硬编码中英文字符串全部迁移至 `lib/i18n` 双语字典。
- [x] **测试网 USDC 铸造**: `MintTestUSDC` 组件，发布者可一键铸造 10,000 测试 USDC。

---

## 四、下一阶段开发计划 🔲

### Phase 11: "柴薪王座"与 Rhythm 全能人格构建 (The Agent Throne)

- [ ] **王座 3D 锚点**: 在 `/council` 或主场景挂载"柴薪王座 (Cinder Throne)"3D 模型节点，作为 Rhythm AI 人格的视觉载体。
- [ ] **任务生成意图拦截 (Function Calling)**: 前端集成对话面板，配置 System Prompt 与 Function Schema，实现「用户自然语言发单 → Rhythm 填充里程碑参数 → Wagmi 签名上链」的零摩擦流。
- [ ] **DAO 议案 → 链上 Calldata 自动生成**: Rhythm 读取提案上下文 → 翻译为 Governor/Timelock 架构所需的 ABI + Calldata → 用户一键提交上链。

### Phase 11.5: 上线前清理（主网预备）

- [x] **Admin 权限改为 Token #3 (The First Flame) 门控**: `AdminGuard.tsx` 已使用 `useNFTGate` + `PRIVILEGE_NFT.tokens.FIRST_FLAME`，早期已完成。
- [x] **Supabase RLS 补全**: `pioneer_codes / service_access / user_medals / vcp_settlements / milestones` 五张表已启用 RLS 并配置策略。
- [x] **Resolver Bot 生产部署**: Railway 已部署常驻运行，`MINTER_ROLE` 已验证，60s 轮询正常。
- [x] **主网迁移 env 化**: 新增 `constants/chain-config.ts`，所有 chainId 和合约地址 env 驱动，主网迁移只需改 `.env`。
- [ ] **VCP 等级制铸造 + 反作弊机制**: 设计已定稿（见 `docs/plans/2026-03-07-vcp-minting-mechanism-design.md`），待实现：
  - 等级字段加入 `collaborations` 表（S/A/B/C/D/E）
  - 前端创建协作时选择等级（含最低报酬校验、最低里程碑校验、S/A 级 PoW 强制）
  - bot 按等级铸造固定 VCP（500/300/150/80/40/10）
  - 反作弊：7 天冷却期 + 快速确认检测（2min/10次/5触发/双向冻结30天）+ 月度上限 1000 VCP
- [ ] **MedalNFT Dynamic Traits 接入**: 将链上 Dynamic Traits 数据接入 3D 渲染参数，替换当前硬编码 GLB 配置。

### Phase 12: 资产与数据确权的去信任闭环

- [ ] **存储去信任化 (Arweave Bridge)**: 将 `.glb` 模型与勋章素材迁移至 Arweave 网络，使用 KTX2 纹理压缩。
- [ ] **前端读取全节点化 (Ponder Indexing)**: 部署 Ponder 替代直接 RPC 轮询，解决大用户量下的性能瓶颈。

### Phase 13: 账户与终端极客无感迭代

- [ ] **Paymaster 无感交互**: 探索集成 ERC-4337 和 Session Keys，使得高星用户在参与网络验证与巡检时免除 Gas 损耗与断点确认摩擦。

### Phase 14: 主网爆破 (Mainnet Blastoff)

- [ ] **基于 Arbitrum One 与完整 DAO 权力的创世合约重启与交接。**
