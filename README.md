# 财富自由之路 - 项目代码

> 个人财务管理软件，辅助实现财务自由

## 项目结构

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
│       │       ├── components/ # 通用组件
│       │       └── stores/   # Pinia 状态
│       ├── package.json
│       └── electron-builder.yml
│
├── packages/
│   └── shared/               # 共享代码
│       ├── types/            # TypeScript 类型
│       │   ├── user.ts
│       │   ├── account.ts
│       │   ├── debt.ts
│       │   ├── transaction.ts
│       │   ├── goal.ts
│       │   └── dream.ts
│       └── utils/            # 计算逻辑
│           ├── netWorth.ts   # 净资产计算
│           ├── cashFlow.ts   # 现金流计算
│           ├── goals.ts      # 目标进度
│           └── ratios.ts     # 关键比率
│
├── package.json              # Monorepo 根配置
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 快速开始

```bash
# 进入项目目录
cd 财富自由之路/产品研发/code/wealth-freedom

# 启动应用（自动安装依赖+构建+运行）
pnpm dev
```

> 首次启动会自动安装依赖和构建共享包，可能需要几分钟。

## 核心功能

- **财务看板** - 净资产、现金流、关键比率一目了然
- **三阶段目标** - 财务保障 → 财务安全 → 财务自由
- **账户管理** - 多账户、多币种支持
- **负债管理** - 债务追踪、还款计划
- **交易记录** - 快速记账、分类统计
- **梦想图册** - 可视化财务自由梦想

## 技术栈

- **框架**: Electron + Vue 3
- **UI**: Element Plus
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: Pinia
- **图表**: ECharts

## 开发进度

| 模块 | 状态 |
|------|------|
| 项目初始化 | ✅ 完成 |
| 类型定义 | ✅ 完成 |
| 计算逻辑 | ✅ 完成 |
| SQLite 表结构 | ✅ 完成 |
| 主进程框架 | ✅ 完成 |
| IPC 通信层 | ✅ 完成 |
| 渲染进程页面 | ✅ 完成 |
| 用户引导流程 | ✅ 完成 |
| 功能测试 | ⏳ 待进行 |
| 性能优化 | ⏳ 待进行 |

---

**下一步**: 启动应用，测试各页面功能，然后填写真实财务数据
