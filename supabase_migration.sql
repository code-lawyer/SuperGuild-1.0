-- =============================================
-- SuperGuild 数据库迁移脚本
-- 运行方式：在 Supabase Dashboard → SQL Editor 执行
-- =============================================

-- ═══════════════════════════════════════════════
-- 1. 公告板系统
-- ═══════════════════════════════════════════════

-- 公告表
CREATE TABLE IF NOT EXISTS bulletins (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  is_pinned   BOOLEAN DEFAULT false,
  author      TEXT DEFAULT 'SuperGuild',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 公告附件表
CREATE TABLE IF NOT EXISTS bulletin_attachments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bulletin_id  UUID REFERENCES bulletins(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  file_size    BIGINT,
  mime_type    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略：所有人可读
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bulletins are viewable by everyone"
  ON bulletins FOR SELECT
  USING (true);

CREATE POLICY "Bulletin attachments are viewable by everyone"
  ON bulletin_attachments FOR SELECT
  USING (true);

-- 初始公告数据
INSERT INTO bulletins (title, content, category, is_pinned, author) VALUES
(
  '🎉 SuperGuild 正式上线',
  '欢迎来到 SuperGuild —— AI 时代的去中心化公会。

我们致力于消灭一切中间层，让劳动价值只属于个体。

作为拓世者计划的首批成员，你将享有以下特权：
- 免费获得 VCP 信用代币
- 提前体验所有核心服务
- 参与公会治理提案

加入我们，共同构建超级个体的未来。',
  'general',
  true,
  'SuperGuild 团队'
),
(
  '📋 服务中心全面升级',
  '服务中心已完成架构升级，现在包含三大板块：

1. **基础设施** —— 为超级个体打造的数字基座
2. **核心服务** —— 法律、财税、IP 保护等专业服务
3. **协同共创** —— 连接专家与机会的生态网络

所有服务方案均以 USDC 计价，通过链上支付完成激活。',
  'update',
  false,
  'SuperGuild 团队'
),
(
  '🏛️ 灯塔议会即将开放',
  '公会治理模块「灯塔议会」正在最终测试中，预计下月开放。

届时，持有 VCP 的公会成员将可以：
- 提交治理提案
- 对公会决策进行投票
- 参与仲裁庭的纠纷裁决

请确保你已领取 VCP，以便届时参与投票。',
  'event',
  false,
  'SuperGuild 团队'
);


-- ═══════════════════════════════════════════════
-- 2. 服务表扩展
-- ═══════════════════════════════════════════════

-- 新增字段
ALTER TABLE services ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES services(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDC';
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'hub';
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 更新现有数据的货币单位
UPDATE services SET currency = 'USDC' WHERE currency IS NULL OR currency = 'VCP';


-- ═══════════════════════════════════════════════
-- 3. 服务方案数据填充
-- 注意：如果已有数据，请先清除避免重复
-- DELETE FROM services;
-- ═══════════════════════════════════════════════

-- ── 频道1: 基础设施 ──
INSERT INTO services (channel, category, title, description, price, currency, icon, sort_order, unlock_type, payload_config, is_active) VALUES
(1, 'infrastructure', '超级个体基础作业规范', '个人信息去标记化SOP、高强度密码管理方案、基础硬件防火墙配置', 0, 'USDC', 'security', 1, 'ITEM', '{"type": "qr_contact"}', true),
(1, 'infrastructure', '数字游民进阶安全套装', '硬件防火墙方案与加密通讯指引，适用于全球移动办公场景', 0, 'USDC', 'vpn_lock', 2, 'ITEM', '{"type": "qr_contact"}', true),
(1, 'infrastructure', 'AI创业全流程合规指引', '数据出境、算法备案及伦理审查自查表，适用于AIGC相关创业项目', 0, 'USDC', 'smart_toy', 3, 'ITEM', '{"type": "qr_contact"}', true);

-- ── 频道2: 核心服务（父级） ──
INSERT INTO services (id, channel, category, title, description, price, currency, icon, sort_order, unlock_type, payload_config, is_active) VALUES
('a1000000-0000-0000-0000-000000000001', 2, 'specialized', '法律合规管理', '合同审查、股权架构设计与争议解决前置方案', 0, 'USDC', 'gavel', 1, 'CATEGORY', '{}', true),
('a1000000-0000-0000-0000-000000000002', 2, 'specialized', '财税统筹方案', '从记账报税到资金流转的全链路优化', 0, 'USDC', 'account_balance', 2, 'CATEGORY', '{}', true),
('a1000000-0000-0000-0000-000000000003', 2, 'specialized', 'IP防御计划', '知识产权布局与侵权风险防控体系', 0, 'USDC', 'verified_user', 3, 'CATEGORY', '{}', true),
('a1000000-0000-0000-0000-000000000004', 2, 'specialized', '跨境贸易模型', '跨境电商与海外业务拓展方案', 0, 'USDC', 'public', 4, 'CATEGORY', '{}', true),
('a1000000-0000-0000-0000-000000000005', 2, 'specialized', '自媒体运维', '多平台账号矩阵管理与内容合规审核', 0, 'USDC', 'live_tv', 5, 'CATEGORY', '{}', true);

-- ── 频道2: 核心服务（子方案） ──
INSERT INTO services (channel, category, title, description, price, currency, icon, sort_order, unlock_type, parent_id, payload_config, is_active) VALUES
-- 法律合规
(2, 'specialized', '基础合规方案', '合同模板库、基础股权架构设计和年度法律健康检查', 299, 'USDC', 'description', 1, 'ITEM', 'a1000000-0000-0000-0000-000000000001', '{"type": "redeem_code"}', true),
(2, 'specialized', '高级合规方案', '多法域合规架构、跨境交易审查、争议解决预案', 999, 'USDC', 'description', 2, 'ITEM', 'a1000000-0000-0000-0000-000000000001', '{"type": "redeem_code"}', true),
-- 财税统筹
(2, 'specialized', '国内税务优化', '利用税收优惠政策，合法降低税负', 199, 'USDC', 'receipt_long', 1, 'ITEM', 'a1000000-0000-0000-0000-000000000002', '{"type": "redeem_code"}', true),
(2, 'specialized', '离岸税务架构', '离岸公司设立、税收协定利用、全球税务合规', 599, 'USDC', 'receipt_long', 2, 'ITEM', 'a1000000-0000-0000-0000-000000000002', '{"type": "redeem_code"}', true),
-- IP防御
(2, 'specialized', '商标专利布局', '国内外商标注册、专利申请与维权策略', 399, 'USDC', 'shield', 1, 'ITEM', 'a1000000-0000-0000-0000-000000000003', '{"type": "redeem_code"}', true),
(2, 'specialized', '著作权保护方案', '作品登记、侵权监测与维权执行', 299, 'USDC', 'shield', 2, 'ITEM', 'a1000000-0000-0000-0000-000000000003', '{"type": "redeem_code"}', true),
-- 跨境贸易
(2, 'specialized', '关务合规方案', '商品归类、原产地规划与关税优化', 399, 'USDC', 'local_shipping', 1, 'ITEM', 'a1000000-0000-0000-0000-000000000004', '{"type": "redeem_code"}', true),
(2, 'specialized', '供应链优化', '海外仓布局、物流渠道优化与库存管理', 499, 'USDC', 'local_shipping', 2, 'ITEM', 'a1000000-0000-0000-0000-000000000004', '{"type": "redeem_code"}', true),
-- 自媒体运维
(2, 'specialized', '矩阵运营方案', '账号矩阵搭建、内容同步与数据分析', 199, 'USDC', 'analytics', 1, 'ITEM', 'a1000000-0000-0000-0000-000000000005', '{"type": "redeem_code"}', true),
(2, 'specialized', '内容合规审核', '敏感词检测、广告合规审查与风险预警', 149, 'USDC', 'analytics', 2, 'ITEM', 'a1000000-0000-0000-0000-000000000005', '{"type": "redeem_code"}', true);

-- ── 频道3: 协同共创 ──
INSERT INTO services (channel, category, title, description, price, currency, icon, sort_order, unlock_type, payload_config, is_active) VALUES
(3, 'consulting', '自媒体顾问', '平台算法解读与爆款内容策略指导 —— 张媒体 (资深自媒体策略顾问)', 99, 'USDC', 'campaign', 1, 'ITEM', '{"type": "calendly"}', true),
(3, 'consulting', '区块链技术支援', '智能合约审计与DeFi协议安全评估 —— 李链上 (区块链安全研究员)', 149, 'USDC', 'code', 2, 'ITEM', '{"type": "calendly"}', true),
(3, 'consulting', '一级市场投手', '项目尽调方法论与估值模型构建 —— 王投手 (早期投资合伙人)', 199, 'USDC', 'trending_up', 3, 'ITEM', '{"type": "calendly"}', true);


-- ═══════════════════════════════════════════════
-- 4. Supabase Storage 桶（需在 Dashboard 手动创建）
-- ═══════════════════════════════════════════════
-- 名称: bulletin-files
-- 访问: 公开读取
-- 上传限制: 10MB
-- 说明: 通过 Supabase Dashboard → Storage → 新建桶
