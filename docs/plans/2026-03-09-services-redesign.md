# 万用中后台重构设计方案

**日期：** 2026-03-09
**状态：** 已批准，待实现

---

## 背景

现有三个频道（基础设施 / 专项服务 / 专家咨询）全部渲染在 `/services` 单页面，Header 用 hash anchor 区分。问题：

- 无法独立扩展各频道的交互逻辑
- 服务详情无专属视图
- 「激活」按钮无支付逻辑
- 专项服务和专家咨询的子项数量硬编码受限

---

## 路由结构

```
/services                    ← 入口页，展示三张频道卡片，无业务逻辑
/services/infrastructure     ← 基础设施（服务列表 + Modal 详情 + 支付）
/services/core               ← 专项服务（分类 → 解决方案列表 + Modal 详情）
/services/consulting         ← 专家咨询（分类 → 专家卡片列表 + Modal 详情）
```

Header 导航三个链接分别指向对应子路由（不再用 hash anchor）。

---

## 数据库变更

### 新增字段（`services` 表）

| 字段 | 类型 | 用途 |
|------|------|------|
| `expert_avatar_url` | `TEXT` | 专家头像 URL（channel=3 专用） |
| `expert_tags` | `TEXT[]` | 专家专长标签数组（channel=3 专用） |
| `price_usdc` | `NUMERIC` | 链上支付精确金额（channel=1 专用，替代 `price TEXT`） |

### channel 语义

| channel | parent_id | 含义 |
|---------|-----------|------|
| 1 | NULL | 基础设施服务包 |
| 2 | NULL | 专项服务分类 |
| 2 | NOT NULL | 分类下的解决方案子项 |
| 3 | NULL | 专家咨询分类 |
| 3 | NOT NULL | 分类下的具体专家 |

无需新增表，专家数据复用 `services` 表现有字段：
`title`（姓名）、`description`（简介）、`payload_config`（Calendly / 联系方式）。

---

## 各频道设计

### 频道 1 — 基础设施（`/services/infrastructure`）

- 列表展示所有 channel=1 服务包（卡片形式）
- 点击卡片 → 弹出 Modal 详情（名称、描述、价格、文档附件、激活按钮）
- **激活按钮**：调用 `MockUSDC.approve` + 合约写入（与 `service_access` 表联动）
- 已解锁服务显示「已激活」状态徽章

### 频道 2 — 专项服务（`/services/core`）

- 左侧/顶部分类导航（channel=2, parent_id=NULL）
- 右侧/下方展示该分类下所有解决方案（channel=2, parent_id=分类id）
- 点击解决方案 → 弹出 Modal 详情
- 支付方式：`payload_config` 决定（`qr_contact` / `redeem_code` / `calendly`）

### 频道 3 — 专家咨询（`/services/consulting`）

- 分类 Tab 切换（channel=3, parent_id=NULL）
- 每个分类展示该分类下所有专家卡片（头像、姓名、标签、简介摘要）
- 点击专家卡片 → 弹出 Modal 详情（完整简介 + 预约入口）
- 预约入口：`payload_config.calendly` URL 或联系方式
- 字段预留 `expert_tags`（专长标签）扩展，后期可加评分/案例

---

## Admin 面板变更（`/admin/services`）

现有管理页扩展以支持新字段：

1. **channel=1（基础设施）**：新增 `price_usdc` 数字输入框
2. **channel=3（专家）**：新增头像 URL 输入框 + 专长标签多选/输入
3. **分类/子项识别**：表单根据 `parent_id` 是否为空自动切换显示模式
4. 列表视图增加 channel 标签筛选，方便区分三类数据

---

## 组件结构（新增）

```
app/services/
  page.tsx                        ← 入口页（三张频道卡片）
  infrastructure/
    page.tsx                      ← 基础设施列表
  core/
    page.tsx                      ← 专项服务列表
  consulting/
    page.tsx                      ← 专家咨询列表

components/services/
  ServiceModal.tsx                ← 通用服务详情 Modal（含支付逻辑）
  ExpertModal.tsx                 ← 专家详情 Modal
  ChannelEntryCard.tsx            ← 入口页频道卡片
  InfraServiceCard.tsx            ← 基础设施服务卡片
  CoreCategoryNav.tsx             ← 专项服务分类导航
  CoreSolutionCard.tsx            ← 解决方案子项卡片
  ConsultingCategoryTab.tsx       ← 专家咨询分类 Tab
  ExpertCard.tsx                  ← 专家卡片
```

---

## 支付流程（基础设施频道）

```
用户点击「激活」
  → 检查钱包已连接 + 已签名 Auth
  → MockUSDC.approve(serviceContract, price_usdc)
  → 合约 purchaseService(serviceId, price_usdc)
  → 监听 ServicePurchased 事件 / 轮询 tx receipt
  → 写入 service_access 表（热钱包 server action）
  → Modal 内状态更新为「已激活」
```

> 主网上线前替换 MockUSDC → Circle USDC，合约地址通过 `nft-config.ts` 统一管理。

---

## i18n 要求

所有新增文案在 `lib/i18n/zh.ts` 和 `lib/i18n/en.ts` 同步添加，键名前缀：

```ts
services.entry.*        // 入口页
services.infra.*        // 基础设施
services.core.*         // 专项服务
services.consulting.*   // 专家咨询
```

---

## 不在本期范围内

- 专家评分 / 历史案例展示（字段预留，Phase 12 实现）
- 服务购买的链上智能合约（当前用热钱包 server action 写 service_access）
- 专家在线/离线状态实时显示
