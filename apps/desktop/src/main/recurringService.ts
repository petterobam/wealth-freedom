/**
 * 周期性交易服务 - 核心逻辑
 * 计算下次执行日期 + 自动生成交易
 */

export interface RecurringRule {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  account_id: string;
  category: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval_num: number;
  day_of_week: number | null;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  next_execution: string;
  status: 'active' | 'paused';
  last_execution: string | null;
  notes: string | null;
}

/**
 * 计算下次执行日期
 */
export function getNextExecution(rule: RecurringRule, afterDate: Date): Date {
  const { frequency, interval_num, day_of_week, day_of_month } = rule;
  let next = new Date(afterDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval_num);
      break;

    case 'weekly':
      if (day_of_week !== null && day_of_week !== undefined) {
        // 找到下一个指定星期几
        const currentDay = next.getDay();
        let daysUntil = day_of_week - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        // Apply interval (in weeks)
        if (interval_num > 1) {
          daysUntil += (interval_num - 1) * 7;
        }
        next.setDate(next.getDate() + daysUntil);
      } else {
        next.setDate(next.getDate() + 7 * interval_num);
      }
      break;

    case 'monthly':
      if (day_of_month !== null && day_of_month !== undefined) {
        // 下个月的指定日
        const targetDay = Math.min(day_of_month, 28); // 安全处理月末
        next.setMonth(next.getMonth() + interval_num);
        // 处理月末溢出（如31日在2月）
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(targetDay, maxDay));
      } else {
        next.setMonth(next.getMonth() + interval_num);
      }
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + interval_num);
      break;
  }

  return next;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 计算首次执行日期（基于 start_date 和规则）
 */
export function calculateFirstExecution(rule: Omit<RecurringRule, 'id' | 'next_execution' | 'last_execution' | 'created_at' | 'updated_at'>): string {
  const start = new Date(rule.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 如果开始日期在未来，直接用它
  if (start > today) {
    return formatDate(start);
  }

  // 否则从今天开始计算
  return formatDate(today);
}

/**
 * 检查规则是否已过期
 */
export function isExpired(rule: RecurringRule): boolean {
  if (!rule.end_date) return false;
  const endDate = new Date(rule.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > endDate;
}
