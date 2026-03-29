import { defineStore } from 'pinia'
import type {
  IncomeSource,
  IncomeRecord,
  IncomeGoal,
  IncomeStrategy,
  IncomeAction
} from '@wealth-freedom/shared'

export const useIncomeStore = defineStore('income', {
  state: () => ({
    incomeSources: [] as IncomeSource[],
    incomeRecords: [] as IncomeRecord[],
    incomeGoals: [] as IncomeGoal[],
    incomeStrategies: [] as IncomeStrategy[],
    incomeActions: [] as IncomeAction[],
    loading: false
  }),

  getters: {
    // 主动收入分类（工资、兼职、其他）
    activeIncomeCategories: () => [
      'salary',      // 工资收入
      'freelance',   // 兼职/自由职业
      'other'        // 其他主动收入
    ],

    // 被动收入分类（投资收益、分红、利息、产品收入、租金、版税、其他被动收入）
    passiveIncomeCategories: () => [
      'investment',  // 投资收益
      'dividend',    // 分红
      'interest',    // 利息
      'product',     // 产品收入（软件、课程等）
      'rent',        // 租金收入
      'commission',  // 佣金
      'business',    // 创业收入
      'other'        // 其他被动收入
    ],

    // 本月总收入（基于收入记录）
    currentMonthTotalIncome: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return state.incomeRecords
        .filter(r => new Date(r.date) >= monthStart)
        .reduce((sum, r) => sum + r.amount, 0)
    },

    // 本月预估总收入（基于收入来源）
    currentMonthEstimatedIncome: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return state.incomeSources
        .filter(s => s.is_active && new Date(s.start_date || '0') <= now && new Date(s.end_date || '9999-12-31') >= now)
        .reduce((sum, s) => {
          const multipliers: Record<string, number> = {
            once: 0,
            daily: 30,
            weekly: 4.33,
            biweekly: 2.17,
            monthly: 1,
            quarterly: 0.33,
            yearly: 0.083
          }
          return sum + s.amount * (multipliers[s.frequency] || 0)
        }, 0)
    },

    // 本月主动收入
    currentMonthActiveIncome: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const activeCategories = ['salary', 'freelance', 'other']
      return state.incomeRecords
        .filter(r => {
          const source = state.incomeSources.find(s => s.id === r.source_id)
          return source && activeCategories.includes(source.type) && new Date(r.date) >= monthStart
        })
        .reduce((sum, r) => sum + r.amount, 0)
    },

    // 本月被动收入
    currentMonthPassiveIncome: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const passiveCategories = ['investment', 'dividend', 'interest', 'product', 'rent', 'commission', 'business']
      return state.incomeRecords
        .filter(r => {
          const source = state.incomeSources.find(s => s.id === r.source_id)
          return source && passiveCategories.includes(source.type) && new Date(r.date) >= monthStart
        })
        .reduce((sum, r) => sum + r.amount, 0)
    },

    // 本月收入按来源分类汇总
    currentMonthIncomeBySource: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const categoryNames: Record<string, string> = {
        salary: '工资收入',
        freelance: '兼职收入',
        investment: '投资收益',
        dividend: '分红',
        interest: '利息',
        product: '产品收入',
        rent: '租金收入',
        commission: '佣金',
        business: '创业收入',
        other: '其他收入'
      }

      const sourceMap = new Map<string, number>()

      state.incomeRecords
        .filter(r => new Date(r.date) >= monthStart)
        .forEach(record => {
          const source = state.incomeSources.find(s => s.id === r.source_id)
          if (source) {
            const current = sourceMap.get(source.type) || 0
            sourceMap.set(source.type, current + record.amount)
          }
        })

      return Array.from(sourceMap.entries())
        .map(([category, amount]) => ({
          category,
          name: categoryNames[category] || category,
          amount
        }))
        .sort((a, b) => b.amount - a.amount)
    },

    // 近6个月收入趋势
    last6MonthsIncomeTrend: (state) => {
      const trend: Array<{ month: string; active: number; passive: number }> = []

      const activeCategories = ['salary', 'freelance', 'other']
      const passiveCategories = ['investment', 'dividend', 'interest', 'product', 'rent', 'commission', 'business']

      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const monthRecords = state.incomeRecords.filter(r => {
          const recordDate = new Date(r.date)
          return recordDate >= monthStart && recordDate <= monthEnd
        })

        const active = monthRecords
          .filter(r => {
            const source = state.incomeSources.find(s => s.id === r.source_id)
            return source && activeCategories.includes(source.type)
          })
          .reduce((sum, r) => sum + r.amount, 0)

        const passive = monthRecords
          .filter(r => {
            const source = state.incomeSources.find(s => s.id === r.source_id)
            return source && passiveCategories.includes(source.type)
          })
          .reduce((sum, r) => sum + r.amount, 0)

        trend.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          active,
          passive
        })
      }

      return trend
    },

    // 获取活跃的收入目标
    activeGoals: (state) => {
      const now = new Date()
      return state.incomeGoals
        .filter(goal =>
          goal.status === 'in_progress' &&
          (!goal.target_date || new Date(goal.target_date) > now)
        )
        .sort((a, b) => {
          if (!a.target_date) return 1
          if (!b.target_date) return -1
          return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
        })
    },

    // 获取总收入目标的完成进度
    totalIncomeGoalProgress: (state) => {
      const totalGoal = state.incomeGoals.find(g => g.type === 'total' && g.target_amount)
      if (!totalGoal || !totalGoal.target_amount) return null

      const currentAmount = state.currentMonthTotalIncome
      const progress = (currentAmount / totalGoal.target_amount) * 100

      return {
        goal: totalGoal,
        currentAmount,
        progress
      }
    },

    // 获取被动收入占比目标的完成进度
    passiveIncomeGoalProgress: (state) => {
      const passiveGoal = state.incomeGoals.find(g => g.type === 'structure' && g.target_percentage)
      if (!passiveGoal || !passiveGoal.target_percentage) return null

      const currentTotal = state.currentMonthTotalIncome
      const currentPassive = state.currentMonthPassiveIncome
      const currentRatio = currentTotal > 0 ? (currentPassive / currentTotal) * 100 : 0
      const progress = (currentRatio / passiveGoal.target_percentage) * 100

      return {
        goal: passiveGoal,
        currentRatio,
        progress
      }
    }
  },

  actions: {
    // 加载收入来源
    async loadIncomeSources() {
      this.loading = true
      try {
        this.incomeSources = await window.electronAPI.getIncomeSources()
      } finally {
        this.loading = false
      }
    },

    // 加载收入记录
    async loadIncomeRecords(filter?: { startDate?: string; endDate?: string }) {
      this.loading = true
      try {
        this.incomeRecords = await window.electronAPI.getIncomeRecords(filter)
      } finally {
        this.loading = false
      }
    },

    // 加载收入目标
    async loadIncomeGoals() {
      try {
        this.incomeGoals = await window.electronAPI.getIncomeGoals()
      } catch (error) {
        console.error('Failed to load income goals:', error)
      }
    },

    // 加载收入策略
    async loadIncomeStrategies() {
      try {
        this.incomeStrategies = await window.electronAPI.getIncomeStrategies()
      } catch (error) {
        console.error('Failed to load income strategies:', error)
      }
    },

    // 加载收入行动计划
    async loadIncomeActions(filter?: { status?: string; strategyId?: string }) {
      try {
        this.incomeActions = await window.electronAPI.getIncomeActions(filter)
      } catch (error) {
        console.error('Failed to load income actions:', error)
      }
    },

    // 创建收入来源
    async createIncomeSource(data: Omit<IncomeSource, 'id' | 'created_at' | 'updated_at'>) {
      const source = await window.electronAPI.createIncomeSource(data)
      this.incomeSources.unshift(source)
      return source
    },

    // 更新收入来源
    async updateIncomeSource(id: string, data: Partial<IncomeSource>) {
      const source = await window.electronAPI.updateIncomeSource(id, data)
      if (source) {
        const index = this.incomeSources.findIndex(s => s.id === id)
        if (index > -1) {
          this.incomeSources[index] = source
        }
      }
      return source
    },

    // 删除收入来源
    async deleteIncomeSource(id: string) {
      const success = await window.electronAPI.deleteIncomeSource(id)
      if (success) {
        this.incomeSources = this.incomeSources.filter(s => s.id !== id)
      }
      return success
    },

    // 创建收入记录
    async createIncomeRecord(data: Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>) {
      const record = await window.electronAPI.createIncomeRecord(data)
      this.incomeRecords.unshift(record)
      return record
    },

    // 更新收入记录
    async updateIncomeRecord(id: string, data: Partial<IncomeRecord>) {
      const record = await window.electronAPI.updateIncomeRecord(id, data)
      if (record) {
        const index = this.incomeRecords.findIndex(r => r.id === id)
        if (index > -1) {
          this.incomeRecords[index] = record
        }
      }
      return record
    },

    // 删除收入记录
    async deleteIncomeRecord(id: string) {
      const success = await window.electronAPI.deleteIncomeRecord(id)
      if (success) {
        this.incomeRecords = this.incomeRecords.filter(r => r.id !== id)
      }
      return success
    },

    // 创建收入目标
    async createIncomeGoal(data: Omit<IncomeGoal, 'id' | 'created_at' | 'updated_at'>) {
      const goal = await window.electronAPI.createIncomeGoal(data)
      this.incomeGoals.push(goal)
      return goal
    },

    // 更新收入目标
    async updateIncomeGoal(id: string, data: Partial<IncomeGoal>) {
      const goal = await window.electronAPI.updateIncomeGoal(id, data)
      if (goal) {
        const index = this.incomeGoals.findIndex(g => g.id === id)
        if (index > -1) {
          this.incomeGoals[index] = goal
        }
      }
      return goal
    },

    // 删除收入目标
    async deleteIncomeGoal(id: string) {
      const success = await window.electronAPI.deleteIncomeGoal(id)
      if (success) {
        this.incomeGoals = this.incomeGoals.filter(g => g.id !== id)
      }
      return success
    },

    // 创建收入策略
    async createIncomeStrategy(data: Omit<IncomeStrategy, 'id' | 'created_at' | 'updated_at'>) {
      const strategy = await window.electronAPI.createIncomeStrategy(data)
      this.incomeStrategies.push(strategy)
      return strategy
    },

    // 更新收入策略
    async updateIncomeStrategy(id: string, data: Partial<IncomeStrategy>) {
      const strategy = await window.electronAPI.updateIncomeStrategy(id, data)
      if (strategy) {
        const index = this.incomeStrategies.findIndex(s => s.id === id)
        if (index > -1) {
          this.incomeStrategies[index] = strategy
        }
      }
      return strategy
    },

    // 删除收入策略
    async deleteIncomeStrategy(id: string) {
      const success = await window.electronAPI.deleteIncomeStrategy(id)
      if (success) {
        this.incomeStrategies = this.incomeStrategies.filter(s => s.id !== id)
      }
      return success
    },

    // 应用收入策略
    async applyIncomeStrategy(id: string) {
      const result = await window.electronAPI.applyIncomeStrategy(id)
      if (result) {
        const strategy = this.incomeStrategies.find(s => s.id === id)
        if (strategy) {
          strategy.applied = true
        }
        // 重新加载行动计划
        await this.loadIncomeActions()
      }
      return result
    },

    // 创建收入行动计划
    async createIncomeAction(data: Omit<IncomeAction, 'id' | 'created_at' | 'updated_at'>) {
      const action = await window.electronAPI.createIncomeAction(data)
      this.incomeActions.push(action)
      return action
    },

    // 更新收入行动计划
    async updateIncomeAction(id: string, data: Partial<IncomeAction>) {
      const action = await window.electronAPI.updateIncomeAction(id, data)
      if (action) {
        const index = this.incomeActions.findIndex(a => a.id === id)
        if (index > -1) {
          this.incomeActions[index] = action
        }
      }
      return action
    },

    // 删除收入行动计划
    async deleteIncomeAction(id: string) {
      const success = await window.electronAPI.deleteIncomeAction(id)
      if (success) {
        this.incomeActions = this.incomeActions.filter(a => a.id !== id)
      }
      return success
    },

    // 获取收入看板数据
    async getIncomeDashboard(params?: any) {
      try {
        return await window.electronAPI.getIncomeDashboard(params)
      } catch (error) {
        console.error('Failed to get income dashboard:', error)
        return null
      }
    },

    // 获取收入分析报告
    async getIncomeAnalysis() {
      try {
        return await window.electronAPI.getIncomeAnalysis()
      } catch (error) {
        console.error('Failed to get income analysis:', error)
        return null
      }
    },

    // 获取收入结构
    async getIncomeStructure() {
      try {
        return await window.electronAPI.getIncomeStructure()
      } catch (error) {
        console.error('Failed to get income structure:', error)
        return null
      }
    },

    // 模拟收入增长
    async simulateIncome(params: any) {
      try {
        return await window.electronAPI.simulateIncome(params)
      } catch (error) {
        console.error('Failed to simulate income:', error)
        return null
      }
    },

    // 获取收入模拟列表
    async getIncomeSimulations() {
      try {
        return await window.electronAPI.getIncomeSimulations()
      } catch (error) {
        console.error('Failed to get income simulations:', error)
        return []
      }
    },

    // 创建收入模拟
    async createIncomeSimulation(data: any) {
      try {
        return await window.electronAPI.createIncomeSimulation(data)
      } catch (error) {
        console.error('Failed to create income simulation:', error)
        return null
      }
    },

    // 删除收入模拟
    async deleteIncomeSimulation(id: string) {
      try {
        return await window.electronAPI.deleteIncomeSimulation(id)
      } catch (error) {
        console.error('Failed to delete income simulation:', error)
        return false
      }
    },

    // 预测财务自由
    async predictFinancialFreedom(params: any) {
      try {
        return await window.electronAPI.predictFinancialFreedom(params)
      } catch (error) {
        console.error('Failed to predict financial freedom:', error)
        return null
      }
    },

    // 获取本月收入数据（用于 Dashboard）
    getCurrentMonthIncome() {
      return {
        active: this.currentMonthActiveIncome,
        passive: this.currentMonthPassiveIncome
      }
    },

    // 获取上月收入数据（用于对比）
    getLastMonthIncome() {
      const now = new Date()
      now.setMonth(now.getMonth() - 1)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const activeCategories = ['salary', 'freelance', 'other']
      const passiveCategories = ['investment', 'dividend', 'interest', 'product', 'rent', 'commission', 'business']

      const monthRecords = this.incomeRecords.filter(r => {
        const recordDate = new Date(r.date)
        return recordDate >= monthStart && recordDate <= monthEnd
      })

      const active = monthRecords
        .filter(r => {
          const source = this.incomeSources.find(s => s.id === r.source_id)
          return source && activeCategories.includes(source.type)
        })
        .reduce((sum, r) => sum + r.amount, 0)

      const passive = monthRecords
        .filter(r => {
          const source = this.incomeSources.find(s => s.id === r.source_id)
          return source && passiveCategories.includes(source.type)
        })
        .reduce((sum, r) => sum + r.amount, 0)

      return { active, passive }
    },

    // 获取本月收入按来源分布
    getCurrentMonthIncomeBySource() {
      return this.currentMonthIncomeBySource
    },

    // 获取近6个月收入趋势
    getLast6MonthsIncomeTrend() {
      return this.last6MonthsIncomeTrend
    }
  }
})

// 类型定义补充
export interface MonthlyIncomeSummary {
  month: string
  active: number
  passive: number
}

export interface IncomeSourceSummary {
  category: string
  name: string
  amount: number
  percentage?: string
}
