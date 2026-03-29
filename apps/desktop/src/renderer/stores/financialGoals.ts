/**
 * 财务自由三阶段目标配置
 *
 * 财务保障：拥有 6 个月的生活储备金，不被意外击倒
 * 财务安全：靠投资利息覆盖日常支出，不再被迫工作
 * 财务自由：靠利息实现梦想生活，本金永不动用
 */

interface FinancialGoals {
  // 财务保障目标（元）
  guarantee: number

  // 财务安全目标（元）
  safety: number

  // 财务自由目标（元）
  freedom: number

  // 计算说明
  guaranteeNote: string
  safetyNote: string
  freedomNote: string
}

/**
 * 默认财务目标配置
 * 基于用户的财务现状（月支出 10,000 元）
 */
export const financialGoals: FinancialGoals = {
  // 财务保障：6 个月生活支出
  guarantee: 60000,
  guaranteeNote: '6 个月生活支出 = 10,000 × 6',

  // 财务安全：150 倍月支出（基于 8% 年化收益率）
  safety: 1500000,
  safetyNote: '150 倍月支出 = 10,000 × 150（基于 8% 年化收益）',

  // 财务自由：300 倍月支出（覆盖梦想生活）
  freedom: 3000000,
  freedomNote: '梦想生活成本 20,000/月 × 150 = 3,000,000'
}

/**
 * 根据月支出动态计算财务目标
 *
 * @param monthlyExpense 月支出（元）
 * @returns 财务三阶段目标
 */
export function calculateFinancialGoals(monthlyExpense: number): FinancialGoals {
  return {
    // 财务保障：6 个月生活支出
    guarantee: monthlyExpense * 6,
    guaranteeNote: `6 个月生活支出 = ${monthlyExpense.toLocaleString()} × 6`,

    // 财务安全：150 倍月支出（基于 8% 年化收益率）
    safety: monthlyExpense * 150,
    safetyNote: `150 倍月支出 = ${monthlyExpense.toLocaleString()} × 150（基于 8% 年化收益）`,

    // 财务自由：300 倍月支出（覆盖梦想生活）
    freedom: monthlyExpense * 300,
    freedomNote: `梦想生活成本 ${(monthlyExpense * 2).toLocaleString()}/月 × 150 = ${(monthlyExpense * 300).toLocaleString()}`
  }
}

/**
 * 更新财务目标（用于未来用户自定义功能）
 *
 * @param goals 新的财务目标
 */
export function updateFinancialGoals(goals: Partial<FinancialGoals>): void {
  if (goals.guarantee !== undefined) {
    financialGoals.guarantee = goals.guarantee
  }
  if (goals.safety !== undefined) {
    financialGoals.safety = goals.safety
  }
  if (goals.freedom !== undefined) {
    financialGoals.freedom = goals.freedom
  }
}
