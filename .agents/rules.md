# Super Guild 项目专用规则

## 环境变量清单

本项目的所有密钥和 API Key 存储在 `.env.local` 中，以下是各变量的用途：

| 变量名 | 用途 | 来源 |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 (前端用) | 同上 |
| `SUPABASE_DB_URL` | Supabase PostgreSQL 直连 URL (脚本用) | Supabase → Settings → Database |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud 项目 ID | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_ALCHEMY_ID` | Alchemy API Key (Base Sepolia RPC) | [alchemy.com](https://dashboard.alchemy.com) |

## 当前值 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL="https://zrwyfcdnbfqkbsatwodc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyd3lmY2RuYmZxa2JzYXR3b2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDI3MTEsImV4cCI6MjA4NzM3ODcxMX0.CHNMfujr4olijNh4Jk82h5ddG7GT2Nwn6JOrkt2xNHc"
SUPABASE_DB_URL="postgresql://postgres:Lan%40tsinghua911926@db.zrwyfcdnbfqkbsatwodc.supabase.co:5432/postgres"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="560040b222a7d91bc6b79fcde9b4547a"
NEXT_PUBLIC_ALCHEMY_ID="V0CmRQQ4s0wKmr6J1XD5q"
```

## 链配置

- **主要测试网**: Base Sepolia
- **生产链**: Polygon
- **RPC**: Alchemy (Base Sepolia), 公共 RPC (其他链)
- **钱包**: MetaMask, Rainbow, WalletConnect, Trust Wallet

## Supabase 项目信息

- **项目 Ref**: `zrwyfcdnbfqkbsatwodc`
- **数据库密码**: `Lan@tsinghua911926` (URL 编码: `Lan%40tsinghua911926`)
- **Region**: 根据 Supabase Dashboard 查看
- **SQL Editor**: <https://supabase.com/dashboard/project/zrwyfcdnbfqkbsatwodc/sql>

## 开发约定

1. 所有前端代码遵循 **Antigravity 设计语言** (详见 `globals.css`)
2. 颜色系统: `#F8F9FC` (bg) / `#121317` (heading) / `#45474D` (body) / `#6A6A71` (muted)
3. 按钮统一使用 `ag-btn-primary` / `ag-btn-secondary` / `ag-tab`
4. 卡片统一使用 `ag-card` class
5. 全站使用 Material Symbols Outlined 图标
6. 中文为主要界面语言
7. 数据层使用 React Query (`@tanstack/react-query`) + Supabase client
8. 钱包操作使用 Wagmi v3 hooks
