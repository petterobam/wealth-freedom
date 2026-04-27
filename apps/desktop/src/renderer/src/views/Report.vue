<template>
  <div class="report-page">
    <h1 class="page-title">报表分析</h1>
    <p class="page-desc">用数据说话，看清你的财务全貌</p>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="report-tabs">
      <!-- 财务健康评分 -->
      <el-tab-pane label="健康评分" name="health">
        <HealthScore />
      </el-tab-pane>

      <!-- 月度报表 -->
      <el-tab-pane label="月度报表" name="monthly">
        <div class="toolbar">
          <el-date-picker
            v-model="monthlyPeriod"
            type="month"
            placeholder="选择月份"
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
              <div class="card-label">总收入</div>
              <div class="card-value income">{{ fmt(monthly.total_income) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💸</div>
            <div class="card-info">
              <div class="card-label">总支出</div>
              <div class="card-value expense">{{ fmt(monthly.total_expense) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-info">
              <div class="card-label">净储蓄</div>
              <div class="card-value" :class="monthly.net_savings >= 0 ? 'income' : 'expense'">
                {{ fmt(monthly.net_savings) }}
              </div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📈</div>
            <div class="card-info">
              <div class="card-label">储蓄率</div>
              <div class="card-value">{{ monthly.savingsRate?.toFixed(1) ?? 0 }}%</div>
            </div>
          </div>
        </div>

        <!-- 分类明细 -->
        <div class="category-section" v-if="monthly.incomeByCategory?.length || monthly.expenseByCategory?.length">
          <el-row :gutter="20">
            <el-col :span="12" :xs="24">
              <div class="category-card">
                <h3>收入分类</h3>
                <div class="category-list">
                  <div v-for="item in monthly.incomeByCategory" :key="item.category" class="category-item">
                    <span class="cat-name">{{ item.category || '未分类' }}</span>
                    <span class="cat-amount income">{{ fmt(item.amount) }}</span>
                  </div>
                  <div v-if="!monthly.incomeByCategory?.length" class="empty-hint">暂无数据</div>
                </div>
              </div>
            </el-col>
            <el-col :span="12" :xs="24">
              <div class="category-card">
                <h3>支出分类</h3>
                <div class="category-list">
                  <div v-for="item in monthly.expenseByCategory" :key="item.category" class="category-item">
                    <span class="cat-name">{{ item.category || '未分类' }}</span>
                    <span class="cat-amount expense">{{ fmt(item.amount) }}</span>
                  </div>
                  <div v-if="!monthly.expenseByCategory?.length" class="empty-hint">暂无数据</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="empty-state" v-if="!monthlyLoading && !monthly.total_income && !monthly.total_expense">
          <div class="empty-icon">📋</div>
          <p>该月暂无交易记录</p>
        </div>
      </el-tab-pane>

      <!-- 年度报表 -->
      <el-tab-pane label="年度报表" name="yearly">
        <div class="toolbar">
          <el-date-picker
            v-model="yearlyPeriod"
            type="year"
            placeholder="选择年份"
            format="YYYY年"
            value-format="YYYY"
            @change="loadYearlyReport"
          />
        </div>

        <div class="overview-cards" v-loading="yearlyLoading">
          <div class="overview-card">
            <div class="card-icon">💰</div>
            <div class="card-info">
              <div class="card-label">年总收入</div>
              <div class="card-value income">{{ fmt(yearly.total_income) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💸</div>
            <div class="card-info">
              <div class="card-label">年总支出</div>
              <div class="card-value expense">{{ fmt(yearly.total_expense) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-info">
              <div class="card-label">年净储蓄</div>
              <div class="card-value" :class="yearly.net_savings >= 0 ? 'income' : 'expense'">
                {{ fmt(yearly.net_savings) }}
              </div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📈</div>
            <div class="card-info">
              <div class="card-label">年储蓄率</div>
              <div class="card-value">{{ yearly.savingsRate?.toFixed(1) ?? 0 }}%</div>
            </div>
          </div>
        </div>

        <!-- 同比变化 -->
        <div class="yoy-section" v-if="yearly.yoyChange">
          <div class="section-card">
            <h3>同比变化（vs 上年）</h3>
            <div class="yoy-grid">
              <div class="yoy-item">
                <span class="yoy-label">收入</span>
                <span class="yoy-value" :class="yearly.yoyChange.income >= 0 ? 'income' : 'expense'">
                  {{ yearly.yoyChange.income != null ? (yearly.yoyChange.income >= 0 ? '+' : '') + yearly.yoyChange.income.toFixed(1) + '%' : '-' }}
                </span>
              </div>
              <div class="yoy-item">
                <span class="yoy-label">支出</span>
                <span class="yoy-value" :class="yearly.yoyChange.expense <= 0 ? 'income' : 'expense'">
                  {{ yearly.yoyChange.expense != null ? (yearly.yoyChange.expense >= 0 ? '+' : '') + yearly.yoyChange.expense.toFixed(1) + '%' : '-' }}
                </span>
              </div>
              <div class="yoy-item">
                <span class="yoy-label">储蓄</span>
                <span class="yoy-value" :class="yearly.yoyChange.savings >= 0 ? 'income' : 'expense'">
                  {{ yearly.yoyChange.savings != null ? (yearly.yoyChange.savings >= 0 ? '+' : '') + yearly.yoyChange.savings.toFixed(1) + '%' : '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 月度趋势 -->
        <div class="section-card" v-if="yearly.monthlyBreakdown?.length">
          <h3>月度明细</h3>
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
          <p>该年暂无交易记录</p>
        </div>
      </el-tab-pane>

      <!-- 收支趋势 -->
      <el-tab-pane label="收支趋势" name="trend">
        <div class="toolbar">
          <el-select v-model="trendMonths" style="width: 160px" @change="loadTrend">
            <el-option :value="6" label="近 6 个月" />
            <el-option :value="12" label="近 12 个月" />
            <el-option :value="24" label="近 24 个月" />
          </el-select>
        </div>

        <div class="section-card" v-loading="trendLoading">
          <h3>收支月度趋势</h3>
          <div v-if="trend.length === 0 && !trendLoading" class="empty-state" style="padding: 20px">
            <p>暂无趋势数据</p>
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
              <div class="stat-label">月均收入</div>
              <div class="stat-value income">{{ fmt(avgIncome) }}</div>
            </div>
          </el-col>
          <el-col :span="8" :xs="24">
            <div class="stat-card">
              <div class="stat-label">月均支出</div>
              <div class="stat-value expense">{{ fmt(avgExpense) }}</div>
            </div>
          </el-col>
          <el-col :span="8" :xs="24">
            <div class="stat-card">
              <div class="stat-label">月均储蓄率</div>
              <div class="stat-value">{{ avgSavingsRate.toFixed(1) }}%</div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 目标进度 -->
      <el-tab-pane label="目标进度" name="goals">
        <div v-loading="goalsLoading">
          <div v-if="goals.length === 0 && !goalsLoading" class="empty-state">
            <div class="empty-icon">🎯</div>
            <p>暂无进行中的目标</p>
          </div>

          <!-- 月均储蓄提示 -->
          <div class="section-card" v-if="avgMonthlySavings > 0" style="margin-bottom: 16px">
            <div class="savings-hint">
              基于近 6 个月数据，月均储蓄 <strong>{{ fmt(avgMonthlySavings) }}</strong>
            </div>
          </div>

          <!-- 按阶段分组 -->
          <div v-for="(items, stage) in goalsByStage" :key="stage" class="stage-group">
            <h3 class="stage-title">
              {{ stage === 'guarantee' ? '🟢 财务保障' : stage === 'security' ? '🟡 财务安全' : '🔴 财务自由' }}
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
                  预计还需 <strong>{{ g.estimatedMonths }}</strong> 个月（{{ g.estimatedDate }}）
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
import HealthScore from './HealthScore.vue'

const activeTab = ref('health')

// ==================== 月度报表 ====================
const monthlyPeriod = ref(new Date().toISOString().slice(0, 7))
const monthlyLoading = ref(false)
const monthly = ref<any>({})

async function loadMonthlyReport() {
  if (!window.electronAPI) return
  monthlyLoading.value = true
  try {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const [year, month] = monthlyPeriod.value.split('-').map(Number)
    monthly.value = await window.electronAPI.report.monthlySummary({ userId: user.id, year, month })
  } catch (e: any) {
    ElMessage.error('加载月度报表失败: ' + e.message)
  } finally {
    monthlyLoading.value = false
  }
}

// ==================== 年度报表 ====================
const yearlyPeriod = ref(new Date().getFullYear().toString())
const yearlyLoading = ref(false)
const yearly = ref<any>({})

async function loadYearlyReport() {
  if (!window.electronAPI) return
  yearlyLoading.value = true
  try {
    const user = await window.electronAPI.getUser()
    if (!user) return
    yearly.value = await window.electronAPI.report.yearlySummary({
      userId: user.id,
      year: parseInt(yearlyPeriod.value)
    })
  } catch (e: any) {
    ElMessage.error('加载年度报表失败: ' + e.message)
  } finally {
    yearlyLoading.value = false
  }
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
  try {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const res = await window.electronAPI.report.monthlyTrend({
      userId: user.id,
      months: trendMonths.value
    })
    trend.value = res.trend || []
  } catch (e: any) {
    ElMessage.error('加载趋势失败: ' + e.message)
  } finally {
    trendLoading.value = false
  }
}

// ==================== 目标进度 ====================
const goalsLoading = ref(false)
const goals = ref<any[]>([])
const avgMonthlySavings = ref(0)

const goalsByStage = computed(() => {
  const map: Record<string, any[]> = { guarantee: [], security: [], freedom: [] }
  goals.value.forEach(g => {
    const stage = g.stage || 'guarantee'
    if (!map[stage]) map[stage] = []
    map[stage].push(g)
  })
  return map
})

async function loadGoals() {
  if (!window.electronAPI) return
  goalsLoading.value = true
  try {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const res = await window.electronAPI.report.goalProgress({ userId: user.id })
    goals.value = res.goals || []
    avgMonthlySavings.value = res.avgMonthlySavings || 0
  } catch (e: any) {
    ElMessage.error('加载目标进度失败: ' + e.message)
  } finally {
    goalsLoading.value = false
  }
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

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.page-desc {
  color: #666;
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
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }
  .card-icon { font-size: 28px; }
  .card-label { font-size: 12px; color: #999; }
  .card-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .card-value.income { color: #67c23a; }
  .card-value.expense { color: #f56c6c; }
}

// 分类明细
.category-section {
  margin-bottom: 24px;
}

.category-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;

  h3 {
    font-size: 14px;
    color: #666;
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
  border-bottom: 1px solid #f5f5f5;

  &:last-child { border-bottom: none; }
  .cat-name { color: #333; font-size: 13px; }
  .cat-amount { font-weight: 600; font-size: 14px; }
  .cat-amount.income { color: #67c23a; }
  .cat-amount.expense { color: #f56c6c; }
}

.empty-hint {
  color: #ccc;
  text-align: center;
  padding: 12px;
  font-size: 13px;
}

// 同比变化
.yoy-section {
  margin-bottom: 24px;
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 15px;
    color: #1a1a2e;
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
  .yoy-label { display: block; font-size: 12px; color: #999; margin-bottom: 4px; }
  .yoy-value { font-size: 20px; font-weight: 700; }
  .yoy-value.income { color: #67c23a; }
  .yoy-value.expense { color: #f56c6c; }
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
    color: #666;
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
    .bar-income { background: #67c23a; }
    .bar-expense { background: #f56c6c; }
  }

  .breakdown-income, .breakdown-expense {
    width: 90px;
    text-align: right;
    flex-shrink: 0;
  }
  .breakdown-income.income { color: #67c23a; }
  .breakdown-expense.expense { color: #f56c6c; }
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
    color: #666;
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
    background: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;

    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    .income-fill { background: linear-gradient(90deg, #67c23a, #85ce61); }
    .expense-fill { background: linear-gradient(90deg, #f56c6c, #f89898); }
  }

  .trend-values {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    width: 240px;
    justify-content: flex-end;

    span { font-size: 12px; }
    .income { color: #67c23a; }
    .expense { color: #f56c6c; }
    .net { font-weight: 600; }
  }
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 12px;

  .stat-label { font-size: 12px; color: #999; margin-bottom: 4px; }
  .stat-value { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .stat-value.income { color: #67c23a; }
  .stat-value.expense { color: #f56c6c; }
}

// 目标进度
.savings-hint {
  font-size: 14px;
  color: #666;
  strong { color: #67c23a; }
}

.stage-group {
  margin-bottom: 20px;
}

.stage-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.goal-card {
  background: #fff;
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

  .goal-name { font-weight: 600; color: #1a1a2e; }
}

.goal-progress {
  .progress-track {
    height: 8px;
    background: #f0f0f0;
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
  color: #666;
  margin-top: 6px;

  strong { color: #1a1a2e; }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
}
</style>
