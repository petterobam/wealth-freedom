/**
 * 收入规划相关类型定义
 */

/**
 * 收入来源类型
 */
export type IncomeSourceType =
  | 'salary'          // 工资
  | 'freelance'       // 兼职/自由职业
  | 'investment'      // 投资收益
  | 'product'         // 产品收入（软件、课程等）
  | 'rent'            // 租金收入
  | 'dividend'        // 分红
  | 'interest'        // 利息
  | 'commission'      // 佣金
  | 'business'        // 创业收入
  | 'other';          // 其他

/**
 * 收入类型（主动/被动）
 */
export type IncomeTypeCategory = 'active' | 'passive';

/**
 * 收入频率
 */
export type IncomeFrequency = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * 收入稳定性评分
 */
export type IncomeStability = 1 | 2 | 3 | 4 | 5;  // 1 = 极不稳定, 5 = 非常稳定

/**
 * 收入来源
 */
export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  type: IncomeSourceType;
  category: IncomeTypeCategory;
  source: string;                    // 收入来源描述（公司名称、平台名称等）
  amount: number;                    // 预估月收入
  frequency: IncomeFrequency;        // 收入频率
  currency: string;                  // 货币单位，默认 CNY
  stability: IncomeStability;         // 稳定性评分（1-5）
  growth_rate: number;               // 预期年增长率（百分比，如 10 表示 10%）
  start_date: string | null;         // 开始日期
  end_date: string | null;           // 结束日期（null 表示长期）
  notes: string | null;              // 备注
  is_active: boolean;                // 是否活跃
  created_at: string;
  updated_at: string;
}

/**
 * 收入记录（实际收入）
 */
export interface IncomeRecord {
  id: string;
  user_id: string;
  source_id: string;                 // 关联的收入来源 ID
  amount: number;                    // 实际收入金额
  date: string;                      // 收入日期
  frequency: IncomeFrequency;       // 收入频率
  currency: string;                  // 货币单位
  note: string | null;               // 备注
  created_at: string;
  updated_at: string;
}

/**
 * 收入目标类型
 */
export type IncomeGoalType = 'total' | 'structure' | 'source';

/**
 * 收入目标
 */
export interface IncomeGoal {
  id: string;
  user_id: string;
  type: IncomeGoalType;              // 目标类型
  title: string;                     // 目标标题
  description: string | null;       // 目标描述
  target_amount: number;             // 目标金额（月收入/年收入，取决于目标类型）
  current_amount: number;           // 当前金额
  target_percentage: number | null;  // 目标百分比（用于结构目标，如被动收入占比）
  current_percentage: number;         // 当前百分比
  target_date: string | null;        // 目标达成日期
  status: 'in_progress' | 'achieved' | 'abandoned';  // 目标状态
  priority: number;                  // 优先级（1-5，5 最高）
  created_at: string;
  updated_at: string;
}

/**
 * 收入策略类型
 */
export type IncomeStrategyType =
  | 'expert_positioning'    // 专家定位策略
  | 'productization'         // 产品化策略
  | 'leverage'              // 杠杆策略
  | 'investment'             // 投资策略
  | 'career_growth'          // 职业成长策略
  | 'side_hustle'            // 副业策略;

/**
 * 收入策略
 */
export interface IncomeStrategy {
  id: string;
  user_id: string;
  type: IncomeStrategyType;          // 策略类型
  title: string;                     // 策略标题
  description: string;               // 策略详细描述
  steps: string;                     // 实施步骤（JSON 数组）
  expected_income: number;           // 预期增加收入（月/年，取决于策略）
  time_frame: number;                // 预期实施时间（月）
  difficulty: number;                // 难度评分（1-5，5 最难）
  priority: number;                  // 优先级（1-5，5 最高）
  is_recommended: boolean;           // 是否推荐给用户
  applied: boolean;                  // 是否已应用
  created_at: string;
  updated_at: string;
}

/**
 * 收入行动计划
 */
export interface IncomeAction {
  id: string;
  user_id: string;
  strategy_id: string | null;        // 关联的策略 ID（null 表示手动创建）
  title: string;                     // 行动标题
  description: string | null;        // 行动描述
  priority: number;                  // 优先级（1-5，5 最高）
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';  // 行动状态
  due_date: string | null;           // 截止日期
  completed_at: string | null;       // 完成日期
  created_at: string;
  updated_at: string;
}

/**
 * 收入模拟方案
 */
export interface IncomeSimulation {
  id: string;
  user_id: string;
  name: string;                      // 方案名称
  current_monthly_income: number;   // 当前月收入
  current_annual_income: number;    // 当前年收入
  active_growth_rate: number;        // 主动收入预期年增长率（百分比）
  passive_growth_rate: number;       // 被动收入预期年增长率（百分比）
  new_income_sources: string;        // 新增收入来源（JSON 数组）
  simulation_years: number;          // 模拟年数
  results: string;                   // 模拟结果（JSON 对象，包含每年的预测）
  created_at: string;
  updated_at: string;
}

/**
 * 收入分析报告
 */
export interface IncomeAnalysisReport {
  total_monthly_income: number;      // 总月收入
  total_annual_income: number;       // 总年收入
  active_income: number;             // 主动收入（月）
  passive_income: number;            // 被动收入（月）
  passive_income_percentage: number; // 被动收入占比
  income_sources: {                  // 各收入来源统计
    type: IncomeSourceType;
    amount: number;
    percentage: number;
  }[];
  monthly_trend: {                  // 近 6 个月收入趋势
    month: string;
    income: number;
  }[];
  growth_rate: {                    // 增长率分析
    monthly: number;
    annual: number;
  };
  recommendations: string[];        // 优化建议
}

/**
 * 收入看板数据
 */
export interface IncomeDashboard {
  summary: {
    current_monthly_income: number;
    current_annual_income: number;
    previous_month_income: number;
    growth_rate: number;
  };
  structure: {
    active_income: number;
    passive_income: number;
    passive_percentage: number;
    target_percentage: number;
  };
  sources: {
    id: string;
    name: string;
    type: IncomeSourceType;
    amount: number;
    percentage: number;
    stability: IncomeStability;
    growth_rate: number;
  }[];
  trend: {
    month: string;
    income: number;
    active_income: number;
    passive_income: number;
  }[];
}

/**
 * 财务自由预测结果
 */
export interface FinancialFreedomPrediction {
  current_net_worth: number;
  monthly_expenses: number;
  target_amount: number;
  current_progress: number;         // 当前进度（百分比）
  years_to_freedom: number;         // 预计达到财务自由的年数
  target_date: string;              // 预计达到日期
  scenarios: {                       // 不同情景的预测
    conservative: {
      years: number;
      date: string;
      amount: number;
    };
    moderate: {
      years: number;
      date: string;
      amount: number;
    };
    optimistic: {
      years: number;
      date: string;
      amount: number;
    };
  };
}
