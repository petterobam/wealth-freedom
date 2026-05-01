"use client";

import { useDashboard, useTransactions, useGoals } from "@/lib/hooks";
import Link from "next/link";

export default function HealthPage() {
  const { data: dashboard, loading: dashLoading } = useDashboard();
  const { data: transactions } = useTransactions();
  const { data: goals } = useGoals();

  if (dashLoading) return <div className="p-6 text-slate-500">加载中...</div>;
  if (!dashboard) return null;

  const monthlyIncome = dashboard.monthlyIncome || 1;
  const monthlyExpense = dashboard.monthlyExpense || 0;
  const savingsRate = dashboard.savingsRate || 0;
  const netWorth = dashboard.netWorth || 0;

  // 5-dimension health score
  const dimensions = [
    {
      name: "储蓄能力",
      icon: "💰",
      score: Math.min(100, Math.round(savingsRate * 1.3)),
      desc: `储蓄率 ${savingsRate}%`,
      color: "from-emerald-400 to-emerald-600",
      tip: savingsRate >= 50 ? "优秀！保持高储蓄率" : savingsRate >= 30 ? "良好，可进一步优化" : "建议提升至30%以上",
    },
    {
      name: "投资收益",
      icon: "📈",
      score: Math.min(100, Math.round((dashboard.totalAssets ? (netWorth * 0.04) / monthlyIncome * 100 : 0) * 0.5 + 40)),
      desc: `总资产 ¥${(dashboard.totalAssets / 10000).toFixed(1)}万`,
      color: "from-blue-400 to-blue-600",
      tip: "持续投资，利用复利增长",
    },
    {
      name: "债务管理",
      icon: "🏦",
      score: 95,
      desc: "债务比率低",
      color: "from-violet-400 to-violet-600",
      tip: "保持低负债，避免高息消费贷",
    },
    {
      name: "收入稳定",
      icon: "💼",
      score: 65,
      desc: "依赖单一来源",
      color: "from-amber-400 to-amber-600",
      tip: "拓展副业或被动收入渠道",
    },
    {
      name: "成长潜力",
      icon: "🚀",
      score: 70,
      desc: "产品+内容双引擎",
      color: "from-pink-400 to-pink-600",
      tip: "加速文章发布和产品迭代",
    },
  ];

  const totalScore = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);

  // 财务自由进度
  const safetyGoal = goals?.find((g) => g.name === "财务安全");
  const freedomGoal = goals?.find((g) => g.name === "财务自由");
  const safetyPct = safetyGoal ? Math.round((safetyGoal.current / safetyGoal.target) * 100) : 0;
  const freedomPct = freedomGoal ? Math.round((freedomGoal.current / freedomGoal.target) * 100) : 0;

  // 里程碑
  const monthsToSafety = savingsRate > 0 ? Math.ceil((3160000 - netWorth) / (monthlyIncome - monthlyExpense)) : 999;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">💓 财务健康度</h2>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">← 返回看板</Link>
      </div>

      {/* 总分 */}
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 mb-6 text-center">
        <div className="relative inline-block mb-4">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="none" />
            <circle cx="80" cy="80" r="70" stroke={totalScore >= 80 ? "#34d399" : totalScore >= 60 ? "#fbbf24" : "#f87171"} strokeWidth="12" fill="none" strokeDasharray={`${totalScore * 4.4} 440`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold">{totalScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>
        <p className="text-lg font-semibold">
          {totalScore >= 85 ? "🎉 优秀！财务状况非常健康" : totalScore >= 70 ? "👍 良好，持续优化中" : "⚡ 需要重点关注"}
        </p>
        <p className="text-sm text-slate-400 mt-1">综合评分基于5个维度加权计算</p>
      </div>

      {/* 5维度 */}
      <div className="grid gap-3 mb-6">
        {dimensions.map((dim) => (
          <div key={dim.name} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{dim.icon}</span>
                <span className="font-semibold">{dim.name}</span>
                <span className="text-xs text-slate-500">{dim.desc}</span>
              </div>
              <span className={`text-lg font-bold ${dim.score >= 80 ? "text-emerald-400" : dim.score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                {dim.score}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div className={`h-full bg-gradient-to-r ${dim.color} rounded-full transition-all`} style={{ width: `${dim.score}%` }} />
            </div>
            <p className="text-xs text-slate-500">{dim.tip}</p>
          </div>
        ))}
      </div>

      {/* 财务自由进度 */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 mb-6">
        <h3 className="font-bold mb-4">🛡️ 财务自由三阶段</h3>
        {[
          { label: "财务保障", target: "6-12月生活费", pct: 100, status: "✅ 已达成", color: "bg-emerald-500" },
          { label: "财务安全", target: `¥316万 · 预计${monthsToSafety < 999 ? `${monthsToSafety}个月` : "计算中"}`, pct: safetyPct, status: `${safetyPct}%`, color: "bg-blue-500" },
          { label: "财务自由", target: "¥800万+", pct: freedomPct, status: `${freedomPct}%`, color: "bg-purple-500" },
        ].map((stage) => (
          <div key={stage.label} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{stage.label}</span>
              <span className="text-xs text-slate-400">{stage.status}</span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${stage.color} rounded-full transition-all`} style={{ width: `${Math.min(100, stage.pct)}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">{stage.target}</p>
          </div>
        ))}
      </div>

      {/* 建议 */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="font-bold mb-3">💡 改善建议</h3>
        <div className="space-y-2">
          {dimensions
            .filter((d) => d.score < 75)
            .sort((a, b) => a.score - b.score)
            .map((dim) => (
              <div key={dim.name} className="flex items-start gap-2 text-sm">
                <span>{dim.icon}</span>
                <div>
                  <span className="font-semibold text-amber-400">{dim.name}（{dim.score}分）</span>
                  <span className="text-slate-400 ml-2">{dim.tip}</span>
                </div>
              </div>
            ))}
          {dimensions.every((d) => d.score >= 75) && (
            <p className="text-emerald-400 text-sm">🎉 所有维度均达到良好水平！继续保持！</p>
          )}
        </div>
      </div>
    </div>
  );
}
