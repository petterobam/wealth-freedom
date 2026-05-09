<template>
  <div class="prepayment-calculator">
    <h1 class="page-title">{{ t('prepaymentCalculator.title') }}</h1>

    <!-- 输入参数 -->
    <div class="finance-card input-card">
      <div class="card-header">
        <span class="card-title">{{ t('prepaymentCalculator.loanInfo') }}</span>
        <el-tag type="info">{{ t('prepaymentCalculator.tagline') }}</el-tag>

            <el-button type="primary" text @click="handleExportChart">
              <el-icon><Picture /></el-icon>
              {{ t('prepaymentCalculator.saveChart') }}
            </el-button>
</div>

      <el-form :model="calculatorForm" label-width="120px" class="calculator-form">
        <el-form-item :label="t('prepaymentCalculator.loanAmount')">
          <el-input-number
            v-model="calculatorForm.principal"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('prepaymentCalculator.unitYuan') }}</span>
          <HelpTooltip :content="prepaymentTutorial.parameters.loanAmount" />
        </el-form-item>

        <el-form-item :label="t('prepaymentCalculator.loanTerm')">
          <el-input-number
            v-model="calculatorForm.totalYears"
            :min="1"
            :max="30"
            controls-position="right"
          />
          <span class="unit">{{ t('prepaymentCalculator.unitYears') }}</span>
          <HelpTooltip :content="prepaymentTutorial.parameters.loanTerm" />
        </el-form-item>

        <el-form-item :label="t('prepaymentCalculator.loanRate')">
          <el-slider
            v-model="calculatorForm.annualRate"
            :min="0"
            :max="20"
            :step="0.1"
            :marks="rateMarks"
            show-input
          />
          <span class="unit">{{ t('prepaymentCalculator.unitPercent') }}</span>
          <HelpTooltip :content="prepaymentTutorial.parameters.annualRate" />
        </el-form-item>

        <el-form-item :label="t('prepaymentCalculator.paidPeriods')">
          <el-input-number
            v-model="calculatorForm.paidYears"
            :min="0"
            :max="calculatorForm.totalYears - 1"
            controls-position="right"
          />
          <span class="unit">{{ t('prepaymentCalculator.unitYears') }}</span>
          <HelpTooltip :content="prepaymentTutorial.parameters.prepaymentDate" />
        </el-form-item>

        <el-form-item :label="t('prepaymentCalculator.prepaymentAmount')">
          <el-input-number
            v-model="calculatorForm.prepayAmount"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('prepaymentCalculator.unitYuan') }}</span>
          <HelpTooltip :content="prepaymentTutorial.parameters.prepaymentAmount" />
        </el-form-item>

        <el-form-item :label="t('prepaymentCalculator.repaymentMethod')">
          <el-radio-group v-model="calculatorForm.prepayType">
            <el-radio value="reduce_months">{{ t('prepaymentCalculator.reduceMonths') }}</el-radio>
            <el-radio value="reduce_payment">{{ t('prepaymentCalculator.reducePayment') }}</el-radio>
          </el-radio-group>
          <HelpTooltip :content="prepaymentTutorial.parameters.prepaymentType" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleCalculate">
            <el-icon><TrendCharts /></el-icon>
            {{ t('prepaymentCalculator.calculate') }}
          </el-button>
          <el-button @click="handleReset">{{ t('prepaymentCalculator.reset') }}</el-button>
          <el-button type="success" @click="openScenarioDialog">
            <el-icon><FolderOpened /></el-icon>
            {{ t('prepaymentCalculator.scenarioManagement') }}
          </el-button>
          <el-button type="warning" @click="loadExampleData">
            <el-icon><DocumentCopy /></el-icon>
            {{ t('prepaymentCalculator.exampleData') }}
          </el-button>
          <el-button v-if="result" type="info" @click="handleExportPDF">
            <el-icon><Download /></el-icon>
            {{ t('prepaymentCalculator.exportPDF') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 场景管理对话框 -->
    <el-dialog v-model="showScenarioDialog" :title="t('prepaymentCalculator.scenarioManagement')" width="600px">
      <div class="scenario-actions">
        <el-input
          v-model="currentScenarioName"
          :placeholder="t('prepaymentCalculator.scenarioNamePlaceholder')"
          style="width: 200px"
        />
        <el-button type="primary" @click="handleSaveScenario(currentScenarioName)">
          {{ t('prepaymentCalculator.saveCurrentScenario') }}
        </el-button>
      </div>

      <el-divider />

      <div class="scenario-list">
        <el-empty v-if="Object.keys(scenarios).length === 0" :description="t('prepaymentCalculator.noSavedScenarios')" />

        <el-table v-else :data="Object.entries(scenarios).map(([name, data]) => ({ name, ...data }))" style="width: 100%">
          <el-table-column prop="name" :label="t('prepaymentCalculator.scenarioNameCol')" width="200" />
          <el-table-column :label="t('prepaymentCalculator.parametersCol')" width="300">
            <template #default="{ row }">
              <div class="scenario-params">
                <span>{{ t('prepaymentCalculator.loan') }}: ¥{{ row.data?.principal?.toLocaleString() }}</span>
                <span>{{ row.data?.totalYears }}{{ t('prepaymentCalculator.unitYears') }}, {{ row.data?.annualRate }}%</span>
                <span>{{ t('prepaymentCalculator.paid') }}{{ row.data?.paidYears }}{{ t('prepaymentCalculator.unitYears') }}</span>
                <span>{{ t('prepaymentCalculator.prepay') }}: ¥{{ row.data?.prepayAmount?.toLocaleString() }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('prepaymentCalculator.operationsCol')" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleLoadScenario(row.name)">
                {{ t('prepaymentCalculator.load') }}
              </el-button>
              <el-button type="danger" link @click="handleDeleteScenario(row.name)">
                {{ t('prepaymentCalculator.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 计算结果 -->
    <div v-if="result" class="result-section">
      <div class="section-title">{{ t('prepaymentCalculator.calcResults') }}</div>

      <!-- 原贷款信息 -->
      <div class="finance-card">
        <div class="card-header">
          <span class="card-title">{{ t('prepaymentCalculator.originalLoanInfo') }}</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.originalMonthlyPayment') }}</span>
            <span class="value">{{ formatCurrency(result.originalLoan.monthlyPayment) }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.paidPeriodsLabel') }}</span>
            <span class="value">{{ result.paidMonths }}{{ t('prepaymentCalculator.paidMonths') }}({{ calculatorForm.paidYears }}{{ t('prepaymentCalculator.unitYears') }})</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.paidPrincipal') }}</span>
            <span class="value">{{ formatCurrency(result.paidPrincipal) }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.remainingPrincipal') }}</span>
            <span class="value primary">{{ formatCurrency(result.remainingPrincipal) }}</span>
          </div>
        </div>
      </div>

      <!-- 提前还款方案 -->
      <div class="finance-card highlight-card">
        <div class="card-header">
          <span class="card-title">{{ t('prepaymentCalculator.prepaymentPlan') }}</span>
          <el-tag :type="result.type === 'reduce_months' ? 'success' : 'primary'">
            {{ result.type === 'reduce_months' ? t('prepaymentCalculator.reduceMonthsType') : t('prepaymentCalculator.reducePaymentType') }}
          </el-tag>
        </div>

        <div class="metric-cards">
          <div class="metric-card gradient-primary">
            <div class="metric-icon">💰</div>
            <div class="metric-info">
              <div class="metric-label">{{ t('prepaymentCalculator.prepayment') }}</div>
              <div class="metric-value">{{ formatCurrency(result.prepayAmount) }}</div>
            </div>
          </div>

          <div class="metric-card gradient-info">
            <div class="metric-icon">📉</div>
            <div class="metric-info">
              <div class="metric-label">{{ t('prepaymentCalculator.remainingPrincipal') }}</div>
              <div class="metric-value">{{ formatCurrency(result.newPrincipal) }}</div>
            </div>
          </div>
        </div>

        <div v-if="result.type === 'reduce_months'" class="info-grid">
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.newMonthlyPayment') }}</span>
            <span class="value">{{ formatCurrency(result.originalLoan.monthlyPayment) }}{{ t('prepaymentCalculator.unchanged') }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.newTerm') }}</span>
            <span class="value success">{{ result.newMonths }}{{ t('prepaymentCalculator.paidMonths') }}({{ Math.round(result.newMonths / 12) }}{{ t('prepaymentCalculator.unitYears') }})</span>
          </div>
          <div class="info-item highlight">
            <span class="label">{{ t('prepaymentCalculator.savedPeriods') }}</span>
            <span class="value success">{{ result.savedMonths }}{{ t('prepaymentCalculator.paidMonths') }}({{ Math.round(result.savedMonths / 12) }}{{ t('prepaymentCalculator.unitYears') }})</span>
          </div>
          <div class="info-item highlight">
            <span class="label">{{ t('prepaymentCalculator.savedInterest') }}</span>
            <span class="value success">{{ formatCurrency(result.savedInterest) }}</span>
          </div>
        </div>

        <div v-else class="info-grid">
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.newMonthlyPayment') }}</span>
            <span class="value success">{{ formatCurrency(result.newLoan.monthlyPayment) }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.reducedPayment') }}</span>
            <span class="value success">{{ formatCurrency(result.savedPayment) }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('prepaymentCalculator.newTerm') }}</span>
            <span class="value">{{ result.remainingMonths }}{{ t('prepaymentCalculator.paidMonths') }}{{ t('prepaymentCalculator.unchanged') }}</span>
          </div>
          <div class="info-item highlight">
            <span class="label">{{ t('prepaymentCalculator.savedInterest') }}</span>
            <span class="value success">{{ formatCurrency(result.savedInterest) }}</span>
          </div>
        </div>
      </div>

      <!-- 投资对比 -->
      <div class="finance-card">
        <div class="card-header">
          <span class="card-title">{{ t('prepaymentCalculator.investmentComparison') }}</span>
          <el-tag type="warning">{{ t('prepaymentCalculator.decisionRef') }}</el-tag>
        </div>

        <div class="comparison-section">
          <div class="comparison-item">
            <div class="comparison-label">{{ t('prepaymentCalculator.prepaySavedInterest') }}</div>
            <div class="comparison-value">{{ formatCurrency(result.savedInterest) }}</div>
          </div>

          <div class="comparison-vs">{{ t('prepaymentCalculator.vs') }}</div>

          <div class="comparison-item">
            <div class="comparison-label">{{ investmentReturnLabel }}</div>
            <div class="comparison-value">{{ formatCurrency(result.investmentAlternative.amount) }}</div>
          </div>
        </div>

        <div class="comparison-result" :class="investmentBetter ? 'investment' : 'prepayment'">
          <el-icon><TrendCharts /></el-icon>
          <span>{{ investmentBetter ? t('prepaymentCalculator.investBetter') : t('prepaymentCalculator.prepayBetter') }}</span>
        </div>

        <div class="tips-section">
          <div class="tip-title">{{ t('prepaymentCalculator.decisionAdvice') }}</div>
          <ul class="tip-list">
            <li>{{ adviceHigherText }}</li>
            <li>{{ t('prepaymentCalculator.adviceLower') }}</li>
            <li>{{ t('prepaymentCalculator.adviceConsider') }}</li>
          </ul>
        </div>
      </div>

      <!-- 贷款偿还曲线 -->
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('prepaymentCalculator.loanCurve') }}</span>
          <div>
            <el-tag>{{ t('prepaymentCalculator.visualAnalysis') }}</el-tag>
            <el-button type="primary" text @click="handleExportChart">
              <el-icon><Picture /></el-icon>
              {{ t('prepaymentCalculator.saveChart') }}
            </el-button>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { TrendCharts, FolderOpened, Download, Picture, Document, DocumentCopy } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { saveScenario, loadScenario, getScenarios, deleteScenario, autoSaveScene, loadAutoSaveScene, clearAutoSaveScene } from '../utils/localStorage'
import { exportToPDF, exportChartToImage, exportToExcel, prepareYearlyDataForExcel } from '../utils/export'
import { getPrepaymentChartConfig } from '../utils/chart-optimizer'
import { ElMessage } from 'element-plus'
import HelpTooltip from '../components/HelpTooltip.vue'
import { prepaymentTutorial } from '../utils/tutorial-content'
import useI18n from '../i18n'

const { t } = useI18n()

// ========== 类型定义 ==========
interface LoanInfo {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
}

interface PrepaymentResult {
  originalLoan: LoanInfo
  paidMonths: number
  paidPrincipal: number
  paidInterest: number
  remainingPrincipal: number
  prepayAmount: number
  newPrincipal: number
  remainingMonths: number
  type: string
  newLoan: LoanInfo
  newMonths?: number
  savedMonths?: number
  savedPayment?: number
  savedInterest: number
  investmentAlternative: {
    amount: number
    years: number
    comparison: string
  }
}

// ========== 数据 ==========
const calculatorForm = reactive({
  principal: 1000000,
  totalYears: 30,
  annualRate: 4.9,
  paidYears: 5,
  prepayAmount: 200000,
  prepayType: 'reduce_months' as 'reduce_months' | 'reduce_payment'
})

const result = ref<PrepaymentResult | null>(null)

// ========== 场景管理 ==========
const currentScenarioName = ref('')
const showScenarioDialog = ref(false)
const scenarios = ref<Record<string, any>>({})

// 加载场景列表
const loadScenariosList = () => {
  scenarios.value = getScenarios('prepayment')
}

// 保存当前场景
const handleSaveScenario = (scenarioName: string) => {
  if (!scenarioName.trim()) {
    ElMessage.error(t('prepaymentCalculator.scenarioNameEmpty'))
    return
  }

  const success = saveScenario('prepayment', scenarioName, {
    principal: calculatorForm.principal,
    totalYears: calculatorForm.totalYears,
    annualRate: calculatorForm.annualRate,
    paidYears: calculatorForm.paidYears,
    prepayAmount: calculatorForm.prepayAmount,
    prepayType: calculatorForm.prepayType
  })

  if (success) {
    ElMessage.success(t('prepaymentCalculator.scenarioSaveSuccess').replace('{name}', scenarioName))
    currentScenarioName.value = scenarioName
    loadScenariosList()
  } else {
    ElMessage.error(t('prepaymentCalculator.saveFailed'))
  }
}

// 加载场景
const handleLoadScenario = (scenarioName: string) => {
  const data = loadScenario('prepayment', scenarioName)

  if (data) {
    calculatorForm.principal = data.principal
    calculatorForm.totalYears = data.totalYears
    calculatorForm.annualRate = data.annualRate
    calculatorForm.paidYears = data.paidYears
    calculatorForm.prepayAmount = data.prepayAmount
    calculatorForm.prepayType = data.prepayType
    currentScenarioName.value = scenarioName
    result.value = null
    handleCalculate()
    ElMessage.success(t('prepaymentCalculator.scenarioLoadSuccess').replace('{name}', scenarioName))
  } else {
    ElMessage.error(t('prepaymentCalculator.loadFailed'))
  }
}

// 删除场景
const handleDeleteScenario = (scenarioName: string) => {
  const success = deleteScenario('prepayment', scenarioName)

  if (success) {
    ElMessage.success(t('prepaymentCalculator.scenarioDeleteSuccess').replace('{name}', scenarioName))
    loadScenariosList()
    if (currentScenarioName.value === scenarioName) {
      currentScenarioName.value = ''
    }
  } else {
    ElMessage.error(t('prepaymentCalculator.deleteFailed'))
  }
}

// 打开场景管理对话框
const openScenarioDialog = () => {
  loadScenariosList()
  showScenarioDialog.value = true
}

// 自动保存当前表单数据
watch(calculatorForm, (newForm) => {
  autoSaveScene('prepayment', newForm)
}, { deep: true })

// 组件挂载时加载自动保存的数据

// ==================== 导出功能 ====================

const chartRef = ref<HTMLElement>()
const chartInstance = ref<any>(null)

// 导出 PDF
const handleExportPDF = () => {
  exportToPDF(t('prepaymentCalculator.title'))
}

// 导出图表
const handleExportChart = () => {
  if (!chartInstance.value) {
    ElMessage.error(t('prepaymentCalculator.chartNotInit'))
    return
  }
  exportChartToImage(chartInstance.value, t('prepaymentCalculator.title') + '_chart')
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !result.value) return

  const chart = echarts.init(chartRef.value)

  // 计算每年数据
  const yearlyData = []
  const totalMonths = result.value.remainingMonths + result.value.paidMonths
  let remainingPrincipal = result.value.remainingPrincipal
  let totalPayment = 0

  for (let month = result.value.paidMonths; month <= totalMonths; month++) {
    if (month % 12 === 0) {
      yearlyData.push({
        year: Math.floor(month / 12),
        remainingPrincipal: Math.round(remainingPrincipal),
        totalPayment: Math.round(totalPayment)
      })
    }

    const monthlyPayment = result.value.type === 'reduce_months'
      ? result.value.originalLoan.monthlyPayment
      : result.value.newLoan.monthlyPayment

    totalPayment += monthlyPayment
    if (remainingPrincipal > 0) {
      const monthlyRate = calculatorForm.annualRate / 100 / 12
      const interest = remainingPrincipal * monthlyRate
      const principalPayment = monthlyPayment - interest
      remainingPrincipal -= principalPayment
    }
  }

  const months = yearlyData.map(d => `${d.year}${t('prepaymentCalculator.unitYears')}`)
  const remainingPrincipalData = yearlyData.map(d => d.remainingPrincipal)
  const totalPaymentData = yearlyData.map(d => d.totalPayment)

  // 使用优化后的图表配置
  chart.setOption(getPrepaymentChartConfig(months, remainingPrincipalData, totalPaymentData))

  // 保存图表实例
  chartInstance.value = chart
}

// 导出 Excel
const handleExportExcel = () => {
  if (!result.value || !result.value.yearlyData) {
    ElMessage.error(t('prepaymentCalculator.pleaseCalculate'))
    return
  }

  const data = prepareYearlyDataForExcel(result.value.yearlyData)
  exportToExcel(data, t('prepaymentCalculator.title') + '_yearly', 'yearly')
}

onMounted(() => {
  const autoSaveData = loadAutoSaveScene('prepayment')
  if (autoSaveData) {
    calculatorForm.principal = autoSaveData.principal
    calculatorForm.totalYears = autoSaveData.totalYears
    calculatorForm.annualRate = autoSaveData.annualRate
    calculatorForm.paidYears = autoSaveData.paidYears
    calculatorForm.prepayAmount = autoSaveData.prepayAmount
    calculatorForm.prepayType = autoSaveData.prepayType
    handleCalculate()
  }

  // 加载场景列表
  loadScenariosList()

  // 自动执行初始计算
  if (!autoSaveData) {
    handleCalculate()
  }
})

// 组件卸载时清除自动保存的数据
onUnmounted(() => {
  clearAutoSaveScene('prepayment')
})

const rateMarks = computed(() => ({
  0: '0%',
  4.9: t('prepaymentCalculator.rateMarkMortgage'),
  10: '10%',
  18: t('prepaymentCalculator.rateMarkCreditCard'),
  20: '20%'
}))

const investmentBetter = computed(() => {
  if (!result.value) return false
  return result.value.investmentAlternative.amount > result.value.savedInterest
})

const investmentReturnLabel = computed(() => {
  if (!result.value) return ''
  return t('prepaymentCalculator.investmentReturn').replace('{years}', result.value.investmentAlternative.years.toFixed(1))
})

const adviceHigherText = computed(() => {
  return t('prepaymentCalculator.adviceHigher').replace('{rate}', String(calculatorForm.annualRate))
})

// ========== 核心算法 ==========

/**
 * 等额本息贷款计算
 */
function calculateLoan(principal: number, annualRate: number, months: number): LoanInfo {
  if (principal <= 0 || months <= 0) {
    return {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0
    }
  }

  // 收益率为0的特殊情况
  if (annualRate === 0) {
    const monthlyPayment = principal / months
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: principal,
      totalInterest: 0
    }
  }

  const monthlyRate = annualRate / 12

  // 等额本息月供公式
  const monthlyPayment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)

  const totalPayment = monthlyPayment * months
  const totalInterest = totalPayment - principal

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  }
}

/**
 * 计算已还本金
 */
function calculatePaidPrincipal(
  originalPrincipal: number,
  annualRate: number,
  totalMonths: number,
  paidMonths: number
): number {
  if (paidMonths <= 0) return 0

  const monthlyRate = annualRate / 12
  const originalLoan = calculateLoan(originalPrincipal, annualRate, totalMonths)

  let paidPrincipal = 0
  let remainingPrincipal = originalPrincipal

  for (let month = 1; month <= paidMonths; month++) {
    const interest = remainingPrincipal * monthlyRate
    const principalPayment = originalLoan.monthlyPayment - interest
    paidPrincipal += principalPayment
    remainingPrincipal -= principalPayment
  }

  return paidPrincipal
}

/**
 * 提前还款计算
 */
function calculatePrepayment(
  originalPrincipal: number,
  annualRate: number,
  totalMonths: number,
  paidMonths: number,
  prepayAmount: number,
  prepayType: 'reduce_months' | 'reduce_payment'
): PrepaymentResult {
  const monthlyRate = annualRate / 12

  // 原贷款信息
  const originalLoan = calculateLoan(originalPrincipal, annualRate, totalMonths)

  // 已还本金
  const paidPrincipal = calculatePaidPrincipal(originalPrincipal, annualRate, totalMonths, paidMonths)

  // 剩余本金
  const remainingPrincipal = originalPrincipal - paidPrincipal

  // 提前还款后剩余本金
  const newPrincipal = Math.max(0, remainingPrincipal - prepayAmount)

  // 剩余期数
  const remainingMonths = totalMonths - paidMonths

  // 已付利息
  const paidInterest = paidMonths * originalLoan.monthlyPayment - paidPrincipal

  let result: any = {
    originalLoan,
    paidMonths,
    paidPrincipal: Math.round(paidPrincipal * 100) / 100,
    paidInterest: Math.round(paidInterest * 100) / 100,
    remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
    prepayAmount,
    newPrincipal: Math.round(newPrincipal * 100) / 100,
    remainingMonths
  }

  if (prepayType === 'reduce_months') {
    // 减少期数(月供不变)
    let newMonths = 0
    if (newPrincipal > 0 && monthlyRate > 0) {
      newMonths = Math.ceil(
        Math.log(originalLoan.monthlyPayment / (originalLoan.monthlyPayment - newPrincipal * monthlyRate)) /
        Math.log(1 + monthlyRate)
      )
    }

    const newLoan = calculateLoan(newPrincipal, annualRate, newMonths)

    result.type = 'reduce_months'
    result.newLoan = newLoan
    result.newMonths = newMonths
    result.savedMonths = remainingMonths - newMonths
    result.savedInterest = Math.round((originalLoan.totalInterest - paidInterest - newLoan.totalInterest) * 100) / 100
  } else {
    // 减少月供(期数不变)
    const newLoan = calculateLoan(newPrincipal, annualRate, remainingMonths)

    result.type = 'reduce_payment'
    result.newLoan = newLoan
    result.savedPayment = Math.round((originalLoan.monthlyPayment - newLoan.monthlyPayment) * 100) / 100
    result.savedInterest = Math.round((originalLoan.totalInterest - paidInterest - newLoan.totalInterest) * 100) / 100
  }

  // 对比投资收益
  const investmentYears = remainingMonths / 12
  const investmentReturn = calculateCompoundInterest(prepayAmount, 0, investmentYears, 0.08)

  result.investmentAlternative = {
    amount: investmentReturn.totalInterest,
    years: investmentYears,
    comparison: investmentReturn.totalInterest > result.savedInterest ? t('prepaymentCalculator.investBetter') : t('prepaymentCalculator.prepayBetter')
  }

  return result
}

/**
 * 复利计算器(简化版)
 */
function calculateCompoundInterest(
  principal: number,
  monthlyContribution: number,
  years: number,
  annualRate: number
) {
  if (years <= 0) {
    return {
      totalFuture: principal,
      totalContribution: principal,
      totalInterest: 0
    }
  }

  const monthlyRate = annualRate / 12
  const months = years * 12

  const principalFuture = principal * Math.pow(1 + monthlyRate, months)

  let contributionFuture = 0
  if (monthlyRate > 0) {
    contributionFuture = monthlyContribution *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  } else {
    contributionFuture = monthlyContribution * months
  }

  const totalFuture = principalFuture + contributionFuture
  const totalContribution = principal + (monthlyContribution * months)
  const totalInterest = totalFuture - totalContribution

  return {
    totalFuture: Math.round(totalFuture),
    totalContribution: Math.round(totalContribution),
    totalInterest: Math.round(totalInterest)
  }
}

// ========== 事件处理 ==========

function handleCalculate() {
  const totalMonths = calculatorForm.totalYears * 12
  const paidMonths = calculatorForm.paidYears * 12
  const annualRateDecimal = calculatorForm.annualRate / 100

  result.value = calculatePrepayment(
    calculatorForm.principal,
    annualRateDecimal,
    totalMonths,
    paidMonths,
    calculatorForm.prepayAmount,
    calculatorForm.prepayType
  )

  // 初始化图表
  setTimeout(() => {
    initChart()
  }, 100)
}

function handleReset() {
  calculatorForm.principal = 1000000
  calculatorForm.totalYears = 30
  calculatorForm.annualRate = 4.9
  calculatorForm.paidYears = 5
  calculatorForm.prepayAmount = 200000
  calculatorForm.prepayType = 'reduce_months'
  result.value = null
}

// 加载示例数据
const loadExampleData = () => {
  calculatorForm.principal = prepaymentTutorial.exampleData.loanAmount
  calculatorForm.totalYears = prepaymentTutorial.exampleData.loanTerm
  calculatorForm.annualRate = prepaymentTutorial.exampleData.annualRate
  calculatorForm.paidYears = 0  // 示例数据从开始算起
  calculatorForm.prepayAmount = prepaymentTutorial.exampleData.prepaymentAmount
  calculatorForm.prepayType = prepaymentTutorial.exampleData.prepaymentType
  result.value = null
  ElMessage.success(t('prepaymentCalculator.exampleLoadSuccess'))
}

function formatCurrency(value: number): string {
  return '¥' + value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
</script>

<style scoped lang="scss">
  .prepayment-calculator {
    .page-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;

      @media (max-width: 575px) {
        font-size: 20px;
        margin-bottom: 16px;
      }
    }

    .input-card {
      margin-bottom: 24px;

      @media (max-width: 575px) {
        margin-bottom: 16px;
      }

      .prepayment-calculator-form {
        margin-top: 20px;

        @media (max-width: 575px) {
          margin-top: 16px;
        }

        .el-form-item {
          margin-bottom: 20px;

          @media (max-width: 575px) {
            margin-bottom: 16px;
          }
        }

        .unit {
          margin-left: 8px;
          color: #909399;
          font-size: 14px;

          @media (max-width: 575px) {
            font-size: 13px;
          }
        }

        .el-slider {
          margin-right: 20px;

          @media (max-width: 575px) {
            margin-right: 10px;
          }
        }
      }
    }

    .result-section {
      margin-top: 24px;

      @media (max-width: 575px) {
        margin-top: 20px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;

        @media (max-width: 575px) {
          font-size: 14px;
          margin-bottom: 12px;
        }
      }

      .metric-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;

        @media (max-width: 575px) {
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        @media (min-width: 576px) and (max-width: 767px) {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        @media (min-width: 768px) and (max-width: 991px) {
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
      }

      .metric-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: 12px;
        color: #fff;

        @media (max-width: 575px) {
          padding: 16px;
          gap: 12px;
          flex-direction: column;
          text-align: center;
        }

        @media (min-width: 576px) and (max-width: 767px) {
          padding: 18px;
          gap: 14px;
        }

        .metric-icon {
          font-size: 36px;

          @media (max-width: 575px) {
            font-size: 32px;
          }
        }

        .metric-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 4px;

          @media (max-width: 575px) {
            font-size: 13px;
          }
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;

          @media (max-width: 575px) {
            font-size: 20px;
          }

          @media (min-width: 576px) and (max-width: 767px) {
            font-size: 22px;
          }
        }
      }

      .chart-card {
        margin-bottom: 24px;

        @media (max-width: 575px) {
          margin-bottom: 16px;
        }

        .chart-container {
          height: 350px;

          @media (max-width: 575px) {
            height: 280px;
          }

          @media (min-width: 576px) and (max-width: 767px) {
            height: 320px;
          }

          @media (min-width: 768px) and (max-width: 991px) {
            height: 340px;
          }
        }
      }

      .table-card {
        margin-bottom: 24px;

        @media (max-width: 575px) {
          margin-bottom: 16px;
        }
      }
    }
  }

  .gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .gradient-success {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  }

  .gradient-info {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .gradient-warning {
    background: linear-gradient(135deg, #e6a23c 0%, #f5a623 100%);
  }

  .scenario-actions {
    display: flex;
    gap: 12px;
    align-items: center;

    @media (max-width: 575px) {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
  }

  .scenario-list {
    margin-top: 20px;

    @media (max-width: 575px) {
      margin-top: 16px;
    }
  }

  .scenario-params {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 12px;
    color: #606266;

    @media (max-width: 575px) {
      font-size: 11px;
    }
  }
  </style>
