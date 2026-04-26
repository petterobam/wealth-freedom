<template>
  <div class="dashboard">
    <h1 class="page-title">财务看板</h1>

    <!-- 核心指标卡片 -->
    <div class="metric-cards">
      <div class="metric-card gradient-primary">
        <div class="metric-icon">💎</div>
        <div class="metric-info">
          <div class="metric-label">净资产</div>
          <div class="metric-value">{{ formatCurrency(metrics.netWorth) }}</div>
        </div>
      </div>

      <div class="metric-card gradient-success">
        <div class="metric-icon">📈</div>
        <div class="metric-info">
          <div class="metric-label">本月收入</div>
          <div class="metric-value">{{ formatCurrency(metrics.monthlyIncome) }}</div>
        </div>
      </div>

      <div class="metric-card gradient-warning">
        <div class="metric-icon">📉</div>
        <div class="metric-info">
          <div class="metric-label">本月支出</div>
          <div class="metric-value">{{ formatCurrency(metrics.monthlyExpense) }}</div>
        </div>
      </div>

      <div class="metric-card" :class="metrics.monthlyBalance >= 0 ? 'gradient-success' : 'gradient-danger'">
        <div class="metric-icon">💰</div>
        <div class="metric-info">
          <div class="metric-label">本月结余</div>
          <div class="metric-value">{{ formatCurrency(metrics.monthlyBalance) }}</div>
        </div>
      </div>
    </div>

    <!-- 每日财富洞察 -->
    <div class="daily-insight">
      <div class="insight-header">
        <el-icon><Sunny /></el-icon>
        <span class="insight-title">今日财富洞察</span>
      </div>
      <div class="insight-content">
        <p class="insight-text">{{ dailyInsight.text }}</p>
        <p class="insight-source">— {{ dailyInsight.source }}</p>
      </div>
    </div>

    <!-- 财务比率 -->
    <div class="section-title">关键比率</div>
    <div class="ratio-cards">
      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.savingsRate" 
          :color="ratios.savingsRate >= 30 ? '#67c23a' : '#e6a23c'"
        >
          <template #default>
            <span class="progress-value">{{ ratios.savingsRate }}%</span>
            <span class="progress-label">储蓄率</span>
          </template>
        </el-progress>
        <p class="ratio-tip">目标: >30%</p>
      </div>

      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.passiveIncomeRatio" 
          :color="ratios.passiveIncomeRatio >= 100 ? '#67c23a' : '#e6a23c'"
        >
          <template #default>
            <span class="progress-value">{{ ratios.passiveIncomeRatio }}%</span>
            <span class="progress-label">被动收入覆盖</span>
          </template>
        </el-progress>
        <p class="ratio-tip">目标: >100%</p>
      </div>

      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.debtRatio" 
          :color="ratios.debtRatio <= 30 ? '#67c23a' : '#f56c6c'"
        >
          <template #default>
            <span class="progress-value">{{ ratios.debtRatio }}%</span>
            <span class="progress-label">负债率</span>
          </template>
        </el-progress>
        <p class="ratio-tip">目标: <30%</p>
      </div>

      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.freedomProgress" 
          color="#4facfe"
        >
          <template #default>
            <span class="progress-value">{{ ratios.freedomProgress }}%</span>
            <span class="progress-label">自由进度</span>
          </template>
        </el-progress>
        <p class="ratio-tip">财务安全进度</p>
      </div>
    </div>

    <!-- 净资产趋势 -->
    <div class="finance-card chart-card full-width">
      <div class="card-header">
        <span class="card-title">净资产趋势（近12个月）</span>
      </div>
      <div ref="netWorthChartRef" class="chart-container chart-tall"></div>
    </div>

    <!-- 资产结构 + 收支对比 -->
    <div class="charts-row">
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">资产结构</span>
        </div>
        <div ref="assetChartRef" class="chart-container"></div>
      </div>

      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">月度收支对比</span>
        </div>
        <div ref="cashFlowChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 支出分类 Top5 -->
    <div class="finance-card chart-card full-width">
      <div class="card-header">
        <span class="card-title">本月支出分类 Top 5</span>
      </div>
      <div ref="expenseTop5Ref" class="chart-container"></div>
    </div>

    <!-- 快捷操作 -->
    <div class="section-title">快捷操作</div>
    <div class="quick-actions">
      <el-button type="primary" @click="showAddTransaction = true">
        <el-icon><Plus /></el-icon>
        记一笔
      </el-button>
      <el-button @click="$router.push('/goals')">
        <el-icon><Flag /></el-icon>
        查看目标
      </el-button>
      <el-button @click="$router.push('/dreams')">
        <el-icon><PictureFilled /></el-icon>
        梦想图册
      </el-button>
    </div>

    <!-- 记账弹窗 -->
    <el-dialog v-model="showAddTransaction" title="记一笔" width="400px">
      <el-form :model="transactionForm" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="transactionForm.type">
            <el-radio value="expense">支出</el-radio>
            <el-radio value="income">收入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="transactionForm.amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="transactionForm.category" placeholder="选择分类">
            <template v-if="transactionForm.type === 'expense'">
              <el-option label="餐饮" value="food" />
              <el-option label="交通" value="transport" />
              <el-option label="购物" value="shopping" />
              <el-option label="娱乐" value="entertainment" />
              <el-option label="其他" value="other" />
            </template>
            <template v-else>
              <el-option-group label="主动收入">
                <el-option label="工资" value="salary" />
                <el-option label="兼职" value="parttime" />
                <el-option label="其他" value="other" />
              </el-option-group>
              <el-option-group label="被动收入">
                <el-option label="投资收益" value="investment" />
                <el-option label="分红" value="dividend" />
                <el-option label="利息" value="interest" />
                <el-option label="产品收入" value="product" />
                <el-option label="租金" value="rental" />
                <el-option label="版税" value="royalty" />
                <el-option label="其他被动收入" value="passive" />
              </el-option-group>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="transactionForm.note" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTransaction = false">取消</el-button>
        <el-button type="primary" @click="handleAddTransaction">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Flag, PictureFilled, Sunny } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useAccountStore } from '@/stores/accounts'
import { useDebtStore } from '@/stores/debts'
import { useTransactionStore } from '@/stores/transactions'
import { useGoalStore } from '@/stores/goals'
import dayjs from 'dayjs'

const accountStore = useAccountStore()
const debtStore = useDebtStore()
const transactionStore = useTransactionStore()
const goalStore = useGoalStore()

const showAddTransaction = ref(false)
const transactionForm = ref({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  category: '',
  note: ''
})

const assetChartRef = ref<HTMLElement>()
const cashFlowChartRef = ref<HTMLElement>()
const netWorthChartRef = ref<HTMLElement>()
const expenseTop5Ref = ref<HTMLElement>()

// 财富洞察数据库
const wealthInsights = [
  { text: '战胜债务的最佳方式是积累财富，而不是节省开支。', source: '博多·舍费尔' },
  { text: '整天工作的人没有时间赚钱。', source: '约翰·D·洛克菲勒' },
  { text: '惊人的好运通常只是多年准备的结果。', source: '博多·舍费尔' },
  { text: '目标越清晰，机会感知越强，解决路径越短。', source: '财富自由法则' },
  { text: '74% 的百万富翁是企业家。构建系统，而非出卖时间。', source: '《邻家的百万富翁》' },
  { text: '复利是世界第八大奇迹。', source: '爱因斯坦' },
  { text: '不要把所有鸡蛋放在同一个篮子里。', source: '投资铁律' },
  { text: '资产是能把钱放进你口袋的东西，负债是把钱从你口袋拿走的东西。', source: '罗伯特·清崎' },
  { text: '财务自由不是拥有多少钱，而是有多少时间自由。', source: '财富哲学' },
  { text: '先支付给自己。收入的至少 10% 用于投资。', source: '《巴比伦最富有的人》' },
  { text: '时间价值 > 金钱价值。用金钱买时间，而非用时间换金钱。', source: '富人思维' },
  { text: '投资的关键不是智商，而是情绪稳定性。', source: '沃伦·巴菲特' },
  { text: '被动收入 = 本金 × 收益率。积累本金，提升收益率。', source: '财富公式' },
  { text: '储蓄率决定你何时财务自由，而非收入多少。', source: 'FIRE 运动' },
  { text: '你的净资产 = 真正的财富水平，总资产只是表面数字。', source: '财务真相' }
]

// 每日洞察（基于日期随机选择，每天固定显示同一条）
const dailyInsight = computed(() => {
  const today = dayjs().format('YYYYMMDD')
  const index = parseInt(today) % wealthInsights.length
  return wealthInsights[index]
})

const metrics = computed(() => ({
  netWorth: accountStore.totalAssets - debtStore.totalDebt,
  monthlyIncome: transactionStore.monthlyIncome,
  monthlyExpense: transactionStore.monthlyExpense,
  monthlyBalance: transactionStore.monthlyIncome - transactionStore.monthlyExpense
}))

const ratios = computed(() => {
  const income = transactionStore.monthlyIncome || 1
  const expense = transactionStore.monthlyExpense || 1
  const assets = accountStore.totalAssets || 1
  const goal = goalStore.safetyGoal
  const passiveIncome = transactionStore.monthlyPassiveIncome

  return {
    savingsRate: Math.min(100, Math.max(0, Math.round(((metrics.value.monthlyBalance / income) * 100)))),
    passiveIncomeRatio: Math.min(100, Math.max(0, Math.round((passiveIncome / expense) * 100))),
    debtRatio: Math.min(100, Math.max(0, Math.round((debtStore.totalDebt / assets) * 100))),
    freedomProgress: Math.min(100, Math.max(0, goal ? Math.round((metrics.value.netWorth / goal.targetAmount) * 100) : 0))
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const categoryLabels: Record<string, string> = {
  food: '餐饮', transport: '交通', shopping: '购物', entertainment: '娱乐',
  housing: '住房', health: '医疗', education: '教育', other: '其他',
  salary: '工资', parttime: '兼职', investment: '投资收益', dividend: '分红',
  interest: '利息', product: '产品收入', rental: '租金', royalty: '版税', passive: '其他被动'
}

const initCharts = () => {
  const transactions = transactionStore.transactions

  // ========== 1. 净资产趋势（近12个月） ==========
  if (netWorthChartRef.value) {
    const chart = echarts.init(netWorthChartRef.value)
    const months: string[] = []
    const netWorthData: number[] = []
    const currentNetWorth = accountStore.totalAssets - debtStore.totalDebt

    // 按月汇总收支差额
    const monthlyBalances: number[] = []
    for (let i = 11; i >= 0; i--) {
      const m = dayjs().subtract(i, 'month')
      months.push(m.format('YYYY-MM'))
      const start = m.startOf('month').format('YYYY-MM-DD')
      const end = m.endOf('month').format('YYYY-MM-DD')
      const monthTxs = transactions.filter(t => t.date >= start && t.date <= end)
      const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      monthlyBalances.push(income - expense)
    }

    // 从当前净资产往回反推：每月减去该月结余
    netWorthData[11] = currentNetWorth
    for (let i = 10; i >= 0; i--) {
      netWorthData[i] = netWorthData[i + 1] - monthlyBalances[i + 1]
    }

    chart.setOption({
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>净资产: ¥${p[0].value.toLocaleString()}` },
      grid: { left: 80, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: months, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` } },
      series: [{
        type: 'line', data: netWorthData, smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79,172,254,0.4)' }, { offset: 1, color: 'rgba(79,172,254,0.05)' }]) },
        lineStyle: { color: '#4facfe', width: 3 },
        itemStyle: { color: '#4facfe' }, symbol: 'circle', symbolSize: 6
      }]
    })
  }

  // ========== 2. 资产结构饼图 ==========
  if (assetChartRef.value) {
    const chart = echarts.init(assetChartRef.value)
    const assetData = [
      { value: accountStore.byType('cash').reduce((s, a) => s + a.balance, 0), name: '现金' },
      { value: accountStore.byType('investment').reduce((s, a) => s + a.balance, 0), name: '投资' },
      { value: accountStore.byType('fixed').reduce((s, a) => s + a.balance, 0), name: '固定资产' }
    ]
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        itemStyle: { borderRadius: 10 },
        label: { show: true, formatter: '{b}: {d}%' },
        data: assetData.filter(d => d.value > 0)
      }]
    })
  }

  // ========== 3. 月度收支对比（近6个月，真实数据） ==========
  if (cashFlowChartRef.value) {
    const chart = echarts.init(cashFlowChartRef.value)
    const months: string[] = []
    const incomeData: number[] = []
    const expenseData: number[] = []

    for (let i = 5; i >= 0; i--) {
      const m = dayjs().subtract(i, 'month')
      months.push(m.format('MM月'))
      const start = m.startOf('month').format('YYYY-MM-DD')
      const end = m.endOf('month').format('YYYY-MM-DD')
      const monthTxs = transactions.filter(t => t.date >= start && t.date <= end)
      incomeData.push(monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      expenseData.push(monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
    }

    chart.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        return params.map((p: any) => `${p.seriesName}: ¥${p.value.toLocaleString()}`).join('<br/>')
      }},
      legend: { data: ['收入', '支出'] },
      grid: { left: 60, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` } },
      series: [
        { name: '收入', type: 'bar', data: incomeData, itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] } },
        { name: '支出', type: 'bar', data: expenseData, itemStyle: { color: '#e6a23c', borderRadius: [4, 4, 0, 0] } }
      ]
    })
  }

  // ========== 4. 支出分类 Top5 ==========
  if (expenseTop5Ref.value) {
    const chart = echarts.init(expenseTop5Ref.value)
    const now = dayjs()
    const monthStart = now.startOf('month').format('YYYY-MM-DD')
    const monthEnd = now.endOf('month').format('YYYY-MM-DD')
    const monthExpenses = transactions.filter(t =>
      t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd
    )
    const categoryMap: Record<string, number> = {}
    monthExpenses.forEach(t => {
      const label = categoryLabels[t.category] || t.category
      categoryMap[label] = (categoryMap[label] || 0) + t.amount
    })
    const top5 = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round(value) }))

    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie', radius: ['0%', '65%'],
        itemStyle: { borderRadius: 6 },
        label: { show: true, formatter: '{b}: ¥{c}' },
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
        data: top5.length > 0 ? top5 : [{ name: '暂无数据', value: 1 }]
      }]
    })
  }
}

const handleAddTransaction = async () => {
  const userStore = await import('@/stores/user').then(m => m.useUserStore())
  const user = userStore().user

  if (user) {
    await transactionStore.createTransaction({
      userId: user.id,
      type: transactionForm.value.type,
      amount: transactionForm.value.amount,
      category: transactionForm.value.category,
      date: dayjs().format('YYYY-MM-DD'),
      note: transactionForm.value.note
    })
  }

  showAddTransaction.value = false
  transactionForm.value = { type: 'expense', amount: 0, category: '', note: '' }
}

onMounted(async () => {
  await Promise.all([
    accountStore.fetchAccounts(),
    debtStore.fetchDebts(),
    transactionStore.fetchTransactions(),
    goalStore.fetchGoals()
  ])
  initCharts()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .metric-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .metric-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 12px;
    color: #fff;

    .metric-icon {
      font-size: 36px;
    }

    .metric-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 700;
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    margin-top: 24px;
  }

  .ratio-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .ratio-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    text-align: center;

    .progress-value {
      font-size: 20px;
      font-weight: 700;
      display: block;
    }

    .progress-label {
      font-size: 12px;
      color: #909399;
    }

    .ratio-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
    }
  }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .full-width {
    margin-bottom: 16px;
  }

  .chart-card {
    .chart-container {
      height: 250px;
    }
    .chart-tall {
      height: 300px;
    }
  }

  .quick-actions {
    display: flex;
    gap: 12px;
  }

  .daily-insight {
    margin: 24px 0;
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

    .insight-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .el-icon {
        font-size: 20px;
      }

      .insight-title {
        font-size: 14px;
        font-weight: 600;
        opacity: 0.9;
      }
    }

    .insight-content {
      .insight-text {
        font-size: 16px;
        line-height: 1.6;
        margin: 0 0 8px 0;
        font-weight: 500;
      }

      .insight-source {
        font-size: 13px;
        margin: 0;
        opacity: 0.8;
        font-style: italic;
      }
    }
  }
}
</style>
