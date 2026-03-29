/**
 * 财务自由时间路径计算器
 * 
 * 基于复利和时间价值理论，计算达到财务自由三个阶段所需的时间
 * 来源：《财富自由之路》第8章（储蓄）、第9章（复利）、第12章（三阶段目标）
 */

export interface FreedomTimelineInput {
  // 当前财务状况
  currentNetAssets: number;      // 当前净资产（元）
  monthlyIncome: number;          // 月收入（元）
  monthlyExpense: number;         // 月支出（元）
  
  // 储蓄与投资参数
  savingsRate: number;            // 储蓄率（0-1之间，默认0.1）
  annualRaiseRate: number;        // 年化收入增长率（默认0.05）
  annualReturnRate: number;       // 年化投资收益率（默认0.08）
  
  // 三阶段目标参数
  securityMonths: number;         // 财务保障月数（默认6）
  monthlyBasicLiving: number;     // 财务安全阶段月支出（元）
  monthlyDreamLiving: number;     // 财务自由阶段月支出（元）
}

export interface Milestone {
  name: string;                   // 阶段名称
  targetAmount: number;           // 目标金额
  currentProgress: number;        // 当前进度（0-1）
  years: number;                  // 预计年数
  months: number;                 // 预计月数（余数）
  totalMonths: number;            // 总月数
  finalAssets: number;            // 达成时的资产
}

export interface YearlyProgress {
  year: number;
  startAssets: number;
  yearlySavings: number;
  investmentReturn: number;
  endAssets: number;
  milestone?: string;
}

export interface FreedomTimelineOutput {
  // 三阶段里程碑
  milestones: {
    security: Milestone;          // 财务保障
    safety: Milestone;            // 财务安全
    freedom: Milestone;           // 财务自由
  };
  
  // 年度进度预测（前20年）
  yearlyProgress: YearlyProgress[];
  
  // 关键指标
  keyMetrics: {
    first100k: { years: number; months: number };      // 第一个10万
    firstDoubling: { years: number; months: number };  // 首次资产翻倍
    passiveIncomeAtFreedom: number;                     // 财务自由时被动收入
  };
  
  // 输入参数（用于展示）
  input: FreedomTimelineInput;
}

/**
 * 计算达到目标的时间
 */
function calculateMilestone(
  targetAmount: number,
  currentAssets: number,
  monthlySavings: number,
  annualReturnRate: number,
  annualRaiseRate: number,
  name: string
): Milestone {
  let assets = currentAssets;
  let months = 0;
  let currentMonthlySavings = monthlySavings;
  const monthlyReturnRate = annualReturnRate / 12;
  const maxMonths = 600; // 最多50年
  
  while (assets < targetAmount && months < maxMonths) {
    // 资产增值（复利）
    assets *= (1 + monthlyReturnRate);
    
    // 每月储蓄
    assets += currentMonthlySavings;
    
    months++;
    
    // 每年调整储蓄额（收入增长）
    if (months % 12 === 0) {
      currentMonthlySavings *= (1 + annualRaiseRate);
    }
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const progress = Math.min(currentAssets / targetAmount, 1);
  
  return {
    name,
    targetAmount,
    currentProgress: progress,
    years,
    months: remainingMonths,
    totalMonths: months,
    finalAssets: assets
  };
}

/**
 * 生成年度进度表
 */
function generateYearlyProgress(
  input: FreedomTimelineInput,
  milestones: FreedomTimelineOutput['milestones']
): YearlyProgress[] {
  const progress: YearlyProgress[] = [];
  let assets = input.currentNetAssets;
  let monthlySavings = input.monthlyIncome * input.savingsRate;
  const monthlyReturnRate = input.annualReturnRate / 12;
  
  // 找出所有里程碑的时间点
  const milestoneMap = new Map<number, string>();
  if (milestones.security.totalMonths <= 240) {
    milestoneMap.set(milestones.security.totalMonths, '财务保障达成');
  }
  if (milestones.safety.totalMonths <= 240) {
    milestoneMap.set(milestones.safety.totalMonths, '财务安全达成');
  }
  if (milestones.freedom.totalMonths <= 240) {
    milestoneMap.set(milestones.freedom.totalMonths, '财务自由达成');
  }
  
  for (let year = 1; year <= 20; year++) {
    const startAssets = assets;
    let yearlySavings = 0;
    let investmentReturn = 0;
    
    for (let month = 0; month < 12; month++) {
      const monthNum = (year - 1) * 12 + month + 1;
      
      // 资产增值
      const returnThisMonth = assets * monthlyReturnRate;
      investmentReturn += returnThisMonth;
      assets *= (1 + monthlyReturnRate);
      
      // 储蓄
      assets += monthlySavings;
      yearlySavings += monthlySavings;
      
      // 检查里程碑
      if (milestoneMap.has(monthNum)) {
        progress[progress.length - 1] = {
          ...progress[progress.length - 1],
          milestone: milestoneMap.get(monthNum)
        };
      }
    }
    
    // 年末调整储蓄额
    monthlySavings *= (1 + input.annualRaiseRate);
    
    progress.push({
      year,
      startAssets,
      yearlySavings,
      investmentReturn,
      endAssets: assets,
      milestone: milestoneMap.get(year * 12)
    });
  }
  
  return progress;
}

/**
 * 计算关键指标
 */
function calculateKeyMetrics(
  input: FreedomTimelineInput,
  milestones: FreedomTimelineOutput['milestones']
): FreedomTimelineOutput['keyMetrics'] {
  // 第一个10万
  const first100k = calculateMstoneTime(
    100000,
    input.currentNetAssets,
    input.monthlyIncome * input.savingsRate,
    input.annualReturnRate,
    input.annualRaiseRate
  );
  
  // 首次资产翻倍（72法则近似）
  const doublingTime = Math.ceil(72 / (input.annualReturnRate * 100));
  const firstDoubling = {
    years: doublingTime,
    months: 0
  };
  
  // 财务自由时的被动收入
  const passiveIncomeAtFreedom = milestones.freedom.finalAssets * input.annualReturnRate / 12;
  
  return {
    first100k,
    firstDoubling,
    passiveIncomeAtFreedom
  };
}

/**
 * 辅助函数：计算达到某金额的时间
 */
function calculateMstoneTime(
  target: number,
  current: number,
  monthlySavings: number,
  returnRate: number,
  raiseRate: number
): { years: number; months: number } {
  const milestone = calculateMilestone(
    target,
    current,
    monthlySavings,
    returnRate,
    raiseRate,
    ''
  );
  return { years: milestone.years, months: milestone.months };
}

/**
 * 主计算函数
 */
export function calculateFreedomTimeline(
  input: FreedomTimelineInput
): FreedomTimelineOutput {
  // 计算三阶段目标金额
  const securityTarget = input.monthlyExpense * input.securityMonths;
  const safetyTarget = input.monthlyBasicLiving * 150;  // 基于8%年化
  const freedomTarget = input.monthlyDreamLiving * 150; // 基于8%年化
  
  const monthlySavings = input.monthlyIncome * input.savingsRate;
  
  // 计算三个里程碑
  const security = calculateMilestone(
    securityTarget,
    input.currentNetAssets,
    monthlySavings,
    input.annualReturnRate,
    input.annualRaiseRate,
    '财务保障'
  );
  
  const safety = calculateMilestone(
    safetyTarget,
    input.currentNetAssets,
    monthlySavings,
    input.annualReturnRate,
    input.annualRaiseRate,
    '财务安全'
  );
  
  const freedom = calculateMilestone(
    freedomTarget,
    input.currentNetAssets,
    monthlySavings,
    input.annualReturnRate,
    input.annualRaiseRate,
    '财务自由'
  );
  
  const milestones = { security, safety, freedom };
  
  // 生成年度进度
  const yearlyProgress = generateYearlyProgress(input, milestones);
  
  // 计算关键指标
  const keyMetrics = calculateKeyMetrics(input, milestones);
  
  return {
    milestones,
    yearlyProgress,
    keyMetrics,
    input
  };
}

/**
 * 格式化输出（用于调试）
 */
export function formatTimelineOutput(output: FreedomTimelineOutput): string {
  const lines: string[] = [];
  
  lines.push('=== 财务自由时间路径 ===\n');
  
  lines.push('📊 三阶段目标：');
  lines.push(`  财务保障：¥${output.milestones.security.targetAmount.toLocaleString()}`);
  lines.push(`  财务安全：¥${output.milestones.safety.targetAmount.toLocaleString()}`);
  lines.push(`  财务自由：¥${output.milestones.freedom.targetAmount.toLocaleString()}\n`);
  
  lines.push('⏱️  预计达成时间：');
  lines.push(`  财务保障：${output.milestones.security.years}年${output.milestones.security.months}个月（进度 ${(output.milestones.security.currentProgress * 100).toFixed(1)}%）`);
  lines.push(`  财务安全：${output.milestones.safety.years}年${output.milestones.safety.months}个月（进度 ${(output.milestones.safety.currentProgress * 100).toFixed(1)}%）`);
  lines.push(`  财务自由：${output.milestones.freedom.years}年${output.milestones.freedom.months}个月（进度 ${(output.milestones.freedom.currentProgress * 100).toFixed(1)}%）\n`);
  
  lines.push('🎯 关键指标：');
  lines.push(`  第一个10万：${output.keyMetrics.first100k.years}年${output.keyMetrics.first100k.months}个月`);
  lines.push(`  资产首次翻倍：约${output.keyMetrics.firstDoubling.years}年（72法则）`);
  lines.push(`  财务自由时被动收入：¥${output.keyMetrics.passiveIncomeAtFreedom.toLocaleString()}/月\n`);
  
  lines.push('📈 前5年进度：');
  output.yearlyProgress.slice(0, 5).forEach(p => {
    const milestoneText = p.milestone ? ` ✨ ${p.milestone}` : '';
    lines.push(`  第${p.year}年：¥${Math.round(p.endAssets).toLocaleString()}（储蓄 ¥${Math.round(p.yearlySavings).toLocaleString()}，收益 ¥${Math.round(p.investmentReturn).toLocaleString()}）${milestoneText}`);
  });
  
  return lines.join('\n');
}

// 示例使用（已注释，避免构建错误）
/*
if (require.main === module) {
  const input: FreedomTimelineInput = {
    currentNetAssets: 50000,
    monthlyIncome: 15000,
    monthlyExpense: 10000,
    savingsRate: 0.2,
    annualRaiseRate: 0.05,
    annualReturnRate: 0.08,
    securityMonths: 6,
    monthlyBasicLiving: 8000,
    monthlyDreamLiving: 20000
  };
  
  const output = calculateFreedomTimeline(input);
  console.log(formatTimelineOutput(output));
}
*/
