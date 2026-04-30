"use client";

import { useState, useMemo } from "react";

// 示例数据 - 后续从 localStorage/API 读取
const DEMO_TRANSACTIONS = [
  { id: 1, date: "2026-04-28", type: "expense" as const, category: "餐饮", amount: 45, note: "午餐" },
  { id: 2, date: "2026-04-28", type: "expense" as const, category: "交通", amount: 12, note: "地铁" },
  { id: 3, date: "2026-04-27", type: "income" as const, category: "工资", amount: 30000, note: "4月工资" },
  { id: 4, date: "2026-04-27", type: "expense" as const, category: "房租", amount: 4500, note: "月租" },
  { id: 5, date: "2026-04-26", type: "expense" as const, category: "购物", amount: 299, note: "书籍" },
  { id: 6, date: "2026-04-25", type: "income" as const, category: "投资", amount: 3200, note: "基金分红" },
  { id: 7, date: "2026-04-25", type: "expense" as const, category: "餐饮", amount: 68, note: "晚餐" },
  { id: 8, date: "2026-04-24", type: "expense" as const, category: "通讯", amount: 128, note: "手机话费" },
  { id: 9, date: "2026-04-23", type: "expense" as const, category: "医疗", amount: 350, note: "体检" },
  { id: 10, date: "2026-04-22", type: "expense" as const, category: "娱乐", amount: 88, note: "电影" },
  { id: 11, date: "2026-04-21", type: "expense" as const, category: "餐饮", amount: 52, note: "午餐" },
  { id: 12, date: "2026-04-20", type: "expense" as const, category: "教育", amount: 199, note: "在线课程" },
];

type Transaction = (typeof DEMO_TRANSACTIONS)[number];
type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";
type TypeFilter = "all" | "income" | "expense";

const CATEGORIES = {
  income: ["工资", "投资", "副业", "其他收入"],
  expense: ["餐饮", "交通", "房租", "购物", "通讯", "医疗", "娱乐", "教育", "其他支出"],
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    let list = [...DEMO_TRANSACTIONS];

    // 类型筛选
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);

    // 分类筛选
    if (categoryFilter) list = list.filter((t) => t.category === categoryFilter);

    // 搜索
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.note.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }

    // 排序
    list.sort((a, b) => {
      const diff = sortKey === "date"
        ? a.date.localeCompare(b.date)
        : a.amount - b.amount;
      return sortDir === "asc" ? diff : -diff;
    });

    return list;
  }, [search, typeFilter, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const totalIncome = DEMO_TRANSACTIONS.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = DEMO_TRANSACTIONS.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const fmt = (n: number) => "¥" + n.toLocaleString("zh-CN");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const allCategories = typeFilter === "all"
    ? [...CATEGORIES.income, ...CATEGORIES.expense]
    : CATEGORIES[typeFilter];

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-xl font-bold mb-6">💰 交易记录</h2>

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

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="搜索备注/分类..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-48"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setCategoryFilter(""); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">全部类型</option>
          <option value="income">收入</option>
          <option value="expense">支出</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">全部分类</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* 表格 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400">
              <th
                className="px-4 py-3 text-left cursor-pointer hover:text-white"
                onClick={() => toggleSort("date")}
              >
                日期 {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left">类型</th>
              <th className="px-4 py-3 text-left">分类</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-white"
                onClick={() => toggleSort("amount")}
              >
                金额 {sortKey === "amount" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left">备注</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => (
              <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3 text-slate-300">{t.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.type === "income"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {t.type === "income" ? "收入" : "支出"}
                  </span>
                </td>
                <td className="px-4 py-3">{t.category}</td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${
                  t.type === "income" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </td>
                <td className="px-4 py-3 text-slate-400">{t.note}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无匹配的交易记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-slate-800 text-sm disabled:opacity-30"
          >
            上一页
          </button>
          <span className="px-3 py-1 text-sm text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-slate-800 text-sm disabled:opacity-30"
          >
            下一页
          </button>
        </div>
      )}

      <p className="text-center text-slate-600 text-xs mt-8">
        数据存储在本地 · 从桌面端导入 · v1.5.0-preview
      </p>
    </div>
  );
}
