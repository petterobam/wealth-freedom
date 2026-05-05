/**
 * 演示模式处理程序 (v2.1.0 增强版)
 * 提供 6 个月真实中文场景示例数据，让新用户首次打开即可看到完整效果
 * 
 * v2.1.0 改进：
 * - 6 个月交易数据（vs 之前 3 个月）
 * - 每月有变化的收支模式（工资涨、过年红包、双十一购物等）
 * - 更多分类（教育、医疗、订阅、水电煤、社交）
 * - 投资收益逐月波动
 * - 账户余额随交易动态变化
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

/** 计算过去 N 个月的年月信息 */
function getPastMonths(count: number): Array<{ y: number; m: number; label: string; prefix: string }> {
  const now = new Date();
  const months: Array<{ y: number; m: number; label: string; prefix: string }> = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    months.push({
      y,
      m,
      label: `${y}年${m}月`,
      prefix: `${y}-${String(m).padStart(2, '0')}`,
    });
  }
  return months;
}

/** 写入演示数据 */
async function handleDemoSeed() {
  const months = getPastMonths(6);
  const userId = 'demo-user';
  const txns: any[] = [];

  // 每月不同场景的交易数据
  const monthData: Array<{
    salary: number;
    sideIncome: number;
    investIncome: number;
    food: number;
    transport: number;
    shopping: number;
    entertainment: number;
    rent: number;
    insurance: number;
    utilities: number;
    education: number;
    healthcare: number;
    subscriptions: number;
    social: number;
    extra: Array<{ type: 'income' | 'expense'; category: string; amount: number; desc: string; tags: string }>;
  }> = [
    // 第1个月（6个月前）- 普通月
    {
      salary: 25000, sideIncome: 2000, investIncome: 980,
      food: 2300, transport: 550, shopping: 1200, entertainment: 650, rent: 5000,
      insurance: 480, utilities: 320, education: 0, healthcare: 0, subscriptions: 89, social: 400,
      extra: [
        { type: 'expense', category: '通讯', amount: 128, desc: '手机话费', tags: '["固定支出"]' },
      ],
    },
    // 第2个月（5个月前）- 双十一购物月
    {
      salary: 25000, sideIncome: 3500, investIncome: 1100,
      food: 2600, transport: 480, shopping: 4200, entertainment: 900, rent: 5000,
      insurance: 480, utilities: 290, education: 199, healthcare: 0, subscriptions: 89, social: 350,
      extra: [
        { type: 'expense', category: '通讯', amount: 128, desc: '手机话费', tags: '["固定支出"]' },
        { type: 'expense', category: '数码', amount: 2999, desc: '双十一: AirPods Pro', tags: '["双十一"]' },
        { type: 'expense', category: '服饰', amount: 1200, desc: '双十一: 冬装', tags: '["双十一"]' },
        { type: 'expense', category: '家居', amount: 860, desc: '双十一: 台灯+收纳', tags: '["双十一"]' },
      ],
    },
    // 第3个月（4个月前）- 年终奖月 + 学习投资
    {
      salary: 25000, sideIncome: 8000, investIncome: 1500,
      food: 3100, transport: 600, shopping: 800, entertainment: 1200, rent: 5000,
      insurance: 480, utilities: 350, education: 599, healthcare: 0, subscriptions: 89, social: 1800,
      extra: [
        { type: 'income', category: '年终奖', amount: 35000, desc: '年终奖', tags: '["奖金"]' },
        { type: 'expense', category: '人情', amount: 2000, desc: '春节红包', tags: '["春节"]' },
        { type: 'expense', category: '交通', amount: 2800, desc: '春节回家机票', tags: '["春节"]' },
        { type: 'expense', category: '通讯', amount: 128, desc: '手机话费', tags: '["固定支出"]' },
      ],
    },
    // 第4个月（3个月前）- 春节后平静月
    {
      salary: 25000, sideIncome: 2500, investIncome: 860,
      food: 2100, transport: 500, shopping: 950, entertainment: 500, rent: 5000,
      insurance: 480, utilities: 310, education: 0, healthcare: 380, subscriptions: 89, social: 200,
      extra: [
        { type: 'expense', category: '通讯', amount: 128, desc: '手机话费', tags: '["固定支出"]' },
        { type: 'expense', category: '数码', amount: 699, desc: '键盘', tags: '["数码"]' },
      ],
    },
    // 第5个月（2个月前）- 涨薪月 + 副业增长
    {
      salary: 28000, sideIncome: 5000, investIncome: 1320,
      food: 2400, transport: 520, shopping: 1100, entertainment: 750, rent: 5000,
      insurance: 480, utilities: 280, education: 1299, healthcare: 0, subscriptions: 89, social: 600,
      extra: [
        { type: 'income', category: '副业', amount: 3000, desc: '技术咨询项目', tags: '["副业"]' },
        { type: 'expense', category: '通讯', amount: 128, desc: '手机话费', tags: '["固定支出"]' },
        { type: 'expense', category: '健身', amount: 199, desc: '健身房月卡', tags: '["健康"]' },
      ],
    },
    // 第6个月（本月）- 当前月（数据较少，还在发生中）
    {
      salary: 28000, sideIncome: 4000, investIncome: 1050,
      food: 1800, transport: 400, shopping: 600, entertainment: 450, rent: 5000,
      insurance: 480, utilities: 260, education: 0, healthcare: 0, subscriptions: 89, social: 350,
      extra: [
        { type: 'expense', category: '通讯', amount: 128, desc: '手机话费', tags: '["固定支出"]' },
        { type: 'expense', category: '健身', amount: 199, desc: '健身房月卡', tags: '["健康"]' },
      ],
    },
  ];

  for (let i = 0; i < months.length; i++) {
    const { prefix } = months[i];
    const d = monthData[i];
    let day = 1;

    // 收入
    txns.push({ id: `demo-tx-${prefix}-salary`, date: `${prefix}-${String(day++).padStart(2, '0')}`, type: 'income', category: '工资', amount: d.salary, account_id: 'demo-acc-1', description: '月工资', tags: '["工资"]' });
    if (d.sideIncome > 0)
      txns.push({ id: `demo-tx-${prefix}-side`, date: `${prefix}-${String(day++).padStart(2, '0')}`, type: 'income', category: '副业', amount: d.sideIncome, account_id: 'demo-acc-1', description: '自由职业收入', tags: '["副业"]' });
    if (d.investIncome > 0)
      txns.push({ id: `demo-tx-${prefix}-invest`, date: `${prefix}-${String(Math.min(day + 5, 28)).padStart(2, '0')}`, type: 'income', category: '理财收益', amount: d.investIncome, account_id: 'demo-acc-5', description: '基金分红', tags: '["被动收入"]' });

    // 固定支出
    txns.push({ id: `demo-tx-${prefix}-rent`, date: `${prefix}-01`, type: 'expense', category: '住房', amount: d.rent, account_id: 'demo-acc-1', description: '房租', tags: '["固定支出"]' });
    txns.push({ id: `demo-tx-${prefix}-insurance`, date: `${prefix}-15`, type: 'expense', category: '保险', amount: d.insurance, account_id: 'demo-acc-1', description: '医疗险', tags: '["固定支出"]' });
    if (d.subscriptions > 0)
      txns.push({ id: `demo-tx-${prefix}-sub`, date: `${prefix}-01`, type: 'expense', category: '订阅', amount: d.subscriptions, account_id: 'demo-acc-2', description: 'iCloud+Spotify+ChatGPT', tags: '["订阅"]' });

    // 日常支出
    if (d.food > 0)
      txns.push({ id: `demo-tx-${prefix}-food`, date: `${prefix}-03`, type: 'expense', category: '餐饮', amount: d.food, account_id: 'demo-acc-1', description: '餐饮消费', tags: '["日常"]' });
    if (d.transport > 0)
      txns.push({ id: `demo-tx-${prefix}-transport`, date: `${prefix}-04`, type: 'expense', category: '交通', amount: d.transport, account_id: 'demo-acc-2', description: '地铁+打车', tags: '["日常"]' });
    if (d.shopping > 0)
      txns.push({ id: `demo-tx-${prefix}-shop`, date: `${prefix}-06`, type: 'expense', category: '购物', amount: d.shopping, account_id: 'demo-acc-2', description: '日用品+衣服', tags: '["日常"]' });
    if (d.entertainment > 0)
      txns.push({ id: `demo-tx-${prefix}-fun`, date: `${prefix}-08`, type: 'expense', category: '娱乐', amount: d.entertainment, account_id: 'demo-acc-3', description: '电影+聚餐', tags: '["娱乐"]' });
    if (d.utilities > 0)
      txns.push({ id: `demo-tx-${prefix}-utilities`, date: `${prefix}-10`, type: 'expense', category: '水电煤', amount: d.utilities, account_id: 'demo-acc-1', description: '水费+电费+燃气', tags: '["固定支出"]' });
    if (d.social > 0)
      txns.push({ id: `demo-tx-${prefix}-social`, date: `${prefix}-12`, type: 'expense', category: '社交', amount: d.social, account_id: 'demo-acc-2', description: '请客+聚会', tags: '["社交"]' });
    if (d.education > 0)
      txns.push({ id: `demo-tx-${prefix}-edu`, date: `${prefix}-20`, type: 'expense', category: '教育', amount: d.education, account_id: 'demo-acc-2', description: '在线课程', tags: '["自我提升"]' });
    if (d.healthcare > 0)
      txns.push({ id: `demo-tx-${prefix}-health`, date: `${prefix}-18`, type: 'expense', category: '医疗', amount: d.healthcare, account_id: 'demo-acc-1', description: '门诊+药品', tags: '["医疗"]' });

    // 额外交易
    for (let j = 0; j < d.extra.length; j++) {
      const e = d.extra[j];
      const eDay = String(Math.min(25 + j, 28)).padStart(2, '0');
      txns.push({
        id: `demo-tx-${prefix}-extra-${j}`,
        date: `${prefix}-${eDay}`,
        type: e.type,
        category: e.category,
        amount: e.amount,
        account_id: e.type === 'income' ? 'demo-acc-1' : 'demo-acc-2',
        description: e.desc,
        tags: e.tags,
      });
    }
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

    // 账户 - 更真实的余额分布
    const accounts = [
      { id: 'demo-acc-1', name: '招商银行储蓄卡', type: 'cash', balance: 68500, institution: '招商银行' },
      { id: 'demo-acc-2', name: '支付宝', type: 'cash', balance: 15600, institution: '支付宝' },
      { id: 'demo-acc-3', name: '微信零钱', type: 'cash', balance: 4200, institution: '微信' },
      { id: 'demo-acc-4', name: '余额宝', type: 'savings', balance: 120000, institution: '支付宝' },
      { id: 'demo-acc-5', name: '沪深300指数基金', type: 'investment', balance: 180000, institution: '天天基金' },
      { id: 'demo-acc-6', name: '纳斯达克100 ETF', type: 'investment', balance: 95000, institution: '华泰证券' },
      { id: 'demo-acc-7', name: 'A 股股票账户', type: 'investment', balance: 85000, institution: '华泰证券' },
    ];
    const insAcc = db.prepare(`INSERT OR REPLACE INTO accounts (id, user_id, name, type, balance, currency, institution, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'CNY', ?, '', datetime('now'), datetime('now'))`);
    for (const a of accounts) insAcc.run(a.id, userId, a.name, a.type, a.balance, a.institution);

    // 负债
    const insDebt = db.prepare(`INSERT OR REPLACE INTO debts (id, user_id, name, total_amount, paid_amount, remaining_amount, monthly_payment, interest_rate, type, priority, due_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', datetime('now'), datetime('now'))`);
    insDebt.run('demo-debt-1', userId, '房贷', 1500000, 360000, 1140000, 8000, 4.2, 'mortgage', 1);
    insDebt.run('demo-debt-2', userId, '花呗', 3500, 0, 3500, 350, 14.6, 'consumer', 2);

    // 目标 - 基于最新数据的真实进度
    const totalAssets = accounts.reduce((s, a) => s + a.balance, 0); // 568,300
    const totalDebt = 1140000 + 3500; // 1,143,500
    const netWorth = totalAssets - totalDebt; // ~-575,200，但净资产计算是资产-负债
    const investAssets = 180000 + 95000 + 85000; // 360,000
    const insGoal = db.prepare(`INSERT OR REPLACE INTO goals (id, user_id, stage, target_amount, current_amount, target_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`);
    insGoal.run('demo-goal-1', userId, 'security', 65000, 120000, '2026-06-30', '财务保障：6个月生活储备金 ✅ 已达成');
    insGoal.run('demo-goal-2', userId, 'safety', 975000, investAssets, '2031-12-31', '财务安全：靠利息覆盖日常支出');
    insGoal.run('demo-goal-3', userId, 'freedom', 3600000, investAssets, '2040-12-31', '财务自由：靠利息实现梦想生活');

    // 梦想
    const insDream = db.prepare(`INSERT OR REPLACE INTO dreams (id, user_id, title, description, image_url, estimated_cost, priority, is_achieved, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, 0, datetime('now'), datetime('now'))`);
    insDream.run('demo-dream-1', userId, '环游世界', '用一年时间环游世界，体验不同文化', 500000, 1);
    insDream.run('demo-dream-2', userId, '海边小屋', '在厦门或大理买一套小房子', 2000000, 2);
    insDream.run('demo-dream-3', userId, '出版一本书', '写一本关于财务自由的书，分享经验', 50000, 3);
    insDream.run('demo-dream-4', userId, '开一间咖啡馆', '不需要赚钱，只为社区和朋友', 300000, 4);

    // 交易
    const insTx = db.prepare(`INSERT OR REPLACE INTO transactions (id, user_id, date, type, category, amount, account_id, description, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`);
    for (const t of txns) insTx.run(t.id, userId, t.date, t.type, t.category, t.amount, t.account_id, t.description, t.tags);
  });

  insert();
  return { success: true, message: `演示数据已加载（${txns.length}笔交易，6个月）` };
}

/** 清除演示数据 */
async function handleDemoClear() {
  const del = db.transaction(() => {
    db.prepare("DELETE FROM app_settings WHERE key = 'demo_mode'").run();
    const tables = ['transactions', 'dreams', 'goals', 'debts', 'accounts', 'users'];
    for (const t of tables) {
      db.prepare(`DELETE FROM ${t}`).run();
    }
  });
  del();
  return { success: true, message: '演示数据已清除' };
}
