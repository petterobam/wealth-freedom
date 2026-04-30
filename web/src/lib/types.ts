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
  investments: InvestmentHolding[];
  investmentTrades: InvestmentTrade[];
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

export interface InvestmentHolding {
  id: string;
  name: string;
  type: "fund" | "stock" | "bond" | "deposit" | "other";
  amount: number;      // 投入本金
  currentValue: number; // 当前市值
  buyDate: string;     // YYYY-MM-DD
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTrade {
  id: string;
  holdingId: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  date: string;
  note: string;
  createdAt: string;
}

export const INVESTMENT_TYPES: Record<InvestmentHolding["type"], string> = {
  fund: "基金",
  stock: "股票",
  bond: "债券",
  deposit: "定期存款",
  other: "其他",
};

export const INVESTMENT_ICONS: Record<InvestmentHolding["type"], string> = {
  fund: "📊",
  stock: "📈",
  bond: "📜",
  deposit: "🏦",
  other: "📂",
};

export const EXPENSE_CATEGORIES = [
  "餐饮", "交通", "房租", "购物", "通讯", "医疗", "娱乐", "教育", "其他支出",
] as const;
