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

  // 数据库管理
  resetDatabase: () => ipcRenderer.invoke('database:reset'),
};

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('api', api);

// TypeScript 类型定义（供渲染进程使用）
export type API = typeof api;
