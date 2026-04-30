"use client";

import Link from "next/link";

export default function DashboardPage() {
  // TODO: 从 localStorage / API 读取真实数据
  const stats = {
    totalAssets: 285000,
    monthlyIncome: 41700,
    monthlyExpense: 12469,
    savingsRate: 70.1,
    investmentReturn: 4.09,
  };

  const formatMoney = (n: number) =>
    "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* 顶部导航 */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-lg font-bold">📊 财务看板</h1>
        <div className="flex gap-4 items-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            首页
          </Link>
          <button className="text-sm text-slate-400 hover:text-white">
            退出
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
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
            { title: "预算管理", icon: "📊", desc: "设定月度预算，追踪支出", href: "#" },
            { title: "投资追踪", icon: "📈", desc: "投资组合与收益率", href: "#" },
            { title: "AI 助手", icon: "🤖", desc: "个性化理财建议", href: "#" },
          ].map((mod) => (
            <a
              key={mod.title}
              href={mod.href}
              className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition block"
            >
              <div className="text-2xl mb-2">{mod.icon}</div>
              <h3 className="font-bold mb-1">{mod.title}</h3>
              <p className="text-sm text-slate-400">{mod.desc}</p>
            </a>
          ))}
        </div>

        {/* 财务安全进度 */}
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="font-bold mb-4">🎯 财务安全进度</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                style={{ width: "35%" }}
              />
            </div>
            <span className="text-emerald-400 font-semibold">35%</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            预计 2030年11月 达成财务安全（58个月）
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-12">
          数据存储在本地 · 数据导入自桌面端 · v1.5.0-preview
        </p>
      </div>
    </div>
  );
}
