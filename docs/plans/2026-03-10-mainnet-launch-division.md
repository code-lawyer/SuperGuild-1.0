# SuperGuild 主网上线分工表
> 生成日期：2026-03-10
> 说明：**🧑 = 必须由你本人操作**（涉及私钥、资产、账号权限）/ **🤖 = Claude 可直接执行**（代码改动、文档更新、构建验证）

---

## 阶段一：准备期（D-7 前完成）

| # | 任务 | 负责人 | 操作说明 | 完成？ |
|---|------|--------|----------|--------|
| 1.1 | 生成主网热钱包私钥 | 🧑 你 | 使用 MetaMask/Ledger 生成全新钱包，绝不复用测试网私钥 | [ ] |
| 1.2 | 创建国库多签钱包 | 🧑 你 | 推荐 Safe (Gnosis)，3-of-5 签名，记录多签地址 | [ ] |
| 1.3 | 热钱包充 ETH（Arbitrum One） | 🧑 你 | 约 0.05 ETH 用于 VCP mint Gas；不够则补充 | [ ] |
| 1.4 | 注册主网 Alchemy App | 🧑 你 | 在 Alchemy Dashboard 创建 Arbitrum One + ETH Mainnet App，获取 API Key | [ ] |
| 1.5 | 在 Vercel 配置主网环境变量（模板见 1.6） | 🧑 你 | Settings → Environment Variables，逐项填入（见下方清单） | [ ] |
| 1.6 | Claude 生成 Vercel 环境变量模板 | 🤖 Claude | 按需生成填写模板，你只需替换实际值 | ✅ |
| 1.7 | 合约审计委托（可选但建议） | 🧑 你 | 联系 OpenZeppelin / Certik，提交 GuildEscrow.sol + VCPTokenV2 | [ ] |

**Vercel 主网环境变量清单（你需填入实际值）：**
```
NEXT_PUBLIC_PRIMARY_CHAIN_ID=42161
NEXT_PUBLIC_PRIVILEGE_CHAIN_ID=1
NEXT_PUBLIC_ALCHEMY_ID=<主网 Alchemy API Key>
NEXT_PUBLIC_SERVICE_TREASURY=<国库多签地址>
NEXT_PUBLIC_DEV_MOCK_NFTS=false          ← 关闭 mock，不写则默认 false
HOT_WALLET_PRIVATE_KEY=<全新热钱包私钥>   ← Vercel 服务端环境变量（不含 NEXT_PUBLIC_）
SUPABASE_SERVICE_ROLE_KEY=<生产 key>
SUPABASE_URL=<生产 URL>
NEXT_PUBLIC_SUPABASE_URL=<生产 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<生产 anon key>
OPENAI_API_KEY=<正式账单 key>
```

---

## 阶段二：合约部署（D-5 前完成）

| # | 任务 | 负责人 | 操作说明 | 完成？ |
|---|------|--------|----------|--------|
| 2.1 | 部署 GuildEscrow 到 Arbitrum One | 🧑 你 | Hardhat/Foundry deploy，记录合约地址 | [ ] |
| 2.2 | 部署 VCPTokenV2 UUPS Proxy 到 Arbitrum One | 🧑 你 | 记录 proxy 地址和 implementation 地址 | [ ] |
| 2.3 | 部署 MedalNFT 到 Arbitrum One | 🧑 你 | 记录合约地址 | [ ] |
| 2.4 | 在 GuildEscrow 配置 resolver + treasury | 🧑 你 | 调用 `setResolver(热钱包地址)`, `setTreasury(多签地址)` | [ ] |
| 2.5 | 在 Arbiscan/Etherscan 验证合约源码 | 🧑 你 | `npx hardhat verify --network arbitrum <address>` | [ ] |
| 2.6 | 在主网 Manifold 铸造 Privilege NFT | 🧑 你 | 确保 Token #1-#5 在 Ethereum Mainnet 可查询 | [ ] |
| 2.7 | 将主网合约地址填入代码常量 | 🤖 Claude | 更新 `constants/contract-address.ts` + `nft-config.ts` + `nft-config.ts` MOCK_USDC → Circle USDC | [ ] |
| 2.8 | 将 DirectPay 部署到 Arbitrum One | 🧑 你 | 记录地址后通知 Claude 更新 `direct-pay-config.ts` | [ ] |

**主网合约地址记录模板（部署后填入告知 Claude）：**
```
VCPTokenV2 Proxy:  0x...
MedalNFT:          0x...
GuildEscrow:       0x...
DirectPay:         0x...
Circle USDC (固定): 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

---

## 阶段三：代码切换（D-3，Claude 主导）

| # | 任务 | 负责人 | 操作说明 | 完成？ |
|---|------|--------|----------|--------|
| 3.1 | 更新 `constants/nft-config.ts` MOCK_USDC → Circle USDC | 🤖 Claude | 替换地址 + decimals | [ ] |
| 3.2 | 更新 `constants/direct-pay-config.ts` 主网地址 | 🤖 Claude | IS_MAINNET 分支填入新地址 | [ ] |
| 3.3 | 移除/隐藏 Admin Faucet 页面 | 🤖 Claude | 添加 `!IS_MAINNET` 守卫或删除路由 | [ ] |
| 3.4 | 执行 `pnpm build` 零错误验证 | 🤖 Claude | 确认 TypeScript + Lint 全部通过 | [ ] |
| 3.5 | Supabase RLS 迁移脚本生成 | 🤖 Claude | 生成 SQL 脚本供你在 Supabase 控制台执行 | [ ] |
| 3.6 | 执行 Supabase RLS 迁移 | 🧑 你 | 在 Supabase SQL Editor 执行 Claude 生成的脚本 | [ ] |
| 3.7 | Supabase Edge Function 部署更新 | 🤖 Claude | `supabase functions deploy vcp-indexer` | [ ] |

---

## 阶段四：预上线验证（D-1）

| # | 任务 | 负责人 | 操作说明 | 完成？ |
|---|------|--------|----------|--------|
| 4.1 | Vercel Preview 部署验证（主网 env） | 🧑 你 | 在 Vercel Preview URL 手动测试核心流程 | [ ] |
| 4.2 | NFT 门控验证（Admin / 仲裁庭 / Pioneer） | 🧑 你 | 用持有 Token #3/#4/#5 的钱包测试准入 | [ ] |
| 4.3 | USDC approve + DirectPay 流程测试 | 🧑 你 | 用小额 USDC 走完完整协作支付流程 | [ ] |
| 4.4 | GuildEscrow deposit → autoRelease 测试 | 🧑 你 | 创建协作，存款，等待或手动触发释放 | [ ] |
| 4.5 | VCP mint 冷却期验证 | 🧑 你 | 触发 VCP，确认防重刷逻辑正常 | [ ] |
| 4.6 | 生成部署验证检查表 | 🤖 Claude | 按实际部署情况生成最终 Go/No-Go 清单 | [ ] |

---

## 阶段五：上线日（D-Day）

| # | 任务 | 负责人 | 操作说明 | 完成？ |
|---|------|--------|----------|--------|
| 5.1 | 在 Vercel 切换 Production 环境变量 | 🧑 你 | 将 Preview 验证通过的主网变量提升为 Production | [ ] |
| 5.2 | 触发 Vercel Production 部署 | 🧑 你 | Push to main 或手动 Redeploy | [ ] |
| 5.3 | 监控 Vercel Runtime Logs（首1小时） | 🧑 你 | 关注 API 错误率，Alchemy 限流告警 | [ ] |
| 5.4 | 监控 Supabase 写入量和 RLS 拒绝日志 | 🧑 你 | Dashboard → Logs → 过滤 RLS deny | [ ] |
| 5.5 | 热钱包余额告警设置 | 🧑 你 | ETH < 0.01 时触发告警（Alchemy Notify 或 Tenderly） | [ ] |
| 5.6 | 上线公告文案生成 | 🤖 Claude | 按需生成中英双语公告稿 | [ ] |

---

## 阶段六：上线后运维（持续）

| # | 任务 | 负责人 | 操作说明 | 完成？ |
|---|------|--------|----------|--------|
| 6.1 | 定期补充热钱包 ETH | 🧑 你 | 每月检查，低于 0.05 ETH 补充 | 持续 |
| 6.2 | 国库多签签名 | 🧑 你 | 争议罚金累积到一定量后，多签提取或再分配 | 持续 |
| 6.3 | Alchemy 用量监控 | 🧑 你 | 月度账单检查，超限升级套餐 | 持续 |
| 6.4 | Bug 修复 / 功能迭代代码变更 | 🤖 Claude | 正常 vibe coding 流程 | 持续 |
| 6.5 | 紧急回滚：Vercel 回滚到上一版本 | 🧑 你 | Vercel Dashboard → Deployments → 选上一个 → Promote | 备用 |
| 6.6 | 紧急回滚：GuildEscrow pause() | 🧑 你 | 合约 owner 调用 pause，冻结所有 deposit/release | 备用 |

---

## 快速参考：哪些事 Claude 绝对做不了

1. **生成/持有私钥** — 热钱包、多签 — 必须你在本地生成
2. **在 Vercel/Alchemy/Supabase 控制台点击操作** — 需要你登录账号
3. **链上签名交易** — 合约部署、GuildEscrow 配置、Manifold 铸造
4. **付钱** — Alchemy 升级套餐、审计费用、Gas 费
5. **多签投票** — 任何需要多方签名的操作

---

## 回滚方案速查

| 场景 | 回滚方式 | 操作者 |
|------|---------|--------|
| 前端严重 bug | Vercel Dashboard → 回滚上一部署（< 2 分钟） | 🧑 你 |
| 合约漏洞 | 调用 `pause()` 冻结合约，线下协商退款 | 🧑 你 |
| 数据库数据异常 | Supabase → Backups → Point-in-time restore | 🧑 你 |
| NFT 门控失效 | 临时在 `AdminGuard` 恢复硬编码白名单（Claude 改代码） | 🤖+🧑 |
| VCP 通胀失控 | 修改 VCPTokenV2 月度上限参数，热钱包调用 setter | 🧑 你 |
