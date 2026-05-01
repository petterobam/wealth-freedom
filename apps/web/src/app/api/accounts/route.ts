import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/accounts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const totalBalance = accounts.filter(a => a.includeInNetWorth).reduce((s, a) => s + a.balance, 0)

  return NextResponse.json({ accounts, totalBalance })
}

// POST /api/accounts
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, name, type, icon, color, balance, currency, institution, notes, isReserved, includeInNetWorth } = body

  if (!userId || !name || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const account = await prisma.account.create({
    data: {
      userId,
      name,
      type,
      icon,
      color,
      balance: parseFloat(balance) || 0,
      currency: currency || 'CNY',
      institution,
      notes,
      isReserved: isReserved || false,
      includeInNetWorth: includeInNetWorth !== false,
    },
  })

  return NextResponse.json({ account })
}

// PUT /api/accounts
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const account = await prisma.account.update({
    where: { id },
    data: {
      ...data,
      balance: data.balance !== undefined ? parseFloat(data.balance) : undefined,
    },
  })

  return NextResponse.json({ account })
}

// DELETE /api/accounts
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.transaction.deleteMany({ where: { accountId: id } })
  await prisma.account.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
