# 💰 Wealth Freedom

> 🖥️ An open-source personal finance desktop app — guiding you from financial security to financial freedom
>
> Three-stage wealth philosophy: **Security** → **Stability** → **Freedom**

[![Banner](docs/banner.png)](https://github.com/petterobam/wealth-freedom/releases/tag/v2.0.0)

[![Version](https://img.shields.io/badge/v2.0.0-blue?style=flat-square&label=Release)](https://github.com/petterobam/wealth-freedom/releases/tag/v2.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/macOS-arm64%20%7C%20x64-blue?style=flat-square&logo=apple)](https://github.com/petterobam/wealth-freedom/releases)

**[中文文档](./README.md)**

---

## ✨ Key Features (v2.0.0)

| Module | Feature | Description |
|--------|---------|-------------|
| 📊 **Dashboard** | Overview | Income/expense trends, net worth, top expenses, financial health at a glance |
| 💳 **Transactions** | Cash Flow | Income & expense tracking with categories, search, and filters |
| 🏦 **Accounts** | Assets | Multi-account asset management with portfolio overview & allocation pie chart |
| 🎯 **Goals** | Goal Tracking | Three-stage financial goals with progress visualization |
| 📋 **Budgets** | Budgeting | Monthly budget planning, execution tracking, overspend alerts |
| 📈 **Investments** | Portfolio | Holdings management, asset allocation, return calculations |
| 🔄 **Recurring** | Auto Transactions | Automate regular payments like rent, salary, subscriptions |
| 🤖 **AI Advisor** | AI Insights | Smart financial analysis & recommendations (Pro feature) |
| 💡 **Insights** | Analytics | Benchmark comparison analysis + achievement system |
| 🖥️ **Big Screen** | Data Viz | Full-screen dashboard with 6 ECharts widgets |
| 📄 **PDF Reports** | Reports | One-click professional financial report generation |
| 🔐 **Encryption** | Security | AES-256-GCM encryption for sensitive data |
| 🌍 **i18n** | Languages | Chinese / English bilingual support (all 29 views) |
| 💱 **Multi-Currency** | Currencies | Multi-currency management with base currency conversion |
| ⏰ **Auto Backup** | Backup | Startup backup + scheduled backups every 6 hours |
| 📥 **CSV Import** | Import | Alipay / WeChat / generic CSV format support |
| 🔑 **Licensing** | Plans | Free / Pro / Lifetime tiers with online activation |
| 🌐 **Web App** | PWA | Next.js 16 + PWA, mobile-friendly |

---

## 🚀 Quick Start

### Download

**[⬇️ Download from GitHub Releases](https://github.com/petterobam/wealth-freedom/releases/latest)**

- **macOS (Apple Silicon)**: `Wealth-Freedom-2.0.0-arm64.dmg` (111MB)
- **macOS (Intel)**: Coming soon
- **Windows / Linux**: Coming soon — track [#1](https://github.com/petterobam/wealth-freedom/issues/1)

### Build from Source

```bash
git clone https://github.com/petterobam/wealth-freedom.git
cd wealth-freedom

# Requires Node.js 22+ & pnpm
pnpm install

# Desktop dev server
pnpm dev

# Build DMG
cd apps/desktop && pnpm build
```

### Web App

```bash
cd apps/web
pnpm dev
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Electron 31 + Vue 3.5 + TypeScript 5.8 |
| **UI** | Element Plus 2.9 + ECharts 5.6 + Recharts |
| **State** | Pinia 2.3 |
| **Database** | SQLite (better-sqlite3 11) |
| **Build** | Vite 6 + electron-builder 25 |
| **Web** | Next.js 16 + React 19 + Tailwind CSS 4 + Prisma |
| **Backend** | Cloudflare Workers + D1 |
| **Testing** | Vitest + Playwright (41 E2E tests, all passing) |

---

## 💎 Pricing

| Feature | Free | Pro (¥19/mo) | Lifetime (¥399) |
|---------|------|--------------|-----------------|
| Transactions | ✅ | ✅ | ✅ |
| Budgets | ✅ (up to 3) | ✅ Unlimited | ✅ Unlimited |
| Investments | ✅ (up to 3) | ✅ Unlimited | ✅ Unlimited |
| AI Advisor | ❌ | ✅ 20/month | ✅ Unlimited |
| PDF Reports | ❌ | ✅ | ✅ |
| Data Encryption | ❌ | ✅ | ✅ |
| Big Screen | ❌ | ✅ | ✅ |

---

## 🗺️ Roadmap

- [x] v0.1–0.4 — Asset allocation, budgets, report export
- [x] v0.5–0.8 — Investments, dark mode, PDF reports
- [x] v0.9–1.0 — Subscription & license system
- [x] v1.1–1.2 — Auto-update, recurring transactions
- [x] v1.3–1.4 — AI advisor, insights & achievements
- [x] v1.5–1.6 — Web app, chart enhancements, sync API
- [x] v1.7–1.8 — Data viz dashboard, monetization infra, E2E tests
- [x] v1.9 — i18n, data encryption, multi-currency
- [x] v2.0 — Global error handling, GitHub Release 🎉
- [ ] v2.1+ — [Windows/Linux](https://github.com/petterobam/wealth-freedom/issues/1) · [Cloud Sync](https://github.com/petterobam/wealth-freedom/issues/2) · [Mobile](https://github.com/petterobam/wealth-freedom/issues/3) · [AI Deep Integration](https://github.com/petterobam/wealth-freedom/issues/4)

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork → 2. Feature Branch → 3. Commit → 4. Push → 5. PR

See [good first issues](https://github.com/petterobam/wealth-freedom/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) to get started.

## 📄 License

MIT License — free to use, modify, and distribute.

---

**Found it useful? Give it a ⭐️ Star!**

📧 [GitHub](https://github.com/petterobam) · [LinkedIn](https://linkedin.com/in/petterobam)
