import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const user = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: {},
    create: {
      id: 'demo-user',
      name: '无何有',
      email: 'demo@wealthfreedom.app',
      currency: 'CNY',
      guaranteeMonths: 6,
      expectedReturnRate: 8.0,
    },
  })

  // Create accounts
  const accounts = await Promise.all([
    prisma.account.create({ data: { userId: user.id, name: '招商银行', type: 'checking', icon: '🏦', color: '#e74c3c', balance: 45000, institution: '招商银行' } }),
    prisma.account.create({ data: { userId: user.id, name: '余额宝', type: 'savings', icon: '💰', color: '#f39c12', balance: 120000, institution: '支付宝' } }),
    prisma.account.create({ data: { userId: user.id, name: '指数基金', type: 'investment', icon: '📈', color: '#2ecc71', balance: 280000, institution: '天天基金' } }),
    prisma.account.create({ data: { userId: user.id, name: '公积金', type: 'other', icon: '🏠', color: '#9b59b6', balance: 86000, institution: '住房公积金' } }),
    prisma.account.create({ data: { userId: user.id, name: '信用卡', type: 'credit', icon: '💳', color: '#e67e22', balance: -3200, includeInNetWorth: true, institution: '工商银行' } }),
  ])

  // Create debts
  await prisma.debt.create({
    data: { userId: user.id, name: '房贷', type: 'mortgage', totalAmount: 1200000, paidAmount: 360000, remainingAmount: 840000, monthlyPayment: 5800, interestRate: 3.85, priority: 1 },
  })

  // Create goals
  await Promise.all([
    prisma.goal.create({ data: { userId: user.id, stage: 'guarantee', targetAmount: 100000, currentAmount: 165000, status: 'achieved', notes: '6个月储备金' } }),
    prisma.goal.create({ data: { userId: user.id, stage: 'security', targetAmount: 2000000, currentAmount: 527800, status: 'in_progress', targetDate: new Date('2030-11-01'), notes: '靠利息覆盖日常支出' } }),
    prisma.goal.create({ data: { userId: user.id, stage: 'freedom', targetAmount: 5000000, currentAmount: 527800, status: 'in_progress', targetDate: new Date('2035-01-01'), notes: '靠利息实现梦想生活' } }),
  ])

  // Create sample transactions (last 6 months)
  const categories = {
    income: ['工资', '副业收入', '投资收益', '利息'],
    expense: ['餐饮', '交通', '购物', '房租', '水电', '娱乐', '医疗', '教育', '通讯'],
  }

  const now = new Date()
  const txns: any[] = []

  for (let m = 0; m < 6; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1)
    // Monthly income
    txns.push({ userId: user.id, accountId: accounts[0].id, type: 'income', category: '工资', amount: 35000 + Math.random() * 5000, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5) })
    if (Math.random() > 0.3) {
      txns.push({ userId: user.id, accountId: accounts[0].id, type: 'income', category: '副业收入', amount: 3000 + Math.random() * 4000, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15) })
    }
    if (Math.random() > 0.5) {
      txns.push({ userId: user.id, accountId: accounts[1].id, type: 'income', category: '利息', amount: 200 + Math.random() * 300, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20) })
    }
    // Monthly expenses
    const expenseItems = [
      { category: '餐饮', min: 2000, max: 3500 },
      { category: '交通', min: 300, max: 800 },
      { category: '购物', min: 500, max: 3000 },
      { category: '水电', min: 200, max: 400 },
      { category: '娱乐', min: 200, max: 1500 },
      { category: '通讯', min: 100, max: 200 },
    ]
    for (const item of expenseItems) {
      if (item.category === '购物' && Math.random() < 0.4) continue
      const day = Math.floor(Math.random() * 25) + 1
      txns.push({
        userId: user.id,
        accountId: accounts[0].id,
        type: 'expense',
        category: item.category,
        amount: item.min + Math.random() * (item.max - item.min),
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
      })
    }
  }

  for (const t of txns) {
    await prisma.transaction.create({ data: t })
  }

  // Create budgets
  await Promise.all([
    prisma.budget.create({ data: { userId: user.id, name: '餐饮预算', category: '餐饮', amount: 3000, period: 'monthly', startDate: '2026-01-01', icon: '🍜', color: '#e74c3c' } }),
    prisma.budget.create({ data: { userId: user.id, name: '交通预算', category: '交通', amount: 800, period: 'monthly', startDate: '2026-01-01', icon: '🚗', color: '#3498db' } }),
    prisma.budget.create({ data: { userId: user.id, name: '购物预算', category: '购物', amount: 2000, period: 'monthly', startDate: '2026-01-01', icon: '🛍️', color: '#2ecc71' } }),
    prisma.budget.create({ data: { userId: user.id, name: '娱乐预算', category: '娱乐', amount: 1000, period: 'monthly', startDate: '2026-01-01', icon: '🎮', color: '#9b59b6' } }),
    prisma.budget.create({ data: { userId: user.id, name: '月度总预算', amount: 10000, period: 'monthly', startDate: '2026-01-01', icon: '💰', color: '#f39c12' } }),
  ])

  // Create investment accounts with holdings
  const investAccount = await prisma.investmentAccount.create({
    data: { userId: user.id, name: '天天基金', platform: '天天基金', type: 'fund' },
  })
  const portfolio = await prisma.portfolio.create({
    data: { accountId: investAccount.id, name: '指数基金组合', description: '定投宽基指数' },
  })
  await Promise.all([
    prisma.holding.create({ data: { portfolioId: portfolio.id, symbol: '000300', name: '沪深300ETF', type: 'fund', quantity: 50000, avgCost: 3.8, currentPrice: 4.12, marketValue: 206000, profitLoss: 16000, profitLossPct: 8.42 } }),
    prisma.holding.create({ data: { portfolioId: portfolio.id, symbol: '000905', name: '中证500ETF', type: 'fund', quantity: 30000, avgCost: 5.2, currentPrice: 5.35, marketValue: 160500, profitLoss: 4500, profitLossPct: 2.88 } }),
    prisma.holding.create({ data: { portfolioId: portfolio.id, symbol: 'H股ETF', name: '恒生国企ETF', type: 'fund', quantity: 20000, avgCost: 1.15, currentPrice: 1.08, marketValue: 21600, profitLoss: -1400, profitLossPct: -6.09 } }),
  ])

  console.log(`✅ Seed complete! Created:
  - 1 user
  - ${accounts.length} accounts
  - ${txns.length} transactions
  - 3 goals
  - 1 debt
  - 5 budgets
  - 1 investment account with 3 holdings`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
