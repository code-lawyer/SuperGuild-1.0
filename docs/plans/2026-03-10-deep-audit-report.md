# SuperGuild 深度审计报告（主网 + 多人测试就绪评估）

> **审计日期**: 2026-03-10
> **审计范围**: 全部 hooks、API 路由、前端页面/组件、3D 引擎、配置文件、Supabase Edge Functions
> **审计焦点**: ① 主网部署风险 ② 多人测试（<100人）稳定性 ③ 冗余代码/累赘操作
> **审计方法**: 四路并行深度扫描（hooks/state、API/backend、frontend/components、config/contracts）

---

## 统计总览

| 级别 | 数量 | 说明 |
|------|------|------|
| 🔴 CRITICAL | 6 | 主网上线前必须修复，否则资产损失或系统失效 |
| 🟠 HIGH | 12 | 上线前应修复，影响安全或稳定性 |
| 🟡 MEDIUM | 11 | 多人测试前建议修复，影响体验或数据完整性 |
| 🟢 LOW | 8 | 代码质量/可维护性问题，可后续迭代 |
| 🗑️ 冗余代码 | 5 | 死代码/废弃文件，应清理 |
| **总计** | **42** | |

---

## 🔴 CRITICAL（6 条）

### C1. 仲裁庭首席轮值使用 mock 数据

**文件**: `app/api/council/arbitration/chief/route.ts:6-13`

```ts
const MOCK_HOLDERS = [
    '0x2668b81db197cd1F9d82136C70d473ED2B2B4aE5',
    '0x1234567890123456789012345678901234567890',
    '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01',
];
```

**问题**: 仲裁庭首席轮值返回硬编码的假地址，而非链上查询 Hand of Justice (#4) 持有者。
**影响**: 仲裁系统完全无效 — 任何人都不是真正的仲裁员，争议无法真正裁决。
**修复**: 使用 Viem `readContract` 或 Alchemy `getOwnersForContract` 查询真实 #4 持有者。

---

### C2. 基础设施服务激活使用假交易哈希

**文件**: `app/services/infrastructure/page.tsx` `handleActivate` 函数

```ts
tx_hash: `MOCK_INFRA_${Date.now()}`  // 假交易哈希
```

**问题**: 用户点击「激活」后，无 USDC 实际转移，仅将假 hash 写入 `service_access` 表。
**影响**: 服务可被免费获取，DB 充满无效交易记录。
**修复**: 接入 DirectPay 合约或 USDC `approve + transferFrom` 真实链上支付。

---

### C3. AdminGuard 保留 hardcoded 回退钱包

**文件**: `components/admin/AdminGuard.tsx:9`

```ts
const ADMIN_FALLBACK_WALLET = '0xE358B67C35810312E7AFDce9ADbE5c14e66BAEc6';
```

**问题**: 当 NFT 查询失败时（RPC 挂掉或网络不稳定），此地址自动获得 Admin 权限。
**影响**: 主网 RPC 不稳定时可能误授权；且此地址暴露在源码中，降低安全性。
**修复**: 主网前移除 fallback 逻辑 — NFT 查询失败应显示重试界面而非降级授权。

---

### C4. Header.tsx Admin 链接仍用环境变量钱包名单

**文件**: `components/layout/Header.tsx:11-24`

```ts
const ADMIN_WALLETS = adminWalletsEnv.split(',').map(addr => addr.trim().toLowerCase());
const isAdmin = mounted && isConnected && address && ADMIN_WALLETS.includes(address.toLowerCase());
```

**问题**: Admin 导航入口基于 `NEXT_PUBLIC_ADMIN_WALLETS` 环境变量，而非 NFT 门控。与 AdminGuard 的 Token #3 门控不一致。
**影响**: 非管理员看不到入口但拥有 NFT #3 的人也看不到；两套权限系统不同步。
**修复**: 改用 `useNFTGate(3)` 判断是否显示 Admin 链接。

---

### C5. VCP Indexer 对 MilestoneSettled 事件不检查冷却期

**文件**: `supabase/functions/vcp-indexer/index.ts:165-213`

**问题**: `Paid`（DirectPay）事件正确检查了 `(publisher, worker)` 冷却期，但 `MilestoneSettled`（GuildEscrow）事件因事件参数中没有 `publisher` 地址，跳过了冷却期检查。
**影响**: 通过 GuildEscrow 的协作可以无限绕过 7 天冷却期反作弊机制。
**修复**: 从合约事件 topics 解析 publisher，或在结算前从 Supabase `collaborations` 表反查 `initiator_id`。

---

### C6. Supabase Admin Client 使用 placeholder 回退

**文件**: `lib/supabase/admin.ts:12-13`

```ts
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseServiceRoleKey || 'placeholder-key';
```

**问题**: Vercel 构建阶段的妥协 — 如果环境变量缺失，静默使用无效凭证而非抛出错误。
**影响**: 生产环境若环境变量配置遗漏，所有 Admin API 静默失败，无任何报错。
**修复**: 添加运行时校验：`if (!supabaseServiceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')`。构建阶段专门用 `NEXT_PHASE === 'phase-production-build'` 条件跳过。

---

## 🟠 HIGH（12 条）

### H1. Rate Limiter 基于 X-Forwarded-For 可被伪造

**文件**: `utils/rate-limit.ts:39-40`

```ts
const forwarded = request.headers.get('x-forwarded-for');
const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
```

**问题**: 客户端可以伪造 `X-Forwarded-For` 头绕过限流。
**影响**: 所有 8 个 API 路由的 rate limiting 可被绕过。
**修复**: Vercel 部署使用 `request.headers.get('x-real-ip')` 或平台提供的 `req.ip`。

---

### H2. Rate Limiter 使用内存存储，Serverless 环境无效

**文件**: `utils/rate-limit.ts:27`

**问题**: `new Map()` 存在于单个进程内存中。Vercel Serverless 每次请求可能是新进程，Map 为空。
**影响**: rate limiting 在 Serverless 部署中基本无效。
**修复**: 迁移到 Redis（Upstash）或 Vercel KV 持久化存储。

---

### H3. Markdown 组件存在 XSS 漏洞

**文件**: `components/ui/Markdown.tsx:59-67`

```tsx
<a href={match[2]} target="_blank" rel="noopener noreferrer">
```

**问题**: 链接 URL 未做协议校验，攻击者可注入 `javascript:alert(1)` 或 `data:text/html,...`。
**影响**: Admin 发布公告时若含恶意 Markdown 链接，所有查看者浏览器执行恶意代码。
**修复**: 添加协议白名单：

```ts
const url = match[2];
if (!url.startsWith('http://') && !url.startsWith('https://')) return match[1]; // 纯文本
```

---

### H4. Bulletin Pioneer API 附件字段未校验

**文件**: `app/api/bulletin/pioneer/route.ts:101-116`

**问题**: `attachment` 对象的 `fileName`、`fileUrl`、`fileSize`、`mimeType` 均直接写入 DB，无类型/长度/格式校验。
**影响**: `fileName` 可能含路径遍历字符、`fileSize` 可为负数或超大值、`mimeType` 可为任意字符串。
**修复**: Zod schema 或手动校验：`fileName.length < 255`、`fileUrl.startsWith('https://')`、`fileSize < 100MB`、`mimeType in WHITELIST`。

---

### H5. GraphQL 代理无查询校验

**文件**: `app/api/profile/query/route.ts:6-28`

**问题**: 直接将客户端 JSON body 转发到 The Graph，未校验查询内容。
**影响**: 攻击者可执行深度嵌套查询（DoS）、introspection 探测 schema、或查询其他用户数据。
**修复**: 白名单允许的查询类型 + 限制查询深度。

---

### H6. 热钱包私钥在每次请求中加载到内存

**文件**: `app/api/pioneer/claim/route.ts:74-89`, `app/api/profile/sign/route.ts:6`

**问题**: `HOT_WALLET_PRIVATE_KEY` 每次 API 请求都从 `process.env` 读取并在内存中存在。
**影响**: 进程内存泄漏（core dump、heap snapshot）可暴露私钥。
**修复**: 远期使用 KMS/HSM 签名服务。近期可接受，但确保 Vercel Functions 无 debug 端点暴露。

---

### H7. useGuildEscrow 中 publicClient 非空断言

**文件**: `hooks/useGuildEscrow.ts` 多处 `publicClient!.waitForTransactionReceipt(...)`

**问题**: `usePublicClient()` 在 Wagmi 未初始化时返回 `undefined`，但代码用 `!` 强制解引用。
**影响**: 用户在特定时机（页面刚加载、钱包断连）操作 Escrow 时崩溃。
**修复**: 添加 `if (!publicClient) throw new Error('RPC client not ready')`。

---

### H8. 申请协作无重复检查（前端层）

**文件**: `hooks/useCollaborations.ts` `useApplyToCollab`

**问题**: 用户可连续点击「申请」按钮，虽然 DB 有唯一约束会拒绝，但用户看到的是晦涩的数据库错误。
**影响**: 用户体验差 — 看到 "unique constraint violation" 而非 "你已经申请过了"。
**修复**: 申请前先查询 `collaboration_applications` 是否已存在。

---

### H9. 审批申请无乐观锁（竞态条件）

**文件**: `hooks/useCollaborations.ts` `useApproveApplication`

**问题**: 两个 admin 同时审批不同申请人时，`update provider_id` 无 `WHERE provider_id IS NULL` 条件。
**影响**: 最后一个审批覆盖前一个，前一个申请人被静默替换。
**修复**: `.eq('provider_id', null)` 添加到 update 条件中。

---

### H10. useVCP 实时订阅在钱包切换时泄漏 Channel

**文件**: `hooks/useVCP.ts:44-67`

**问题**: `useEffect` 中创建 Supabase channel，cleanup 函数调用 `removeChannel`，但钱包地址变化时旧 channel 的网络订阅可能未完全断开。
**影响**: 多次切换钱包后，内存中积累多个活跃订阅，拖慢浏览器。
**修复**: 添加 AbortController 模式，确保旧 fetch 和 channel 都被取消。

---

### H11. 仲裁庭 API 的 RPC 调用无超时

**文件**: `app/api/bulletin/pioneer/route.ts:44-49`

**问题**: `publicClient.readContract(...)` 无超时设置。
**影响**: RPC 节点无响应时，API 请求永久挂起，占用连接池。
**修复**: `Promise.race([readContract(...), timeout(5000)])` 模式。

---

### H12. next.config.mjs 缺少 CSP 响应头

**文件**: `next.config.mjs`

**已有**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
**缺失**: `Content-Security-Policy`

**影响**: XSS 攻击无浏览器层面防护。
**修复**: 添加 CSP：`default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.supabase.co https://*.alchemy.com; img-src 'self' https: data:`

---

## 🟡 MEDIUM（11 条）

| # | 问题 | 文件 | 影响 |
|---|------|------|------|
| M1 | `useNotifications` 注释写 15s 实际 60s | `hooks/useNotifications.ts:36` | 下一个维护者可能「修复」为 15s 导致 4x 负载 |
| M2 | `useProfile` 邮箱/Telegram 无格式校验 | `hooks/useProfile.ts:144-165` | 无效联系方式写入 DB，联系失败 |
| M3 | `useProposals` 地址大小写不一致 | `hooks/useProposals.ts:328-347` | cosigner_address 可能重复（不同大小写） |
| M4 | Milestone confirm 使用本地 state 金额 | `app/collaborations/[id]/page.tsx:349-365` | 并发修改时可能付错金额 |
| M5 | BadgeWall 快速点击可创建多个 WebGL 上下文 | `components/profile/BadgeWall.tsx:60-74` | WebGL 上下文超限导致 3D 崩溃 |
| M6 | BadgeModel useFrame 中无 unmount 清理 | `components/3d/BadgeModel.tsx:105-113` | 长会话内存缓慢增长 |
| M7 | `useServices` mock payment 的 `console.warn` 留在生产 | `hooks/useServices.ts:56-62` | 控制台暴露内部实现细节 |
| M8 | Profile/sign API 无输入长度限制 | `app/api/profile/sign/route.ts:14-21` | 100KB nickname 可写入签名消息 |
| M9 | Bulletin title/content 仅 trim 无 XSS 清理 | `app/api/bulletin/pioneer/route.ts:89-94` | 若前端 Markdown 组件渲染，可注入 |
| M10 | localStorage 明文存储 JWT | `providers/AuthProvider.tsx:50-77` | XSS 攻击可窃取 JWT |
| M11 | GLB 模型全部预加载 | `components/3d/BadgeModel.tsx:126-129` | 首屏加载带宽浪费（5 个模型） |

---

## 🟢 LOW（8 条）

| # | 问题 | 文件 |
|---|------|------|
| L1 | WalletConnect projectId 硬编码 fallback | `providers/config.ts:23` |
| L2 | ErrorBoundary 硬编码英文文案 | `components/ui/ErrorBoundary.tsx:35` |
| L3 | 协作创建页 reference links 用 `key={i}` | `app/collaborations/create/page.tsx:221` |
| L4 | 模态框无 focus trap（无障碍问题） | 多处 Modal 组件 |
| L5 | `useDirectPay` USDC 精度依赖 config 而非硬编码 6 | `hooks/useDirectPay.ts:39-43` |
| L6 | 多处 `console.error` 未包裹 dev 检查 | 多文件 |
| L7 | `next.config.mjs` 图片 remote pattern 过于宽泛 | `next.config.mjs` s2.loli.net `/**` |
| L8 | ESLint `ignoreDuringBuilds: true` | `next.config.mjs:22` |

---

## 🗑️ 冗余代码 / 累赘操作（5 条）

| # | 文件 | 说明 | 处理建议 |
|---|------|------|---------|
| R1 | `hooks/useSBTs.ts` | 整个文件已废弃，无任何 import 引用 | **直接删除** |
| R2 | `utils/encryption-server.ts` | 死代码 — 使用 `NEXT_PUBLIC_` 前缀的密钥，但整个模块无任何引用 | **直接删除** |
| R3 | `lib/supabase/admin.ts:12-13` | placeholder 回退逻辑属 Vercel 构建期 workaround，应改为构建期条件判断 | **重构** |
| R4 | `services` 表 `price` 和 `price_usdc` 两列功能重叠 | channel=1 两个价格字段逻辑混乱 | **统一为 `price_usdc`** |
| R5 | `useNFTGate` 中 `isMounted` 状态 | 引入额外渲染周期，可用 `isLoading` 状态替代 | **简化** |

---

## 多人测试（<100人）专项风险

以下问题在多人同时使用时会被放大：

| 风险 | 触发场景 | 影响 | 紧急度 |
|------|---------|------|--------|
| Rate limiter 内存存储无效 | Vercel Serverless 部署 | API 限流形同虚设 | 🔴 |
| 审批竞态条件（H9） | 两人同时被审批 | provider 被覆盖 | 🟠 |
| Supabase channel 泄漏（H10） | 用户频繁切换钱包 | 浏览器卡顿 | 🟡 |
| useNotifications 轮询 | 100 人在线 × 60s 轮询 | Supabase 免费额度耗尽 | 🟡 |
| WebGL 上下文上限（M5） | 用户快速点击徽章 | 3D 渲染崩溃 | 🟡 |
| 协作申请重复提交（H8） | 网络延迟下连续点击 | 用户困惑 | 🟡 |

---

## 修复优先级建议

### 第一轮：主网阻断项（6 条 CRITICAL）

按以下顺序修复：

1. **C4** Header Admin 入口改为 NFT 门控 — 简单改动，统一权限体系
2. **C3** AdminGuard 移除 fallback 钱包 — 简单改动
3. **C6** Supabase Admin placeholder 改为抛错 — 简单改动
4. **C2** 服务激活接入真实支付 — 需接合约
5. **C1** 仲裁庭接入链上 NFT 查询 — 需写新逻辑
6. **C5** VCP indexer 补充 publisher 冷却期 — 需改 Edge Function

### 第二轮：安全加固（HIGH 12 条）

- **H1+H2** Rate limiter 迁移到 Upstash Redis
- **H3** Markdown XSS 修复（5 分钟改动）
- **H4** Bulletin 附件校验
- **H7** publicClient 空值检查
- **H8+H9** 前端竞态修复
- **H12** CSP 响应头

### 第三轮：体验优化（MEDIUM 11 条）

按影响范围逐步修复。

### 第四轮：清理（LOW + 冗余）

删除死代码、统一代码风格。

---

## 与 2026-03-08 审计报告对比

| 指标 | 上次（03-08） | 本次（03-10） | 变化 |
|------|-------------|-------------|------|
| CRITICAL | 3 → 修复后 0 | 6（新发现） | +6 新问题 |
| HIGH | 10 → 修复后 7 | 12 | 深度扫描发现更多 |
| MEDIUM | 16 | 11 | 部分已修复 |
| LOW | 6 | 8 | 微增 |
| 冗余代码 | 未统计 | 5 | 新增分类 |

**说明**: 本次审计角度不同 — 上次侧重代码质量和已知漏洞，本次侧重主网部署风险和多人并发场景。两份报告互补，不重复计算。

---

*审计由 Claude Opus 4.6 执行，覆盖 hooks/（18 文件）、app/api/（9 路由）、app/ 页面（15+）、components/（30+）、constants/（5 文件）、providers/（4 文件）、supabase/functions/（1 文件）、配置文件（5 个）。*
