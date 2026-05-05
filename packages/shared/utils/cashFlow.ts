/**
 * 现金流计算逻辑
 */

import { Transaction, TransactionType } from '../types';

export interface CashFlow {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
}

/**
 * 计算现金流
 */
export const calculateCashFlow = (transactions: Transaction[]): CashFlow => {
  const totalIncome = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

  return { totalIncome, totalExpense, netCashFlow, savingsRate };
};

/**
 * 从净资产和现金流计算关键比率
 */
export const calculateRatios = (
  _netWorth: number,
  cashFlow: CashFlow
): Record<string, number> => {
  const expenseToIncomeRatio =
    cashFlow.totalIncome > 0
      ? (cashFlow.totalExpense / cashFlow.totalIncome) * 100
      : 0;

  return {
    savingsRate: cashFlow.savingsRate,
    expenseToIncomeRatio,
    netCashFlow: cashFlow.netCashFlow,
  };
};
