# 💰 财富自由之路 (Wealth Freedom)

> 个人财务管理软件，辅助实现财务自由 - 从保障到安全再到自由

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS-blue.svg)](https://github.com/petterobam/wealth-freedom/releases)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)](https://github.com/petterobam/wealth-freedom/releases)
[![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-green.svg)](https://github.com/petterobam/wealth-freedom/releases/tag/v0.1.0)

## ✨ 核心功能（v0.1.0）

### 🎯 资产配置可视化工具

基于科学资产配置理论，帮助用户在不同财务阶段选择最佳投资组合。

**三大财务阶段配置**：
- 🟢 **财务保障**：100% 低风险，快速积累 6-12 个月储备金
- 🟡 **财务安全**：30% 低 + 50% 中 + 20% 高，靠投资利息覆盖日常支出
- 🔴 **财务自由**：20% 低 + 40% 中 + 40% 高，靠利息实现梦想生活

**核心功能**：
- ✅ 智能推荐：根据财务阶段自动推荐配置比例
- ✅ 交互式调整：拖动滑块自定义配置，实时预览风险与收益
- ✅ 多维可视化：饼图（资产分布）+ 雷达图（风险/收益评估）+ 增长曲线（未来预测）
- ✅ 一键导出 PDF：生成专业配置报告，便于分享和存档
- ✅ 离线使用：所有数据本地存储，保护隐私

**截图预览**：
![资产配置工具](https://github.com/petterobam/wealth-freedom/releases/download/v0.1.0/asset-allocation-preview.png)

## 🚀 快速开始

### 下载安装包

- **macOS (Intel/M1/M2)**: [下载 DMG (117MB)](https://github.com/petterobam/wealth-freedom/releases/download/v0.1.0/Wealth-Freedom-0.1.0-arm64.dmg)
- **Windows**: 即将发布

### 从源码运行

```bash
# 克隆仓库
git clone https://github.com/petterobam/wealth-freedom.git
cd wealth-freedom

# 安装依赖（需要 Node.js 18+）
pnpm install

# 启动开发环境
pnpm dev

# 打包应用
pnpm build
```

## 🛠️ 技术栈

- **框架**: Electron 31 + Vue 3.5
- **UI 库**: Element Plus 2.9
- **数据库**: SQLite (better-sqlite3 11)
- **状态管理**: Pinia 2.3
- **图表库**: ECharts 5.6
- **构建工具**: Vite 6 + electron-builder 25
- **语言**: TypeScript 5.8

## 📁 项目结构

```
wealth-freedom/
├── apps/
│   └── desktop/              # Electron 桌面应用
│       ├── src/
│       │   ├── main/         # 主进程
│       │   │   ├── index.ts  # 入口文件
│       │   │   └── database.ts # SQLite 初始化
│       │   └── renderer/     # 渲染进程（Vue）
│       │       ├── views/    # 页面组件
│       │       │   └── AssetAllocation.vue  # 资产配置工具
│       │       ├── components/ # 通用组件
│       │       └── stores/   # Pinia 状态
│       ├── package.json
│       └── electron-builder.yml
│
├── packages/
│   └── shared/               # 共享代码
│       ├── types/            # TypeScript 类型
│       └── utils/            # 计算逻辑（复利、资产配置等）
│
├── package.json              # Monorepo 根配置
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 📊 开发进度

| 模块 | 状态 |
|------|------|
| 项目初始化 | ✅ 完成 |
| 类型定义 | ✅ 完成 |
| 计算逻辑 | ✅ 完成 |
| SQLite 表结构 | ✅ 完成 |
| 主进程框架 | ✅ 完成 |
| IPC 通信层 | ✅ 完成 |
| 渲染进程页面 | ✅ 完成 |
| 资产配置工具 | ✅ 完成 |
| UI/UX 优化 | ✅ 完成 |
| 导出功能 | ✅ 完成 |
| 性能测试 | ✅ 完成 |
| 功能测试 | ✅ 完成 |
| macOS 打包 | ✅ 完成 |
| Windows 打包 | ⏳ 进行中 |
| 文档完善 | ✅ 完成 |

## 🎯 功能路线图

### v0.2.0（计划中）
- [ ] 配置历史记录
- [ ] 配置对比功能
- [ ] 更多可视化图表

### v1.0.0（远期规划）
- [ ] 记账功能
- [ ] 目标追踪
- [ ] 财务看板
- [ ] 投资收益分析

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📝 更新日志

### [0.1.0] - 2026-03-30

**新增**：
- ✨ 资产配置可视化工具
- ✨ 三大财务阶段配置推荐
- ✨ 交互式滑块调整
- ✨ 多维可视化（饼图 + 雷达图 + 增长曲线）
- ✨ 一键导出 PDF
- ✨ 配置数据本地存储

**优化**：
- 🎨 UI/UX 全面优化
- ⚡ 性能优化（Lighthouse 评分 95+）
- 🐛 修复图表导出问题
- 🐛 修复 Element Plus 废弃属性警告

## 📮 反馈与支持

- 🐛 [提交 Bug](https://github.com/petterobam/wealth-freedom/issues/new?template=bug_report.md)
- 💡 [功能建议](https://github.com/petterobam/wealth-freedom/issues/new?template=feature_request.md)
- 💬 [讨论区](https://github.com/petterobam/wealth-freedom/discussions)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=petterobam/wealth-freedom&type=Date)](https://star-history.com/#petterobam/wealth-freedom&Date)

---

**如果你觉得这个项目有用，请给一个 ⭐️ Star！**

📧 联系作者: [GitHub](https://github.com/petterobam) | [知乎](https://zhihu.com/people/oy6666) | [LinkedIn](https://linkedin.com/in/petterobam)
