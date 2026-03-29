/**
 * 收入规划相关计算工具函数
 */

import {
  IncomeSource,
  IncomeRecord,
  IncomeAnalysisReport,
  IncomeDashboard,
  FinancialFreedomPrediction,
  IncomeSourceType,
  IncomeTypeCategory,
} from '../types';

/**
 * 计算月收入
 */
export function calculateMonthlyIncome(
  sources: IncomeSource[],
  month?: string
): number {
  return sources
    .filter((s) => s.is_active && isSourceActiveInMonth(s, month))
    .reduce((total, source) => {
      return total + convertToMonthly(source.amount, source.frequency);
    }, 0);
}

/**
 * 将任意频率的收入转换为月收入
 */
export function convertToMonthly(amount: number, frequency: string): number {
  const multipliers: Record<string, number> = {
    once: 0,           // 一次性收入不计入月收入
    daily: 30,
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
    quarterly: 0.33,
    yearly: 0.083,
  };
  return amount * (multipliers[frequency] || 0);
}

/**
 * 检查收入来源在指定月份是否活跃
 */
function isSourceActiveInMonth(
  source: IncomeSource,
  month?: string
): boolean {
  if (!month) return true;

  const targetMonth = new Date(month);
  const startDate = source.start_date ? new Date(source.start_date) : null;
  const endDate = source.end_date ? new Date(source.end_date) : null;

  if (startDate && startDate > targetMonth) return false;
  if (endDate && endDate < targetMonth) return false;

  return true;
}

/**
 * 计算年收入
 */
export function calculateAnnualIncome(
  sources: IncomeSource[],
  records: IncomeRecord[]
): number {
  // 计算来自预估收入的年收
  const estimatedAnnual = sources
    .filter((s) => s.is_active)
    .reduce((total, source) => {
      const monthly = convertToMonthly(source.amount, source.frequency);
      return total + monthly * 12;
    }, 0);

  // 计算来自实际记录的收入（当年）
  const currentYear = new Date().getFullYear();
  const actualAnnual = records
    .filter((r) => new Date(r.date).getFullYear() === currentYear)
    .reduce((total, record) => {
      return total + convertToMonthly(record.amount, record.frequency) * 12;
    }, 0);

  // 返回两者的加权平均（70% 预估 + 30% 实际）
  return estimatedAnnual * 0.7 + actualAnnual * 0.3;
}

/**
 * 计算主动收入 vs 被动收入
 */
export function calculateIncomeStructure(
  sources: IncomeSource[]
): {
  activeIncome: number;
  passiveIncome: number;
  passivePercentage: number;
} {
  const activeIncome = sources
    .filter((s) => s.is_active && s.category === 'active')
    .reduce((total, source) => {
      return total + convertToMonthly(source.amount, source.frequency);
    }, 0);

  const passiveIncome = sources
    .filter((s) => s.is_active && s.category === 'passive')
    .reduce((total, source) => {
      return total + convertToMonthly(source.amount, source.frequency);
    }, 0);

  const totalIncome = activeIncome + passiveIncome;
  const passivePercentage =
    totalIncome > 0 ? (passiveIncome / totalIncome) * 100 : 0;

  return {
    activeIncome,
    passiveIncome,
    passivePercentage,
  };
}

/**
 * 生成收入分析报告
 */
export function generateIncomeAnalysisReport(
  sources: IncomeSource[],
  records: IncomeRecord[]
): IncomeAnalysisReport {
  // 计算总收入
  const monthlyIncome = calculateMonthlyIncome(sources);
  const annualIncome = calculateAnnualIncome(sources, records);

  // 计算收入结构
  const { activeIncome, passiveIncome, passivePercentage } =
    calculateIncomeStructure(sources);

  // 按类型统计收入来源
  const sourceTypes: IncomeSourceType[] = [
    'salary',
    'freelance',
    'investment',
    'product',
    'rent',
    'dividend',
    'interest',
    'commission',
    'business',
    'other',
  ];

  const incomeSources = sourceTypes
    .map((type) => {
      const typeSources = sources.filter(
        (s) => s.type === type && s.is_active
      );
      const amount = typeSources.reduce((total, source) => {
        return total + convertToMonthly(source.amount, source.frequency);
      }, 0);
      return {
        type,
        amount,
        percentage: monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0,
      };
    })
    .filter((s) => s.amount > 0);

  // 计算近 6 个月收入趋势
  const monthlyTrend = calculateMonthlyTrend(records);

  // 计算增长率
  const growthRate = calculateGrowthRate(records);

  // 生成优化建议
  const recommendations = generateRecommendations(
    sources,
    passivePercentage,
    growthRate
  );

  return {
    total_monthly_income: monthlyIncome,
    total_annual_income: annualIncome,
    active_income: activeIncome,
    passive_income: passiveIncome,
    passive_income_percentage: passivePercentage,
    income_sources: incomeSources,
    monthly_trend: monthlyTrend,
    growth_rate: growthRate,
    recommendations,
  };
}

/**
 * 计算近 6 个月收入趋势
 */
function calculateMonthlyTrend(records: IncomeRecord[]): {
  month: string;
  income: number;
  active_income: number;
  passive_income: number;
}[] {
  const trend: {
    month: string;
    income: number;
    active_income: number;
    passive_income: number;
  }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 7); // YYYY-MM

    // 简化处理：这里只计算总收入，主动/被动收入暂时设为 0
    // 实际应用中需要关联 income_sources 来区分主动/被动
    const monthlyIncome = records
      .filter((r) => r.date.startsWith(monthStr))
      .reduce((total, record) => {
        return total + convertToMonthly(record.amount, record.frequency);
      }, 0);

    trend.push({
      month: monthStr,
      income: monthlyIncome,
      active_income: 0, // TODO: 需要关联 income_sources 来计算
      passive_income: 0, // TODO: 需要关联 income_sources 来计算
    });
  }

  return trend;
}

/**
 * 计算增长率
 */
function calculateGrowthRate(records: IncomeRecord[]): {
  monthly: number;
  annual: number;
} {
  if (records.length < 2) {
    return { monthly: 0, annual: 0 };
  }

  // 按日期排序
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 计算最早和最晚 3 个月的平均收入
  const recentRecords = sortedRecords.slice(-3);
  const oldRecords = sortedRecords.slice(0, Math.min(3, sortedRecords.length));

  const recentAvg =
    recentRecords.reduce((sum, r) => sum + convertToMonthly(r.amount, r.frequency), 0) /
    recentRecords.length;
  const oldAvg =
    oldRecords.reduce((sum, r) => sum + convertToMonthly(r.amount, r.frequency), 0) /
    oldRecords.length;

  if (oldAvg === 0) {
    return { monthly: 0, annual: 0 };
  }

  const monthlyGrowthRate = ((recentAvg - oldAvg) / oldAvg) * 100;
  const annualGrowthRate = monthlyGrowthRate * 12;

  return {
    monthly: parseFloat(monthlyGrowthRate.toFixed(2)),
    annual: parseFloat(annualGrowthRate.toFixed(2)),
  };
}

/**
 * 生成优化建议
 */
function generateRecommendations(
  sources: IncomeSource[],
  passivePercentage: number,
  growthRate: { monthly: number; annual: number }
): string[] {
  const recommendations: string[] = [];

  // 被动收入建议
  if (passivePercentage < 30) {
    recommendations.push(
      '被动收入占比较低（低于 30%），建议增加投资或产品化收入'
    );
  } else if (passivePercentage < 50) {
    recommendations.push(
      '被动收入占比中等，继续提升可加速财务自由进程'
    );
  }

  // 增长率建议
  if (growthRate.monthly < 5) {
    recommendations.push(
      '收入增长缓慢，建议职业提升、副业拓展或投资优化'
    );
  } else if (growthRate.monthly > 20) {
    recommendations.push('收入增长强劲，继续保持并注意风险管理');
  }

  // 收入来源多样性建议
  const activeSourceTypes = new Set(
    sources.filter((s) => s.is_active).map((s) => s.type)
  );
  if (activeSourceTypes.size < 2) {
    recommendations.push(
      '收入来源单一，建议多元化以降低风险'
    );
  }

  // 稳定性建议
  const lowStabilitySources = sources.filter(
    (s) => s.is_active && s.stability < 3
  );
  if (lowStabilitySources.length > 0) {
    recommendations.push(
      `有 ${lowStabilitySources.length} 个低稳定性收入来源，建议增加稳定收入`
    );
  }

  return recommendations;
}

/**
 * 生成收入看板数据
 */
export function generateIncomeDashboard(
  sources: IncomeSource[],
  records: IncomeRecord[],
  targetPassivePercentage: number = 50
): IncomeDashboard {
  const currentMonthlyIncome = calculateMonthlyIncome(sources);
  const currentAnnualIncome = calculateAnnualIncome(sources, records);

  // 计算上月收入
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);
  const lastMonthIncome = records
    .filter((r) => r.date.startsWith(lastMonthStr))
    .reduce((total, r) => total + convertToMonthly(r.amount, r.frequency), 0);

  // 计算增长率
  const growthRate =
    lastMonthIncome > 0
      ? ((currentMonthlyIncome - lastMonthIncome) / lastMonthIncome) * 100
      : 0;

  // 计算收入结构
  const { activeIncome, passiveIncome, passivePercentage } =
    calculateIncomeStructure(sources);

  // 收入来源列表
  const sourceList = sources
    .filter((s) => s.is_active)
    .map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      amount: convertToMonthly(source.amount, source.frequency),
      percentage:
        currentMonthlyIncome > 0
          ? (convertToMonthly(source.amount, source.frequency) /
              currentMonthlyIncome) *
            100
          : 0,
      stability: source.stability,
      growth_rate: source.growth_rate,
    }));

  // 收入趋势
  const trend = calculateMonthlyTrend(records);

  return {
    summary: {
      current_monthly_income: currentMonthlyIncome,
      current_annual_income: currentAnnualIncome,
      previous_month_income: lastMonthIncome,
      growth_rate: parseFloat(growthRate.toFixed(2)),
    },
    structure: {
      active_income: activeIncome,
      passive_income: passiveIncome,
      passive_percentage: parseFloat(passivePercentage.toFixed(2)),
      target_percentage: targetPassivePercentage,
    },
    sources: sourceList,
    trend,
  };
}

/**
 * 预测财务自由达成时间
 */
export function predictFinancialFreedom(
  currentNetWorth: number,
  monthlyExpenses: number,
  monthlySavings: number,
  expectedReturnRate: number = 8.0,
  targetMultiplier: number = 150
): FinancialFreedomPrediction {
  // 计算目标金额（月支出 × 150，基于 8% 年化收益）
  const targetAmount = monthlyExpenses * targetMultiplier;

  // 当前进度
  const currentProgress =
    targetAmount > 0 ? (currentNetWorth / targetAmount) * 100 : 0;

  // 使用复利公式计算需要的时间
  // FV = PV × (1 + r)^n + PMT × [(1 + r)^n - 1] / r
  // 其中：PV = 当前净资产，PMT = 每月储蓄，r = 月收益率，n = 月数

  const monthlyReturnRate = expectedReturnRate / 100 / 12; // 月收益率
  const monthlySavingsNet = monthlySavings; // 每月储蓄

  // 二分查找法计算需要的时间
  let low = 0;
  let high = 600; // 最多 50 年
  let months = 0;

  for (let i = 0; i < 1000; i++) {
    const mid = Math.floor((low + high) / 2);
    const futureValue =
      currentNetWorth * Math.pow(1 + monthlyReturnRate, mid) +
      monthlySavingsNet *
        ((Math.pow(1 + monthlyReturnRate, mid) - 1) / monthlyReturnRate);

    if (futureValue >= targetAmount) {
      high = mid;
      months = mid;
    } else {
      low = mid + 1;
    }
  }

  const yearsToFreedom = Math.ceil(months / 12);

  // 计算预计达成日期
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  // 计算不同情景
  const scenarios = {
    conservative: calculateScenario(
      currentNetWorth,
      monthlySavingsNet,
      monthlyExpenses,
      expectedReturnRate * 0.7, // 保守收益率
      targetMultiplier
    ),
    moderate: calculateScenario(
      currentNetWorth,
      monthlySavingsNet,
      monthlyExpenses,
      expectedReturnRate, // 适中收益率
      targetMultiplier
    ),
    optimistic: calculateScenario(
      currentNetWorth,
      monthlySavingsNet,
      monthlyExpenses,
      expectedReturnRate * 1.3, // 乐观收益率
      targetMultiplier
    ),
  };

  return {
    current_net_worth: currentNetWorth,
    monthly_expenses: monthlyExpenses,
    target_amount: targetAmount,
    current_progress: parseFloat(currentProgress.toFixed(2)),
    years_to_freedom: yearsToFreedom,
    target_date: targetDateStr,
    scenarios,
  };
}

/**
 * 计算不同情景
 */
function calculateScenario(
  currentNetWorth: number,
  monthlySavings: number,
  monthlyExpenses: number,
  expectedReturnRate: number,
  targetMultiplier: number
): {
  years: number;
  date: string;
  amount: number;
} {
  const targetAmount = monthlyExpenses * targetMultiplier;
  const monthlyReturnRate = expectedReturnRate / 100 / 12;

  // 二分查找
  let low = 0;
  let high = 600;
  let months = 0;

  for (let i = 0; i < 1000; i++) {
    const mid = Math.floor((low + high) / 2);
    const futureValue =
      currentNetWorth * Math.pow(1 + monthlyReturnRate, mid) +
      monthlySavings *
        ((Math.pow(1 + monthlyReturnRate, mid) - 1) / monthlyReturnRate);

    if (futureValue >= targetAmount) {
      high = mid;
      months = mid;
    } else {
      low = mid + 1;
    }
  }

  const years = Math.ceil(months / 12);
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  const finalAmount =
    currentNetWorth * Math.pow(1 + monthlyReturnRate, months) +
    monthlySavings *
      ((Math.pow(1 + monthlyReturnRate, months) - 1) / monthlyReturnRate);

  return {
    years,
    date: targetDate.toISOString().slice(0, 10),
    amount: parseFloat(finalAmount.toFixed(2)),
  };
}

/**
 * 模拟收入增长
 */
export function simulateIncomeGrowth(
  currentMonthlyIncome: number,
  activeGrowthRate: number,
  passiveGrowthRate: number,
  years: number,
  newIncomeSources: { amount: number; category: 'active' | 'passive'; startMonth: number }[]
): {
  year: number;
  monthly_income: number;
  annual_income: number;
  active_income: number;
  passive_income: number;
}[] {
  const results = [];
  let activeIncome = currentMonthlyIncome * 0.7; // 假设 70% 为主动收入
  let passiveIncome = currentMonthlyIncome * 0.3; // 假设 30% 为被动收入

  for (let year = 1; year <= years; year++) {
    // 每年增长
    for (let month = 1; month <= 12; month++) {
      const totalMonth = (year - 1) * 12 + month;

      // 主动收入增长
      activeIncome *= 1 + activeGrowthRate / 100 / 12;

      // 被动收入增长
      passiveIncome *= 1 + passiveGrowthRate / 100 / 12;

      // 添加新收入来源
      newIncomeSources.forEach((source) => {
        if (source.startMonth === totalMonth) {
          if (source.category === 'active') {
            activeIncome += source.amount;
          } else {
            passiveIncome += source.amount;
          }
        }
      });
    }

    const monthlyIncome = activeIncome + passiveIncome;
    const annualIncome = monthlyIncome * 12;

    results.push({
      year,
      monthly_income: parseFloat(monthlyIncome.toFixed(2)),
      annual_income: parseFloat(annualIncome.toFixed(2)),
      active_income: parseFloat(activeIncome.toFixed(2)),
      passive_income: parseFloat(passiveIncome.toFixed(2)),
    });
  }

  return results;
}
