<template>
  <div class="retirement-planner">
    <h1 class="page-title">{{ t('retirementPlanner.title') }}</h1>

    <!-- 输入参数 -->
    <div class="finance-card input-card">
      <div class="card-header">
        <span class="card-title">{{ t('retirementPlanner.planParameters') }}</span>
        <el-tag type="info">{{ t('retirementPlanner.tagline') }}</el-tag>
      </div>

      <el-form :model="plannerForm" label-width="140px" class="planner-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.currentAge')">
              <el-input-number
                v-model="plannerForm.currentAge"
                :min="18"
                :max="70"
                controls-position="right"
              />
              <span class="unit">{{ t('retirementPlanner.unitYears') }}</span>
              <HelpTooltip :content="retirementTutorial.parameters.currentAge" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.retirementAge')">
              <el-input-number
                v-model="plannerForm.retirementAge"
                :min="50"
                :max="75"
                controls-position="right"
              />
              <span class="unit">{{ t('retirementPlanner.unitYears') }}</span>
              <HelpTooltip :content="retirementTutorial.parameters.retirementAge" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.currentSavings')">
              <el-input-number
                v-model="plannerForm.currentSavings"
                :min="0"
                :step="10000"
                :precision="0"
                controls-position="right"
              />
              <span class="unit">{{ t('retirementPlanner.unitYuan') }}</span>
              <HelpTooltip :content="retirementTutorial.parameters.currentSavings" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.monthlySavings')">
              <el-input-number
                v-model="plannerForm.monthlySavings"
                :min="0"
                :step="1000"
                :precision="0"
                controls-position="right"
              />
              <span class="unit">{{ t('retirementPlanner.unitYuan') }}</span>
              <HelpTooltip :content="retirementTutorial.parameters.monthlySavings" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.retirementMonthlyExpense')">
              <el-input-number
                v-model="plannerForm.retirementExpenses"
                :min="0"
                :step="1000"
                :precision="0"
                controls-position="right"
              />
              <span class="unit">{{ t('retirementPlanner.unitYuan') }}</span>
              <HelpTooltip :content="retirementTutorial.parameters.retirementExpenses" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.lifeExpectancy')">
              <el-input-number
                v-model="plannerForm.lifeExpectancy"
                :min="70"
                :max="100"
                controls-position="right"
              />
              <span class="unit">{{ t('retirementPlanner.unitYears') }}</span>
              <HelpTooltip :content="retirementTutorial.parameters.lifeExpectancy" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.expectedReturn')">
              <el-slider
                v-model="plannerForm.expectedReturn"
                :min="0"
                :max="15"
                :step="0.5"
                :marks="returnMarks"
                show-input
              />
              <span class="unit">{{ t('retirementPlanner.unitPercent') }}</span>
              <HelpTooltip :content="retirementTutorial.parameters.expectedReturn" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="t('retirementPlanner.inflationRate')">
              <el-slider
                v-model="plannerForm.inflationRate"
                :min="0"
                :max="10"
                :step="0.5"
                :marks="inflationMarks"
                show-input
              />
              <span class="unit">{{ t('retirementPlanner.unitPercent') }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleCalculate">
            <el-icon><TrendCharts /></el-icon>
            {{ t('retirementPlanner.calculateRetirement') }}
          </el-button>
          <el-button @click="handleReset">{{ t('retirementPlanner.reset') }}</el-button>

          <el-button type="success" @click="openScenarioDialog">
            <el-icon><FolderOpened /></el-icon>
            {{ t('retirementPlanner.scenarioManagement') }}
          </el-button>

          <el-button type="warning" @click="loadExampleData">
            <el-icon><DocumentCopy /></el-icon>
            {{ t('retirementPlanner.exampleData') }}
          </el-button>

          <el-button v-if="result" type="info" @click="handleExportPDF">
            <el-icon><Download /></el-icon>
            {{ t('retirementPlanner.exportPDF') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 场景管理对话框 -->
    <el-dialog v-model="showScenarioDialog" :title="t('retirementPlanner.scenarioManagement')" width="600px">
      <div class="scenario-actions">
        <el-input
          v-model="currentScenarioName"
          :placeholder="t('retirementPlanner.scenarioNamePlaceholder')"
          style="width: 200px"
        />
        <el-button type="primary" @click="handleSaveScenario(currentScenarioName)">
          {{ t('retirementPlanner.saveCurrentScenario') }}
        </el-button>
      </div>

      <el-divider />

      <div class="scenario-list">
        <el-empty v-if="Object.keys(scenarios).length === 0" :description="t('retirementPlanner.noSavedScenarios')" />

        <el-table v-else :data="Object.entries(scenarios).map(([name, data]) => ({ name, ...data }))" style="width: 100%">
          <el-table-column prop="name" :label="t('retirementPlanner.scenarioNameCol')" width="200" />
          <el-table-column :label="t('retirementPlanner.parametersCol')" width="300">
            <template #default="{ row }">
              <div class="scenario-params">
                <span>{{ row.data?.currentAge }}{{ t('retirementPlanner.unitYears') }} → {{ row.data?.retirementAge }}{{ t('retirementPlanner.retireAt') }}</span>
                <span>{{ t('retirementPlanner.savingsPerMonth', { amount: row.data?.monthlySavings?.toLocaleString() }) }}</span>
                <span>{{ t('retirementPlanner.returnRate', { rate: row.data?.expectedReturn }) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('retirementPlanner.operationsCol')" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleLoadScenario(row.name)">
                {{ t('retirementPlanner.load') }}
              </el-button>
              <el-button type="danger" link @click="handleDeleteScenario(row.name)">
                {{ t('retirementPlanner.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 计算结果 -->
    <div v-if="result" class="result-section">
      <div class="section-title">{{ t('retirementPlanner.retirementResults') }}</div>

      <!-- 核心指标 -->
      <div class="metric-cards">
        <div class="metric-card gradient-primary">
          <div class="metric-icon">🎯</div>
          <div class="metric-info">
            <div class="metric-label">{{ t('retirementPlanner.yearsBeforeRetirement') }}</div>
            <div class="metric-value">{{ result.yearsToRetirement }}{{ t('retirementPlanner.unitYearsShort') }}</div>
          </div>
        </div>

        <div class="metric-card gradient-success">
          <div class="metric-icon">💰</div>
          <div class="metric-info">
            <div class="metric-label">{{ t('retirementPlanner.totalSavingsAtRetirement') }}</div>
            <div class="metric-value">{{ formatCurrency(result.totalSavingsAtRetirement) }}</div>
          </div>
        </div>

        <div class="metric-card gradient-info">
          <div class="metric-icon">💳</div>
          <div class="metric-info">
            <div class="metric-label">{{ t('retirementPlanner.monthlyExpenseAtRetirement') }}</div>
            <div class="metric-value">{{ formatCurrency(result.inflatedMonthlyExpenses) }}</div>
            <div class="metric-note">{{ t('retirementPlanner.withInflation') }}</div>
          </div>
        </div>

        <div class="metric-card" :class="result.isSufficient ? 'gradient-success' : 'gradient-warning'">
          <div class="metric-icon">{{ result.isSufficient ? '✅' : '⚠️' }}</div>
          <div class="metric-info">
            <div class="metric-label">{{ t('retirementPlanner.sustainableYears') }}</div>
            <div class="metric-value">
              {{ result.yearsCanSustain === Infinity ? t('retirementPlanner.perpetual') : result.yearsCanSustain + t('retirementPlanner.unitYearsShort') }}
            </div>
            <div class="metric-note">
              {{ t('retirementPlanner.retirementYears', { years: result.retirementYears }) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 充足性判断 -->
      <div class="finance-card status-card">
        <div class="card-header">
          <span class="card-title">{{ t('retirementPlanner.retirementStatus') }}</span>
          <el-tag :type="result.isSufficient ? 'success' : 'warning'" size="large">
            {{ result.isSufficient ? t('retirementPlanner.sufficient') : t('retirementPlanner.needsAdjustment') }}
          </el-tag>
        </div>

        <div class="status-content">
          <div v-if="result.isSufficient" class="status-success">
            <el-icon :size="48" color="#67c23a"><SuccessFilled /></el-icon>
            <div class="status-text">
              <h3>{{ t('retirementPlanner.congratulations') }}</h3>
              <p>
                {{ congratulationsDetailText }}
              </p>
              <p v-if="result.monthlyRealReturn > 0">
                <el-tag type="success">{{ t('retirementPlanner.realReturnRate', { rate: (result.monthlyRealReturn * 12 * 100).toFixed(2) }) }}</el-tag>
                {{ t('retirementPlanner.perpetualSustainMsg') }}
              </p>
            </div>
          </div>

          <div v-else class="status-warning">
            <el-icon :size="48" color="#e6a23c"><WarningFilled /></el-icon>
            <div class="status-text">
              <h3>{{ t('retirementPlanner.adjustmentNeeded') }}</h3>
              <p>
                {{ adjustmentDetailText }}
              </p>
              <p>
                {{ t('retirementPlanner.savingsGap', { amount: formatCurrency(result.shortfall) }) }}
              </p>
              <p>
                {{ t('retirementPlanner.suggestMoreSavings', { amount: formatCurrency(result.additionalMonthlySavingsNeeded) }) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细分析 -->
      <div class="finance-card analysis-card">
        <div class="card-header">
          <span class="card-title">{{ t('retirementPlanner.detailedAnalysis') }}</span>
        </div>

        <div class="analysis-grid">
          <div class="analysis-item">
            <div class="analysis-label">{{ t('retirementPlanner.workingYears') }}</div>
            <div class="analysis-value">{{ result.yearsToRetirement }}{{ t('retirementPlanner.unitYearsShort') }}</div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">{{ t('retirementPlanner.retirementLivingYears') }}</div>
            <div class="analysis-value">{{ result.retirementYears }}{{ t('retirementPlanner.unitYearsShort') }}</div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">{{ t('retirementPlanner.totalSavingsAtRetirementLabel') }}</div>
            <div class="analysis-value">{{ formatCurrency(result.totalSavingsAtRetirement) }}</div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">{{ t('retirementPlanner.inflatedMonthlyExpense') }}</div>
            <div class="analysis-value">{{ formatCurrency(result.inflatedMonthlyExpenses) }}</div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">{{ t('retirementPlanner.sustainableYearsLabel') }}</div>
            <div class="analysis-value">
              {{ result.yearsCanSustain === Infinity ? t('retirementPlanner.perpetual') : result.yearsCanSustain + t('retirementPlanner.unitYearsShort') }}
            </div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">{{ t('retirementPlanner.monthlyRealReturn') }}</div>
            <div class="analysis-value">{{ (result.monthlyRealReturn * 100).toFixed(4) }}{{ t('retirementPlanner.unitPercent') }}</div>
          </div>
        </div>
      </div>

      <!-- 储蓄增长曲线 -->
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('retirementPlanner.savingsGrowthCurve') }}</span>
          <div>
            <el-tag>{{ t('retirementPlanner.visualAnalysis') }}</el-tag>
            <el-button type="primary" text @click="handleExportChart">
              <el-icon><Picture /></el-icon>
              {{ t('retirementPlanner.saveChart') }}
            </el-button>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { TrendCharts, SuccessFilled, WarningFilled, FolderOpened, Download, Picture, Document, DocumentCopy } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { saveScenario, loadScenario, getScenarios, deleteScenario, autoSaveScene, loadAutoSaveScene, clearAutoSaveScene } from '../utils/localStorage'
import { exportToPDF, exportChartToImage, exportToExcel, prepareYearlyDataForExcel } from '../utils/export'
import { getRetirementChartConfig } from '../utils/chart-optimizer'
import { ElMessage } from 'element-plus'
import HelpTooltip from '../components/HelpTooltip.vue'
import { retirementTutorial } from '../utils/tutorial-content'
import useI18n from '../i18n'

const { t } = useI18n()

// ==================== 退休规划计算器核心算法 ====================

interface RetirementResult {
  yearsToRetirement: number
  totalSavingsAtRetirement: number
  inflatedMonthlyExpenses: number
  yearsCanSustain: number
  isSufficient: boolean
  shortfall: number
  additionalMonthlySavingsNeeded: number
  retirementYears: number
  monthlyRealReturn: number
}

/**
 * 退休规划计算器
 */
function retirementCalculator(params: {
  currentAge: number
  retirementAge: number
  currentSavings: number
  monthlySavings: number
  expectedReturn: number
  retirementExpenses: number
  inflationRate: number
  lifeExpectancy: number
}): RetirementResult {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlySavings,
    expectedReturn,
    retirementExpenses,
    inflationRate,
    lifeExpectancy
  } = params

  // 1. 计算退休前的工作年限
  const yearsToRetirement = retirementAge - currentAge

  // 2. 计算退休时的总储蓄（考虑复利）
  const monthlyReturn = expectedReturn / 12
  const monthsToRetirement = yearsToRetirement * 12

  // 当前储蓄的增长
  const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + expectedReturn, yearsToRetirement)

  // 每月储蓄的增长（年金终值公式）
  let futureValueOfMonthlySavings = 0
  if (monthlyReturn > 0) {
    futureValueOfMonthlySavings = monthlySavings *
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn)
  } else {
    futureValueOfMonthlySavings = monthlySavings * monthsToRetirement
  }

  const totalSavingsAtRetirement = futureValueOfCurrentSavings + futureValueOfMonthlySavings

  // 3. 计算退休时每月支出（考虑通胀）
  const inflatedMonthlyExpenses = retirementExpenses * Math.pow(1 + inflationRate, yearsToRetirement)

  // 4. 计算退休后能维持的年数
  const retirementYears = lifeExpectancy - retirementAge

  // 退休后的每月实际收益率（考虑通胀）
  const realReturnAfterRetirement = (1 + expectedReturn) / (1 + inflationRate) - 1
  const monthlyRealReturn = realReturnAfterRetirement / 12

  // 计算能维持的月数（使用现值公式）
  let monthsCanSustain: number
  if (monthlyRealReturn > 0) {
    const ratio = totalSavingsAtRetirement * monthlyRealReturn / inflatedMonthlyExpenses
    if (ratio >= 1) {
      monthsCanSustain = Infinity
    } else {
      monthsCanSustain = -Math.log(1 - ratio) / Math.log(1 + monthlyRealReturn)
    }
  } else {
    monthsCanSustain = totalSavingsAtRetirement / inflatedMonthlyExpenses
  }

  const yearsCanSustain = monthsCanSustain / 12

  // 5. 计算储蓄缺口（如果有）
  const shortfall = yearsCanSustain < retirementYears
    ? (retirementYears - yearsCanSustain) * 12 * inflatedMonthlyExpenses
    : 0

  // 6. 计算需要增加的每月储蓄（如果有缺口）
  let additionalMonthlySavingsNeeded = 0
  if (shortfall > 0 && monthlyReturn > 0) {
    const additionalNeeded = shortfall / Math.pow(1 + expectedReturn, yearsToRetirement)
    additionalMonthlySavingsNeeded = additionalNeeded /
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn)
  }

  return {
    yearsToRetirement,
    totalSavingsAtRetirement: Math.round(totalSavingsAtRetirement),
    inflatedMonthlyExpenses: Math.round(inflatedMonthlyExpenses),
    yearsCanSustain: yearsCanSustain === Infinity ? Infinity : Math.round(yearsCanSustain * 10) / 10,
    isSufficient: yearsCanSustain >= retirementYears,
    shortfall: Math.round(shortfall),
    additionalMonthlySavingsNeeded: Math.round(additionalMonthlySavingsNeeded),
    retirementYears,
    monthlyRealReturn: Math.round(monthlyRealReturn * 10000) / 10000
  }
}

// ==================== Vue 组件逻辑 ====================

const plannerForm = ref({
  currentAge: 30,
  retirementAge: 60,
  currentSavings: 1100000,  // 用户净资产
  monthlySavings: 20000,
  expectedReturn: 8,
  inflationRate: 3,
  retirementExpenses: 10000,
  lifeExpectancy: 85
})

const result = ref<RetirementResult | null>(null)

// Computed for interpolated template strings
const congratulationsDetailText = computed(() => {
  if (!result.value) return ''
  const sustainText = result.value.yearsCanSustain === Infinity
    ? t('retirementPlanner.perpetualSustain')
    : t('retirementPlanner.sustainYears', { years: result.value.yearsCanSustain })
  return t('retirementPlanner.congratulationsDetail')
    .replace('{savings}', formatCurrency(result.value.totalSavingsAtRetirement))
    .replace('{inflation}', String(plannerForm.value.inflationRate))
    .replace('{expenses}', formatCurrency(result.value.inflatedMonthlyExpenses))
    .replace('{sustain}', sustainText)
})

const adjustmentDetailText = computed(() => {
  if (!result.value) return ''
  return t('retirementPlanner.adjustmentDetail')
    .replace('{savings}', formatCurrency(result.value.totalSavingsAtRetirement))
    .replace('{sustain}', String(result.value.yearsCanSustain))
    .replace('{needed}', String(result.value.retirementYears))
})

// ==================== 场景管理 ====================
const currentScenarioName = ref('')
const showScenarioDialog = ref(false)
const scenarios = ref<Record<string, any>>({})

// 加载场景列表
const loadScenariosList = () => {
  scenarios.value = getScenarios('retirement')
}

// 保存当前场景
const handleSaveScenario = (scenarioName: string) => {
  if (!scenarioName.trim()) {
    ElMessage.error(t('retirementPlanner.scenarioNameEmpty'))
    return
  }

  const success = saveScenario('retirement', scenarioName, {
    currentAge: plannerForm.value.currentAge,
    retirementAge: plannerForm.value.retirementAge,
    currentSavings: plannerForm.value.currentSavings,
    monthlySavings: plannerForm.value.monthlySavings,
    expectedReturn: plannerForm.value.expectedReturn,
    inflationRate: plannerForm.value.inflationRate,
    retirementExpenses: plannerForm.value.retirementExpenses,
    lifeExpectancy: plannerForm.value.lifeExpectancy
  })

  if (success) {
    ElMessage.success(t('retirementPlanner.scenarioSaveSuccess').replace('{name}', scenarioName))
    currentScenarioName.value = scenarioName
    loadScenariosList()
  } else {
    ElMessage.error(t('retirementPlanner.saveFailed'))
  }
}

// 加载场景
const handleLoadScenario = (scenarioName: string) => {
  const data = loadScenario('retirement', scenarioName)

  if (data) {
    plannerForm.value = {
      currentAge: data.currentAge,
      retirementAge: data.retirementAge,
      currentSavings: data.currentSavings,
      monthlySavings: data.monthlySavings,
      expectedReturn: data.expectedReturn,
      inflationRate: data.inflationRate,
      retirementExpenses: data.retirementExpenses,
      lifeExpectancy: data.lifeExpectancy
    }
    currentScenarioName.value = scenarioName
    result.value = null
    handleCalculate()
    ElMessage.success(t('retirementPlanner.scenarioLoadSuccess').replace('{name}', scenarioName))
  } else {
    ElMessage.error(t('retirementPlanner.loadFailed'))
  }
}

// 删除场景
const handleDeleteScenario = (scenarioName: string) => {
  const success = deleteScenario('retirement', scenarioName)

  if (success) {
    ElMessage.success(t('retirementPlanner.scenarioDeleteSuccess').replace('{name}', scenarioName))
    loadScenariosList()
    if (currentScenarioName.value === scenarioName) {
      currentScenarioName.value = ''
    }
  } else {
    ElMessage.error(t('retirementPlanner.deleteFailed'))
  }
}

// 打开场景管理对话框
const openScenarioDialog = () => {
  loadScenariosList()
  showScenarioDialog.value = true
}

// 自动保存当前表单数据
watch(plannerForm, (newForm) => {
  autoSaveScene('retirement', newForm)
}, { deep: true })

const returnMarks = {
  0: '0%',
  4: '4%',
  8: '8%',
  10: '10%',
  15: '15%'
}

const inflationMarks = {
  0: '0%',
  3: '3%',
  5: '5%',
  10: '10%'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const handleCalculate = () => {
  result.value = retirementCalculator({
    currentAge: plannerForm.value.currentAge,
    retirementAge: plannerForm.value.retirementAge,
    currentSavings: plannerForm.value.currentSavings,
    monthlySavings: plannerForm.value.monthlySavings,
    expectedReturn: plannerForm.value.expectedReturn / 100,
    inflationRate: plannerForm.value.inflationRate / 100,
    retirementExpenses: plannerForm.value.retirementExpenses,
    lifeExpectancy: plannerForm.value.lifeExpectancy
  })

  // 初始化图表
  setTimeout(() => {
    initChart()
  }, 100)
}

const handleReset = () => {
  plannerForm.value = {
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 1100000,  // 用户净资产
    monthlySavings: 20000,
    expectedReturn: 8,
    inflationRate: 3,
    retirementExpenses: 10000,
    lifeExpectancy: 85
  }
  result.value = null
}

// 加载示例数据
const loadExampleData = () => {
  plannerForm.value = {
    currentAge: retirementTutorial.exampleData.currentAge,
    retirementAge: retirementTutorial.exampleData.retirementAge,
    currentSavings: retirementTutorial.exampleData.currentSavings,
    monthlySavings: retirementTutorial.exampleData.monthlySavings,
    retirementExpenses: retirementTutorial.exampleData.retirementExpenses,
    lifeExpectancy: retirementTutorial.exampleData.lifeExpectancy,
    expectedReturn: retirementTutorial.exampleData.expectedReturn,
    inflationRate: retirementTutorial.exampleData.inflationRate
  }
  result.value = null
  ElMessage.success(t('retirementPlanner.exampleLoadSuccess'))
}


// ==================== 导出功能 ====================

const chartRef = ref<HTMLElement>()
const chartInstance = ref<any>(null)

// 导出 PDF
const handleExportPDF = () => {
  exportToPDF(t('retirementPlanner.title'))
}

// 导出图表
const handleExportChart = () => {
  if (!chartInstance.value) {
    ElMessage.error(t('retirementPlanner.chartNotInit'))
    return
  }
  exportChartToImage(chartInstance.value, t('retirementPlanner.exportChartName'))
}

// 导出 Excel
const handleExportExcel = () => {
  if (!result.value) {
    ElMessage.error(t('retirementPlanner.pleaseCalculate'))
    return
  }

  const data = prepareYearlyDataForExcel(result.value.yearlyData)
  exportToExcel(data, t('retirementPlanner.exportExcelName'), t('retirementPlanner.exportExcelSheet'))
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !result.value) return

  const chart = echarts.init(chartRef.value)

  // 计算每年数据
  const years = []
  const savingsData = []
  const expensesData = []

  for (let year = 0; year <= result.value.yearsToRetirement; year++) {
    years.push(`${plannerForm.value.currentAge + year}${t('retirementPlanner.unitYears')}`)

    // 计算当年的储蓄
    const months = year * 12
    const monthlyReturn = plannerForm.value.expectedReturn / 12
    const futureValueOfCurrentSavings = plannerForm.value.currentSavings * Math.pow(1 + plannerForm.value.expectedReturn, year)
    const futureValueOfMonthlySavings = monthlyReturn > 0
      ? plannerForm.value.monthlySavings * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn)
      : plannerForm.value.monthlySavings * months

    savingsData.push(Math.round(futureValueOfCurrentSavings + futureValueOfMonthlySavings))

    // 计算当年的支出（考虑通胀）
    const inflatedExpenses = plannerForm.value.retirementExpenses * Math.pow(1 + plannerForm.value.inflationRate, year)
    expensesData.push(Math.round(inflatedExpenses * 12))
  }

  // 使用优化后的图表配置
  chart.setOption(getRetirementChartConfig(years, savingsData, expensesData))

  // 保存图表实例
  chartInstance.value = chart
}

onMounted(() => {
  // 加载自动保存的数据
  const autoSaveData = loadAutoSaveScene('retirement')
  if (autoSaveData) {
    plannerForm.value = {
      currentAge: autoSaveData.currentAge,
      retirementAge: autoSaveData.retirementAge,
      currentSavings: autoSaveData.currentSavings,
      monthlySavings: autoSaveData.monthlySavings,
      expectedReturn: autoSaveData.expectedReturn,
      inflationRate: autoSaveData.inflationRate,
      retirementExpenses: autoSaveData.retirementExpenses,
      lifeExpectancy: autoSaveData.lifeExpectancy
    }
  }

  // 加载场景列表
  loadScenariosList()

  // 自动执行一次计算
  handleCalculate()
})

// 组件卸载时清除自动保存的数据
onUnmounted(() => {
  clearAutoSaveScene('retirement')
})
</script>

<style lang="scss" scoped>
  .retirement-planner {
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

      .retirement-planner-form {
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
          color: var(--text-secondary);
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
        grid-template-columns: repeat(4, 1fr);
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
        color: var(--bg-card);

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
    background: linear-gradient(135deg, var(--el-color-success) 0%, #85ce61 100%);
  }

  .gradient-info {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .gradient-warning {
    background: linear-gradient(135deg, var(--el-color-warning) 0%, #f5a623 100%);
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
    color: var(--text-regular);

    @media (max-width: 575px) {
      font-size: 11px;
    }
  }
  </style>
