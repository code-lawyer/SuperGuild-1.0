# Super Guild 开发计划 (v5.0 - 2026 智能主权版)

> **最后更新**: 2026-02-24
> **核心架构**: Arbitrum Sepolia + Next.js 15 + Wagmi v3 + AI Oracle + R3F (3D)
> **合约状态**: VCP (UUPS Proxy) + MedalNFT 已部署 (Arbitrum Sepolia)

---

## 一、项目定位

Super Guild 是一个 **去中心化超级个体协作平台**。通过 AI 驱动的信誉评价体系 (VCP) 和 3D 链上勋章 (SBT)，让全球极客在无中介、零费率的环境下实现 P2P 协作与价值对齐。

**核心逻辑**：

1. **Pioneer 计划**：锁定早期 100 位核心种子成员。
2. **AI Oracle**：对协作交付物 (PoW) 进行盲盒式独立审计，自动发放信誉积分。
3. **主权身份**：3D 勋章动态反映用户在公会内的真实贡献与地位。

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                 │
│  Landing / Services / Collaborations / Profile (Oracle)  │
│  UI: Antigravity Design System + R3F (Medals)           │
├─────────────────────┬───────────────────────────────────┤
│   Wagmi + RKit       │        AI Oracle Engine           │
│   (Pure EOA)         │   (Jina + GitHub + LLM API)       │
├─────────────────────┴───────────────────────────────────┤
│                   Supabase (PostgreSQL)                  │
│  Tables: profiles / pioneer_codes / settlements / tasks  │
├─────────────────────────────────────────────────────────┤
│                 Protocol Layer (Arbitrum)                │
│  VCPTokenV2 (UUPS Proxy: 0xcDD2...f63C)                 │
│  MedalNFT (Dynamic Traits: 0xef96...0F1a)               │
│  *Hot Wallet (Minter) / Cold Wallet (Admin)              │
└─────────────────────────────────────────────────────────┘
```

---

## 三、当前进度 (里程碑回顾) ✅

### Phase 6: 2026 基础设施与资产层

- [x] **VCPTokenV2**: UUPS 可升级架构，内置投票与黑名单。
- [x] **MedalNFT**: ERC-7496 标准，属性随 VCP 余额动态变化。
- [x] **冷热钱包**: 生产级权限分离 (Admin 控制逻辑，Minter 负责自动化)。
- [x] **部署**: 成功上线 Arbitrum Sepolia。

### Phase 7: 拓世者招募计划 (Pioneer)

- [x] **邀请码体系**: 100 枚唯一 `SG-XXXXXX` 码。
- [x] **自动化领取**: EIP-191 签名验证 + 热钱包自动铸币。
- [x] **UI 集成**: 沉浸式金色渐变招募卡片。

### Phase 8: AI 裁判结算引擎 (Oracle) — 代码已就绪 ⚡

- [x] **PoW 抓取层**: 支持 GitHub PR/Commit/Repo 深度解析 + Jina Reader 通用网页抓取。
- [x] **评估算法**: “盲盒”式权重计算公式 (ln(budget) *难度* 质量 * 效率)。
- [x] **多模型适配**: 后端支持 Claude、GPT-4o、Gemini 接口。
- [x] **逻辑集成**: 已挂载至里程碑确认钩子，实现“确认即评估”。
- [ ] **激活**: 待用户配置 `ORACLE_LLM_API_KEY`。

---

## 四、未来开发路线 🔲

### Phase 9: 3D 视觉与确权渲染 (优先级: 高)

- [ ] **R3F 勋章墙**: 在 `/profile` 页面实现 React Three Fiber 3D 展示。
- [ ] **Trait 驱动设计**: 勋章的发光、特效、材质直接映射 API 返回的链上属性。
- [ ] **Arweave 存储**: 将 GLB 模型与 KTX2 压缩纹理实现去中心化永存。

### Phase 10: 特权 NFT 发行与集成 (优先级: 高)

- [ ] **发行部署**: 发布 3 款独立的、**可转让**的标准 NFT (ERC-721/1155)。
  - 🥇 **初火 (The First Flame)**：限量 1 枚，持有者享有议案无限制直接上链权。
  - 🥈 **提灯人枯盏 (Lantern Keeper's Withered Lamp)**：限量 50 枚，授予首批达到 500 VCP 的成员，享受 1.1 倍链上表决权重加成。
  - 🥉 **拓世者纪念章 (Pioneer Memorial)**：限量 100 枚，授予使用邀请码的成员，结算时享受 1.05 倍 VCP 获取速率加成。
- [ ] **权益逻辑注入**: 在 VCP 获取 API 与前端展示中集成针对这些 NFT 获取状态的判断。

### Phase 11: 提灯议会与 AI 助理 "Rhythm(韵)" (MVP 阶段)

- [ ] **启动进度条**: 前端在 `/governance` 页面增加锁定动画与解锁条件进度条（总成员 > 1000，总发放 VCP > 100k，活跃 500+ VCP 成员 > 50）。
- [ ] **超级治理助理 Rhythm**: 整合全站 AI（包括裁判与助手），用户输入自然语言提议，Rhythm 自动编译为机器可读的链上合约 Calldata Payload。
- [ ] **链下联署墙 (Off-chain Forum)**:
  - 发起门槛：持有 > 100 VCP。
  - 共识门槛：汇聚联署超 1% 全网 VCP 则提交上链。
  - 特权通道：检测到发起者钱包持有“初火” NFT，前端直接渲染「上链」按钮。

### Phase 12: 仲裁庭 (Arbitration Court) 雏形

- [ ] **机制设计**: 作为协作仲裁场所。在任务争议发生时，由持有 500+ VCP 的高阶成员组成候补池。
- [ ] **VRF 接入**: 结合 Chainlink VRF，从池中随机抽取奇数（如 5 名）仲裁员进行基于博弈论的盲判决。

### Phase 13: 主网与产品闭环

- [ ] **Arbitrum One 迁移**: 生产环境正式跑通全流程。
- [ ] **移动端适配**: 确保 3D 和交互顺滑体验。

---

## 五、开发红线 (2026 修订版)

1. **零费率承诺**: 平台永不收取撮合/结算费，所有价值沉淀在 VCP 信用中。
2. **AI 透明度**: Oracle 评估逻辑与 Prompt 完全开源，接受社区审计。
3. **私钥隔离**: 热钱包私钥 (`HOT_WALLET_PRIVATE_KEY`) 严禁离开服务器 API 环境。
4. **PoW 强制性**: 无工作量证明不发放 VCP，防止无效通胀。
