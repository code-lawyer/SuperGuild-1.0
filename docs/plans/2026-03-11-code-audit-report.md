# SuperGuild 全项目代码审计报告 v2

> **初审日期**: 2026-03-08（v1，34 条有效问题）
> **二审日期**: 2026-03-11（v2，本次）
> **审计范围**: 全部 hooks、API 路由、合约交互、前端组件、配置文件、i18n、依赖项、架构模式
> **审计工具**: 四路并行深度审查（安全认证层 + 合约交互层 + 前端数据流 + 架构依赖）

---

## 审计版本对比摘要

| 维度 | v1（2026-03-08） | v2（2026-03-11） | 变化 |
|------|-----------------|-----------------|------|
| CRITICAL | 3 条（修复后 0） | 5 条（新发现） | +5 |
| HIGH | 10 条（修复后 7） | 10 条 | 部分旧项已修复，新增多项 |
| MEDIUM | 16 条 | 14 条 | 部分旧项已修复，新增多项 |
| LOW/INFO | 6 条 | 12 条 | 审查更深入 |
| **总计** | **34 条** | **41 条** | 旧项 19 条已修复，新发现 26 条 |

---

## v1 问题状态追踪

### v1 CRITICAL — 全部已修复 ✅

| v1# | 问题 | v2 状态 |
|-----|------|---------|
| #1 | 加密密钥 NEXT_PUBLIC_ 前缀 | ✅ 已修复（死代码，无风险） |
| #2 | Webhook 无签名验证 | ✅ 已修复（HMAC-SHA256） |
| #5 | pioneer/claim 竞态窗口 | ✅ 已修复（唯一部分索引 + 原子 UPDATE） |

### v1 HIGH — 7/10 已修复

| v1# | 问题 | v2 状态 |
|-----|------|---------|
| #6 | TypeScript ignoreBuildErrors | ✅ 已修复（`ignoreBuildErrors: false`） |
| #7 | Admin 页面 30+ 处硬编码英文 | ✅ 已修复（i18n 全替换） |
| #8 | window.confirm 硬编码英文 | ✅ 已修复（同 #7） |
| #9 | profile 页面硬编码 tab | ✅ 已修复 |
| #10 | 所有 API 路由无 rate limiting | ✅ 已修复（全部 10 个路由已加限流） |
| #11 | useNFTGate 硬编码 sepolia.id | ✅ 已修复（改为 PRIVILEGE_CHAIN_ID + 双源验证） |
| #12 | 合约地址两处定义不同步 | ⚠️ **仍存在** — nft-config.ts 为 SSoT，旧 contract-address.ts 未确认删除 |
| #14 | 无 CSP/安全响应头 | ⚠️ **部分修复** — 已加 X-Frame-Options 等 5 个头，但仍缺 CSP 和 HSTS → v2-M9 |
| #15 | ESLint ignoreDuringBuilds | ⚠️ **仍存在** — 因 RC 版 eslint-config-next bug 未解决 → v2-M12 |

### v1 MEDIUM — 10/16 已修复

| v1# | 问题 | v2 状态 |
|-----|------|---------|
| #16 | BadgeWall 多个 Canvas 实例 | ✅ 已修复 |
| #17 | useVCP 实时订阅清理不完整 | ✅ 已修复（`removeChannel` 在 cleanup 中） |
| #18 | useSyncProfile 竞态条件 | ✅ 已修复（cancelled flag + retry 逻辑） |
| #19 | useCollaborations .or() 无输入校验 | ✅ 已修复（加了地址格式正则校验） |
| #20 | useNotifications 15 秒轮询 | ✅ 已修复（改为 60 秒） |
| #21 | pioneer/status 泄露邀请码 | ✅ 已修复（不再返回 code 字段） |
| #22 | upload 路由无文件校验 | ✅ 已修复（加 5MB + MIME 白名单） |
| #23 | profile/sign 无时间戳 | ✅ 已修复（加 timestamp 参数） |
| #24 | useServices 假交易哈希 | ⚠️ **仍存在** → v2-H5 |
| #25 | useApproveProvider 无 initiator 校验 | ✅ 已修复（加 `initiator_id === address` 校验） |
| #26 | PII 明文存储 | ⚠️ **仍存在** → v2-M14（有 TODO 注释） |
| #27 | 多处 as any 类型断言 | ⚠️ **仍存在**（低优先级） |
| #28 | 无 Error Boundary | ⚠️ **仍存在** → v2-L9 |
| #29 | 仲裁庭 chief 路由 mock 数据 | ✅ 已修复（改为 Alchemy NFT API 链上查询） |
| #30 | waitForTransactionReceipt 无超时 | ✅ 已修复（全部加了 `timeout: 60_000`） |
| #31 | approve + deposit 非原子操作 | ⚠️ **设计上接受** — 注释说明了残留 allowance 无害（仅限 GuildEscrow 合约） |

### v1 LOW — 3/6 已修复

| v1# | 问题 | v2 状态 |
|-----|------|---------|
| #32 | WalletConnect projectId 硬编码 | ⚠️ **仍存在** → v2-L5 |
| #33 | icon-only 按钮缺少 aria-label | ⚠️ **仍存在**（无障碍，低优先级） |
| #34 | BadgeWall setTimeout 无 cleanup | ✅ 已修复 |
| #35 | useProfileStats 三次查询可合并 | ⚠️ **仍存在**（性能优化，低优先级） |
| #36 | useSBTs 已废弃未删除 | ⚠️ **仍存在** → v2-L6 |
| #37 | useProposals 自动 delegate 无确认 | ✅ 已修复（加了 toast 提示） |

---

## v2 新发现问题

### 🔴 CRITICAL（5 项）— 即刻处理

#### C1. `.agents/rules.md` 含明文数据库密码已提交至 git

- **文件**: `.agents/rules.md`
- **v1 无此问题**（文件在 v1 审计后创建）
- **详情**: 包含 Supabase 直连 URL（含 Postgres 密码）、anon key、Alchemy key、WalletConnect ID。任何有 repo 访问权的人可绕过应用层安全直接操作数据库。
- **影响**: 测试网 + 主网
- **建议**: 立即从 git 历史中清除此文件（`git filter-branch` 或 BFG），轮换数据库密码，`.agents/` 加入 `.gitignore`。

#### C2. `.env` 与 `.env.local` 存在两套完全不同的配置

- **文件**: `.env` vs `.env.local`
- **v1 无此问题**
- **详情**: `.env` 指向旧 Supabase 项目 (`wbarwyqyflyejasulqet.supabase.co`) + `CHAIN_ID=137`（Polygon 主网）。`.env.local` 才是当前活跃配置。若部署环境未加载 `.env.local` 会连接错误数据库+错误链。且 `.env:38` 两个变量拼接在一行。
- **影响**: 部署安全
- **建议**: 清理 `.env`，只保留 `.env.example` 作模板。

#### C3. 协作状态机全部写操作无服务端鉴权

- **文件**: `hooks/useCollaborations.ts` 全文
- **v1 复核说明**: v1#3 被标为"误伤"（理由：合约有 `onlyPublisher`）。但 v2 发现：**这只对 guild_managed 模式成立**。`self_managed` 模式下里程碑确认不经过链上合约，完全靠 Supabase 写入，无任何服务端鉴权。
- **详情**: 无 RLS 情况下——
  - 任何人可 `useConfirmMilestone` 确认别人的里程碑（self_managed 直接触发 SETTLED）
  - 任何人可 `useDisputeCollaboration` 对任意协作发起争议（无状态守卫，SETTLED 也能变 DISPUTED）
  - `useApproveApplication` 无状态守卫（ACTIVE 状态也能被覆盖 provider_id）
  - `useCancelCollaboration` 无状态守卫（可取消已 SETTLED 的协作）
  - `useRejectProvider` 未校验调用者是否为 initiator
- **影响**: 测试网（恶意测试者可破坏数据）+ 主网（致命）
- **建议**: Phase 11.5 RLS 全表覆盖是最高优先级。临时方案：将关键操作改为 API route + 签名验证。

#### C4. `pioneer/claim` 和 `pioneer/status` API 使用 anon key 而非 supabaseAdmin

- **文件**: `app/api/pioneer/claim/route.ts:14-15`, `app/api/pioneer/status/route.ts:9-10`
- **v1 无此问题**（v1 时尚未建立 supabaseAdmin 模式）
- **详情**: 服务端用 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 创建客户端。启用 RLS 后 `pioneer_codes` 表的 UPDATE 操作将被拦截，Pioneer 领取功能完全失效。同一仓库的 `bulletin/pioneer` 路由正确使用了 `supabaseAdmin`，说明这是遗漏。
- **影响**: Phase 11.5 启用 RLS 时会引发功能故障
- **建议**: 改为 `import { supabaseAdmin } from '@/lib/supabase/admin'`。

#### C5. DirectPay 与 GuildEscrow 的 collabId 哈希方式不一致

- **文件**: `hooks/useDirectPay.ts:44` vs `hooks/useGuildEscrow.ts:13`
- **v1 无此问题**（DirectPay 在 v1 后实现）
- **详情**: DirectPay 使用 `keccak256(toBytes(collabId))`，GuildEscrow 使用 `keccak256(toHex(uuid))`。viem 的 `toBytes` 和 `toHex` 对同一 UUID 字符串可能产生不同编码。若哈希不一致，resolver-bot 无法匹配 DirectPay 的 `Paid` 事件到正确的协作，VCP mint 链条断裂。
- **影响**: 测试网 + 主网（DirectPay 支付后 VCP 无法 mint）
- **建议**: DirectPay 直接 `import { toCollabId } from '@/hooks/useGuildEscrow'`，统一哈希函数。

---

### 🟠 HIGH（10 项）— 主网前必修

#### H1. Bulletin Pioneer POST 无签名验证 — 可伪造任意地址发帖

- **文件**: `app/api/bulletin/pioneer/route.ts:34-38`
- **v1 无此项**
- **详情**: 接受 `authorAddress` 参数不验证签名。攻击者可传入持有 Pioneer NFT 的目标地址以其身份发帖。对比 `/api/pioneer/claim` 正确验证了 EIP-191 签名。
- **建议**: 要求 JWT 或 EIP-191 签名证明调用者身份。

#### H2. Profile Sign 端点无调用者验证

- **文件**: `app/api/profile/sign/route.ts`
- **v1#23 的延伸** — v1 时指出无时间戳，已修复（加了 timestamp）；但 v2 发现更本质的问题：`subject` 参数完全不验证所有权。
- **详情**: 任何人可传入任意 `subject` 地址获取服务端签名。可用于注册欺诈性链上 profile。
- **建议**: 要求 JWT 或签名证明调用者拥有该地址。

#### H3. Admin CRUD 操作全为客户端直写

- **文件**: `app/admin/services/page.tsx`, `app/admin/bulletins/page.tsx`
- **v1 无此项**（v1 关注的是 i18n，非权限）
- **详情**: `AdminGuard` 只做 UI 门控。无 RLS 下知道 anon key 的任何人可直接 DELETE/UPDATE services 和 bulletins 表。且 save/delete 操作不检查返回的 error。
- **建议**: 移到 API route + NFT 验证，或 RLS 限制写入。

#### H4. 仲裁投票无服务端 NFT 门控验证

- **文件**: `hooks/useDisputeVotes.ts:79-101`
- **v1#4 重新评估**: v1 标为"误伤"（理由：页面级 `useNFTGate` 门控）。v2 重新评估：**页面级 UI 门控可被绕过**（直接调 Supabase API），无 RLS 下任何人可向 `dispute_votes` 表写入投票。
- **建议**: 将投票改为 API route + 服务端 NFT 验证。

#### H5. `useServices` 解锁付款仍为 MOCK

- **v1#24 遗留**
- **文件**: `hooks/useServices.ts:83-95`
- **详情**: `unlockMutation` 仍是 `setTimeout(1500ms)` + 假 tx_hash。Channel 1 基础设施已有真实 USDC transfer，但 Channel 2/3 仍可免费解锁。
- **建议**: 替换为真实 USDC transfer 到 SERVICE_TREASURY。

#### H6. Markdown 组件允许 `javascript:` URL 注入（XSS）

- **文件**: `components/ui/Markdown.tsx:63`
- **v1 无此项**
- **详情**: `parseInline` 渲染链接时不验证 protocol。协作的 `secret_content` 字段使用此渲染器且内容为用户输入。`[click](javascript:alert(1))` 可执行。同样问题存在于 `collaborations/[id]/page.tsx` 的 reference links 和 `MilestoneTimeline.tsx` 的 proof URLs。
- **建议**: 验证 href 必须以 `https://` 或 `http://` 开头，拒绝其他 protocol。

#### H7. `useDirectPay` approve 后未等交易确认就执行 pay

- **文件**: `hooks/useDirectPay.ts:50-58`
- **v1 无此项**（DirectPay 在 v1 后实现）
- **详情**: 对比 `useGuildEscrow` 正确使用了 `waitForTransactionReceipt`。approve 未确认就调 pay 会因 allowance 不足 revert。pay 也未等确认就标记 `done`。且 hook 未引入 `usePublicClient`。
- **建议**: 加 `usePublicClient` + 两步均加 `waitForTransactionReceipt`。

#### H8. VCP 余额显示用 `Number(bigint)` — 精度丢失 + 天文数字

- **文件**: `hooks/useVCP.ts:94-96`, 同理 `votingPower`（line 100）
- **v1 无此项**
- **详情**: VCP 是 18 decimals ERC-20。`Number(100e18)` = `1e20`，显示为 `100000000000000000000` 而非 `100`。`Number` 对超过 `2^53` 的整数还会丢失精度。
- **建议**: 使用 `formatUnits(balance, 18)` from viem。

#### H9. `useLanternGate` 名称与实际功能不匹配

- **文件**: `hooks/useLanternGate.ts`
- **v1 无此项**（v1 时此 hook 检查的是 Token #2）
- **详情**: 名为 "Lantern"（Token #2），实际检查 Token #4（Hand of Justice）。注释说"仲裁庭门控"但返回 `isLantern`。维护者可能误用导致权限逻辑错误。
- **建议**: 重命名为 `useJusticeGate` / `isJustice`。

#### H10. `@types/react` v18 与 React 19 版本冲突

- **文件**: `package.json:63-64`
- **v1 无此项**（v1 时可能还未升级 React 19）
- **详情**: 运行时 `react@19.2.0` 配合 `@types/react@^18`，类型定义不匹配，缺少 React 19 新 API 类型（如 `use`、`useActionState` 等）。
- **建议**: 升级 `@types/react` 和 `@types/react-dom` 到 `^19`。

---

### 🟡 MEDIUM（14 项）

| # | 问题 | 文件 | v1 关联 | 说明 |
|---|------|------|---------|------|
| M1 | Nonce store 内存 Map — Serverless 无效 | `api/auth/wallet/route.ts:10` | 新发现 | Vercel 冷启动清空，nonce 防重放实质失效 |
| M2 | Rate limiter 同样内存 Map | `utils/rate-limit.ts` | 新发现 | 同上，所有 API 限流在 Serverless 下无效 |
| M3 | `profile/query` 是开放 GraphQL 代理 | `api/profile/query/route.ts` | 新发现 | 客户端可发任意 GraphQL 查询，无白名单 |
| M4 | i18n 硬编码残留（4+ 个组件） | CreateProposalModal, ProfileGateModal, VotePanel, SparkPlazaPage, RequireWallet | v1#7 延伸 | Admin 页面已修复，但这几个组件是新遗漏（15+ 处中文） |
| M5 | `createNotification` 客户端直写 | `hooks/useNotifications.ts:105` | 新发现 | 可伪造通知发给任意地址（钓鱼载体） |
| M6 | 协作创建非原子操作 | `hooks/useCollaborations.ts:147-184` | 新发现 | collab + milestones 两步写入，milestone 失败产生孤儿记录 |
| M7 | 里程碑确认 + 结算检查非原子 | `hooks/useCollaborations.ts:484-508` | 新发现 | 并发确认可竞态，两个请求同时看到 0 remaining |
| M8 | Upload API 转发到 sm.ms 第三方图床 | `api/upload/route.ts` | v1#22 延伸 | 文件校验已修复，但数据仍流向不可控第三方 |
| M9 | 无 Content-Security-Policy 头 | `next.config.mjs` | v1#14 遗留 | 已加其他安全头但缺 CSP 和 HSTS |
| M10 | 无 middleware.ts — 路由保护全客户端 | 项目根目录 | 新发现 | Admin 页面 HTML/JS 包可被任何人下载 |
| M11 | QueryClient 模块级单例 — SSR 数据泄漏 | `providers/Web3Providers.tsx:13` | 新发现 | 应在 `useState` 中创建 |
| M12 | ESLint RC 版本 + 构建时禁用 | `package.json:67`, `next.config.mjs:22` | v1#15 遗留 | 根因是 `eslint-config-next@15.0.0-rc.0`，升级可能解决 |
| M13 | 热钱包与 Signer 使用同一私钥 | `.env.local:6,13` | 新发现 | 单点泄漏同时暴露 VCP mint + profile sign 两项能力 |
| M14 | 联系方式明文存储 + 通知传递 | `hooks/useProfile.ts` | v1#26 遗留 | email/telegram 明文存储且在通知 metadata 中传递 |

---

### 🟢 LOW / INFO（12 项）

| # | 问题 | 文件 | v1 关联 |
|---|------|------|---------|
| L1 | `usePrivilegeNFTs` 返回值依赖排序假设 | `hooks/usePrivilegeNFTs.ts` | 新发现 |
| L2 | 缺少 Strict-Transport-Security 头 | `next.config.mjs` | v1#14 延伸 |
| L3 | 5+ 个未使用的 npm 依赖 | `package.json` | 新发现 |
| L4 | `NEXT_PUBLIC_ADMIN_WALLETS` 变量残留 | `.env.local` | 新发现 |
| L5 | WalletConnect projectId 硬编码 fallback | `providers/config.ts:23` | v1#32 遗留 |
| L6 | `useSBTs` hook 查询不存在的表 | `hooks/useSBTs.ts` | v1#36 遗留 |
| L7 | `ag-card` CSS 类使用 10 次但从未定义 | 5 个组件文件 | 新发现 |
| L8 | 全部 22 个页面都是 `'use client'` | `app/` 全部 page.tsx | 新发现 |
| L9 | 无 error.tsx / not-found.tsx / loading.tsx | `app/` | v1#28 遗留 |
| L10 | DirectPay 主网地址为零地址 | `direct-pay-config.ts:8` | 新发现 |
| L11 | SparkGovernor 地址默认空字符串 | `nft-config.ts:84` | 新发现 |
| L12 | 通知文案硬编码中文存入数据库 | `hooks/useCollaborations.ts` 7 处 | 新发现 |

---

## 正面发现（v1 + v2 综合）

**安全层**：
- Auth 层 JWT 签发实现规范（EIP-191 + nonce 防重放 + 5 分钟过期）
- NFT 门控双源验证架构设计优秀（RPC + Alchemy REST API，fail-closed）
- 全部 10 个 API route 已加 rate limiting（v1#10 修复成果）
- 热钱包私钥正确限制在服务端（非 NEXT_PUBLIC_）
- Pioneer claim 有签名验证 + 原子 UPDATE + 唯一索引三重防护
- 无 `dangerouslySetInnerHTML` 使用（XSS 面清洁）

**合约交互**：
- GuildEscrow: SafeERC20 + ReentrancyGuard + Ownable2Step + 完整事件日志
- 合约地址全部支持 env 覆盖（主网迁移友好）
- Chain config 集中管理，IS_MAINNET flag 设计良好
- Escrow 状态机 deposit → submit → confirm/dispute → settle 流程清晰

**架构**：
- supabaseAdmin 延迟初始化（Proxy 模式）避免占位符问题
- AuthProvider + 客户端 Proxy 无缝切换 anon ↔ authenticated
- i18n TypeScript 类型约束保证中英结构一致
- 3D 模型 BoundingBox 归一化解决尺寸差异
- 安全头已配置 X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

---

## 修复优先级建议

### 立即处理（测试网安全）

| 优先级 | 问题 | 预估工时 |
|--------|------|---------|
| 🔴 1 | C1 — 清除 `.agents/rules.md` + 轮换 DB 密码 | 30min |
| 🔴 2 | C2 — 清理 `.env` 垃圾配置 | 15min |
| 🔴 3 | C5 — 统一 collabId 哈希函数 | 10min |
| 🔴 4 | H6 — Markdown/URL XSS 修复（protocol 白名单） | 30min |
| 🔴 5 | H7 — DirectPay 等交易确认 | 20min |
| 🔴 6 | H8 — VCP formatUnits | 10min |

### Phase 11.5（主网安全加固）

| 优先级 | 问题 | 说明 |
|--------|------|------|
| 🟠 1 | C3 + H3 + H4 + M5 | RLS 全表覆盖（一次解决全部客户端直写） |
| 🟠 2 | C4 | API route 统一 supabaseAdmin |
| 🟠 3 | H1 + H2 | API route 加签名/JWT 验证 |
| 🟠 4 | H5 | useServices 真实 USDC 支付 |
| 🟠 5 | M1 + M2 | Serverless 持久化（Redis/KV） |
| 🟠 6 | M9 + M10 | CSP + middleware 路由保护 |
| 🟠 7 | M13 | 分离热钱包和 Signer 密钥 |

### 代码质量（可分多个 session）

| 问题 | 说明 |
|------|------|
| H9 | 重命名 useLanternGate |
| H10 | 升级 @types/react v19 |
| M4 | i18n 遗漏组件修复 |
| M6 + M7 | 原子化操作（Supabase RPC） |
| M11 + M12 | QueryClient + ESLint 修复 |
| L3 + L6 + L7 | 清理无用依赖/hooks/CSS |

---

*审计由 Claude Opus 4.6 执行，覆盖 hooks/、app/api/、app/admin/、app/council/、app/collaborations/、app/services/、components/、constants/、lib/、providers/、utils/、scripts/ 等全部目录。*
