/**
 * 数据备份与恢复处理程序
 * v0.9.0 ~ v0.10.0 - 财富自由之路
 */

import { ipcMain, dialog, app } from 'electron';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 定时备份相关状态
let autoBackupTimer: ReturnType<typeof setInterval> | null = null;
let lastAutoBackupTime: string | null = null;

export const initBackupHandlers = (db: Database.Database): void => {
  // 获取数据库信息
  ipcMain.handle('backup:info', async () => {
    try {
      const dataPath = app.getPath('userData');
      const dbPath = path.join(dataPath, 'wealth-freedom', 'data.db');

      // 获取表记录数
      const tables = [
        'users', 'accounts', 'debts', 'transactions', 'goals', 'dreams',
        'income_sources', 'income_records', 'income_goals', 'income_strategies',
        'income_actions', 'income_simulations', 'budgets', 'budget_snapshots',
        'investment_accounts', 'portfolios', 'holdings', 'investment_transactions',
      ];

      const tableCounts: Record<string, number> = {};
      let totalRecords = 0;

      for (const table of tables) {
        try {
          const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
          tableCounts[table] = result.count;
          totalRecords += result.count;
        } catch {
          tableCounts[table] = 0;
        }
      }

      // 数据库文件大小
      let dbSize = 0;
      try {
        const stats = fs.statSync(dbPath);
        dbSize = stats.size;
      } catch { /* ignore */ }

      return {
        success: true,
        data: {
          dbPath,
          dbSize,
          dbSizeFormatted: formatBytes(dbSize),
          totalRecords,
          tableCounts,
          version: app.getVersion(),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 备份数据库到用户选择的路径
  ipcMain.handle('backup:create', async (_event, options?: { filename?: string }) => {
    try {
      const dataPath = app.getPath('userData');
      const dbPath = path.join(dataPath, 'wealth-freedom', 'data.db');

      if (!fs.existsSync(dbPath)) {
        return { success: false, error: '数据库文件不存在' };
      }

      // 使用 SQLite backup API（安全，不需要关闭连接）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultName = options?.filename || `wealth-freedom-backup-${timestamp}.db`;

      const result = await dialog.showSaveDialog({
        title: '选择备份保存位置',
        defaultPath: defaultName,
        filters: [
          { name: '数据库文件', extensions: ['db'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: '用户取消' };
      }

      // 使用 better-sqlite3 的 backup 方法（安全备份）
      await db.backup(result.filePath);

      // 同时导出一份 JSON 格式的摘要信息
      const summaryPath = result.filePath.replace('.db', '.json');
      const info = await getBackupSummary(db, result.filePath);
      fs.writeFileSync(summaryPath, JSON.stringify(info, null, 2), 'utf-8');

      return {
        success: true,
        data: {
          backupPath: result.filePath,
          summaryPath,
          size: fs.statSync(result.filePath).size,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 从备份文件恢复数据库
  ipcMain.handle('backup:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择备份文件',
        filters: [
          { name: '数据库文件', extensions: ['db'] },
          { name: '所有文件', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: '用户取消' };
      }

      const backupPath = result.filePaths[0];

      if (!fs.existsSync(backupPath)) {
        return { success: false, error: '备份文件不存在' };
      }

      // 验证备份文件是有效的 SQLite 数据库
      try {
        const testDb = new Database(backupPath, { readonly: true });
        const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
        testDb.close();

        if (tables.length === 0) {
          return { success: false, error: '无效的备份文件：没有找到数据表' };
        }
      } catch {
        return { success: false, error: '无效的备份文件：不是有效的 SQLite 数据库' };
      }

      // 先备份当前数据库（安全措施）
      const dataPath = app.getPath('userData');
      const dbPath = path.join(dataPath, 'wealth-freedom', 'data.db');
      const preRestoreBackupPath = dbPath.replace('.db', `-pre-restore-${Date.now()}.db`);

      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, preRestoreBackupPath);
      }

      // 用备份数据替换当前数据库
      // 使用 better-sqlite3 的方式：先关闭当前连接，复制文件，重新打开
      db.close();
      fs.copyFileSync(backupPath, dbPath);

      return {
        success: true,
        data: {
          restoredFrom: backupPath,
          preRestoreBackup: preRestoreBackupPath,
          message: '数据库已恢复，请重启应用以加载新数据',
          needsRestart: true,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 自动备份到默认位置
  ipcMain.handle('backup:auto', async () => {
    try {
      const dataPath = app.getPath('userData');
      const dbPath = path.join(dataPath, 'wealth-freedom', 'data.db');
      const backupDir = path.join(dataPath, 'wealth-freedom', 'backups');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupPath = path.join(backupDir, `auto-backup-${timestamp}.db`);

      await db.backup(backupPath);

      // 清理旧的自动备份（保留最近10个）
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('auto-backup-') && f.endsWith('.db'))
        .sort()
        .reverse();

      for (let i = 10; i < backups.length; i++) {
        fs.unlinkSync(path.join(backupDir, backups[i]));
      }

      return {
        success: true,
        data: {
          backupPath,
          size: fs.statSync(backupPath).size,
          totalBackups: Math.min(backups.length, 10),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 列出自动备份列表
  ipcMain.handle('backup:list', async () => {
    try {
      const dataPath = app.getPath('userData');
      const backupDir = path.join(dataPath, 'wealth-freedom', 'backups');

      if (!fs.existsSync(backupDir)) {
        return { success: true, data: [] };
      }

      const backups = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db'))
        .map(f => {
          const filePath = path.join(backupDir, f);
          const stats = fs.statSync(filePath);
          return {
            filename: f,
            path: filePath,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            created: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      return { success: true, data: backups };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 获取自动备份状态（v0.10.0 新增）
  ipcMain.handle('backup:autoStatus', async () => {
    return {
      success: true,
      data: {
        enabled: autoBackupTimer !== null,
        intervalHours: 6,
        lastBackupTime: lastAutoBackupTime,
      },
    };
  });

  // 导出为 JSON（完整数据导出）
  ipcMain.handle('backup:exportJSON', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: '导出 JSON 数据',
        defaultPath: `wealth-freedom-export-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: '用户取消' };
      }

      const tables = [
        'users', 'accounts', 'debts', 'transactions', 'goals', 'dreams',
        'income_sources', 'income_records', 'income_goals', 'income_strategies',
        'income_actions', 'income_simulations', 'budgets', 'budget_snapshots',
        'investment_accounts', 'portfolios', 'holdings', 'investment_transactions',
      ];

      const exportData: Record<string, any[]> = {};
      for (const table of tables) {
        try {
          exportData[table] = db.prepare(`SELECT * FROM ${table}`).all() as any[];
        } catch {
          exportData[table] = [];
        }
      }

      const output = {
        _meta: {
          version: app.getVersion(),
          exportedAt: new Date().toISOString(),
          totalTables: tables.length,
          totalRecords: Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0),
        },
        data: exportData,
      };

      fs.writeFileSync(result.filePath, JSON.stringify(output, null, 2), 'utf-8');

      return {
        success: true,
        data: {
          path: result.filePath,
          size: fs.statSync(result.filePath).size,
          totalRecords: output._meta.totalRecords,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
};

// 获取备份摘要信息
async function getBackupSummary(db: Database.Database, backupPath: string) {
  const tables = [
    'users', 'accounts', 'debts', 'transactions', 'goals', 'dreams',
    'income_sources', 'income_records', 'income_goals', 'income_strategies',
    'income_actions', 'income_simulations', 'budgets', 'budget_snapshots',
    'investment_accounts', 'portfolios', 'holdings', 'investment_transactions',
  ];

  const counts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const r = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number };
      counts[table] = r.c;
    } catch {
      counts[table] = 0;
    }
  }

  return {
    backupDate: new Date().toISOString(),
    appVersion: app.getVersion(),
    backupFileSize: fs.statSync(backupPath).size,
    tableCounts: counts,
    totalRecords: Object.values(counts).reduce((s, c) => s + c, 0),
  };
}

// 格式化文件大小
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 启动自动备份（应用启动时调用）
 * v0.10.0 - 启动时备份 + 定时备份
 */
export const startAutoBackup = (db: Database.Database): void => {
  // 1. 启动时立即执行一次自动备份（延迟5秒，避免影响启动速度）
  setTimeout(async () => {
    try {
      const dataPath = app.getPath('userData');
      const dbPath = path.join(dataPath, 'wealth-freedom', 'data.db');
      if (fs.existsSync(dbPath)) {
        const backupDir = path.join(dataPath, 'wealth-freedom', 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupPath = path.join(backupDir, `startup-backup-${timestamp}.db`);
        await db.backup(backupPath);
        lastAutoBackupTime = new Date().toISOString();
        cleanupOldBackups(backupDir, 15); // 启动备份保留15份
        console.log(`[AutoBackup] 启动备份完成: ${backupPath}`);
      }
    } catch (err) {
      console.error('[AutoBackup] 启动备份失败:', err);
    }
  }, 5000);

  // 2. 每6小时执行一次定时备份
  const INTERVAL_MS = 6 * 60 * 60 * 1000;
  autoBackupTimer = setInterval(async () => {
    try {
      const dataPath = app.getPath('userData');
      const dbPath = path.join(dataPath, 'wealth-freedom', 'data.db');
      if (fs.existsSync(dbPath)) {
        const backupDir = path.join(dataPath, 'wealth-freedom', 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupPath = path.join(backupDir, `periodic-backup-${timestamp}.db`);
        await db.backup(backupPath);
        lastAutoBackupTime = new Date().toISOString();
        cleanupOldBackups(backupDir, 10); // 定时备份保留10份
        console.log(`[AutoBackup] 定时备份完成: ${backupPath}`);
      }
    } catch (err) {
      console.error('[AutoBackup] 定时备份失败:', err);
    }
  }, INTERVAL_MS);
};

/** 停止定时备份（应用退出时调用） */
export const stopAutoBackup = (): void => {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
};

/** 清理旧备份，保留最近 N 份（按前缀匹配） */
function cleanupOldBackups(backupDir: string, keepCount: number): void {
  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.db'))
    .sort()
    .reverse();
  for (let i = keepCount; i < files.length; i++) {
    try {
      fs.unlinkSync(path.join(backupDir, files[i]));
    } catch { /* ignore */ }
  }
}

export default initBackupHandlers;
