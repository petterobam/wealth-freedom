/**
 * Electron 预加载脚本
 * 暴露安全的 API 给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的 API
const api = {
  // 用户相关
  user: {
    get: () => ipcRenderer.invoke('user:get'),
    create: (data: any) => ipcRenderer.invoke('user:create'),
    update: (data: any) => ipcRenderer.invoke('user:update'),
  },

  // 账户（资产）相关
  account: {
    getAll: () => ipcRenderer.invoke('account:getAll'),
    getById: (id: number) => ipcRenderer.invoke('account:getById', id),
    create: (data: any) => ipcRenderer.invoke('account:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('account:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('account:delete', id),
  },

  // 负债相关
  debt: {
    getAll: () => ipcRenderer.invoke('debt:getAll'),
    getById: (id: number) => ipcRenderer.invoke('debt:getById', id),
    create: (data: any) => ipcRenderer.invoke('debt:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('debt:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('debt:delete', id),
  },

  // 交易记录相关
  transaction: {
    getAll: (filters?: any) => ipcRenderer.invoke('transaction:getAll', filters),
    getById: (id: number) => ipcRenderer.invoke('transaction:getById', id),
    create: (data: any) => ipcRenderer.invoke('transaction:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('transaction:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('transaction:delete', id),
  },

  // 目标相关
  goal: {
    getAll: () => ipcRenderer.invoke('goal:getAll'),
    getById: (id: number) => ipcRenderer.invoke('goal:getById', id),
    create: (data: any) => ipcRenderer.invoke('goal:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('goal:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('goal:delete', id),
  },

  // 梦想相关
  dream: {
    getAll: () => ipcRenderer.invoke('dream:getAll'),
    getById: (id: number) => ipcRenderer.invoke('dream:getById', id),
    create: (data: any) => ipcRenderer.invoke('dream:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('dream:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('dream:delete', id),
  },

  // 计算相关
  calculation: {
    getNetWorth: () => ipcRenderer.invoke('calculation:getNetWorth'),
    getCashFlow: (month: string) => ipcRenderer.invoke('calculation:getCashFlow', month),
    getGoalProgress: () => ipcRenderer.invoke('calculation:getGoalProgress'),
    getRatios: () => ipcRenderer.invoke('calculation:getRatios'),
  },

  // 报表分析 (v0.6.0)
  report: {
    monthlySummary: (userId: string, year: number, month: number) =>
      ipcRenderer.invoke('report:monthly-summary', { userId, year, month }),
    yearlySummary: (userId: string, year: number) =>
      ipcRenderer.invoke('report:yearly-summary', { userId, year }),
    categoryRanking: (userId: string, startDate: string, endDate: string, type?: string, limit?: number) =>
      ipcRenderer.invoke('report:category-ranking', { userId, startDate, endDate, type, limit }),
    monthlyTrend: (userId: string, months?: number) =>
      ipcRenderer.invoke('report:monthly-trend', { userId, months }),
    healthScore: (userId: string) =>
      ipcRenderer.invoke('report:health-score', { userId }),
    goalProgress: (userId: string) =>
      ipcRenderer.invoke('report:goal-progress', { userId }),
  },

  // 应用更新检查 (v1.1.0)
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    lastResult: () => ipcRenderer.invoke('update:last-result'),
    download: (url: string) => ipcRenderer.invoke('update:download', url),
  },

  // 周期性交易 (v1.2.0)
  recurring: {
    list: (userId: string) => ipcRenderer.invoke('recurring:list', userId),
    get: (ruleId: string) => ipcRenderer.invoke('recurring:get', ruleId),
    create: (data: any) => ipcRenderer.invoke('recurring:create', data),
    update: (ruleId: string, data: any) => ipcRenderer.invoke('recurring:update', ruleId, data),
    delete: (ruleId: string) => ipcRenderer.invoke('recurring:delete', ruleId),
    toggle: (ruleId: string) => ipcRenderer.invoke('recurring:toggle', ruleId),
    executePending: (userId: string) => ipcRenderer.invoke('recurring:execute-pending', userId),
  },

  // AI 财务助手 (v1.3.0)
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

  // 数据加密 (v1.9.0)
  encryption: {
    setup: (password: string) => ipcRenderer.invoke('encryption:setup', { password }),
    unlock: (password: string) => ipcRenderer.invoke('encryption:unlock', { password }),
    lock: () => ipcRenderer.invoke('encryption:lock'),
    isUnlocked: () => ipcRenderer.invoke('encryption:isUnlocked'),
    encrypt: (plaintext: string) => ipcRenderer.invoke('encryption:encrypt', { plaintext }),
    decrypt: (ciphertext: string) => ipcRenderer.invoke('encryption:decrypt', { ciphertext }),
    encryptBatch: (values: string[]) => ipcRenderer.invoke('encryption:encryptBatch', { values }),
    decryptBatch: (values: string[]) => ipcRenderer.invoke('encryption:decryptBatch', { values }),
    getStatus: () => ipcRenderer.invoke('encryption:getStatus'),
    isEnabled: () => ipcRenderer.invoke('encryption:isEnabled'),
    migrateData: () => ipcRenderer.invoke('encryption:migrateData'),
  },

  // 数据库管理
  resetDatabase: () => ipcRenderer.invoke('database:reset'),
};

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('api', api);

// TypeScript 类型定义（供渲染进程使用）
export type API = typeof api;
