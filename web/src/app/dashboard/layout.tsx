"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "看板", icon: "📊" },
  { href: "/dashboard/transactions", label: "交易", icon: "💰" },
  { href: "/dashboard/goals", label: "目标", icon: "🎯" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* 侧边栏 */}
      <aside className="w-16 md:w-48 border-r border-slate-800 flex flex-col py-4 shrink-0">
        <div className="px-4 mb-6 hidden md:block">
          <h1 className="text-sm font-bold text-slate-400">财富自由之路</h1>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition"
          >
            <span>🏠</span>
            <span className="hidden md:inline">首页</span>
          </Link>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
