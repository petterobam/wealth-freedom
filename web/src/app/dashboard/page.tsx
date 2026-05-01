"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDashboard, useGoals, useTransactions } from "@/lib/hooks";
import type { ApiTransaction } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";

export default function DashboardPage() {
  const { data: dashboard, loading: dashLoading, error: dashError } = useDashboard();
  const { data: goals } = useGoals();
  const { data: allTransactions } = useTransactions();

  if (dashLoading) return <div className="p-6 text-slate-500">加载中...</div>;
  if (dashError) return <div className="p-6 text-red-400">加载失败：{dashError}</div>;
  if (!dashboard) return null;

  const fmt = (n: number) => "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
  const safetyGoal = goals?.find((g) => g.name === "财务安全");
  const safetyPct = safetyGoal ? Math.round((safetyGoal.current / safetyGoal.target) * 100) : 0;

  // 近7日收支数据
  const barData = useMemo(() => {
    if (!allTransactions) return [];
    const days: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { income: 0, expense: 0 };
    }
    allTransactions.forEach((t) => {
      if (days[t.date]) {
        if (t.type === "income") days[t.date].income += t.amount;
        else days[t.date].expense += t.amount;
      }
    });
    return Object.entries(days).map(([date, v]) => ({
      name: date.slice(5),
      收入: v.income,
      支出: v.expense,
    }));
  }, [allTransactions]);

  // 支出分类饼图
  const pieData = useMemo(() => {
    const cats = dashboard.expenseByCategory || {};
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [dashboard.expenseByCategory]);

  // 净资产趋势（近6月）
  const netWorthData = useMemo(() => {
    if (!allTransactions) return [];
    const months: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { income: 0, expense: 0 };
    }
    allTransactions.forEach((t) => {
      const mk = t.date.slice(0, 7);
      if (months[mk]) {
        if (t.type === "income") months[mk].income += t.amount;
        else months[mk].expense += t.amount;
      }
    });
    const entries = Object.entries(months);
    const deltas = entries.map(([, v]) => v.income - v.expense);
    let cumulative = dashboard.netWorth - deltas.reduce((a, b) => a + b, 0);
    return entries.map(([month, v], i) => {
      cumulative += deltas[i];
      return { name: month.slice(5) + "月", 净资产: Math.round(cumulative) };
    });
  }, [allTransactions, dashboard.netWorth]);

  return (
    <div className="p-6 max-w-6xl">
      <h2 className="text-xl font-bold mb-6">📊 财务看板</h2>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "总资产", value: fmt(dashboard.totalAssets), color: "text-blue-400" },
          { label: "月收入", value: fmt(dashboard.monthlyIncome), color: "text-emerald-400" },
          { label: "月支出", value: fmt(dashboard.monthlyExpense), color: "text-amber-400" },
          { label: "储蓄率", value: dashboard.savingsRate + "%", color: "text-purple-400" },
        ].map((card) => (
          <div key={card.label} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 功能模块 */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { title: "交易记录", icon: "💰", desc: "查看收支明细", href: "/dashboard/transactions" },
          { title: "目标追踪", icon: "🎯", desc: "财务自由进度", href: "/dashboard/goals" },
          { title: "AI 助手", icon: "🤖", desc: "个性化理财建议", href: "#" },
        ].map((mod) => (
          <Link key={mod.title} href={mod.href} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition block">
            <div className="text-2xl mb-2">{mod.icon}</div>
            <h3 className="font-bold mb-1">{mod.title}</h3>
            <p className="text-sm text-slate-400">{mod.desc}</p>
          </Link>
        ))}
      </div>

      {/* 财务安全进度 */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 mb-8">
        <h3 className="font-bold mb-4">🛡️ 财务安全进度</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all" style={{ width: `${safetyPct}%` }} />
          </div>
          <span className="text-emerald-400 font-semibold">{safetyPct}%</span>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          {safetyGoal ? `¥${(safetyGoal.current / 10000).toFixed(0)}万 / ¥${(safetyGoal.target / 10000).toFixed(0)}万 · 截止 ${safetyGoal.deadline}` : "暂无财务安全目标"}
        </p>
      </div>

      {/* 图表区 */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="font-bold mb-4">📈 近7日收支</h3>
          <ChartContent data={barData} />
        </div>
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="font-bold mb-4">🍩 支出分类</h3>
          <PieContent data={pieData} />
        </div>
      </div>

      {/* 净资产趋势 */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 mb-8">
        <h3 className="font-bold mb-4">💹 净资产趋势（近6月）</h3>
        <NetWorthChart data={netWorthData} />
      </div>

      {/* 最近交易 */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">📝 最近交易</h3>
          <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:underline">查看全部 →</Link>
        </div>
        <div className="space-y-2">
          {(dashboard.recentTransactions || []).slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {t.type === "income" ? "收" : "支"}
                </span>
                <span className="text-sm">{t.note || t.category}</span>
                <span className="text-xs text-slate-500">{t.date}</span>
              </div>
              <span className={`text-sm font-mono font-semibold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                {t.type === "income" ? "+" : "-"}¥{t.amount.toLocaleString("zh-CN")}
              </span>
            </div>
          ))}
          {(!dashboard.recentTransactions || dashboard.recentTransactions.length === 0) && (
            <p className="text-sm text-slate-500 text-center py-4">暂无交易记录</p>
          )}
        </div>
      </div>

      <p className="text-center text-slate-600 text-xs mt-12">数据存储在云端数据库 · v1.5.0</p>
    </div>
  );
}

/* ── Chart sub-components ── */

function ChartContent({ data }: { data: { name: string; 收入: number; 支出: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-500 text-center py-8">暂无数据</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v: number) => `¥${v}`} />
        <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
        <Bar dataKey="收入" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="支出" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308", "#14b8a6", "#6366f1", "#ef4444", "#22c55e"];

function PieContent({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-500 text-center py-8">暂无支出数据</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function NetWorthChart({ data }: { data: { name: string; 净资产: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-500 text-center py-8">暂无数据</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`} />
        <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
        <Line type="monotone" dataKey="净资产" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
