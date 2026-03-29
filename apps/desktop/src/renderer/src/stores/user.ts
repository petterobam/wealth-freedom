import { defineStore } from 'pinia'
import type { User } from '@wealth-freedom/shared'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null
  }),

  actions: {
    setUser(user: User) {
      this.user = user
    },

    async fetchUser() {
      const user = await window.electronAPI.getUser()
      if (user) {
        this.user = user
      }
      return user
    },

    async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
      const user = await window.electronAPI.createUser(data)
      this.user = user
      return user
    },

    async updateUser(id: string, data: Partial<User>) {
      const user = await window.electronAPI.updateUser({ id, ...data })
      if (user) {
        this.user = user
      }
      return user
    }
  }
})
