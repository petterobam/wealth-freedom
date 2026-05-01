# v1.6.0 数据同步机制设计

> 创建：2026-05-02 02:38
> 状态：设计阶段

## 目标

实现桌面端（Electron/SQLite）与 Web 端（Next.js/Prisma/SQLite）之间的数据同步，让用户在任一端录入的数据能无缝同步到另一端。

## 核心原则

1. **离线优先**：两端都支持完全离线使用，同步是可选增强
2. **桌面端为主**：桌面端是"权威源"，Web 端是"查看/轻编辑"
3. **简单可靠**：避免复杂的 CRDT 或 OT，用 last-write-wins + 冲突检测
4. **用户控制**：同步开关、手动触发、冲突解决提示

## 架构方案

### 传输方式：文件导出/导入 + JSON API

**阶段一（MVP）：手动同步**
- 桌面端导出 JSON → Web 端导入
- Web 端导出 JSON → 桌面端导入
- 复用现有 Settings 导出/导入功能

**阶段二：自动同步（API 直连）**
- 桌面端通过 HTTP API 直接与部署的 Web 端通信
- 增量同步（仅同步变更记录）
- 基于 `updatedAt` 时间戳的 last-write-wins

### 数据映射

桌面端（lowdb JSON）和 Web 端（Prisma）的字段映射：

| 桌面端字段 | Web 端字段 | 备注 |
|-----------|-----------|------|
| `id` (uuid) | `id` (cuid) | 同步时保留原始 ID |
| `date` | `date` | 一致 |
| `type` | `type` | 一致 |
| `category` | `category` | 一致 |
| `amount` | `amount` | 一致 |
| `note` | `note` | 一致 |
| `createdAt` | `createdAt` | 格式可能不同 |
| - | `userId` | Web 端多用户独有 |
| - | `updatedAt` | Web 端有自动更新 |

### 同步 API 设计

```
POST /api/sync/push    — 推送本地变更到服务器
GET  /api/sync/pull    — 拉取服务器变更
GET  /api/sync/status  — 获取同步状态
POST /api/sync/resolve — 解决冲突
```

### 同步流程

```
1. 桌面端记录本地 lastSyncTime
2. Push: 发送 lastSyncTime 之后的所有变更
3. Pull: 获取 lastSyncTime 之后的服务器变更
4. 冲突检测: 同一记录两端都修改过 → 标记冲突
5. 冲突解决: 用户选择保留哪一版（或合并）
6. 更新 lastSyncTime
```

### Prisma Schema 扩展

需要给所有模型添加同步相关字段：

```prisma
model Transaction {
  // ... 现有字段
  syncVersion  Int      @default(1)   // 同步版本号
  syncStatus   String   @default("synced") // synced | pending | conflict
  deletedAt    DateTime?              // 软删除
}

// 新增同步日志表
model SyncLog {
  id         String   @id @default(cuid())
  userId     String
  entityType String   // transaction, account, budget, goal, investment
  entityId   String
  action     String   // create, update, delete
  syncTime   DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}
```

## 实施计划

### Phase 1：手动同步增强（2-3h）
- [ ] 统一 JSON 导出格式（桌面端 + Web 端）
- [ ] Web 端导入时智能合并（非覆盖）
- [ ] 导入前差异预览
- [ ] 同步状态指示器

### Phase 2：自动同步 API（4-6h）
- [ ] Prisma schema 添加同步字段
- [ ] Sync API 路由实现
- [ ] 桌面端同步服务（Electron main process）
- [ ] 增量变更检测

### Phase 3：冲突处理 + UI（3-4h）
- [ ] 冲突检测逻辑
- [ ] 冲突解决 UI
- [ ] 同步历史/日志查看
- [ ] 同步设置面板

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 数据丢失 | 同步前自动备份 |
| ID 冲突 | UUID vs CUID → 统一用 UUID |
| 网络中断 | 离线队列 + 重试机制 |
| 大数据量 | 分页同步 + 压缩 |

## 下一步

先实施 Phase 1 的手动同步增强——统一导出格式和智能合并，这是最安全、最快能用的方案。
