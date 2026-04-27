// 全局类型定义

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

  // 报表分析相关 (v0.6.0)
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

  // 数据库管理
  resetDatabase: () => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
