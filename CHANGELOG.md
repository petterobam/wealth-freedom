# 更新日志

所有重要的更改都将记录在此文件中。

本文档格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [2.1.7] - 2026-05-07

### 新增
- 🔍 **自然语言数据查询引擎**：纯本地规则引擎，无需 API Key
  - 时间解析：今天/昨天/本周/本月/上月/今年/最近N个月
  - 意图识别：11种查询类型（收入/支出/分类/净资产/负债/目标等）
  - 中文分类关键词库：11个消费类别智能匹配
  - 自然语言回答：金额+占比+环比分析
  - AIAdvice.vue 新增「智能查询」Tab（快捷按钮+自由输入）
- 🏦 **招商银行+工商银行 CSV 导入器**：新增 CMB 和 ICBC 银行账单格式支持
- 📊 **财务自由三阶段倒计时**：Dashboard 新增保障→安全→自由进度+ETA
- 🎭 **Demo 数据增强**：3月→6月真实中文场景（~90笔交易，7账户，双十一/春节/涨薪）
- 🤖 **GitHub Actions CI**：自动构建+测试+发布工作流
- 📝 **Issue 模板 + FUNDING.yml**：社区基础设施
- 🪟 **Windows portable 支持**：新增免安装便携版（解决 NSIS 中文编码问题）

### 变更
- 📖 **README 全面优化**：0星阶段适配+"为什么选择我们"5点+社交徽章
- 🌐 **英文 README**：中英文互链，扩大国际曝光
- 🎨 **社交预览图+Banner**：GitHub 第一印象优化
- 🏷️ **README 动态徽章**：CI status + Downloads + Release 版本

### 修复
- 🐛 **Dev 模式 ESM/CJS bug**：shared+uuid 正确打包到主进程
- 🐛 **DMG 文件名修复**：中文 productName 导致文件名缺失前缀
- 🐛 **CI 构建修复**（6轮迭代）：权限+artifact glob+fail-fast+Windows NSIS
## [2.0.0] - 2026-05-04

### 新增
- 🛡️ **全局错误处理体系**：三阶段统一错误管理
  - ErrorBoundary 组件包裹 router-view，捕获渲染层未处理异常
  - setupGlobalHandlers 注册 unhandledrejection + window.onerror
  - safeCall 工具函数统一替代 ~40+ 处重复 try/catch
- 🔄 **safeCall 全面迁移**：14 个视图完成迁移
  - Transactions、Goals、Budget、Investment、Recurring、License、PdfReport、BigScreen、AIAdvice、IncomeOverview、IncomeStrategy、IncomeGoals、HealthScore、Report
  - 5 个视图保留有意义的 try/catch（Settings、Accounts、Dashboard 等）
- 🔧 **TypeScript 类型大修复**
  - global.d.ts 同步 preload（新增 backup/license/currency 等 40+ API 类型）
  - UserSettings 类型修复（Settings/Welcome/Transactions）
  - incomeHandlers 运行时 bug 修复
  - @types/better-sqlite3 + CSS 模块声明
- 🐛 **IncomeGoals.vue submitGoal 函数修复**

### 变更
- 🔧 版本号更新至 2.0.0

---

## [1.9.0] - 2026-05-03

### 新增
- 🌐 **i18n 多语言支持**：轻量级 i18n 系统（reactive + provide/inject，无 vue-i18n 依赖）
  - 中英文 locale 文件 + 侧边栏全面 i18n + 语言切换按钮
  - 全部 29 个视图页面完成 i18n 适配
  - Element Plus locale 联动
  - +171 个 locale key
- 💱 **多币种 Dashboard 集成**：useCurrency composable + Dashboard 基准币 badge + 多币种格式化
- 🔐 **数据加密服务**：AES-256-GCM + PBKDF2 密钥派生
  - encryptionService 完整实现
  - 11 个 IPC + preload 桥接 + 数据迁移
- 🔧 **Welcome.vue 类型修复**：AccountType/DebtType/GoalType 枚举 + 补全必填字段

### 变更
- 🔧 版本号更新至 1.9.0

---

## [1.8.0] - 2026-05-03

### 新增
- 🔑 **在线许可证验证**：Cloudflare Worker 服务端 + D1 数据库 + 客户端集成
  - 5 个 API 端点（激活/续期/验证/吊销/状态）
  - 离线降级策略：在线验证失败时回退本地验证
  - License.vue 在线激活 UI + 状态卡片 + 手动验证按钮
- 🧪 **测试基础设施**：Playwright E2E + Vitest 单元测试
  - database.spec.ts（16 个数据库业务测试）
  - license.spec.ts（10 个许可证逻辑测试）
  - E2E 框架：41/41 测试全部通过
- 📊 **真实数据对接**：CSV 导入器（支付宝/微信/通用格式）
  - 自动来源检测 + GBK 编码回退
  - 导入预览 + 去重逻辑
  - 3 个 IPC（selectFile/preview/execute）
- 🛠️ **管理员 CLI**：cli.mjs（generate/list/revoke/info/stats）
- 📄 **部署指南**：DEPLOY.md + 发布清单

### 变更
- 🔧 Preload 桥接新增 4 个在线验证 IPC
- 🔧 版本号更新至 1.8.0

---

## [1.7.0] - 2026-05-02

### 新增
- 📊 **数据可视化大屏**：BigScreen.vue 6 大卡片（ECharts）
  - 3×2 网格深色主题
  - 收支趋势/支出分类/预算进度/资产配置/目标进度/财务健康度
  - 自动轮播 + 三阶段进度 + 截图导出

---

## [1.6.0] - 2026-05-02

### 新增
- 🔗 **数据同步 API**：merge/overwrite 两种同步模式，桌面端↔云端数据对齐
- 📊 **Recharts 图表库深化**：6 个页面全面升级为交互式 Recharts 图表
  - `investments`：资产配置环形饼图 + 收益对比柱状图
  - `budgets`：预算分配饼图 + 预算 vs 实际支出柱状图
  - `transactions`：近 6 月月度收支趋势柱状图
  - `goals`：各目标完成/剩余水平堆叠柱状图
  - `health`：5 维财务健康度评分 + 三阶段进度 + 改善建议
  - `dashboard`：近 7 日收支柱状图 + 支出分类饼图 + 净资产趋势折线图
- 🚀 **Landing Page 升级**：版本 badge + 数据亮点卡片 + 技术栈展示 + CTA + 6 大功能介绍 + 三步之路增强
- 📦 **Seed 数据扩展**：6 个月 330 条真实感交易，储蓄率 73.7%
- 🌐 **Web 端 Prisma + SQLite 后端**：6 模型 schema + 10 个 API 路由 + NextAuth 认证
- 📱 **PWA 支持**：manifest + service worker + 安装到手机桌面
- 📱 **移动端底部导航栏**：5 项快捷导航

### 变更
- 🔧 设置页新增同步 UI（同步模式选择 + 状态显示）
- 🔧 Web 端所有页面从 localStorage 迁移到统一 API 客户端
- 🔧 清理过时 `apps/web` 目录，统一到 `web/` 顶层目录

## [1.5.0] - 2026-05-01

### 新增
- 🌐 **网页端完整实现**：Next.js 16 + Tailwind 4 + Prisma + SQLite
- 📡 **10 个 API 路由**：dashboard/transactions/accounts/budgets/goals/investments/reports/settings/auth/health
- 🔑 **NextAuth 认证**：凭证登录 + bcrypt 密码哈希
- 📊 **10 个页面**：Landing + 登录 + Dashboard + 交易 + 账户 + 目标 + 预算 + 投资 + 报告 + 设置
- 🔧 **统一 API 客户端**：lib/api.ts + lib/hooks.ts（React hooks + 轻量 SWR）

### 变更
- 🔧 Prisma schema 6 模型（User/Account/Transaction/Budget/Goal/Investment）
- 🔧 Seed 脚本生成真实感测试数据

## [1.4.0] - 2026-04-29

### 新增
- 📊 **财务洞察系统**：基准对比（同龄人/同收入段/同城市）+ 历史趋势
- 🏆 **成就系统**：储蓄率达标/连续记账/资产里程碑/投资收益/财务健康度 5 大类别
- `Insights.vue`：洞察概览 + 成就墙 + 数据解读
- 功能门控：`hasInsights`（免费版禁用）

---

## [1.3.0] - 2026-04-29

### 新增
- 🤖 **AI 财务助手**：旗舰版特色功能，智能财务分析与建议
- `aiService.ts`：LLM 调用服务（OpenAI 兼容 API + 24h 缓存 + 用量统计）
- `aiPromptTemplates.ts`：4 种分析场景 Prompt 模板 + 本地快速建议规则引擎
- `aiHandlers.ts`：8 个 IPC 接口（配置/支出分析/储蓄规划/投资建议/问答/用量/缓存）
- `AIAdvice.vue`：前端 4 Tab 主界面（快速建议+支出分析+储蓄规划+投资建议+自由问答）
- 本地规则引擎：无需 API 的快速建议（储蓄率/支出异常/投资/目标）
- 24 小时结果缓存 + 用量统计（按天记录，保留 30 天）

### 变更
- 🔧 `license.ts`：FeatureMap 新增 `hasAI` + `maxAiCalls`，免费版 AI 禁用，试用版 10次/天，基础版 20次/天，旗舰版无限次
- 🔧 preload 暴露 ai 命名空间 9 个 API
- 🔧 侧边栏新增 AI 助手入口（MagicStick 图标）

---

## [1.2.0] - 2026-04-29

### 新增
- 🔄 **周期性交易**：自动管理定期收支（工资/房租/订阅等）
- `recurring_rules` 表 + 服务逻辑 + IPC 处理 + preload 桥接
- `Recurring.vue`：概览卡片+规则列表+创建/编辑/暂停/删除
- 功能门控：`hasRecurring` + `maxRecurringRules`（免费版限制 3 条）

---

## [1.1.0] - 2026-04-29

### 新增
- 🎭 **演示模式**：一键填充示例数据，快速体验产品功能
- 🔔 **应用内更新检查**：GitHub Releases API + semver 比较 + 24小时自动检查 + 系统通知
- 🎨 Welcome 页优化：暗色模式适配/输入验证/进度条/跳过引导/动画过渡
- 侧边栏更新徽章（有新版本时显示红点）

---

## [1.0.0] - 2026-04-28

### 新增
- 🔑 **订阅授权系统**：完整的三级授权体系（免费/基础¥19/月/旗舰¥39/月）
- 🔑 `license.ts` 核心模块：License Key 格式校验、AES-256-CBC 加密存储、机器指纹、RSA-2048 签名验证
- 🔑 `licenseHandlers.ts`：8个 IPC 方法（激活/状态/续期/停用/验证等）+ preload 桥接 9个 API
- 🔑 `License.vue` 授权管理页：三版对比卡片 + 密钥输入激活 + 续期操作
- 🔒 `FeatureGate.vue` 组件：统一功能门控，支持升级提示弹窗
- 🔒 `useLicense` composable：响应式授权状态管理
- 🔒 免费版限制：3账户/200交易/无预算/无投资/无PDF/无备份
- 🔑 密钥生成工具 `scripts/generate-key.mjs`：RSA-2048 密钥对管理 + 批量生成签名密钥

### 变更
- 🔧 Budget/Investment/HealthScore 页面集成 FeatureGate 门控
- 🔧 PdfReport 页面集成 inline 门控（v-if/v-else）
- 🔧 侧边栏新增授权管理入口（Key 图标）

---

## [0.8.0] - 2026-04-28

### 新增
- 📄 **PDF综合报告页**：全新PdfReport.vue专属页面
  - 五大板块聚合：核心指标、健康评分、收支分析、目标进度、投资概况
  - 并行加载5个API（Dashboard/月度/趋势/目标/健康评分）
  - 打印优化样式（隐藏工具栏、分页控制）
  - 侧边栏入口 + 路由注册 + Document图标
- 📄 Report.vue PDF导出按钮 + 打印样式优化（commit 7a72519）
- 📄 Dashboard PDF导出按钮 + 打印样式优化（commit 2c902b6）

## [0.7.0] - 2026-04-28

### 新增
- 🌙 **暗色模式完整支持**：theme.css CSS变量体系 + dark-override.css 全局覆盖
- 🌙 useTheme composable（light/dark/system三模式 + localStorage持久化 + 系统跟随）
- 🌙 侧边栏主题切换按钮 + 0.3s平滑过渡动画
- 🌙 Element Plus暗色覆盖 + 22个.vue文件硬编码颜色修复

## [0.6.0] - 2026-04-28

### 新增
- 📊 **报表分析模块**：Report.vue（5个Tab：收支概览/支出分析/收入分析/趋势预测/健康评分）
- 💚 HealthScore.vue（5维环形图 + 个性化建议）
- 🔗 preload桥接：report命名空间6个API + TypeScript类型定义

## [0.5.0] - 2026-04-27

### 新增
- 📈 **投资追踪模块**：数据层 + 前端UI
- 投资持仓总览 / 交易记录 / 资产配置三个Tab
- preload桥接17个API + 路由 + 侧边栏入口

## [0.4.0] - 2026-04-27

### 新增
- 💰 **预算管理模块**：完整CRUD + 状态计算 + 快照 + 历史趋势
- Budget.vue（创建/编辑/删除/状态/历史趋势）
- budgetHandlers.ts（8个IPC方法）+ database.ts（2个预算表）

## [0.3.0] - 2026-04-26

### 新增
- 📦 SQLite数据库（替代localStorage）
- 📊 Dashboard增强：收支趋势图（真实数据）+ 净资产趋势图 + 支出Top5饼图
- 📊 Excel报表导出（交易/账户/负债/目标多工作表）
- 📊 图表响应式自适应（窗口resize自动重绘）

### 修复
- 🐛 Dashboard净资产趋势图逻辑修复（逐月反推）
- 🐛 比率百分比边界保护（0-100）

## [0.2.0] - 2026-04-26

### 新增
- 📦 增量导入模式（账户/负债/交易/目标增量合并）
- 📦 导入前自动备份功能
- 📦 导入预览弹窗集成

### 变更
- 🔧 清理调试日志（11处）+ 临时文件归档
- 🔧 版本号修正

---

## [0.1.0] - 2026-03-30

### 新增 (Added)

#### 核心功能
- ✨ **资产配置可视化工具**：基于科学资产配置理论的交互式工具
  - 三大财务阶段配置推荐（保障/安全/自由）
  - 交互式滑块调整（低/中/高风险比例）
  - 多维可视化展示（饼图 + 雷达图 + 增长曲线）
  - 实时收益计算和预测
  - 一键导出 PDF 报告
  - 配置数据本地存储

#### 用户体验
- 🎨 响应式设计，支持不同屏幕分辨率
- 🎨 流畅的交互动画
- 🎨 清晰的数据可视化
- 🎨 直观的操作引导

#### 技术特性
- 📦 Electron + Vue 3 + TypeScript 现代化架构
- 📦 Element Plus UI 组件库
- 📦 ECharts 图表库（饼图、雷达图、增长曲线）
- 📦 Pinia 状态管理
- 📦 本地数据存储（localStorage）
- 📦 跨平台支持（macOS Intel/M1/M2、Windows）

### 修复 (Fixed)

#### UI/UX 问题
- 🐛 修复图表容器高度问题（增长曲线导出）
- 🐛 修复导出功能的 Promise 永远不 resolve 的问题
- 🐛 修复 Element Plus 废弃属性警告（28 处）
- 🐛 优化滑块交互体验
- 🐛 修复图表导出时未等待重新渲染的问题

#### 性能问题
- 🐛 优化图表渲染性能
- 🐛 减少 30,811 行代码，移除 47 个测试文件
- 🐛 Lighthouse 性能评分达到 95+

### 变更 (Changed)

- 🔧 优化项目结构，移除不必要的测试文件
- 🔧 更新 .gitignore 配置
- 🔧 优化依赖管理，移除未使用的包
- 🔧 更新 README.md，突出资产配置工具功能
- 🔧 添加开源协议和贡献指南

### 文档 (Documentation)

- 📚 创建 README.md（专业开源项目文档）
- 📚 创建 CONTRIBUTING.md（贡献指南）
- 📚 创建 ISSUE 模板（Bug 报告、功能建议）
- 📚 创建 PULL_REQUEST_TEMPLATE（PR 模板）
- 📚 创建技术文档：
  - Element Plus 废弃属性修复报告
  - 导出功能修复报告
  - 资产配置可视化工具增长曲线导出修复报告
  - Lighthouse 性能测试报告
- 📚 创建产品发布素材：
  - 知乎文章（3 个版本）
  - 小红书图文（封面 + 内容）
  - B站视频脚本（3 个版本）
  - 朋友圈/微信群文案（2 个版本）
  - GitHub Release 文案

### 测试 (Testing)

- 🧪 创建交互测试脚本（财务阶段切换、滑块边界、导出功能）
- 🧪 创建 Lighthouse 性能测试（性能、可访问性、最佳实践、SEO）
- 🧪 功能测试通过率 100%
- 🧪 交叉浏览器测试通过

### 打包 (Packaging)

- 📦 macOS x64 版本打包完成（DMG，123MB）
- 📦 macOS arm64 版本打包完成（DMG，117MB）
- 📦 Windows 版本准备中
- 📦 生成产品图标（1024x1024）

---

## [1.0.0] - 未来计划

### 新增 (Added)

#### 核心功能
- ✨ **财务看板**：实时展示净资产、资产、负债、月收入、月支出
- ✨ **目标追踪**：三阶段财务自由目标（财务保障、财务安全、财务自由）
- ✨ **收支记录**：收入/支出记录，支持分类、标签、账户关联
- ✨ **账户管理**：多账户管理（现金、储蓄、投资等），支持多币种
- ✨ **负债管理**：负债记录，还款进度追踪，利息计算
- ✨ **梦想图册**：梦想清单，成本估算，优先级排序
- ✨ **复利计算器**：复利增长计算，不同收益率对比
- ✨ **提前还款计算器**：提前还款收益计算，节省利息估算
- ✨ **情景模拟**：财务情景模拟（开发中）

#### 用户体验
- 🎨 **引导流程**：首次使用引导，三步完成初始化
- 🎨 **设置页面**：用户信息编辑，数据统计，重新初始化
- 🎨 **进度可视化**：财务自由进度条，目标完成度展示
- 🎨 **数据统计**：账户数量、负债数量、交易记录数等统计

#### 技术特性
- 📦 **本地数据库**：SQLite 本地存储，数据安全
- 📦 **跨平台**：支持 macOS、Windows、Linux
- 📦 **现代化架构**：Electron + Vue 3 + TypeScript
- 📦 **响应式设计**：支持不同屏幕分辨率

### 修复 (Fixed)

#### 数据库问题
- 🐛 修复 users 表缺少必需字段（id, email, avatar等）
- 🐛 修复 debts 表缺少 priority, notes, paid_amount 字段
- 🐛 修复 goals 表字段名错误（type → stage）
- 🐛 修复 accounts 表缺少 institution, notes 字段
- 🐛 修复 transactions 表缺少 description, updated_at 字段
- 🐛 修复所有表缺少 user_id 字段

#### API 问题
- 🐛 修复 API 迁移问题（window.api → window.electronAPI）
- 🐛 修复所有 IPC create 函数缺少 user_id 问题
- 🐛 修复字段名兼容性问题（支持 camelCase 和 snake_case）

#### 前端问题
- 🐛 修复预加载脚本路径错误
- 🐛 修复 Element Plus 图标导入错误（CalculatorFilled, Calculator）
- 🐛 修复 Vue 3 过滤器语法错误
- 🐛 修复 CSP 策略阻止加载外部图片

#### 初始化问题
- 🐛 修复初始化流程缺少用户创建逻辑
- 🐛 修复测试数据自动初始化（已禁用，改为手动）
- 🐛 修复 ID 生成逻辑（使用时间戳生成唯一 ID）

### 变更 (Changed)

- 🔧 禁用测试数据自动初始化，改为空白启动
- 🔧 优化初始化流程，确保用户数据正确保存
- 🔧 优化数据库表结构，添加所有必需字段
- 🔧 优化 API 调用，统一使用 window.electronAPI
- 🔧 优化 CSP 策略，允许加载外部图片

### 文档 (Documentation)

- 📚 创建快速开始指南（1分钟开始.md）
- 📚 创建用户文档索引
- 📚 创建常见问题解答（FAQ，24个问题）
- 📚 创建激励文档（为什么现在开始很重要.md）
- 📚 创建项目里程碑文档
- 📚 创建软件开发者的百万富翁路径分析
- 📚 创建周一晨间提醒
- 📚 创建产品交付清单
- 📚 创建多个修复说明文档

### 方法论 (Methodology)

- 📖 提炼 15 个核心方法论：
  1. 目标设定方法论
  2. 储蓄方法论
  3. 投资方法论
  4. 还债方法论
  5. 收入增长方法论
  6. 支出优化方法论
  7. 复利方法论
  8. 时间价值方法论
  9. 财务报表分析方法论
  10. 风险管理方法论
  11. 税务优化方法论
  12. 心理建设方法论
  13. 企业家创业方法论
  14. 错误与失败方法论
  15. 产品变现方法论

### 知识库 (Knowledge Base)

- 📖 创建 4 大类知识文件：
  - 投资理财（投资与投机、七大原则、被动收入等）
  - 创业商业（软件开发者的百万富翁路径等）
  - 心理认知（穷人思维与财富障碍等）
  - 财富理论（财富自由的三个层次等）

---

## [0.1.0] - 2026-03-21

### 新增 (Added)

- 🎉 项目初始化
- 📦 基础架构搭建（Electron + Vue 3 + TypeScript）
- 📦 数据库设计（SQLite）
- 📦 IPC 通信层
- 📦 基础页面结构

---

## 版本说明

### 版本号格式

遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：

- **主版本号（MAJOR）**：不兼容的 API 修改
- **次版本号（MINOR）**：向下兼容的功能性新增
- **修订号（PATCH）**：向下兼容的问题修正

### 更新类型

- **新增 (Added)**：新功能
- **变更 (Changed)**：对现有功能的变更
- **弃用 (Deprecated)**：即将删除的功能
- **移除 (Removed)**：已删除的功能
- **修复 (Fixed)**：任何 bug 修复
- **安全 (Security)**：安全相关的修复

---

## 未来计划

### [1.1.0] - 计划中

- 🔮 数据导出功能（CSV, Excel）
- 🔮 数据导入功能
- 🔮 云同步功能
- 🔮 多用户支持
- 🔮 预算管理
- 🔮 账单提醒
- 🔮 投资组合追踪
- 🔮 更多图表和报表

### [1.2.0] - 计划中

- 🔮 移动端应用（React Native / Flutter）
- 🔮 AI 财务顾问
- 🔮 自动记账（银行接口）
- 🔮 社区功能
- 🔮 理财产品推荐

### [2.0.0] - 远期计划

- 🔮 完整的财务管理生态系统
- 🔮 投资组合管理
- 🔮 税务规划工具
- 🔮 保险规划
- 🔮 退休规划

---

## 贡献者

- **AI 助手** - 核心开发
- **欧阳洁** - 产品经理、测试

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

**最后更新**：2026-03-25 01:39
**维护者**：AI助手
