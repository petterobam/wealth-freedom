/**
 * v2.1.0 自然语言数据查询引擎
 *
 * 本地规则引擎，无需 LLM API Key，直接解析中文财务查询并返回数据。
 * 支持：收支查询、分类统计、时间段筛选、账户余额、目标进度、投资概况。
 *
 * 示例查询：
 * - "上个月吃饭花了多少？"
 * - "这个月收入多少？"
 * - "最近三个月支出趋势"
 * - "我还有多少钱？"
 * - "房贷还剩多少？"
 */

// ====== 类型定义 ======

export interface NLQueryResult {
  question: string;        // 原始问题
  answer: string;          // 自然语言回答
  data?: any;              // 结构化数据（可选，前端可做图表）
  confidence: number;      // 置信度 0-1
  type: NLQueryType;
}

export type NLQueryType =
  | 'income'           // 收入查询
  | 'expense'          // 支出查询
  | 'expense_category' // 分类支出
  | 'net_worth'        // 净资产
  | 'account_balance'  // 账户余额
  | 'savings_rate'     // 储蓄率
  | 'debt'             // 负债查询
  | 'goal_progress'    // 目标进度
  | 'investment'       // 投资概况
  | 'top_spending'     // 支出排行
  | 'trend'            // 趋势查询
  | 'unknown';         // 无法识别

interface TimeRange {
  start: Date;
  end: Date;
  label: string;  // 人类可读的时间范围描述
}

// ====== 时间解析 ======

function parseTimeRange(query: string): TimeRange {
  const now = new Date();
  const thisMonth = { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  const lastMonth = {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 0),
  };

  // 本周（周一到今天）
  const dayOfWeek = now.getDay() || 7;
  const thisWeek = {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1),
    end: now,
  };

  // 最近 N 个月
  const nMonthMatch = query.match(/最近(\d+)个?月/);
  if (nMonthMatch) {
    const n = parseInt(nMonthMatch[1]);
    return {
      start: new Date(now.getFullYear(), now.getMonth() - n, 1),
      end: now,
      label: `最近${n}个月`,
    };
  }

  // 上个月 / 上月
  if (/上个?月/.test(query)) {
    return { ...lastMonth, label: '上个月' };
  }

  // 这个月 / 本月 / 这个
  if (/这|本|这个月/.test(query)) {
    return { ...thisMonth, label: '这个月' };
  }

  // 今天 / 今日
  if (/今[天日]/.test(query)) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start: today, end: now, label: '今天' };
  }

  // 昨天
  if (/昨[天日]/.test(query)) {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return { start: yesterday, end: new Date(now.getFullYear(), now.getMonth(), now.getDate()), label: '昨天' };
  }

  // 本周 / 这周
  if (/本|这周/.test(query)) {
    return { ...thisWeek, label: '本周' };
  }

  // 今年
  if (/今年/.test(query)) {
    return { start: new Date(now.getFullYear(), 0, 1), end: now, label: '今年' };
  }

  // 默认：这个月
  return { ...thisMonth, label: '这个月' };
}

// ====== 分类关键词映射 ======

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '餐饮': ['吃饭', '餐', '外卖', '食堂', '饮食', '吃饭花', '饭', '零食', '饮料', '奶茶', '咖啡'],
  '住房': ['房租', '房', '租金', '物业', '水电气', '水电', '燃气', '房贷'],
  '交通': ['交通', '打车', '地铁', '公交', '油费', '停车', '出行', '高铁', '机票'],
  '购物': ['购物', '买东西', '淘宝', '京东', '网购', '衣服', '鞋', '日用品'],
  '娱乐': ['娱乐', '游戏', '电影', '旅游', '出去玩', '聚会'],
  '医疗': ['医疗', '看病', '药', '体检', '医院'],
  '教育': ['教育', '学习', '课程', '培训', '书', '考试'],
  '通讯': ['话费', '手机', '宽带', '通讯'],
  '健身': ['健身', '运动', '锻炼', '游泳', '瑜伽'],
  '保险': ['保险', '社保', '公积金'],
  '工资': ['工资', '薪资', '月薪', '收入'],
  '理财': ['利息', '理财', '基金', '股票', '分红'],
};

function matchCategory(query: string): string | null {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (query.includes(kw)) return category;
    }
  }
  return null;
}

// ====== 查询意图识别 ======

function identifyIntent(query: string): NLQueryType {
  // 净资产 / 总资产 / 有多少钱
  if (/还有多少|总资产|净资产|身家|总共有多少|一共有多少|存款/.test(query)) return 'net_worth';
  // 账户余额
  if (/余额|账[上户]有多少|银行卡/.test(query)) return 'account_balance';
  // 储蓄率
  if (/储蓄率|存了.*比例|能存.*%/.test(query)) return 'savings_rate';
  // 负债
  if (/负债|欠.*多少|贷.*还剩|还[有多少].*贷/.test(query)) return 'debt';
  // 目标进度
  if (/目标.*进度|离.*目标|还差.*目标|目标完成/.test(query)) return 'goal_progress';
  // 投资
  if (/投资.*多少|收益.*多少|持仓|赚了.*多少/.test(query)) return 'investment';
  // 支出排行 / 花最多
  if (/花最多|支出排行|花钱排行|最花钱|Top|前几/.test(query)) return 'top_spending';
  // 趋势
  if (/趋势|变化|对比|环比|增长|降了/.test(query)) return 'trend';

  // 分类支出
  const cat = matchCategory(query);
  if (cat && /花|支出|用了|花了|花费|开销/.test(query)) return 'expense_category';

  // 收入
  if (/收入|赚了|赚多少|挣了|挣多少/.test(query)) return 'income';

  // 支出（总支出）
  if (/花了多少|支出多少|花[了总]|开销|花销|总支出/.test(query)) return 'expense';

  return 'unknown';
}

// ====== 数据查询辅助 ======

interface TransactionLike {
  type: string;
  amount: number;
  category?: string;
  date?: string;
  description?: string;
}

interface AccountLike {
  name: string;
  balance: number;
  type?: string;
}

interface DebtLike {
  name: string;
  amount: number;
  paidAmount?: number;
  monthlyPayment?: number;
  type?: string;
}

interface GoalLike {
  name: string;
  targetAmount?: number;
  target?: number;
  currentAmount?: number;
  current?: number;
  deadline?: string;
  targetDate?: string;
}

interface InvestmentLike {
  name: string;
  amount?: number;
  currentValue?: number;
  type?: string;
  returnRate?: number;
}

export interface NLQueryDataContext {
  transactions: TransactionLike[];
  accounts: AccountLike[];
  debts: DebtLike[];
  goals: GoalLike[];
  investments: InvestmentLike[];
}

function filterByTime<T extends { date?: string }>(items: T[], range: TimeRange): T[] {
  return items.filter(item => {
    if (!item.date) return true;
    const d = new Date(item.date);
    return d >= range.start && d <= range.end;
  });
}

function fmt(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ====== 回答生成 ======

function answerIncome(ctx: NLQueryDataContext, range: TimeRange): NLQueryResult {
  const txns = filterByTime(ctx.transactions, range);
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const count = txns.filter(t => t.type === 'income').length;
  return {
    question: '',
    answer: `${range.label}共收入 ¥${fmt(income)}（${count} 笔）`,
    data: { total: income, count, period: range.label },
    confidence: 0.95,
    type: 'income',
  };
}

function answerExpense(ctx: NLQueryDataContext, range: TimeRange): NLQueryResult {
  const txns = filterByTime(ctx.transactions, range);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const count = txns.filter(t => t.type === 'expense').length;
  return {
    question: '',
    answer: `${range.label}共支出 ¥${fmt(expense)}（${count} 笔）`,
    data: { total: expense, count, period: range.label },
    confidence: 0.95,
    type: 'expense',
  };
}

function answerExpenseCategory(ctx: NLQueryDataContext, range: TimeRange, query: string): NLQueryResult {
  const category = matchCategory(query);
  const txns = filterByTime(ctx.transactions, range);
  const expenses = txns.filter(t => t.type === 'expense');

  if (category) {
    const matched = expenses.filter(t => {
      const cat = (t.category || '').toLowerCase();
      // 模糊匹配
      const keywords = CATEGORY_KEYWORDS[category] || [category];
      return keywords.some(kw => cat.includes(kw) || kw.includes(cat)) || cat === category;
    });
    const total = matched.reduce((s, t) => s + t.amount, 0);
    const allExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const pct = allExpense > 0 ? ((total / allExpense) * 100).toFixed(1) : '0';
    return {
      question: '',
      answer: `${range.label}${category}共花费 ¥${fmt(total)}（${matched.length} 笔），占总支出 ${pct}%`,
      data: { category, total, count: matched.length, percentage: pct, transactions: matched },
      confidence: 0.85,
      type: 'expense_category',
    };
  }

  // 无特定分类，返回分类汇总
  const byCategory: Record<string, number> = {};
  expenses.forEach(t => {
    const cat = t.category || '其他';
    byCategory[cat] = (byCategory[cat] || 0) + t.amount;
  });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const lines = sorted.map(([cat, amt]) => `- ${cat}：¥${fmt(amt)}（${total > 0 ? ((amt / total) * 100).toFixed(1) : 0}%）`);
  return {
    question: '',
    answer: `${range.label}支出分类：\n${lines.join('\n')}`,
    data: { categories: sorted, total, period: range.label },
    confidence: 0.9,
    type: 'expense_category',
  };
}

function answerNetWorth(ctx: NLQueryDataContext): NLQueryResult {
  const totalAssets = ctx.accounts.reduce((s, a) => s + a.balance, 0);
  const totalDebt = ctx.debts.reduce((s, d) => s + d.amount, 0);
  const netWorth = totalAssets - totalDebt;
  return {
    question: '',
    answer: `当前净资产 ¥${fmt(netWorth)}（总资产 ¥${fmt(totalAssets)} - 总负债 ¥${fmt(totalDebt)}）`,
    data: { netWorth, totalAssets, totalDebt },
    confidence: 0.98,
    type: 'net_worth',
  };
}

function answerAccountBalance(ctx: NLQueryDataContext): NLQueryResult {
  const lines = ctx.accounts.map(a => `- ${a.name}：¥${fmt(a.balance)}`);
  const total = ctx.accounts.reduce((s, a) => s + a.balance, 0);
  return {
    question: '',
    answer: `账户余额：\n${lines.join('\n')}\n\n总计：¥${fmt(total)}`,
    data: { accounts: ctx.accounts, total },
    confidence: 0.98,
    type: 'account_balance',
  };
}

function answerSavingsRate(ctx: NLQueryDataContext, range: TimeRange): NLQueryResult {
  const txns = filterByTime(ctx.transactions, range);
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const surplus = income - expense;
  const rate = income > 0 ? ((surplus / income) * 100).toFixed(1) : '0';
  const emoji = parseFloat(rate) >= 50 ? '🎉' : parseFloat(rate) >= 20 ? '👍' : '⚠️';
  return {
    question: '',
    answer: `${emoji} ${range.label}储蓄率 ${rate}%（收入 ¥${fmt(income)} - 支出 ¥${fmt(expense)} = 结余 ¥${fmt(surplus)}）`,
    data: { rate, income, expense, surplus, period: range.label },
    confidence: 0.95,
    type: 'savings_rate',
  };
}

function answerDebt(ctx: NLQueryDataContext): NLQueryResult {
  if (ctx.debts.length === 0) {
    return { question: '', answer: '当前没有负债记录 🎉', confidence: 0.98, type: 'debt' };
  }
  const lines = ctx.debts.map(d => {
    const remaining = d.amount - (d.paidAmount || 0);
    return `- ${d.name}：总额 ¥${fmt(d.amount)}，已还 ¥${fmt(d.paidAmount || 0)}，剩余 ¥${fmt(remaining)}${d.monthlyPayment ? `（月供 ¥${fmt(d.monthlyPayment)}）` : ''}`;
  });
  const total = ctx.debts.reduce((s, d) => s + d.amount, 0);
  const remaining = ctx.debts.reduce((s, d) => s + (d.amount - (d.paidAmount || 0)), 0);
  return {
    question: '',
    answer: `负债情况：\n${lines.join('\n')}\n\n总负债 ¥${fmt(total)}，待还 ¥${fmt(remaining)}`,
    data: { debts: ctx.debts, total, remaining },
    confidence: 0.95,
    type: 'debt',
  };
}

function answerGoalProgress(ctx: NLQueryDataContext): NLQueryResult {
  if (ctx.goals.length === 0) {
    return { question: '', answer: '暂未设置财务目标，可在"目标"页面添加。', confidence: 0.9, type: 'goal_progress' };
  }
  const lines = ctx.goals.map(g => {
    const target = g.targetAmount || g.target || 0;
    const current = g.currentAmount || g.current || 0;
    const pct = target > 0 ? ((current / target) * 100).toFixed(1) : '0';
    const remaining = target - current;
    const deadline = g.deadline || g.targetDate || '未设定';
    return `- ${g.name}：¥${fmt(current)} / ¥${fmt(target)}（${pct}%）${remaining > 0 ? `，还差 ¥${fmt(remaining)}` : '✅ 已达成！'}${deadline !== '未设定' ? `，截止 ${deadline}` : ''}`;
  });
  return {
    question: '',
    answer: `目标进度：\n${lines.join('\n')}`,
    data: { goals: ctx.goals },
    confidence: 0.95,
    type: 'goal_progress',
  };
}

function answerInvestment(ctx: NLQueryDataContext): NLQueryResult {
  if (ctx.investments.length === 0) {
    return { question: '', answer: '暂无投资记录，可在"投资"页面添加。', confidence: 0.9, type: 'investment' };
  }
  const lines = ctx.investments.map(i => {
    const val = i.currentValue || i.amount || 0;
    return `- ${i.name}（${i.type || '其他'}）：¥${fmt(val)}${i.returnRate ? `，收益率 ${(i.returnRate * 100).toFixed(2)}%` : ''}`;
  });
  const total = ctx.investments.reduce((s, i) => s + (i.currentValue || i.amount || 0), 0);
  return {
    question: '',
    answer: `投资概况：\n${lines.join('\n')}\n\n总投资 ¥${fmt(total)}`,
    data: { investments: ctx.investments, total },
    confidence: 0.95,
    type: 'investment',
  };
}

function answerTopSpending(ctx: NLQueryDataContext, range: TimeRange): NLQueryResult {
  const txns = filterByTime(ctx.transactions, range);
  const expenses = txns.filter(t => t.type === 'expense');
  const byCategory: Record<string, number> = {};
  expenses.forEach(t => {
    const cat = t.category || '其他';
    byCategory[cat] = (byCategory[cat] || 0) + t.amount;
  });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const lines = sorted.map(([cat, amt], i) => `${medals[i]} ${cat}：¥${fmt(amt)}（${total > 0 ? ((amt / total) * 100).toFixed(1) : 0}%）`);
  return {
    question: '',
    answer: `${range.label}支出 Top5：\n${lines.join('\n')}`,
    data: { ranking: sorted, total, period: range.label },
    confidence: 0.9,
    type: 'top_spending',
  };
}

function answerTrend(ctx: NLQueryDataContext, range: TimeRange): NLQueryResult {
  // 按月汇总收支趋势
  const txns = filterByTime(ctx.transactions, range);
  const monthly: Record<string, { income: number; expense: number }> = {};

  txns.forEach(t => {
    if (!t.date) return;
    const month = t.date.slice(0, 7); // YYYY-MM
    if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
    if (t.type === 'income') monthly[month].income += t.amount;
    else if (t.type === 'expense') monthly[month].expense += t.amount;
  });

  const months = Object.keys(monthly).sort();
  if (months.length === 0) {
    return { question: '', answer: `${range.label}暂无交易记录。`, confidence: 0.8, type: 'trend' };
  }

  const lines = months.map(m => {
    const d = monthly[m];
    const surplus = d.income - d.expense;
    const emoji = surplus >= 0 ? '📈' : '📉';
    return `${m}：收入 ¥${fmt(d.income)} | 支出 ¥${fmt(d.expense)} | 结余 ${emoji} ¥${fmt(surplus)}`;
  });

  // 环比分析
  let trendNote = '';
  if (months.length >= 2) {
    const last = monthly[months[months.length - 1]];
    const prev = monthly[months[months.length - 2]];
    const expenseChange = prev.expense > 0 ? (((last.expense - prev.expense) / prev.expense) * 100).toFixed(1) : '0';
    const direction = parseFloat(expenseChange) > 0 ? '上升' : '下降';
    trendNote = `\n\n📊 环比：最近一月支出${direction} ${Math.abs(parseFloat(expenseChange))}%`;
  }

  return {
    question: '',
    answer: `${range.label}收支趋势：\n${lines.join('\n')}${trendNote}`,
    data: { monthly, months },
    confidence: 0.9,
    type: 'trend',
  };
}

// ====== 主入口 ======

/**
 * 自然语言查询
 * @param query 用户输入的中文问题
 * @param ctx 财务数据上下文
 */
export function naturalLanguageQuery(query: string, ctx: NLQueryDataContext): NLQueryResult {
  const range = parseTimeRange(query);
  const intent = identifyIntent(query);

  let result: NLQueryResult;

  switch (intent) {
    case 'income':
      result = answerIncome(ctx, range);
      break;
    case 'expense':
      result = answerExpense(ctx, range);
      break;
    case 'expense_category':
      result = answerExpenseCategory(ctx, range, query);
      break;
    case 'net_worth':
      result = answerNetWorth(ctx);
      break;
    case 'account_balance':
      result = answerAccountBalance(ctx);
      break;
    case 'savings_rate':
      result = answerSavingsRate(ctx, range);
      break;
    case 'debt':
      result = answerDebt(ctx);
      break;
    case 'goal_progress':
      result = answerGoalProgress(ctx);
      break;
    case 'investment':
      result = answerInvestment(ctx);
      break;
    case 'top_spending':
      result = answerTopSpending(ctx, range);
      break;
    case 'trend':
      result = answerTrend(ctx, range);
      break;
    default:
      result = {
        question: query,
        answer: '抱歉，我还不太理解这个问题。试试这些：\n- "上个月吃饭花了多少？"\n- "这个月收入多少？"\n- "我还有多少钱？"\n- "储蓄率是多少？"\n- "最近三个月支出趋势"',
        confidence: 0,
        type: 'unknown',
      };
  }

  result.question = query;
  return result;
}

/**
 * 获取推荐的快捷查询列表
 */
export function getQuickQueries(): Array<{ label: string; query: string; icon: string }> {
  return [
    { label: '这个月花了多少', query: '这个月花了多少？', icon: '💰' },
    { label: '上个月吃饭花多少', query: '上个月吃饭花了多少？', icon: '🍜' },
    { label: '我还有多少钱', query: '我还有多少钱？', icon: '🏦' },
    { label: '储蓄率', query: '这个月储蓄率是多少？', icon: '📊' },
    { label: '支出 Top5', query: '这个月花钱排行', icon: '🏆' },
    { label: '目标进度', query: '我的目标完成了多少？', icon: '🎯' },
    { label: '最近三个月趋势', query: '最近三个月收支趋势', icon: '📈' },
    { label: '负债情况', query: '我还欠多少钱？', icon: '💳' },
  ];
}
