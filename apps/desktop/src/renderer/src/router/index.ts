import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: '财务看板' }
    },
    {
      path: '/goals',
      name: 'Goals',
      component: () => import('@/views/Goals.vue'),
      meta: { title: '目标追踪' }
    },
    {
      path: '/transactions',
      name: 'Transactions',
      component: () => import('@/views/Transactions.vue'),
      meta: { title: '收支记录' }
    },
    {
      path: '/accounts',
      name: 'Accounts',
      component: () => import('@/views/Accounts.vue'),
      meta: { title: '账户管理' }
    },
    {
      path: '/debts',
      name: 'Debts',
      component: () => import('@/views/Debts.vue'),
      meta: { title: '负债管理' }
    },
    {
      path: '/dreams',
      name: 'Dreams',
      component: () => import('@/views/Dreams.vue'),
      meta: { title: '梦想图册' }
    },
    {
      path: '/calculator',
      name: 'Calculator',
      component: () => import('@/views/Calculator.vue'),
      meta: { title: '复利计算器' }
    },
    {
      path: '/prepayment-calculator',
      name: 'PrepaymentCalculator',
      component: () => import('@/views/PrepaymentCalculator.vue'),
      meta: { title: '提前还款计算器' }
    },
    {
      path: '/retirement-planner',
      name: 'RetirementPlanner',
      component: () => import('@/views/RetirementPlanner.vue'),
      meta: { title: '退休规划工具' }
    },
    {
      path: '/large-expense-planner',
      name: 'LargeExpensePlanner',
      component: () => import('@/views/LargeExpensePlanner.vue'),
      meta: { title: '大额支出规划' }
    },
    {
      path: '/scenario-simulator',
      name: 'ScenarioSimulator',
      component: () => import('@/views/ScenarioSimulator.vue'),
      meta: { title: '情景模拟' }
    },
    {
      path: '/asset-allocation',
      name: 'AssetAllocation',
      component: () => import('@/views/AssetAllocation.vue'),
      meta: { title: '资产配置可视化' }
    },
    {
      path: '/income-dashboard',
      name: 'IncomeDashboard',
      component: () => import('@/views/IncomeDashboard.vue'),
      meta: { title: '收入看板' }
    },
    {
      path: '/income-goals',
      name: 'IncomeGoals',
      component: () => import('@/views/IncomeGoals.vue'),
      meta: { title: '收入目标' }
    },
    {
      path: '/income-analysis',
      name: 'IncomeAnalysis',
      component: () => import('@/views/IncomeAnalysis.vue'),
      meta: { title: '收入分析' }
    },
    {
      path: '/income-strategies',
      name: 'IncomeStrategies',
      component: () => import('@/views/IncomeStrategies.vue'),
      meta: { title: '收入策略' }
    },
    {
      path: '/income-actions',
      name: 'IncomeActions',
      component: () => import('@/views/IncomeActions.vue'),
      meta: { title: '收入行动计划' }
    },
    {
      path: '/investment',
      name: 'Investment',
      component: () => import('@/views/Investment.vue'),
      meta: { title: '投资追踪' }
    },
    {
      path: '/budget',
      name: 'Budget',
      component: () => import('@/views/Budget.vue'),
      meta: { title: '预算管理' }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置' }
    }
  ]
})

export default router
