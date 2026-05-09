/**
 * Browser mock for window.electronAPI
 * Provides localStorage-backed implementations so the app works in a plain browser (no Electron).
 *
 * All CRUD operations persist to localStorage under the key `wf:<collection>`.
 * Computed endpoints (dashboard, reports, ratios, etc.) derive from stored data.
 */

const uid = () => crypto.randomUUID()

/* ── tiny localStorage collection helper ───────────────────────── */

function coll<T extends Record<string, any>>(name: string): {
  all: () => T[]
  get: (id: string) => T | undefined
  set: (item: T) => T
  del: (id: string) => boolean
  replace: (items: T[]) => void
} {
  const key = `wf:${name}`
  const read = (): T[] => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
  const write = (items: T[]) => localStorage.setItem(key, JSON.stringify(items))
  return {
    all: read,
    get: (id) => read().find(i => (i as any).id === id),
    set: (item) => { const items = read(); const idx = items.findIndex(i => (i as any).id === (item as any).id); if (idx >= 0) items[idx] = item; else items.push(item); write(items); return item },
    del: (id) => { const items = read(); const len = items.length; write(items.filter(i => (i as any).id !== id)); return items.length < len },
    replace: write
  }
}

/* ── seed a default user if none exists ─────────────────────────── */

const users = coll<any>('users')
if (users.all().length === 0) {
  users.set({
    id: 'user-1',
    name: '测试用户',
    currency: 'CNY',
    email: '',
    avatar: '',
    guarantee_months: 6,
    expected_return_rate: 8.0,
    settings: JSON.stringify({ language: 'zh-CN', theme: 'light', startDayOfMonth: 1, guaranteeMonths: 6, expectedReturnRate: 8.0 }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
}

const accounts   = coll<any>('accounts')
const debts      = coll<any>('debts')
const trans      = coll<any>('transactions')
const goals      = coll<any>('goals')
const dreams     = coll<any>('dreams')
const incSources = coll<any>('incomeSources')
const incRecords = coll<any>('incomeRecords')
const incGoals   = coll<any>('incomeGoals')
const incStrats  = coll<any>('incomeStrategies')
const incActions = coll<any>('incomeActions')
const incSims    = coll<any>('incomeSimulations')
const budgets    = coll<any>('budgets')
const budgetSnaps = coll<any>('budgetSnapshots')
const invAccounts = coll<any>('investmentAccounts')
const portfolios  = coll<any>('portfolios')
const holdings    = coll<any>('holdings')
const invTrans    = coll<any>('investmentTransactions')
const recurring   = coll<any>('recurringRules')

/* ── helpers ────────────────────────────────────────────────────── */

const now = () => new Date().toISOString()
const defaultUser = () => users.all()[0]

function sumField(items: any[], field: string): number {
  return items.reduce((s, i) => s + (Number(i[field]) || 0), 0)
}

/* ── the mock API ───────────────────────────────────────────────── */

export const electronAPI = {
  // ── user ─────────────────────────────────────────────────────
  getUser: async () => defaultUser() || null,
  createUser: async (data: any) => {
    const user = { id: uid(), ...data, created_at: now(), updated_at: now() }
    return users.set(user)
  },
  updateUser: async (data: any) => {
    const existing = users.get(data.id)
    if (!existing) return null
    return users.set({ ...existing, ...data, updated_at: now() })
  },

  // ── accounts ─────────────────────────────────────────────────
  getAccounts: async () => accounts.all(),
  createAccount: async (data: any) => accounts.set({ id: uid(), ...data, balance: data.balance ?? 0, created_at: now(), updated_at: now() }),
  updateAccount: async (data: any) => {
    const existing = accounts.get(data.id)
    if (!existing) return null
    return accounts.set({ ...existing, ...data, updated_at: now() })
  },
  deleteAccount: async (id: string) => accounts.del(id),

  // ── debts ────────────────────────────────────────────────────
  getDebts: async () => debts.all(),
  createDebt: async (data: any) => debts.set({ id: uid(), ...data, created_at: now(), updated_at: now() }),
  updateDebt: async (data: any) => {
    const existing = debts.get(data.id)
    if (!existing) return null
    return debts.set({ ...existing, ...data, updated_at: now() })
  },
  deleteDebt: async (id: string) => debts.del(id),

  // ── transactions ─────────────────────────────────────────────
  getTransactions: async (filters?: any) => {
    let items = trans.all()
    if (filters?.userId) items = items.filter(t => t.user_id === filters.userId)
    if (filters?.type) items = items.filter(t => t.type === filters.type)
    if (filters?.startDate) items = items.filter(t => t.date >= filters.startDate)
    if (filters?.endDate) items = items.filter(t => t.date <= filters.endDate)
    if (filters?.accountId) items = items.filter(t => t.account_id === filters.accountId)
    return items
  },
  createTransaction: async (data: any) => trans.set({ id: uid(), ...data, created_at: now(), updated_at: now() }),
  updateTransaction: async (data: any) => {
    const existing = trans.get(data.id)
    if (!existing) return null
    return trans.set({ ...existing, ...data, updated_at: now() })
  },
  deleteTransaction: async (id: string) => trans.del(id),

  // ── goals ────────────────────────────────────────────────────
  getGoals: async () => goals.all(),
  createGoal: async (data: any) => goals.set({ id: uid(), ...data, status: data.status || 'in_progress', created_at: now(), updated_at: now() }),
  updateGoal: async (data: any) => {
    const existing = goals.get(data.id)
    if (!existing) return null
    return goals.set({ ...existing, ...data, updated_at: now() })
  },
  deleteGoal: async (id: string) => goals.del(id),

  // ── dreams ───────────────────────────────────────────────────
  getDreams: async () => dreams.all(),
  createDream: async (data: any) => dreams.set({ id: uid(), ...data, is_achieved: 0, created_at: now(), updated_at: now() }),
  updateDream: async (data: any) => {
    const existing = dreams.get(data.id)
    if (!existing) return null
    return dreams.set({ ...existing, ...data, updated_at: now() })
  },
  deleteDream: async (id: string) => dreams.del(id),

  // ── calculations ─────────────────────────────────────────────
  getNetWorth: async () => {
    const accBalance = sumField(accounts.all(), 'balance')
    const debtRemaining = sumField(debts.all(), 'remaining_amount')
    return { total: accBalance - debtRemaining, assets: accBalance, liabilities: debtRemaining }
  },
  getCashFlow: async (month: string) => {
    const allT = trans.all().filter(t => t.date && t.date.startsWith(month))
    const income = sumField(allT.filter(t => t.type === 'income'), 'amount')
    const expense = sumField(allT.filter(t => t.type === 'expense'), 'amount')
    return { income, expense, balance: income - expense }
  },
  getGoalsProgress: async () => {
    return goals.all().map(g => ({
      ...g,
      percentage: g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0
    }))
  },
  getRatios: async () => {
    const accBalance = sumField(accounts.all(), 'balance')
    const debtRemaining = sumField(debts.all(), 'remaining_amount')
    const month = new Date().toISOString().slice(0, 7)
    const allT = trans.all().filter(t => t.date && t.date.startsWith(month))
    const income = sumField(allT.filter(t => t.type === 'income'), 'amount') || 1
    const expense = sumField(allT.filter(t => t.type === 'expense'), 'amount')
    return {
      savingsRate: Math.max(0, Math.round(((income - expense) / income) * 100)),
      debtRatio: accBalance > 0 ? Math.round((debtRemaining / accBalance) * 100) : 0,
      passiveIncomeCoverage: 0,
      freedomProgress: 0
    }
  },

  // ── dashboard data (used by PdfReport) ───────────────────────
  getDashboardData: async () => {
    const user = defaultUser()
    const accBalance = sumField(accounts.all(), 'balance')
    const debtRemaining = sumField(debts.all(), 'remaining_amount')
    const month = new Date().toISOString().slice(0, 7)
    const allT = trans.all().filter(t => t.date && t.date.startsWith(month))
    const income = sumField(allT.filter(t => t.type === 'income'), 'amount')
    const expense = sumField(allT.filter(t => t.type === 'expense'), 'amount')
    const guaranteeMonths = user?.guarantee_months || 6
    const monthlyExpense = expense || 1
    const securityTarget = 300000
    const freedomTarget = 750000
    // Investment data for PdfReport
    const investTotal = sumField(holdings.all(), 'market_value')
    const investCost = holdings.all().reduce((s, h) => s + ((h.avg_cost || 0) * (h.quantity || 0)), 0)
    const investProfit = investTotal - investCost
    const investReturnRate = investCost > 0 ? (investProfit / investCost) * 100 : 0
    return {
      user,
      netWorth: accBalance - debtRemaining,
      monthlyIncome: income,
      monthlyExpense: expense,
      monthlyBalance: income - expense,
      totalAssets: accBalance,
      totalDebts: debtRemaining,
      investTotal,
      investProfit,
      investReturnRate,
      guaranteeProgress: { current: accBalance, target: monthlyExpense * guaranteeMonths, percentage: Math.min(100, Math.round(accBalance / (monthlyExpense * guaranteeMonths) * 100)) },
      securityProgress: { current: accBalance - debtRemaining, target: securityTarget, percentage: Math.min(100, Math.round((accBalance - debtRemaining) / securityTarget * 100)) },
      freedomProgress: { current: accBalance - debtRemaining, target: freedomTarget, percentage: Math.min(100, Math.round((accBalance - debtRemaining) / freedomTarget * 100)) },
      goals: goals.all(),
      recentTransactions: trans.all().slice(-5),
      accounts: accounts.all()
    }
  },

  // ── income sources ───────────────────────────────────────────
  getIncomeSources: async () => incSources.all(),
  getIncomeSourceById: async (id: string) => incSources.get(id) || null,
  createIncomeSource: async (data: any) => incSources.set({ id: uid(), ...data, is_active: 1, created_at: now(), updated_at: now() }),
  updateIncomeSource: async (id: string, data: any) => {
    const existing = incSources.get(id)
    if (!existing) return null
    return incSources.set({ ...existing, ...data, updated_at: now() })
  },
  deleteIncomeSource: async (id: string) => incSources.del(id),

  // ── income records ───────────────────────────────────────────
  getIncomeRecords: async (filters?: any) => {
    let items = incRecords.all()
    if (filters?.userId) items = items.filter(r => r.user_id === filters.userId)
    return items
  },
  getIncomeRecordById: async (id: string) => incRecords.get(id) || null,
  createIncomeRecord: async (data: any) => incRecords.set({ id: uid(), ...data, created_at: now(), updated_at: now() }),
  updateIncomeRecord: async (id: string, data: any) => {
    const existing = incRecords.get(id)
    if (!existing) return null
    return incRecords.set({ ...existing, ...data, updated_at: now() })
  },
  deleteIncomeRecord: async (id: string) => incRecords.del(id),

  // ── income goals ─────────────────────────────────────────────
  getIncomeGoals: async () => incGoals.all(),
  getIncomeGoalById: async (id: string) => incGoals.get(id) || null,
  createIncomeGoal: async (data: any) => incGoals.set({ id: uid(), ...data, status: data.status || 'in_progress', created_at: now(), updated_at: now() }),
  updateIncomeGoal: async (id: string, data: any) => {
    const existing = incGoals.get(id)
    if (!existing) return null
    return incGoals.set({ ...existing, ...data, updated_at: now() })
  },
  deleteIncomeGoal: async (id: string) => incGoals.del(id),

  // ── income strategies ────────────────────────────────────────
  getIncomeStrategies: async () => incStrats.all(),
  getRecommendedIncomeStrategies: async () => incStrats.all().filter(s => s.is_recommended),
  createIncomeStrategy: async (data: any) => incStrats.set({ id: uid(), ...data, applied: 0, created_at: now(), updated_at: now() }),
  updateIncomeStrategy: async (id: string, data: any) => {
    const existing = incStrats.get(id)
    if (!existing) return null
    return incStrats.set({ ...existing, ...data, updated_at: now() })
  },
  deleteIncomeStrategy: async (id: string) => incStrats.del(id),
  applyIncomeStrategy: async (id: string) => {
    const existing = incStrats.get(id)
    if (!existing) return null
    return incStrats.set({ ...existing, applied: 1, updated_at: now() })
  },

  // ── income actions ───────────────────────────────────────────
  getIncomeActions: async (filters?: any) => {
    let items = incActions.all()
    if (filters?.userId) items = items.filter(a => a.user_id === filters.userId)
    return items
  },
  getIncomeActionById: async (id: string) => incActions.get(id) || null,
  createIncomeAction: async (data: any) => incActions.set({ id: uid(), ...data, status: data.status || 'pending', created_at: now(), updated_at: now() }),
  updateIncomeAction: async (id: string, data: any) => {
    const existing = incActions.get(id)
    if (!existing) return null
    return incActions.set({ ...existing, ...data, updated_at: now() })
  },
  deleteIncomeAction: async (id: string) => incActions.del(id),

  // ── income analysis ──────────────────────────────────────────
  getIncomeDashboard: async (params?: any) => {
    const sources = incSources.all()
    const records = incRecords.all()
    const totalMonthly = sumField(sources.filter(s => s.is_active !== 0), 'amount')
    return {
      totalMonthlyIncome: totalMonthly,
      totalAnnualIncome: totalMonthly * 12,
      activeSources: sources.filter(s => s.is_active !== 0).length,
      totalSources: sources.length,
      recentRecords: records.slice(-10),
      incomeByCategory: [] as any[],
      incomeByType: [] as any[],
      monthlyTrend: [] as any[]
    }
  },
  getIncomeAnalysis: async () => ({
    activeIncome: sumField(incSources.all().filter(s => s.type === 'active' && s.is_active !== 0), 'amount'),
    passiveIncome: sumField(incSources.all().filter(s => s.type === 'passive' && s.is_active !== 0), 'amount'),
    portfolioIncome: sumField(incSources.all().filter(s => s.type === 'portfolio' && s.is_active !== 0), 'amount'),
    diversificationScore: 0,
    growthRate: 0
  }),
  getIncomeStructure: async () => {
    const sources = incSources.all().filter(s => s.is_active !== 0)
    return sources.map(s => ({ name: s.name, amount: s.amount, type: s.type, category: s.category }))
  },

  // ── income simulations ───────────────────────────────────────
  simulateIncome: async (params: any) => [],
  getIncomeSimulations: async () => incSims.all(),
  createIncomeSimulation: async (data: any) => incSims.set({ id: uid(), ...data, created_at: now(), updated_at: now() }),
  deleteIncomeSimulation: async (id: string) => incSims.del(id),

  // ── financial freedom prediction ─────────────────────────────
  predictFinancialFreedom: async (params: any) => ({
    yearsToFreedom: null,
    targetDate: null,
    monthlyTarget: 0,
    currentProgress: 0,
    milestones: []
  }),

  // ── budgets ──────────────────────────────────────────────────
  getBudgetList: async (data: any) => {
    let items = budgets.all()
    if (data?.userId) items = items.filter(b => b.user_id === data.userId)
    return { budgets: items, total: items.length }
  },
  getBudgetById: async (data: any) => budgets.get(data.id) || null,
  createBudget: async (data: any) => budgets.set({ id: uid(), ...data, is_active: 1, created_at: now(), updated_at: now() }),
  updateBudget: async (data: any) => {
    const existing = budgets.get(data.id)
    if (!existing) return null
    return budgets.set({ ...existing, ...data, updated_at: now() })
  },
  deleteBudget: async (data: any) => budgets.del(data.id),
  getBudgetStatus: async (data: any) => {
    const items = budgets.all().filter(b => b.user_id === data.userId && b.is_active !== 0)
    const month = new Date().toISOString().slice(0, 7)
    const monthTrans = trans.all().filter(t => t.date && t.date.startsWith(month) && t.type === 'expense')
    return items.map(b => {
      const spent = sumField(monthTrans.filter(t => t.category === b.category), 'amount')
      return { budget: b, spent, remaining: Math.max(0, b.amount - spent), percentage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0 }
    })
  },
  getBudgetHistory: async (data: any) => budgetSnaps.all().filter(s => s.budget_id === data.budgetId).slice(-(data.limit || 12)),
  takeBudgetSnapshot: async (data: any) => budgetSnaps.set({ id: uid(), ...data, created_at: now() }),

  // ── investment ───────────────────────────────────────────────
  getInvestmentAccounts: async () => invAccounts.all(),
  addInvestmentAccount: async (data: any) => invAccounts.set({ id: uid(), ...data, is_active: 1, created_at: now(), updated_at: now() }),
  updateInvestmentAccount: async (data: any) => {
    const existing = invAccounts.get(data.id)
    if (!existing) return null
    return invAccounts.set({ ...existing, ...data, updated_at: now() })
  },
  deleteInvestmentAccount: async (id: string) => invAccounts.del(id),

  getPortfolios: async (accountId?: string) => {
    let items = portfolios.all()
    if (accountId) items = items.filter(p => p.account_id === accountId)
    return items
  },
  addPortfolio: async (data: any) => portfolios.set({ id: uid(), ...data, created_at: now(), updated_at: now() }),
  deletePortfolio: async (id: string) => portfolios.del(id),

  getHoldings: async (portfolioId: string) => holdings.all().filter(h => h.portfolio_id === portfolioId),
  addHolding: async (data: any) => holdings.set({ id: uid(), ...data, created_at: now(), updated_at: now() }),
  updateHoldingPrice: async (data: any) => {
    const existing = holdings.get(data.id)
    if (!existing) return null
    return holdings.set({ ...existing, current_price: data.price, updated_at: now() })
  },
  batchUpdatePrices: async (updates: any[]) => updates.map((u: any) => {
    const existing = holdings.get(u.id)
    if (existing) holdings.set({ ...existing, current_price: u.price, updated_at: now() })
    return u
  }),
  deleteHolding: async (id: string) => holdings.del(id),

  getInvestmentTransactions: async (opts: any) => {
    let items = invTrans.all()
    if (opts?.holdingId) items = items.filter(t => t.holding_id === opts.holdingId)
    return items
  },
  addInvestmentTransaction: async (data: any) => invTrans.set({ id: uid(), ...data, created_at: now() }),
  deleteInvestmentTransaction: async (id: string) => invTrans.del(id),

  getInvestmentSummary: async () => {
    const mv = sumField(holdings.all(), 'market_value')
    const cost = holdings.all().reduce((s, h) => s + ((h.avg_cost || 0) * (h.quantity || 0)), 0)
    const pl = mv - cost
    return {
      total_market_value: mv,
      total_cost: cost,
      total_profit_loss: pl,
      total_return_pct: cost > 0 ? (pl / cost) * 100 : 0,
      holding_count: holdings.all().length,
      account_count: invAccounts.all().length,
      realized_profit: 0
    }
  },
  getInvestmentAllocation: async () => {
    const allHoldings = holdings.all()
    const allAccounts = invAccounts.all()
    // by_type
    const typeSet = new Set(allHoldings.map(h => h.type))
    const by_type = Array.from(typeSet).map(type => ({
      type,
      value: sumField(allHoldings.filter(h => h.type === type), 'market_value'),
      percentage: 0
    }))
    // by_account
    const by_account = allAccounts.map(acc => {
      const accPortfolios = portfolios.all().filter(p => p.account_id === acc.id)
      const accHoldings = accPortfolios.flatMap(p => holdings.all().filter(h => h.portfolio_id === p.id))
      return {
        account_name: acc.name,
        platform: acc.platform || '',
        value: sumField(accHoldings, 'market_value')
      }
    }).filter(a => a.value > 0)
    // top_holdings
    const top_holdings = [...allHoldings]
      .sort((a, b) => (b.market_value || 0) - (a.market_value || 0))
      .slice(0, 10)
      .map(h => {
        const cost = (h.avg_cost || 0) * (h.quantity || 0)
        const pl = (h.market_value || 0) - cost
        const plPct = cost > 0 ? (pl / cost) * 100 : 0
        return {
          symbol: h.symbol,
          name: h.name,
          market_value: h.market_value || 0,
          profit_loss_pct: plPct
        }
      })
    return { by_type, by_account, top_holdings }
  },

  // ── reports ──────────────────────────────────────────────────
  report: {
    monthlySummary: async (data: any) => {
      const month = `${data.year}-${String(data.month).padStart(2, '0')}`
      const allT = trans.all().filter(t => t.date && t.date.startsWith(month))
      const income = sumField(allT.filter(t => t.type === 'income'), 'amount')
      const expense = sumField(allT.filter(t => t.type === 'expense'), 'amount')
      const net = income - expense
      const savingsRate = income > 0 ? (net / income) * 100 : 0
      const incomeByCat: Record<string, number> = {}
      const expenseByCat: Record<string, number> = {}
      allT.filter(t => t.type === 'income').forEach(t => { incomeByCat[t.category] = (incomeByCat[t.category] || 0) + Number(t.amount) })
      allT.filter(t => t.type === 'expense').forEach(t => { expenseByCat[t.category] = (expenseByCat[t.category] || 0) + Number(t.amount) })
      return {
        total_income: income,
        total_expense: expense,
        net_savings: net,
        savingsRate,
        transactionCount: allT.length,
        incomeByCategory: Object.entries(incomeByCat).map(([category, amount]) => ({ category, amount })),
        expenseByCategory: Object.entries(expenseByCat).map(([category, amount]) => ({ category, amount })),
        topExpenseCategories: Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount }))
      }
    },
    yearlySummary: async (data: any) => {
      const year = String(data.year)
      const allT = trans.all().filter(t => t.date && t.date.startsWith(year))
      const income = sumField(allT.filter(t => t.type === 'income'), 'amount')
      const expense = sumField(allT.filter(t => t.type === 'expense'), 'amount')
      const net = income - expense
      const savingsRate = income > 0 ? (net / income) * 100 : 0
      const monthlyBreakdown: any[] = []
      for (let m = 1; m <= 12; m++) {
        const mm = `${year}-${String(m).padStart(2, '0')}`
        const mT = allT.filter(t => t.date && t.date.startsWith(mm))
        const mI = sumField(mT.filter(t => t.type === 'income'), 'amount')
        const mE = sumField(mT.filter(t => t.type === 'expense'), 'amount')
        if (mI > 0 || mE > 0) monthlyBreakdown.push({ month: m, income: mI, expense: mE })
      }
      return {
        total_income: income,
        total_expense: expense,
        net_savings: net,
        savingsRate,
        transactionCount: allT.length,
        monthlyBreakdown,
        yoyChange: { income: 0, expense: 0, savings: 0 }
      }
    },
    categoryRanking: async (data: any) => {
      let items = trans.all().filter(t => t.type === 'expense')
      if (data.year) items = items.filter(t => t.date && t.date.startsWith(String(data.year)))
      if (data.month) items = items.filter(t => t.date && t.date.includes(`-${String(data.month).padStart(2, '0')}-`))
      const byCategory: Record<string, number> = {}
      items.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount) })
      return Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }))
    },
    monthlyTrend: async (data: any) => {
      const months = data.months || 12
      const trend: any[] = []
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const m = d.toISOString().slice(0, 7)
        const allT = trans.all().filter(t => t.date && t.date.startsWith(m))
        const inc = sumField(allT.filter(t => t.type === 'income'), 'amount')
        const exp = sumField(allT.filter(t => t.type === 'expense'), 'amount')
        const net = inc - exp
        const savingsRate = inc > 0 ? (net / inc) * 100 : 0
        trend.push({ month: m, income: inc, expense: exp, net, savingsRate })
      }
      return { trend }
    },
    healthScore: async (userId: string) => ({
      totalScore: 50,
      level: '一般',
      suggestions: ['在浏览器预览模式下暂无个性化建议'],
      dimensions: {
        savings: { score: 50, value: 20, label: '储蓄率' },
        debt: { score: 60, value: 30, label: '负债率' },
        investment: { score: 40, value: 10, label: '投资率' },
        stability: { score: 55, value: 3, label: '收入稳定性' },
        growth: { score: 45, value: 5, label: '增长率' }
      }
    }),
    goalProgress: async (data: any) => {
      const allGoals = goals.all()
      const mapped = allGoals.map(g => {
        const progress_pct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0
        const stage = g.stage || 'guarantee'
        const remaining = g.target_amount - g.current_amount
        const monthsNeeded = remaining > 0 && g.monthly_savings > 0 ? Math.ceil(remaining / g.monthly_savings) : 0
        const estDate = new Date()
        estDate.setMonth(estDate.getMonth() + monthsNeeded)
        return {
          ...g,
          progress_pct,
          stage,
          current_amount: g.current_amount || 0,
          target_amount: g.target_amount || 0,
          estimatedMonths: monthsNeeded || undefined,
          estimatedDate: monthsNeeded > 0 ? estDate.toISOString().slice(0, 10) : undefined
        }
      })
      return {
        goals: mapped,
        avgMonthlySavings: 0
      }
    }
  },

  // ── export ───────────────────────────────────────────────────
  exportToPDF: async (filename: string) => ({ success: false, canceled: true }),

  // ── backup ───────────────────────────────────────────────────
  backupInfo: async () => ({ success: true, data: { lastBackup: null, autoBackupEnabled: false, backupCount: 0, dbSizeFormatted: '0 KB', totalRecords: 0, version: '1.0.0' } }),
  backupCreate: async () => ({ success: true, message: '浏览器模式下不支持备份' }),
  backupRestore: async () => ({ success: false, message: '浏览器模式下不支持恢复' }),
  backupAuto: async () => ({ success: false, message: '浏览器模式下不支持自动备份' }),
  backupList: async () => ({ success: true, data: [] }),
  backupExportJSON: async () => ({ success: false, message: '浏览器模式下不支持导出' }),
  backupAutoStatus: async () => ({ enabled: false, interval: 0, lastBackupTime: null }),

  // ── license ──────────────────────────────────────────────────
  license: {
    checkTrial: async () => ({ isTrial: true, daysLeft: 30, isExpired: false }),
    activate: async (key: string) => ({ success: false, message: '浏览器预览模式下无需激活' }),
    status: async () => ({ isActive: true, isTrial: true, tier: 'trial', expiresAt: null, daysLeft: 30, isExpired: false, plan: 'preview', machineId: 'browser', message: '试用版' }),
    renew: async () => ({ success: false, message: '浏览器模式下不支持续费' }),
    deactivate: async () => ({ success: false, message: '浏览器模式下不支持停用' }),
    features: async () => ({ maxAccounts: Infinity, maxTransactions: Infinity, exportFormats: ['csv', 'pdf', 'excel'], hasBudget: true, hasInvestment: true, hasPdfReport: true, hasAutoBackup: true, hasHealthScore: true }),
    hasFeature: async (feature: string) => ({ hasFeature: true }),
    checkLimit: async (feature: string, count: number) => ({ allowed: true }),
    machineId: async () => 'browser-preview',
    activateOnline: async (key: string) => ({ success: false, message: '浏览器预览模式下无需激活' }),
    renewOnline: async () => ({ success: false, message: '浏览器模式下不支持在线续费' }),
    onlineCheck: async () => ({ success: true, isValid: true, revoked: false }),
    needsOnlineCheck: async () => false,
  },

  // ── recurring ────────────────────────────────────────────────
  listRecurringRules: async (userId: string) => recurring.all().filter(r => r.user_id === userId),
  getRecurringRule: async (id: string) => recurring.get(id) || null,
  createRecurringRule: async (data: any) => recurring.set({ id: uid(), ...data, status: 'active', created_at: now(), updated_at: now() }),
  updateRecurringRule: async (id: string, data: any) => {
    const existing = recurring.get(id)
    if (!existing) return null
    return recurring.set({ ...existing, ...data, updated_at: now() })
  },
  deleteRecurringRule: async (id: string) => recurring.del(id),
  toggleRecurringRule: async (id: string) => {
    const existing = recurring.get(id)
    if (!existing) return null
    return recurring.set({ ...existing, status: existing.status === 'active' ? 'paused' : 'active', updated_at: now() })
  },
  executePendingRecurring: async (userId: string) => ({ executed: 0 }),

  // ── demo ─────────────────────────────────────────────────────
  demo: {
    status: async () => ({ isDemo: false, hasData: accounts.all().length > 0 }),
    seed: async () => ({ success: true, message: '演示数据已加载' }),
    clear: async () => {
      ['accounts','debts','transactions','goals','dreams','incomeSources','incomeRecords','incomeGoals','incomeStrategies','incomeActions','incomeSimulations','budgets','budgetSnapshots','investmentAccounts','portfolios','holdings','investmentTransactions','recurringRules'].forEach(name => {
        localStorage.removeItem(`wf:${name}`)
      })
      return { success: true, message: '数据已清除' }
    },
  },

  // ── insights ─────────────────────────────────────────────────
  insight: {
    benchmarks: async () => ({
      success: true,
      data: [
        {
          name: '储蓄能力',
          icon: '💰',
          score: 60,
          items: [
            { key: 'savingsRate', label: '储蓄率', userValue: 20, benchmarkValue: 25, unit: '%', level: 'warning', description: '您的储蓄率略低于平均水平' },
            { key: 'emergencyMonths', label: '应急储备月数', userValue: 3, benchmarkValue: 6, unit: '月', level: 'danger', description: '应急储备不足，建议至少6个月' }
          ]
        },
        {
          name: '负债管理',
          icon: '💳',
          score: 70,
          items: [
            { key: 'debtRatio', label: '负债率', userValue: 30, benchmarkValue: 35, unit: '%', level: 'good', description: '负债率控制良好' }
          ]
        },
        {
          name: '投资增长',
          icon: '📈',
          score: 40,
          items: [
            { key: 'investmentRate', label: '投资率', userValue: 10, benchmarkValue: 15, unit: '%', level: 'warning', description: '投资比例偏低，建议适当增加' }
          ]
        }
      ]
    }),
    networthPercentile: async (netWorth: number, age: number) => ({ percentile: 50, description: '浏览器预览模式下无法计算排名' }),
    achievements: async () => ({
      success: true,
      data: {
        score: { total: 50, unlocked: 2, total_count: 10, max: 100 },
        groups: [
          {
            category: 'savings',
            icon: '💰',
            label: '储蓄达人',
            achievements: [
              { id: 'a1', name: '首次储蓄', description: '完成第一次储蓄', icon: '🏅', tier: 'bronze', progress: 100, unlockedAt: new Date().toISOString() },
              { id: 'a2', name: '储蓄新星', description: '连续3个月储蓄率超过20%', icon: '⭐', tier: 'silver', progress: 60, unlockedAt: null }
            ]
          }
        ]
      }
    }),
    summary: async () => ({
      success: true,
      data: {
        score: 50,
        level: '一般',
        financialPhase: 'accumulation',
        netWorth: 0,
        recommendation: '建议先建立3-6个月的应急储备金',
        highlights: [],
        suggestions: ['在浏览器预览模式下暂无个性化建议']
      }
    }),
  },

  // ── import ───────────────────────────────────────────────────
  import: {
    selectFile: async () => ({ canceled: true }),
    preview: async (filePath: string) => ({ transactions: [] }),
    execute: async (filePath: string, accountId: string) => ({ success: false, message: '浏览器模式下不支持导入' }),
  },

  // ── currency ─────────────────────────────────────────────────
  currency: {
    getSupported: async () => [
      { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳' },
      { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸' },
      { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺' },
      { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧' },
      { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵' },
      { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷' },
      { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰' },
      { code: 'TWD', name: '新台币', symbol: 'NT$', flag: '🇹🇼' },
      { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬' },
      { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺' },
      { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦' },
      { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', flag: '🇨🇭' },
    ],
    getRate: async (from: string, to: string) => ({ from, to, rate: from === to ? 1 : 0.14 }),
    convert: async (data: any) => ({ original: data.amount, converted: data.amount * 0.14, from: data.from, to: data.to, rate: 0.14 }),
    convertBatch: async (data: any) => data.items.map((item: any) => ({ original: item.amount, converted: item.amount, currency: item.currency })),
    getRatesForBase: async (base: string, currencies: string[]) => {
      const result: Record<string, number> = {}
      currencies.forEach((c: string) => { result[c] = c === base ? 1 : 0.14 })
      return result
    },
    getBaseCurrency: async (userId: string) => 'CNY',
    setBaseCurrency: async (userId: string, currency: string) => ({ success: true }),
    getCacheStatus: async () => ({ cached: false, lastUpdate: null, expiresAt: null, entryCount: 0, isExpired: false }),
    clearCache: async () => ({ success: true }),
    formatAmount: async (data: any) => `${data.currency} ${data.amount.toFixed(2)}`,
  },

  // ── AI ───────────────────────────────────────────────────────
  ai: {
    getConfig: async () => ({ provider: 'mock', apiKey: '', model: '' }),
    updateConfig: async (config: any) => ({ success: true }),
    quickTips: async (ctx: any) => [
      { title: '先支付给自己', content: '收入的至少 10% 用于投资，这是巴比伦最富的人的核心法则。' },
      { title: '分散风险', content: '不要把所有鸡蛋放在一个篮子里，合理配置资产。' },
      { title: '紧急备用金', content: '保持 3-6 个月生活费的紧急备用金。' }
    ],
    analyzeSpending: async (ctx: any) => ({ analysis: '浏览器预览模式下暂无实际数据分析', suggestions: ['请添加交易数据以获得分析'], topCategories: [] }),
    savingsPlan: async (ctx: any, targetAmount: number, targetDate?: string) => ({ monthlySaving: Math.round(targetAmount / 12), totalMonths: 12, totalSaved: targetAmount, feasibility: 'moderate' }),
    investmentAdvice: async (ctx: any, holdings: any[], riskLevel: string) => ({ advice: '浏览器预览模式下暂无投资建议', allocation: [], riskAssessment: riskLevel }),
    chat: async (ctx: any, question: string, history: any[]) => ({ answer: '浏览器预览模式下 AI 助手暂不可用，请使用完整桌面版体验 AI 功能。', usage: { tokens: 0 } }),
    usage: async () => ({ count: 0, tokens: 0 }),
    clearCache: async () => ({ success: true }),
    naturalQuery: async (query: string) => ({ answer: '浏览器预览模式下暂不支持自然语言查询', data: null }),
    quickQueries: async () => [
      { label: '本月花了多少', query: '本月总支出是多少', icon: '💰' },
      { label: '净资产', query: '我目前的净资产是多少', icon: '📊' },
      { label: '储蓄率', query: '我的储蓄率是多少', icon: '📈' },
    ],
  },

  // ── database management ──────────────────────────────────────
  resetDatabase: async () => {
    ['accounts','debts','transactions','goals','dreams','incomeSources','incomeRecords','incomeGoals','incomeStrategies','incomeActions','incomeSimulations','budgets','budgetSnapshots','investmentAccounts','portfolios','holdings','investmentTransactions','recurringRules'].forEach(name => {
      localStorage.removeItem(`wf:${name}`)
    })
    return { success: true }
  },
}

export type ElectronAPIType = typeof electronAPI
