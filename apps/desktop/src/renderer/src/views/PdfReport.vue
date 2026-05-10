<template>
  <div class="pdf-report" v-loading="loading" v-if="!isLocked">
    <!-- 浮动工具栏（打印时隐藏） -->
    <div class="toolbar-float">
      <el-button @click="$router.back()" :icon="ArrowLeft">{{ t('pdfReport.goBack') }}</el-button>
      <el-button type="primary" :icon="Download" @click="handleExportPDF" :loading="pdfLoading">
        {{ t('pdfReport.exportPDF') }}
      </el-button>
    </div>

    <!-- 报告内容区域 -->
    <div class="report-content" ref="reportRef">
      <!-- 报告头部 -->
      <header class="report-header">
        <div class="header-left">
          <h1 class="report-title">{{ t('pdfReport.reportTitle') }}</h1>
          <p class="report-date">{{ reportDate }}</p>
        </div>
        <div class="header-right">
          <div class="health-badge" v-if="healthScore">
            <div class="badge-score" :style="{ color: scoreColor }">{{ healthScore.totalScore }}</div>
            <div class="badge-label">{{ t('pdfReport.comprehensiveScore') }}</div>
          </div>
        </div>
      </header>

      <!-- 一、核心指标概览 -->
      <section class="section">
        <h2 class="section-title">{{ t('pdfReport.section1') }}</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.totalAssets') }}</div>
            <div class="metric-value">{{ fmt(dashboard.totalAssets) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.totalDebts') }}</div>
            <div class="metric-value expense">{{ fmt(dashboard.totalDebts) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.netWorth') }}</div>
            <div class="metric-value income">{{ fmt(dashboard.netWorth) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.monthlyIncome') }}</div>
            <div class="metric-value">{{ fmt(monthly.total_income) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.monthlyExpense') }}</div>
            <div class="metric-value expense">{{ fmt(monthly.total_expense) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.monthlyBalance') }}</div>
            <div class="metric-value" :class="monthly.net_savings >= 0 ? 'income' : 'expense'">
              {{ fmt(monthly.net_savings) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.savingsRate') }}</div>
            <div class="metric-value">{{ (monthly.savingsRate ?? 0).toFixed(1) }}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.investmentReturnRate') }}</div>
            <div class="metric-value income">{{ (dashboard.investReturnRate ?? 0).toFixed(2) }}%</div>
          </div>
        </div>
      </section>

      <!-- 二、财务健康评分 -->
      <section class="section" v-if="healthScore">
        <h2 class="section-title">{{ t('pdfReport.section2') }}</h2>
        <div class="health-grid">
          <div class="health-dimension" v-for="dim in dimensions" :key="dim.key">
            <div class="dim-header">
              <span class="dim-icon">{{ dim.icon }}</span>
              <span class="dim-name">{{ dim.name }}</span>
            </div>
            <div class="dim-bar-track">
              <div
                class="dim-bar-fill"
                :style="{ width: (dim.value ?? 0) + '%', background: dim.color }"
              />
            </div>
            <div class="dim-score">{{ dim.value ?? 0 }}{{ t('pdfReport.scoreUnit') }}</div>
          </div>
        </div>
      </section>

      <!-- 三、收支分析 -->
      <section class="section">
        <h2 class="section-title">{{ t('pdfReport.section3') }}</h2>

        <!-- 趋势表 -->
        <table class="data-table" v-if="trend.length">
          <thead>
            <tr>
              <th>{{ t('pdfReport.month') }}</th>
              <th class="right">{{ t('pdfReport.income') }}</th>
              <th class="right">{{ t('pdfReport.expense') }}</th>
              <th class="right">{{ t('pdfReport.balance') }}</th>
              <th class="right">{{ t('pdfReport.savingsRate') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t_item in trend" :key="t_item.month">
              <td>{{ t_item.month }}</td>
              <td class="right income-text">{{ fmt(t_item.income) }}</td>
              <td class="right expense-text">{{ fmt(t_item.expense) }}</td>
              <td class="right" :class="t_item.net >= 0 ? 'income-text' : 'expense-text'">{{ fmt(t_item.net) }}</td>
              <td class="right">{{ (t_item.savingsRate ?? 0).toFixed(1) }}%</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>{{ t('pdfReport.monthlyAvg') }}</strong></td>
              <td class="right"><strong>{{ fmt(avgIncome) }}</strong></td>
              <td class="right"><strong>{{ fmt(avgExpense) }}</strong></td>
              <td class="right"><strong>{{ fmt(avgIncome - avgExpense) }}</strong></td>
              <td class="right"><strong>{{ avgSavingsRate.toFixed(1) }}%</strong></td>
            </tr>
          </tfoot>
        </table>

        <div v-else class="empty-hint">{{ t('pdfReport.noData') }}</div>

        <!-- 分类明细 -->
        <div class="category-grid" v-if="monthly.incomeByCategory?.length || monthly.expenseByCategory?.length">
          <div class="category-block">
            <h3>{{ t('pdfReport.incomeCategory') }}</h3>
            <div class="cat-row" v-for="item in monthly.incomeByCategory" :key="item.category">
              <span>{{ item.category || t('pdfReport.uncategorized') }}</span>
              <span class="income-text">{{ fmt(item.amount) }}</span>
            </div>
            <div class="empty-hint" v-if="!monthly.incomeByCategory?.length">{{ t('pdfReport.noData') }}</div>
          </div>
          <div class="category-block">
            <h3>{{ t('pdfReport.expenseCategory') }}</h3>
            <div class="cat-row" v-for="item in monthly.expenseByCategory" :key="item.category">
              <span>{{ item.category || t('pdfReport.uncategorized') }}</span>
              <span class="expense-text">{{ fmt(item.amount) }}</span>
            </div>
            <div class="empty-hint" v-if="!monthly.expenseByCategory?.length">{{ t('pdfReport.noData') }}</div>
          </div>
        </div>
      </section>

      <!-- 四、目标进度 -->
      <section class="section">
        <h2 class="section-title">{{ t('pdfReport.section4') }}</h2>
        <div v-if="goals.length === 0" class="empty-hint">{{ t('pdfReport.noGoals') }}</div>

        <div class="goals-list">
          <div v-for="(items, stage) in goalsByStage" :key="stage" class="goal-stage">
            <h3 class="stage-label">
              {{ stage === 'guarantee' ? t('pdfReport.stageGuarantee') : stage === 'security' ? t('pdfReport.stageSecurity') : t('pdfReport.stageFreedom') }}
            </h3>
            <div v-for="g in items" :key="g.id" class="goal-row">
              <div class="goal-info">
                <span class="goal-name">{{ g.name }}</span>
                <span class="goal-pct">{{ (g.progress_pct ?? 0).toFixed(1) }}%</span>
              </div>
              <div class="goal-bar-track">
                <div class="goal-bar-fill" :style="{ width: Math.min(g.progress_pct ?? 0, 100) + '%' }" />
              </div>
              <div class="goal-meta-row">
                <span>{{ fmt(g.current_amount) }} / {{ fmt(g.target_amount) }}</span>
                <span v-if="g.estimatedMonths">{{ t('pdfReport.estimatedMonths', { months: g.estimatedMonths }) }}（{{ g.estimatedDate }}）</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 五、投资概况 -->
      <section class="section">
        <h2 class="section-title">{{ t('pdfReport.section5') }}</h2>
        <div class="metrics-grid small">
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.investmentTotal') }}</div>
            <div class="metric-value">{{ fmt(dashboard.investTotal ?? 0) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.investmentProfit') }}</div>
            <div class="metric-value income">{{ fmt(dashboard.investProfit ?? 0) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t('pdfReport.returnRate') }}</div>
            <div class="metric-value">{{ (dashboard.investReturnRate ?? 0).toFixed(2) }}%</div>
          </div>
        </div>
      </section>

      <!-- 报告页脚 -->
      <footer class="report-footer">
        <p>{{ t('pdfReport.footer') }} · {{ reportDate }}</p>
        <p>{{ t('pdfReport.footerDisclaimer') }}</p>
      </footer>
    </div>
  </div>
  <!-- 功能门控：免费版提示 -->
  <div v-if="isLocked" class="feature-gate-overlay">
    <div class="gate-card">
      <div class="gate-icon">🔒</div>
      <h3>{{ t('pdfReport.lockedTitle') }}</h3>
      <p>{{ t('pdfReport.lockedDesc') }}</p>
      <div class="gate-badges">
        <span class="badge badge-pro">{{ t('pdfReport.proBadge') }}</span>
        <span class="badge badge-trial">{{ t('pdfReport.trialBadge') }}</span>
      </div>
      <el-button type="primary" @click="$router.push('/license')">{{ t('pdfReport.upgradeNow') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, ArrowLeft } from '@element-plus/icons-vue'
import { exportToPDF } from '../utils/export'
import FeatureGate from '@/components/FeatureGate.vue'
import { useLicense } from '@/composables/useLicense'
import useI18n from '../i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { safeCall } = useErrorHandler()

const { t } = useI18n()

const { features, status: licenseStatus } = useLicense()
const isLocked = computed(() => licenseStatus.value.tier !== 'trial' && !features.value.hasPdfReport)

const loading = ref(false)
const pdfLoading = ref(false)
const reportRef = ref<HTMLElement>()

// 数据
const dashboard = ref<any>({})
const monthly = ref<any>({})
const trend = ref<any[]>([])
const goals = ref<any[]>([])
const healthScore = ref<any>(null)

// 计算属性
const reportDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

const scoreColor = computed(() => {
  const s = healthScore.value?.totalScore ?? 0
  if (s >= 80) return '#67c23a'
  if (s >= 60) return '#e6a23c'
  return '#f56c6c'
})

const dimensions = computed(() => {
  const s = healthScore.value
  return [
    { key: 'savings', name: t('pdfReport.savings'), icon: '🏦', value: s?.savingsScore, color: '#67c23a' },
    { key: 'debt', name: t('pdfReport.debtManage'), icon: '💳', value: s?.debtScore, color: '#409eff' },
    { key: 'invest', name: t('pdfReport.investmentGrowth'), icon: '📈', value: s?.investScore, color: '#e6a23c' },
    { key: 'stability', name: t('pdfReport.incomeStability'), icon: '🔒', value: s?.stabilityScore, color: '#909399' },
    { key: 'plan', name: t('pdfReport.goalPlanning'), icon: '🎯', value: s?.planScore, color: '#f56c6c' },
  ]
})

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

const goalsByStage = computed(() => {
  const map: Record<string, any[]> = { guarantee: [], security: [], freedom: [] }
  goals.value.forEach(g => {
    const stage = g.stage || 'guarantee'
    if (!map[stage]) map[stage] = []
    map[stage].push(g)
  })
  return map
})

// 方法
function fmt(val: number) {
  return '¥' + (val ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function handleExportPDF() {
  pdfLoading.value = true
  await safeCall(async () => {
    await exportToPDF('财务综合报告')
  })
  pdfLoading.value = false
}

// 加载数据
async function loadAll() {
  if (!window.electronAPI) return
  loading.value = true
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const uid = { userId: user.id }

    // 并行加载
    const [dashRes, monthRes, trendRes, goalsRes, healthRes] = await Promise.allSettled([
      window.electronAPI.getDashboardData(),
      window.electronAPI.report.monthlySummary({ ...uid, year: new Date().getFullYear(), month: new Date().getMonth() + 1 }),
      window.electronAPI.report.monthlyTrend({ ...uid, months: 12 }),
      window.electronAPI.report.goalProgress(uid),
      window.electronAPI.report.healthScore(uid),
    ])

    if (dashRes.status === 'fulfilled') dashboard.value = dashRes.value ?? {}
    if (monthRes.status === 'fulfilled') monthly.value = monthRes.value ?? {}
    if (trendRes.status === 'fulfilled') trend.value = trendRes.value?.trend ?? []
    if (goalsRes.status === 'fulfilled') goals.value = goalsRes.value?.goals ?? []
    if (healthRes.status === 'fulfilled') healthScore.value = healthRes.value ?? null
  })
  loading.value = false
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
.pdf-report {
  padding: 16px;
  background: var(--bg-body);
  min-height: 100vh;
}

// 浮动工具栏
.toolbar-float {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0;
  background: var(--bg-body);
}

// 报告内容
.report-content {
  max-width: 900px;
  margin: 0 auto;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 40px 48px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

// 报告头
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #1a1a2e;

  .report-title {
    font-size: 28px;
    font-weight: 800;
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  .report-date {
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.health-badge {
  text-align: center;
  padding: 12px 20px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;

  .badge-score {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
  }

  .badge-label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
}

// Section
.section {
  margin-bottom: 28px;
  page-break-inside: avoid;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

// 指标卡片
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  &.small {
    grid-template-columns: repeat(3, 1fr);
  }
}

.metric-card {
  padding: 12px;
  background: var(--bg-body);
  border-radius: 8px;
  border: 1px solid var(--border-color);

  .metric-label {
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .metric-value {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .metric-value.income { color: var(--el-color-success); }
  .metric-value.expense { color: var(--el-color-danger); }
}

// 健康维度
.health-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.health-dimension {
  display: grid;
  grid-template-columns: 120px 1fr 50px;
  align-items: center;
  gap: 12px;

  .dim-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  .dim-bar-track {
    height: 10px;
    background: #f0f0f0;
    border-radius: 5px;
    overflow: hidden;
  }

  .dim-bar-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.4s;
  }

  .dim-score {
    text-align: right;
    font-weight: 600;
    font-size: 13px;
    color: #666;
  }
}

// 数据表格
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 16px;

  th, td {
    padding: 8px 10px;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
  }

  th {
    background: #fafafa;
    font-weight: 600;
    color: #666;
    font-size: 12px;
  }

  .right { text-align: right; }
  .income-text { color: #67c23a; }
  .expense-text { color: #f56c6c; }

  tfoot td {
    border-top: 2px solid #ddd;
    background: #fafafa;
  }
}

// 分类
.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.category-block {
  h3 {
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 600;
  }
}

.cat-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px solid #f8f8f8;
}

// 目标
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.goal-row {
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;

  .goal-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;

    .goal-name { font-weight: 600; font-size: 13px; }
    .goal-pct { font-size: 13px; color: #409eff; font-weight: 600; }
  }

  .goal-bar-track {
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .goal-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #4facfe, #00f2fe);
    border-radius: 4px;
  }

  .goal-meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #999;
  }
}

// 页脚
.report-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  text-align: center;
  font-size: 11px;
  color: #bbb;
  line-height: 1.8;
}

.empty-hint {
  color: #ccc;
  text-align: center;
  padding: 16px;
  font-size: 13px;
}

// 打印样式
@media print {
  .pdf-report { padding: 0; background: #fff; min-height: auto; }
  .toolbar-float { display: none !important; }
  .report-content {
    max-width: 100%;
    padding: 0;
    box-shadow: none;
    border-radius: 0;
  }
  .section { page-break-inside: avoid; }
  .metrics-grid { grid-template-columns: repeat(4, 1fr); }
}
</style>  
