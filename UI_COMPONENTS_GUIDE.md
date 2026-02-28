# 🎨 SuperGuild UI 组件使用指南 (Tailwind v4 版)

本文档旨在指引开发者如何在 SuperGuild 项目中正确调用已归档的 UI 组件。所有组件均已从原生的 CSS/Styled-components 重写为 **React + Tailwind CSS v4** 格式，存储于 `.stitch-designs/components/` 目录下。

## 📁 目录结构

所有组件均位于：`./.stitch-designs/components/`

---

## 🏛️ 1. 燎原广场 (Ledger Square)

### [ProposalCard](./.stitch-designs/components/proposal-card.tsx)

* **使用场景**：议案联署、社区提议展示。
* **交互特性**：
  * `cursor-move`：支持拖拽排序（用于看板布局）。
  * `hover:shadow`：悬停时产生深度感，提示可点击/可交互。
* **建议方案**：配合议案状态（如：进行中、已上链）动态替换 `Govenance` 标签颜色。

## 🕵️ 2. 柴薪王座 (Pyre Throne)

### [AIThroneCard](./.stitch-designs/components/ai-throne-card.tsx)

* **使用场景**：AI 人格展示橱窗、英雄榜。
* **交互特性**：
  * `3D Perspective`：极具视觉冲击力的 3D 倾斜与浮出效果。
  * `Z-axis Movement`：悬停时文字与头像会沿 Z 轴抽离，产生“呼之欲出”的立体感。
* **建议方案**：在组件内预留的插槽中放入 AI 的 3D 直播形象或高质量头像。

## 📊 3. 任务结算 (Settlement)

### [RatingStars](./.stitch-designs/components/rating-stars.tsx)

* **使用场景**：协作完成后的 AI 评价或双方互评。
* **交互特性**：
  * `Particle Explosion`：星星悬停时有微粒炸裂效果动效。
  * `Glow & Shimmer`：选中状态下带有流动的辉光感。
* **建议方案**：根据用户评分的高低，动态调整星星颜色（4-5星可使用特殊的金色动效）。

## 📢 4. 任务公告 (Mission Board)

### [MissionAnnouncementCard](./.stitch-designs/components/mission-announcement-card.tsx)

* **使用场景**：首页任务流、新增任务公告。
* **交互特性**：
  * `Pop-up Button`：悬停时底部按钮平滑向上滑入，不遮挡内容。
  * `Shadow Transition`：整体卡片在悬浮时从扁平变为拟物化。
* **建议方案**：用于限时领取的任务，按钮文字可动态更改为 "Join Now" 或 "Claim Reward"。

## 🔄 5. 系统交互 (System Feedback)

### [UILoader](./.stitch-designs/components/ui-loader.tsx)

* **使用场景**：页面切换、API 异步请求、合约执行等待。
* **交互特性**：
  * `Rotation & Snake Path`：45度偏转，方块沿贪吃蛇路径循环。
* **建议方案**：建议配合全屏模糊遮罩使用，营造出高端的“后台处理中”质感。

### [SuccessToast](./.stitch-designs/components/success-toast.tsx)

* **使用场景**：承接任务成功、发布成功、签名成功等即时反馈。
* **交互特性**：
  * `Side Wave`：侧面带有可变动的波浪纹理，增加视觉灵活性。
* **建议方案**：配置自动消失（Auto-dismiss）逻辑，推荐显示时长为 3.5s。

### [CookieConsentCard](./.stitch-designs/components/cookie-consent-card.tsx)

* **使用场景**：隐私协议确认、新用户引导合规。
* **建议方案**：建议使用 `Fixed` 定位悬浮于页面左下角，并配合 `localStorage` 记录用户点击状态。

---

## 🛠️ 开发接入说明

1. **直接引用**：将对应的 `.tsx` 文件拷贝至 `components/` 正式目录下。
2. **样式支持**：本项目已内置 **Tailwind CSS v4**，无需额外配置即可继承所有动效类。
3. **依赖库**：以上重写版本已剔除了所有的 `styled-components` 依赖，纯原生零运行开销。

---
*Created by Antigravity AI - v5.0 Cleaner & UI Architect*
