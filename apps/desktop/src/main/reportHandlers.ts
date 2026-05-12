/**
 * 报表分析 IPC 处理程序
 * v0.6.0 — 报表分析与数据看板增强
 */

import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';

let db: Database.Database;

export function initReportHandlers(database: Database.Database) {
  db = database;

  // 月度/年度报表
  ipcMain.handle('report:monthly-summary', handleMonthlySummary);
  ipcMain.handle('report:yearly-summary', handleYearlySummary);
  ipcMain.handle('report:category-ranking', handleCategoryRanking);
  ipcMain.handle('report:monthly-trend', handleMonthlyTrend);

  // 财务健康评分
  ipcMain.handle('report:health-score', handleHealthScore);

  // 目标进度
  ipcMain.handle('report:goal-progress', handleGoalProgress);
}

// ==================== 月度收支汇总 ====================

async function handleMonthlySummary(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string; year: number; month: number }
) {
  const startDate = `${data.year}-${String(data.month).padStart(2, '0')}-01`;
  const nextMonth = data.month === 12 ? 1 : data.month + 1;
  const nextYear = data.month === 12 ? data.year + 1 : data.year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  // 收支汇总
  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_savings,
      COUNT(*) AS transaction_count
    FROM transactions
    WHERE user_id = ? AND date >= ? AND date < ?
  `).get(data.userId, startDate, endDate) as {
    total_income: number;
    total_expense: number;
    net_savings: number;
    transaction_count: number;
  };

  // 收入分类明细
  const incomeByCategory = db.prepare(`
    SELECT category, SUM(amount) AS amount
    FROM transactions
    WHERE user_id = ? AND type = 'income' AND date >= ? AND date < ?
    GROUP BY category ORDER BY amount DESC
  `).all(data.userId, startDate, endDate);

  // 支出分类明细
  const expenseByCategory = db.prepare(`
    SELECT category, SUM(amount) AS amount
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND date >= ? AND date < ?
    GROUP BY category ORDER BY amount DESC
  `).all(data.userId, startDate, endDate);

  // 储蓄率
  const savingsRate = summary.total_income > 0
    ? Math.round((summary.net_savings / summary.total_income) * 10000) / 100
    : 0;

  return {
    period: { year: data.year, month: data.month },
    ...summary,
    savingsRate,
    incomeByCategory,
    expenseByCategory,
  };
}

// ==================== 年度收支汇总 ====================

async function handleYearlySummary(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string; year: number }
) {
  const startDate = `${data.year}-01-01`;
  const endDate = `${data.year + 1}-01-01`;

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_savings,
      COUNT(*) AS transaction_count
    FROM transactions
    WHERE user_id = ? AND date >= ? AND date < ?
  `).get(data.userId, startDate, endDate) as {
    total_income: number;
    total_expense: number;
    net_savings: number;
    transaction_count: number;
  };

  // 月度明细（12个月）
  const monthlyBreakdown = db.prepare(`
    SELECT
      CAST(strftime('%m', date) AS INTEGER) AS month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE user_id = ? AND date >= ? AND date < ?
    GROUP BY strftime('%m', date)
    ORDER BY month
  `).all(data.userId, startDate, endDate);

  // 同比数据（上一年）
  const prevStart = `${data.year - 1}-01-01`;
  const prevEnd = `${data.year}-01-01`;
  const prevSummary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_savings
    FROM transactions
    WHERE user_id = ? AND date >= ? AND date < ?
  `).get(data.userId, prevStart, prevEnd) as {
    total_income: number;
    total_expense: number;
    net_savings: number;
  };

  // 计算同比变化率
  const yoyChange = {
    income: prevSummary.total_income > 0
      ? Math.round(((summary.total_income - prevSummary.total_income) / prevSummary.total_income) * 10000) / 100 : null,
    expense: prevSummary.total_expense > 0
      ? Math.round(((summary.total_expense - prevSummary.total_expense) / prevSummary.total_expense) * 10000) / 100 : null,
    savings: prevSummary.net_savings !== 0
      ? Math.round(((summary.net_savings - prevSummary.net_savings) / Math.abs(prevSummary.net_savings)) * 10000) / 100 : null,
  };

  const savingsRate = summary.total_income > 0
    ? Math.round((summary.net_savings / summary.total_income) * 10000) / 100
    : 0;

  return {
    period: { year: data.year },
    ...summary,
    savingsRate,
    monthlyBreakdown,
    previousYear: prevSummary,
    yoyChange,
  };
}

// ==================== 分类支出排行 ====================

async function handleCategoryRanking(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string; startDate: string; endDate: string; type?: string; limit?: number }
) {
  const type = data.type ?? 'expense';
  const limit = data.limit ?? 20;

  const ranking = db.prepare(`
    SELECT
      category,
      SUM(amount) AS total_amount,
      COUNT(*) AS count,
      AVG(amount) AS avg_amount,
      MIN(date) AS first_date,
      MAX(date) AS last_date
    FROM transactions
    WHERE user_id = ? AND type = ? AND date >= ? AND date < ?
    GROUP BY category
    ORDER BY total_amount DESC
    LIMIT ?
  `).all(data.userId, type, data.startDate, data.endDate, limit);

  // 总额（用于计算占比）
  const total = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
    WHERE user_id = ? AND type = ? AND date >= ? AND date < ?
  `).get(data.userId, type, data.startDate, data.endDate) as { total: number };

  return {
    type,
    startDate: data.startDate,
    endDate: data.endDate,
    total: total.total,
    ranking: ranking.map((r: any) => ({
      ...r,
      percentage: total.total > 0
        ? Math.round((r.total_amount / total.total) * 10000) / 100 : 0,
    })),
  };
}

// ==================== 月度趋势（近N个月） ====================

async function handleMonthlyTrend(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string; months?: number }
) {
  const months = data.months ?? 12;

  const trend = db.prepare(`
    SELECT
      strftime('%Y-%m', date) AS month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net,
      COUNT(*) AS count
    FROM transactions
    WHERE user_id = ?
      AND date >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month
  `).all(data.userId, months);

  // 储蓄率趋势
  const withSavingsRate = trend.map((t: any) => ({
    ...t,
    savingsRate: t.income > 0
      ? Math.round((t.net / t.income) * 10000) / 100 : 0,
  }));

  return { months, trend: withSavingsRate };
}

// ==================== 财务健康评分（5维） ====================

async function handleHealthScore(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string }
) {
  // 维度1：储蓄率（基于近3个月）
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startDate = threeMonthsAgo.toISOString().slice(0, 10);

  const recentTx = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE user_id = ? AND date >= ?
  `).get(data.userId, startDate) as { income: number; expense: number };

  const savingsRate = recentTx.income > 0
    ? (recentTx.income - recentTx.expense) / recentTx.income * 100 : 0;
  // 储蓄率评分：>50%=100, <0%=0, 线性插值
  const savingsScore = Math.max(0, Math.min(100, savingsRate * 2));

  // 维度2：投资占比（投资资产 / 总资产）
  const accountBalances = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type IN ('investment', 'stock', 'fund') THEN balance ELSE 0 END), 0) AS investment,
      COALESCE(SUM(CASE WHEN include_in_net_worth = 1 THEN balance ELSE 0 END), 0) AS total
    FROM accounts WHERE user_id = ?
  `).get(data.userId) as { investment: number; total: number };

  const investmentRatio = accountBalances.total > 0
    ? accountBalances.investment / accountBalances.total * 100 : 0;
  // 投资占比评分：30-60%最佳=100, 0%=20, >80%=60
  let investScore = 20;
  if (investmentRatio >= 30 && investmentRatio <= 60) investScore = 100;
  else if (investmentRatio < 30) investScore = 20 + (investmentRatio / 30) * 80;
  else investScore = 100 - ((investmentRatio - 60) / 40) * 40;

  // 维度3：债务健康度（负债 / 资产）
  const debtInfo = db.prepare(`
    SELECT COALESCE(SUM(remaining_amount), 0) AS total_debt
    FROM debts WHERE user_id = ? AND is_paid_off = 0
  `).get(data.userId) as { total_debt: number };

  const debtRatio = accountBalances.total > 0
    ? debtInfo.total_debt / accountBalances.total * 100 : 0;
  // 债务评分：0%=100, >50%=0
  const debtScore = Math.max(0, 100 - debtRatio * 2);

  // 维度4：收入稳定性（活跃收入源数量 + 类型多样性）
  const incomeSources = db.prepare(`
    SELECT type, COUNT(*) AS count FROM income_sources
    WHERE user_id = ? AND is_active = 1
    GROUP BY type
  `).all(data.userId) as { type: string; count: number }[];

  const sourceTypes = incomeSources.length;
  const totalSources = incomeSources.reduce((s, r) => s + r.count, 0);
  // 有3+类型=100, 有2类型=70, 有1类型=40, 无=0
  let stabilityScore = sourceTypes >= 3 ? 100 : sourceTypes === 2 ? 70 : sourceTypes === 1 ? 40 : 0;
  if (totalSources >= 3) stabilityScore = Math.min(100, stabilityScore + 20);

  // 维度5：财务成长（净资产趋势，近6个月 vs 前6个月）
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const sm6 = sixMonthsAgo.toISOString().slice(0, 10);
  const sm12 = twelveMonthsAgo.toISOString().slice(0, 10);

  const recentSavings = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net
    FROM transactions WHERE user_id = ? AND date >= ? AND date < ?
  `).get(data.userId, sm6, new Date().toISOString().slice(0, 10)) as { net: number };

  const prevSavings = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net
    FROM transactions WHERE user_id = ? AND date >= ? AND date < ?
  `).get(data.userId, sm12, sm6) as { net: number };

  const growthRate = prevSavings.net !== 0
    ? (recentSavings.net - prevSavings.net) / Math.abs(prevSavings.net) * 100 : 0;
  // 成长评分：>20%=100, <0%=0
  const growthScore = Math.max(0, Math.min(100, growthRate * 5));

  // 综合评分（加权平均）
  const totalScore = Math.round(
    savingsScore * 0.30 +
    investScore * 0.20 +
    debtScore * 0.20 +
    stabilityScore * 0.15 +
    growthScore * 0.15
  );

  return {
    totalScore,
    dimensions: {
      savings: { score: Math.round(savingsScore), value: Math.round(savingsRate * 100) / 100, label: '储蓄能力' },
      investment: { score: Math.round(investScore), value: Math.round(investmentRatio * 100) / 100, label: '投资配置' },
      debt: { score: Math.round(debtScore), value: Math.round(debtRatio * 100) / 100, label: '债务健康' },
      stability: { score: Math.round(stabilityScore), value: totalSources, label: '收入稳定' },
      growth: { score: Math.round(growthScore), value: Math.round(growthRate * 100) / 100, label: '财务成长' },
    },
  };
}

// ==================== 目标进度 ====================

async function handleGoalProgress(
  _e: Electron.IpcMainInvokeEvent,
  data: { userId: string }
) {
  const goals = db.prepare(`
    SELECT g.*,
      CASE WHEN g.target_amount > 0
        THEN ROUND(g.current_amount / g.target_amount * 100, 1)
        ELSE 0 END AS progress_pct
    FROM goals g
    WHERE g.user_id = ? AND g.status = 'in_progress'
    ORDER BY g.stage, g.target_date
  `).all(data.userId) as any[];

  // 计算每个目标的预计完成时间（基于月均储蓄率）
  const avgMonthlySavings = db.prepare(`
    SELECT COALESCE(AVG(monthly_net), 0) AS avg FROM (
      SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS monthly_net
      FROM transactions
      WHERE user_id = ? AND date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
    )
  `).get(data.userId) as { avg: number };

  const stageNames: Record<string, string> = {
    security: '财务保障',
    safety: '财务安全',
    freedom: '财务自由',
  };

  const goalsWithEta = goals.map((g: any) => {
    const remaining = g.target_amount - g.current_amount;
    let estimatedMonths = null;
    let estimatedDate = null;

    if (remaining > 0 && avgMonthlySavings.avg > 0) {
      estimatedMonths = Math.ceil(remaining / avgMonthlySavings.avg);
      const eta = new Date();
      eta.setMonth(eta.getMonth() + estimatedMonths);
      estimatedDate = eta.toISOString().slice(0, 10);
    }

    return {
      ...g,
      name: stageNames[g.stage] || g.notes || g.stage,
      remaining,
      estimatedMonths,
      estimatedDate,
    };
  });

  // 按阶段分组
  const byStage = {
    security: goalsWithEta.filter((g: any) => g.stage === 'security'),
    safety: goalsWithEta.filter((g: any) => g.stage === 'safety'),
    freedom: goalsWithEta.filter((g: any) => g.stage === 'freedom'),
  };

  return {
    goals: goalsWithEta,
    byStage,
    avgMonthlySavings: Math.round(avgMonthlySavings.avg),
  };
}
