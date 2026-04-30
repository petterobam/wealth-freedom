// 财务数据类型定义

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: "income" | "expense";
  category: string;
  amount: number;
  note: string;
  createdAt: string; // ISO
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string;
  deadline: string; // YYYY-MM
  color: string; // tailwind gradient
  createdAt: string;
}

export interface DashboardStats {
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  investmentReturn: number;
  netWorth: number;
  passiveIncome: number;
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "investment" | "credit" | "cash" | "other";
  balance: number;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceData {
  transactions: Transaction[];
  goals: Goal[];
  accounts: Account[];
  budgets: Budget[];
  stats: DashboardStats;
  version: number;
}

export const ACCOUNT_TYPES: Record<Account["type"], string> = {
  checking: "活期账户",
  savings: "储蓄账户",
  investment: "投资账户",
  credit: "信用卡",
  cash: "现金",
  other: "其他",
};

export const ACCOUNT_ICONS: Record<Account["type"], string> = {
  checking: "💳",
  savings: "🏦",
  investment: "📈",
  credit: "🏷️",
  cash: "💵",
  other: "📂",
};

export const INCOME_CATEGORIES = ["工资", "投资", "副业", "其他收入"] as const;
export interface Budget {
  id: string;
  category: string;
  limit: number; // 月度预算上限
  period: "monthly" | "yearly";
  icon: string;
  color: string;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  "餐饮", "交通", "房租", "购物", "通讯", "医疗", "娱乐", "教育", "其他支出",
] as const;
