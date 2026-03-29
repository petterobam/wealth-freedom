/**
 * 梦想相关类型定义
 */

export interface Dream {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string;
  estimatedCost: number;
  monthlyCost: number;
  priority: number;
  isAchieved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: '最高',
  2: '高',
  3: '中',
  4: '低',
  5: '最低',
};
