# Super Guild 开发计划 (v7.0 - 纯粹的链上主权版)

> **最后更新**: 2026-03-05
> **核心架构**: Arbitrum Sepolia + Next.js 15 + Wagmi v3 + R3F (3D Canvas)
> **合约状态**: VCP (UUPS Proxy) + MedalNFT 已部署 (Arbitrum Sepolia)

---

## 一、项目定位

Super Guild 是一个 **去中心化的超级个体协作与主权系统**。彻底抛弃对 Web2 信任体、中心化管理员及服务器端裁判的依赖。通过 3D 全景数字宇宙映射，并在最核心的任务审核环节中采用“乐观惩罚机制 (Optimistic Penalty)”，打造绝对由社群成员博弈与代码裁决的“赛博避难所”。

**核心断舍离与升级**：

1. **纯净 Web3 登录**：去除一切对等 Web2（Twitter、GitHub、Discord）绑定的代码痕迹，仅凭借加密钱包私钥签名宣誓主权。
2. **完全去中心化的机制转移 - 乐观验证与裁判惩罚**：不再部署运行中心化的服务端裁判逻辑去评估代码并盲发声誉分。系统改为“成员提交记录并自行预发款/分，社区基于高阶 NFT 筹码启动链上仲裁判罪”的高效乐观范式。
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
│   - Escrow 托管与乐观惩罚机理层 (Optimistic Penalty Network)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、开发基线清查 (2026 最新校对与重制状态) ✅/❌

### Phase 6: 基建与原生代币机制

- [x] **智能合约基底**: VCP (UUPS Proxy) 与 MedalNFT 部署至 Arbitrum Sepolia。

### Phase 7: Pioneer 面板与抗审查公告设计

- [x] **创世发放**: 基于 ECDSA 脱水签名的冷确认（防抢夺机制），用户兑换 `SG-XXXXXX` 即发资产。
- [x] **纯粹 BBS 网络节点化**: 实现 Pioneer Post 系统的组件（未来星火广场雏形）。
- [x] **UI 操作面板**: 包含了对公会任务与内容的展示终端（原中心化 Admin 面板彻底废除，转向完全 DAO 提案面板）。

### Phase 8: 历史债务清理与路线纠偏 💥

- [x] **清算 Web2 模块 (指令下达)**：完全清理了现存项目中的 `api/social` 等任何抓取 GitHub、Twitter、Discord 的代码与 UI。
- [x] **精简 AI 代码与确立 Rhythm 人格基座 (指令下达)**：完全删除 `eliza-add` 库和冗余实现，为即将到来的大语言模型 Function Calling 接口与 "Rhythm" 人格体系腾出极简的技术底层架构。

### Phase 9: 视觉奇观层 (The 3D Space)

- [x] **前端自研的超写实宇宙**: `Globe.tsx`（大区环境自转）与 `SpaceStation.tsx`（中区环境巡航）作为底层。
- [x] **荣誉微观实体渲染**: `BadgeShowcaseModal.tsx` 完成渲染。

---

## 四、未来突围阶段 (Launch Checklist & Refactor) 🔲

### Phase 10: 链上乐观惩罚机制落地 (Optimistic Penalty Design)

- [ ] **Hash 提交与 7 天确认机制**：承接人在提交交付文件或第三方链接（如 GitHub）时，前端计算生成数据哈希（Hash）并签名上链，触发双管（站内信+Email）通知。设定 7 天的争议窗，发布人主动确认或超时未操作皆视为通过并打款。
- [ ] **仲裁扣点与“公义之手”治理门控**：实现发布人点击“申请仲裁”的流转逻辑，触发时强制没收报酬的 10% 上缴国库作为沉没仲裁费。案件同时推送到 `/council/arbitration` 页面，依托已部署的“公义之手”NFT实现严苛的准入限制，只有该 NFT 持有者才能查看案卷并投票，败诉方将面临没收与黑名单惩罚。

### Phase 11: “柴薪王座”与 Rhythm 全能人格构建 (The Agent Throne)

- [ ] **王座 3D 锚点**：在主场景的视觉中心或者专属的 `/council` 页面挂载代表“柴薪王座 (Cinder Throne)”的 3D 模型节点，并在该节点挂载 Rhythm 的前端交互体和知识库入口，接受全链用户无休止的技术与系统咨询。
- [ ] **任务生成意图拦截 (Function Calling)**：前端集成对话面板，配置对应的 System Prompt 与 Function，实现用户提出自然语言发单需求 -> Rhythm 调用 LLM 填充完任务金额、里程碑参数 -> 唤起 MetaMask / Wagmi 等待直接签名发链 的极致顺滑流。
- [ ] **星火广场与机器自动转码 (DAO Proposal to Code)**：依托星火广场，当议案赞同率超标时，将底层调用链路配置好：Rhythm 读取提案上下文 -> 翻译为基于 Governor/Timelock 架构所需的链上执行代码 (Contract ABI + Calldata) -> 用户一键提交上链。

### Phase 12: 资产与数据确权的去信任闭环

- [ ] **存储去信任化 (Arweave Bridge)**: 重构将数十兆高清 `.glb` 和勋章素材全面迁移至 Arweave 网络节点持久化并用 KTX2 纹理。
- [ ] **前端读取全节点化 (Ponder Indexing)**: 去除对 Alchemy/Infura 原生直接轮询压力，部署开源的本地区块索引框架 Ponder。

### Phase 13: 账户与终端极客无感迭代

- [ ] **Paymaster 无感交互**: 探索集成 ERC-4337 和 Session Keys，使得高星用户在参与网络验证与巡检（仲裁处罚作弊者）时免除 Gas 损耗与断点确认摩擦。

### Phase 14: 主网爆破 (Mainnet Blastoff)

- [ ] **基于 Arbitrum One 与完整 DAO 权力的创世合约重启与交接。**
