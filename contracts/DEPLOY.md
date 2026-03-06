# GuildEscrow 部署指南

> 目标链：Arbitrum Sepolia（Chain ID: 421614）
> 工具：Remix IDE（https://remix.ethereum.org）

---

## 准备参数

部署前确认以下三个地址：

| 参数 | 说明 |
|------|------|
| `_usdc` | MockUSDC 合约地址（先部署 Step 1） |
| `_treasury` | 协议国库地址（收取 10% 仲裁罚款，可以是你的多签钱包） |
| `_resolver` | 热钱包地址（负责 autoRelease + resolveDispute，需要保持在线） |

---

## Step 1：部署 MockUSDC

1. 打开 Remix，新建文件 `MockUSDC.sol`，粘贴合约代码
2. 安装 OpenZeppelin：Remix 插件栏 → OpenZeppelin → 安装 v5
3. Compiler 设置：
   - Version: `0.8.20`
   - EVM Version: `paris`（Arbitrum 兼容）
   - Optimization: `ON`, 200 runs
4. Environment 选择 `Injected Provider - MetaMask`，切换到 Arbitrum Sepolia
5. 部署 `MockUSDC`（无构造参数）
6. **保存部署地址**，填入：
   - `.env.local` → `NEXT_PUBLIC_MOCK_USDC=0x...`
   - `constants/contract-address.ts` → `MockUSDC['Arbitrum Sepolia']`

---

## Step 2：部署 GuildEscrow

1. 新建文件 `GuildEscrow.sol`，粘贴合约代码
2. 相同编译器配置
3. 展开构造参数，填入：
   ```
   _usdc:     <MockUSDC 地址>
   _treasury: <国库钱包地址>
   _resolver: <热钱包地址>
   ```
4. 部署
5. **保存部署地址**，填入：
   - `.env.local` → `NEXT_PUBLIC_GUILD_ESCROW=0x...`
   - `constants/contract-address.ts` → `GuildEscrow['Arbitrum Sepolia']`

---

## Step 3：验证合约（可选但推荐）

在 Arbitrum Sepolia Blockscout 提交源码验证：
- https://sepolia.arbiscan.io

---

## Step 4：测试流程

使用 Remix 直接调用合约测试完整流程：

```
1. MockUSDC.mint(publisher_addr, 1000_000_000)   // 铸造 1000 USDC 给发布者
2. MockUSDC.approve(GuildEscrow_addr, 1000_000_000) // 发布者授权
3. GuildEscrow.deposit(collabId, worker_addr, [600_000_000, 400_000_000])
   // collabId 用 keccak256("test-collab-001") 的 bytes32 值
4. GuildEscrow.submitProof(collabId, 0, contentHash)  // worker 提交里程碑 0
5a. GuildEscrow.confirmMilestone(collabId, 0)          // publisher 确认 → 释放
5b. GuildEscrow.disputeMilestone(collabId, 0)          // publisher 争议 → 扣 10%
    GuildEscrow.resolveDispute(collabId, 0, true, false) // resolver 裁决 worker 胜
```

---

## Step 5：填入环境变量

`.env.local` 完整配置：

```bash
NEXT_PUBLIC_MOCK_USDC=0x...
NEXT_PUBLIC_GUILD_ESCROW=0x...
```

---

## collabId 转换规则（前端）

```ts
import { keccak256, toHex } from 'viem'

// 将 Supabase UUID 转为合约使用的 bytes32
function toCollabId(uuid: string): `0x${string}` {
  return keccak256(toHex(uuid))
}
```

---

## MilestoneStatus 枚举值映射

| 数值 | 状态 | 说明 |
|------|------|------|
| 0 | Locked | 资金已锁定，等待承接人提交凭证 |
| 1 | Submitted | 凭证已提交，7天倒计时进行中 |
| 2 | Settled | 已结算，USDC 已释放 |
| 3 | Disputed | 仲裁中（10% 已划入国库） |
| 4 | Cancelled | 已取消退款 |
