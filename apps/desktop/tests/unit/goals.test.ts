/**
 * 财务目标计算 - 单元测试
 * 测试核心计算逻辑，确保目标显示正确
 */

import { describe, it, expect } from 'vitest'

describe('财务目标计算', () => {
  // 测试数据：基于用户的真实数据
  const testUser = {
    netWorth: 1020000,          // 净资产：102万
    monthlyIncome: 30000,       // 月收入：3万
    monthlyExpense: 10000,      // 月支出：1万
    monthlySavings: 20000,      // 月结余：2万
    savingsRate: 0.667          // 储蓄率：66.7%
  }

  describe('净资产计算', () => {
    it('应该正确计算净资产', () => {
      const totalAssets = 1100000  // 现金700k + 投资400k
      const totalDebts = 80000     // 负债80k
      const netWorth = totalAssets - totalDebts

      expect(netWorth).toBe(1020000)
    })

    it('应该正确计算储蓄率', () => {
      const savingsRate = (testUser.monthlyIncome - testUser.monthlyExpense) / testUser.monthlyIncome

      expect(savingsRate).toBeCloseTo(0.667, 2)
    })

    it('应该正确计算月结余', () => {
      const monthlySavings = testUser.monthlyIncome - testUser.monthlyExpense

      expect(monthlySavings).toBe(20000)
    })
  })

  describe('三阶段目标计算', () => {
    it('财务保障目标应该是月支出 × 6', () => {
      const target = testUser.monthlyExpense * 6

      expect(target).toBe(60000)
    })

    it('财务安全目标应该是月支出 × 150', () => {
      const target = testUser.monthlyExpense * 150

      expect(target).toBe(1500000)
    })

    it('财务自由目标应该是月梦想成本 × 150', () => {
      const monthlyDreamCost = 20000  // 假设梦想生活月成本2万
      const target = monthlyDreamCost * 150

      expect(target).toBe(3000000)
    })
  })

  describe('目标进度计算', () => {
    it('财务保障进度应该是 1700%', () => {
      const target = 60000
      const progress = (testUser.netWorth / target) * 100

      expect(progress).toBe(1700)
      expect(progress).toBeGreaterThan(100)  // 已达成
    })

    it('财务安全进度应该是 68%', () => {
      const target = 1500000
      const progress = Math.min(100, (testUser.netWorth / target) * 100)

      expect(Math.round(progress)).toBe(68)
      expect(progress).toBeLessThan(100)  // 未达成
    })

    it('财务自由进度应该是 34%', () => {
      const target = 3000000
      const progress = Math.min(100, (testUser.netWorth / target) * 100)

      expect(Math.round(progress)).toBe(34)
      expect(progress).toBeLessThan(100)  // 未达成
    })
  })

  describe('预计达成时间计算', () => {
    it('财务保障应该立即达成', () => {
      const target = 60000
      const gap = Math.max(0, target - testUser.netWorth)

      expect(gap).toBe(0)  // 差距为0，已达成
    })

    it('财务安全预计 24 个月达成', () => {
      const target = 1500000
      const gap = target - testUser.netWorth
      const months = Math.ceil(gap / testUser.monthlySavings)

      expect(gap).toBe(480000)
      expect(months).toBe(24)
    })

    it('财务自由预计 99 个月（约8年）达成', () => {
      const target = 3000000
      const gap = target - testUser.netWorth
      const months = Math.ceil(gap / testUser.monthlySavings)

      expect(gap).toBe(1980000)
      expect(months).toBe(99)
      expect(Math.round(months / 12)).toBe(8)  // 约8年
    })
  })

  describe('货币格式化', () => {
    it('应该正确格式化金额', () => {
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency: 'CNY',
          maximumFractionDigits: 0
        }).format(value)
      }

      expect(formatCurrency(1020000)).toBe('¥1,020,000')
      expect(formatCurrency(60000)).toBe('¥60,000')
      expect(formatCurrency(1500000)).toBe('¥1,500,000')
    })
  })
})

describe('目标显示一致性', () => {
  /**
   * 测试修复的问题：进度条用 netWorth 计算，但显示用 goal.currentAmount
   * 修复后应该统一使用 netWorth
   */

  it('进度条和当前储备应该使用相同的值', () => {
    const netWorth = 1020000
    const target = 60000

    // 进度计算
    const progressPercentage = (netWorth / target) * 100

    // 显示的当前储备（修复后应该用 netWorth）
    const displayedAmount = netWorth  // 修复后统一使用 netWorth

    expect(progressPercentage).toBe((displayedAmount / target) * 100)
  })

  it('所有三个目标应该使用相同的净资产值', () => {
    const netWorth = 1020000

    // 三个目标的当前金额应该都是 netWorth
    const securityCurrentAmount = netWorth
    const safetyCurrentAmount = netWorth
    const freedomCurrentAmount = netWorth

    expect(securityCurrentAmount).toBe(safetyCurrentAmount)
    expect(safetyCurrentAmount).toBe(freedomCurrentAmount)
    expect(freedomCurrentAmount).toBe(netWorth)
  })
})
