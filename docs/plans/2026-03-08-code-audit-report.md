# SuperGuild 全项目代码审计报告

> **审计日期**: 2026-03-08
> **复核日期**: 2026-03-08（逐条核实，修正 3 条误伤、2 条降级）
> **审计范围**: 全部前端页面、hooks、API 路由、智能合约、配置文件、i18n、3D 组件
> **审计工具**: 三路并行代码审查（hooks+API、前端+组件、合约+配置）

---

## 🔴 CRITICAL（必须修复，存在安全漏洞或资产风险）

| # | 问题 | 文件 | 影响 | 复核状态 |
|---|------|------|------|----------|
| 1 | **加密密钥用了 `NEXT_PUBLIC_` 前缀** — 嵌入客户端 bundle，任何人可见 | `utils/encryption-server.ts:12` | 加密形同虚设 | ✅ 确认 |
| 2 | **vcp-indexer Webhook 无签名验证** — 任何人可 POST 伪造事件触发 VCP 铸造 | `supabase/functions/vcp-indexer/index.ts` | 无限铸造 VCP | ✅ 确认 |
| ~~3~~ | ~~`useConfirmMilestone` 无权限校验~~ | ~~`hooks/useCollaborations.ts`~~ | ~~资金被非授权释放~~ | ❌ **误伤** — 合约有 `onlyPublisher` modifier，安全边界在链上 |
| ~~4~~ | ~~`useCastDisputeVote` 无 NFT 校验~~ | ~~`hooks/useDisputeVotes.ts:127`~~ | ~~仲裁结果被操纵~~ | ❌ **误伤** — 仲裁庭页面有 `useNFTGate` 页面级门控 |
| 5 | **pioneer/claim 幂等保护有竞态窗口** — DB 层有检查但并发请求可绕过 | `app/api/pioneer/claim/route.ts` | VCP 超发（低概率） | ⚠️ 部分成立，建议加 `SELECT ... FOR UPDATE` |

---

## 🟠 HIGH（上线前必须处理）

| # | 问题 | 文件 | 影响 | 复核状态 |
|---|------|------|------|----------|
| 6 | **TypeScript `ignoreBuildErrors: true`** — 所有类型错误被静默忽略 | `next.config.mjs:22` | 类型漏洞进入生产 | ✅ 确认（从 CRITICAL 降级） |
| 7 | **Admin 两个页面 30+ 处硬编码英文** — 违反 i18n 红线 | `app/admin/bulletins/page.tsx`, `services/page.tsx` | 中文用户看到英文 | ✅ 确认 |
| 8 | **`window.confirm()` 硬编码英文** — 删除确认弹窗无法本地化 | bulletins:92, services:116 | UX 断裂 | ✅ 确认 |
| 9 | **profile 页面硬编码 tab** — `'All', 'Development', 'Design'` | `app/profile/page.tsx:147` | i18n 违规 | ✅ 确认 |
| 10 | **所有 API 路由无 rate limiting** — 暴力破解/DoS | `/api/pioneer/claim`, `/api/profile/sign` | 服务拒绝 | ✅ 确认 |
| 11 | **`useNFTGate` 硬编码 `sepolia.id`** — 未使用 `PRIVILEGE_CHAIN_ID` | `hooks/useNFTGate.ts:41` | 主网迁移时 NFT 门控失效 | ✅ 确认 |
| 12 | **合约地址定义在两处** — `contract-address.ts` 和 `nft-config.ts` 可能不同步 | `constants/` | 调用错误合约 | ✅ 确认 |
| ~~13~~ | ~~3D 材质未 dispose~~ | ~~`components/3d/BadgeModel.tsx`~~ | ~~性能退化~~ | ❌ **误伤** — R3F `useGLTF` 自动管理生命周期 |
| 14 | **无 CSP/安全响应头** | `next.config.mjs` | XSS/点击劫持风险 | ✅ 确认 |
| 15 | **ESLint `ignoreDuringBuilds: true`** — lint 告警不阻断构建 | `next.config.mjs:19` | 代码质量无保障 | ✅ 确认 |

---

## 🟡 MEDIUM（应修复，影响稳定性/性能）

| # | 问题 | 文件 |
|---|------|------|
| 16 | **BadgeWall 多个 Canvas 实例** — 持有 N 枚勋章就创建 N 个 WebGL 上下文 | `BadgeWall.tsx` |
| 17 | **useVCP 实时订阅清理不完整** — 组件卸载时可能泄漏 channel | `hooks/useVCP.ts:70-86` |
| 18 | **useSyncProfile 竞态条件** — async 失败后 `hasSynced` 已被置 true，不再重试 | `hooks/useSyncProfile.ts:32` | ⚠️ 部分成立 |
| 19 | **useCollaborations `.or()` 拼接无输入校验** — 地址直接拼入查询字符串 | `hooks/useCollaborations.ts:61` |
| 20 | **useNotifications 15 秒轮询** — 千人在线时压垮 Supabase | `hooks/useNotifications.ts:36` |
| 21 | **pioneer/status 泄露邀请码** — 返回 `code` 字段，可被枚举 | `app/api/pioneer/status/route.ts:23` |
| 22 | **upload 路由无文件校验** — 无大小/MIME/扩展名限制 | `app/api/upload/route.ts` |
| 23 | **profile/sign 无 nonce/时间戳** — 签名可被重放 | `app/api/profile/sign/route.ts` |
| 24 | **useServices 假交易哈希** — mock tx hash 写入数据库 | `hooks/useServices.ts:88` |
| 25 | **useApproveProvider 无 initiator 身份校验** | `hooks/useCollaborations.ts:292` |
| 26 | **PII 明文存储** — `contact_email`/`contact_telegram` 未加密 | `hooks/useProfile.ts` |
| 27 | **多处 `as any` 类型断言** — 4+ 处类型安全缺失 | `useProfile.ts`, `useProposals.ts` |
| 28 | **无 Error Boundary** — 3D 组件崩溃会白屏 | profile/page, collaborations/[id] |
| 29 | **仲裁庭 chief 路由使用 mock 数据** — 硬编码地址而非链上查询 | `app/api/council/arbitration/chief/route.ts` |
| 30 | **`waitForTransactionReceipt` 无超时** — RPC 慢时可能永久挂起 | `hooks/useGuildEscrow.ts:98` |
| 31 | **approve + deposit 非原子操作** — approve 成功 deposit 失败时授权残留 | `hooks/useGuildEscrow.ts:76` |

---

## 🟢 LOW（可优化，不紧急）

| # | 问题 | 文件 |
|---|------|------|
| 32 | WalletConnect projectId 硬编码 fallback | `providers/config.ts:23` |
| 33 | icon-only 按钮缺少 `aria-label` | 多处 |
| 34 | BadgeWall `setTimeout` 无 cleanup | `BadgeWall.tsx:64` |
| 35 | useProfileStats 三次 Supabase 查询可合并 | `hooks/useProfile.ts:162` |
| 36 | `useSBTs.ts` hook 已废弃但未删除 | `hooks/useSBTs.ts` |
| 37 | `useProposals` 自动 delegate 无明确用户确认 | `hooks/useProposals.ts:375` |

---

## 正面发现（做得好的地方）

- GuildEscrow 合约：SafeERC20 + ReentrancyGuard + Ownable2Step + 完整事件日志
- NFT 门控体系：hook 设计合理，跨链查询正确
- i18n 核心系统：TypeScript 类型约束保证中英结构一致
- 3D 模型尺寸归一化：`computeNormalizedScale` 解决了模型尺寸差异问题
- Chain config 集中管理：`chain-config.ts` 设计良好
- Escrow 状态机设计完整：deposit → submit → confirm/dispute → settle 流程清晰

---

## 修复优先级建议

1. **第一轮（CRITICAL）**: 修复 #1, #2, #5（3 条确认，2 条误伤已排除）
2. **第二轮（HIGH）**: 修复 #6-#12, #14-#15（#13 误伤已排除，#6 从 CRITICAL 降级）
3. **第三轮（MEDIUM）**: 逐步修复 #16-#31，可分多个 session
4. **第四轮（LOW）**: 有空时处理 #32-#37

---

*审计由 Claude Opus 4.6 执行，覆盖 hooks/、app/api/、app/admin/、components/3d/、constants/、contracts/、lib/i18n/、supabase/ 等全部目录。*

---

## 复核说明（2026-03-08）

逐条核实后修正：

- **#3 误伤**：`useConfirmMilestone` 无需前端权限校验 — GuildEscrow 合约 `confirmMilestone()` 有 `onlyPublisher` modifier，链上已保证只有发布者能调用。前端 hook 只是 UX 辅助。
- **#4 误伤**：`useCastDisputeVote` 无需 hook 层 NFT 校验 — 仲裁庭页面（`app/council/arbitration/`）已有 `useNFTGate(4)` 页面级门控，非持有者根本无法到达投票界面。
- **#13 误伤**：React Three Fiber 的 `useGLTF` hook 自动管理资源生命周期，组件卸载时 Three.js 资源由 R3F 内部回收，无需手动 dispose。
- **#5 降级**：有 DB 层 `claimed=true` 检查，但缺少行级锁，并发请求存在竞态窗口。建议改为 `SELECT ... FOR UPDATE` 或数据库唯一约束。
- **#6 降级**：`ignoreBuildErrors` 是开发便利性设置，不直接构成安全漏洞，从 CRITICAL 降为 HIGH。

**修正后统计**：CRITICAL 3 条 → HIGH 10 条 → MEDIUM 16 条 → LOW 6 条（原 37 条，排除 3 条误伤 = 34 条有效问题）
