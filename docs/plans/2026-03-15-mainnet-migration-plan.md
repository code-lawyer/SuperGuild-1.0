# SuperGuild 主网迁移行动方案

> **生成日期**：2026-03-15
> **状态基准**：Phase 11.5 全部完成，RLS 已全表启用（migration `20260313`），`DEV_MOCK_NFTS` 已从代码中彻底移除。
> **说明**：🧑 = 必须由你本人操作（涉及私钥、资产、账号权限）/ 🤖 = Claude 可直接执行（代码改动、构建验证）

---

## 阶段一：前置准备（D-7，全部 🧑 你操作）

这些任务涉及私钥或外部账号，Claude 无法代劳。建议按顺序执行，后续阶段依赖这些输出。

| # | 任务 | 操作说明 | 输出（完成后告知 Claude） |
|---|------|----------|--------------------------|
| 1.1 | **生成主网热钱包** | MetaMask/Ledger 生成全新钱包，**绝不复用测试网私钥**（测试网私钥已在 `.env` 暴露） | 热钱包地址 `0x...` |
| 1.2 | **创建国库多签** | Safe (Gnosis)，推荐 2-of-3 或 3-of-5，记录地址 | 多签地址 `0x...` |
| 1.3 | **注册主网 Alchemy App** | 在 Alchemy Dashboard 创建 Arbitrum One + ETH Mainnet 两个 App | 新 API Key |
| 1.4 | **热钱包充 ETH（Arbitrum One）** | 约 0.1 ETH 备用（VCP mint Gas + autoRelease） | — |

---

## 阶段二：合约部署（D-5，🧑 你操作）

**依赖**：阶段一完成（热钱包和国库多签地址已就绪）

| # | 任务 | 操作说明 | 完成？ |
|---|------|----------|--------|
| 2.1 | **部署 VCPTokenV2 UUPS Proxy** → Arbitrum One | Hardhat/Foundry deploy，记录 proxy 地址 | [ ] |
| 2.2 | **部署 MedalNFT** → Arbitrum One | 记录合约地址 | [ ] |
| 2.3 | **部署 GuildEscrow** → Arbitrum One | 记录合约地址 | [ ] |
| 2.4 | **部署 DirectPay** → Arbitrum One | 记录地址（`direct-pay-config.ts` 有 TODO 零地址占位） | [ ] |
| 2.5 | **配置 GuildEscrow** | 调用 `setResolver(热钱包地址)`，`setTreasury(多签地址)` | [ ] |
| 2.6 | **授予 MINTER_ROLE** | 在 VCPTokenV2 调用 `grantRole(MINTER_ROLE, 热钱包地址)` | [ ] |
| 2.7 | **Manifold 主网铸造 Privilege NFT** | 确保 Ethereum Mainnet 上 Token #1-#5 可查询 | [ ] |
| 2.8 | **Arbiscan/Etherscan 验证合约源码** | `npx hardhat verify --network arbitrum <address>` | [ ] |

**部署完成后，将以下地址告知 Claude（Claude 负责更新代码）：**

```
VCPTokenV2 Proxy:            0x...
MedalNFT:                    0x...
GuildEscrow:                 0x...
DirectPay:                   0x...
Privilege NFT (ETH Mainnet): 0x...（如地址变更）
Circle USDC (固定):           0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

---

## 阶段三：代码切换（D-3，🤖 Claude 主导）

**依赖**：阶段二的主网合约地址

**Claude 执行以下代码变更：**

| # | 文件 | 变更内容 | 完成？ |
|---|------|----------|--------|
| 3.1 | `constants/nft-config.ts` | `MOCK_USDC.address` 默认值 → Circle USDC `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`；更新其余合约默认地址 | [ ] |
| 3.2 | `constants/direct-pay-config.ts` | `IS_MAINNET` 分支填入主网 DirectPay 地址（当前为零地址 TODO） | [ ] |
| 3.3 | `app/admin/faucet/page.tsx` | 添加 `IS_MAINNET` 守卫（主网返回 404 或显示 "Not available on mainnet"） | [ ] |
| 3.4 | `app/admin/layout.tsx` | `IS_MAINNET` 时隐藏 Faucet 侧边栏导航项 | [ ] |
| 3.5 | 构建验证 | `pnpm build` + `pnpm lint` 必须零错误通过 | [ ] |

---

## 阶段四：Vercel 环境变量配置（D-2，🧑 你操作）

**依赖**：阶段二所有地址和 Key 已就绪

在 Vercel 控制台 → **Settings → Environment Variables** → 选择 **Production** 环境，逐项填入：

```bash
# 链配置
NEXT_PUBLIC_PRIMARY_CHAIN_ID=42161
NEXT_PUBLIC_PRIVILEGE_CHAIN_ID=1

# Alchemy（主网 Key）
NEXT_PUBLIC_ALCHEMY_ID=<主网 Alchemy API Key>

# 合约地址（覆盖代码默认值）
NEXT_PUBLIC_VCP_TOKEN_ADDRESS=<主网 VCPTokenV2 Proxy>
NEXT_PUBLIC_MEDAL_NFT_ADDRESS=<主网 MedalNFT>
NEXT_PUBLIC_GUILD_ESCROW=<主网 GuildEscrow>
NEXT_PUBLIC_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
NEXT_PUBLIC_SERVICE_TREASURY=<国库多签地址>
NEXT_PUBLIC_PRIVILEGE_NFT_CONTRACT=<主网 Privilege NFT 地址（如变更）>

# 服务端密钥（不含 NEXT_PUBLIC_，保持私密）
HOT_WALLET_PRIVATE_KEY=<全新主网热钱包私钥>
SUPABASE_SERVICE_ROLE_KEY=<生产 service role key>
SUPABASE_URL=<生产 Supabase URL>
NEXT_PUBLIC_SUPABASE_URL=<生产 Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<生产 anon key>
SUPABASE_JWT_SECRET=<Supabase 项目 JWT Secret>
OPENAI_API_KEY=<正式账单 key>
```

> ⚠️ **不要设置** `NEXT_PUBLIC_DEV_MOCK_NFTS`，此变量已从代码中移除，设置也无效。

---

## 阶段五：预上线验证（D-1，🧑 你操作）

完整测试方案见 `docs/plans/2026-03-14-mainnet-pre-launch-test-plan.md`。以下为必须全部通过的 P0 项：

| 优先级 | 测试项 | 参考章节 | 通过？ |
|--------|--------|---------|--------|
| P0 | JWT Auth 流程（连接钱包 → 签发 Token → RLS 生效） | 模块 A | [ ] |
| P0 | NFT 门控安全边界（Token #3/#4/#5，Fail-closed 验证） | 模块 B | [ ] |
| P0 | 协作全链路（创建 → 申请 → 批准 → 提交凭证 → 支付） | 模块 C | [ ] |
| P0 | DirectPay 链上支付（真实 USDC approve + pay，Arbiscan 验证） | 模块 D | [ ] |
| P0 | Supabase RLS 安全边界（跨用户读写防护，proofs 不可删） | 模块 G | [ ] |
| P0 | `NEXT_PUBLIC_DEV_MOCK_NFTS` 确认不存在 | SEC-03 | [ ] |
| P0 | Faucet 页面主网守卫有效（IS_MAINNET → 不可访问） | N-03 | [ ] |

**Resolver Bot 主网验证：**

```bash
# 启动主网 bot，检查启动日志
CHAIN_ID=42161 \
RESOLVER_PRIVATE_KEY=<主网热钱包私钥> \
SUPABASE_URL=<生产URL> \
SUPABASE_SERVICE_ROLE_KEY=<生产key> \
npx tsx scripts/resolver-bot.ts
```

预期启动日志中出现 `[startup] MINTER_ROLE verified on VCPTokenV2`。
若显示 WARN，需重新执行步骤 2.6。

---

## 阶段六：上线日（D-Day）

| # | 任务 | 负责人 | 完成？ |
|---|------|--------|--------|
| 6.1 | Vercel → 将 Preview 环境变量提升为 Production | 🧑 你 | [ ] |
| 6.2 | 触发 Vercel Production 部署（push to main 或手动 Redeploy） | 🧑 你 | [ ] |
| 6.3 | 上线后监控 Vercel Runtime Logs 首 1 小时 | 🧑 你 | [ ] |
| 6.4 | 监控 Supabase Logs → 过滤 RLS deny 异常 | 🧑 你 | [ ] |
| 6.5 | 设置热钱包余额告警（ETH < 0.01 时通知，Alchemy Notify 或 Tenderly） | 🧑 你 | [ ] |

---

## 阶段七：上线后持续运维

| # | 任务 | 频率 | 负责人 |
|---|------|------|--------|
| 7.1 | 补充热钱包 ETH | 月度检查，< 0.05 ETH 时补充 | 🧑 你 |
| 7.2 | 国库多签提取/再分配（争议罚金） | 按需 | 🧑 你 |
| 7.3 | Alchemy 用量监控和账单检查 | 月度 | 🧑 你 |
| 7.4 | Bug 修复 / 功能迭代 | 按需 | 🤖 Claude |

---

## 合约审计建议

`GuildEscrow`（托管用户资金）和 `VCPTokenV2`（UUPS 可升级代币）在主网开放 `guild_managed` 模式前**必须**完成专业审计。MVP 阶段只开放 `self_managed`（DirectPay）可降低紧迫性，但建议与部署并行推进。

**审计重点（供审计机构参考）：**
- **GuildEscrow**：重入攻击（deposit/release）、7 天倒计时精度、resolver 权限隔离
- **VCPTokenV2**：UUPS upgrade 安全性、月度上限 overflow、MINTER_ROLE 范围控制

推荐机构：OpenZeppelin、Certik、Code4rena

---

## 已完成事项（无需重复处理）

| 事项 | 完成时间 |
|------|----------|
| ✅ `NEXT_PUBLIC_DEV_MOCK_NFTS` 已从代码中彻底移除 | Phase 10 |
| ✅ Supabase RLS 全 17 张表启用（migration `20260313`） | Phase 11.5 |
| ✅ Admin 权限已迁移为 Token #3 NFT 门控（非 hardcoded 钱包） | Phase 10 |
| ✅ NFT 门控双源验证（RPC + Alchemy REST API fallback，Fail-closed） | Phase 10 |
| ✅ 基础设施服务购买已接入真实 USDC transfer（非假哈希） | Phase 10 |
| ✅ EIP-1559 Gas 估算修复（baseFeePerGas × 2，绕过钱包缓存） | Phase Design Polish |
| ✅ 链配置已 env-driven（`chain-config.ts`，只需填 Vercel 变量） | Phase 10 |

---

## 紧急回滚速查

| 场景 | 操作 | 预计恢复时间 |
|------|------|------------|
| 前端严重 bug | Vercel Dashboard → Deployments → 选上一版本 → Promote | < 2 分钟 |
| 合约漏洞发现 | 调用 `GuildEscrow.pause()`，线下协商退款 | 立即 |
| 数据库数据异常 | Supabase → Backups → Point-in-time restore | < 15 分钟 |
| NFT 门控失效 | Claude 在 `AdminGuard` 恢复临时硬编码白名单 | < 5 分钟 |
| VCP 通胀失控 | 调用 VCPTokenV2 月度上限 setter，热钱包执行 | < 10 分钟 |

---

## Claude 绝对做不了的事（必须你亲自操作）

1. **生成/持有私钥** — 热钱包、多签
2. **Vercel/Alchemy/Supabase 控制台操作** — 需要你登录账号
3. **链上签名交易** — 合约部署、GuildEscrow 配置、Manifold 铸造、MINTER_ROLE 授权
4. **付款** — Alchemy 套餐、审计费用、Gas 费
5. **多签投票** — 任何需要多方签名的操作

---

*本方案基于代码状态 2026-03-15。阶段完成后请在对应 `[ ]` 打勾记录进度。*
