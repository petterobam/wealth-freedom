// 全局类型定义 - 与 src/preload/index.ts 保持同步

interface ElectronAPI {
  // 用户相关
  getUser: () => Promise<any>
  createUser: (data: any) => Promise<any>
  updateUser: (data: any) => Promise<any>

  // 账户相关
  getAccounts: () => Promise<any[]>
  createAccount: (data: any) => Promise<any>
  updateAccount: (data: any) => Promise<any>
  deleteAccount: (id: number) => Promise<boolean>

  // 负债相关
  getDebts: () => Promise<any[]>
  createDebt: (data: any) => Promise<any>
  updateDebt: (data: any) => Promise<any>
  deleteDebt: (id: number) => Promise<boolean>

  // 交易相关
  getTransactions: (filters?: any) => Promise<any[]>
  createTransaction: (data: any) => Promise<any>
  updateTransaction: (data: any) => Promise<any>
  deleteTransaction: (id: number) => Promise<boolean>

  // 目标相关
  getGoals: () => Promise<any[]>
  createGoal: (data: any) => Promise<any>
  updateGoal: (data: any) => Promise<any>
  deleteGoal: (id: number) => Promise<boolean>

  // 梦想相关
  getDreams: () => Promise<any[]>
  createDream: (data: any) => Promise<any>
  updateDream: (data: any) => Promise<any>
  deleteDream: (id: number) => Promise<boolean>

  // 计算相关
  getNetWorth: () => Promise<any>
  getCashFlow: (month: string) => Promise<any>
  getGoalsProgress: () => Promise<any>
  getRatios: () => Promise<any>

  // 收入来源相关
  getIncomeSources: () => Promise<any[]>
  getIncomeSourceById: (id: string) => Promise<any>
  createIncomeSource: (data: any) => Promise<any>
  updateIncomeSource: (id: string, data: any) => Promise<any>
  deleteIncomeSource: (id: string) => Promise<boolean>

  // 收入记录相关
  getIncomeRecords: (filters?: any) => Promise<any[]>
  getIncomeRecordById: (id: string) => Promise<any>
  createIncomeRecord: (data: any) => Promise<any>
  updateIncomeRecord: (id: string, data: any) => Promise<any>
  deleteIncomeRecord: (id: string) => Promise<boolean>

  // 收入目标相关
  getIncomeGoals: () => Promise<any[]>
  getIncomeGoalById: (id: string) => Promise<any>
  createIncomeGoal: (data: any) => Promise<any>
  updateIncomeGoal: (id: string, data: any) => Promise<any>
  deleteIncomeGoal: (id: string) => Promise<boolean>

  // 收入策略相关
  getIncomeStrategies: () => Promise<any[]>
  getRecommendedIncomeStrategies: () => Promise<any[]>
  createIncomeStrategy: (data: any) => Promise<any>
  updateIncomeStrategy: (id: string, data: any) => Promise<any>
  deleteIncomeStrategy: (id: string) => Promise<boolean>
  applyIncomeStrategy: (id: string) => Promise<any>

  // 收入行动计划相关
  getIncomeActions: (filters?: any) => Promise<any[]>
  getIncomeActionById: (id: string) => Promise<any>
  createIncomeAction: (data: any) => Promise<any>
  updateIncomeAction: (id: string, data: any) => Promise<any>
  deleteIncomeAction: (id: string) => Promise<boolean>

  // 收入分析相关
  getIncomeDashboard: (params?: any) => Promise<any>
  getIncomeAnalysis: () => Promise<any>
  getIncomeStructure: () => Promise<any>

  // 收入模拟相关
  simulateIncome: (params: any) => Promise<any[]>
  getIncomeSimulations: () => Promise<any[]>
  createIncomeSimulation: (data: any) => Promise<any>
  deleteIncomeSimulation: (id: string) => Promise<boolean>

  // 财务自由预测
  predictFinancialFreedom: (params: any) => Promise<any>

  // 预算相关
  getBudgetList: (data: any) => Promise<any>
  getBudgetById: (data: any) => Promise<any>
  createBudget: (data: any) => Promise<any>
  updateBudget: (data: any) => Promise<any>
  deleteBudget: (data: any) => Promise<any>
  getBudgetStatus: (data: any) => Promise<any>
  getBudgetHistory: (data: any) => Promise<any>
  takeBudgetSnapshot: (data: any) => Promise<any>

  // 投资追踪相关
  getInvestmentAccounts: () => Promise<any[]>
  addInvestmentAccount: (data: any) => Promise<any>
  updateInvestmentAccount: (data: any) => Promise<any>
  deleteInvestmentAccount: (id: string) => Promise<any>
  getPortfolios: (accountId?: string) => Promise<any[]>
  addPortfolio: (data: any) => Promise<any>
  deletePortfolio: (id: string) => Promise<any>
  getHoldings: (portfolioId: string) => Promise<any[]>
  addHolding: (data: any) => Promise<any>
  updateHoldingPrice: (data: any) => Promise<any>
  batchUpdatePrices: (updates: any[]) => Promise<any>
  deleteHolding: (id: string) => Promise<any>
  getInvestmentTransactions: (opts: any) => Promise<any[]>
  addInvestmentTransaction: (data: any) => Promise<any>
  deleteInvestmentTransaction: (id: string) => Promise<any>
  getInvestmentSummary: () => Promise<any>
  getInvestmentAllocation: () => Promise<any>

  // 报表分析相关
  report: {
    monthlySummary: (data: { userId: string; year: number; month: number }) => Promise<any>
    yearlySummary: (data: { userId: string; year: number }) => Promise<any>
    categoryRanking: (data: { userId: string; year: number; month?: number }) => Promise<any>
    monthlyTrend: (data: { userId: string; months: number }) => Promise<any>
    healthScore: (userId: string) => Promise<any>
    goalProgress: (data: { userId: string }) => Promise<any>
  }

  // 导出相关
  exportToPDF: (filename: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>

  // 备份与恢复 (v0.9.0)
  backupInfo: () => Promise<any>
  backupCreate: (options?: { filename?: string }) => Promise<any>
  backupRestore: () => Promise<any>
  backupAuto: () => Promise<any>
  backupList: () => Promise<any>
  backupExportJSON: () => Promise<any>
  backupAutoStatus: () => Promise<any>

  // 授权管理 (v1.0.0)
  license: {
    checkTrial: () => Promise<any>
    activate: (key: string) => Promise<any>
    status: () => Promise<any>
    renew: () => Promise<any>
    deactivate: () => Promise<any>
    features: () => Promise<any>
    hasFeature: (feature: string) => Promise<any>
    checkLimit: (feature: string, count: number) => Promise<any>
    machineId: () => Promise<any>
    activateOnline: (key: string) => Promise<any>
    renewOnline: () => Promise<any>
    onlineCheck: () => Promise<any>
    needsOnlineCheck: () => Promise<any>
  }

  // 周期性交易 (v1.2.0)
  listRecurringRules: (userId: string) => Promise<any[]>
  getRecurringRule: (id: string) => Promise<any>
  createRecurringRule: (data: any) => Promise<any>
  updateRecurringRule: (id: string, data: any) => Promise<any>
  deleteRecurringRule: (id: string) => Promise<any>
  toggleRecurringRule: (id: string) => Promise<any>
  executePendingRecurring: (userId: string) => Promise<any>

  // 演示模式 (v1.1.0)
  demo: {
    status: () => Promise<any>
    seed: () => Promise<any>
    clear: () => Promise<any>
  }

  // 洞察与成就 (v1.4.0)
  insight: {
    benchmarks: () => Promise<any>
    networthPercentile: (netWorth: number, age: number) => Promise<any>
    achievements: () => Promise<any>
    summary: () => Promise<any>
  }

  // CSV 导入 (v1.8.0)
  import: {
    selectFile: () => Promise<any>
    preview: (filePath: string) => Promise<any>
    execute: (filePath: string, accountId: string) => Promise<any>
  }

  // 多币种支持 (v1.9.0)
  currency: {
    getSupported: () => Promise<any>
    getRate: (from: string, to: string) => Promise<any>
    convert: (amount: number, from: string, to: string) => Promise<any>
    convertBatch: (items: Array<{ amount: number; currency: string }>, baseCurrency: string) => Promise<any>
    getRatesForBase: (baseCurrency: string, currencies: string[]) => Promise<any>
    getBaseCurrency: (userId: string) => Promise<any>
    setBaseCurrency: (userId: string, currency: string) => Promise<any>
    getCacheStatus: () => Promise<any>
    clearCache: () => Promise<any>
    formatAmount: (amount: number, currency: string) => Promise<any>
  }

  // 数据库管理
  resetDatabase: () => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
