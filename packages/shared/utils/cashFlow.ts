/**
 * 现金流计算逻辑
 */

import { Transaction, TransactionType } from '../types';

/**
 * 筛选指定月份的交易记录
 */
export const filterByMonth = (
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] => {
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() === month - 1;
  });
};

/**
 * 计算月度现金流
 */
export const calculateMonthlyCashFlow = (
  transactions: Transaction[],
  year: number,
  month: number
): { income: number; expense: number; balance: number } => {
  const monthTransactions = filterByMonth(transactions, year, month);

  const income = monthTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
};

/**
 * 计算被动收入
 */
export const calculatePassiveIncome = (
  transactions: Transaction[],
  year: number,
  month: number
): number => {
  const monthTransactions = filterByMonth(transactions, year, month);

  const passiveCategories = ['investment', 'interest', 'product', 'rent'];

  return monthTransactions
    .filter(
      (t) =>
        t.type === TransactionType.INCOME &&
        passiveCategories.includes(t.category)
    )
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * 按分类汇总支出
 */
export const summarizeExpensesByCategory = (
  transactions: Transaction[],
  year: number,
  month: number
): Record<string, number> => {
  const monthTransactions = filterByMonth(transactions, year, month);

  const result: Record<string, number> = {};

  monthTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .forEach((t) => {
      if (!result[t.category]) {
        result[t.category] = 0;
      }
      result[t.category] += t.amount;
    });

  return result;
};
