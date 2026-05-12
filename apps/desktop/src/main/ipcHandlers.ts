/**
 * IPC 处理程序
 * 处理渲染进程发来的请求
 */

import { ipcMain, BrowserWindow, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './database';
import { initIncomeHandlers } from './incomeHandlers';
import { initBudgetHandlers } from './budgetHandlers';
import { registerInvestmentHandlers } from './investmentHandlers';
import { initReportHandlers } from './reportHandlers';
import { initLicenseHandlers } from './licenseHandlers';
import { initDemoHandlers } from './demoHandlers';
import { registerImportHandlers } from './importHandlers';
import { initCurrencyHandlers } from './currencyHandlers';
import { initEncryptionHandlers } from './encryptionHandlers';
import {
  calculateNetWorth,
  calculateCashFlow,
  calculateGoalProgress,
  calculateRatios,
} from '@wealth-freedom/shared';

let db: ReturnType<typeof initDatabase>;

/**
 * 初始化 IPC 处理程序
 */
export function initIPCHandlers(database: ReturnType<typeof initDatabase>) {
  db = database;

  // 初始化收入规划 IPC 处理程序
  initIncomeHandlers(db);

  // 初始化预算管理 IPC 处理程序
  initBudgetHandlers(db);

  // 初始化投资追踪 IPC 处理程序 (v0.5.0)
  registerInvestmentHandlers(db);

  // 初始化报表分析 IPC 处理程序 (v0.6.0)
  initReportHandlers(db);

  // 初始化授权管理 IPC 处理程序 (v1.0.0)
  initLicenseHandlers();

  // 初始化演示模式 IPC 处理程序 (v1.1.0)
  initDemoHandlers(db);

  // 初始化 CSV 导入 IPC 处理程序 (v1.8.0)
  registerImportHandlers();

  // 初始化多币种支持 (v1.9.0)
  initCurrencyHandlers(db);

  // 初始化数据加密 (v1.9.0)
  initEncryptionHandlers(db);

  // ==================== 用户相关 ====================
  ipcMain.handle('user:get', handleUserGet);
  ipcMain.handle('user:create', handleUserCreate);
  ipcMain.handle('user:update', handleUserUpdate);

  // ==================== 账户相关 ====================
  ipcMain.handle('account:getAll', handleAccountGetAll);
  ipcMain.handle('account:getById', handleAccountGetById);
  ipcMain.handle('account:create', handleAccountCreate);
  ipcMain.handle('account:update', handleAccountUpdate);
  ipcMain.handle('account:delete', handleAccountDelete);

  // ==================== 负债相关 ====================
  ipcMain.handle('debt:getAll', handleDebtGetAll);
  ipcMain.handle('debt:getById', handleDebtGetById);
  ipcMain.handle('debt:create', handleDebtCreate);
  ipcMain.handle('debt:update', handleDebtUpdate);
  ipcMain.handle('debt:delete', handleDebtDelete);

  // ==================== 交易记录相关 ====================
  ipcMain.handle('transaction:getAll', handleTransactionGetAll);
  ipcMain.handle('transaction:getById', handleTransactionGetById);
  ipcMain.handle('transaction:create', handleTransactionCreate);
  ipcMain.handle('transaction:update', handleTransactionUpdate);
  ipcMain.handle('transaction:delete', handleTransactionDelete);

  // ==================== 目标相关 ====================
  ipcMain.handle('goal:getAll', handleGoalGetAll);
  ipcMain.handle('goal:getById', handleGoalGetById);
  ipcMain.handle('goal:create', handleGoalCreate);
  ipcMain.handle('goal:update', handleGoalUpdate);
  ipcMain.handle('goal:delete', handleGoalDelete);

  // ==================== 梦想相关 ====================
  ipcMain.handle('dream:getAll', handleDreamGetAll);
  ipcMain.handle('dream:getById', handleDreamGetById);
  ipcMain.handle('dream:create', handleDreamCreate);
  ipcMain.handle('dream:update', handleDreamUpdate);
  ipcMain.handle('dream:delete', handleDreamDelete);

  // ==================== 计算相关 ====================
  ipcMain.handle('calculation:getNetWorth', handleCalculationGetNetWorth);
  ipcMain.handle('calculation:getCashFlow', handleCalculationGetCashFlow);
  ipcMain.handle('calculation:getGoalProgress', handleCalculationGetGoalProgress);
  ipcMain.handle('calculation:getRatios', handleCalculationGetRatios);

  // ==================== 导出相关 ====================
  ipcMain.handle('export:toPDF', handleExportToPDF);

  // ==================== 数据库管理 ====================
  ipcMain.handle('database:reset', handleDatabaseReset);

  // ==================== 仪表盘数据 ====================
  ipcMain.handle('dashboard:getData', handleDashboardGetData);
}

// ==================== 用户处理函数 ====================
async function handleUserGet() {
  const stmt = db.prepare('SELECT * FROM users LIMIT 1');
  return snakeToCamel(stmt.get()) as any;
}

// 生成唯一 ID 的辅助函数
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// snake_case → camelCase 转换（DB 列名 → 前端属性名）
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

async function handleUserCreate(_event: any, data: any) {
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, avatar, currency, guarantee_months, expected_return_rate, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const id = generateId('user');
  const result = stmt.run(
    id,
    data.name || '用户',
    data.email || null,
    data.avatar || null,
    data.currency || 'CNY',
    data.guaranteeMonths || data.guarantee_months || 6,
    data.expectedReturnRate || data.expected_return_rate || 8.0,
    data.settings || null
  );
  return { 
    id, 
    name: data.name || '用户',
    email: data.email || null,
    avatar: data.avatar || null,
    currency: data.currency || 'CNY',
    guaranteeMonths: data.guaranteeMonths || data.guarantee_months || 6,
    expectedReturnRate: data.expectedReturnRate || data.expected_return_rate || 8.0,
    settings: data.settings || null
  };
}

async function handleUserUpdate(_event: any, data: any) {
  // 动态构建 SET 子句，只更新传入的字段
  const fields: string[] = ['updated_at = datetime(\'now\')'];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
  if (data.settings !== undefined) { fields.push('settings = ?'); values.push(typeof data.settings === 'string' ? data.settings : JSON.stringify(data.settings)); }

  values.push(data.id);
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  // 返回更新后的完整用户数据
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(data.id);
  return snakeToCamel(updated);
}

// ==================== 账户处理函数 ====================
async function handleAccountGetAll() {
  const stmt = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC');
  return snakeToCamel(stmt.all()) as any[];
}

async function handleAccountGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
  return snakeToCamel(stmt.get(id)) as any;
}

async function handleAccountCreate(_event: any, data: any) {
  // 使用时间戳 + 随机数避免 ID 碰撞
  const id = `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const stmt = db.prepare(`
    INSERT INTO accounts (id, user_id, name, type, balance, currency, institution, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  stmt.run(id, data.userId || data.user_id, data.name, data.type, data.balance, data.currency || 'CNY', data.institution, data.notes);
  return { id, ...data };
}

async function handleAccountUpdate(_event: any, id: number, data: any) {
  const fields: string[] = ['updated_at = datetime(\'now\')'];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.balance !== undefined) { fields.push('balance = ?'); values.push(data.balance); }
  if (data.currency !== undefined) { fields.push('currency = ?'); values.push(data.currency); }
  if (data.institution !== undefined) { fields.push('institution = ?'); values.push(data.institution); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

  values.push(id);
  const stmt = db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
  return snakeToCamel(updated);
}

async function handleAccountDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM accounts WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 负债处理函数 ====================
async function handleDebtGetAll() {
  const stmt = db.prepare('SELECT * FROM debts ORDER BY priority DESC, created_at DESC');
  return snakeToCamel(stmt.all()) as any[];
}

async function handleDebtGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM debts WHERE id = ?');
  return snakeToCamel(stmt.get(id)) as any;
}

async function handleDebtCreate(_event: any, data: any) {
  const id = generateId('debt');
  const stmt = db.prepare(`
    INSERT INTO debts (id, user_id, name, total_amount, paid_amount, remaining_amount, monthly_payment, interest_rate, type, priority, due_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  stmt.run(
    id,
    data.userId || data.user_id,
    data.name,
    data.total_amount || data.totalAmount,
    data.paid_amount || data.paidAmount || 0,
    data.remaining_amount || data.remainingAmount,
    data.monthly_payment || data.monthlyPayment || 0,
    data.interest_rate || data.interestRate || 0,
    data.type,
    data.priority || 3,
    data.due_date || data.dueDate || null,
    data.notes || null
  );
  return { id, ...data };
}

async function handleDebtUpdate(_event: any, id: number, data: any) {
  const allowed = ['name', 'total_amount', 'paid_amount', 'remaining_amount', 'monthly_payment', 'interest_rate', 'type', 'priority', 'due_date', 'notes'];
  const fields = ["updated_at = datetime('now')"];
  const values: any[] = [];
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
  }
  // 支持 camelCase 字段名
  const camelMap: Record<string, string> = { totalAmount: 'total_amount', paidAmount: 'paid_amount', remainingAmount: 'remaining_amount', monthlyPayment: 'monthly_payment', interestRate: 'interest_rate', dueDate: 'due_date' };
  for (const [camel, snake] of Object.entries(camelMap)) {
    if (data[camel] !== undefined && data[snake] === undefined) { fields.push(`${snake} = ?`); values.push(data[camel]); }
  }
  values.push(id);
  db.prepare(`UPDATE debts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
  return snakeToCamel(updated);
}

async function handleDebtDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM debts WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 交易记录处理函数 ====================
async function handleTransactionGetAll(_event: any, filters?: any) {
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters?.month) {
    sql += " AND strftime('%Y-%m', date) = ?";
    params.push(filters.month);
  }

  if (filters?.type) {
    sql += ' AND type = ?';
    params.push(filters.type);
  }

  if (filters?.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }

  sql += ' ORDER BY date DESC, created_at DESC';

  const stmt = db.prepare(sql);
  return snakeToCamel(stmt.all(...params)) as any[];
}

async function handleTransactionGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  return snakeToCamel(stmt.get(id)) as any;
}

async function handleTransactionCreate(_event: any, data: any) {
  const id = generateId('tx');
  const stmt = db.prepare(`
    INSERT INTO transactions (id, user_id, date, type, category, amount, account_id, description, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  stmt.run(
    id,
    data.userId || data.user_id,
    data.date,
    data.type,
    data.category,
    data.amount,
    data.account_id || data.accountId,
    data.description,
    JSON.stringify(data.tags || [])
  );
  return { id, ...data };
}

async function handleTransactionUpdate(_event: any, id: number, data: any) {
  const allowed = ['date', 'type', 'category', 'amount', 'account_id', 'description', 'tags'];
  const fields = ["updated_at = datetime('now')"];
  const values: any[] = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'tags' ? JSON.stringify(data[key] || []) : data[key]);
    }
  }
  if (data.accountId !== undefined && data.account_id === undefined) { fields.push('account_id = ?'); values.push(data.accountId); }
  values.push(id);
  db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  return snakeToCamel(updated);
}

async function handleTransactionDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 目标处理函数 ====================
async function handleGoalGetAll() {
  const stmt = db.prepare('SELECT * FROM goals ORDER BY stage, created_at DESC');
  return snakeToCamel(stmt.all()) as any[];
}

async function handleGoalGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM goals WHERE id = ?');
  return snakeToCamel(stmt.get(id)) as any;
}

async function handleGoalCreate(_event: any, data: any) {
  const id = generateId('goal');
  const stmt = db.prepare(`
    INSERT INTO goals (id, user_id, stage, target_amount, current_amount, target_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  stmt.run(id, data.userId || data.user_id, data.stage, data.target_amount || data.targetAmount, data.current_amount || data.currentAmount, data.target_date || data.targetDate || null, data.notes || null);
  return { id, ...data };
}

async function handleGoalUpdate(_event: any, id: number, data: any) {
  const allowed = ['stage', 'target_amount', 'current_amount', 'target_date', 'notes', 'status'];
  const fields = ["updated_at = datetime('now')"];
  const values: any[] = [];
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
  }
  if (data.targetAmount !== undefined && data.target_amount === undefined) { fields.push('target_amount = ?'); values.push(data.targetAmount); }
  if (data.currentAmount !== undefined && data.current_amount === undefined) { fields.push('current_amount = ?'); values.push(data.currentAmount); }
  if (data.targetDate !== undefined && data.target_date === undefined) { fields.push('target_date = ?'); values.push(data.targetDate); }
  values.push(id);
  db.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  return snakeToCamel(updated);
}

async function handleGoalDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM goals WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 梦想处理函数 ====================
async function handleDreamGetAll() {
  const stmt = db.prepare('SELECT * FROM dreams ORDER BY priority DESC, created_at DESC');
  return snakeToCamel(stmt.all()) as any[];
}

async function handleDreamGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM dreams WHERE id = ?');
  return snakeToCamel(stmt.get(id)) as any;
}

async function handleDreamCreate(_event: any, data: any) {
  const id = generateId('dream');
  const stmt = db.prepare(`
    INSERT INTO dreams (id, user_id, title, description, image_url, estimated_cost, priority, is_achieved, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  stmt.run(
    id,
    data.userId || data.user_id,
    data.title,
    data.description,
    data.image_url || data.imageUrl,
    data.estimated_cost || data.estimatedCost,
    data.priority || 3,
    (data.achieved || data.is_achieved) ? 1 : 0
  );
  return { id, ...data };
}

async function handleDreamUpdate(_event: any, id: number, data: any) {
  const allowed = ['title', 'description', 'image_url', 'estimated_cost', 'priority', 'is_achieved'];
  const fields = ["updated_at = datetime('now')"];
  const values: any[] = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'is_achieved' ? (data[key] ? 1 : 0) : data[key]);
    }
  }
  if (data.imageUrl !== undefined && data.image_url === undefined) { fields.push('image_url = ?'); values.push(data.imageUrl); }
  if (data.estimatedCost !== undefined && data.estimated_cost === undefined) { fields.push('estimated_cost = ?'); values.push(data.estimatedCost); }
  if (data.achieved !== undefined && data.is_achieved === undefined) { fields.push('is_achieved = ?'); values.push(data.achieved ? 1 : 0); }
  values.push(id);
  db.prepare(`UPDATE dreams SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM dreams WHERE id = ?').get(id);
  return snakeToCamel(updated);
}

async function handleDreamDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM dreams WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 计算处理函数 ====================
async function handleCalculationGetNetWorth() {
  const accounts = await handleAccountGetAll();
  const debts = await handleDebtGetAll();
  return calculateNetWorth(accounts, debts);
}

async function handleCalculationGetCashFlow(_event: any, month: string) {
  const transactions = await handleTransactionGetAll(null, { month });
  return calculateCashFlow(transactions);
}

async function handleCalculationGetGoalProgress() {
  const goals = await handleGoalGetAll();
  const accounts = await handleAccountGetAll();
  const debts = await handleDebtGetAll();
  const netWorth = calculateNetWorth(accounts, debts);
  return calculateGoalProgress(goals, netWorth.netWorth);
}

async function handleCalculationGetRatios() {
  const accounts = await handleAccountGetAll();
  const debts = await handleDebtGetAll();
  const netWorth = calculateNetWorth(accounts, debts);

  // 获取本月现金流
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const transactions = await handleTransactionGetAll(null, { month });
  const cashFlow = calculateCashFlow(transactions);

  return calculateRatios(netWorth, cashFlow);
}

// ==================== 数据库管理处理函数 ====================
async function handleDatabaseReset() {
  try {
    // 删除所有数据
    db.exec('DELETE FROM dreams');
    db.exec('DELETE FROM goals');
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM debts');
    db.exec('DELETE FROM accounts');
    db.exec('DELETE FROM users');

    return { success: true };
  } catch (error) {
    console.error('重置数据库失败:', error);
    return { success: false, error: String(error) };
  }
}

// ==================== 仪表盘数据处理函数 ====================
async function handleDashboardGetData() {
  try {
    const accounts = await handleAccountGetAll() as any[];
    const debts = await handleDebtGetAll() as any[];
    const allGoals = await handleGoalGetAll() as any[];

    const totalAssets = accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const totalDebts = debts.reduce((s: number, d: any) => s + (d.remaining_amount || d.remainingAmount || 0), 0);
    const netWorth = totalAssets - totalDebts;

    // 本月收支
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTxns = await handleTransactionGetAll(null, { month }) as any[];
    const monthlyIncome = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const monthlyExpense = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount || 0), 0);

    // 投资数据
    const investAccounts = accounts.filter((a: any) => a.type === 'investment');
    const investTotal = investAccounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const investCost = investAccounts.reduce((s: number, a: any) => s + ((a as any).cost_basis || (a as any).initial_balance || (a.balance || 0)), 0);
    const investProfit = investTotal - investCost;
    const investReturnRate = investCost > 0 ? (investProfit / investCost) * 100 : 0;

    // 用户保障月数
    const user = await handleUserGet() as any;
    const guaranteeMonths = user?.guarantee_months || user?.settings?.guaranteeMonths || 6;
    const monthlyExpenseSafe = monthlyExpense || 1;

    return {
      user,
      netWorth,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      totalAssets,
      totalDebts,
      investTotal,
      investProfit,
      investReturnRate,
      guaranteeProgress: {
        current: Math.max(0, netWorth),
        target: monthlyExpenseSafe * guaranteeMonths,
        percentage: Math.min(100, Math.round(netWorth / (monthlyExpenseSafe * guaranteeMonths) * 100)),
      },
      securityProgress: {
        current: Math.max(0, netWorth),
        target: monthlyExpenseSafe * 150,
        percentage: Math.min(100, Math.round(netWorth / (monthlyExpenseSafe * 150) * 100)),
      },
      freedomProgress: {
        current: Math.max(0, netWorth),
        target: monthlyExpenseSafe * 2.5 * 150,
        percentage: Math.min(100, Math.round(netWorth / (monthlyExpenseSafe * 2.5 * 150) * 100)),
      },
      goals: allGoals,
      recentTransactions: monthTxns.slice(-5),
      accounts,
    };
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return {};
  }
}

// ==================== 导出处理函数 ====================
/**
 * 处理 PDF 导出请求
 */
async function handleExportToPDF(_event: any, filename: string) {
  try {
    // 获取当前窗口
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      throw new Error('无法获取当前窗口');
    }

    // 打开保存对话框让用户选择保存位置
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: 'PDF 文件', extensions: ['pdf'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // 生成 PDF
    const pdfData = await mainWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      landscape: false,
      marginsType: 0, // 默认边距
      scaleFactor: 100
    });

    // 保存 PDF 文件
    fs.writeFileSync(filePath, pdfData);

    return { success: true, filePath };
  } catch (error) {
    console.error('PDF 导出失败:', error);
    throw error;
  }
}
