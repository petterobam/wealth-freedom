import {
  FinanceData,
  Transaction,
  Goal,
  DashboardStats,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "./types";

const STORAGE_KEY = "wealth-freedom-data";
const VERSION = 1;

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
  stats: DEFAULT_STATS,
  version: VERSION,
};

// ── 读取/写入 ─────────────────────────────────────────

function parse(raw: string | null): FinanceData {
  if (!raw) return DEFAULT_DATA;
  try {
    const data = JSON.parse(raw) as FinanceData;
    if (data.version !== VERSION) return DEFAULT_DATA;
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

export { INCOME_CATEGORIES, EXPENSE_CATEGORIES };
export type { FinanceData, Transaction, Goal, DashboardStats };
