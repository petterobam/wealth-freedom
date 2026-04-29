/**
 * v1.3.0 AI Prompt 模板库
 * 
 * 为不同财务分析场景提供结构化 Prompt
 */

// ====== 财务数据汇总上下文 ======

export interface FinancialContext {
  // 收支
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  monthlySurplus: number;
  // 资产
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
  // 分类支出 Top5
  topExpenseCategories: Array<{ category: string; amount: number; percentage: number }>;
  // 投资
  investmentTotal: number;
  investmentReturnRate: number;
  // 目标
  goals: Array<{ name: string; target: number; current: number; deadline: string }>;
  // 时间范围
  period: string;
}

const formatContext = (ctx: FinancialContext): string => `
## 用户财务概况（${ctx.period}）

### 收支状况
- 月收入：¥${ctx.totalIncome.toLocaleString()}
- 月支出：¥${ctx.totalExpense.toLocaleString()}
- 月结余：¥${ctx.monthlySurplus.toLocaleString()}
- 储蓄率：${(ctx.savingsRate * 100).toFixed(1)}%

### 资产负债
- 总资产：¥${ctx.totalAssets.toLocaleString()}
- 总负债：¥${ctx.totalDebt.toLocaleString()}
- 净资产：¥${ctx.netWorth.toLocaleString()}

### 支出 Top5
${ctx.topExpenseCategories.map((c, i) => `${i + 1}. ${c.category}：¥${c.amount.toLocaleString()}（${c.percentage.toFixed(1)}%）`).join('\n')}

### 投资状况
- 投资总额：¥${ctx.investmentTotal.toLocaleString()}
- 投资收益率：${(ctx.investmentReturnRate * 100).toFixed(2)}%

### 财务目标
${ctx.goals.map(g => `- ${g.name}：目标 ¥${g.target.toLocaleString()}，已攒 ¥${g.current.toLocaleString()}（${((g.current / g.target) * 100).toFixed(1)}%），截止 ${g.deadline}`).join('\n')}
`;

// ====== 智能支出分析 ======

export const SPENDING_ANALYSIS_PROMPT = (ctx: FinancialContext) => `
你是一位专业的个人财务顾问，请基于以下财务数据提供支出优化建议。

${formatContext(ctx)}

请分析：
1. **支出结构评估**：各分类占比是否合理，是否有异常
2. **优化建议**：具体可操作的省钱建议（至少 3 条）
3. **行业对比**：与合理支出比例对比（如房租 < 30%、餐饮 < 15%、娱乐 < 10%）
4. **预期节省**：实施建议后预计每月可节省多少

要求：
- 建议具体可操作，不要笼统的"减少支出"
- 给出具体金额和百分比
- 语气友好但专业
- 回复用中文，使用 Markdown 格式
`;

// ====== 储蓄目标规划 ======

export const SAVINGS_PLAN_PROMPT = (ctx: FinancialContext, targetAmount: number, targetDate?: string) => `
你是一位财务规划师，请基于以下数据为用户制定储蓄计划。

${formatContext(ctx)}

用户的目标金额：¥${targetAmount.toLocaleString()}
${targetDate ? `目标日期：${targetDate}` : ''}

请规划：
1. **达成时间**：按当前储蓄率，预计何时达成目标
2. **加速方案**：如果储蓄率提升 5%/10%/15%，分别能提前多久
3. **投资助力**：如果将结余的 50% 投入年化 8% 的投资，能提前多久
4. **执行计划**：每月需要存多少，分阶段里程碑

要求：
- 给出具体数字和时间线
- 考虑复利效应
- 语气鼓励但务实
- 回复用中文，使用 Markdown 格式
`;

// ====== 投资组合建议 ======

export const INVESTMENT_ADVICE_PROMPT = (ctx: FinancialContext, holdings: Array<{ name: string; value: number; type: string }>, riskLevel: string) => `
你是一位投资顾问，请基于以下数据提供投资组合建议。

${formatContext(ctx)}

### 当前持仓
${holdings.map((h, i) => `${i + 1}. ${h.name}（${h.type}）：¥${h.value.toLocaleString()}`).join('\n')}

用户风险偏好：${riskLevel}

请分析：
1. **组合评估**：当前配置的优缺点
2. **分散度**：是否存在过度集中（单一持仓 > 40%）
3. **再平衡建议**：推荐的目标配置比例
4. **风险提示**：需要注意的风险点

要求：
- 建议基于风险偏好定制
- 给出具体配置百分比
- 包含风险提示
- 回复用中文，使用 Markdown 格式
`;

// ====== 自由问答 ======

export const CHAT_PROMPT = (ctx: FinancialContext, question: string, history: Array<{ role: string; content: string }>) => `
你是"财富自由之路"App 的 AI 财务助手。你精通个人财务规划、投资理财、债务管理。

${formatContext(ctx)}

### 对话历史
${history.map(h => `${h.role === 'user' ? '用户' : '助手'}：${h.content}`).join('\n')}

### 用户问题
${question}

请基于用户的实际财务数据回答问题。回答要：
- 具体引用用户的实际数字
- 给出可操作的建议
- 语气友好专业
- 用中文回复，Markdown 格式
`;

// ====== 快速建议（无 LLM 调用） ======

export interface QuickTip {
  type: 'spending' | 'savings' | 'investment' | 'goal';
  severity: 'info' | 'warning' | 'success';
  title: string;
  description: string;
  action?: string;
}

/**
 * 基于规则引擎生成快速建议（不需要 LLM API）
 */
export function generateQuickTips(ctx: FinancialContext): QuickTip[] {
  const tips: QuickTip[] = [];

  // 储蓄率检查
  if (ctx.savingsRate < 0.2) {
    tips.push({
      type: 'savings',
      severity: 'warning',
      title: '储蓄率偏低',
      description: `当前储蓄率 ${(ctx.savingsRate * 100).toFixed(1)}%，建议至少达到 20%。每月多存 ¥${Math.round(ctx.totalIncome * 0.2 - ctx.monthlySurplus).toLocaleString()} 即可达标。`,
      action: '创建预算计划',
    });
  } else if (ctx.savingsRate >= 0.5) {
    tips.push({
      type: 'savings',
      severity: 'success',
      title: '储蓄率优秀！',
      description: `${(ctx.savingsRate * 100).toFixed(1)}% 的储蓄率远超 50/50 法则建议的 20%。考虑将多余资金投入投资。`,
      action: '查看投资建议',
    });
  }

  // 支出异常检查
  for (const cat of ctx.topExpenseCategories) {
    if (cat.percentage > 40) {
      tips.push({
        type: 'spending',
        severity: 'warning',
        title: `${cat.category}占比过高`,
        description: `${cat.category}占总支出的 ${cat.percentage.toFixed(1)}%（¥${cat.amount.toLocaleString()}），建议控制在 30% 以内。`,
        action: '查看支出明细',
      });
    }
  }

  // 投资检查
  if (ctx.investmentTotal === 0 && ctx.monthlySurplus > 0) {
    tips.push({
      type: 'investment',
      severity: 'info',
      title: '尚未开始投资',
      description: `每月有 ¥${ctx.monthlySurplus.toLocaleString()} 结余，建议开始定期投资，利用复利效应加速财富积累。`,
      action: '了解投资入门',
    });
  }

  // 目标检查
  for (const goal of ctx.goals) {
    const progress = goal.current / goal.target;
    if (progress < 0.3) {
      tips.push({
        type: 'goal',
        severity: 'info',
        title: `${goal.name}进度较慢`,
        description: `当前完成 ${(progress * 100).toFixed(1)}%，还需 ¥${(goal.target - goal.current).toLocaleString()}。考虑调整储蓄计划或目标金额。`,
        action: '查看储蓄规划',
      });
    }
  }

  return tips;
}
