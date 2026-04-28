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
  updateAccount: (data: any) => ipcRenderer.invoke('account:update', data),
  deleteAccount: (id: number) => ipcRenderer.invoke('account:delete', id),
  
  // 负债相关
  getDebts: () => ipcRenderer.invoke('debt:getAll'),
  createDebt: (data: any) => ipcRenderer.invoke('debt:create', data),
  updateDebt: (data: any) => ipcRenderer.invoke('debt:update', data),
  deleteDebt: (id: number) => ipcRenderer.invoke('debt:delete', id),
  
  // 交易相关
  getTransactions: (filters?: any) => ipcRenderer.invoke('transaction:getAll', filters),
  createTransaction: (data: any) => ipcRenderer.invoke('transaction:create', data),
  updateTransaction: (data: any) => ipcRenderer.invoke('transaction:update', data),
  deleteTransaction: (id: number) => ipcRenderer.invoke('transaction:delete', id),
  
  // 目标相关
  getGoals: () => ipcRenderer.invoke('goal:getAll'),
  createGoal: (data: any) => ipcRenderer.invoke('goal:create', data),
  updateGoal: (data: any) => ipcRenderer.invoke('goal:update', data),
  deleteGoal: (id: number) => ipcRenderer.invoke('goal:delete', id),
  
  // 梦想相关
  getDreams: () => ipcRenderer.invoke('dream:getAll'),
  createDream: (data: any) => ipcRenderer.invoke('dream:create', data),
  updateDream: (data: any) => ipcRenderer.invoke('dream:update', data),
  deleteDream: (id: number) => ipcRenderer.invoke('dream:delete', id),
  
  // 计算相关
  getNetWorth: () => ipcRenderer.invoke('calculate:netWorth'),
  getCashFlow: (month: string) => ipcRenderer.invoke('calculate:cashFlow', month),
  getGoalsProgress: () => ipcRenderer.invoke('calculate:goalsProgress'),
  getRatios: () => ipcRenderer.invoke('calculate:ratios'),

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
  },

  // 演示模式 (v1.1.0)
  demo: {
    status: () => ipcRenderer.invoke('demo:status'),
    seed: () => ipcRenderer.invoke('demo:seed'),
    clear: () => ipcRenderer.invoke('demo:clear'),
  },
})
