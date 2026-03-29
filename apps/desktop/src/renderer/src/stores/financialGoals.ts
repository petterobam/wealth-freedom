/**
 * 财务自由三阶段目标配置
 * 基于用户月支出计算
 */

/**
 * 用户财务配置
 * TODO: 从用户设置读取
 */
const userConfig = {
  monthlyExpense: 10000,  // 月支出
  expectedReturnRate: 8,  // 预期年化收益率
  guaranteeMonths: 6      // 保障月数
}

/**
 * 计算财务保障目标
 * 公式：月支出 × 保障月数（6~12个月）
 */
function calculateGuaranteeGoal(monthlyExpense: number, guaranteeMonths: number): number {
  return monthlyExpense * guaranteeMonths
}

/**
 * 计算财务安全目标
 * 公式：月支出 × 150（基于8%年化收益率，12 ÷ 8% ≈ 150）
 */
function calculateSafetyGoal(monthlyExpense: number): number {
  return monthlyExpense * 150
}

/**
 * 计算财务自由目标
 * 公式：梦想月成本 × 150
 * 暂时使用 2 × 月支出作为梦想月成本
 */
function calculateFreedomGoal(monthlyExpense: number): number {
  return monthlyExpense * 2 * 150
}

/**
 * 财务三阶段目标
 */
export const financialGoals = {
  /**
   * 财务保障目标
   * 拥有 6~12 个月的生活储备金，不被意外击倒
   */
  guarantee: calculateGuaranteeGoal(userConfig.monthlyExpense, userConfig.guaranteeMonths),

  /**
   * 财务安全目标
   * 靠投资利息覆盖日常支出，不再被迫工作
   */
  safety: calculateSafetyGoal(userConfig.monthlyExpense),

  /**
   * 财务自由目标
   * 靠利息实现梦想生活，本金永不动用
   */
  freedom: calculateFreedomGoal(userConfig.monthlyExpense)
}

/**
 * 更新用户配置
 * TODO: 实现用户自定义功能
 */
export function updateFinancialGoals(config: Partial<typeof userConfig>) {
  Object.assign(userConfig, config)

  // 重新计算目标
  financialGoals.guarantee = calculateGuaranteeGoal(userConfig.monthlyExpense, userConfig.guaranteeMonths)
  financialGoals.safety = calculateSafetyGoal(userConfig.monthlyExpense)
  financialGoals.freedom = calculateFreedomGoal(userConfig.monthlyExpense)
}

/**
 * 获取财务目标配置
 */
export function getFinancialGoals() {
  return {
    guarantee: financialGoals.guarantee,
    safety: financialGoals.safety,
    freedom: financialGoals.freedom,
    config: { ...userConfig }
  }
}
