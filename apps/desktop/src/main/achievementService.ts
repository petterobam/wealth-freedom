/**
 * 成就系统服务 - 游戏化财务目标追踪
 * v1.4.0 - 本地成就定义与解锁逻辑
 */

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'savings' | 'investing' | 'debt' | 'income' | 'milestone'
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  unlockedAt: number | null  // timestamp, null = 未解锁
  condition: string  // 条件描述（用于展示）
  progress: number   // 0-100
}

export interface AchievementGroup {
  category: string
  label: string
  icon: string
  achievements: Achievement[]
}

// 成就定义模板
const ACHIEVEMENT_TEMPLATES: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // === 储蓄类 ===
  { id: 'savings_first', name: '初见成效', description: '第一次记录月度储蓄', icon: '🌱', category: 'savings', tier: 'bronze', condition: '记录第一笔储蓄' },
  { id: 'savings_10pct', name: '小有所成', description: '储蓄率超过10%', icon: '🌿', category: 'savings', tier: 'bronze', condition: '储蓄率 ≥ 10%' },
  { id: 'savings_20pct', name: '理财达人', description: '储蓄率超过20%', icon: '🌳', category: 'savings', tier: 'silver', condition: '储蓄率 ≥ 20%' },
  { id: 'savings_30pct', name: '储蓄专家', description: '储蓄率超过30%', icon: '⭐', category: 'savings', tier: 'gold', condition: '储蓄率 ≥ 30%' },
  { id: 'savings_50pct', name: '极简大师', description: '储蓄率超过50%', icon: '💎', category: 'savings', tier: 'diamond', condition: '储蓄率 ≥ 50%' },
  { id: 'emergency_3m', name: '安全基石', description: '应急储备达到3个月', icon: '🛡️', category: 'savings', tier: 'bronze', condition: '应急储备 ≥ 3个月' },
  { id: 'emergency_6m', name: '铜墙铁壁', description: '应急储备达到6个月', icon: '🏰', category: 'savings', tier: 'silver', condition: '应急储备 ≥ 6个月' },
  { id: 'emergency_12m', name: '固若金汤', description: '应急储备达到12个月', icon: '🏆', category: 'savings', tier: 'gold', condition: '应急储备 ≥ 12个月' },

  // === 投资类 ===
  { id: 'invest_first', name: '投资启蒙', description: '记录第一笔投资', icon: '📖', category: 'investing', tier: 'bronze', condition: '记录第一笔投资交易' },
  { id: 'invest_100k', name: '十万级投资者', description: '投资资产达到10万', icon: '💰', category: 'investing', tier: 'silver', condition: '投资总额 ≥ ¥100,000' },
  { id: 'invest_500k', name: '五十万级投资者', description: '投资资产达到50万', icon: '💎', category: 'investing', tier: 'gold', condition: '投资总额 ≥ ¥500,000' },
  { id: 'invest_1m', name: '百万级投资者', description: '投资资产达到100万', icon: '👑', category: 'investing', tier: 'diamond', condition: '投资总额 ≥ ¥1,000,000' },
  { id: 'diversify', name: '分散投资', description: '投资3种以上资产类别', icon: '🎯', category: 'investing', tier: 'silver', condition: '持有 ≥ 3 种资产类别' },

  // === 债务类 ===
  { id: 'debt_free', name: '无债一身轻', description: '完全清偿所有债务', icon: '🎉', category: 'debt', tier: 'gold', condition: '总负债 = ¥0' },
  { id: 'debt_half', name: '半程还债', description: '还清50%的债务', icon: '✂️', category: 'debt', tier: 'silver', condition: '已偿还 ≥ 50% 总债务' },
  { id: 'debt_ratio_good', name: '债务可控', description: '资产负债率低于30%', icon: '📉', category: 'debt', tier: 'bronze', condition: '资产负债率 < 30%' },

  // === 收入类 ===
  { id: 'income_passive', name: '被动收入起步', description: '被动收入超过¥1000/月', icon: '🔄', category: 'income', tier: 'bronze', condition: '被动收入 ≥ ¥1,000/月' },
  { id: 'income_passive_5k', name: '被动收入增长', description: '被动收入超过¥5000/月', icon: '🚀', category: 'income', tier: 'gold', condition: '被动收入 ≥ ¥5,000/月' },
  { id: 'income_diverse', name: '多元收入', description: '有3种以上收入来源', icon: '🌈', category: 'income', tier: 'silver', condition: '收入来源 ≥ 3 种' },

  // === 里程碑类 ===
  { id: 'networth_100k', name: '十万净资', description: '净资产突破10万', icon: '🎯', category: 'milestone', tier: 'bronze', condition: '净资产 ≥ ¥100,000' },
  { id: 'networth_500k', name: '五十万净资', description: '净资产突破50万', icon: '🏅', category: 'milestone', tier: 'silver', condition: '净资产 ≥ ¥500,000' },
  { id: 'networth_1m', name: '百万净资', description: '净资产突破100万', icon: '🏆', category: 'milestone', tier: 'gold', condition: '净资产 ≥ ¥1,000,000' },
  { id: 'networth_3m', name: '三百万净资', description: '净资产突破300万', icon: '💎', category: 'milestone', tier: 'diamond', condition: '净资产 ≥ ¥3,000,000' },
  { id: 'freedom_phase1', name: '财务保障', description: '达到财务保障阶段', icon: '🛡️', category: 'milestone', tier: 'silver', condition: '应急储备 ≥ 6个月' },
  { id: 'freedom_phase2', name: '财务安全', description: '被动收入覆盖日常支出', icon: '🏖️', category: 'milestone', tier: 'diamond', condition: '被动收入 ≥ 月支出' },
]

const TIER_ORDER = { bronze: 0, silver: 1, gold: 2, diamond: 3 }
const TIER_LABELS = { bronze: '铜', silver: '银', gold: '金', diamond: '钻' }

/**
 * 评估用户成就状态
 */
export function evaluateAchievements(data: {
  savingsRate: number
  emergencyMonths: number
  totalInvestment: number
  totalDebt: number
  totalAssets: number
  initialDebt: number
  investmentCategories: number
  passiveIncome: number
  incomeSources: number
  netWorth: number
  monthlyExpense: number
  hasTransactions: boolean
  hasInvestments: boolean
}): Achievement[] {
  const d = data

  const achievements: Achievement[] = ACHIEVEMENT_TEMPLATES.map(t => {
    let progress = 0
    let unlocked = false

    switch (t.id) {
      case 'savings_first': progress = d.hasTransactions ? 100 : 0; unlocked = d.hasTransactions; break
      case 'savings_10pct': progress = Math.min(100, (d.savingsRate / 10) * 100); unlocked = d.savingsRate >= 10; break
      case 'savings_20pct': progress = Math.min(100, (d.savingsRate / 20) * 100); unlocked = d.savingsRate >= 20; break
      case 'savings_30pct': progress = Math.min(100, (d.savingsRate / 30) * 100); unlocked = d.savingsRate >= 30; break
      case 'savings_50pct': progress = Math.min(100, (d.savingsRate / 50) * 100); unlocked = d.savingsRate >= 50; break
      case 'emergency_3m': progress = Math.min(100, (d.emergencyMonths / 3) * 100); unlocked = d.emergencyMonths >= 3; break
      case 'emergency_6m': progress = Math.min(100, (d.emergencyMonths / 6) * 100); unlocked = d.emergencyMonths >= 6; break
      case 'emergency_12m': progress = Math.min(100, (d.emergencyMonths / 12) * 100); unlocked = d.emergencyMonths >= 12; break
      case 'invest_first': progress = d.hasInvestments ? 100 : 0; unlocked = d.hasInvestments; break
      case 'invest_100k': progress = Math.min(100, (d.totalInvestment / 100000) * 100); unlocked = d.totalInvestment >= 100000; break
      case 'invest_500k': progress = Math.min(100, (d.totalInvestment / 500000) * 100); unlocked = d.totalInvestment >= 500000; break
      case 'invest_1m': progress = Math.min(100, (d.totalInvestment / 1000000) * 100); unlocked = d.totalInvestment >= 1000000; break
      case 'diversify': progress = Math.min(100, (d.investmentCategories / 3) * 100); unlocked = d.investmentCategories >= 3; break
      case 'debt_free': progress = d.totalDebt === 0 ? 100 : Math.min(100, ((d.initialDebt - d.totalDebt) / d.initialDebt) * 100); unlocked = d.totalDebt === 0; break
      case 'debt_half': progress = d.initialDebt > 0 ? Math.min(100, ((d.initialDebt - d.totalDebt) / d.initialDebt) * 200) : 100; unlocked = d.initialDebt > 0 && d.totalDebt <= d.initialDebt * 0.5; break
      case 'debt_ratio_good': { const ratio = d.totalAssets > 0 ? d.totalDebt / d.totalAssets * 100 : 0; progress = Math.min(100, Math.max(0, 100 - ratio * (100/30))); unlocked = d.totalAssets > 0 && ratio < 30; break }
      case 'income_passive': progress = Math.min(100, (d.passiveIncome / 1000) * 100); unlocked = d.passiveIncome >= 1000; break
      case 'income_passive_5k': progress = Math.min(100, (d.passiveIncome / 5000) * 100); unlocked = d.passiveIncome >= 5000; break
      case 'income_diverse': progress = Math.min(100, (d.incomeSources / 3) * 100); unlocked = d.incomeSources >= 3; break
      case 'networth_100k': progress = Math.min(100, (d.netWorth / 100000) * 100); unlocked = d.netWorth >= 100000; break
      case 'networth_500k': progress = Math.min(100, (d.netWorth / 500000) * 100); unlocked = d.netWorth >= 500000; break
      case 'networth_1m': progress = Math.min(100, (d.netWorth / 1000000) * 100); unlocked = d.netWorth >= 1000000; break
      case 'networth_3m': progress = Math.min(100, (d.netWorth / 3000000) * 100); unlocked = d.netWorth >= 3000000; break
      case 'freedom_phase1': progress = Math.min(100, (d.emergencyMonths / 6) * 100); unlocked = d.emergencyMonths >= 6; break
      case 'freedom_phase2': { const coverage = d.monthlyExpense > 0 ? d.passiveIncome / d.monthlyExpense * 100 : 0; progress = Math.min(100, coverage); unlocked = coverage >= 100; break }
    }

    return {
      ...t,
      progress: Math.round(progress),
      unlockedAt: unlocked ? Date.now() : null
    }
  })

  return achievements
}

/**
 * 按类别分组成就
 */
export function groupAchievements(achievements: Achievement[]): AchievementGroup[] {
  const groups: Record<string, AchievementGroup> = {
    savings: { category: 'savings', label: '储蓄达人', icon: '🐷', achievements: [] },
    investing: { category: 'investing', label: '投资进阶', icon: '📈', achievements: [] },
    debt: { category: 'debt', label: '债务管理', icon: '💳', achievements: [] },
    income: { category: 'income', label: '收入增长', icon: '💰', achievements: [] },
    milestone: { category: 'milestone', label: '人生里程碑', icon: '🏆', achievements: [] },
  }

  for (const a of achievements) {
    if (groups[a.category]) {
      groups[a.category].achievements.push(a)
    }
  }

  return Object.values(groups)
}

/**
 * 计算成就总分
 */
export function calculateAchievementScore(achievements: Achievement[]): { total: number, max: number, unlocked: number, total_count: number } {
  const tierPoints = { bronze: 10, silver: 25, gold: 50, diamond: 100 }
  let total = 0
  let max = 0
  let unlocked = 0

  for (const a of achievements) {
    const pts = tierPoints[a.tier]
    max += pts
    if (a.unlockedAt) {
      total += pts
      unlocked++
    }
  }

  return { total, max, unlocked, total_count: achievements.length }
}

export { TIER_ORDER, TIER_LABELS }
