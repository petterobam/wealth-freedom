/**
 * 预算管理 IPC 处理程序
 * v0.4.0 — P0 数据层
 */

import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';
import { randomUUID } from 'crypto';

function snakeToCamel(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

let db: Database.Database;

export function initBudgetHandlers(database: Database.Database) {
  db = database;

  ipcMain.handle('budget:create', handleBudgetCreate);
  ipcMain.handle('budget:update', handleBudgetUpdate);
  ipcMain.handle('budget:delete', handleBudgetDelete);
  ipcMain.handle('budget:list', handleBudgetList);
  ipcMain.handle('budget:getById', handleBudgetGetById);
  ipcMain.handle('budget:status', handleBudgetStatus);
  ipcMain.handle('budget:snapshot', handleBudgetSnapshot);
  ipcMain.handle('budget:history', handleBudgetHistory);
}

// ==================== CRUD ====================

async function handleBudgetCreate(
  _e: Electron.IpcMainInvokeEvent,
  data: {
    userId: string;
    name: string;
    category?: string;
    amount: number;
    period?: string;
    startDate: string;
    icon?: string;
    color?: string;
    rollover?: boolean;
  }
) {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO budgets (id, user_id, name, category, amount, period, start_date, icon, color, rollover, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, data.userId, data.name, data.category ?? null, data.amount,
    data.period ?? 'monthly', data.startDate, data.icon ?? null,
    data.color ?? null, data.rollover ? 1 : 0, now, now
  );
  return { id, ...data, createdAt: now };
}

async function handleBudgetUpdate(
  _e: Electron.IpcMainInvokeEvent,
  data: { id: string; [key: string]: any }
) {
  const { id, ...fields } = data;
  const allowed = ['name', 'category', 'amount', 'period', 'start_date', 'is_active', 'icon', 'color', 'rollover'];
  const sets: string[] = [];
  const vals: any[] = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      const col = key === 'start_date' ? 'start_date' : key;
      sets.push(`${col} = ?`);
      vals.push(key === 'rollover' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }
  if (sets.length === 0) return { changed: 0 };
  sets.push('updated_at = ?');
  vals.push(new Date().toISOString());
  vals.push(id);
  const result = db.prepare(`UPDATE budgets SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return { changed: result.changes };
}

async function handleBudgetDelete(
  _e: Electron.IpcMainInvokeEvent,
  data: { id: string }
) {
  const result = db.prepare('DELETE FROM budgets WHERE id = ?').run(data.id);
  return { deleted: result.changes };
}

async function handleBudgetList(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string; activeOnly?: boolean }
) {
  const query = data.activeOnly
    ? 'SELECT * FROM budgets WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC';
  return snakeToCamel(db.prepare(query).all(data.userId));
}

async function handleBudgetGetById(
  _e: Electron.IpcMainInvokeEvent,
  data: { id: string }
) {
  return snakeToCamel(db.prepare('SELECT * FROM budgets WHERE id = ?').get(data.id));
}

// ==================== 状态计算 ====================

interface BudgetStatus {
  budget: any;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'green' | 'yellow' | 'red';
  projectedEndOfMonth: number;
}

async function handleBudgetStatus(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string; periodStart?: string; periodEnd?: string }
): Promise<BudgetStatus[]> {
  const budgets = snakeToCamel(db.prepare(
    'SELECT * FROM budgets WHERE user_id = ? AND is_active = 1'
  ).all(data.userId)) as any[];

  if (budgets.length === 0) return [];

  const now = new Date();
  const periodStart = data.periodStart ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const periodEnd = data.periodEnd ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

  const results: BudgetStatus[] = [];

  for (const budget of budgets) {
    // 计算当前周期实际支出
    let spent = 0;
    if (budget.category) {
      const row = db.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND type = 'expense' AND category = ? AND date >= ? AND date <= ?`
      ).get(data.userId, budget.category, periodStart, periodEnd) as any;
      spent = row.total;
    } else {
      // 无分类预算 = 所有支出合计
      const row = db.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`
      ).get(data.userId, periodStart, periodEnd) as any;
      spent = row.total;
    }

    // 结转处理
    if (budget.rollover) {
      const lastSnapshot = db.prepare(
        `SELECT remaining FROM budget_snapshots WHERE budget_id = ? ORDER BY period_end DESC LIMIT 1`
      ).get(budget.id) as any;
      if (lastSnapshot && lastSnapshot.remaining > 0) {
        budget.amount += lastSnapshot.remaining;
      }
    }

    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 999) : 0;

    // 预测月末支出（线性外推）
    const daysInPeriod = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000) + 1;
    const daysPassed = Math.ceil((now.getTime() - new Date(periodStart).getTime()) / 86400000);
    const projectedEndOfMonth = daysPassed > 0 ? (spent / daysPassed) * daysInPeriod : spent;

    let status: 'green' | 'yellow' | 'red' = 'green';
    if (percentage >= 100) status = 'red';
    else if (percentage >= 80) status = 'yellow';

    results.push({ budget, spent, remaining, percentage, status, projectedEndOfMonth });
  }

  return results;
}

// ==================== 快照 ====================

async function handleBudgetSnapshot(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string; periodStart?: string; periodEnd?: string }
) {
  const statuses = await handleBudgetStatus(_e, data) as BudgetStatus[];
  const now = new Date().toISOString();

  const insert = db.prepare(
    `INSERT OR REPLACE INTO budget_snapshots (id, budget_id, period_start, period_end, budget_amount, actual_amount, remaining, percentage, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertAll = db.transaction((items: BudgetStatus[]) => {
    for (const item of items) {
      insert.run(
        `${item.budget.id}_${data.periodStart ?? 'auto'}`,
        item.budget.id,
        data.periodStart ?? '',
        data.periodEnd ?? '',
        item.budget.amount,
        item.spent,
        item.remaining,
        item.percentage,
        now
      );
    }
  });

  insertAll(statuses);
  return { snapshotCount: statuses.length };
}

// ==================== 历史趋势 ====================

async function handleBudgetHistory(
  _e: Electron.IpcMainInvokeEvent,
  data: { budgetId: string; limit?: number }
) {
  const limit = data.limit ?? 6;
  return snakeToCamel(db.prepare(
    `SELECT * FROM budget_snapshots WHERE budget_id = ? ORDER BY period_end DESC LIMIT ?`
  ).all(data.budgetId, limit));
}
