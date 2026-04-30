"use client";

const GOALS = [
  {
    id: 1,
    name: "财务安全",
    target: 3160000,
    current: 1100000,
    icon: "🛡️",
    deadline: "2030-11",
    color: "from-blue-500 to-emerald-500",
  },
  {
    id: 2,
    name: "6个月储备金",
    target: 180000,
    current: 135000,
    icon: "🏦",
    deadline: "2026-06",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    name: "产品月收入 ¥2,000",
    target: 2000,
    current: 0,
    icon: "💻",
    deadline: "2026-08",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 4,
    name: "1000+ 用户",
    target: 1000,
    current: 12,
    icon: "👥",
    deadline: "2027-04",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: 5,
    name: "财务自由",
    target: 8000000,
    current: 1100000,
    icon: "🏝️",
    deadline: "2031-04",
    color: "from-emerald-400 to-teal-300",
  },
];

function fmt(n: number) {
  if (n >= 10000) return "¥" + (n / 10000).toFixed(1) + "万";
  return "¥" + n.toLocaleString("zh-CN");
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr + "-01");
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function GoalsPage() {
  const totalTarget = GOALS.reduce((s, g) => s + g.target, 0);
  const totalCurrent = GOALS.reduce((s, g) => s + g.current, 0);
  const overallPct = Math.round((totalCurrent / totalTarget) * 100);

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-xl font-bold mb-6">🎯 目标追踪</h2>

      {/* 总体进度 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">总体进度</h3>
          <span className="text-2xl font-bold text-blue-400">{overallPct}%</span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="text-sm text-slate-400 mt-2">
          已完成 {fmt(totalCurrent)} / 目标 {fmt(totalTarget)}
        </p>
      </div>

      {/* 单个目标卡片 */}
      <div className="grid md:grid-cols-2 gap-4">
        {GOALS.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const days = daysUntil(goal.deadline);
          const isOverdue = days < 0;
          const isUrgent = days >= 0 && days < 90;

          return (
            <div
              key={goal.id}
              className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <h4 className="font-semibold">{goal.name}</h4>
                </div>
                <span className="text-lg font-bold text-white">{pct}%</span>
              </div>

              {/* 进度条 */}
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full bg-gradient-to-r ${goal.color} rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* 数据 */}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {fmt(goal.current)} <span className="text-slate-600">/</span> {fmt(goal.target)}
                </span>
                <span className={`font-medium ${
                  isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-slate-400"
                }`}>
                  {isOverdue
                    ? `已过期 ${Math.abs(days)} 天`
                    : `剩余 ${days} 天`}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                截止：{goal.deadline}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-slate-600 text-xs mt-8">
        数据存储在本地 · 从桌面端导入 · v1.5.0-preview
      </p>
    </div>
  );
}
