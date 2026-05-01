import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Use first user (demo)
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }

    const [accounts, transactions, goals, debts, budgets, investments] = await Promise.all([
      prisma.account.findMany({ where: { userId: user.id } }),
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.goal.findMany({ where: { userId: user.id } }),
      prisma.debt.findMany({ where: { userId: user.id } }),
      prisma.budget.findMany({ where: { userId: user.id, isActive: true } }),
      prisma.investmentAccount.findMany({
        where: { userId: user.id, isActive: true },
        include: {
          portfolios: {
            include: { holdings: true },
          },
        },
      }),
    ])

    // Calculate summary
    const totalAssets = accounts.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.balance, 0)
    const totalDebt = debts.filter(d => !d.isPaidOff).reduce((s, d) => s + d.remainingAmount, 0)
    const netWorth = totalAssets - totalDebt

    // Monthly income/expense (current month)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const monthTxns = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd)
    const monthlyIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthlyExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // Investment total
    const investTotal = investments.reduce((s, ia) => {
      return s + ia.portfolios.reduce((ps, p) => ps + p.holdings.reduce((hs, h) => hs + h.marketValue, 0), 0)
    }, 0)

    // Category breakdown for expenses
    const expenseByCategory: Record<string, number> = {}
    monthTxns.filter(t => t.type === 'expense').forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
    })

    // Last 6 months trend
    const months: { month: string; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ms = new Date(d.getFullYear(), d.getMonth(), 1)
      const me = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const mtx = transactions.filter(t => t.date >= ms && t.date <= me)
      months.push({
        month: `${d.getMonth() + 1}月`,
        income: mtx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: mtx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name, currency: user.currency },
      summary: {
        totalAssets,
        totalDebt,
        netWorth,
        monthlyIncome,
        monthlyExpense,
        monthlyBalance: monthlyIncome - monthlyExpense,
        investTotal,
        savingsRate: monthlyIncome > 0 ? Math.round((monthlyIncome - monthlyExpense) / monthlyIncome * 100) : 0,
      },
      accounts,
      transactions: transactions.slice(0, 20),
      goals,
      debts,
      budgets,
      investments,
      charts: {
        months,
        expenseByCategory: Object.entries(expenseByCategory)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
      },
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
