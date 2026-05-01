import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_USER_ID = "user_demo_001";

// POST /api/sync/push — push local changes (merge mode)
// Body: { data: FinanceData, strategy: "merge" | "overwrite" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, strategy = "merge" } = body;
    if (!data) return NextResponse.json({ error: "缺少数据" }, { status: 400 });

    const { transactions = [], accounts = [], budgets = [], goals = [], investments = [] } = data;

    if (strategy === "overwrite") {
      // Full overwrite: delete all then insert
      await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { userId: DEMO_USER_ID } }),
        prisma.investment.deleteMany({ where: { userId: DEMO_USER_ID } }),
        prisma.goal.deleteMany({ where: { userId: DEMO_USER_ID } }),
        prisma.budget.deleteMany({ where: { userId: DEMO_USER_ID } }),
        prisma.account.deleteMany({ where: { userId: DEMO_USER_ID } }),
      ]);

      const results = await insertAll(DEMO_USER_ID, { transactions, accounts, budgets, goals, investments });
      return NextResponse.json({ ok: true, strategy: "overwrite", ...results });
    }

    // Merge mode: upsert by ID match or append new
    const results = { transactions: 0, accounts: 0, budgets: 0, goals: 0, investments: 0 };

    // Accounts: upsert by name+type (desktop may not have cuid ids)
    for (const a of accounts) {
      const existing = await prisma.account.findFirst({
        where: { userId: DEMO_USER_ID, name: a.name, type: a.type || "other" },
      });
      if (existing) {
        await prisma.account.update({ where: { id: existing.id }, data: { balance: Number(a.balance) || existing.balance } });
        results.accounts++;
      } else {
        await prisma.account.create({ data: mapAccount(DEMO_USER_ID, a) });
        results.accounts++;
      }
    }

    // Transactions: upsert by date+type+category+amount (dedup)
    for (const t of transactions) {
      const date = t.date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      const existing = await prisma.transaction.findFirst({
        where: { userId: DEMO_USER_ID, date, type: t.type || "expense", category: t.category || "其他", amount: Number(t.amount) || 0 },
      });
      if (!existing) {
        await prisma.transaction.create({ data: mapTransaction(DEMO_USER_ID, t) });
        results.transactions++;
      }
    }

    // Budgets: upsert by category
    for (const b of budgets) {
      const existing = await prisma.budget.findFirst({
        where: { userId: DEMO_USER_ID, category: b.category },
      });
      if (existing) {
        await prisma.budget.update({ where: { id: existing.id }, data: { limit: Number(b.limit) || existing.limit } });
        results.budgets++;
      } else {
        await prisma.budget.create({ data: mapBudget(DEMO_USER_ID, b) });
        results.budgets++;
      }
    }

    // Goals: upsert by name
    for (const g of goals) {
      const existing = await prisma.goal.findFirst({
        where: { userId: DEMO_USER_ID, name: g.name },
      });
      if (existing) {
        await prisma.goal.update({
          where: { id: existing.id },
          data: { target: Number(g.target_amount || g.target) || existing.target, current: Number(g.current_amount || g.current) || existing.current },
        });
        results.goals++;
      } else {
        await prisma.goal.create({ data: mapGoal(DEMO_USER_ID, g) });
        results.goals++;
      }
    }

    // Investments: upsert by name+type
    for (const i of investments) {
      const existing = await prisma.investment.findFirst({
        where: { userId: DEMO_USER_ID, name: i.name, type: i.type || "fund" },
      });
      if (existing) {
        await prisma.investment.update({
          where: { id: existing.id },
          data: { amount: Number(i.amount) || existing.amount, currentValue: Number(i.currentValue || i.current_value) || existing.currentValue },
        });
        results.investments++;
      } else {
        await prisma.investment.create({ data: mapInvestment(DEMO_USER_ID, i) });
        results.investments++;
      }
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0);
    return NextResponse.json({ ok: true, strategy: "merge", merged: results, total });
  } catch (error) {
    console.error("Sync push error:", error);
    return NextResponse.json({ error: "同步失败" }, { status: 500 });
  }
}

// GET /api/sync/pull — export all data for sync
export async function GET() {
  try {
    const [transactions, accounts, budgets, goals, investments] = await Promise.all([
      prisma.transaction.findMany({ where: { userId: DEMO_USER_ID }, orderBy: { date: "desc" } }),
      prisma.account.findMany({ where: { userId: DEMO_USER_ID }, orderBy: { createdAt: "desc" } }),
      prisma.budget.findMany({ where: { userId: DEMO_USER_ID } }),
      prisma.goal.findMany({ where: { userId: DEMO_USER_ID } }),
      prisma.investment.findMany({ where: { userId: DEMO_USER_ID } }),
    ]);

    return NextResponse.json({
      transactions: transactions.map(({ userId, ...t }) => t),
      accounts: accounts.map(({ userId, ...a }) => a),
      budgets: budgets.map(({ userId, ...b }) => b),
      goals: goals.map(({ userId, ...g }) => g),
      investments: investments.map(({ userId, ...i }) => i),
      exportedAt: new Date().toISOString(),
      version: 2,
    });
  } catch (error) {
    console.error("Sync pull error:", error);
    return NextResponse.json({ error: "拉取失败" }, { status: 500 });
  }
}

// Helper mappers
function mapAccount(userId: string, a: any) {
  return { userId, name: a.name || "未命名账户", type: a.type || "other", balance: Number(a.balance) || 0, icon: a.icon || "💳", color: a.color || "#3b82f6" };
}
function mapTransaction(userId: string, t: any) {
  return { userId, date: t.date?.slice(0, 10) || new Date().toISOString().slice(0, 10), type: t.type === "income" ? "income" : "expense", category: t.category || "其他", amount: Number(t.amount) || 0, note: t.note || null };
}
function mapBudget(userId: string, b: any) {
  return { userId, category: b.category || "其他", limit: Number(b.limit) || 0, period: b.period || "monthly", icon: b.icon || "🎯", color: b.color || "#3b82f6" };
}
function mapGoal(userId: string, g: any) {
  return { userId, name: g.name || "未命名目标", target: Number(g.target_amount || g.target) || 0, current: Number(g.current_amount || g.current) || 0, icon: g.icon || "🏆", deadline: g.deadline || null, color: g.color || "from-blue-500 to-emerald-500" };
}
function mapInvestment(userId: string, i: any) {
  return { userId, name: i.name || "未命名投资", type: i.type || "fund", amount: Number(i.amount) || 0, currentValue: Number(i.currentValue || i.current_value) || 0, buyDate: i.buyDate?.slice(0, 10) || new Date().toISOString().slice(0, 10), note: i.note || null };
}

async function insertAll(userId: string, data: { transactions: any[]; accounts: any[]; budgets: any[]; goals: any[]; investments: any[] }) {
  let count = 0;
  if (data.accounts.length) { await prisma.account.createMany({ data: data.accounts.map((a) => mapAccount(userId, a)) }); count += data.accounts.length; }
  if (data.transactions.length) { await prisma.transaction.createMany({ data: data.transactions.map((t) => mapTransaction(userId, t)) }); count += data.transactions.length; }
  if (data.budgets.length) { await prisma.budget.createMany({ data: data.budgets.map((b) => mapBudget(userId, b)) }); count += data.budgets.length; }
  if (data.goals.length) { await prisma.goal.createMany({ data: data.goals.map((g) => mapGoal(userId, g)) }); count += data.goals.length; }
  if (data.investments.length) { await prisma.investment.createMany({ data: data.investments.map((i) => mapInvestment(userId, i)) }); count += data.investments.length; }
  return { count };
}
