/**
 * 财务基准对比服务 - 与行业标准对比用户财务数据
 * v1.4.0 - 本地基准数据，无需云端
 */

export interface BenchmarkItem {
  key: string
  label: string
  userValue: number
  benchmarkValue: number
  unit: string
  level: 'excellent' | 'good' | 'warning' | 'danger'
  description: string
}

export interface BenchmarkCategory {
  name: string
  icon: string
  items: BenchmarkItem[]
  score: number // 0-100
}

// 中国城市居民财务基准数据（基于公开统计 + 理财规划最佳实践）
const BENCHMARKS = {
  // 储蓄相关
  savingsRate: { excellent: 40, good: 25, average: 15, poor: 5 },
  emergencyFundMonths: { excellent: 12, good: 6, average: 3, poor: 1 },
  
  // 支出相关
  housingRatio: { excellent: 0.25, good: 0.30, average: 0.40, poor: 0.50 },
  foodRatio: { excellent: 0.10, good: 0.15, average: 0.25, poor: 0.35 },
  transportRatio: { excellent: 0.05, good: 0.10, average: 0.15, poor: 0.20 },
  entertainmentRatio: { excellent: 0.05, good: 0.10, average: 0.15, poor: 0.20 },
  
  // 债务相关
  debtToIncome: { excellent: 0.20, good: 0.35, average: 0.50, poor: 0.70 },
  debtToAsset: { excellent: 0.10, good: 0.30, average: 0.50, poor: 0.70 },
  
  // 投资相关
  investmentRatio: { excellent: 0.50, good: 0.30, average: 0.15, poor: 0.05 },
  diversificationScore: { excellent: 80, good: 60, average: 40, poor: 20 },
  
  // 净资产（30岁城市白领参考）
  netWorthByAge: {
    25: 100000,
    30: 500000,
    35: 1000000,
    40: 2000000,
    45: 3500000,
    50: 5000000
  }
}

function getLevel(value: number, benchmark: Record<string, number>, higherBetter: boolean): BenchmarkItem['level'] {
  if (higherBetter) {
    if (value >= benchmark.excellent) return 'excellent'
    if (value >= benchmark.good) return 'good'
    if (value >= benchmark.average) return 'warning'
    return 'danger'
  } else {
    if (value <= benchmark.excellent) return 'excellent'
    if (value <= benchmark.good) return 'good'
    if (value <= benchmark.average) return 'warning'
    return 'danger'
  }
}

/**
 * 计算用户财务基准对比
 */
export function calculateBenchmarks(data: {
  monthlyIncome: number
  monthlyExpense: number
  totalAssets: number
  totalDebt: number
  totalInvestment: number
  housingExpense: number
  foodExpense: number
  transportExpense: number
  entertainmentExpense: number
  age?: number
}): BenchmarkCategory[] {
  const categories: BenchmarkCategory[] = []
  const { monthlyIncome, monthlyExpense, totalAssets, totalDebt, totalInvestment,
    housingExpense, foodExpense, transportExpense, entertainmentExpense } = data

  // 1. 储蓄能力
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0
  const savingsLevel = getLevel(savingsRate, BENCHMARKS.savingsRate, true)
  
  const emergencyFund = monthlyExpense > 0 ? (totalAssets - totalDebt) / monthlyExpense : 0
  const emergencyLevel = getLevel(emergencyFund, BENCHMARKS.emergencyFundMonths, true)

  categories.push({
    name: '储蓄能力',
    icon: '🐷',
    score: savingsLevel === 'excellent' ? 95 : savingsLevel === 'good' ? 80 : savingsLevel === 'warning' ? 60 : 35,
    items: [
      {
        key: 'savingsRate', label: '储蓄率',
        userValue: Math.round(savingsRate * 10) / 10,
        benchmarkValue: BENCHMARKS.savingsRate.good,
        unit: '%',
        level: savingsLevel,
        description: savingsLevel === 'excellent' 
          ? '储蓄率优秀！远超大多数人' 
          : savingsLevel === 'good' 
            ? '储蓄习惯良好，继续保持' 
            : savingsLevel === 'warning' 
              ? '建议将储蓄率提升至25%以上' 
              : '储蓄率过低，建议检视支出结构'
      },
      {
        key: 'emergencyFund', label: '应急储备',
        userValue: Math.round(emergencyFund * 10) / 10,
        benchmarkValue: BENCHMARKS.emergencyFundMonths.good,
        unit: '个月',
        level: emergencyLevel,
        description: emergencyLevel === 'excellent'
          ? '应急储备充足，不惧突发'
          : emergencyLevel === 'good'
            ? '应急储备达标，安全感不错'
            : emergencyLevel === 'warning'
              ? '建议储备6个月生活费的应急金'
              : '应急储备不足，风险较高'
      }
    ]
  })

  // 2. 支出结构
  const housingRatio = monthlyIncome > 0 ? housingExpense / monthlyIncome : 0
  const foodRatio = monthlyIncome > 0 ? foodExpense / monthlyIncome : 0
  const transportRatio = monthlyIncome > 0 ? transportExpense / monthlyIncome : 0
  const entertainmentRatio = monthlyIncome > 0 ? entertainmentExpense / monthlyIncome : 0

  const housingLevel = getLevel(housingRatio * 100, Object.fromEntries(Object.entries(BENCHMARKS.housingRatio).map(([k,v]) => [k, v*100])) as any, false)
  const foodLevel = getLevel(foodRatio * 100, Object.fromEntries(Object.entries(BENCHMARKS.foodRatio).map(([k,v]) => [k, v*100])) as any, false)

  categories.push({
    name: '支出结构',
    icon: '📊',
    score: housingLevel === 'excellent' ? 95 : housingLevel === 'good' ? 80 : housingLevel === 'warning' ? 60 : 35,
    items: [
      {
        key: 'housing', label: '住房占比',
        userValue: Math.round(housingRatio * 100 * 10) / 10,
        benchmarkValue: BENCHMARKS.housingRatio.good * 100,
        unit: '%',
        level: housingLevel,
        description: housingRatio > 0.4 ? '住房支出过高，建议控制在收入的30%以内' : '住房支出合理'
      },
      {
        key: 'food', label: '餐饮占比',
        userValue: Math.round(foodRatio * 100 * 10) / 10,
        benchmarkValue: BENCHMARKS.foodRatio.good * 100,
        unit: '%',
        level: foodLevel,
        description: foodRatio > 0.25 ? '餐饮支出偏高，可适当控制' : '餐饮支出合理'
      },
      {
        key: 'transport', label: '交通占比',
        userValue: Math.round(transportRatio * 100 * 10) / 10,
        benchmarkValue: BENCHMARKS.transportRatio.good * 100,
        unit: '%',
        level: getLevel(transportRatio * 100, Object.fromEntries(Object.entries(BENCHMARKS.transportRatio).map(([k,v]) => [k, v*100])) as any, false),
        description: '交通支出参考基准为收入的10%'
      },
      {
        key: 'entertainment', label: '娱乐占比',
        userValue: Math.round(entertainmentRatio * 100 * 10) / 10,
        benchmarkValue: BENCHMARKS.entertainmentRatio.good * 100,
        unit: '%',
        level: getLevel(entertainmentRatio * 100, Object.fromEntries(Object.entries(BENCHMARKS.entertainmentRatio).map(([k,v]) => [k, v*100])) as any, false),
        description: '适度娱乐有益身心，控制在收入的10%以内'
      }
    ]
  })

  // 3. 债务管理
  const debtToIncome = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) : 0
  const debtToAsset = totalAssets > 0 ? (totalDebt / totalAssets) : 0
  const debtLevel = getLevel(debtToIncome * 100, Object.fromEntries(Object.entries(BENCHMARKS.debtToIncome).map(([k,v]) => [k, v*100])) as any, false)

  categories.push({
    name: '债务管理',
    icon: '💳',
    score: totalDebt === 0 ? 100 : debtLevel === 'excellent' ? 95 : debtLevel === 'good' ? 80 : debtLevel === 'warning' ? 60 : 35,
    items: [
      {
        key: 'debtToIncome', label: '负债收入比',
        userValue: Math.round(debtToIncome * 100 * 10) / 10,
        benchmarkValue: BENCHMARKS.debtToIncome.good * 100,
        unit: '%',
        level: debtLevel,
        description: totalDebt === 0 ? '无负债，完美！' : debtToIncome > 0.5 ? '负债过高，建议优先还债' : '负债可控'
      },
      {
        key: 'debtToAsset', label: '资产负债率',
        userValue: Math.round(debtToAsset * 100 * 10) / 10,
        benchmarkValue: BENCHMARKS.debtToAsset.good * 100,
        unit: '%',
        level: getLevel(debtToAsset * 100, Object.fromEntries(Object.entries(BENCHMARKS.debtToAsset).map(([k,v]) => [k, v*100])) as any, false),
        description: totalDebt === 0 ? '零负债，资产安全' : '资产负债率建议控制在30%以下'
      }
    ]
  })

  // 4. 投资力度
  const investmentRatio = totalAssets > 0 ? totalInvestment / totalAssets : 0
  const investLevel = getLevel(investmentRatio * 100, Object.fromEntries(Object.entries(BENCHMARKS.investmentRatio).map(([k,v]) => [k, v*100])) as any, true)

  categories.push({
    name: '投资力度',
    icon: '📈',
    score: investLevel === 'excellent' ? 95 : investLevel === 'good' ? 80 : investLevel === 'warning' ? 60 : 35,
    items: [
      {
        key: 'investmentRatio', label: '投资资产占比',
        userValue: Math.round(investmentRatio * 100 * 10) / 10,
        benchmarkValue: BENCHMARKS.investmentRatio.good * 100,
        unit: '%',
        level: investLevel,
        description: investmentRatio < 0.15 ? '投资比例偏低，建议增加投资以抵御通胀' : '投资配置合理'
      }
    ]
  })

  return categories
}

/**
 * 获取净资产同龄排名估算（百分位）
 */
export function estimateNetWorthPercentile(netWorth: number, age: number): number {
  const benchmarks = BENCHMARKS.netWorthByAge
  // 找最近的年龄段
  const ages = Object.keys(benchmarks).map(Number).sort((a, b) => a - b)
  let refAge = ages[0]
  for (const a of ages) {
    if (a <= age) refAge = a
    else break
  }
  const ref = benchmarks[refAge] || 500000
  const ratio = netWorth / ref
  // 简化的百分位映射
  if (ratio >= 3) return 95
  if (ratio >= 2) return 85
  if (ratio >= 1.5) return 75
  if (ratio >= 1) return 60
  if (ratio >= 0.5) return 40
  if (ratio >= 0.2) return 25
  return 10
}
