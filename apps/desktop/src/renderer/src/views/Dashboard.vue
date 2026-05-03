<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">{{ t('dashboard.title') }} <span v-if="currency.loaded.value" class="base-currency-badge">{{ currency.baseCurrency.value }}</span></h1>
      <el-button type="primary" :icon="Download" @click="handleExportPDF" :loading="pdfLoading">
        {{ t('dashboard.exportPDF') }}
      </el-button>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metric-cards">
      <div class="metric-card gradient-primary">
        <div class="metric-icon">💎</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('dashboard.netWorth') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.netWorth) }}</div>
        </div>
      </div>

      <div class="metric-card gradient-success">
        <div class="metric-icon">📈</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('dashboard.monthlyIncome') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.monthlyIncome) }}</div>
        </div>
      </div>

      <div class="metric-card gradient-warning">
        <div class="metric-icon">📉</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('dashboard.monthlyExpense') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.monthlyExpense) }}</div>
        </div>
      </div>

      <div class="metric-card" :class="metrics.monthlyBalance >= 0 ? 'gradient-success' : 'gradient-danger'">
        <div class="metric-icon">💰</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('dashboard.monthlyBalance') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.monthlyBalance) }}</div>
        </div>
      </div>
    </div>

    <!-- 每日财富洞察 -->
    <div class="daily-insight">
      <div class="insight-header">
        <el-icon><Sunny /></el-icon>
        <span class="insight-title">{{ t('dashboard.dailyInsight') }}</span>
      </div>
      <div class="insight-content">
        <p class="insight-text">{{ dailyInsight.text }}</p>
        <p class="insight-source">— {{ dailyInsight.source }}</p>
      </div>
    </div>

    <!-- 财务比率 -->
    <div class="section-title">{{ t('dashboard.keyRatios') }}</div>
    <div class="ratio-cards">
      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.savingsRate" 
          :color="ratios.savingsRate >= 30 ? '#67c23a' : '#e6a23c'"
        >
          <template #default>
            <span class="progress-value">{{ ratios.savingsRate }}%</span>
            <span class="progress-label">{{ t('dashboard.savingsRate') }}</span>
          </template>
        </el-progress>
        <p class="ratio-tip">{{ t('dashboard.targetGt30') }}</p>
      </div>

      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.passiveIncomeRatio" 
          :color="ratios.passiveIncomeRatio >= 100 ? '#67c23a' : '#e6a23c'"
        >
          <template #default>
            <span class="progress-value">{{ ratios.passiveIncomeRatio }}%</span>
            <span class="progress-label">{{ t('dashboard.passiveCoverage') }}</span>
          </template>
        </el-progress>
        <p class="ratio-tip">{{ t('dashboard.targetGt30') }}</p>
      </div>

      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.debtRatio" 
          :color="ratios.debtRatio <= 30 ? '#67c23a' : '#f56c6c'"
        >
          <template #default>
            <span class="progress-value">{{ ratios.debtRatio }}%</span>
            <span class="progress-label">{{ t('dashboard.debtRatio') }}</span>
          </template>
        </el-progress>
        <p class="ratio-tip">{{ t('dashboard.targetLt30') }}</p>
      </div>

      <div class="ratio-card">
        <el-progress 
          type="dashboard" 
          :percentage="ratios.freedomProgress" 
          color="#4facfe"
        >
          <template #default>
            <span class="progress-value">{{ ratios.freedomProgress }}%</span>
            <span class="progress-label">{{ t('dashboard.freedomProgress') }}</span>
          </template>
        </el-progress>
        <p class="ratio-tip">{{ t('dashboard.freedomProgressTip') }}</p>
      </div>
    </div>

    <!-- 净资产趋势 -->
    <div class="finance-card chart-card full-width">
      <div class="card-header">
        <span class="card-title">{{ t('dashboard.netWorthTrend') }}</span>
      </div>
      <div ref="netWorthChartRef" class="chart-container chart-tall"></div>
    </div>

    <!-- 资产结构 + 收支对比 -->
    <div class="charts-row">
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('dashboard.assetStructure') }}</span>
        </div>
        <div ref="assetChartRef" class="chart-container"></div>
      </div>

      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('dashboard.monthlyComparison') }}</span>
        </div>
        <div ref="cashFlowChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 支出分类 Top5 -->
    <div class="finance-card chart-card full-width">
      <div class="card-header">
        <span class="card-title">{{ t('dashboard.expenseTop5') }}</span>
      </div>
      <div ref="expenseTop5Ref" class="chart-container"></div>
    </div>

    <!-- 快捷操作 -->
    <div class="section-title">{{ t('dashboard.quickActions') }}</div>
    <div class="quick-actions">
      <el-button type="primary" @click="showAddTransaction = true">
        <el-icon><Plus /></el-icon>
        {{ t('dashboard.addTransaction') }}
      </el-button>
      <el-button @click="$router.push('/goals')">
        <el-icon><Flag /></el-icon>
        {{ t('dashboard.viewGoals') }}
      </el-button>
      <el-button @click="$router.push('/dreams')">
        <el-icon><PictureFilled /></el-icon>
        {{ t('dashboard.dreamBoard') }}
      </el-button>
    </div>

    <!-- 记账弹窗 -->
    <el-dialog v-model="showAddTransaction" :title="t('dashboard.addTransaction')" width="400px">
      <el-form :model="transactionForm" label-width="80px">
        <el-form-item :label="t('dashboard.type')">
          <el-radio-group v-model="transactionForm.type">
            <el-radio value="expense">{{ t('dashboard.expense') }}</el-radio>
            <el-radio value="income">{{ t('dashboard.income') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('dashboard.amount')">
          <el-input-number v-model="transactionForm.amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item :label="t('dashboard.category')">
          <el-select v-model="transactionForm.category" :placeholder="t('transactions.selectCategory')">
            <template v-if="transactionForm.type === 'expense'">
              <el-option :label="t('transactions.categories.food')" value="food" />
              <el-option :label="t('transactions.categories.transport')" value="transport" />
              <el-option :label="t('transactions.categories.shopping')" value="shopping" />
              <el-option :label="t('transactions.categories.entertainment')" value="entertainment" />
              <el-option :label="t('transactions.categories.other')" value="other" />
            </template>
            <template v-else>
              <el-option-group :label="t('transactions.activeIncome')">
                <el-option :label="t('transactions.categories.salary')" value="salary" />
                <el-option :label="t('transactions.categories.parttime')" value="parttime" />
                <el-option :label="t('transactions.categories.other')" value="other" />
              </el-option-group>
              <el-option-group :label="t('transactions.passiveIncome')">
                <el-option :label="t('transactions.categories.investment')" value="investment" />
                <el-option :label="t('transactions.categories.dividend')" value="dividend" />
                <el-option :label="t('transactions.categories.interest')" value="interest" />
                <el-option :label="t('transactions.categories.product')" value="product" />
                <el-option :label="t('transactions.categories.rental')" value="rental" />
                <el-option :label="t('transactions.categories.royalty')" value="royalty" />
                <el-option :label="t('transactions.categories.passiveOther')" value="passive" />
              </el-option-group>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('dashboard.note')">
          <el-input v-model="transactionForm.note" :placeholder="t('dashboard.optional')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTransaction = false">{{ t('dashboard.cancel') }}</el-button>
        <el-button type="primary" @click="handleAddTransaction">{{ t('dashboard.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Plus, Flag, PictureFilled, Sunny, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useAccountStore } from '@/stores/accounts'
import { useDebtStore } from '@/stores/debts'
import { useTransactionStore } from '@/stores/transactions'
import { useGoalStore } from '@/stores/goals'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { exportToPDF } from '../utils/export'
import { useCurrency } from '@/composables/useCurrency'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const pdfLoading = ref(false)

async function handleExportPDF() {
  pdfLoading.value = true
  try {
    await exportToPDF(t('dashboard.title'))
  } catch (e: any) {
    ElMessage.error(t('dashboard.exportPDF') + ': ' + e.message)
  } finally {
    pdfLoading.value = false
  }
}

const accountStore = useAccountStore()
const debtStore = useDebtStore()
const transactionStore = useTransactionStore()
const goalStore = useGoalStore()
const currency = useCurrency()

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

let netWorthChart: echarts.ECharts | null = null
let cashFlowChart: echarts.ECharts | null = null
let assetChart: echarts.ECharts | null = null
let expenseTop5Chart: echarts.ECharts | null = null

const handleResize = () => {
  netWorthChart?.resize()
  cashFlowChart?.resize()
  assetChart?.resize()
  expenseTop5Chart?.resize()
}

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

const formatCurrency = (value: number, fromCurrency?: string) => {
  if (fromCurrency && fromCurrency !== currency.baseCurrency.value) {
    return currency.formatConverted(value, fromCurrency)
  }
  return currency.formatMoney(value)
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
    netWorthChart = echarts.init(netWorthChartRef.value)
    const chart = netWorthChart
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
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>${t('dashboard.netWorth')}: ¥${p[0].value.toLocaleString()}` },
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
    assetChart = echarts.init(assetChartRef.value)
    const chart = assetChart
    const assetData = [
      { value: accountStore.byType('cash').reduce((s, a) => s + a.balance, 0), name: t('accounts.cash') },
      { value: accountStore.byType('investment').reduce((s, a) => s + a.balance, 0), name: t('accounts.investment') },
      { value: accountStore.byType('fixed').reduce((s, a) => s + a.balance, 0), name: 'Fixed' }
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
    cashFlowChart = echarts.init(cashFlowChartRef.value)
    const chart = cashFlowChart
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
      legend: { data: [t('dashboard.income'), t('dashboard.expense')] },
      grid: { left: 60, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` } },
      series: [
        { name: t('dashboard.income'), type: 'bar', data: incomeData, itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] } },
        { name: t('dashboard.expense'), type: 'bar', data: expenseData, itemStyle: { color: '#e6a23c', borderRadius: [4, 4, 0, 0] } }
      ]
    })
  }

  // ========== 4. 支出分类 Top5 ==========
  if (expenseTop5Ref.value) {
    expenseTop5Chart = echarts.init(expenseTop5Ref.value)
    const chart = expenseTop5Chart
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
        data: top5.length > 0 ? top5 : [{ name: t('dashboard.noData'), value: 1 }]
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
  // v1.9.0 多币种初始化
  try {
    const userStore = await import('@/stores/user').then(m => m.useUserStore())
    const user = userStore().user
    if (user) await currency.init(user.id)
  } catch { /* 单币种回退 */ }
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  netWorthChart?.dispose()
  cashFlowChart?.dispose()
  assetChart?.dispose()
  expenseTop5Chart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .base-currency-badge {
    font-size: 12px;
    font-weight: 500;
    background: var(--el-color-primary-light-9, #ecf5ff);
    color: var(--el-color-primary, #409eff);
    padding: 2px 8px;
    border-radius: 10px;
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
    background: var(--bg-card);
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

// PDF 打印优化
@media print {
  .page-header .el-button { display: none !important; }
  .quick-actions { display: none !important; }
  .daily-insight { break-inside: avoid; }
  .chart-card { break-inside: avoid; }
  .ratio-card { break-inside: avoid; }
  .metric-card { break-inside: avoid; }
}
</style>
