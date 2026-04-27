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
}

// ==================== 用户处理函数 ====================
async function handleUserGet() {
  const stmt = db.prepare('SELECT * FROM users LIMIT 1');
  return stmt.get() as any;
}

// 生成唯一 ID 的辅助函数
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

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
  const stmt = db.prepare(`
    UPDATE users
    SET name = ?, email = ?, avatar = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(data.name, data.email, data.avatar, data.id);
  return data;
}

// ==================== 账户处理函数 ====================
async function handleAccountGetAll() {
  const stmt = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC');
  return stmt.all() as any[];
}

async function handleAccountGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
  return stmt.get(id) as any;
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
  const stmt = db.prepare(`
    UPDATE accounts
    SET name = ?, type = ?, balance = ?, currency = ?, institution = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(data.name, data.type, data.balance, data.currency, data.institution, data.notes, id);
  return { id, ...data };
}

async function handleAccountDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM accounts WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 负债处理函数 ====================
async function handleDebtGetAll() {
  const stmt = db.prepare('SELECT * FROM debts ORDER BY priority DESC, created_at DESC');
  return stmt.all() as any[];
}

async function handleDebtGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM debts WHERE id = ?');
  return stmt.get(id) as any;
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
  const stmt = db.prepare(`
    UPDATE debts
    SET name = ?, total_amount = ?, paid_amount = ?, remaining_amount = ?, monthly_payment = ?, interest_rate = ?, type = ?, priority = ?, due_date = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    data.name,
    data.total_amount,
    data.paid_amount,
    data.remaining_amount,
    data.monthly_payment,
    data.interest_rate,
    data.type,
    data.priority,
    data.due_date,
    data.notes,
    id
  );
  return { id, ...data };
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
  return stmt.all(...params) as any[];
}

async function handleTransactionGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  return stmt.get(id) as any;
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
  const stmt = db.prepare(`
    UPDATE transactions
    SET date = ?, type = ?, category = ?, amount = ?, account_id = ?, description = ?, tags = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    data.date,
    data.type,
    data.category,
    data.amount,
    data.account_id,
    data.description,
    JSON.stringify(data.tags || []),
    id
  );
  return { id, ...data };
}

async function handleTransactionDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 目标处理函数 ====================
async function handleGoalGetAll() {
  const stmt = db.prepare('SELECT * FROM goals ORDER BY stage, created_at DESC');
  return stmt.all() as any[];
}

async function handleGoalGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM goals WHERE id = ?');
  return stmt.get(id) as any;
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
  const stmt = db.prepare(`
    UPDATE goals
    SET stage = ?, target_amount = ?, current_amount = ?, target_date = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(data.stage, data.target_amount, data.current_amount, data.target_date, data.notes, id);
  return { id, ...data };
}

async function handleGoalDelete(_event: any, id: number) {
  const stmt = db.prepare('DELETE FROM goals WHERE id = ?');
  stmt.run(id);
  return { id };
}

// ==================== 梦想处理函数 ====================
async function handleDreamGetAll() {
  const stmt = db.prepare('SELECT * FROM dreams ORDER BY priority DESC, created_at DESC');
  return stmt.all() as any[];
}

async function handleDreamGetById(_event: any, id: number) {
  const stmt = db.prepare('SELECT * FROM dreams WHERE id = ?');
  return stmt.get(id) as any;
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
  const stmt = db.prepare(`
    UPDATE dreams
    SET title = ?, description = ?, image_url = ?, estimated_cost = ?, priority = ?, achieved = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    data.title,
    data.description,
    data.image_url,
    data.estimated_cost,
    data.priority,
    data.achieved ? 1 : 0,
    id
  );
  return { id, ...data };
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
