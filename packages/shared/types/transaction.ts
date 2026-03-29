/**
 * 交易记录相关类型定义
 */

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum IncomeCategory {
  SALARY = 'salary',
  BONUS = 'bonus',
  SIDE_INCOME = 'side_income',
  INVESTMENT = 'investment',
  INTEREST = 'interest',
  RENT = 'rent',
  PRODUCT = 'product',
  OTHER = 'other',
}

export enum ExpenseCategory {
  RENT = 'rent',
  INSURANCE = 'insurance',
  DEBT_PAYMENT = 'debt_payment',
  UTILITY = 'utility',
  COMMUNICATION = 'communication',
  FOOD = 'food',
  TRANSPORT = 'transport',
  SHOPPING = 'shopping',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  EDUCATION = 'education',
  OTHER = 'other',
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: Date;
  note?: string;
  tags?: string[];
  createdAt: Date;
}

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  [IncomeCategory.SALARY]: '工资',
  [IncomeCategory.BONUS]: '奖金',
  [IncomeCategory.SIDE_INCOME]: '兼职/项目',
  [IncomeCategory.INVESTMENT]: '投资收益',
  [IncomeCategory.INTEREST]: '利息',
  [IncomeCategory.RENT]: '租金收入',
  [IncomeCategory.PRODUCT]: '产品收入',
  [IncomeCategory.OTHER]: '其他',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: '房租/房贷',
  [ExpenseCategory.INSURANCE]: '保险',
  [ExpenseCategory.DEBT_PAYMENT]: '还债',
  [ExpenseCategory.UTILITY]: '水电煤',
  [ExpenseCategory.COMMUNICATION]: '通信费',
  [ExpenseCategory.FOOD]: '餐饮',
  [ExpenseCategory.TRANSPORT]: '交通',
  [ExpenseCategory.SHOPPING]: '购物',
  [ExpenseCategory.ENTERTAINMENT]: '娱乐',
  [ExpenseCategory.HEALTH]: '医疗健康',
  [ExpenseCategory.EDUCATION]: '教育学习',
  [ExpenseCategory.OTHER]: '其他',
};
