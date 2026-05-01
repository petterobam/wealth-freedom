"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchGoals, createGoal, updateGoal as apiUpdateGoal, deleteGoal as apiDeleteGoal } from "@/lib/api";
import type { ApiGoal } from "@/lib/api";

function fmt(n: number) {
  if (n >= 10000) return "¥" + (n / 10000).toFixed(1) + "万";
  return "¥" + n.toLocaleString("zh-CN");
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr + "-01");
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const ICONS = ["🛡️", "🏦", "💻", "👥", "🏝️", "🎯", "💰", "📈", "🏠", "🚀"];
const COLORS = [
  "from-blue-500 to-emerald-500",
  "from-purple-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-400 to-teal-300",
  "from-red-500 to-rose-400",
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<ApiGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "", icon: "🎯", color: "from-blue-500 to-emerald-500" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCurrent, setEditCurrent] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await fetchGoals();
      setGoals(data);
    } catch (e) {
      console.error("Failed to fetch goals:", e);
    }
  }, []);

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);

  const handleAdd = async () => {
    const target = parseFloat(form.target);
    const current = parseFloat(form.current) || 0;
    if (!form.name || !target || !form.deadline) return;
    try {
      await createGoal({ name: form.name, target, current, icon: form.icon, deadline: form.deadline || null, color: form.color });
      await refresh();
      setShowAdd(false);
      setForm({ name: "", target: "", current: "", deadline: "", icon: "🎯", color: "from-blue-500 to-emerald-500" });
    } catch (e) {
      console.error("Failed to create goal:", e);
    }
  };

  const handleUpdateProgress = async (id: string) => {
    const val = parseFloat(editCurrent);
    if (isNaN(val)) return;
    try {
      await apiUpdateGoal(id, { current: val });
      setEditingId(null);
      await refresh();
    } catch (e) {
      console.error("Failed to update goal:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("确认删除此目标？")) {
      try {
        await apiDeleteGoal(id);
        await refresh();
      } catch (e) {
        console.error("Failed to delete goal:", e);
      }
    }
  };

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  if (loading) return <div className="p-6 text-slate-500">加载中...</div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">🎯 目标追踪</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
          {showAdd ? "取消" : "+ 新增目标"}
        </button>
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input type="text" placeholder="目标名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm" />
            <input type="number" placeholder="目标金额" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm" />
            <input type="number" placeholder="当前进度" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm" />
            <input type="month" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={handleAdd} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium">确认</button>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-xs text-slate-400">图标：</span>
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setForm({ ...form, icon: ic })} className={`text-lg ${form.icon === ic ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>{ic}</button>
            ))}
          </div>
        </div>
      )}

      {/* 总体进度 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">总体进度</h3>
          <span className="text-2xl font-bold text-blue-400">{overallPct}%</span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="text-sm text-slate-400 mt-2">已完成 {fmt(totalCurrent)} / 目标 {fmt(totalTarget)}</p>
      </div>

      {/* 目标卡片 */}
      <div className="grid md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const days = daysUntil(goal.deadline || "2099-12");
          const isOverdue = days < 0;
          const isUrgent = days >= 0 && days < 90;

          return (
            <div key={goal.id} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <h4 className="font-semibold">{goal.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{pct}%</span>
                  <button onClick={() => handleDelete(goal.id)} className="text-red-400/40 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div className={`h-full bg-gradient-to-r ${goal.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{fmt(goal.current)} <span className="text-slate-600">/</span> {fmt(goal.target)}</span>
                <span className={`font-medium ${isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-slate-400"}`}>
                  {isOverdue ? `已过期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">截止：{goal.deadline}</div>

              {/* 更新进度 */}
              {editingId === goal.id ? (
                <div className="flex gap-2 mt-3">
                  <input type="number" value={editCurrent} onChange={(e) => setEditCurrent(e.target.value)} placeholder="新进度值" className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs flex-1" />
                  <button onClick={() => handleUpdateProgress(goal.id)} className="text-xs bg-emerald-600 px-2 py-1 rounded">保存</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 px-2 py-1">取消</button>
                </div>
              ) : (
                <button onClick={() => { setEditingId(goal.id); setEditCurrent(goal.current.toString()); }} className="text-xs text-blue-400/60 hover:text-blue-400 mt-3">更新进度</button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-slate-600 text-xs mt-8">数据通过 API 实时同步 · v1.5.0</p>
    </div>
  );
}
