import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 用户相关
  getUser: () => ipcRenderer.invoke('user:get'),
  createUser: (data: any) => ipcRenderer.invoke('user:create', data),
  updateUser: (data: any) => ipcRenderer.invoke('user:update', data),
  
  // 账户相关
  getAccounts: () => ipcRenderer.invoke('account:getAll'),
  createAccount: (data: any) => ipcRenderer.invoke('account:create', data),
  updateAccount: (data: any) => ipcRenderer.invoke('account:update', data.id, data),
  deleteAccount: (id: number) => ipcRenderer.invoke('account:delete', id),

  // 负债相关
  getDebts: () => ipcRenderer.invoke('debt:getAll'),
  createDebt: (data: any) => ipcRenderer.invoke('debt:create', data),
  updateDebt: (data: any) => ipcRenderer.invoke('debt:update', data.id, data),
  deleteDebt: (id: number) => ipcRenderer.invoke('debt:delete', id),

  // 交易相关
  getTransactions: (filters?: any) => ipcRenderer.invoke('transaction:getAll', filters),
  createTransaction: (data: any) => ipcRenderer.invoke('transaction:create', data),
  updateTransaction: (data: any) => ipcRenderer.invoke('transaction:update', data.id, data),
  deleteTransaction: (id: number) => ipcRenderer.invoke('transaction:delete', id),

  // 目标相关
  getGoals: () => ipcRenderer.invoke('goal:getAll'),
  createGoal: (data: any) => ipcRenderer.invoke('goal:create', data),
  updateGoal: (data: any) => ipcRenderer.invoke('goal:update', data.id, data),
  deleteGoal: (id: number) => ipcRenderer.invoke('goal:delete', id),

  // 梦想相关
  getDreams: () => ipcRenderer.invoke('dream:getAll'),
  createDream: (data: any) => ipcRenderer.invoke('dream:create', data),
  updateDream: (data: any) => ipcRenderer.invoke('dream:update', data.id, data),
  deleteDream: (id: number) => ipcRenderer.invoke('dream:delete', id),
  
  // 计算相关
  getNetWorth: () => ipcRenderer.invoke('calculate:netWorth'),
  getCashFlow: (month: string) => ipcRenderer.invoke('calculate:cashFlow', month),
  getGoalsProgress: () => ipcRenderer.invoke('calculate:goalsProgress'),
  getRatios: () => ipcRenderer.invoke('calculate:ratios'),

  // 仪表盘数据
  getDashboardData: () => ipcRenderer.invoke('dashboard:getData'),

  // 收入来源相关
  getIncomeSources: () => ipcRenderer.invoke('incomeSource:getAll'),
  getIncomeSourceById: (id: string) => ipcRenderer.invoke('incomeSource:getById', id),
  createIncomeSource: (data: any) => ipcRenderer.invoke('incomeSource:create', data),
  updateIncomeSource: (id: string, data: any) => ipcRenderer.invoke('incomeSource:update', id, data),
  deleteIncomeSource: (id: string) => ipcRenderer.invoke('incomeSource:delete', id),

  // 收入记录相关
  getIncomeRecords: (filters?: any) => ipcRenderer.invoke('incomeRecord:getAll', filters),
  getIncomeRecordById: (id: string) => ipcRenderer.invoke('incomeRecord:getById', id),
  createIncomeRecord: (data: any) => ipcRenderer.invoke('incomeRecord:create', data),
  updateIncomeRecord: (id: string, data: any) => ipcRenderer.invoke('incomeRecord:update', id, data),
  deleteIncomeRecord: (id: string) => ipcRenderer.invoke('incomeRecord:delete', id),

  // 收入目标相关
  getIncomeGoals: () => ipcRenderer.invoke('incomeGoal:getAll'),
  getIncomeGoalById: (id: string) => ipcRenderer.invoke('incomeGoal:getById', id),
  createIncomeGoal: (data: any) => ipcRenderer.invoke('incomeGoal:create', data),
  updateIncomeGoal: (id: string, data: any) => ipcRenderer.invoke('incomeGoal:update', id, data),
  deleteIncomeGoal: (id: string) => ipcRenderer.invoke('incomeGoal:delete', id),

  // 收入策略相关
  getIncomeStrategies: () => ipcRenderer.invoke('incomeStrategy:getAll'),
  getRecommendedIncomeStrategies: () => ipcRenderer.invoke('incomeStrategy:getRecommended'),
  createIncomeStrategy: (data: any) => ipcRenderer.invoke('incomeStrategy:create', data),
  updateIncomeStrategy: (id: string, data: any) => ipcRenderer.invoke('incomeStrategy:update', id, data),
  deleteIncomeStrategy: (id: string) => ipcRenderer.invoke('incomeStrategy:delete', id),
  applyIncomeStrategy: (id: string) => ipcRenderer.invoke('incomeStrategy:apply', id),

  // 收入行动计划相关
  getIncomeActions: (filters?: any) => ipcRenderer.invoke('incomeAction:getAll', filters),
  getIncomeActionById: (id: string) => ipcRenderer.invoke('incomeAction:getById', id),
  createIncomeAction: (data: any) => ipcRenderer.invoke('incomeAction:create', data),
  updateIncomeAction: (id: string, data: any) => ipcRenderer.invoke('incomeAction:update', id, data),
  deleteIncomeAction: (id: string) => ipcRenderer.invoke('incomeAction:delete', id),

  // 收入分析相关
  getIncomeDashboard: (params?: any) => ipcRenderer.invoke('income:getDashboard', params),
  getIncomeAnalysis: () => ipcRenderer.invoke('income:getAnalysis'),
  getIncomeStructure: () => ipcRenderer.invoke('income:getStructure'),

  // 收入模拟相关
  simulateIncome: (params: any) => ipcRenderer.invoke('income:simulate', params),
  getIncomeSimulations: () => ipcRenderer.invoke('incomeSimulation:getAll'),
  createIncomeSimulation: (data: any) => ipcRenderer.invoke('incomeSimulation:create', data),
  deleteIncomeSimulation: (id: string) => ipcRenderer.invoke('incomeSimulation:delete', id),

  // 财务自由预测
  predictFinancialFreedom: (params: any) => ipcRenderer.invoke('income:predictFinancialFreedom', params),

  // 预算相关
  getBudgetList: (data: any) => ipcRenderer.invoke('budget:list', data),
  getBudgetById: (data: any) => ipcRenderer.invoke('budget:getById', data),
  createBudget: (data: any) => ipcRenderer.invoke('budget:create', data),
  updateBudget: (data: any) => ipcRenderer.invoke('budget:update', data),
  deleteBudget: (data: any) => ipcRenderer.invoke('budget:delete', data),
  getBudgetStatus: (data: any) => ipcRenderer.invoke('budget:status', data),
  getBudgetHistory: (data: any) => ipcRenderer.invoke('budget:history', data),
  takeBudgetSnapshot: (data: any) => ipcRenderer.invoke('budget:snapshot', data),

  // 投资追踪相关 (v0.5.0)
  getInvestmentAccounts: () => ipcRenderer.invoke('investment:get-accounts'),
  addInvestmentAccount: (data: any) => ipcRenderer.invoke('investment:add-account', data),
  updateInvestmentAccount: (data: any) => ipcRenderer.invoke('investment:update-account', data),
  deleteInvestmentAccount: (id: string) => ipcRenderer.invoke('investment:delete-account', id),

  getPortfolios: (accountId?: string) => ipcRenderer.invoke('investment:get-portfolios', accountId),
  addPortfolio: (data: any) => ipcRenderer.invoke('investment:add-portfolio', data),
  deletePortfolio: (id: string) => ipcRenderer.invoke('investment:delete-portfolio', id),

  getHoldings: (portfolioId: string) => ipcRenderer.invoke('investment:get-holdings', portfolioId),
  addHolding: (data: any) => ipcRenderer.invoke('investment:add-holding', data),
  updateHoldingPrice: (data: any) => ipcRenderer.invoke('investment:update-price', data),
  batchUpdatePrices: (updates: any[]) => ipcRenderer.invoke('investment:batch-update-prices', updates),
  deleteHolding: (id: string) => ipcRenderer.invoke('investment:delete-holding', id),

  getInvestmentTransactions: (opts: any) => ipcRenderer.invoke('investment:get-transactions', opts),
  addInvestmentTransaction: (data: any) => ipcRenderer.invoke('investment:add-transaction', data),
  deleteInvestmentTransaction: (id: string) => ipcRenderer.invoke('investment:delete-transaction', id),

  getInvestmentSummary: () => ipcRenderer.invoke('investment:get-summary'),
  getInvestmentAllocation: () => ipcRenderer.invoke('investment:get-allocation'),

  // 报表分析相关 (v0.6.0)
  report: {
    monthlySummary: (data: { userId: string; year: number; month: number }) => ipcRenderer.invoke('report:monthly-summary', data),
    yearlySummary: (data: { userId: string; year: number }) => ipcRenderer.invoke('report:yearly-summary', data),
    categoryRanking: (data: { userId: string; year: number; month?: number }) => ipcRenderer.invoke('report:category-ranking', data),
    monthlyTrend: (data: { userId: string; months: number }) => ipcRenderer.invoke('report:monthly-trend', data),
    healthScore: (userId: string) => ipcRenderer.invoke('report:health-score', { userId }),
    goalProgress: (data: { userId: string }) => ipcRenderer.invoke('report:goal-progress', data),
  },

  // 导出相关
  exportToPDF: (filename: string) => ipcRenderer.invoke('export:toPDF', filename),

  // 备份与恢复 (v0.9.0)
  backupInfo: () => ipcRenderer.invoke('backup:info'),
  backupCreate: (options?: { filename?: string }) => ipcRenderer.invoke('backup:create', options),
  backupRestore: () => ipcRenderer.invoke('backup:restore'),
  backupAuto: () => ipcRenderer.invoke('backup:auto'),
  backupList: () => ipcRenderer.invoke('backup:list'),
  backupExportJSON: () => ipcRenderer.invoke('backup:exportJSON'),
  backupAutoStatus: () => ipcRenderer.invoke('backup:autoStatus'),

  // 授权管理 (v1.0.0)
  license: {
    checkTrial: () => ipcRenderer.invoke('license:checkTrial'),
    activate: (key: string) => ipcRenderer.invoke('license:activate', key),
    status: () => ipcRenderer.invoke('license:status'),
    renew: () => ipcRenderer.invoke('license:renew'),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
    features: () => ipcRenderer.invoke('license:features'),
    hasFeature: (feature: string) => ipcRenderer.invoke('license:hasFeature', feature),
    checkLimit: (feature: string, count: number) => ipcRenderer.invoke('license:checkLimit', feature, count),
    machineId: () => ipcRenderer.invoke('license:machineId'),

    // 在线验证 (v1.8.0)
    activateOnline: (key: string) => ipcRenderer.invoke('license:activateOnline', key),
    renewOnline: () => ipcRenderer.invoke('license:renewOnline'),
    onlineCheck: () => ipcRenderer.invoke('license:onlineCheck'),
    needsOnlineCheck: () => ipcRenderer.invoke('license:needsOnlineCheck'),
  },

  // 周期性交易 (v1.2.0)
  listRecurringRules: (userId: string) => ipcRenderer.invoke('recurring:list', userId),
  getRecurringRule: (id: string) => ipcRenderer.invoke('recurring:get', id),
  createRecurringRule: (data: any) => ipcRenderer.invoke('recurring:create', data),
  updateRecurringRule: (id: string, data: any) => ipcRenderer.invoke('recurring:update', id, data),
  deleteRecurringRule: (id: string) => ipcRenderer.invoke('recurring:delete', id),
  toggleRecurringRule: (id: string) => ipcRenderer.invoke('recurring:toggle', id),
  executePendingRecurring: (userId: string) => ipcRenderer.invoke('recurring:execute-pending', userId),

  // 演示模式 (v1.1.0)
  demo: {
    status: () => ipcRenderer.invoke('demo:status'),
    seed: () => ipcRenderer.invoke('demo:seed'),
    clear: () => ipcRenderer.invoke('demo:clear'),
  },

  // 洞察与成就 (v1.4.0)
  insight: {
    benchmarks: () => ipcRenderer.invoke('insight:benchmarks'),
    networthPercentile: (netWorth: number, age: number) => ipcRenderer.invoke('insight:networth-percentile', netWorth, age),
    achievements: () => ipcRenderer.invoke('insight:achievements'),
    summary: () => ipcRenderer.invoke('insight:summary'),
  },

  // CSV 导入 (v1.8.0)
  import: {
    selectFile: () => ipcRenderer.invoke('import:selectFile'),
    preview: (filePath: string) => ipcRenderer.invoke('import:preview', filePath),
    execute: (filePath: string, accountId: string) => ipcRenderer.invoke('import:execute', filePath, accountId),
  },

  // 多币种支持 (v1.9.0)
  currency: {
    getSupported: () => ipcRenderer.invoke('currency:getSupported'),
    getRate: (from: string, to: string) => ipcRenderer.invoke('currency:getRate', { from, to }),
    convert: (amount: number, from: string, to: string) => ipcRenderer.invoke('currency:convert', { amount, from, to }),
    convertBatch: (items: Array<{ amount: number; currency: string }>, baseCurrency: string) => ipcRenderer.invoke('currency:convertBatch', { items, baseCurrency }),
    getRatesForBase: (baseCurrency: string, currencies: string[]) => ipcRenderer.invoke('currency:getRatesForBase', { baseCurrency, currencies }),
    getBaseCurrency: (userId: string) => ipcRenderer.invoke('currency:getBaseCurrency', { userId }),
    setBaseCurrency: (userId: string, currency: string) => ipcRenderer.invoke('currency:setBaseCurrency', { userId, currency }),
    getCacheStatus: () => ipcRenderer.invoke('currency:getCacheStatus'),
    clearCache: () => ipcRenderer.invoke('currency:clearCache'),
    formatAmount: (amount: number, currency: string) => ipcRenderer.invoke('currency:formatAmount', { amount, currency }),
  },

  // AI 财务助手 (v1.3.0+)
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    updateConfig: (config: any) => ipcRenderer.invoke('ai:updateConfig', config),
    quickTips: (ctx: any) => ipcRenderer.invoke('ai:quickTips', ctx),
    analyzeSpending: (ctx: any) => ipcRenderer.invoke('ai:analyzeSpending', ctx),
    savingsPlan: (ctx: any, targetAmount: number, targetDate?: string) => ipcRenderer.invoke('ai:savingsPlan', ctx, targetAmount, targetDate),
    investmentAdvice: (ctx: any, holdings: any[], riskLevel: string) => ipcRenderer.invoke('ai:investmentAdvice', ctx, holdings, riskLevel),
    chat: (ctx: any, question: string, history: any[]) => ipcRenderer.invoke('ai:chat', ctx, question, history),
    usage: () => ipcRenderer.invoke('ai:usage'),
    clearCache: () => ipcRenderer.invoke('ai:clearCache'),
    // 自然语言查询 (v2.1.0)
    naturalQuery: (query: string) => ipcRenderer.invoke('ai:naturalQuery', query),
    quickQueries: () => ipcRenderer.invoke('ai:quickQueries'),
  },
})
