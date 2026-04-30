"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getStats, getTransactions, getGoals } from "@/lib/store";
import type { DashboardStats, Transaction, Goal } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStats(getStats());
    setRecentTx(getTransactions().slice(0, 5));
    setGoals(getGoals());
    setMounted(true);
  }, []);

  if (!mounted || !stats) return <div className="p-6 text-slate-500">加载中...</div>;

  const fmt = (n: number) => "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2 });
  const safetyGoal = goals.find((g) => g.name === "财务安全");
  const safetyPct = safetyGoal ? Math.round((safetyGoal.current / safetyGoal.target) * 100) : 34.8;

  return (
    <div className="p-6 max-w-6xl">
      <h2 className="text-xl font-bold mb-6">📊 财务看板</h2>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "总资产", value: fmt(stats.totalAssets), color: "text-blue-400" },
          { label: "月收入", value: fmt(stats.monthlyIncome), color: "text-emerald-400" },
          { label: "月支出", value: fmt(stats.monthlyExpense), color: "text-amber-400" },
          { label: "储蓄率", value: stats.savingsRate + "%", color: "text-purple-400" },
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
          {safetyGoal ? `¥${(safetyGoal.current / 10000).toFixed(0)}万 / ¥${(safetyGoal.target / 10000).toFixed(0)}万 · 截止 ${safetyGoal.deadline}` : "加载中..."}
        </p>
      </div>

      {/* 最近交易 */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">📝 最近交易</h3>
          <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:underline">查看全部 →</Link>
        </div>
        <div className="space-y-2">
          {recentTx.map((t) => (
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
          {recentTx.length === 0 && <p className="text-sm text-slate-500 text-center py-4">暂无交易记录</p>}
        </div>
      </div>

      <p className="text-center text-slate-600 text-xs mt-12">数据存储在浏览器本地 · v1.5.0</p>
    </div>
  );
}
