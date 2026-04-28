/**
 * 演示模式处理程序 (v1.1.0)
 * 提供内置示例数据，让新用户首次打开即可看到完整效果
 */

import { ipcMain } from 'electron';
import { initDatabase } from './database';

let db: ReturnType<typeof initDatabase>;

export function initDemoHandlers(database: ReturnType<typeof initDatabase>) {
  db = database;

  ipcMain.handle('demo:status', handleDemoStatus);
  ipcMain.handle('demo:seed', handleDemoSeed);
  ipcMain.handle('demo:clear', handleDemoClear);
}

/** 检查是否处于演示模式 */
async function handleDemoStatus() {
  try {
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'demo_mode'").get() as { value: string } | undefined;
    return { isDemo: row?.value === 'true' };
  } catch {
    return { isDemo: false };
  }
}

/** 写入演示数据 */
async function handleDemoSeed() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const prev = now.getMonth() === 0 ? 11 : now.getMonth();
  const prevY = now.getMonth() === 0 ? y - 1 : y;
  const pm = String(prev + 1).padStart(2, '0');
  const prev2 = prev === 0 ? 11 : prev - 1;
  const prev2Y = prev === 0 ? prevY - 1 : prevY;
  const pm2 = String(prev2 + 1).padStart(2, '0');

  const userId = 'demo-user';
  const txns: any[] = [];

  // 生成3个月交易数据
  const months = [
    { y: prev2Y, m: pm2, label: '3个月前' },
    { y: prevY, m: pm, label: '2个月前' },
    { y, m, label: '本月' },
  ];

  for (const month of months) {
    const prefix = `${month.y}-${month.m}`;
    txns.push(
      { id: `demo-tx-${prefix}-salary`, date: `${prefix}-01`, type: 'income', category: '工资', amount: 25000, account_id: 'demo-acc-1', description: '月工资', tags: '["工资"]' },
      { id: `demo-tx-${prefix}-side`, date: `${prefix}-05`, type: 'income', category: '副业', amount: 3000, account_id: 'demo-acc-1', description: '自由职业收入', tags: '["副业"]' },
      { id: `demo-tx-${prefix}-invest`, date: `${prefix}-10`, type: 'income', category: '理财收益', amount: 1200, account_id: 'demo-acc-5', description: '基金分红', tags: '["被动收入"]' },
      { id: `demo-tx-${prefix}-food`, date: `${prefix}-03`, type: 'expense', category: '餐饮', amount: 2500, account_id: 'demo-acc-1', description: '餐饮消费', tags: '["日常"]' },
      { id: `demo-tx-${prefix}-transport`, date: `${prefix}-04`, type: 'expense', category: '交通', amount: 600, account_id: 'demo-acc-2', description: '地铁+打车', tags: '["日常"]' },
      { id: `demo-tx-${prefix}-shop`, date: `${prefix}-06`, type: 'expense', category: '购物', amount: 1500, account_id: 'demo-acc-2', description: '日用品+衣服', tags: '["日常"]' },
      { id: `demo-tx-${prefix}-fun`, date: `${prefix}-08`, type: 'expense', category: '娱乐', amount: 800, account_id: 'demo-acc-3', description: '电影+聚餐', tags: '["娱乐"]' },
      { id: `demo-tx-${prefix}-rent`, date: `${prefix}-01`, type: 'expense', category: '住房', amount: 5000, account_id: 'demo-acc-1', description: '房租', tags: '["固定支出"]' },
      { id: `demo-tx-${prefix}-insurance`, date: `${prefix}-15`, type: 'expense', category: '保险', amount: 500, account_id: 'demo-acc-1', description: '医疗险', tags: '["固定支出"]' },
    );
  }

  const insert = db.transaction(() => {
    // 标记演示模式
    db.prepare(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`).run();
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('demo_mode', 'true')").run();

    // 用户
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, currency, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, '演示用户', 'demo@example.com', 'CNY');

    // 账户
    const accounts = [
      { id: 'demo-acc-1', name: '招商银行储蓄卡', type: 'cash', balance: 52000, institution: '招商银行' },
      { id: 'demo-acc-2', name: '支付宝', type: 'cash', balance: 12000, institution: '支付宝' },
      { id: 'demo-acc-3', name: '微信零钱', type: 'cash', balance: 3500, institution: '微信' },
      { id: 'demo-acc-4', name: '余额宝', type: 'savings', balance: 100000, institution: '支付宝' },
      { id: 'demo-acc-5', name: '指数基金', type: 'investment', balance: 200000, institution: '天天基金' },
      { id: 'demo-acc-6', name: '股票账户', type: 'investment', balance: 150000, institution: '华泰证券' },
    ];
    const insAcc = db.prepare(`INSERT OR REPLACE INTO accounts (id, user_id, name, type, balance, currency, institution, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'CNY', ?, '', datetime('now'), datetime('now'))`);
    for (const a of accounts) insAcc.run(a.id, userId, a.name, a.type, a.balance, a.institution);

    // 负债
    const insDebt = db.prepare(`INSERT OR REPLACE INTO debts (id, user_id, name, total_amount, paid_amount, remaining_amount, monthly_payment, interest_rate, type, priority, due_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', datetime('now'), datetime('now'))`);
    insDebt.run('demo-debt-1', userId, '房贷', 1500000, 300000, 1200000, 8000, 4.9, 'mortgage', 1);
    insDebt.run('demo-debt-2', userId, '信用卡', 8000, 3000, 5000, 500, 18.0, 'consumer', 2);

    // 目标
    const insGoal = db.prepare(`INSERT OR REPLACE INTO goals (id, user_id, stage, target_amount, current_amount, target_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`);
    insGoal.run('demo-goal-1', userId, 'security', 65000, 100000, '2026-06-30', '财务保障：6个月生活储备金');
    insGoal.run('demo-goal-2', userId, 'safety', 975000, 350000, '2030-12-31', '财务安全：靠利息覆盖日常支出');
    insGoal.run('demo-goal-3', userId, 'freedom', 3000000, 350000, '2040-12-31', '财务自由：靠利息实现梦想生活');

    // 梦想
    const insDream = db.prepare(`INSERT OR REPLACE INTO dreams (id, user_id, title, description, image_url, estimated_cost, priority, is_achieved, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, 0, datetime('now'), datetime('now'))`);
    insDream.run('demo-dream-1', userId, '环游世界', '用一年时间环游世界', 500000, 1);
    insDream.run('demo-dream-2', userId, '海边别墅', '在海边买一套别墅', 3000000, 2);
    insDream.run('demo-dream-3', userId, '出版一本书', '写一本关于财务自由的书', 50000, 3);

    // 交易
    const insTx = db.prepare(`INSERT OR REPLACE INTO transactions (id, user_id, date, type, category, amount, account_id, description, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`);
    for (const t of txns) insTx.run(t.id, userId, t.date, t.type, t.category, t.amount, t.account_id, t.description, t.tags);
  });

  insert();
  return { success: true, message: '演示数据已加载' };
}

/** 清除演示数据 */
async function handleDemoClear() {
  const del = db.transaction(() => {
    db.prepare("DELETE FROM app_settings WHERE key = 'demo_mode'").run();
    // 删除所有数据（演示模式下所有数据都是demo的）
    const tables = ['transactions', 'dreams', 'goals', 'debts', 'accounts', 'users'];
    for (const t of tables) {
      db.prepare(`DELETE FROM ${t}`).run();
    }
  });
  del();
  return { success: true, message: '演示数据已清除' };
}
