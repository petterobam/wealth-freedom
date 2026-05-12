/**
 * 投资追踪 IPC 处理器
 * v0.5.0 - 投资账户、组合、持仓、交易管理
 */

import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

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

export const registerInvestmentHandlers = (db: Database.Database): void => {
  const DEFAULT_USER_ID = 'default';

  // ========== 投资账户 ==========

  ipcMain.handle('investment:get-accounts', () => {
    return snakeToCamel(db.prepare('SELECT * FROM investment_accounts WHERE user_id = ? ORDER BY created_at DESC').all(DEFAULT_USER_ID));
  });

  ipcMain.handle('investment:add-account', (_e, data: { name: string; platform: string; type?: string; notes?: string }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO investment_accounts (id, user_id, name, platform, type, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, DEFAULT_USER_ID, data.name, data.platform, data.type || 'stock', data.notes || null, now, now);
    return { id, ...data };
  });

  ipcMain.handle('investment:update-account', (_e, data: { id: string; name?: string; platform?: string; type?: string; notes?: string; is_active?: number }) => {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (k !== 'id' && v !== undefined) { fields.push(`${k} = ?`); values.push(v); }
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = ?'); values.push(new Date().toISOString());
    values.push(data.id);
    db.prepare(`UPDATE investment_accounts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return snakeToCamel(db.prepare('SELECT * FROM investment_accounts WHERE id = ?').get(data.id));
  });

  ipcMain.handle('investment:delete-account', (_e, id: string) => {
    // 级联删除：先删交易→持仓→组合→账户
    const portfolioIds = db.prepare('SELECT id FROM portfolios WHERE account_id = ?').all(id).map((r: any) => r.id);
    for (const pid of portfolioIds) {
      const holdingIds = db.prepare('SELECT id FROM holdings WHERE portfolio_id = ?').all(pid).map((r: any) => r.id);
      for (const hid of holdingIds) {
        db.prepare('DELETE FROM investment_transactions WHERE holding_id = ?').run(hid);
      }
      db.prepare('DELETE FROM holdings WHERE portfolio_id = ?').run(pid);
    }
    db.prepare('DELETE FROM portfolios WHERE account_id = ?').run(id);
    db.prepare('DELETE FROM investment_accounts WHERE id = ?').run(id);
    return { success: true };
  });

  // ========== 投资组合 ==========

  ipcMain.handle('investment:get-portfolios', (_e, accountId?: string) => {
    if (accountId) {
      return snakeToCamel(db.prepare('SELECT * FROM portfolios WHERE account_id = ? ORDER BY created_at DESC').all(accountId));
    }
    return snakeToCamel(db.prepare('SELECT p.*, ia.name AS account_name, ia.platform FROM portfolios p JOIN investment_accounts ia ON p.account_id = ia.id ORDER BY p.created_at DESC').all());
  });

  ipcMain.handle('investment:add-portfolio', (_e, data: { account_id: string; name: string; description?: string }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO portfolios (id, account_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(id, data.account_id, data.name, data.description || null, now, now);
    return { id, ...data };
  });

  ipcMain.handle('investment:delete-portfolio', (_e, id: string) => {
    const holdingIds = db.prepare('SELECT id FROM holdings WHERE portfolio_id = ?').all(id).map((r: any) => r.id);
    for (const hid of holdingIds) {
      db.prepare('DELETE FROM investment_transactions WHERE holding_id = ?').run(hid);
    }
    db.prepare('DELETE FROM holdings WHERE portfolio_id = ?').run(id);
    db.prepare('DELETE FROM portfolios WHERE id = ?').run(id);
    return { success: true };
  });

  // ========== 持仓 ==========

  ipcMain.handle('investment:get-holdings', (_e, portfolioId: string) => {
    return snakeToCamel(db.prepare('SELECT * FROM holdings WHERE portfolio_id = ? ORDER BY market_value DESC').all(portfolioId));
  });

  ipcMain.handle('investment:add-holding', (_e, data: { portfolio_id: string; symbol: string; name?: string; type?: string; quantity?: number; avg_cost?: number }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const qty = data.quantity || 0;
    const cost = data.avg_cost || 0;
    db.prepare(`INSERT INTO holdings (id, portfolio_id, symbol, name, type, quantity, avg_cost, current_price, market_value, profit_loss, profit_loss_pct, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?)`).run(id, data.portfolio_id, data.symbol, data.name || data.symbol, data.type || 'stock', qty, cost, now, now);
    return { id, ...data, market_value: 0, profit_loss: 0 };
  });

  ipcMain.handle('investment:update-price', (_e, data: { id: string; current_price: number }) => {
    const holding: any = snakeToCamel(db.prepare('SELECT * FROM holdings WHERE id = ?').get(data.id));
    if (!holding) return null;
    const mv = holding.quantity * data.current_price;
    const cost = holding.quantity * holding.avg_cost;
    const pl = mv - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    const now = new Date().toISOString();
    db.prepare('UPDATE holdings SET current_price = ?, market_value = ?, profit_loss = ?, profit_loss_pct = ?, updated_at = ? WHERE id = ?')
      .run(data.current_price, mv, pl, plPct, now, data.id);
    return { ...holding, current_price: data.current_price, market_value: mv, profit_loss: pl, profit_loss_pct: plPct };
  });

  ipcMain.handle('investment:batch-update-prices', (_e, updates: Array<{ id: string; current_price: number }>) => {
    const stmt = db.prepare('UPDATE holdings SET current_price = ?, market_value = quantity * ?, profit_loss = quantity * ? - quantity * avg_cost, profit_loss_pct = CASE WHEN quantity * avg_cost > 0 THEN (quantity * ? - quantity * avg_cost) / (quantity * avg_cost) * 100 ELSE 0 END, updated_at = ? WHERE id = ?');
    const now = new Date().toISOString();
    const transaction = db.transaction(() => {
      for (const u of updates) {
        stmt.run(u.current_price, u.current_price, u.current_price, u.current_price, now, u.id);
      }
    });
    transaction();
    return { updated: updates.length };
  });

  ipcMain.handle('investment:delete-holding', (_e, id: string) => {
    db.prepare('DELETE FROM investment_transactions WHERE holding_id = ?').run(id);
    db.prepare('DELETE FROM holdings WHERE id = ?').run(id);
    return { success: true };
  });

  // ========== 投资交易 ==========

  ipcMain.handle('investment:get-transactions', (_e, opts: { holding_id?: string; type?: string; start_date?: string; end_date?: string; limit?: number }) => {
    let sql = 'SELECT it.*, h.symbol, h.name AS holding_name FROM investment_transactions it JOIN holdings h ON it.holding_id = h.id WHERE 1=1';
    const params: unknown[] = [];
    if (opts.holding_id) { sql += ' AND it.holding_id = ?'; params.push(opts.holding_id); }
    if (opts.type) { sql += ' AND it.type = ?'; params.push(opts.type); }
    if (opts.start_date) { sql += ' AND it.transaction_date >= ?'; params.push(opts.start_date); }
    if (opts.end_date) { sql += ' AND it.transaction_date <= ?'; params.push(opts.end_date); }
    sql += ' ORDER BY it.transaction_date DESC';
    if (opts.limit) { sql += ' LIMIT ?'; params.push(opts.limit); }
    return snakeToCamel(db.prepare(sql).all(...params));
  });

  ipcMain.handle('investment:add-transaction', (_e, data: { holding_id: string; type: string; quantity: number; price: number; fee?: number; transaction_date: string; notes?: string }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const amount = data.quantity * data.price;

    const transaction = db.transaction(() => {
      // 记录交易
      db.prepare(`INSERT INTO investment_transactions (id, holding_id, type, quantity, price, amount, fee, transaction_date, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, data.holding_id, data.type, data.quantity, data.price, amount, data.fee || 0, data.transaction_date, data.notes || null, now);

      // 更新持仓
      const holding: any = snakeToCamel(db.prepare('SELECT * FROM holdings WHERE id = ?').get(data.holding_id));
      if (holding) {
        let newQty = holding.quantity;
        let newAvgCost = holding.avg_cost;

        if (data.type === 'buy') {
          // 买入：加权平均成本
          const totalCost = holding.avg_cost * holding.quantity + data.price * data.quantity;
          newQty = holding.quantity + data.quantity;
          newAvgCost = newQty > 0 ? totalCost / newQty : 0;
        } else if (data.type === 'sell') {
          // 卖出：不改变平均成本
          newQty = holding.quantity - data.quantity;
        }
        // 分红不影响持仓数量

        newQty = Math.max(0, newQty);
        const mv = newQty * holding.current_price;
        const cost = newQty * newAvgCost;
        const pl = mv - cost;
        const plPct = cost > 0 ? (pl / cost) * 100 : 0;

        db.prepare('UPDATE holdings SET quantity = ?, avg_cost = ?, market_value = ?, profit_loss = ?, profit_loss_pct = ?, updated_at = ? WHERE id = ?')
          .run(newQty, newAvgCost, mv, pl, plPct, now, data.holding_id);
      }
    });

    transaction();
    return { id, amount };
  });

  ipcMain.handle('investment:delete-transaction', (_e, id: string) => {
    db.prepare('DELETE FROM investment_transactions WHERE id = ?').run(id);
    return { success: true };
  });

  // ========== 投资分析汇总 ==========

  ipcMain.handle('investment:get-summary', () => {
    const totalMV = db.prepare('SELECT COALESCE(SUM(market_value), 0) AS total FROM holdings').get() as any;
    const totalPL = db.prepare('SELECT COALESCE(SUM(profit_loss), 0) AS total FROM holdings').get() as any;
    const totalCost = db.prepare('SELECT COALESCE(SUM(quantity * avg_cost), 0) AS total FROM holdings').get() as any;
    const holdingCount = db.prepare('SELECT COUNT(*) AS count FROM holdings WHERE quantity > 0').get() as any;
    const realizedPL = db.prepare(`SELECT COALESCE(SUM(
      CASE WHEN type = 'sell' THEN quantity * price - quantity * (SELECT avg_cost FROM holdings WHERE id = investment_transactions.holding_id)
           WHEN type = 'dividend' THEN amount
           ELSE 0 END
    ), 0) AS total FROM investment_transactions`).get() as any;

    return {
      total_market_value: totalMV.total,
      total_profit_loss: totalPL.total,
      total_cost: totalCost.total,
      total_return_pct: totalCost.total > 0 ? (totalPL.total / totalCost.total) * 100 : 0,
      holding_count: holdingCount.count,
      realized_profit: realizedPL.total,
    };
  });

  // ========== 资产配置分析 ==========

  ipcMain.handle('investment:get-allocation', () => {
    // 按类型分布
    const byType = db.prepare('SELECT type, SUM(market_value) AS value FROM holdings WHERE quantity > 0 GROUP BY type').all();
    // 按账户分布
    const byAccount = db.prepare(`SELECT ia.name AS account_name, ia.platform, SUM(h.market_value) AS value
      FROM holdings h JOIN portfolios p ON h.portfolio_id = p.id JOIN investment_accounts ia ON p.account_id = ia.id
      WHERE h.quantity > 0 GROUP BY ia.id`).all();
    // Top10 持仓
    const top10 = db.prepare('SELECT symbol, name, market_value, profit_loss_pct FROM holdings WHERE quantity > 0 ORDER BY market_value DESC LIMIT 10').all();

    return { by_type: byType, by_account: byAccount, top_holdings: top10 };
  });
};
