<template>
  <div class="income-dashboard">
    <h1 class="page-title">{{ t('incomeDashboard.title') }}</h1>

    <!-- 核心指标卡片 -->
    <div class="metric-cards">
      <div class="metric-card gradient-primary">
        <div class="metric-icon">💰</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('incomeDashboard.monthlyTotalIncome') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.totalIncome) }}</div>
          <div class="metric-change" :class="metrics.incomeChange >= 0 ? 'positive' : 'negative'">
            {{ metrics.incomeChange >= 0 ? '▲' : '▼' }} {{ Math.abs(metrics.incomeChange) }}% {{ t('incomeDashboard.vsLastMonth') }}
          </div>
        </div>
      </div>

      <div class="metric-card gradient-success">
        <div class="metric-icon">🏃</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('incomeDashboard.activeIncome') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.activeIncome) }}</div>
          <div class="metric-change">{{ metrics.activePercentage }}%</div>
        </div>
      </div>

      <div class="metric-card gradient-warning">
        <div class="metric-icon">🌴</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('incomeDashboard.passiveIncome') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.passiveIncome) }}</div>
          <div class="metric-change">{{ metrics.passivePercentage }}%</div>
        </div>
      </div>

      <div class="metric-card gradient-info">
        <div class="metric-icon">🎯</div>
        <div class="metric-info">
          <div class="metric-label">{{ t('incomeDashboard.gapToFinancialSafety') }}</div>
          <div class="metric-value">{{ formatCurrency(metrics.gapToFinancialSafety) }}</div>
          <div class="metric-change">{{ t('incomeDashboard.monthlyNeeded') }}</div>
        </div>
      </div>
    </div>

    <!-- 收入来源分布 -->
    <div class="section-title">{{ t('incomeDashboard.incomeSourceDistribution') }}</div>
    <div class="income-sources">
      <div v-for="source in incomeSources" :key="source.category" class="income-source-item">
        <div class="source-header">
          <span class="source-name">{{ source.name }}</span>
          <span class="source-amount">{{ formatCurrency(source.amount) }} ({{ source.percentage }}%)</span>
        </div>
        <el-progress
          :percentage="source.percentage"
          :color="source.color"
          :stroke-width="8"
          :show-text="false"
        />
      </div>
    </div>

    <!-- 近6个月收入趋势 -->
    <div class="charts-row">
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('incomeDashboard.last6MonthsTrend') }}</span>
        </div>
        <div ref="incomeTrendChartRef" class="chart-container"></div>
      </div>

      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('incomeDashboard.activeVsPassive') }}</span>
        </div>
        <div ref="incomeTypeChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 财务自由进度 -->
    <div class="section-title">{{ t('incomeDashboard.freedomProgress') }}</div>
    <div class="freedom-progress">
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">{{ t('incomeDashboard.passiveIncomeTarget') }}</span>
          <span class="progress-value">{{ metrics.passivePercentage }}% / 100%</span>
        </div>
        <el-progress
          :percentage="metrics.passivePercentage"
          :color="getProgressColor(metrics.passivePercentage)"
          :stroke-width="20"
        />
      </div>
      <div class="progress-tip">
        {{ t('incomeDashboard.progressTip').replace('{coverage}', metrics.passiveCoverageRatio).replace('{gap}', formatCurrency(metrics.gapToFinancialSafety)) }}
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="section-title">{{ t('incomeDashboard.quickActions') }}</div>
    <div class="quick-actions">
      <el-button type="primary" @click="$router.push('/income-goals')">
        <el-icon><Flag /></el-icon>
        {{ t('incomeDashboard.setIncomeGoal') }}
      </el-button>
      <el-button @click="$router.push('/income-analysis')">
        <el-icon><TrendCharts /></el-icon>
        {{ t('incomeDashboard.incomeAnalysis') }}
      </el-button>
      <el-button @click="$router.push('/income-strategies')">
        <el-icon><Star /></el-icon>
        {{ t('incomeDashboard.incomeStrategies') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Flag, TrendCharts, Star } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useIncomeStore } from '@/stores/income'
import { formatCurrency } from '@/utils/format'
import useI18n from "../i18n"

const incomeStore = useIncomeStore()
const { t } = useI18n()

const incomeTrendChartRef = ref<HTMLElement>()
const incomeTypeChartRef = ref<HTMLElement>()

// 核心指标
const metrics = computed(() => {
  const currentMonth = incomeStore.getCurrentMonthIncome()
  const lastMonth = incomeStore.getLastMonthIncome()
  const totalIncome = currentMonth.active + currentMonth.passive
  const lastTotalIncome = lastMonth.active + lastMonth.passive

  const incomeChange = lastTotalIncome > 0
    ? ((totalIncome - lastTotalIncome) / lastTotalIncome * 100).toFixed(1)
    : '0.0'

  const activePercentage = totalIncome > 0
    ? (currentMonth.active / totalIncome * 100).toFixed(0)
    : '0'

  const passivePercentage = totalIncome > 0
    ? (currentMonth.passive / totalIncome * 100).toFixed(0)
    : '0'

  // 计算距离财务安全的差距
  const monthlyExpenses = 10000 // 从财务看板获取月支出
  const gapToFinancialSafety = Math.max(0, monthlyExpenses - currentMonth.passive)

  const passiveCoverageRatio = monthlyExpenses > 0
    ? (currentMonth.passive / monthlyExpenses * 100).toFixed(0)
    : '0'

  return {
    totalIncome,
    activeIncome: currentMonth.active,
    passiveIncome: currentMonth.passive,
    incomeChange: parseFloat(incomeChange),
    activePercentage,
    passivePercentage,
    gapToFinancialSafety,
    passiveCoverageRatio
  }
})

// 收入来源分布
const incomeSources = computed(() => {
  const sources = incomeStore.getCurrentMonthIncomeBySource()
  const total = sources.reduce((sum, s) => sum + s.amount, 0)

  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']

  return sources.map((source, index) => ({
    ...source,
    percentage: total > 0 ? (source.amount / total * 100).toFixed(0) : '0',
    color: colors[index % colors.length]
  }))
})

// 进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 50) return '#409eff'
  if (percentage >= 30) return '#e6a23c'
  return '#f56c6c'
}

// 初始化收入趋势图表
const initIncomeTrendChart = () => {
  if (!incomeTrendChartRef.value) return

  const chart = echarts.init(incomeTrendChartRef.value)
  const trendData = incomeStore.getLast6MonthsIncomeTrend()

  const months = trendData.map(d => d.month)
  const activeData = trendData.map(d => d.active)
  const passiveData = trendData.map(d => d.passive)
  const totalData = trendData.map(d => d.active + d.passive)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let tooltip = `${params[0].axisValueLabel}<br/>`
        params.forEach((param: any) => {
          tooltip += `${param.marker} ${param.seriesName}: ${formatCurrency(param.value)}<br/>`
        })
        return tooltip
      }
    },
    legend: {
      data: [t('incomeDashboard.activeIncome'), t('incomeDashboard.passiveIncome'), t('incomeDashboard.monthlyTotalIncome')],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        name: t('incomeDashboard.activeIncome'),
        type: 'bar',
        stack: 'income',
        data: activeData,
        itemStyle: { color: '#5470c6' }
      },
      {
        name: t('incomeDashboard.passiveIncome'),
        type: 'bar',
        stack: 'income',
        data: passiveData,
        itemStyle: { color: '#91cc75' }
      },
      {
        name: t('incomeDashboard.monthlyTotalIncome'),
        type: 'line',
        data: totalData,
        itemStyle: { color: '#fac858' },
        lineStyle: { width: 3 }
      }
    ]
  }

  chart.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => chart.resize())
}

// 初始化收入类型对比图表
const initIncomeTypeChart = () => {
  if (!incomeTypeChartRef.value) return

  const chart = echarts.init(incomeTypeChartRef.value)
  const trendData = incomeStore.getLast6MonthsIncomeTrend()

  const months = trendData.map(d => d.month)
  const activeData = trendData.map(d => d.active)
  const passiveData = trendData.map(d => d.passive)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: [t('incomeDashboard.activeIncome'), t('incomeDashboard.passiveIncome')],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        name: t('incomeDashboard.activeIncome'),
        type: 'bar',
        data: activeData,
        itemStyle: { color: '#5470c6' }
      },
      {
        name: t('incomeDashboard.passiveIncome'),
        type: 'bar',
        data: passiveData,
        itemStyle: { color: '#91cc75' }
      }
    ]
  }

  chart.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => chart.resize())
}

// 页面挂载时初始化
onMounted(async () => {
  await incomeStore.loadIncomeData()
  initIncomeTrendChart()
  initIncomeTypeChart()
})
</script>

<style scoped>
.income-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.metric-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.metric-change {
  font-size: 12px;
  color: #909399;
}

.metric-change.positive {
  color: #67c23a;
}

.metric-change.negative {
  color: #f56c6c;
}

.gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.gradient-primary .metric-label,
.gradient-primary .metric-value,
.gradient-primary .metric-change {
  color: white;
}

.gradient-success {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
}

.gradient-warning {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.gradient-info {
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 30px 0 20px 0;
  color: #303133;
}

.income-sources {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.income-source-item {
  margin-bottom: 20px;
}

.income-source-item:last-child {
  margin-bottom: 0;
}

.source-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.source-name {
  font-size: 14px;
  color: #606266;
}

.source-amount {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.finance-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-card {
  min-height: 350px;
}

.chart-container {
  width: 100%;
  height: 280px;
}

.freedom-progress {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.progress-item {
  margin-bottom: 15px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.progress-tip {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 10px;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  flex: 1;
  min-width: 180px;
}
</style>
