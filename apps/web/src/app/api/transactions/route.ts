import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/transactions - list transactions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = { userId }
  if (type) where.type = type
  if (category) where.category = category
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit,
    include: { account: { select: { name: true, icon: true } } },
  })

  return NextResponse.json({ transactions })
}

// POST /api/transactions - create transaction
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, accountId, type, category, amount, date, note, description } = body

  if (!userId || !accountId || !type || !category || !amount || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      accountId,
      type,
      category,
      amount: parseFloat(amount),
      date: new Date(date),
      note,
      description,
    },
  })

  // Update account balance
  const delta = type === 'income' ? parseFloat(amount) : -parseFloat(amount)
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: { increment: delta } },
  })

  return NextResponse.json({ transaction })
}
