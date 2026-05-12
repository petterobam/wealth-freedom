/**
 * 周期性交易 IPC 处理程序
 */

import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';
import {
  getNextExecution,
  formatDate,
  calculateFirstExecution,
  isExpired,
  type RecurringRule,
} from './recurringService';

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

export function registerRecurringHandlers(db: Database.Database): void {
  // 获取所有规则
  ipcMain.handle('recurring:list', (_event, userId: string) => {
    const stmt = db.prepare('SELECT * FROM recurring_rules WHERE user_id = ? ORDER BY next_execution ASC');
    return snakeToCamel(stmt.all(userId));
  });

  // 获取单个规则
  ipcMain.handle('recurring:get', (_event, ruleId: string) => {
    const stmt = db.prepare('SELECT * FROM recurring_rules WHERE id = ?');
    return snakeToCamel(stmt.get(ruleId));
  });

  // 创建规则
  ipcMain.handle('recurring:create', (_event, data: Omit<RecurringRule, 'id' | 'next_execution' | 'last_execution' | 'created_at' | 'updated_at'>) => {
    const id = uuidv4();
    const nextExecution = calculateFirstExecution(data as any);
    const now = formatDate(new Date()) + 'T' + new Date().toTimeString().slice(0, 8);

    const stmt = db.prepare(`
      INSERT INTO recurring_rules (id, user_id, name, amount, type, account_id, category, frequency, interval_num, day_of_week, day_of_month, start_date, end_date, next_execution, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.user_id, data.name, data.amount, data.type, data.account_id,
      data.category, data.frequency, data.interval_num, data.day_of_week,
      data.day_of_month, data.start_date, data.end_date, nextExecution,
      data.status || 'active', data.notes, now, now
    );

    return { id, next_execution: nextExecution };
  });

  // 更新规则
  ipcMain.handle('recurring:update', (_event, ruleId: string, data: Partial<RecurringRule>) => {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['name', 'amount', 'type', 'account_id', 'category', 'frequency', 'interval_num', 'day_of_week', 'day_of_month', 'start_date', 'end_date', 'status', 'notes'];

    for (const field of allowedFields) {
      if (data[field as keyof RecurringRule] !== undefined) {
        fields.push(`${field} = ?`);
        values.push((data as any)[field]);
      }
    }

    if (fields.length === 0) return { changes: 0 };

    // 如果频率相关字段变了，重新计算 next_execution
    const freqChanged = ['frequency', 'interval_num', 'day_of_week', 'day_of_month', 'start_date'].some(
      f => (data as any)[f] !== undefined
    );

    if (freqChanged) {
      // 获取当前规则来重新计算
      const current = snakeToCamel(db.prepare('SELECT * FROM recurring_rules WHERE id = ?').get(ruleId)) as RecurringRule;
      if (current) {
        const merged = { ...current, ...data };
        const nextExec = getNextExecution(merged, new Date());
        fields.push('next_execution = ?');
        values.push(formatDate(nextExec));
      }
    }

    fields.push("updated_at = datetime('now')");
    values.push(ruleId);

    const stmt = db.prepare(`UPDATE recurring_rules SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return { changes: result.changes };
  });

  // 删除规则
  ipcMain.handle('recurring:delete', (_event, ruleId: string) => {
    const stmt = db.prepare('DELETE FROM recurring_rules WHERE id = ?');
    const result = stmt.run(ruleId);
    return { changes: result.changes };
  });

  // 暂停/恢复
  ipcMain.handle('recurring:toggle', (_event, ruleId: string) => {
    const current = db.prepare('SELECT status FROM recurring_rules WHERE id = ?').get(ruleId) as any;
    if (!current) return null;
    const newStatus = current.status === 'active' ? 'paused' : 'active';
    db.prepare("UPDATE recurring_rules SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, ruleId);
    return { status: newStatus };
  });

  // 执行到期规则（应用启动时调用）
  ipcMain.handle('recurring:execute-pending', (_event, userId: string) => {
    const today = formatDate(new Date());
    const rules = snakeToCamel(db.prepare(
      'SELECT * FROM recurring_rules WHERE user_id = ? AND status = ? AND next_execution <= ?'
    ).all(userId, 'active', today)) as RecurringRule[];

    const results: { ruleId: string; transactionId: string; date: string }[] = [];

    const insertTx = db.prepare(`
      INSERT INTO transactions (id, user_id, account_id, type, category, amount, date, note, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const updateRule = db.prepare(`
      UPDATE recurring_rules SET last_execution = ?, next_execution = ?, updated_at = datetime('now') WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      for (const rule of rules) {
        // 检查是否过期
        if (isExpired(rule)) {
          db.prepare("UPDATE recurring_rules SET status = 'paused' WHERE id = ?").run(rule.id);
          continue;
        }

        // 创建交易记录
        const txId = uuidv4();
        insertTx.run(
          txId, rule.user_id, rule.account_id, rule.type,
          rule.category || 'other', rule.amount, today,
          `[自动] ${rule.name}`, `由周期规则"${rule.name}"自动生成`
        );

        // 计算下次执行
        const nextExec = getNextExecution(rule, new Date(today));
        const nextExecStr = formatDate(nextExec);

        // 检查下次执行是否超过结束日期
        if (rule.end_date && nextExecStr > rule.end_date) {
          updateRule.run(today, nextExecStr, rule.id);
          db.prepare("UPDATE recurring_rules SET status = 'paused' WHERE id = ?").run(rule.id);
        } else {
          updateRule.run(today, nextExecStr, rule.id);
        }

        results.push({ ruleId: rule.id, transactionId: txId, date: today });
      }
    });

    transaction();
    return { executed: results.length, details: results };
  });
}
