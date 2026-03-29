/**
 * 目标相关类型定义
 */

export enum GoalType {
  GUARANTEE = 'guarantee',
  SECURITY = 'security',
  FREEDOM = 'freedom',
}

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
}

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  monthlyExpense: number;
  targetDate?: Date;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  [GoalType.GUARANTEE]: '财务保障',
  [GoalType.SECURITY]: '财务安全',
  [GoalType.FREEDOM]: '财务自由',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  [GoalStatus.NOT_STARTED]: '未开始',
  [GoalStatus.IN_PROGRESS]: '进行中',
  [GoalStatus.ACHIEVED]: '已达成',
};

/**
 * 计算财务保障目标金额
 * @param monthlyExpense 月支出
 * @param months 保障月数（默认6个月）
 */
export const calculateGuaranteeTarget = (
  monthlyExpense: number,
  months: number = 6
): number => {
  return monthlyExpense * months;
};

/**
 * 计算财务安全目标金额（150公式）
 * @param monthlyExpense 月支出
 */
export const calculateSecurityTarget = (monthlyExpense: number): number => {
  return monthlyExpense * 150;
};

/**
 * 计算财务自由目标金额
 * @param monthlyExpense 月支出
 * @param dreamMonthlyCost 梦想月成本
 */
export const calculateFreedomTarget = (
  monthlyExpense: number,
  dreamMonthlyCost: number = 0
): number => {
  return (monthlyExpense + dreamMonthlyCost) * 150;
};
