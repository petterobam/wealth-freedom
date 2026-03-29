/**
 * 净资产计算逻辑
 */

import { Account, AccountType } from '../types';
import { Debt } from '../types';

/**
 * 计算总资产
 */
export const calculateTotalAssets = (accounts: Account[]): number => {
  return accounts
    .filter((a) => a.includeInNetWorth)
    .reduce((sum, a) => sum + a.balance, 0);
};

/**
 * 计算总负债
 */
export const calculateTotalDebts = (debts: Debt[]): number => {
  return debts
    .filter((d) => !d.isPaidOff)
    .reduce((sum, d) => sum + d.remainingAmount, 0);
};

/**
 * 计算净资产
 */
export const calculateNetWorth = (
  accounts: Account[],
  debts: Debt[]
): number => {
  const totalAssets = calculateTotalAssets(accounts);
  const totalDebts = calculateTotalDebts(debts);
  return totalAssets - totalDebts;
};

/**
 * 按类型分组资产
 */
export const groupAssetsByType = (
  accounts: Account[]
): Record<AccountType, number> => {
  const result = {} as Record<AccountType, number>;

  accounts
    .filter((a) => a.includeInNetWorth)
    .forEach((a) => {
      if (!result[a.type]) {
        result[a.type] = 0;
      }
      result[a.type] += a.balance;
    });

  return result;
};

/**
 * 获取储备金账户余额
 */
export const getReservedBalance = (accounts: Account[]): number => {
  return accounts
    .filter((a) => a.isReserved)
    .reduce((sum, a) => sum + a.balance, 0);
};
