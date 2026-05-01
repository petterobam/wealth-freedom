import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/budgets
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate spent for each budget (current month)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const budgetWithSpent = await Promise.all(
    budgets.map(async (b) => {
      let spent = 0
      if (b.category) {
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            category: b.category,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        spent = result._sum.amount || 0
      } else {
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        spent = result._sum.amount || 0
      }
      return {
        ...b,
        spent,
        remaining: b.amount - spent,
        percentage: b.amount > 0 ? Math.round(spent / b.amount * 100) : 0,
      }
    })
  )

  return NextResponse.json({ budgets: budgetWithSpent })
}

// POST /api/budgets
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, name, category, amount, period, startDate, icon, color } = body

  if (!userId || !name || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const budget = await prisma.budget.create({
    data: {
      userId,
      name,
      category,
      amount: parseFloat(amount),
      period: period || 'monthly',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      icon,
      color,
    },
  })

  return NextResponse.json({ budget })
}

// DELETE /api/budgets
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.budget.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
