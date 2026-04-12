# 贡献指南

感谢你对财富自由之路项目的关注！我们欢迎任何形式的贡献。

## 🤝 如何贡献

### 报告 Bug

如果你发现了 Bug，请先检查 [Issues](https://github.com/oyjie/wealth-freedom/issues) 是否已经有人报告过。如果没有请新建 Issue。

报告 Bug 时请提供：

- 📌 **描述**：清晰简洁地描述 Bug
- 🔄 **复现步骤**：如何触发这个 Bug
- 🎯 **预期行为**：你期望发生什么
- 📸 **截图/录屏**：如果可能，提供截图或录屏
- 💻 **环境信息**：
  - 操作系统（macOS / Windows / Linux）
  - 应用版本
  - Node.js 版本（如果是开发环境）

### 功能建议

如果你有新功能建议，请在 [Issues](https://github.com/oyjie/wealth-freedom/issues) 中提交，并描述：

- 📌 **功能描述**：这个功能是什么
- 🎯 **使用场景**：为什么需要这个功能
- 💡 **可能的实现方案**：如果你有想法的话

### 提交代码

我们欢迎提交代码！请按照以下步骤：

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wealth-freedom.git
   cd wealth-freedom
   ```

3. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或者修复 Bug
   git checkout -b fix/your-bug-fix
   ```

4. **进行修改**
   - 遵循现有的代码风格
   - 添加必要的注释
   - 更新相关文档

5. **提交修改**
   ```bash
   git add .
   git commit -m "feat: 添加你的功能描述"
   # 或者修复 Bug
   git commit -m "fix: 修复 Bug 描述"
   ```

6. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 GitHub 上点击 "New Pull Request"
   - 清晰描述你的修改内容
   - 等待 Code Review

## 📝 代码规范

### Commit Message 格式

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（既不是新功能也不是 Bug 修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat(asset-allocation): 添加配置历史记录功能

实现配置历史的存储和查询功能，支持：
- 保存每次配置修改
- 历史记录列表展示
- 配置对比功能

Closes #123
```

### 代码风格

- **TypeScript**: 使用 TypeScript 严格模式
- **Vue**: 遵循 Vue 3 风格指南
- **ESLint**: 运行 `pnpm lint` 检查代码
- **Prettier**: 运行 `pnpm format` 格式化代码

### 测试

提交代码前，请确保：
- ✅ 本地测试通过
- ✅ 新功能添加测试
- ✅ 修改不影响现有功能

## 🧪 开发环境设置

```bash
# 安装依赖
pnpm install

# 启动开发环境
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 📚 项目结构

```
wealth-freedom/
├── apps/
│   └── desktop/              # Electron 桌面应用
│       ├── src/
│       │   ├── main/         # 主进程
│       │   └── renderer/     # 渲染进程（Vue）
│       └── package.json
│
├── packages/
│   └── shared/               # 共享代码
│       ├── types/            # TypeScript 类型
│       └── utils/            # 计算逻辑
│
└── package.json
```

## 🎯 开发优先级

我们目前优先处理以下功能：

1. **Bug 修复**
2. **用户体验优化**
3. **性能优化**
4. **新功能（按需求优先级）**

如果你不确定要做什么，可以查看 [Good First Issue](https://github.com/oyjie/wealth-freedom/issues?q=is%3Aissue+is%3Aopen+label%3A"good+first+issue") 标签的 Issue。

## 💬 交流

- 💬 [GitHub Discussions](https://github.com/oyjie/wealth-freedom/discussions) - 功能讨论、问题交流
- 🐛 [GitHub Issues](https://github.com/oyjie/wealth-freedom/issues) - Bug 报告、功能建议
- 📧 邮箱: [1460300366@qq.com]

## 📄 开源协议

通过贡献代码，你同意你的贡献将采用本项目相同的 [MIT License](LICENSE) 开源协议。

---

感谢你的贡献！🎉
