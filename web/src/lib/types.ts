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

export interface FinanceData {
  transactions: Transaction[];
  goals: Goal[];
  stats: DashboardStats;
  version: number;
}

export const INCOME_CATEGORIES = ["工资", "投资", "副业", "其他收入"] as const;
export const EXPENSE_CATEGORIES = [
  "餐饮", "交通", "房租", "购物", "通讯", "医疗", "娱乐", "教育", "其他支出",
] as const;
