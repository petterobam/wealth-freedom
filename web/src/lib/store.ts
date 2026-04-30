import {
  FinanceData,
  Transaction,
  Goal,
  Account,
  DashboardStats,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ACCOUNT_TYPES,
  ACCOUNT_ICONS,
} from "./types";

const STORAGE_KEY = "wealth-freedom-data";
const VERSION = 2;

// ── 默认数据 ──────────────────────────────────────────

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "2026-04-28", type: "expense", category: "餐饮", amount: 45, note: "午餐", createdAt: "2026-04-28T08:00:00Z" },
  { id: "t2", date: "2026-04-28", type: "expense", category: "交通", amount: 12, note: "地铁", createdAt: "2026-04-28T07:30:00Z" },
  { id: "t3", date: "2026-04-27", type: "income", category: "工资", amount: 30000, note: "4月工资", createdAt: "2026-04-27T09:00:00Z" },
  { id: "t4", date: "2026-04-27", type: "expense", category: "房租", amount: 4500, note: "月租", createdAt: "2026-04-27T10:00:00Z" },
  { id: "t5", date: "2026-04-26", type: "expense", category: "购物", amount: 299, note: "书籍", createdAt: "2026-04-26T14:00:00Z" },
  { id: "t6", date: "2026-04-25", type: "income", category: "投资", amount: 3200, note: "基金分红", createdAt: "2026-04-25T12:00:00Z" },
  { id: "t7", date: "2026-04-25", type: "expense", category: "餐饮", amount: 68, note: "晚餐", createdAt: "2026-04-25T19:00:00Z" },
  { id: "t8", date: "2026-04-24", type: "expense", category: "通讯", amount: 128, note: "手机话费", createdAt: "2026-04-24T11:00:00Z" },
  { id: "t9", date: "2026-04-23", type: "expense", category: "医疗", amount: 350, note: "体检", createdAt: "2026-04-23T15:00:00Z" },
  { id: "t10", date: "2026-04-22", type: "expense", category: "娱乐", amount: 88, note: "电影", createdAt: "2026-04-22T20:00:00Z" },
  { id: "t11", date: "2026-04-21", type: "expense", category: "餐饮", amount: 52, note: "午餐", createdAt: "2026-04-21T12:00:00Z" },
  { id: "t12", date: "2026-04-20", type: "expense", category: "教育", amount: 199, note: "在线课程", createdAt: "2026-04-20T16:00:00Z" },
];

const DEFAULT_GOALS: Goal[] = [
  { id: "g1", name: "财务安全", target: 3160000, current: 1100000, icon: "🛡️", deadline: "2030-11", color: "from-blue-500 to-emerald-500", createdAt: "2026-01-01T00:00:00Z" },
  { id: "g2", name: "6个月储备金", target: 180000, current: 135000, icon: "🏦", deadline: "2026-06", color: "from-purple-500 to-pink-500", createdAt: "2026-01-01T00:00:00Z" },
  { id: "g3", name: "产品月收入 ¥2,000", target: 2000, current: 0, icon: "💻", deadline: "2026-08", color: "from-amber-500 to-orange-500", createdAt: "2026-01-01T00:00:00Z" },
  { id: "g4", name: "1000+ 用户", target: 1000, current: 12, icon: "👥", deadline: "2027-04", color: "from-cyan-500 to-blue-500", createdAt: "2026-01-01T00:00:00Z" },
  { id: "g5", name: "财务自由", target: 8000000, current: 1100000, icon: "🏝️", deadline: "2031-04", color: "from-emerald-400 to-teal-300", createdAt: "2026-01-01T00:00:00Z" },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "a1", name: "招商银行", type: "checking", balance: 45000, icon: "💳", color: "#e74c3c", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-04-28T00:00:00Z" },
  { id: "a2", name: "支付宝余额", type: "savings", balance: 25000, icon: "🏦", color: "#3b82f6", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-04-28T00:00:00Z" },
  { id: "a3", name: "基金投资", type: "investment", balance: 680000, icon: "📈", color: "#10b981", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-04-28T00:00:00Z" },
  { id: "a4", name: "股票账户", type: "investment", balance: 320000, icon: "📈", color: "#f59e0b", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-04-28T00:00:00Z" },
  { id: "a5", name: "现金", type: "cash", balance: 30000, icon: "💵", color: "#8b5cf6", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-04-28T00:00:00Z" },
];

const DEFAULT_STATS: DashboardStats = {
  totalAssets: 1100000,
  monthlyIncome: 41700,
  monthlyExpense: 12469,
  savingsRate: 70.1,
  investmentReturn: 4.09,
  netWorth: 1100000,
  passiveIncome: 3273,
};

const DEFAULT_DATA: FinanceData = {
  transactions: DEFAULT_TRANSACTIONS,
  goals: DEFAULT_GOALS,
  accounts: DEFAULT_ACCOUNTS,
  stats: DEFAULT_STATS,
  version: VERSION,
};

// ── 读取/写入 ─────────────────────────────────────────

function parse(raw: string | null): FinanceData {
  if (!raw) return DEFAULT_DATA;
  try {
    const data = JSON.parse(raw) as FinanceData;
    if (!data.transactions || !data.goals) return DEFAULT_DATA;
    // migration: add accounts if missing
    if (!data.accounts) data.accounts = DEFAULT_ACCOUNTS;
    return data;
  } catch {
    return DEFAULT_DATA;
  }
}

export function loadData(): FinanceData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  return parse(localStorage.getItem(STORAGE_KEY));
}

function save(data: FinanceData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Transaction CRUD ──────────────────────────────────

export function getTransactions(): Transaction[] {
  return loadData().transactions;
}

export function addTransaction(tx: Omit<Transaction, "id" | "createdAt">): Transaction {
  const data = loadData();
  const newTx: Transaction = {
    ...tx,
    id: "t_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  data.transactions = [newTx, ...data.transactions];
  save(data);
  return newTx;
}

export function deleteTransaction(id: string): boolean {
  const data = loadData();
  const before = data.transactions.length;
  data.transactions = data.transactions.filter((t) => t.id !== id);
  if (data.transactions.length === before) return false;
  save(data);
  return true;
}

export function updateTransaction(id: string, patch: Partial<Omit<Transaction, "id" | "createdAt">>): Transaction | null {
  const data = loadData();
  const idx = data.transactions.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  data.transactions[idx] = { ...data.transactions[idx], ...patch };
  save(data);
  return data.transactions[idx];
}

// ── Goal CRUD ─────────────────────────────────────────

export function getGoals(): Goal[] {
  return loadData().goals;
}

export function addGoal(goal: Omit<Goal, "id" | "createdAt">): Goal {
  const data = loadData();
  const newGoal: Goal = {
    ...goal,
    id: "g_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  data.goals = [...data.goals, newGoal];
  save(data);
  return newGoal;
}

export function updateGoal(id: string, patch: Partial<Omit<Goal, "id" | "createdAt">>): Goal | null {
  const data = loadData();
  const idx = data.goals.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  data.goals[idx] = { ...data.goals[idx], ...patch };
  save(data);
  return data.goals[idx];
}

export function deleteGoal(id: string): boolean {
  const data = loadData();
  const before = data.goals.length;
  data.goals = data.goals.filter((g) => g.id !== id);
  if (data.goals.length === before) return false;
  save(data);
  return true;
}

// ── Account CRUD ─────────────────────────────────────

export function getAccounts(): Account[] {
  return loadData().accounts;
}

export function addAccount(acct: Omit<Account, "id" | "createdAt" | "updatedAt">): Account {
  const data = loadData();
  const now = new Date().toISOString();
  const newAcct: Account = {
    ...acct,
    id: "a_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    createdAt: now,
    updatedAt: now,
  };
  data.accounts = [...data.accounts, newAcct];
  save(data);
  return newAcct;
}

export function updateAccount(id: string, patch: Partial<Omit<Account, "id" | "createdAt">>): Account | null {
  const data = loadData();
  const idx = data.accounts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  data.accounts[idx] = { ...data.accounts[idx], ...patch, updatedAt: new Date().toISOString() };
  save(data);
  return data.accounts[idx];
}

export function deleteAccount(id: string): boolean {
  const data = loadData();
  const before = data.accounts.length;
  data.accounts = data.accounts.filter((a) => a.id !== id);
  if (data.accounts.length === before) return false;
  save(data);
  return true;
}

export function getTotalAssets(): number {
  return loadData().accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function getAssetsByType(): { type: string; label: string; value: number; color: string }[] {
  const data = loadData();
  const map: Record<string, number> = {};
  data.accounts.forEach((a) => {
    map[a.type] = (map[a.type] || 0) + a.balance;
  });
  const labels: Record<string, string> = { checking: "活期", savings: "储蓄", investment: "投资", credit: "信用卡", cash: "现金", other: "其他" };
  const colors: Record<string, string> = { checking: "#e74c3c", savings: "#3b82f6", investment: "#10b981", credit: "#f59e0b", cash: "#8b5cf6", other: "#6b7280" };
  return Object.entries(map)
    .map(([type, value]) => ({ type, label: labels[type] || type, value: Math.round(value), color: colors[type] || "#6b7280" }))
    .sort((a, b) => b.value - a.value);
}

// ── Stats ─────────────────────────────────────────────

export function getStats(): DashboardStats {
  return loadData().stats;
}

export function updateStats(patch: Partial<DashboardStats>): DashboardStats {
  const data = loadData();
  data.stats = { ...data.stats, ...patch };
  save(data);
  return data.stats;
}

// ── Import/Export ─────────────────────────────────────

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2);
}

export function importData(json: string): { ok: boolean; error?: string } {
  try {
    const data = JSON.parse(json) as FinanceData;
    if (!data.transactions || !data.goals) return { ok: false, error: "数据格式不正确" };
    if (!data.accounts) data.accounts = DEFAULT_ACCOUNTS;
    data.version = VERSION;
    save(data);
    return { ok: true };
  } catch {
    return { ok: false, error: "JSON 解析失败" };
  }
}

export function resetData(): void {
  save(DEFAULT_DATA);
}

// ── Helpers ───────────────────────────────────────────

export { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNT_TYPES, ACCOUNT_ICONS };
export type { FinanceData, Transaction, Goal, Account, DashboardStats };
