/**
 * 关键财务比率计算
 */

import { Account } from '../types';
import { Debt } from '../types';
import { calculateTotalAssets, calculateTotalDebts } from './netWorth';

export interface FinancialRatios {
  savingsRate: number;        // 储蓄率
  debtRatio: number;          // 负债率
  passiveIncomeRatio: number; // 被动收入占比
  liquidityRatio: number;     // 流动性比率
}

/**
 * 计算储蓄率
 * @param monthlyIncome 月收入
 * @param monthlyExpense 月支出
 */
export const calculateSavingsRate = (
  monthlyIncome: number,
  monthlyExpense: number
): number => {
  if (monthlyIncome <= 0) return 0;
  return ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100;
};

/**
 * 计算负债率
 * @param accounts 账户列表
 * @param debts 负债列表
 */
export const calculateDebtRatio = (
  accounts: Account[],
  debts: Debt[]
): number => {
  const totalAssets = calculateTotalAssets(accounts);
  if (totalAssets <= 0) return 0;

  const totalDebts = calculateTotalDebts(debts);
  return (totalDebts / totalAssets) * 100;
};

/**
 * 计算被动收入占比
 * @param passiveIncome 被动收入
 * @param monthlyExpense 月支出
 */
export const calculatePassiveIncomeRatio = (
  passiveIncome: number,
  monthlyExpense: number
): number => {
  if (monthlyExpense <= 0) return 0;
  return (passiveIncome / monthlyExpense) * 100;
};

/**
 * 计算流动性比率（流动资产 / 月支出）
 * @param liquidAssets 流动资产
 * @param monthlyExpense 月支出
 */
export const calculateLiquidityRatio = (
  liquidAssets: number,
  monthlyExpense: number
): number => {
  if (monthlyExpense <= 0) return 0;
  return liquidAssets / monthlyExpense;
};

/**
 * 计算所有关键比率
 */
export const calculateAllRatios = (
  accounts: Account[],
  debts: Debt[],
  monthlyIncome: number,
  monthlyExpense: number,
  passiveIncome: number
): FinancialRatios => {
  const liquidAssets = accounts
    .filter((a) =>
      ['cash', 'checking', 'money_fund'].includes(a.type)
    )
    .reduce((sum, a) => sum + a.balance, 0);

  return {
    savingsRate: calculateSavingsRate(monthlyIncome, monthlyExpense),
    debtRatio: calculateDebtRatio(accounts, debts),
    passiveIncomeRatio: calculatePassiveIncomeRatio(
      passiveIncome,
      monthlyExpense
    ),
    liquidityRatio: calculateLiquidityRatio(liquidAssets, monthlyExpense),
  };
};

/**
 * 评估财务健康度
 */
export const evaluateFinancialHealth = (ratios: FinancialRatios): {
  score: number;
  level: '优秀' | '良好' | '一般' | '需改进';
  suggestions: string[];
} => {
  let score = 0;
  const suggestions: string[] = [];

  // 储蓄率评分（目标 >30%）
  if (ratios.savingsRate >= 30) {
    score += 25;
  } else if (ratios.savingsRate >= 20) {
    score += 20;
    suggestions.push('储蓄率良好，可以尝试提高到 30% 以上');
  } else if (ratios.savingsRate >= 10) {
    score += 10;
    suggestions.push('储蓄率偏低，建议控制支出，提高储蓄率');
  } else {
    suggestions.push('储蓄率过低，需要紧急审视支出结构');
  }

  // 负债率评分（目标 <30%）
  if (ratios.debtRatio <= 30) {
    score += 25;
  } else if (ratios.debtRatio <= 50) {
    score += 15;
    suggestions.push('负债率偏高，建议优先偿还高息债务');
  } else {
    suggestions.push('负债率过高，需要制定还债计划');
  }

  // 被动收入占比评分（目标 >100%）
  if (ratios.passiveIncomeRatio >= 100) {
    score += 25;
  } else if (ratios.passiveIncomeRatio >= 50) {
    score += 15;
    suggestions.push('被动收入稳步增长中，继续保持');
  } else if (ratios.passiveIncomeRatio > 0) {
    score += 5;
    suggestions.push('被动收入较少，考虑增加投资');
  } else {
    suggestions.push('没有被动收入，建议开始构建被动收入来源');
  }

  // 流动性比率评分（目标 3-6 个月）
  if (ratios.liquidityRatio >= 6) {
    score += 25;
  } else if (ratios.liquidityRatio >= 3) {
    score += 20;
  } else if (ratios.liquidityRatio >= 1) {
    score += 10;
    suggestions.push('流动性储备不足 3 个月，建议增加应急资金');
  } else {
    suggestions.push('流动性严重不足，需要立即建立应急储备');
  }

  // 评级
  let level: '优秀' | '良好' | '一般' | '需改进';
  if (score >= 80) {
    level = '优秀';
  } else if (score >= 60) {
    level = '良好';
  } else if (score >= 40) {
    level = '一般';
  } else {
    level = '需改进';
  }

  return { score, level, suggestions };
};
