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

  // 导出相关
  exportToPDF: (filename: string) => ipcRenderer.invoke('export:toPDF', filename),
})
