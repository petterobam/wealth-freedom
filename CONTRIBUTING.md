# Contributing to Wealth Freedom 🤝

Thank you for your interest in contributing! We welcome all forms of contribution.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/wealth-freedom.git`
3. Install dependencies: `pnpm install`
4. Start dev server: `pnpm dev`
5. Make your changes
6. Submit a Pull Request

## 🛠️ Tech Stack

- **Desktop**: Electron 35 + Vue 3 + TypeScript
- **Database**: better-sqlite3 (local-first)
- **Charts**: ECharts + Recharts
- **Build**: electron-vite + electron-builder
- **Web** (companion): Next.js 16 + Prisma

## 📋 Ways to Contribute

### 🐛 Bug Reports
- Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include reproduction steps and screenshots

### 💡 Feature Requests
- Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain the use case, not just the solution

### 🌍 Translations
- Add a new locale in `src/renderer/src/locales/`
- Follow the existing `zh-CN.ts` / `en-US.ts` structure

### 📝 Documentation
- Fix typos, improve clarity
- Add examples or tutorials

## 🏗️ Project Structure

```
wealth-freedom/
├── src/
│   ├── main/           # Electron main process
│   │   ├── db/         # SQLite database layer
│   │   ├── handlers/   # IPC handlers
│   │   └── services/   # Business logic
│   ├── preload/        # Bridge between main & renderer
│   └── renderer/       # Vue 3 frontend
│       ├── src/
│       │   ├── views/  # 29 feature views
│       │   ├── composables/  # Vue composables
│       │   ├── locales/      # i18n (zh-CN, en-US)
│       │   └── components/   # Shared components
├── apps/
│   └── web/            # Next.js companion app
└── package.json
```

## ✅ Pull Request Checklist

- [ ] Code compiles without errors (`pnpm build`)
- [ ] Follow existing code style
- [ ] Add meaningful commit messages
- [ ] Update documentation if needed

## 💬 Community

- [GitHub Discussions](https://github.com/petterobam/wealth-freedom/discussions) - Questions and ideas

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
