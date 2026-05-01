import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
          🚀 v1.6.0 全新发布 · 桌面端 + 网页端
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
          财富自由之路
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mb-4">
          系统化管理个人财务，从财务保障到财务安全，最终实现财务自由。
        </p>
        <p className="text-sm text-slate-400 max-w-lg mb-8">
          开源免费 · 数据本地存储 · AI 驱动的智能理财建议 · 跨平台支持
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 font-semibold transition shadow-lg shadow-blue-500/20"
          >
            免费开始
          </Link>
          <a
            href="https://github.com/petterobam/wealth-freedom"
            target="_blank"
            className="px-8 py-3 rounded-lg border border-slate-600 hover:border-slate-400 font-semibold transition"
          >
            ⭐ GitHub
          </a>
        </div>
      </section>

      {/* 数据亮点 */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "82", label: "财务健康度", suffix: "分", icon: "💪" },
            { value: "70", label: "储蓄率", suffix: "%+", icon: "💰" },
            { value: "4.09", label: "年化收益率", suffix: "%", icon: "📈" },
            { value: "58", label: "距财务安全", suffix: "月", icon: "🎯" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}<span className="text-sm text-slate-400">{s.suffix}</span></div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-3">* 基于真实用户数据，结果因人而异</p>
      </section>

      {/* 三步之路 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">财务自由三步之路</h2>
        <p className="text-center text-slate-400 mb-12">经过验证的三阶段递进法，帮助你从零开始走向财务自由</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01", title: "财务保障", icon: "🛡️", color: "from-blue-500 to-blue-700",
              desc: "拥有 6~12 个月的生活储备金，不被意外击倒", detail: "建立应急基金 · 防止财务滑坡",
              bg: "bg-blue-500/5 border-blue-500/20",
            },
            {
              step: "02", title: "财务安全", icon: "🔒", color: "from-emerald-500 to-emerald-700",
              desc: "靠投资利息覆盖日常支出，不再被迫工作", detail: "被动收入 > 日常支出 · 选择自由",
              bg: "bg-emerald-500/5 border-emerald-500/20",
            },
            {
              step: "03", title: "财务自由", icon: "✨", color: "from-amber-500 to-amber-700",
              desc: "靠利息实现梦想生活，本金永不动用", detail: "梦想生活 · 时间自由 · 代际传承",
              bg: "bg-amber-500/5 border-amber-500/20",
            },
          ].map((item) => (
            <div key={item.step} className={`${item.bg} rounded-2xl p-8 border hover:scale-[1.02] transition-transform`}>
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className={`text-sm font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}>
                第 {item.step} 步
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-slate-300 mb-2">{item.desc}</p>
              <p className="text-slate-500 text-sm">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">核心功能</h2>
        <p className="text-center text-slate-400 mb-12">覆盖个人财务管理全链路</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "智能预算管理", desc: "设定月度预算，实时追踪支出，超支预警提醒", icon: "📊" },
            { title: "投资组合追踪", desc: "记录投资品种，追踪收益率，资产配置可视化", icon: "📈" },
            { title: "AI 财务助手", desc: "基于你的财务数据，AI 提供个性化理财建议", icon: "🤖" },
            { title: "财务健康评分", desc: "五维度评估：储蓄、投资、债务、保障、成长", icon: "💪" },
            { title: "周期性交易", desc: "自动记录工资、房租等周期性收支，省心省力", icon: "🔄" },
            { title: "数据导出报告", desc: "PDF 报告一键导出，随时掌握财务全貌", icon: "📄" },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition">
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 技术栈 */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-6">技术栈</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {["Electron", "Next.js 16", "React 19", "TypeScript", "Prisma", "SQLite", "Tailwind CSS 4", "Recharts"].map((t) => (
            <span key={t} className="px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-900/30 to-emerald-900/30 rounded-2xl p-10 border border-slate-700/50">
          <h2 className="text-3xl font-bold mb-4">开始你的财富自由之旅</h2>
          <p className="text-slate-300 mb-6">免费使用，数据安全，开源透明</p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 font-semibold transition shadow-lg shadow-blue-500/20">
              立即开始
            </Link>
            <a href="https://github.com/petterobam/wealth-freedom" target="_blank" className="px-8 py-3 rounded-lg border border-slate-600 hover:border-slate-400 font-semibold transition">
              查看源码
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-slate-500 py-8 border-t border-slate-800">
        <p>© 2026 财富自由之路 · 系统化管理个人财务 · 开源项目</p>
      </footer>
    </main>
  );
}
