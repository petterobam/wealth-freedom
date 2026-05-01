// 统一 API 客户端 — 前端与后端 Prisma+SQLite 的桥梁
// 替代 localStorage store.ts，所有数据通过 API 路由读写

/* ── Dashboard ──────────────────────────── */

export interface DashboardData {
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  netWorth: number;
  expenseByCategory: Record<string, number>;
  recentTransactions: ApiTransaction[];
  accountCount: number;
}

/* ── 类型映射（API 返回的 Prisma 模型） ── */

export interface ApiTransaction {
  id: string;
  date: string;
  type: string;
  category: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface ApiAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string;
  deadline: string | null;
  color: string;
  createdAt: string;
}

export interface ApiBudget {
  id: string;
  category: string;
  limit: number;
  period: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface ApiInvestment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  buyDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── 通用 fetch 工具 ────────────────────── */

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API Error ${res.status}`);
  }
  return res.json();
}

/* ── Dashboard ──────────────────────────── */

export function fetchDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/api/dashboard");
}

/* ── Transactions ───────────────────────── */

export function fetchTransactions(): Promise<ApiTransaction[]> {
  return request<ApiTransaction[]>("/api/transactions");
}

export function createTransaction(data: Omit<ApiTransaction, "id" | "createdAt">): Promise<ApiTransaction> {
  return request<ApiTransaction>("/api/transactions", { method: "POST", body: JSON.stringify(data) });
}

export function deleteTransaction(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/transactions", { method: "DELETE", body: JSON.stringify({ id }) });
}

/* ── Accounts ───────────────────────────── */

export function fetchAccounts(): Promise<ApiAccount[]> {
  return request<ApiAccount[]>("/api/accounts");
}

export function createAccount(data: Omit<ApiAccount, "id" | "createdAt" | "updatedAt">): Promise<ApiAccount> {
  return request<ApiAccount>("/api/accounts", { method: "POST", body: JSON.stringify(data) });
}

export function updateAccount(id: string, data: Partial<Omit<ApiAccount, "id" | "createdAt">>): Promise<ApiAccount> {
  return request<ApiAccount>("/api/accounts", { method: "PUT", body: JSON.stringify({ id, ...data }) });
}

export function deleteAccount(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/accounts", { method: "DELETE", body: JSON.stringify({ id }) });
}

/* ── Goals ──────────────────────────────── */

export function fetchGoals(): Promise<ApiGoal[]> {
  return request<ApiGoal[]>("/api/goals");
}

export function createGoal(data: Omit<ApiGoal, "id" | "createdAt">): Promise<ApiGoal> {
  return request<ApiGoal>("/api/goals", { method: "POST", body: JSON.stringify(data) });
}

export function updateGoal(id: string, data: Partial<Omit<ApiGoal, "id" | "createdAt">>): Promise<ApiGoal> {
  return request<ApiGoal>("/api/goals", { method: "PUT", body: JSON.stringify({ id, ...data }) });
}

export function deleteGoal(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/goals", { method: "DELETE", body: JSON.stringify({ id }) });
}

/* ── Budgets ────────────────────────────── */

export function fetchBudgets(): Promise<ApiBudget[]> {
  return request<ApiBudget[]>("/api/budgets");
}

export function createBudget(data: Omit<ApiBudget, "id" | "createdAt">): Promise<ApiBudget> {
  return request<ApiBudget>("/api/budgets", { method: "POST", body: JSON.stringify(data) });
}

export function updateBudget(id: string, data: Partial<Omit<ApiBudget, "id" | "createdAt">>): Promise<ApiBudget> {
  return request<ApiBudget>("/api/budgets", { method: "PUT", body: JSON.stringify({ id, ...data }) });
}

export function deleteBudget(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/budgets", { method: "DELETE", body: JSON.stringify({ id }) });
}

/* ── Settings (Import/Export/Reset) ─────── */

export interface ExportData {
  transactions: ApiTransaction[];
  accounts: ApiAccount[];
  budgets: ApiBudget[];
  goals: ApiGoal[];
  investments: ApiInvestment[];
  stats: { totalAssets: number; monthlyIncome: number; monthlyExpense: number; savingsRate: number; netWorth: number };
  version: number;
}

export function exportAllData(): Promise<ExportData> {
  return request<ExportData>("/api/settings");
}

export function importAllData(data: any): Promise<{ ok: boolean; count: number }> {
  return request<{ ok: boolean; count: number }>("/api/settings", { method: "POST", body: JSON.stringify(data) });
}

export function resetAllData(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/settings", { method: "DELETE" });
}

/* ── Investments ────────────────────────── */

export function fetchInvestments(): Promise<ApiInvestment[]> {
  return request<ApiInvestment[]>("/api/investments");
}

export function createInvestment(data: Omit<ApiInvestment, "id" | "createdAt" | "updatedAt">): Promise<ApiInvestment> {
  return request<ApiInvestment>("/api/investments", { method: "POST", body: JSON.stringify(data) });
}

export function updateInvestment(id: string, data: Partial<Omit<ApiInvestment, "id" | "createdAt">>): Promise<ApiInvestment> {
  return request<ApiInvestment>("/api/investments", { method: "PUT", body: JSON.stringify({ id, ...data }) });
}

export function deleteInvestment(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/investments", { method: "DELETE", body: JSON.stringify({ id }) });
}

/* ── Sync (Merge/Pull) ─────────────────── */

export interface SyncResult {
  ok: boolean;
  strategy: "merge" | "overwrite";
  merged?: Record<string, number>;
  total?: number;
  count?: number;
}

export function syncPush(data: any, strategy: "merge" | "overwrite" = "merge"): Promise<SyncResult> {
  return request<SyncResult>("/api/sync", { method: "POST", body: JSON.stringify({ data, strategy }) });
}

export function syncPull(): Promise<any> {
  return request<any>("/api/sync");
}
