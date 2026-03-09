# SuperGuild Testnet 测试方案

> **版本**: v1.0 · **日期**: 2026-03-09
> **环境**: Arbitrum Sepolia 测试网
> **测试目标**: Phase 10 核心功能全链路验证

---

## 一、测试前准备

### 1.1 测试人员需要准备的工具

| 工具 | 用途 | 获取方式 |
|------|------|----------|
| MetaMask 浏览器插件 | 钱包操作 | chrome.google.com/webstore |
| 测试网 ETH (Arbitrum Sepolia) | 支付 Gas | 见下方水龙头 |
| 测试网 USDC (MockUSDC) | 协作支付 | 平台 Admin Faucet 页面领取 |

### 1.2 网络配置（MetaMask 添加 Arbitrum Sepolia）

| 参数 | 值 |
|------|-----|
| 网络名称 | Arbitrum Sepolia |
| RPC URL | https://sepolia-rollup.arbitrum.io/rpc |
| Chain ID | 421614 |
| 货币符号 | ETH |
| 区块浏览器 | https://sepolia.arbiscan.io |

### 1.3 测试 ETH 水龙头

- https://faucet.triangleplatform.com/arbitrum/sepolia
- https://www.alchemy.com/faucets/arbitrum-sepolia

### 1.4 测试 USDC 领取

登录平台后访问 `/admin/faucet`（需要持有 Token #3 NFT，或由管理员代领后转账）。
每次可 Mint 10,000 MockUSDC 到自己钱包。

### 1.5 测试账户角色分工建议

| 角色 | 数量 | 职责 |
|------|------|------|
| 发布者（Publisher） | ≥ 2 | 创建协作、确认里程碑、发起仲裁 |
| 承接人（Worker） | ≥ 2 | 申请协作、提交凭证 |
| 管理员 | 1 | 持有 Token #3，访问 Admin 面板 |
| 仲裁员 | 1 | 持有 Token #4，参与仲裁投票 |
| Pioneer | 1 | 持有 Token #5，发布公告 |

---

## 二、测试范围总览

| 模块 | 优先级 | 状态 |
|------|--------|------|
| 钱包连接 & 身份 | P0 | ✅ 已实现 |
| 协作创建 & 申请 | P0 | ✅ 已实现 |
| 里程碑执行 & 结算（自行管理模式） | P0 | ✅ 已实现 |
| VCP 积分铸造 | P0 | ✅ 已实现 |
| NFT 门控（Admin / 仲裁庭 / Pioneer） | P1 | ✅ 已实现 |
| 万能中后台（服务购买） | P1 | ✅ 已实现 |
| 星火广场（公告 + 提案） | P1 | ✅ 已实现 |
| DAO 提案 & 投票 | P2 | ✅ 已实现 |
| 个人资料 & BadgeWall | P2 | ✅ 已实现 |

---

## 三、测试用例详情

---

### 模块 A：钱包连接 & 身份注册

**A-01：连接钱包**
```
前置条件: MetaMask 已安装，已切换到 Arbitrum Sepolia
步骤:
  1. 访问平台首页
  2. 点击右上角"连接钱包"
  3. 在 MetaMask 弹窗中授权
预期结果: 右上角显示钱包地址缩写，页面解锁各功能入口
```

**A-02：切换语言**
```
步骤: 点击右上角语言切换按钮，切换中/英
预期结果: 页面所有文字均正确翻译，无遗漏硬编码文本
```

**A-03：Profile 页面**
```
步骤:
  1. 访问 /profile
  2. 查看 VCP 余额、BadgeWall、协作历史
预期结果:
  - VCP 余额与链上一致
  - 持有 NFT 在 BadgeWall 中可见，未持有的不显示
  - 3D 模型正常加载（可旋转）
```

---

### 模块 B：协作全链路（自行管理模式）

> **这是 Phase 10 的核心测试模块，优先级最高**

**B-01：创建协作**
```
角色: 发布者
步骤:
  1. 访问 /collaborations/create
  2. 填写标题、描述
  3. 选择等级（建议测试 D 级：100 USDC，40 VCP）
  4. 支付模式选择"自行管理"
  5. 添加 ≥ 1 个里程碑（设置标题、金额占比）
  6. 提交创建
预期结果:
  - 协作出现在 /collaborations 列表
  - 状态为 OPEN
  - 里程碑正确显示
```

**B-02：申请协作**
```
角色: 承接人
步骤:
  1. 进入刚创建的协作详情页
  2. 点击"申请承接"，填写申请理由
  3. 提交申请
预期结果:
  - 协作状态变为 PENDING_APPROVAL
  - 发布者收到通知
```

**B-03：发布者批准申请**
```
角色: 发布者
步骤:
  1. 在协作详情页查看申请列表
  2. 点击批准对应承接人
预期结果:
  - 协作状态变为 ACTIVE
  - 承接人看到"已被选中"提示
```

**B-04：承接人提交凭证**
```
角色: 承接人
步骤:
  1. 在协作详情页，选择里程碑
  2. 点击"提交凭证"
  3. 添加外部链接（如 GitHub PR URL）或上传文件
  4. 确认提交
预期结果:
  - 里程碑状态变为 PENDING
  - 凭证记录显示在详情页
  - 发布者收到通知
```

**B-05：发布者直接支付（DirectPay 结算）**
```
角色: 发布者
步骤:
  1. 确认承接人提交的凭证
  2. 点击"确认并支付"对应里程碑
  3. 在 MetaMask 弹窗：
     a. 第一笔：Approve USDC 授权（允许 DirectPay 合约花费）
     b. 第二笔：Pay 交易确认
预期结果:
  - USDC 从发布者钱包转入承接人钱包
  - 里程碑状态变为 SETTLED
  - Arbiscan 可查到 Paid 事件
```

**B-06：VCP 铸造验证**
```
所有里程碑 SETTLED 后
步骤:
  1. 等待约 1-2 分钟（Alchemy Webhook → Edge Function 处理）
  2. 刷新承接人的 /profile 页面
预期结果:
  - VCP 余额增加（D 级 = +20 VCP，即 40 × 50% DirectPay 乘数）
  - vcp_settlements 表有对应记录（可在 Supabase Dashboard 查询）
```

**B-07：取消协作（含诚意金逻辑）**
```
角色: 发布者（在协作 ACTIVE 阶段）
步骤:
  1. 发布者在 ACTIVE 状态下取消协作
预期结果:
  - 协作状态变为 CANCELLED
  - UI 显示取消原因
注意: 自行管理模式无链上锁仓，此处仅测试状态机，无资金惩罚
```

---

### 模块 C：NFT 门控测试

**C-01：Admin 面板门控（Token #3）**
```
步骤:
  A. 用不持有 Token #3 的钱包访问 /admin
     预期: 拒绝访问，显示"需要 Token #3"提示
  B. 用持有 Token #3 的钱包访问 /admin
     预期: 正常进入 Admin 面板
```

**C-02：仲裁庭门控（Token #4）**
```
步骤:
  A. 不持有 Token #4 → 访问 /council/arbitration
     预期: 拒绝访问
  B. 持有 Token #4 → 访问 /council/arbitration
     预期: 可查看争议案卷、参与投票
```

**C-03：Pioneer 公告发帖门控（Token #5）**
```
步骤:
  A. 不持有 Token #5 → 访问 /bulletin，尝试发帖
     预期: 发帖按钮不可见或点击被阻止
  B. 持有 Token #5 → 可正常发布公告
     预期: 公告出现在列表
```

**C-04：BadgeWall 展示验证**
```
步骤: 用持有不同 NFT 的账户查看 /profile
预期:
  - 只有持有的 NFT 展示 3D 模型
  - 未持有的完全隐藏
  - GLB 模型正常加载（来自 Supabase Storage CDN）
```

---

### 模块 D：万能中后台（服务购买）

**D-01：浏览服务列表**
```
步骤: 访问 /services
预期: 服务以卡片形式展示，含频道分类（基础设施/核心服务/专家咨询）
```

**D-02：购买服务（链上支付）**
```
前置: 钱包有足够 MockUSDC
步骤:
  1. 选择一个服务，点击购买
  2. MetaMask 确认 USDC 支付交易
预期:
  - 支付成功后内容解锁（文档/下载/联系方式）
  - service_access 表有记录
```

**D-03：Admin 上架/编辑服务**
```
角色: Admin（Token #3 持有者）
步骤:
  1. 访问 /admin/services
  2. 创建新服务，填写频道、价格、内容
  3. 上架
预期: 服务出现在 /services 页面
```

---

### 模块 E：星火广场 & DAO 治理

**E-01：浏览公告**
```
步骤: 访问 /bulletin
预期: 公告列表正常加载，支持分页
```

**E-02：发布 DAO 提案**
```
前置: 持有任意 VCP
步骤:
  1. 访问 /council/proposals
  2. 点击"发布提案"
  3. 填写标题、内容、预期效果
  4. 提交
预期: 提案出现在列表，状态为联署中
```

**E-03：联署提案**
```
步骤: 其他 VCP 持有者对提案进行联署
预期: 联署数增加，达到门槛后状态变更
```

**E-04：投票（需要提案进入链上投票阶段）**
```
步骤:
  1. 进入一个已达到联署门槛的提案
  2. 点击赞成/反对
  3. MetaMask 确认签名或交易
预期: 投票记录写入，票重 = VCP 余额
```

---

### 模块 F：通知系统

**F-01：通知触发验证**
```
步骤: 执行以下操作，验证对方是否收到通知：
  - 他人申请你发布的协作 → 你应收到通知
  - 你的申请被批准 → 你应收到通知
  - 里程碑被确认 → 承接人收到通知
预期: 右上角通知铃有红点，点开看到对应消息
```

---

### 模块 G：反作弊机制验证

**G-01：VCP 冷却期**
```
步骤:
  1. 同一发布者+承接人组合，在 7 天内完成第二次协作结算
预期:
  - 第二次不铸造 VCP
  - vcp_settlements 有 skip_reason 记录（cooldown）
```

**G-02：月度上限**
```
步骤: 单地址累计铸造超过 1000 VCP/月
预期: 超出部分不铸造，有 monthly_cap 跳过记录
```

---

## 四、已知限制（测试人员需知）

| 限制 | 说明 |
|------|------|
| 公会托管模式不可用 | 创建协作时「公会托管」显示 Coming Soon，这是预期行为 |
| 仲裁庭 Chief Arbitrator 为 Mock 数据 | `/api/council/arbitration/chief` 还未接入真实链上查询 |
| VCP 有 1-2 分钟延迟 | Alchemy Webhook → Edge Function 处理有延迟 |
| Gas 费用较低但非零 | 测试网操作需要 Sepolia ETH，请提前从水龙头领取 |
| 7 天乐观释放仅公会托管模式生效 | 自行管理模式无托管，无乐观释放 |

---

## 五、Bug 报告模板

发现问题时，请按以下格式提交：

```
【Bug 报告】

模块: [例如：B-05 DirectPay 结算]
严重程度: 🔴 崩溃 / 🟠 功能异常 / 🟡 UI 问题 / 🟢 体验优化
钱包地址: 0x...
复现步骤:
  1.
  2.
  3.
实际结果:
预期结果:
截图/交易Hash:
```

---

## 六、测试数据速查

| 合约 | 地址 | 浏览器 |
|------|------|--------|
| GuildEscrow | `0x8828c3fe2f579a70057714e4034d8c8f91232a60` | [Arbiscan](https://sepolia.arbiscan.io/address/0x8828c3fe2f579a70057714e4034d8c8f91232a60) |
| DirectPay | `0xDc0f7BF5c7C026f8000e00a40d0f93a28c04bf65` | [Arbiscan](https://sepolia.arbiscan.io/address/0xDc0f7BF5c7C026f8000e00a40d0f93a28c04bf65) |
| MockUSDC | `0xdd0a2bf984d690c9cdd613603094d7455fc63e06` | [Arbiscan](https://sepolia.arbiscan.io/address/0xdd0a2bf984d690c9cdd613603094d7455fc63e06) |
| VCPTokenV2 | `0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C` | [Arbiscan](https://sepolia.arbiscan.io/address/0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C) |
| Privilege NFT | `0x46486Aa0aCC327Ac55b6402AdF4A31598987C400` | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x46486Aa0aCC327Ac55b6402AdF4A31598987C400) |

---

*本测试方案覆盖 Phase 10 全部已实现功能。Phase 11（Rhythm AI 接入）另行补充。*
