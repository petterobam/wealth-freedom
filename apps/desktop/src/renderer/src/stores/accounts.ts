import { defineStore } from 'pinia'
import type { Account } from '@wealth-freedom/shared'

export const useAccountStore = defineStore('accounts', {
  state: () => ({
    accounts: [] as Account[],
    loading: false
  }),

  getters: {
    totalAssets: (state) => {
      return state.accounts.reduce((sum, acc) => sum + acc.balance, 0)
    },

    byType: (state) => {
      return (type: Account['type']) => state.accounts.filter(a => a.type === type)
    }
  },

  actions: {
    async fetchAccounts() {
      this.loading = true
      try {
        this.accounts = await window.electronAPI.getAccounts()
      } finally {
        this.loading = false
      }
    },

    async createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
      const account = await window.electronAPI.createAccount(data)
      this.accounts.push(account)
      return account
    },

    async updateAccount(id: string, data: Partial<Account>) {
      const account = await window.electronAPI.updateAccount({ id, ...data })
      if (account) {
        const index = this.accounts.findIndex(a => a.id === id)
        if (index > -1) {
          this.accounts[index] = account
        }
      }
      return account
    },

    async deleteAccount(id: string) {
      const success = await window.electronAPI.deleteAccount(id)
      if (success) {
        this.accounts = this.accounts.filter(a => a.id !== id)
      }
      return success
    }
  }
})
