"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { fetchTransactions, createTransaction, deleteTransaction as apiDeleteTransaction } from "@/lib/api";
import type { ApiTransaction } from "@/lib/api";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";
type TypeFilter = "all" | "income" | "expense";

const CATEGORIES = {
  income: INCOME_CATEGORIES as unknown as string[],
  expense: EXPENSE_CATEGORIES as unknown as string[],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const perPage = 8;

  // 新增交易表单
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "expense" as "income" | "expense", category: "餐饮", amount: "", note: "" });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    }
  }, []);

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);

  const handleAdd = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.date) return;
    try {
      await createTransaction({ date: form.date, type: form.type, category: form.category, amount, note: form.note || null });
      await refresh();
      setShowAdd(false);
      setForm({ date: new Date().toISOString().slice(0, 10), type: "expense", category: "餐饮", amount: "", note: "" });
    } catch (e) {
      console.error("Failed to create transaction:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("确认删除这条记录？")) {
      try {
        await apiDeleteTransaction(id);
        await refresh();
      } catch (e) {
        console.error("Failed to delete transaction:", e);
      }
    }
  };

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (categoryFilter) list = list.filter((t) => t.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => (t.note || "").toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.amount.toString().includes(q));
    }
    list.sort((a, b) => {
      const diff = sortKey === "date" ? a.date.localeCompare(b.date) : a.amount - b.amount;
      return sortDir === "asc" ? diff : -diff;
    });
    return list;
  }, [transactions, search, typeFilter, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // 月度收支趋势（近6月）
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const mk = t.date.slice(0, 7);
      if (months[mk]) {
        if (t.type === "income") months[mk].income += t.amount;
        else months[mk].expense += t.amount;
      }
    });
    return Object.entries(months).map(([month, v]) => ({
      name: month.slice(5) + "月",
      收入: Math.round(v.income),
      支出: Math.round(v.expense),
      结余: Math.round(v.income - v.expense),
    }));
  }, [transactions]);

  const fmt = (n: number) => "¥" + n.toLocaleString("zh-CN");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };
  const allCategories = typeFilter === "all" ? [...CATEGORIES.income, ...CATEGORIES.expense] : CATEGORIES[typeFilter];

  if (loading) return <div className="p-6 text-slate-500">加载中...</div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">💰 交易记录</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
          {showAdd ? "取消" : "+ 新增"}
        </button>
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense", category: e.target.value === "income" ? "工资" : "餐饮" })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm">
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm">
              {(form.type === "income" ? CATEGORIES.income : CATEGORIES.expense).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="金额" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm" />
            <div className="flex gap-2">
              <input type="text" placeholder="备注" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm flex-1" />
              <button onClick={handleAdd} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium whitespace-nowrap">确认</button>
            </div>
          </div>
        </div>
      )}

      {/* 收支汇总 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-xs text-emerald-400 mb-1">总收入</div>
          <div className="text-lg font-bold text-emerald-400">{fmt(totalIncome)}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="text-xs text-red-400 mb-1">总支出</div>
          <div className="text-lg font-bold text-red-400">{fmt(totalExpense)}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="text-xs text-blue-400 mb-1">净收入</div>
          <div className="text-lg font-bold text-blue-400">{fmt(totalIncome - totalExpense)}</div>
        </div>
      </div>

      {/* 月度收支趋势图 */}
      {monthlyTrend.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 mb-6">
          <h3 className="font-bold mb-4">📈 月度收支趋势</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v: number) => `¥${v}`} />
              <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
              <Bar dataKey="收入" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="支出" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input type="text" placeholder="搜索备注/分类..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-48" />
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setCategoryFilter(""); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm">
          <option value="all">全部类型</option>
          <option value="income">收入</option>
          <option value="expense">支出</option>
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm">
          <option value="">全部分类</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* 表格 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400">
              <th className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => toggleSort("date")}>日期 {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}</th>
              <th className="px-4 py-3 text-left">类型</th>
              <th className="px-4 py-3 text-left">分类</th>
              <th className="px-4 py-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort("amount")}>金额 {sortKey === "amount" && (sortDir === "asc" ? "↑" : "↓")}</th>
              <th className="px-4 py-3 text-left">备注</th>
              <th className="px-4 py-3 text-center w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => (
              <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3 text-slate-300">{t.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{t.type === "income" ? "收入" : "支出"}</span>
                </td>
                <td className="px-4 py-3">{t.category}</td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>{t.type === "income" ? "+" : "-"}{fmt(t.amount)}</td>
                <td className="px-4 py-3 text-slate-400">{t.note}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(t.id)} className="text-red-400/50 hover:text-red-400 text-xs">删除</button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">暂无匹配的交易记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded bg-slate-800 text-sm disabled:opacity-30">上一页</button>
          <span className="px-3 py-1 text-sm text-slate-400">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded bg-slate-800 text-sm disabled:opacity-30">下一页</button>
        </div>
      )}

      <p className="text-center text-slate-600 text-xs mt-8">数据通过 API 实时同步 · v1.6.0</p>
    </div>
  );
}
