/**
 * 教程内容定义
 * 为每个工具提供参数说明和示例数据
 */

// 复利计算器教程
export const calculatorTutorial = {
  // 参数说明
  parameters: {
    principal: '初始本金：你目前已有的投资资产总额。建议从实际金额开始计算，这样才能看到真实的增长路径。',
    monthlyContribution: '每月定投：你每月可以投入的固定金额。保持每月定投是积累财富的关键，建议设置为月收入的 20-30%。',
    years: '投资年限：你计划投资的年数。越长越好，因为复利需要时间才能显现威力。',
    annualRate: '年化收益率：预期的年化投资回报率。建议根据投资组合保守估计：指数基金 8-10%，债券 3-5%，货币基金 2-3%。'
  },

  // 示例数据
  exampleData: {
    principal: 900000,
    monthlyContribution: 20000,
    years: 10,
    annualRate: 8
  },

  // 工具说明
  description: '复利计算器帮助你理解"时间的力量"。通过计算不同投资组合下的资产增长，你可以看到长期投资的威力。记住：越早开始，复利效应越强。',
  tips: [
    '即使每月只投入 5000 元，坚持 20 年也能积累可观财富',
    '年化收益率提高 1%，长期来看差异巨大',
    '复利在后期会加速增长，前期要有耐心'
  ]
}

// 提前还款计算器教程
export const prepaymentTutorial = {
  parameters: {
    loanAmount: '贷款总额：你需要偿还的总金额。包括房贷、车贷等所有贷款。',
    annualRate: '年利率：贷款的年利率。银行通常会给出"年利率"，注意与"月利率"的区别。',
    loanTerm: '贷款期限：贷款的总年限。房贷通常 20-30 年，车贷通常 3-5 年。',
    prepaymentAmount: '提前还款金额：你打算一次性偿还的金额。建议优先偿还利率较高的贷款。',
    prepaymentDate: '提前还款日期：你计划提前还款的时间点。越早还款，节省的利息越多。',
    prepaymentType: '还款方式：选择"缩短年限"可以更快无债一身轻，选择"减少月供"可以降低每月压力。'
  },

  exampleData: {
    loanAmount: 800000,
    annualRate: 4.9,
    loanTerm: 20,
    prepaymentAmount: 200000,
    prepaymentDate: '2026-06',
    prepaymentType: 'shortenTerm' // 'shortenTerm' 或 'reducePayment'
  },

  description: '提前还款计算器帮你评估提前还款是否划算。通过对比不同还款策略，你可以找到最适合你的方案。',
  tips: [
    '提前还款越早，节省的利息越多',
    '优先偿还利率高的贷款（信用卡 > 车贷 > 房贷）',
    '如果投资收益率 > 贷款利率，可以考虑不提前还款'
  ]
}

// 退休规划工具教程
export const retirementTutorial = {
  parameters: {
    currentAge: '当前年龄：你现在的年龄。越早规划，压力越小。',
    retirementAge: '退休年龄：你希望退休的年龄。根据国家政策和自身健康情况选择。',
    currentSavings: '当前储蓄：你目前已有的储蓄总额。包括现金、投资、公积金等。',
    monthlySavings: '每月储蓄：你每月可以存下的金额。建议设置为月收入的 30-50%。',
    retirementExpenses: '退休后月支出：预估退休后每月需要的开支。通常为当前支出的 70-80%（考虑到房贷已还清）。',
    lifeExpectancy: '预期寿命：根据平均寿命和家族健康情况预估。建议保守一些（如 85-90 岁）。',
    expectedReturn: '年化收益率：投资组合的预期年化收益率。退休后可以降低风险，选择 5-7%。'
  },

  exampleData: {
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 1100000,
    monthlySavings: 20000,
    retirementExpenses: 10000,
    lifeExpectancy: 85,
    expectedReturn: 8,
    inflationRate: 3
  },

  description: '退休规划工具帮助你计算退休需要多少养老金。通过规划，你可以提前做好准备，确保退休后的生活质量。',
  tips: [
    '退休金不是一夜之间攒出来的，需要几十年积累',
    '通货膨胀会降低购买力，要考虑通胀因素',
    '越早开始，每月需要的储蓄越少'
  ]
}

// 大额支出规划教程
export const largeExpenseTutorial = {
  parameters: {
    goalName: '目标名称：给你的目标起个名字，如"买房首付""教育基金""旅行基金"等。',
    targetAmount: '目标金额：你需要攒够的总金额。根据实际情况估算，建议预留 10-20% 的缓冲。',
    yearsToTarget: '达成年限：你希望多久实现目标。根据收入和储蓄能力合理规划。',
    currentSavings: '当前储蓄：你目前已有的相关储蓄。',
    monthlySavings: '每月储蓄：你每月可以为此目标存下的金额。',
    annualRate: '年化收益率：这笔资金的预期年化收益率。短期目标（<3年）建议选择低风险（3-5%），长期目标可以选择中高风险（8-10%）。'
  },

  exampleData: {
    goalName: '买房首付',
    targetAmount: 1000000,
    yearsToTarget: 3,
    currentSavings: 200000,
    monthlySavings: 20000,
    annualRate: 5
  },

  description: '大额支出规划工具帮助你规划买房、教育、旅行等重大支出。通过科学规划，你可以避免临时抱佛脚。',
  tips: [
    '大额支出要提前 3-5 年规划',
    '短期目标选择低风险投资，避免亏损',
    '每月储蓄要切合实际，避免影响生活质量'
  ]
}

// 情景模拟教程
export const scenarioTutorial = {
  parameters: {
    netAssets: '净资产：你的总资产减去总负债。反映你当前的财务状况。',
    monthlyIncome: '月收入：你每月的总收入（税后）。包括工资、兼职收入、被动收入等。',
    monthlyExpense: '月支出：你每月的总支出。包括生活费、房贷、保险等。',
    annualReturn: '年化收益率：投资组合的预期年化收益率。保守估计，避免过于乐观。',
    financialFreedomTarget: '财务自由目标：你需要多少本金才能靠利息生活。公式：月支出 × 150（假设 8% 年化收益）。'
  },

  exampleData: {
    netAssets: 1100000,
    monthlyIncome: 30000,
    monthlyExpense: 10000,
    annualReturn: 8,
    financialFreedomTarget: 1500000
  },

  description: '情景模拟工具帮助你对比不同财务决策的影响。通过模拟"如果...会怎样"，你可以做出更明智的决策。',
  tips: [
    '模拟要基于现实，不要过于乐观',
    '关注多个因素的综合影响（收入、支出、投资）',
    '定期复盘，根据实际情况调整计划'
  ],
  scenarios: [
    { name: '涨薪 20%', description: '如果月收入从 30k 涨到 36k' },
    { name: '减少支出 30%', description: '如果月支出从 10k 降到 7k' },
    { name: '收益率提升到 10%', description: '如果年化收益率从 8% 提升到 10%' },
    { name: '组合策略', description: '同时涨薪 + 减少支出 + 提高收益率' }
  ]
}

// 导出所有教程
export const tutorials = {
  calculator: calculatorTutorial,
  prepayment: prepaymentTutorial,
  retirement: retirementTutorial,
  largeExpense: largeExpenseTutorial,
  scenario: scenarioTutorial
}
