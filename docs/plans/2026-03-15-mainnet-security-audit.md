# SuperGuild 主网迁移安全审计报告

> **审计日期**：2026-03-15
> **审计范围**：全项目代码（API 路由、Hooks、合约配置、Resolver Bot、数据库安全）
> **审计基准**：Phase 11.5 完成后代码状态
> **目标**：主网迁移前风险识别与修复指导

---

## 执行摘要

SuperGuild 的安全架构整体稳健，核心模式（双源 NFT 验证、EIP-191 签名、RLS 全表保护、速率限制、PII 加密）均已落地。

**但存在 7 个 CRITICAL + 2 个 HIGH 问题，主网部署前必须全部修复。**

| 等级 | 数量 | 能否上线 |
|------|------|---------|
| CRITICAL | 7 | ❌ 不能，必须修复 |
| HIGH | 2 | ❌ 不能，必须修复 |
| MEDIUM | 6 | ⚠️ 建议修复，可带问题上线但需记录 |
| LOW | 4 | 🟡 上线后修复即可 |

---

## 一、CRITICAL（主网不能上线）

### C-1 — DirectPay 零地址占位符
**文件**：`constants/direct-pay-config.ts` L7-9，`scripts/resolver-bot.ts` L37-41
**风险**：主网 `IS_MAINNET=true` 时，`DIRECT_PAY_ADDRESS` 默认为零地址。所有自管理协作的链上支付将静默失败或 revert。Resolver Bot 也会静默跳过 DirectPay VCP 铸造（无警告日志），导致整个声誉系统无法工作。

```typescript
// direct-pay-config.ts — 当前状态
export const DIRECT_PAY_ADDRESS: `0x${string}` = IS_MAINNET
    ? '0x0000000000000000000000000000000000000000' // TODO: mainnet address
    : '0xDc0f7BF5c7C026f8000e00a40d0f93a28c04bf65';
```

**修复**：
1. 部署 DirectPay 到 Arbitrum One 后，在 Vercel 设置 `NEXT_PUBLIC_DIRECT_PAY_ADDRESS=<主网地址>`
2. 在 `direct-pay-config.ts` 和 resolver bot 启动时添加防护检查：
   ```typescript
   if (IS_MAINNET && DIRECT_PAY_ADDRESS === '0x000...000') {
     throw new Error('[FATAL] DirectPay address not configured for mainnet');
   }
   ```

---

### C-2 — MockUSDC 未替换为 Circle USDC
**文件**：`constants/nft-config.ts` L89-94
**风险**：默认值是 Arbitrum Sepolia MockUSDC 地址。主网用户执行 approve/pay 时将指向不存在的合约，所有支付流程（协作支付 + 服务购买）全部失效。

```typescript
// 当前默认值
export const MOCK_USDC = {
  address: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    '0xdd0a2bf984d690c9cdd613603094d7455fc63e06') as `0x${string}`, // 测试网地址！
```

**修复**：
1. Vercel 设置 `NEXT_PUBLIC_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831`（Arbitrum One 官方 USDC）
2. 建议重命名 `MOCK_USDC` → `USDC`（避免命名误导，Claude 可执行此代码变更）

---

### C-3 — Faucet 页面未在主网路由层拦截
**文件**：`app/admin/faucet/page.tsx`
**风险**：当前只做了 UI 层守卫（显示 "Faucet Unavailable" 提示），不是路由层拦截。如果 IS_MAINNET 判断出现问题（如环境变量未正确设置），用户可进入页面并调用不存在的 `MockUSDC.mint()`，产生迷惑性报错。

**修复**（Claude 可直接执行）：
```typescript
// app/admin/faucet/page.tsx 顶部加入
import { notFound } from 'next/navigation';
export default function FaucetPage() {
  if (IS_MAINNET) notFound(); // 主网直接 404，不渲染任何内容
  // ... 原有页面逻辑
}
```
同时在 `app/admin/layout.tsx` 侧边栏导航中隐藏 Faucet 入口（`IS_MAINNET` 条件渲染）。

---

### C-4 — 热钱包私钥必须更换
**文件**：`.env.local`（本地），Vercel 环境变量
**风险**：现有 `HOT_WALLET_PRIVATE_KEY` 是测试网开发期使用的私钥，已在开发环境暴露。复用到主网将导致热钱包资产（VCP 铸造权限控制）可能被盗。

**修复**：
- 使用 MetaMask/Ledger 生成全新主网专用钱包
- 新钱包地址需在主网 VCPTokenV2 被授予 `MINTER_ROLE`（见合约部署步骤 2.6）
- 旧测试网私钥控制的 MINTER_ROLE 在测试合约上可保留（不影响主网）

---

### C-5 — Resolver Bot Chain ID 硬编码
**文件**：`scripts/resolver-bot.ts` L31-32
**风险**：`CHAIN_ID` 默认值为 `421614`（Arbitrum Sepolia）。主网运行时如果运维人员忘记设置 `CHAIN_ID=42161`，Bot 将连接测试网合约执行 VCP 铸造，但写入主网数据库，造成数据不一致。

```typescript
const CHAIN_ID = Number(process.env.CHAIN_ID || '421614'); // 危险默认值
```

**修复**：
```typescript
// 改为强制要求显式设置，无默认值
const CHAIN_ID = process.env.CHAIN_ID;
if (!CHAIN_ID) throw new Error('[FATAL] CHAIN_ID must be explicitly set. Use 42161 for mainnet.');
```

---

### C-6 — Resolver Bot 在 DirectPay 零地址时静默跳过（无告警）
**文件**：`scripts/resolver-bot.ts` L578-580
**风险**：当 `DIRECT_PAY_ADDRESS` 为零地址时，Bot 静默 return，不打印任何警告。运维人员无法感知 DirectPay VCP 铸造已停止工作。

```typescript
async function runDirectPayVCPWatcher() {
    if (DIRECT_PAY_ADDRESS === '0x000...000') return; // 静默！
```

**修复**（Claude 可执行）：
```typescript
if (DIRECT_PAY_ADDRESS === '0x0000000000000000000000000000000000000000') {
  if (IS_MAINNET) throw new Error('[FATAL] DirectPay address not set on mainnet');
  console.warn('[WARN] DirectPay address not set, VCP watcher disabled');
  return;
}
```

---

### C-7 — Nonce 重放保护存在竞态条件
**文件**：`app/api/auth/wallet/route.ts` L47-54
**风险**：Nonce 唯一性通过先查询再插入实现。在 Serverless 高并发环境（Vercel），两个请求可能同时通过 `usedNonce === null` 检查，然后都成功插入，绕过重放保护。

**修复**：
1. 在 Supabase `auth_nonces` 表的 `nonce` 列添加 `UNIQUE` 约束（迁移脚本，Claude 可生成）
2. 在 API 层捕获 `23505` 错误码（PostgreSQL UNIQUE 违反）：
   ```typescript
   const { error } = await supabaseAdmin.from('auth_nonces').insert({ nonce });
   if (error?.code === '23505') {
     return NextResponse.json({ error: 'Nonce already used' }, { status: 409 });
   }
   ```

---

## 二、HIGH（主网不能上线）

### H-1 — GraphQL 代理端点无认证 + 指向错误链
**文件**：`app/api/profile/query/route.ts` L6-28
**风险**：
1. 端点无身份验证，任何人可通过此代理向 TheGraph 发送任意 GraphQL 查询（账单放大攻击）
2. 目标 URL 硬编码为 `https://api.thegraph.com/subgraphs/name/verax/linea-sepolia`（Linea 测试网），与应用实际使用的 Arbitrum 无关

```typescript
// 无 auth，转发任意 body
const response = await fetch('https://api.thegraph.com/subgraphs/name/verax/linea-sepolia', {
  body: JSON.stringify(body) // 直接转发！
});
```

**修复**：
- 如此端点为 Verax 证明系统的遗留代码且主网不使用，建议直接删除
- 如需保留，添加 JWT 验证 + 查询白名单（阻止 `__schema` 等 introspection 查询）

---

### H-2 — VCP 结算幂等性存在并发竞态
**文件**：`scripts/resolver-bot.ts` L439-449
**风险**：多个 Resolver Bot 实例（容灾冗余）同时处理同一个 DirectPay 事件时，双方可能同时通过 `existing === null` 检查，然后都成功插入记录并调用 `mint()`，导致 VCP 重复铸造。

**修复**：
1. 在 Supabase `vcp_settlements` 表的 `settlement_key` 列添加 `UNIQUE` 约束（可能已存在，需验证）
2. Bot 层捕获 `23505` 错误：
   ```typescript
   try {
     await supabase.from('vcp_settlements').insert(record);
   } catch (e) {
     if (e.code === '23505') { console.log('Race lost, already processed'); return; }
     throw e;
   }
   ```

---

## 三、MEDIUM（建议主网前修复，可带问题上线需记录）

### M-1 — 文件上传 MIME 验证依赖客户端 Content-Type（可绕过）
**文件**：`app/api/upload/route.ts`
**风险**：`file.type` 是用户控制的 FormData 字段，攻击者可将 `.exe` 文件的 MIME 设为 `image/png` 绕过白名单。

**修复**：使用 `file-type` 包读取文件魔数（magic bytes）进行服务端 MIME 验证，不信任客户端声明的类型。

---

### M-2 — Alchemy 限流错误未正确透传
**文件**：`app/api/nft/verify/route.ts`
**风险**：Alchemy 返回 429 时，服务端将其转为 503 返回给客户端。客户端接收 503 后认为服务不可用（而非需要退避），可能无限重试，加剧 Alchemy 配额消耗。

**修复**：检测 Alchemy 响应码，429 → 返回 429，并在客户端 hooks 中对 429 实现指数退避。

---

### M-3 — 协作状态机无数据库层约束
**文件**：`supabase/migrations/`
**风险**：协作状态流转（`OPEN → PENDING_APPROVAL → ACTIVE → SETTLED`）仅在业务层和前端强制，数据库层无 CHECK 约束。JWT 被盗的情况下可绕过业务层直接执行非法状态跳转。

**修复**：在 `collaborations` 表添加 CHECK 约束：
```sql
ALTER TABLE collaborations ADD CONSTRAINT valid_status
  CHECK (status IN ('OPEN','PENDING_APPROVAL','LOCKED','ACTIVE','PENDING','SETTLED','DISPUTED','CANCELLED'));
```

---

### M-4 — Admin 签名消息无时间戳（存在长效重放风险）
**文件**：`lib/auth/verify-admin.ts`
**风险**：Admin 操作签名的消息格式为 `"SuperGuild Admin Action\nAction: ${action}\nAddress: ${address}"`，无时间戳。签名一旦泄露，永久有效（无过期时间）。

**修复**：消息中加入 `timestamp`，服务端验证时间差：
```typescript
const message = `SuperGuild Admin Action\nAction: ${action}\nAddress: ${address}\nTimestamp: ${timestamp}`;
// 服务端校验：if (Date.now() - timestamp > 5 * 60_000) return 401
```

---

### M-5 — RPC URL 硬编码 Sepolia（Privilege NFT 查询）
**文件**：`app/api/bulletin/pioneer/route.ts` L10-15
**风险**：使用 `SEPOLIA_RPC_URL` 查询 Privilege NFT。主网时 Privilege NFT 在 Ethereum Mainnet，Sepolia RPC 无法查询，导致 Pioneer 发帖门控全部失效。

**修复**：改用 `getAlchemyRpcUrl(PRIVILEGE_CHAIN_ID, ALCHEMY_KEY)` 动态获取正确链的 RPC。

---

### M-6 — 区块浏览器 URL 硬编码测试网
**文件**：`app/admin/faucet/page.tsx` L75，及其他引用 Arbiscan URL 的位置
**风险**：硬编码 `https://sepolia.arbiscan.io`，主网上交易链接指向错误浏览器。

**修复**：在 `constants/chain-config.ts` 添加：
```typescript
export const BLOCK_EXPLORER = PRIMARY_CHAIN_ID === 42161
  ? 'https://arbiscan.io'
  : 'https://sepolia.arbiscan.io';
```

---

## 四、LOW（上线后修复）

### L-1 — `auth_nonces` 表无定期清理
旧 nonce 记录会无限增长，影响查询性能。建议添加 TTL 或定期清理（保留 24h 内记录即可）。

### L-2 — Resolver Bot 无心跳监控接口
Bot 崩溃后没有主动告警机制（只能靠 VCP 余额不增长被动发现）。建议添加心跳写入（每分钟写一条记录或调用监控 API）。

### L-3 — Pioneer Code ECDSA 验证后无 DB 唯一约束保险
已实现 `UPDATE WHERE claimed_by IS NULL` 原子操作（Good），但建议在 `pioneer_codes(code)` 上添加 UNIQUE 约束作为双重保险。

### L-4 — 服务端 Alchemy Key 与公共 Key 共享配额
`lib/auth/verify-nft.ts` fallback 到 `NEXT_PUBLIC_ALCHEMY_ID`（客户端可见 key）。高流量时服务端管理员操作可能被客户端请求耗尽配额。建议配置独立的服务端 `ALCHEMY_SERVER_KEY`。

---

## 五、已通过的安全检查（✅）

| 项目 | 状态 | 说明 |
|------|------|------|
| NFT 门控双源验证 | ✅ | RPC + Alchemy fallback，Fail-closed |
| EIP-191 签名验证 | ✅ | Admin/Vote/Pioneer 端点全部实现 |
| RLS 全 17 张表 | ✅ | migration 20260313 已执行 |
| proofs 表不可修改 | ✅ | 无 UPDATE/DELETE RLS 策略 |
| vcp_settlements 防篡改 | ✅ | 仅 service_role 可写 |
| PII 加密（Email/Telegram） | ✅ | AES-256-GCM + 随机 IV |
| 速率限制 | ✅ | 所有公开端点均有（10-60 req/min） |
| Supabase Admin 客户端隔离 | ✅ | 服务端 only，Proxy 延迟初始化 |
| 文件上传大小限制 | ✅ | 5MB 限制已实现 |
| VCP 反作弊三重机制 | ✅ | cooldown_7d + monthly_cap + fast_confirm_freeze |
| 协作结算幂等性 | ✅ | settlement_key 唯一（需加 DB 约束，见 H-2） |
| `DEV_MOCK_NFTS` 移除 | ✅ | 已从全部代码中彻底删除 |
| Supabase Admin 占位符修复 | ✅ | Proxy 延迟初始化已完成 |

---

## 六、修复优先级矩阵

```
立即修复（主网前必须）
├── C-1  DirectPay 零地址                → 你部署合约 + Claude 加防护检查
├── C-2  MockUSDC 未替换                 → 你配 Vercel 环境变量
├── C-3  Faucet 路由守卫                 → Claude 改代码（30分钟）
├── C-4  热钱包私钥更换                  → 你生成新钱包
├── C-5  Resolver Bot chain ID 默认值    → Claude 改代码（10分钟）
├── C-6  Resolver Bot 静默跳过告警       → Claude 改代码（10分钟）
├── C-7  Nonce 竞态（DB UNIQUE 约束）    → Claude 生成迁移 SQL（20分钟）
├── H-1  GraphQL 代理端点               → Claude 删除或加认证（20分钟）
└── H-2  VCP 结算竞态（DB UNIQUE 约束） → Claude 生成迁移 SQL（20分钟）

主网后尽快修复（建议 1 周内）
├── M-1  文件上传魔数验证
├── M-2  Alchemy 429 透传
├── M-3  状态机 DB CHECK 约束
├── M-4  Admin 签名加时间戳
├── M-5  Pioneer RPC URL 动态化
└── M-6  区块浏览器 URL 动态化

长期优化（Phase 12 前）
├── L-1  nonce 表定期清理
├── L-2  Resolver Bot 心跳监控
├── L-3  Pioneer Code UNIQUE 约束
└── L-4  独立服务端 Alchemy Key
```

---

## 七、上线放行标准

**以下全部完成后，方可推送主网：**

- [ ] C-1 ~ C-7 全部修复（CRITICAL）
- [ ] H-1 ~ H-2 全部修复（HIGH）
- [ ] `pnpm build` 零错误
- [ ] GuildEscrow + VCPTokenV2 专业合约审计通过
- [ ] 主网合约已部署并在 Arbiscan 验证源码
- [ ] Resolver Bot 主网启动日志显示 `MINTER_ROLE verified`
- [ ] DirectPay 主网支付流程 E2E 测试通过
- [ ] NFT 门控在主网 RPC 下验证通过（Token #3/#4/#5）

---

*本报告基于代码状态 2026-03-15。修复工作中如遇新问题，请告知 Claude 更新此报告。*
