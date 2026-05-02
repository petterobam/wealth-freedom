/**
 * 多币种 IPC 处理程序
 * v1.9.0 — 汇率查询、金额换算、币种设置
 */

import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';
import {
  getExchangeRate,
  convertAmount,
  convertToBaseCurrency,
  getRatesForBaseCurrency,
  getCacheStatus,
  clearCache,
  SUPPORTED_CURRENCIES,
  formatCurrency,
  getCurrencySymbol,
} from './currencyService';

let db: Database.Database;

export function initCurrencyHandlers(database: Database.Database) {
  db = database;

  // 数据库迁移：为缺少 currency 字段的表添加
  migrateCurrencyFields(db);

  ipcMain.handle('currency:getSupported', handleGetSupported);
  ipcMain.handle('currency:getRate', handleGetRate);
  ipcMain.handle('currency:convert', handleConvert);
  ipcMain.handle('currency:convertBatch', handleConvertBatch);
  ipcMain.handle('currency:getRatesForBase', handleGetRatesForBase);
  ipcMain.handle('currency:getBaseCurrency', handleGetBaseCurrency);
  ipcMain.handle('currency:setBaseCurrency', handleSetBaseCurrency);
  ipcMain.handle('currency:getCacheStatus', handleGetCacheStatus);
  ipcMain.handle('currency:clearCache', handleClearCache);
  ipcMain.handle('currency:formatAmount', handleFormatAmount);
}

/**
 * 数据库迁移：为缺少 currency 字段的表添加
 */
function migrateCurrencyFields(database: Database.Database) {
  const tables = ['transactions', 'budgets'];

  for (const table of tables) {
    try {
      // 检查是否已有 currency 列
      const columns = database
        .prepare(`PRAGMA table_info(${table})`)
        .all() as Array<{ name: string }>;

      if (!columns.some(col => col.name === 'currency')) {
        database.exec(
          `ALTER TABLE ${table} ADD COLUMN currency TEXT DEFAULT 'CNY'`
        );
        console.log(`[currency] 迁移完成：${table} 添加 currency 字段`);
      }
    } catch (err) {
      console.warn(`[currency] 迁移 ${table} 跳过:`, err);
    }
  }
}

// ==================== Handlers ====================

async function handleGetSupported() {
  return SUPPORTED_CURRENCIES;
}

async function handleGetRate(
  _e: Electron.IpcMainInvokeEvent,
  { from, to }: { from: string; to: string }
) {
  const rate = await getExchangeRate(from, to);
  return { from, to, rate };
}

async function handleConvert(
  _e: Electron.IpcMainInvokeEvent,
  { amount, from, to }: { amount: number; from: string; to: string }
) {
  return convertAmount(amount, from, to);
}

async function handleConvertBatch(
  _e: Electron.IpcMainInvokeEvent,
  { items, baseCurrency }: {
    items: Array<{ amount: number; currency: string }>;
    baseCurrency: string;
  }
) {
  return convertToBaseCurrency(items, baseCurrency);
}

async function handleGetRatesForBase(
  _e: Electron.IpcMainInvokeEvent,
  { baseCurrency, currencies }: { baseCurrency: string; currencies: string[] }
) {
  const rates = await getRatesForBaseCurrency(baseCurrency, currencies);
  return Object.fromEntries(rates);
}

async function handleGetBaseCurrency(
  _e: Electron.IpcMainInvokeEvent,
  { userId }: { userId: string }
) {
  const row = db
    .prepare('SELECT currency FROM users WHERE id = ?')
    .get(userId) as { currency: string } | undefined;
  return row?.currency ?? 'CNY';
}

async function handleSetBaseCurrency(
  _e: Electron.IpcMainInvokeEvent,
  { userId, currency }: { userId: string; currency: string }
) {
  db.prepare('UPDATE users SET currency = ?, updated_at = ? WHERE id = ?')
    .run(currency, new Date().toISOString(), userId);
  return { success: true, currency };
}

async function handleGetCacheStatus() {
  return getCacheStatus();
}

async function handleClearCache() {
  clearCache();
  return { success: true };
}

async function handleFormatAmount(
  _e: Electron.IpcMainInvokeEvent,
  { amount, currency }: { amount: number; currency: string }
) {
  return formatCurrency(amount, currency);
}
