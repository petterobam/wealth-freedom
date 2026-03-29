import { defineStore } from 'pinia'
import type { Transaction } from '@wealth-freedom/shared'

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [] as Transaction[],
    loading: false
  }),

  getters: {
    income: (state) => {
      return state.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
    },

    expense: (state) => {
      return state.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    },

    monthlyIncome: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return state.transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + t.amount, 0)
    },

    monthlyExpense: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return state.transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + t.amount, 0)
    },

    // 被动收入分类（投资收益、产品收入、租金、版税等）
    passiveIncomeCategories: () => [
      'investment',    // 投资收益
      'dividend',      // 分红
      'interest',      // 利息
      'product',       // 产品收入（软件、课程等）
      'rental',        // 租金
      'royalty',       // 版税
      'passive'        // 其他被动收入
    ],

    // 本月被动收入
    monthlyPassiveIncome: (state) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const passiveCategories = [
        'investment', 'dividend', 'interest', 'product', 'rental', 'royalty', 'passive'
      ]
      return state.transactions
        .filter(t =>
          t.type === 'income' &&
          passiveCategories.includes(t.category) &&
          new Date(t.date) >= monthStart
        )
        .reduce((sum, t) => sum + t.amount, 0)
    }
  },

  actions: {
    async fetchTransactions(filter?: { startDate?: string; endDate?: string }) {
      this.loading = true
      try {
        this.transactions = await window.electronAPI.getTransactions(filter)
      } finally {
        this.loading = false
      }
    },

    async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
      const transaction = await window.electronAPI.createTransaction(data)
      this.transactions.unshift(transaction)
      return transaction
    },

    async updateTransaction(id: string, data: Partial<Transaction>) {
      const transaction = await window.electronAPI.updateTransaction({ id, ...data })
      if (transaction) {
        const index = this.transactions.findIndex(t => t.id === id)
        if (index > -1) {
          this.transactions[index] = transaction
        }
      }
      return transaction
    },

    async deleteTransaction(id: string) {
      const success = await window.electronAPI.deleteTransaction(id)
      if (success) {
        this.transactions = this.transactions.filter(t => t.id !== id)
      }
      return success
    }
  }
})
