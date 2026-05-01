import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Hardcoded demo user id (matches seed)
const DEMO_USER_ID = "user_demo_001";

// GET /api/settings/export — export all data as JSON
export async function GET() {
  try {
    const [transactions, accounts, budgets, goals, investments] = await Promise.all([
      prisma.transaction.findMany({ where: { userId: DEMO_USER_ID }, orderBy: { date: "desc" } }),
      prisma.account.findMany({ where: { userId: DEMO_USER_ID }, orderBy: { createdAt: "desc" } }),
      prisma.budget.findMany({ where: { userId: DEMO_USER_ID }, orderBy: { createdAt: "desc" } }),
      prisma.goal.findMany({ where: { userId: DEMO_USER_ID }, orderBy: { createdAt: "desc" } }),
      prisma.investment.findMany({ where: { userId: DEMO_USER_ID }, orderBy: { createdAt: "desc" } }),
    ]);

    const totalAssets = accounts.reduce((s, a) => s + a.balance, 0);
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthlyIncome = transactions
      .filter((t) => t.type === "income" && t.date >= monthStart)
      .reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = transactions
      .filter((t) => t.type === "expense" && t.date >= monthStart)
      .reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      transactions,
      accounts,
      budgets,
      goals,
      investments,
      stats: {
        totalAssets,
        monthlyIncome,
        monthlyExpense,
        savingsRate: monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 1000) / 10 : 0,
        netWorth: totalAssets,
      },
      version: 2,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}

// POST /api/settings/import — bulk import data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactions = [], accounts = [], budgets = [], goals = [], investments = [] } = body;

    // Delete existing data for demo user (in order of foreign key constraints)
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.investment.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.goal.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.budget.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.account.deleteMany({ where: { userId: DEMO_USER_ID } }),
    ]);

    // Insert new data
    if (accounts.length > 0) {
      await prisma.account.createMany({
        data: accounts.map((a: any) => ({
          userId: DEMO_USER_ID,
          name: a.name || "未命名账户",
          type: a.type || "other",
          balance: Number(a.balance) || 0,
          icon: a.icon || "💳",
          color: a.color || "#3b82f6",
        })),
      });
    }

    if (transactions.length > 0) {
      await prisma.transaction.createMany({
        data: transactions.map((t: any) => ({
          userId: DEMO_USER_ID,
          date: t.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          type: t.type === "income" ? "income" : "expense",
          category: t.category || "其他",
          amount: Number(t.amount) || 0,
          note: t.note || t.description || null,
        })),
      });
    }

    if (budgets.length > 0) {
      await prisma.budget.createMany({
        data: budgets.map((b: any) => ({
          userId: DEMO_USER_ID,
          category: b.category || "其他",
          limit: Number(b.limit) || 0,
          period: b.period || "monthly",
          icon: b.icon || "🎯",
          color: b.color || "#3b82f6",
        })),
      });
    }

    if (goals.length > 0) {
      await prisma.goal.createMany({
        data: goals.map((g: any) => ({
          userId: DEMO_USER_ID,
          name: g.name || "未命名目标",
          target: Number(g.target_amount || g.target) || 0,
          current: Number(g.current_amount || g.current) || 0,
          icon: g.icon || "🏆",
          deadline: g.deadline || null,
          color: g.color || "from-blue-500 to-emerald-500",
        })),
      });
    }

    if (investments.length > 0) {
      await prisma.investment.createMany({
        data: investments.map((i: any) => ({
          userId: DEMO_USER_ID,
          name: i.name || "未命名投资",
          type: i.type || "fund",
          amount: Number(i.amount) || 0,
          currentValue: Number(i.currentValue || i.current_value) || 0,
          buyDate: i.buyDate?.slice(0, 10) || i.buy_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          note: i.note || null,
        })),
      });
    }

    const count = transactions.length + accounts.length + budgets.length + goals.length + investments.length;
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "导入失败" }, { status: 500 });
  }
}

// DELETE /api/settings — reset to demo data
export async function DELETE() {
  try {
    // Delete all data for demo user
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.investment.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.goal.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.budget.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.account.deleteMany({ where: { userId: DEMO_USER_ID } }),
    ]);

    // Re-create demo data (inline to avoid circular import)
    const txData = [
      { userId: DEMO_USER_ID, date: "2026-04-28", type: "expense", category: "餐饮", amount: 45, note: "午餐" },
      { userId: DEMO_USER_ID, date: "2026-04-28", type: "expense", category: "交通", amount: 12, note: "地铁" },
      { userId: DEMO_USER_ID, date: "2026-04-27", type: "income", category: "工资", amount: 30000, note: "4月工资" },
      { userId: DEMO_USER_ID, date: "2026-04-27", type: "expense", category: "房租", amount: 4500, note: "月租" },
      { userId: DEMO_USER_ID, date: "2026-04-26", type: "expense", category: "购物", amount: 299, note: "书籍" },
      { userId: DEMO_USER_ID, date: "2026-04-25", type: "income", category: "投资", amount: 3200, note: "基金分红" },
      { userId: DEMO_USER_ID, date: "2026-04-25", type: "expense", category: "餐饮", amount: 68, note: "晚餐" },
      { userId: DEMO_USER_ID, date: "2026-04-24", type: "expense", category: "通讯", amount: 128, note: "手机话费" },
      { userId: DEMO_USER_ID, date: "2026-04-23", type: "expense", category: "医疗", amount: 350, note: "体检" },
      { userId: DEMO_USER_ID, date: "2026-04-22", type: "expense", category: "娱乐", amount: 88, note: "电影" },
    ];

    await prisma.$transaction([
      ...[
        { name: "招商银行", type: "checking", balance: 45000, icon: "💳", color: "#e74c3c" },
        { name: "支付宝余额", type: "savings", balance: 25000, icon: "🏦", color: "#3b82f6" },
        { name: "基金投资", type: "investment", balance: 680000, icon: "📈", color: "#10b981" },
        { name: "股票账户", type: "investment", balance: 320000, icon: "📈", color: "#f59e0b" },
        { name: "现金", type: "cash", balance: 30000, icon: "💵", color: "#8b5cf6" },
      ].map((a) => prisma.account.create({ data: { userId: DEMO_USER_ID, ...a } })),
      ...txData.map((t) => prisma.transaction.create({ data: t })),
      ...[
        { category: "餐饮", limit: 2000, icon: "🍜", color: "#e74c3c" },
        { category: "交通", limit: 500, icon: "🚇", color: "#3b82f6" },
        { category: "购物", limit: 1500, icon: "🛍️", color: "#f59e0b" },
        { category: "娱乐", limit: 800, icon: "🎮", color: "#8b5cf6" },
        { category: "房租", limit: 4500, icon: "🏠", color: "#10b981" },
      ].map((b) => prisma.budget.create({ data: { userId: DEMO_USER_ID, ...b } })),
      ...[
        { name: "财务安全", target: 3160000, current: 1100000, icon: "🛡️", deadline: "2030-11", color: "from-blue-500 to-emerald-500" },
        { name: "6个月储备金", target: 180000, current: 135000, icon: "🏦", deadline: "2026-06", color: "from-purple-500 to-pink-500" },
        { name: "产品月收入 ¥2,000", target: 2000, current: 0, icon: "💻", deadline: "2026-08", color: "from-amber-500 to-orange-500" },
        { name: "财务自由", target: 8000000, current: 1100000, icon: "🏝️", deadline: "2031-04", color: "from-emerald-400 to-teal-300" },
      ].map((g) => prisma.goal.create({ data: { userId: DEMO_USER_ID, ...g } })),
      ...[
        { name: "沪深300指数基金", type: "fund", amount: 380000, currentValue: 398000, buyDate: "2025-06-15", note: "定投核心仓位" },
        { name: "中证500指数", type: "fund", amount: 150000, currentValue: 162000, buyDate: "2025-09-01", note: "卫星仓位" },
        { name: "国债逆回购", type: "bond", amount: 150000, currentValue: 153200, buyDate: "2025-12-01", note: "现金管理" },
        { name: "腾讯控股", type: "stock", amount: 120000, currentValue: 136800, buyDate: "2025-08-20", note: "个股持仓" },
        { name: "3年期定期", type: "deposit", amount: 100000, currentValue: 102500, buyDate: "2025-03-01", note: "安全垫" },
      ].map((i) => prisma.investment.create({ data: { userId: DEMO_USER_ID, ...i } })),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
