/**
 * 测试数据种子
 * 用于开发和测试，提供示例数据
 */

import { initDatabase } from './database';

/**
 * 初始化测试数据
 */
export function seedTestData() {
  const db = initDatabase();

  // 检查是否已有数据
  const existingUser = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUser.count > 0) {
    console.log('数据已存在，跳过种子数据初始化');
    return;
  }

  console.log('初始化测试数据...');

  // ==================== 用户数据 ====================
  db.prepare(`
    INSERT INTO users (id, name, email, avatar, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run('user-1', '测试用户', 'test@example.com', null);

  // ==================== 账户（资产）数据 ====================
  const accounts = [
    { id: 'account-1', name: '招商银行储蓄卡', type: 'cash', balance: 50000, currency: 'CNY', institution: '招商银行', notes: '日常消费账户' },
    { id: 'account-2', name: '支付宝余额', type: 'cash', balance: 8000, currency: 'CNY', institution: '支付宝', notes: '线上支付' },
    { id: 'account-3', name: '微信零钱', type: 'cash', balance: 3000, currency: 'CNY', institution: '微信', notes: '日常小额支付' },
    { id: 'account-4', name: '余额宝', type: 'savings', balance: 100000, currency: 'CNY', institution: '支付宝', notes: '应急储备金' },
    { id: 'account-5', name: '基金账户', type: 'investment', balance: 200000, currency: 'CNY', institution: '天天基金', notes: '指数基金定投' },
    { id: 'account-6', name: '股票账户', type: 'investment', balance: 150000, currency: 'CNY', institution: '华泰证券', notes: '价值投资' },
  ];

  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, user_id, name, type, balance, currency, institution, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const account of accounts) {
    insertAccount.run(account.id, 'user-1', account.name, account.type, account.balance, account.currency, account.institution, account.notes);
  }

  // ==================== 负债数据 ====================
  const debts = [
    {
      name: '房贷',
      total_amount: 1500000,
      paid_amount: 300000,
      remaining_amount: 1200000,
      monthly_payment: 8000,
      interest_rate: 4.9,
      type: 'mortgage',
      priority: 1,
      due_date: '2040-12-31',
      notes: '首套房贷款'
    },
    {
      name: '信用卡（招商）',
      total_amount: 5000,
      paid_amount: 0,
      remaining_amount: 5000,
      monthly_payment: 500,
      interest_rate: 18.0,
      type: 'consumer',
      priority: 2,
      due_date: '2026-04-15',
      notes: '本月消费'
    },
  ];

  const insertDebt = db.prepare(`
    INSERT INTO debts (user_id, name, total_amount, paid_amount, remaining_amount, monthly_payment, interest_rate, type, priority, due_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const debt of debts) {
    insertDebt.run('user-1', debt.name, debt.total_amount, debt.paid_amount, debt.remaining_amount, debt.monthly_payment, debt.interest_rate, debt.type, debt.priority, debt.due_date, debt.notes);
  }

  // ==================== 三阶段目标数据 ====================
  const goals = [
    {
      stage: 'security',
      target_amount: 36000,  // 月支出 6000 × 6 个月
      current_amount: 100000, // 余额宝储备金
      target_date: '2026-06-30',
      notes: '财务保障：6个月生活储备金'
    },
    {
      stage: 'safety',
      target_amount: 900000,  // 月所需 6000 × 150
      current_amount: 350000, // 基金+股票
      target_date: '2030-12-31',
      notes: '财务安全：靠利息覆盖日常支出'
    },
    {
      stage: 'freedom',
      target_amount: 3000000, // 梦想月成本 20000 × 150
      current_amount: 350000,
      target_date: '2040-12-31',
      notes: '财务自由：靠利息实现梦想生活'
    },
  ];

  const insertGoal = db.prepare(`
    INSERT INTO goals (user_id, stage, target_amount, current_amount, target_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const goal of goals) {
    insertGoal.run('user-1', goal.stage, goal.target_amount, goal.current_amount, goal.target_date, goal.notes);
  }

  // ==================== 梦想图册数据 ====================
  const dreams = [
    {
      title: '环游世界',
      description: '用一年时间环游世界，体验不同文化和风景',
      image_url: null,
      estimated_cost: 500000,
      priority: 1,
      achieved: 0
    },
    {
      title: '海边别墅',
      description: '在海边买一套别墅，享受阳光和海浪',
      image_url: null,
      estimated_cost: 3000000,
      priority: 2,
      achieved: 0
    },
    {
      title: '出版一本书',
      description: '写一本关于财务自由的书，分享自己的经验',
      image_url: null,
      estimated_cost: 50000,
      priority: 3,
      achieved: 0
    },
  ];

  const insertDream = db.prepare(`
    INSERT INTO dreams (user_id, title, description, image_url, estimated_cost, priority, is_achieved, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const dream of dreams) {
    insertDream.run('user-1', dream.title, dream.description, dream.image_url, dream.estimated_cost, dream.priority, dream.achieved ? 1 : 0);
  }

  // ==================== 交易记录数据（本月） ====================
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const transactions = [
    // 收入
    { date: `${currentMonth}-01`, type: 'income', category: '工资', amount: 25000, account_id: 'account-1', description: '3月工资', tags: ['工资', '主动收入'] },
    { date: `${currentMonth}-05`, type: 'income', category: '理财收益', amount: 800, account_id: 'account-5', description: '基金分红', tags: ['被动收入', '投资'] },

    // 支出
    { date: `${currentMonth}-02`, type: 'expense', category: '餐饮', amount: 800, account_id: 'account-1', description: '本月餐饮', tags: ['日常'] },
    { date: `${currentMonth}-03`, type: 'expense', category: '交通', amount: 500, account_id: 'account-1', description: '地铁充值', tags: ['日常'] },
    { date: `${currentMonth}-04`, type: 'expense', category: '购物', amount: 1200, account_id: 'account-2', description: '日用品', tags: ['日常'] },
    { date: `${currentMonth}-05`, type: 'expense', category: '娱乐', amount: 300, account_id: 'account-3', description: '电影', tags: ['娱乐'] },
    { date: `${currentMonth}-06`, type: 'expense', category: '还贷', amount: 8000, account_id: 'account-1', description: '房贷月供', tags: ['固定支出'] },
    { date: `${currentMonth}-10`, type: 'expense', category: '保险', amount: 2000, account_id: 'account-1', description: '医疗保险', tags: ['固定支出'] },
  ];

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (user_id, date, type, category, amount, account_id, description, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const tx of transactions) {
    insertTransaction.run('user-1', tx.date, tx.type, tx.category, tx.amount, tx.account_id, tx.description, JSON.stringify(tx.tags));
  }

  console.log('测试数据初始化完成！');
  console.log('- 用户: 1 条');
  console.log('- 账户: 6 条');
  console.log('- 负债: 2 条');
  console.log('- 目标: 3 条');
  console.log('- 梦想: 3 条');
  console.log('- 交易: 8 条');

  db.close();
}

// 如果直接运行此文件
if (require.main === module) {
  seedTestData();
}
