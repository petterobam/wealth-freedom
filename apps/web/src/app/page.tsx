import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          财富自由之路
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mb-8">
          系统化管理个人财务，从财务保障到财务安全，最终实现财务自由。
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            开始使用
          </Link>
          <a
            href="https://github.com/wealth-freedom"
            target="_blank"
            className="px-8 py-3 rounded-lg border border-slate-600 hover:border-slate-400 font-semibold transition"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* 三步之路 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          财务自由三步之路
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "财务保障",
              desc: "拥有 6~12 个月的生活储备金，不被意外击倒",
              icon: "🛡️",
              color: "from-blue-500 to-blue-700",
            },
            {
              step: "02",
              title: "财务安全",
              desc: "靠投资利息覆盖日常支出，不再被迫工作",
              icon: "🔒",
              color: "from-emerald-500 to-emerald-700",
            },
            {
              step: "03",
              title: "财务自由",
              desc: "靠利息实现梦想生活，本金永不动用",
              icon: "✨",
              color: "from-amber-500 to-amber-700",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-slate-500 transition"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <div
                className={`text-sm font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}
              >
                第 {item.step} 步
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: "智能预算管理",
              desc: "设定月度预算，实时追踪支出，超支预警提醒",
              icon: "📊",
            },
            {
              title: "投资组合追踪",
              desc: "记录投资品种，追踪收益率，资产配置可视化",
              icon: "📈",
            },
            {
              title: "AI 财务助手",
              desc: "基于你的财务数据，AI 提供个性化理财建议",
              icon: "🤖",
            },
            {
              title: "财务健康评分",
              desc: "五维度评估：储蓄、投资、债务、保障、成长",
              icon: "💪",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex gap-4 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
            >
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-slate-500 py-8 border-t border-slate-800">
        <p>© 2026 财富自由之路 · 系统化管理个人财务</p>
      </footer>
    </main>
  );
}
