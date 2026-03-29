import { defineStore } from 'pinia'
import type { Debt } from '@wealth-freedom/shared'

export const useDebtStore = defineStore('debts', {
  state: () => ({
    debts: [] as Debt[],
    loading: false
  }),

  getters: {
    totalDebt: (state) => {
      return state.debts.reduce((sum, d) => sum + d.remainingAmount, 0)
    },

    monthlyPayment: (state) => {
      return state.debts.reduce((sum, d) => sum + d.monthlyPayment, 0)
    },

    consumerDebts: (state) => {
      return state.debts.filter(d => d.type === 'consumer')
    },

    mortgageDebts: (state) => {
      return state.debts.filter(d => d.type === 'mortgage')
    }
  },

  actions: {
    async fetchDebts() {
      this.loading = true
      try {
        this.debts = await window.electronAPI.getDebts()
      } finally {
        this.loading = false
      }
    },

    async createDebt(data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) {
      const debt = await window.electronAPI.createDebt(data)
      this.debts.push(debt)
      return debt
    },

    async updateDebt(id: string, data: Partial<Debt>) {
      const debt = await window.electronAPI.updateDebt({ id, ...data })
      if (debt) {
        const index = this.debts.findIndex(d => d.id === id)
        if (index > -1) {
          this.debts[index] = debt
        }
      }
      return debt
    },

    async deleteDebt(id: string) {
      const success = await window.electronAPI.deleteDebt(id)
      if (success) {
        this.debts = this.debts.filter(d => d.id !== id)
      }
      return success
    }
  }
})
