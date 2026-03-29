/**
 * 渲染进程全局 API 类型定义
 * 与 preload.ts 中暴露的 API 保持一致
 */

import { Account, Debt, Transaction, Goal, Dream, User } from '@wealth-freedom/shared';

export interface API {
  // 用户相关
  user: {
    get: () => Promise<User | undefined>;
    create: (data: Partial<User>) => Promise<User>;
    update: (data: Partial<User>) => Promise<User>;
  };

  // 账户（资产）相关
  account: {
    getAll: () => Promise<Account[]>;
    getById: (id: number) => Promise<Account | undefined>;
    create: (data: Partial<Account>) => Promise<Account>;
    update: (id: number, data: Partial<Account>) => Promise<Account>;
    delete: (id: number) => Promise<{ id: number }>;
  };

  // 负债相关
  debt: {
    getAll: () => Promise<Debt[]>;
    getById: (id: number) => Promise<Debt | undefined>;
    create: (data: Partial<Debt>) => Promise<Debt>;
    update: (id: number, data: Partial<Debt>) => Promise<Debt>;
    delete: (id: number) => Promise<{ id: number }>;
  };

  // 交易记录相关
  transaction: {
    getAll: (filters?: {
      month?: string;
      type?: string;
      category?: string;
    }) => Promise<Transaction[]>;
    getById: (id: number) => Promise<Transaction | undefined>;
    create: (data: Partial<Transaction>) => Promise<Transaction>;
    update: (id: number, data: Partial<Transaction>) => Promise<Transaction>;
    delete: (id: number) => Promise<{ id: number }>;
  };

  // 目标相关
  goal: {
    getAll: () => Promise<Goal[]>;
    getById: (id: number) => Promise<Goal | undefined>;
    create: (data: Partial<Goal>) => Promise<Goal>;
    update: (id: number, data: Partial<Goal>) => Promise<Goal>;
    delete: (id: number) => Promise<{ id: number }>;
  };

  // 梦想相关
  dream: {
    getAll: () => Promise<Dream[]>;
    getById: (id: number) => Promise<Dream | undefined>;
    create: (data: Partial<Dream>) => Promise<Dream>;
    update: (id: number, data: Partial<Dream>) => Promise<Dream>;
    delete: (id: number) => Promise<{ id: number }>;
  };

  // 计算相关
  calculation: {
    getNetWorth: () => Promise<{
      totalAssets: number;
      totalDebts: number;
      netWorth: number;
      assetsByType: Record<string, number>;
    }>;
    getCashFlow: (month: string) => Promise<{
      totalIncome: number;
      totalExpense: number;
      balance: number;
      passiveIncome: number;
      incomeByCategory: Record<string, number>;
      expenseByCategory: Record<string, number>;
    }>;
    getGoalProgress: () => Promise<Array<{
      goal: Goal;
      progress: number;
      remaining: number;
      estimatedDate?: string;
    }>>;
    getRatios: () => Promise<{
      savingsRate: number;
      passiveIncomeRatio: number;
      debtRatio: number;
      financialFreedomProgress: number;
      health: 'excellent' | 'good' | 'fair' | 'poor';
    }>;
  };
}

declare global {
  interface Window {
    api: API;
  }
}
