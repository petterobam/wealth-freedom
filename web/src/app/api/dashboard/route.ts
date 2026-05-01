import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";


export async function GET() {
  const session = (await auth());
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [accounts, monthTx] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: monthStart } } }),
  ]);

  const totalAssets = accounts.reduce((s, a) => s + a.balance, 0);
  const monthlyIncome = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;

  // 支出分类统计
  const expenseByCategory: Record<string, number> = {};
  monthTx.filter(t => t.type === "expense").forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });

  // 最近交易
  const recentTx = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 10,
  });

  return NextResponse.json({
    totalAssets,
    monthlyIncome,
    monthlyExpense,
    savingsRate: Math.round(savingsRate * 10) / 10,
    netWorth: totalAssets,
    expenseByCategory,
    recentTransactions: recentTx,
    accountCount: accounts.length,
  });
}
