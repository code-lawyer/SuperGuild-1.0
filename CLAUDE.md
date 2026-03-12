# SuperGuild (The Shelter Program) — CLAUDE.md

## 项目定位

**SuperGuild** 是面向 AI 时代超级个体的去中心化协作协议与基础设施（"赛博避难所"）。通过智能合约和 NFT 取代中心化管理员，实现无需许可的 P2P 协作、链上声誉铸造和 DAO 自治。

**四大支柱：**
1. **万能中后台** — 货架化服务（法律/财税/IP/跨境），稳定币支付
2. **去中心化 DAO** — SparkGovernor + NFT 门控治理
3. **零费率协议** — 本金链上托管，里程碑自动结算
4. **乐观惩罚机制** — 7天争议窗 + Hand of Justice 仲裁庭

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15 (App Router) + React 19 |
| 样式 | Tailwind CSS v4 |
| Web3 | Wagmi v3 + Viem + RainbowKit |
| 数据库 | Supabase (PostgreSQL + Storage + Realtime) |
| 状态管理 | TanStack Query v5 |
| 3D 引擎 | React Three Fiber + Three.js |
| 动效 | Framer Motion |
| 包管理 | pnpm |
| 语言 | TypeScript (Strict Mode) |

---

## 常用命令

```bash
pnpm dev        # 启动开发服务器 (localhost:3000)
pnpm build      # 构建生产版本
pnpm lint       # ESLint 检查
```

---

## 已部署合约

### Arbitrum Sepolia（Chain ID: 421614）— 主链

| 合约 | 地址 |
|------|------|
| VCPTokenV2 (UUPS Proxy, Locked ERC-20) | `0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C` |
| MedalNFT (ERC-721 + ERC-7496 Dynamic Traits) | `0xef96bE9fFf59B5653085C11583beaC0D16450F1a` |

### Sepolia ETH（Chain ID: 11155111）— 特权 NFT

| 合约 | 地址 |
|------|------|
| Privilege NFT (ERC-1155, Manifold) | `0x46486Aa0aCC327Ac55b6402AdF4A31598987C400` |

**Privilege NFT Token 映射（绝对不能改错）：**

| Token ID | 名称 | 门控功能 |
|----------|------|----------|
| #1 | Pioneer Memorial | 创始成员纪念 |
| #2 | Lantern Keeper's Withered Lamp | 社区守护者标识 |
| #3 | The First Flame | **Admin 面板准入**（目标状态，当前仍为 hardcoded） |
| #4 | Hand of Justice | **仲裁庭准入** |
| #5 | Beacon of the Forerunner | **Pioneer 功能门控** |

合约地址和 ABI 位于 `constants/` 目录，**绝对不能随意修改**。

---

## 架构决策（已确认）

### 1. GuildEscrow — 链上资金托管（Phase 10 首要目标）

**设计：单一共享合约 + 乐观释放**

- 一个 `GuildEscrow` 合约服务所有协作，用 `collabId` 区分资金池，无需每个协作部署新合约
- USDC 资金完全由智能合约控制，非热钱包

**核心流程：**
```
发布者 deposit(collabId) → USDC 链上锁仓
承接人 submitProof(collabId, milestoneIdx, contentHash) → 触发 7 天倒计时
  ├── 发布者主动 confirm() → 立即释放 USDC
  ├── 7 天无操作 → autoRelease() 乐观释放（热钱包代调，平台承担 Gas）
  └── 发布者 dispute() → 10% 罚没入国库，Hand of Justice (#4) 仲裁投票
```

**VCP mint 触发链：** `MilestoneSettled` 合约事件 → 热钱包监听 → 调用 VCP `mint()`

### 1.5 双轨支付模式 — MVP 阶段性架构决策

> **详细文档：** `docs/plans/2026-03-12-payment-mode-architecture.md`

**两种模式：**

| | self_managed (DirectPay) | guild_managed (GuildEscrow) |
|---|---|---|
| 资金托管 | 无托管，USDC 直通 | 合约托管，里程碑释放 |
| 凭证上链 | 否 | 是（contentHash bytes32） |
| 7天争议窗 | 无 | 有（合约强制执行） |
| 仲裁 | 不可用 | 完整（罚没 + Hand of Justice） |
| VCP 倍率 | 0.5x | 1.0x |

**MVP 阶段（当前）只开放 self_managed，原因：**
1. GuildEscrow 持有用户资金，主网上线前必须经过专业安全审计
2. DirectPay 是无状态 pass-through，攻击面接近于零
3. 先用 P2P 模式积累社区信任，再开放托管模式

**已知妥协：** self_managed 模式下，协作全生命周期数据（任务详情、凭证提交、里程碑确认）仅存在 Supabase，无链上锚定。仅付款金额有链上记录（DirectPay `Paid` 事件）。这是**有意的临时妥协**，不代表链上证据功能不需要。

**guild_managed 代码已实现约 80%，禁止删除。** 相关文件见架构文档。

### 2. 身份认证模型

- **当前：** JWT wallet auth（AuthProvider + /api/auth/wallet）+ RLS 迁移就绪
- **链上操作：** 通过 Wagmi 钱包签名，这是真正的身份验证层
- **规则：** 所有 Supabase 写操作必须在业务逻辑层校验 `address === wallet_address`

### 3. Admin 权限

- **当前：** Token #3（The First Flame）NFT 门控（AdminGuard + Header），已完成迁移

### 4. AI Oracle 引擎（后端已实现）

- 任务全部里程碑 SETTLED 后自动触发
- 抓取凭证 PoW（GitHub PR/Commit/Repo + Jina Reader）
- LLM 评分：`VCP = floor(baseScore × complexityScore × qualityScore × efficiencyScore)`
- 热钱包签名调用 VCP 合约 `mint(to, amount, reason)`
- 幂等性通过 `vcp_settlements` 表保障

---

## 数据库表说明

| 表名 | 职责 |
|------|------|
| `profiles` | 用户档案（wallet_address 为 PK，vcp_cache 为链上镜像） |
| `collaborations` | P2P 协作主表，状态机核心 |
| `milestones` | 里程碑明细（百分比、状态） |
| `proofs` | 凭证链（**禁止 DELETE/UPDATE**，只能新增） |
| `collaboration_applications` | 多人申请队列 |
| `pioneer_codes` | 邀请码（ECDSA 签名验证） |
| `bulletins` / `bulletin_attachments` | 星火广场公告 |
| `notifications` | 站内通知 |
| `services` | 中后台服务货架 SKU |
| `service_access` | 服务解锁记录 |
| `user_medals` | 勋章持有关系 |
| `proposals` / `proposal_votes` / `proposal_cosigners` | DAO 提案与投票 |
| `vcp_settlements` | AI Oracle 结算幂等锁 |

**协作状态机：**
```
OPEN → PENDING_APPROVAL → LOCKED → ACTIVE → PENDING → SETTLED
                                                      → DISPUTED
                                         → CANCELLED（任意阶段）
```

---

## 开发规范

### i18n（强制）

- **所有面向用户的文本必须通过 `lib/i18n` 字典获取**，使用 `useT()` hook
- 禁止在组件中硬编码任何中文或英文文案
- `lib/i18n/zh.ts` 与 `lib/i18n/en.ts` 结构必须严格保持一致
- 新增页面或组件时，**先在两个字典中定义文案，再写组件**

```tsx
// ✅ 正确
const t = useT();
<button>{t.common.confirm}</button>

// ❌ 错误
<button>确认</button>
<button>Confirm</button>
```

### 设计语言

- 沿用现有 `components/ui/` 风格扩展，不引入新设计体系
- 基准风格：**暗色系 + 极简工业风**（zinc-800 border, 1px, GlassCard 组件）
- `.stitch-designs/components/` 是原型参考，可酌情迁移，不强制
- 3D 组件使用 React Three Fiber，不混用其他 3D 库

### NFT 门控模式

所有需要 NFT 权限的功能，必须使用现有 hooks：

```ts
useNFTGate(tokenId)        // 通用门控（双源验证：RPC + Alchemy REST API fallback）
useLanternGate()           // Token #4 门控（wrapper）
usePioneerGate()           // Token #5 门控（wrapper）
usePrivilegeNFTs()         // 批量查询所有 5 个 Token（双源验证）
```

**跨链查询说明：** Privilege NFT 在 Sepolia ETH，通过 wagmi `chainId` 参数强制读取，用户无需手动切链。

**双源验证架构：** 主源 wagmi RPC（staleTime 5min）+ 后备 `/api/nft/verify`（Alchemy NFT REST API）。Fail-closed：两源都失败 → `hasNFT=false`，永不在错误时放行。

### Supabase 操作规范

```ts
// 写操作前必须校验地址归属
const { address } = useAccount();
if (!address) throw new Error('请先连接钱包');

// proofs 表只能 INSERT，禁止 DELETE/UPDATE
// 修正版本通过新增记录处理，不覆盖旧记录
```

---

## 🚨 红线约束（NEVER DO）

1. **不修改 `constants/` 下的合约地址和 ABI** — 这些是线上已部署合约，改错即断链
2. **不在组件中硬编码任何文案** — 必须通过 i18n 系统，中英两个文件同步更新
3. **不绕过或简化 NFT 门控逻辑** — `useNFTGate` 系列 hooks 是安全边界，不得 mock 或 skip
4. **不直接 `git push` 或操作远程分支** — 所有 git 操作需用户确认
5. **不直接修改 Supabase 生产数据** — 只能通过代码逻辑写入，不执行原始 SQL 删改
6. **不删除或覆盖 `proofs` 表记录** — 凭证链是信用系统核心，必须不可逆
7. **不删除 guild_managed 相关代码** — `useGuildEscrow`、`resolver-bot`、仲裁 UI/API、UploadProofDialog 的链上分支等均为已完成的预备功能，MVP 阶段暂未激活但**禁止当作死代码清理**（详见 `docs/plans/2026-03-12-payment-mode-architecture.md`）

---

## 已知技术债

以下问题已知晓，**上主网前必须修复**，开发阶段暂时接受：

| 问题 | 影响 | 优先级 |
|------|------|--------|
| ~~Supabase 多张表无 RLS~~ | ✅ 已修复：敏感表写入策略已收紧，仅 service_role 可写 | ~~已完成~~ |
| ~~Admin 权限仍为 hardcoded 钱包地址~~ | ✅ 已改为 Token #3 NFT 门控（AdminGuard + Header） | ~~已完成~~ |
| ~~GLB 模型从 `/public/models/` 本地加载~~ | ✅ 已迁移至 Supabase Storage CDN | ~~已完成~~ |
| ~~NFT 门控测试网不稳定~~ | ✅ 已实现双源验证（RPC + Alchemy REST API fallback） | ~~已完成~~ |
| ~~基础设施假交易哈希~~ | ✅ 已替换为真实 USDC transfer | ~~已完成~~ |
| ~~Supabase Admin 占位符~~ | ✅ 已改为 Proxy 延迟初始化 | ~~已完成~~ |
| MedalNFT Dynamic Traits 未接入前端 | 3D 渲染参数硬编码 | Phase 12 |
| 直接 RPC 轮询（无 Ponder 索引层） | 用户量大后性能瓶颈 | Phase 12 |
| Supabase 核心表无 RLS（collaborations/milestones/proofs） | 主网需加写入保护 | Phase 11.5 |
| Supabase Auth 层未前端集成 | JWT 签发 API 已就绪，前端未接入 | Phase 11.5 |
| 仲裁庭链上结算未实现 | 投票只写 DB，不触发链上释放/罚没 | Phase 11.5 |
| VCP 刷单检测未实现 | 快速确认检测 + S/A 级 PoW 强制待做 | Phase 11.5 |

---

## 🚨 主网上线前必须处理（Mainnet Checklist）

> **完整清单见 Claude 记忆文件 `mainnet-checklist.md`，以下为关键摘要：**

| # | 事项 | 文件 | 不处理的后果 |
|---|------|------|-------------|
| 1 | 关闭 `NEXT_PUBLIC_DEV_MOCK_NFTS` | `.env` | 所有人绕过 NFT 门控 |
| 2 | 替换 MockUSDC → Circle USDC | `nft-config.ts` | 支付系统使用假币 |
| 3 | 移除/隐藏 Faucet 页面 | `app/admin/faucet/` | 主网无 mint 函数，页面报错 |
| 4 | 更换热钱包私钥 | `.env` | 测试网私钥已暴露，资产被盗 |
| 5 | 切换链 ID 到主网 | `chain-config.ts` | 合约调用指向测试网 |
| 6 | 更新所有合约地址 | `contract-address.ts` | 交互的是测试网合约 |
| 7 | Supabase RLS + Auth | 数据库 | 任何人可篡改数据 |
| 8 | 智能合约安全审计 | Solidity | 合约漏洞导致资金损失 |

---

## 当前开发优先级

### ✅ Phase 10（已完成）— 链上结算闭环 + 全系统闭环

Phase 10 全部完成（2026-03-10），包括：GuildEscrow/DirectPay 双轨支付、VCP 反作弊、万能中后台三频道重构、6 项 CRITICAL 审计修复、NFT 门控双源验证。**测试网公测已启动。**

### 🔴 Phase 11（当前阶段）— Rhythm AI 人格

- 长老 persona agent 聊天 + Rhythm 聊天界面
- Function Calling 自然语言发单
- DAO 议案 → 链上 Calldata 自动生成
- 真实链上成员数据接入柴薪王座

### 🟡 Phase 11.5 — 主网安全加固

- Supabase RLS 全表覆盖 + Auth 前端集成
- Faucet 页面 `IS_MAINNET` 守卫
- 仲裁庭链上结算 + VCP 刷单检测
- 合约安全审计

### 🟢 Phase 12-14（远期）

- Arweave 存储迁移 + Ponder 索引
- ERC-4337 AA 账户 + Passkey
- Arbitrum One 主网部署（详见 `docs/plans/2026-03-10-mainnet-launch-division.md`）
