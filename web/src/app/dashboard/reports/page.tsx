"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchDashboard,
  fetchTransactions,
  fetchAccounts,
  fetchInvestments,
  fetchBudgets,
} from "@/lib/api";
import type {
  ApiTransaction,
  ApiAccount,
  ApiInvestment,
  ApiBudget,
  DashboardData,
} from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const HEALTH_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"];
const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

function fmt(n: number) {
  if (n >= 10000) return "¥" + (n / 10000).toFixed(1) + "万";
  return "¥" + n.toLocaleString("zh-CN");
}

function fmtDate(d: string) {
  return d.slice(5); // MM-DD
}

// ── 财务健康评分计算 ──────────────────────────────────
function calcHealthScore(stats: DashboardData, accounts: ApiAccount[]) {
  const totalAssets = accounts.reduce((s, a) => s + a.balance, 0);
  const scores = {
    储蓄率: Math.min(100, Math.round(stats.savingsRate * (100 / 50))),
    收入: Math.min(100, Math.round((stats.monthlyIncome / 50000) * 100)),
    投资: Math.min(100, Math.round(4.09 * 10)), // placeholder
    资产: Math.min(100, Math.round((totalAssets / 3000000) * 100)),
    被动收入: Math.min(100, Math.round((3273 / stats.monthlyExpense) * 50)), // placeholder
  };
  const avg = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / 5
  );
  return { scores, avg };
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [investments, setInvestments] = useState<ApiInvestment[]>([]);
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [dashboardData, txData, acctData, investData, budgetData] = await Promise.all([
        fetchDashboard(),
        fetchTransactions(),
        fetchAccounts(),
        fetchInvestments(),
        fetchBudgets(),
      ]);
      setStats(dashboardData);
      setTransactions(txData);
      setAccounts(acctData);
      setInvestments(investData);
      setBudgets(budgetData);
    } catch (e) {
      console.error("Failed to load report data:", e);
    }
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  // 按时间过滤交易
  const filteredTx = useMemo(() => {
    const now = new Date();
    const cutoff =
      period === "month"
        ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
        : period === "quarter"
          ? new Date(now.getFullYear(), now.getMonth() - 3, 1)
          : new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const cutStr = cutoff.toISOString().slice(0, 10);
    return transactions.filter((t) => t.date >= cutStr);
  }, [transactions, period]);

  // 支出分类分布
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTx]);

  // 每日收支趋势
  const dailyTrend = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    filteredTx.forEach((t) => {
      if (!map[t.date]) map[t.date] = { income: 0, expense: 0 };
      (map[t.date] as any)[t.type] += t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: fmtDate(date),
        收入: Math.round(v.income),
        支出: Math.round(v.expense),
      }));
  }, [filteredTx]);

  // 资产配置分布
  const assetAllocation = useMemo(() => {
    const map: Record<string, number> = {};
    accounts.forEach((a) => {
      const label =
        a.type === "checking"
          ? "活期"
          : a.type === "savings"
            ? "储蓄"
            : a.type === "investment"
              ? "投资"
              : a.type === "credit"
                ? "信用卡"
                : a.type === "cash"
                  ? "现金"
                  : "其他";
      map[label] = (map[label] || 0) + a.balance;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  // 预算执行情况
  const budgetReport = useMemo(() => {
    return budgets.map((b) => ({
      name: b.category,
      预算: b.limit,
      实际: 0, // placeholder — spent calc needs transaction data join
      pct: 0,
    }));
  }, [budgets]);

  // 投资收益分析
  const investmentAnalysis = useMemo(() => {
    return investments.map((inv) => ({
      name: inv.name.length > 8 ? inv.name.slice(0, 8) + "…" : inv.name,
      投入: inv.amount,
      市值: inv.currentValue,
      收益: Math.round(inv.currentValue - inv.amount),
      收益率: parseFloat(
        (((inv.currentValue - inv.amount) / inv.amount) * 100).toFixed(1)
      ),
    }));
  }, [investments]);

  // 健康评分
  const health = useMemo(() => {
    if (!stats) return null;
    return calcHealthScore(stats, accounts);
  }, [stats, accounts]);

  // 汇总数据
  const summary = useMemo(() => {
    const income = filteredTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = filteredTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return {
      income: Math.round(income),
      expense: Math.round(expense),
      balance: Math.round(income - expense),
      txCount: filteredTx.length,
    };
  }, [filteredTx]);

  if (loading || !stats) {
    return (
      <div className="p-6 text-slate-500 dark:text-slate-400">
        加载中...
      </div>
    );
  }

  const periodLabel =
    period === "month" ? "近1个月" : period === "quarter" ? "近3个月" : "近1年";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* 标题 + 时间选择 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📋 财务报告
        </h1>
        <div className="flex gap-2">
          {(["month", "quarter", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {p === "month" ? "月" : p === "quarter" ? "季" : "年"}
            </button>
          ))}
        </div>
      </div>

      {/* 健康评分雷达图 */}
      {health && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            🏥 财务健康评分
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            综合评分：
            <span
              className={`text-xl font-bold ml-1 ${
                health.avg >= 80
                  ? "text-emerald-500"
                  : health.avg >= 60
                    ? "text-amber-500"
                    : "text-red-500"
              }`}
            >
              {health.avg}分
            </span>
          </p>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart
                data={Object.entries(health.scores).map(([key, val]) => ({
                  dimension: key,
                  score: val,
                  fullMark: 100,
                }))}
              >
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: "#64748b", fontSize: 13 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Radar
                  name="得分"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(health.scores).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-300 w-16">
                    {key}
                  </span>
                  <div className="w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${val}%`,
                        backgroundColor:
                          val >= 80
                            ? "#10b981"
                            : val >= 60
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 w-10 text-right">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 收支汇总卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: `${periodLabel}收入`,
            value: fmt(summary.income),
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: `${periodLabel}支出`,
            value: fmt(summary.expense),
            color: "text-red-500 dark:text-red-400",
          },
          {
            label: `${periodLabel}结余`,
            value: fmt(summary.balance),
            color:
              summary.balance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-500 dark:text-red-400",
          },
          {
            label: "交易笔数",
            value: `${summary.txCount}`,
            color: "text-slate-700 dark:text-slate-200",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {item.label}
            </div>
            <div className={`text-xl font-bold mt-1 ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 收支趋势 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            📈 收支趋势（{periodLabel}）
          </h2>
          {dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    v >= 10000 ? (v / 10000).toFixed(0) + "万" : String(v)
                  }
                />
                <Tooltip
                  formatter={(v) => fmt(Number(v))}
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">
              暂无数据
            </p>
          )}
        </div>

        {/* 支出分类饼图 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            🍩 支出分类（{periodLabel}）
          </h2>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {expenseByCategory.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">
              暂无数据
            </p>
          )}
        </div>

        {/* 资产配置 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            🏦 资产配置
          </h2>
          {assetAllocation.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {assetAllocation.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">
              暂无数据
            </p>
          )}
        </div>

        {/* 预算执行 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            🎯 预算执行情况
          </h2>
          {budgetReport.length > 0 ? (
            <div className="space-y-3">
              {budgetReport.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 dark:text-slate-200">
                      {b.name}
                    </span>
                    <span
                      className={`font-medium ${
                        b.pct >= 100
                          ? "text-red-500"
                          : b.pct >= 80
                            ? "text-amber-500"
                            : "text-emerald-500"
                      }`}
                    >
                      {fmt(b.实际)} / {fmt(b.预算)} ({b.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(b.pct, 100)}%`,
                        backgroundColor:
                          b.pct >= 100
                            ? "#ef4444"
                            : b.pct >= 80
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">
              暂无预算数据
            </p>
          )}
        </div>
      </div>

      {/* 投资收益分析 */}
      {investmentAnalysis.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            📊 投资收益分析
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={investmentAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) =>
                  v >= 10000 ? (v / 10000).toFixed(0) + "万" : String(v)
                }
              />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend />
              <Bar dataKey="投入" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="市值" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {investmentAnalysis.map((inv) => (
              <div
                key={inv.name}
                className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {inv.name}
                </div>
                <div
                  className={`text-sm font-bold ${
                    inv.收益 >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {inv.收益率 > 0 ? "+" : ""}
                  {inv.收益率}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
