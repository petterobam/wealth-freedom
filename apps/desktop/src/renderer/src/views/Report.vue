<template>
  <div class="report-page">
    <div class="title-row">
      <div>
        <h1 class="page-title">{{ t('report.title') }}</h1>
        <p class="page-desc">{{ t('report.desc') }}</p>
      </div>
      <el-button type="primary" :icon="Download" @click="handleExportPDF" :loading="pdfLoading">
        {{ t('report.exportPDFReport') }}
      </el-button>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="report-tabs">
      <!-- 财务健康评分 -->
      <el-tab-pane :label="t('report.healthScore')" name="health">
        <HealthScore />
      </el-tab-pane>

      <!-- 月度报表 -->
      <el-tab-pane :label="t('report.monthly')" name="monthly">
        <div class="toolbar">
          <el-date-picker
            v-model="monthlyPeriod"
            type="month"
            :placeholder="t('report.selectMonth')"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            @change="loadMonthlyReport"
          />
        </div>

        <!-- 概览卡片 -->
        <div class="overview-cards" v-loading="monthlyLoading">
          <div class="overview-card">
            <div class="card-icon">💰</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.totalIncome') }}</div>
              <div class="card-value income">{{ fmt(monthly.total_income) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💸</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.totalExpense') }}</div>
              <div class="card-value expense">{{ fmt(monthly.total_expense) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.netSavings') }}</div>
              <div class="card-value" :class="monthly.net_savings >= 0 ? 'income' : 'expense'">
                {{ fmt(monthly.net_savings) }}
              </div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📈</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.savingsRate') }}</div>
              <div class="card-value">{{ monthly.savingsRate?.toFixed(1) ?? 0 }}%</div>
            </div>
          </div>
        </div>

        <!-- 分类明细 -->
        <div class="category-section" v-if="monthly.incomeByCategory?.length || monthly.expenseByCategory?.length">
          <el-row :gutter="20">
            <el-col :span="12" :xs="24">
              <div class="category-card">
                <h3>{{ t('report.incomeCategory') }}</h3>
                <div class="category-list">
                  <div v-for="item in monthly.incomeByCategory" :key="item.category" class="category-item">
                    <span class="cat-name">{{ item.category || t('report.uncategorized') }}</span>
                    <span class="cat-amount income">{{ fmt(item.amount) }}</span>
                  </div>
                  <div v-if="!monthly.incomeByCategory?.length" class="empty-hint">{{ t('report.noData') }}</div>
                </div>
              </div>
            </el-col>
            <el-col :span="12" :xs="24">
              <div class="category-card">
                <h3>{{ t('report.expenseCategory') }}</h3>
                <div class="category-list">
                  <div v-for="item in monthly.expenseByCategory" :key="item.category" class="category-item">
                    <span class="cat-name">{{ item.category || t('report.uncategorized') }}</span>
                    <span class="cat-amount expense">{{ fmt(item.amount) }}</span>
                  </div>
                  <div v-if="!monthly.expenseByCategory?.length" class="empty-hint">{{ t('report.noData') }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="empty-state" v-if="!monthlyLoading && !monthly.total_income && !monthly.total_expense">
          <div class="empty-icon">📋</div>
          <p>{{ t('report.noRecordsMonth') }}</p>
        </div>
      </el-tab-pane>

      <!-- 年度报表 -->
      <el-tab-pane :label="t('report.yearly')" name="yearly">
        <div class="toolbar">
          <el-date-picker
            v-model="yearlyPeriod"
            type="year"
            :placeholder="t('report.selectYear')"
            format="YYYY年"
            value-format="YYYY"
            @change="loadYearlyReport"
          />
        </div>

        <div class="overview-cards" v-loading="yearlyLoading">
          <div class="overview-card">
            <div class="card-icon">💰</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.yearlyTotalIncome') }}</div>
              <div class="card-value income">{{ fmt(yearly.total_income) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💸</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.yearlyTotalExpense') }}</div>
              <div class="card-value expense">{{ fmt(yearly.total_expense) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.yearlyNetSavings') }}</div>
              <div class="card-value" :class="yearly.net_savings >= 0 ? 'income' : 'expense'">
                {{ fmt(yearly.net_savings) }}
              </div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📈</div>
            <div class="card-info">
              <div class="card-label">{{ t('report.yearlySavingsRate') }}</div>
              <div class="card-value">{{ yearly.savingsRate?.toFixed(1) ?? 0 }}%</div>
            </div>
          </div>
        </div>

        <!-- 同比变化 -->
        <div class="yoy-section" v-if="yearly.yoyChange">
          <div class="section-card">
            <h3>{{ t('report.yoyChange') }}</h3>
            <div class="yoy-grid">
              <div class="yoy-item">
                <span class="yoy-label">{{ t('report.income') }}</span>
                <span class="yoy-value" :class="yearly.yoyChange.income >= 0 ? 'income' : 'expense'">
                  {{ yearly.yoyChange.income != null ? (yearly.yoyChange.income >= 0 ? '+' : '') + yearly.yoyChange.income.toFixed(1) + '%' : '-' }}
                </span>
              </div>
              <div class="yoy-item">
                <span class="yoy-label">{{ t('report.expense') }}</span>
                <span class="yoy-value" :class="yearly.yoyChange.expense <= 0 ? 'income' : 'expense'">
                  {{ yearly.yoyChange.expense != null ? (yearly.yoyChange.expense >= 0 ? '+' : '') + yearly.yoyChange.expense.toFixed(1) + '%' : '-' }}
                </span>
              </div>
              <div class="yoy-item">
                <span class="yoy-label">{{ t('report.savings') }}</span>
                <span class="yoy-value" :class="yearly.yoyChange.savings >= 0 ? 'income' : 'expense'">
                  {{ yearly.yoyChange.savings != null ? (yearly.yoyChange.savings >= 0 ? '+' : '') + yearly.yoyChange.savings.toFixed(1) + '%' : '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 月度趋势 -->
        <div class="section-card" v-if="yearly.monthlyBreakdown?.length">
          <h3>{{ t('report.monthlyBreakdown') }}</h3>
          <div class="monthly-breakdown">
            <div v-for="m in yearly.monthlyBreakdown" :key="m.month" class="breakdown-row">
              <span class="month-label">{{ m.month }}月</span>
              <div class="breakdown-bar">
                <div class="bar-income" :style="{ width: barWidth(m.income, yearly.total_income) }" />
                <div class="bar-expense" :style="{ width: barWidth(m.expense, yearly.total_income) }" />
              </div>
              <span class="breakdown-income income">{{ fmt(m.income) }}</span>
              <span class="breakdown-expense expense">{{ fmt(m.expense) }}</span>
            </div>
          </div>
        </div>

        <div class="empty-state" v-if="!yearlyLoading && !yearly.total_income && !yearly.total_expense">
          <div class="empty-icon">📋</div>
          <p>{{ t('report.noRecordsYear') }}</p>
        </div>
      </el-tab-pane>

      <!-- 收支趋势 -->
      <el-tab-pane :label="t('report.trend')" name="trend">
        <div class="toolbar">
          <el-select v-model="trendMonths" style="width: 160px" @change="loadTrend">
            <el-option :value="6" :label="t('report.last6Months')" />
            <el-option :value="12" :label="t('report.last12Months')" />
            <el-option :value="24" :label="t('report.last24Months')" />
          </el-select>
        </div>

        <div class="section-card" v-loading="trendLoading">
          <h3>{{ t('report.trendTitle') }}</h3>
          <div v-if="trend.length === 0 && !trendLoading" class="empty-state" style="padding: 20px">
            <p>{{ t('report.noTrendData') }}</p>
          </div>
          <div v-else class="trend-list">
            <div v-for="t in trend" :key="t.month" class="trend-row">
              <span class="trend-month">{{ t.month }}</span>
              <div class="trend-bar-group">
                <div class="trend-bar">
                  <div class="bar-fill income-fill" :style="{ width: trendBarWidth(t.income) }" />
                </div>
                <div class="trend-bar">
                  <div class="bar-fill expense-fill" :style="{ width: trendBarWidth(t.expense) }" />
                </div>
              </div>
              <div class="trend-values">
                <span class="income">{{ fmt(t.income) }}</span>
                <span class="expense">{{ fmt(t.expense) }}</span>
                <span class="net" :class="t.net >= 0 ? 'income' : 'expense'">{{ fmt(t.net) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 趋势统计 -->
        <el-row :gutter="16" style="margin-top: 16px" v-if="trend.length">
          <el-col :span="8" :xs="24">
            <div class="stat-card">
              <div class="stat-label">{{ t('report.avgMonthlyIncome') }}</div>
              <div class="stat-value income">{{ fmt(avgIncome) }}</div>
            </div>
          </el-col>
          <el-col :span="8" :xs="24">
            <div class="stat-card">
              <div class="stat-label">{{ t('report.avgMonthlyExpense') }}</div>
              <div class="stat-value expense">{{ fmt(avgExpense) }}</div>
            </div>
          </el-col>
          <el-col :span="8" :xs="24">
            <div class="stat-card">
              <div class="stat-label">{{ t('report.avgMonthlySavingsRate') }}</div>
              <div class="stat-value">{{ avgSavingsRate.toFixed(1) }}%</div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 目标进度 -->
      <el-tab-pane :label="t('report.goalProgress')" name="goals">
        <div v-loading="goalsLoading">
          <div v-if="goals.length === 0 && !goalsLoading" class="empty-state">
            <div class="empty-icon">🎯</div>
            <p>{{ t('report.noGoals') }}</p>
          </div>

          <!-- 月均储蓄提示 -->
          <div class="section-card" v-if="avgMonthlySavings > 0" style="margin-bottom: 16px">
            <div class="savings-hint">
              {{ t('report.savingsHintPrefix') }} <strong>{{ fmt(avgMonthlySavings) }}</strong>
            </div>
          </div>

          <!-- 按阶段分组 -->
          <div v-for="(items, stage) in goalsByStage" :key="stage" class="stage-group">
            <h3 class="stage-title">
              {{ stage === 'security' ? t('report.guarantee') : stage === 'safety' ? t('report.security') : t('report.freedom') }}
            </h3>
            <div v-for="g in items" :key="g.id" class="goal-card">
              <div class="goal-header">
                <span class="goal-name">{{ g.name }}</span>
                <el-tag size="small" type="info">{{ g.progress_pct?.toFixed(1) ?? 0 }}%</el-tag>
              </div>
              <div class="goal-progress">
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: Math.min(g.progress_pct ?? 0, 100) + '%' }" />
                </div>
              </div>
              <div class="goal-meta">
                <span>{{ fmt(g.current_amount) }} / {{ fmt(g.target_amount) }}</span>
                <span v-if="g.estimatedMonths">
                  {{ t('report.estimatedMonths') }} <strong>{{ g.estimatedMonths }}</strong> {{ t('report.monthsUnit') }}（{{ g.estimatedDate }}）
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import HealthScore from './HealthScore.vue'
import { exportToPDF } from '../utils/export'
import { useI18n } from '@/i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { safeCall } = useErrorHandler()

const { t } = useI18n()

const activeTab = ref('health')
const pdfLoading = ref(false)

async function handleExportPDF() {
  pdfLoading.value = true
  await safeCall(async () => {
    await exportToPDF(t('report.title'))
  })
  pdfLoading.value = false
}

// ==================== 月度报表 ====================
const monthlyPeriod = ref(new Date().toISOString().slice(0, 7))
const monthlyLoading = ref(false)
const monthly = ref<any>({})

async function loadMonthlyReport() {
  if (!window.electronAPI) return
  monthlyLoading.value = true
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const [year, month] = monthlyPeriod.value.split('-').map(Number)
    monthly.value = await window.electronAPI.report.monthlySummary({ userId: user.id, year, month })
  })
  monthlyLoading.value = false
}

// ==================== 年度报表 ====================
const yearlyPeriod = ref(new Date().getFullYear().toString())
const yearlyLoading = ref(false)
const yearly = ref<any>({})

async function loadYearlyReport() {
  if (!window.electronAPI) return
  yearlyLoading.value = true
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return
    yearly.value = await window.electronAPI.report.yearlySummary({
      userId: user.id,
      year: parseInt(yearlyPeriod.value)
    })
  })
  yearlyLoading.value = false
}

// ==================== 收支趋势 ====================
const trendMonths = ref(12)
const trendLoading = ref(false)
const trend = ref<any[]>([])

const avgIncome = computed(() => {
  if (!trend.value.length) return 0
  return trend.value.reduce((s, t) => s + t.income, 0) / trend.value.length
})
const avgExpense = computed(() => {
  if (!trend.value.length) return 0
  return trend.value.reduce((s, t) => s + t.expense, 0) / trend.value.length
})
const avgSavingsRate = computed(() => {
  if (!trend.value.length) return 0
  return trend.value.reduce((s, t) => s + (t.savingsRate ?? 0), 0) / trend.value.length
})

async function loadTrend() {
  if (!window.electronAPI) return
  trendLoading.value = true
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const res = await window.electronAPI.report.monthlyTrend({
      userId: user.id,
      months: trendMonths.value
    })
    trend.value = res.trend || []
  })
  trendLoading.value = false
}

// ==================== 目标进度 ====================
const goalsLoading = ref(false)
const goals = ref<any[]>([])
const avgMonthlySavings = ref(0)

const goalsByStage = computed(() => {
  const map: Record<string, any[]> = { security: [], safety: [], freedom: [] }
  goals.value.forEach(g => {
    const stage = g.stage || 'security'
    if (!map[stage]) map[stage] = []
    map[stage].push(g)
  })
  return map
})

async function loadGoals() {
  if (!window.electronAPI) return
  goalsLoading.value = true
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const res = await window.electronAPI.report.goalProgress({ userId: user.id })
    goals.value = res.goals || []
    avgMonthlySavings.value = res.avgMonthlySavings || 0
  })
  goalsLoading.value = false
}

// ==================== 工具函数 ====================
function fmt(val: number) {
  return '¥' + (val ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function barWidth(val: number, max: number) {
  if (!max) return '0%'
  return Math.min((val / max) * 100, 100) + '%'
}

function trendBarWidth(val: number) {
  const maxVal = Math.max(...trend.value.map(t => Math.max(t.income, t.expense)), 1)
  return Math.min((val / maxVal) * 100, 100) + '%'
}

// ==================== 初始化 ====================
onMounted(() => {
  loadMonthlyReport()
  loadYearlyReport()
  loadTrend()
  loadGoals()
})
</script>

<style lang="scss" scoped>
.report-page {
  max-width: 960px;
  margin: 0 auto;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-desc {
  color: var(--text-regular);
  margin-bottom: 20px;
}

.report-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

// 概览卡片
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.overview-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }
  .card-icon { font-size: 28px; }
  .card-label { font-size: 12px; color: var(--text-secondary); }
  .card-value { font-size: 18px; font-weight: 700; color: var(--text-primary); }
  .card-value.income { color: var(--el-color-success); }
  .card-value.expense { color: var(--el-color-danger); }
}

// 分类明细
.category-section {
  margin-bottom: 24px;
}

.category-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;

  h3 {
    font-size: 14px;
    color: var(--text-regular);
    margin-bottom: 12px;
    font-weight: 600;
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child { border-bottom: none; }
  .cat-name { color: var(--text-primary); font-size: 13px; }
  .cat-amount { font-weight: 600; font-size: 14px; }
  .cat-amount.income { color: var(--el-color-success); }
  .cat-amount.expense { color: var(--el-color-danger); }
}

.empty-hint {
  color: var(--text-placeholder);
  text-align: center;
  padding: 12px;
  font-size: 13px;
}

// 同比变化
.yoy-section {
  margin-bottom: 24px;
}

.section-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 15px;
    color: var(--text-primary);
    margin-bottom: 16px;
    font-weight: 600;
  }
}

.yoy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.yoy-item {
  text-align: center;
  .yoy-label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
  .yoy-value { font-size: 20px; font-weight: 700; }
  .yoy-value.income { color: var(--el-color-success); }
  .yoy-value.expense { color: var(--el-color-danger); }
}

// 月度明细（年度）
.monthly-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breakdown-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;

  .month-label {
    width: 40px;
    color: var(--text-regular);
    flex-shrink: 0;
  }

  .breakdown-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .bar-income, .bar-expense {
      height: 4px;
      border-radius: 2px;
      transition: width 0.4s ease;
    }
    .bar-income { background: var(--el-color-success); }
    .bar-expense { background: var(--el-color-danger); }
  }

  .breakdown-income, .breakdown-expense {
    width: 90px;
    text-align: right;
    flex-shrink: 0;
  }
  .breakdown-income.income { color: var(--el-color-success); }
  .breakdown-expense.expense { color: var(--el-color-danger); }
}

// 趋势列表
.trend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;

  .trend-month {
    width: 70px;
    color: var(--text-regular);
    flex-shrink: 0;
  }

  .trend-bar-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .trend-bar {
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    overflow: hidden;

    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    .income-fill { background: linear-gradient(90deg, var(--el-color-success), var(--el-color-success-light-3)); }
    .expense-fill { background: linear-gradient(90deg, var(--el-color-danger), var(--el-color-danger-light-3)); }
  }

  .trend-values {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    width: 240px;
    justify-content: flex-end;

    span { font-size: 12px; }
    .income { color: var(--el-color-success); }
    .expense { color: var(--el-color-danger); }
    .net { font-weight: 600; }
  }
}

.stat-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 12px;

  .stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
  .stat-value { font-size: 20px; font-weight: 700; color: var(--text-primary); }
  .stat-value.income { color: var(--el-color-success); }
  .stat-value.expense { color: var(--el-color-danger); }
}

// 目标进度
.savings-hint {
  font-size: 14px;
  color: var(--text-regular);
  strong { color: var(--el-color-success); }
}

.stage-group {
  margin-bottom: 20px;
}

.stage-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.goal-card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .goal-name { font-weight: 600; color: var(--text-primary); }
}

.goal-progress {
  .progress-track {
    height: 8px;
    background: var(--border-color);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4facfe, #00f2fe);
    border-radius: 4px;
    transition: width 0.4s ease;
  }
}

.goal-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-regular);
  margin-top: 6px;

  strong { color: var(--text-primary); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
}

// PDF 打印优化
@media print {
  .title-row button { display: none; }
  .toolbar { display: none; }
  .el-tabs__header { display: none; }
  .report-page { max-width: 100%; }
}
</style>
