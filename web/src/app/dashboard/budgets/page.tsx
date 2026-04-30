"use client";

import { useState, useEffect } from "react";
import {
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  getBudgetSpent,
  EXPENSE_CATEGORIES,
} from "@/lib/store";
import type { Budget } from "@/lib/types";

const COLORS = [
  "#e74c3c", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const ICONS = ["🍜", "🚇", "🛍️", "🎮", "🏠", "💊", "📱", "📚", "🎬", "💰"];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "",
    limit: 1000,
    period: "monthly" as "monthly" | "yearly",
    icon: "💰",
    color: "#3b82f6",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBudgets(getBudgets());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-6 text-slate-500">加载中...</div>;

  const spent = budgets.map((b) => ({
    budget: b,
    spent: getBudgetSpent(b.category),
  }));
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = spent.reduce((s, x) => s + x.spent, 0);
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const fmt = (n: number) => "¥" + n.toLocaleString("zh-CN");

  const handleSave = () => {
    if (!form.category || form.limit <= 0) return;
    if (editingId) {
      updateBudget(editingId, form);
    } else {
      addBudget(form);
    }
    setBudgets(getBudgets());
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (b: Budget) => {
    setForm({ category: b.category, limit: b.limit, period: b.period, icon: b.icon, color: b.color });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定删除此预算？")) return;
    deleteBudget(id);
    setBudgets(getBudgets());
  };

  const resetForm = () => {
    setForm({ category: "", limit: 1000, period: "monthly", icon: "💰", color: "#3b82f6" });
  };

  const pctColor = (pct: number) => {
    if (pct >= 100) return "text-red-400";
    if (pct >= 80) return "text-amber-400";
    return "text-emerald-400";
  };

  const pctBarColor = (pct: number) => {
    if (pct >= 100) return "bg-red-500";
    if (pct >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">🎯 预算管理</h2>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowForm(!showForm); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
        >
          {showForm ? "取消" : "+ 新建预算"}
        </button>
      </div>

      {/* 总览 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">总预算</div>
          <div className="text-lg font-bold">{fmt(totalBudget)}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">已花费</div>
          <div className={`text-lg font-bold ${pctColor(totalPct)}`}>{fmt(totalSpent)}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">剩余</div>
          <div className="text-lg font-bold text-emerald-400">{fmt(Math.max(0, totalBudget - totalSpent))}</div>
        </div>
      </div>

      {/* 总进度条 */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>整体进度</span>
          <span className={pctColor(totalPct)}>{totalPct}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pctBarColor(totalPct)}`} style={{ width: `${Math.min(100, totalPct)}%` }} />
        </div>
      </div>

      {/* 新建/编辑表单 */}
      {showForm && (
        <div className="bg-slate-800 rounded-xl p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">{editingId ? "编辑预算" : "新建预算"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">分类</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-blue-500 outline-none"
              >
                <option value="">选择分类</option>
                {EXPENSE_CATEGORIES.filter((c) => !budgets.some((b) => b.category === c && b.id !== editingId)).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">月度预算 (¥)</label>
              <input
                type="number"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-blue-500 outline-none"
                min={1}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">图标</label>
              <div className="flex gap-1">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setForm({ ...form, icon })}
                    className={`w-8 h-8 rounded text-base flex items-center justify-center ${form.icon === icon ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">颜色</label>
              <div className="flex gap-1">
                {COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded ${form.color === c ? "ring-2 ring-white" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
            {editingId ? "保存修改" : "创建预算"}
          </button>
        </div>
      )}

      {/* 预算列表 */}
      <div className="space-y-3">
        {spent.map(({ budget: b, spent: s }) => {
          const pct = b.limit > 0 ? Math.round((s / b.limit) * 100) : 0;
          return (
            <div key={b.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <span className="font-medium">{b.category}</span>
                    <span className="text-xs text-slate-400 ml-2">{b.period === "monthly" ? "月度" : "年度"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono ${pctColor(pct)}`}>
                    {fmt(s)} / {fmt(b.limit)}
                  </span>
                  <button onClick={() => handleEdit(b)} className="text-slate-400 hover:text-white text-xs">编辑</button>
                  <button onClick={() => handleDelete(b.id)} className="text-slate-400 hover:text-red-400 text-xs">删除</button>
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pctBarColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">剩余 {fmt(Math.max(0, b.limit - s))}</span>
                <span className={`text-xs font-medium ${pctColor(pct)}`}>{pct}%</span>
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-3">🎯</p>
            <p>还没有预算，点击上方按钮创建</p>
          </div>
        )}
      </div>
    </div>
  );
}
