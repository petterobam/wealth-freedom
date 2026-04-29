/**
 * v1.4.0 洞察与成就 IPC 处理器
 */
import { ipcMain } from 'electron'
import { calculateBenchmarks, estimateNetWorthPercentile } from './benchmarkService'
import { evaluateAchievements, groupAchievements, calculateAchievementScore } from './achievementService'
import type Database from 'better-sqlite3'

export function initInsightHandlers(db: Database.Database): void {
  // 获取财务基准对比
  ipcMain.handle('insight:benchmarks', async () => {
    try {
      
      // 汇总财务数据
      const incomeRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`).get() as any
      const expenseRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`).get() as any
      const assetRow = db.prepare(`SELECT COALESCE(SUM(balance), 0) as total FROM accounts`).get() as any
      const debtRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM debts`).get() as any
      const investRow = db.prepare(`SELECT COALESCE(SUM(current_value), 0) as total FROM investments`).get() as any

      const housingRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND (category LIKE '%住房%' OR category LIKE '%房租%' OR category LIKE '%房贷%')`).get() as any
      const foodRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND (category LIKE '%餐饮%' OR category LIKE '%食物%' OR category LIKE '%吃%')`).get() as any
      const transportRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND (category LIKE '%交通%' OR category LIKE '%出行%')`).get() as any
      const entertainRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND (category LIKE '%娱乐%' OR category LIKE '%休闲%')`).get() as any

      // 计算月均值（简化：假设数据覆盖最近12个月）
      const totalIncome = incomeRow?.total || 0
      const totalExpense = expenseRow?.total || 0
      const months = 1 // 当前月度数据

      const result = calculateBenchmarks({
        monthlyIncome: totalIncome / months,
        monthlyExpense: totalExpense / months,
        totalAssets: assetRow?.total || 0,
        totalDebt: debtRow?.total || 0,
        totalInvestment: investRow?.total || 0,
        housingExpense: housingRow?.total || 0,
        foodExpense: foodRow?.total || 0,
        transportExpense: transportRow?.total || 0,
        entertainmentExpense: entertainRow?.total || 0
      })

      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 获取净资产百分位
  ipcMain.handle('insight:networth-percentile', async (_event, netWorth: number, age: number) => {
    const percentile = estimateNetWorthPercentile(netWorth, age)
    return { success: true, data: { percentile, netWorth, age } }
  })

  // 获取成就列表
  ipcMain.handle('insight:achievements', async () => {
    try {
      const incomeRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`).get() as any
      const expenseRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`).get() as any
      const assetRow = db.prepare(`SELECT COALESCE(SUM(balance), 0) as total FROM accounts`).get() as any
      const debtRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM debts`).get() as any
      const investRow = db.prepare(`SELECT COALESCE(SUM(current_value), 0) as total FROM investments`).get() as any
      const txCount = (db.prepare(`SELECT COUNT(*) as c FROM transactions`).get() as any)?.c || 0
      const investCount = (db.prepare(`SELECT COUNT(*) as c FROM investments`).get() as any)?.c || 0
      const investTypes = (db.prepare(`SELECT COUNT(DISTINCT type) as c FROM investments`).get() as any)?.c || 0

      const totalIncome = incomeRow?.total || 0
      const totalExpense = expenseRow?.total || 0
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
      const monthlyExpense = totalExpense || 1
      const netWorth = (assetRow?.total || 0) - (debtRow?.total || 0)
      const emergencyMonths = monthlyExpense > 0 ? netWorth / monthlyExpense : 0

      // 简化：被动收入估算（投资收益按4%年化）
      const passiveIncome = ((investRow?.total || 0) * 0.04) / 12

      const achievements = evaluateAchievements({
        savingsRate,
        emergencyMonths,
        totalInvestment: investRow?.total || 0,
        totalDebt: debtRow?.total || 0,
        totalAssets: assetRow?.total || 0,
        initialDebt: Math.max(debtRow?.total || 0, 1000), // 初始债务（简化处理）
        investmentCategories: investTypes,
        passiveIncome,
        incomeSources: 1 + (investTypes > 0 ? 1 : 0), // 工资 + 投资收益
        netWorth,
        monthlyExpense,
        hasTransactions: txCount > 0,
        hasInvestments: investCount > 0
      })

      const groups = groupAchievements(achievements)
      const score = calculateAchievementScore(achievements)

      return { success: true, data: { achievements, groups, score } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 获取洞察摘要（基准+成就综合）
  ipcMain.handle('insight:summary', async () => {
    try {
      const assetRow = db.prepare(`SELECT COALESCE(SUM(balance), 0) as total FROM accounts`).get() as any
      const debtRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM debts`).get() as any
      const netWorth = (assetRow?.total || 0) - (debtRow?.total || 0)

      return {
        success: true,
        data: {
          netWorth,
          financialPhase: netWorth < 100000 ? 'accumulation' : netWorth < 1000000 ? 'growth' : 'freedom',
          recommendation: netWorth < 100000 
            ? '当前处于积累期，重点是提高储蓄率和增加收入来源'
            : netWorth < 1000000
              ? '当前处于成长期，建议优化投资组合，提高被动收入占比'
              : '当前处于自由期，重点是资产保值和多元化配置'
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
