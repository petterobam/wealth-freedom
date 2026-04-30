"use client";

import Link from "next/link";

export default function DashboardPage() {
  const stats = {
    totalAssets: 1100000,
    monthlyIncome: 41700,
    monthlyExpense: 12469,
    savingsRate: 70.1,
    investmentReturn: 4.09,
  };

  const formatMoney = (n: number) =>
    "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2 });

  return (
    <div className="p-6 max-w-6xl">
      <h2 className="text-xl font-bold mb-6">📊 财务看板</h2>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "总资产", value: formatMoney(stats.totalAssets), color: "text-blue-400" },
          { label: "月收入", value: formatMoney(stats.monthlyIncome), color: "text-emerald-400" },
          { label: "月支出", value: formatMoney(stats.monthlyExpense), color: "text-amber-400" },
          { label: "储蓄率", value: stats.savingsRate + "%", color: "text-purple-400" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
          >
            <div className="text-sm text-slate-400 mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
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
          <Link
            key={mod.title}
            href={mod.href}
            className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition block"
          >
            <div className="text-2xl mb-2">{mod.icon}</div>
            <h3 className="font-bold mb-1">{mod.title}</h3>
            <p className="text-sm text-slate-400">{mod.desc}</p>
          </Link>
        ))}
      </div>

      {/* 财务安全进度 */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="font-bold mb-4">🛡️ 财务安全进度</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
              style={{ width: "34.8%" }}
            />
          </div>
          <span className="text-emerald-400 font-semibold">34.8%</span>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          ¥110万 / ¥316万 · 预计 2030年11月 达成财务安全
        </p>
      </div>

      <p className="text-center text-slate-600 text-xs mt-12">
        数据存储在本地 · 数据导入自桌面端 · v1.5.0-preview
      </p>
    </div>
  );
}
