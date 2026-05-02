/**
 * CSV 导入 IPC 处理器
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { previewImport, readCSV, detectSource } from './importers';
import type { ImportPreview } from './importers/types';
import { initDatabase } from './database';

export function registerImportHandlers() {
  // 选择 CSV 文件
  ipcMain.handle('import:selectFile', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      title: '选择导入文件',
      filters: [
        { name: 'CSV 文件', extensions: ['csv'] },
        { name: 'Excel 文件', extensions: ['xlsx', 'xls'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths;
  });

  // 预览导入
  ipcMain.handle('import:preview', async (_event, filePath: string): Promise<ImportPreview> => {
    return previewImport(filePath);
  });

  // 执行导入
  ipcMain.handle('import:execute', async (_event, filePath: string, accountId: string): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> => {
    const { rows } = readCSV(filePath);
    const { headers } = readCSV(filePath);
    const source = detectSource(filePath, headers);

    // 选择导入器
    const { alipayImporter } = await import('./importers/alipay');
    const { wechatImporter } = await import('./importers/wechat');
    const { genericImporter } = await import('./importers/csv-generic');
    
    const importers = [alipayImporter, wechatImporter, genericImporter];
    let bestImporter = genericImporter;
    let bestScore = 0;
    for (const imp of importers) {
      const score = imp.detect(headers, rows.slice(0, 5));
      if (score > bestScore) {
        bestScore = score;
        bestImporter = imp;
      }
    }

    const transactions = bestImporter.parse(rows);
    const db = initDatabase();

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    const insertStmt = db.prepare(`
      INSERT INTO transactions (id, user_id, date, type, category, amount, account_id, description, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    // 去重查询
    const checkDup = db.prepare(`
      SELECT id FROM transactions WHERE date = ? AND amount = ? AND description = ? LIMIT 1
    `);

    const tx = db.transaction(() => {
      for (const t of transactions) {
        try {
          // 去重检查
          const dup = checkDup.get(t.date, t.amount, t.description);
          if (dup) {
            skipped++;
            continue;
          }

          const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          insertStmt.run(id, 'user-1', t.date, t.type, t.category, t.amount, accountId || 'account-1', t.description, JSON.stringify(t.tags || []));
          imported++;
        } catch (err: any) {
          errors.push(`${t.date} ${t.description}: ${err.message}`);
          skipped++;
        }
      }
    });

    try {
      tx();
    } catch (err: any) {
      errors.push(`批量导入失败: ${err.message}`);
    } finally {
      db.close();
    }

    return { imported, skipped, errors };
  });
}
