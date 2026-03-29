/**
 * 目标进度计算逻辑
 */

import { Goal, GoalType, GoalStatus } from '../types';

/**
 * 计算目标完成进度
 */
export const calculateGoalProgress = (goal: Goal): number => {
  if (goal.targetAmount <= 0) return 0;
  return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
};

/**
 * 更新目标状态
 */
export const updateGoalStatus = (goal: Goal): GoalStatus => {
  const progress = calculateGoalProgress(goal);

  if (progress >= 100) {
    return GoalStatus.ACHIEVED;
  } else if (goal.currentAmount > 0) {
    return GoalStatus.IN_PROGRESS;
  }
  return GoalStatus.NOT_STARTED;
};

/**
 * 预测目标达成时间
 * @param goal 目标
 * @param monthlySavings 月储蓄额
 */
export const estimateGoalCompletionDate = (
  goal: Goal,
  monthlySavings: number
): Date | null => {
  if (monthlySavings <= 0) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return new Date();

  const monthsNeeded = Math.ceil(remaining / monthlySavings);
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + monthsNeeded);

  return completionDate;
};

/**
 * 计算三阶段目标汇总
 */
export const summarizeGoals = (
  goals: Goal[]
): {
  guarantee: Goal | null;
  security: Goal | null;
  freedom: Goal | null;
} => {
  return {
    guarantee: goals.find((g) => g.type === GoalType.GUARANTEE) || null,
    security: goals.find((g) => g.type === GoalType.SECURITY) || null,
    freedom: goals.find((g) => g.type === GoalType.FREEDOM) || null,
  };
};

/**
 * 格式化目标进度显示
 */
export const formatGoalProgress = (goal: Goal): string => {
  const progress = calculateGoalProgress(goal);
  const current = goal.currentAmount.toLocaleString('zh-CN');
  const target = goal.targetAmount.toLocaleString('zh-CN');

  return `¥${current} / ¥${target} (${progress.toFixed(1)}%)`;
};
