import { defineStore } from 'pinia'
import type { Goal } from '@wealth-freedom/shared'

export const useGoalStore = defineStore('goals', {
  state: () => ({
    goals: [] as Goal[],
    loading: false
  }),

  getters: {
    securityGoal: (state) => {
      return state.goals.find(g => g.stage === 'security') || null
    },

    safetyGoal: (state) => {
      return state.goals.find(g => g.stage === 'safety') || null
    },

    freedomGoal: (state) => {
      return state.goals.find(g => g.stage === 'freedom') || null
    }
  },

  actions: {
    async fetchGoals() {
      this.loading = true
      try {
        this.goals = await window.electronAPI.getGoals()
      } finally {
        this.loading = false
      }
    },

    async createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
      const goal = await window.electronAPI.createGoal(data)
      this.goals.push(goal)
      return goal
    },

    async updateGoal(id: string, data: Partial<Goal>) {
      const goal = await window.electronAPI.updateGoal({ id, ...data })
      if (goal) {
        const index = this.goals.findIndex(g => g.id === id)
        if (index > -1) {
          this.goals[index] = goal
        }
      }
      return goal
    }
  }
})
