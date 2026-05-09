<template>
  <div class="scenario-simulator">
    <h1 class="page-title">{{ t('scenarioSimulator.title') }}</h1>

    <!-- 场景管理按钮 -->
    <div class="scenario-actions">
      <el-button type="primary" @click="openScenarioDialog" :icon="FolderOpened">
        {{ t('scenarioSimulator.scenarioManagement') }}
      </el-button>
      <el-button type="warning" @click="loadExampleData" :icon="DocumentCopy">
        {{ t('scenarioSimulator.exampleData') }}
      </el-button>
    </div>

    <!-- 当前场景输入 -->
    <div class="finance-card input-card">
      <div class="card-header">
        <span class="card-title">{{ t('scenarioSimulator.currentScenario') }}</span>
        <el-tag type="info">{{ t('scenarioSimulator.yourFinancialStatus') }}</el-tag>
      </div>

      <el-form :model="currentScenario" label-width="120px" class="scenario-form">
        <el-form-item :label="t('scenarioSimulator.netAssets')">
          <el-input-number
            v-model="currentScenario.netAssets"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('scenarioSimulator.unitYuan') }}</span>
          <HelpTooltip :content="scenarioTutorial.parameters.netAssets" />
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.monthlyIncome')">
          <el-input-number
            v-model="currentScenario.monthlyIncome"
            :min="0"
            :step="1000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('scenarioSimulator.unitYuan') }}</span>
          <HelpTooltip :content="scenarioTutorial.parameters.monthlyIncome" />
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.monthlyExpense')">
          <el-input-number
            v-model="currentScenario.monthlyExpense"
            :min="0"
            :step="1000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('scenarioSimulator.unitYuan') }}</span>
          <HelpTooltip :content="scenarioTutorial.parameters.monthlyExpense" />
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.annualReturn')">
          <el-slider
            v-model="currentScenario.annualReturn"
            :min="0"
            :max="20"
            :step="0.5"
            show-input
            :show-input-controls="false"
          />
          <span class="unit">{{ t('scenarioSimulator.unitPercent') }}</span>
          <HelpTooltip :content="scenarioTutorial.parameters.annualReturn" />
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.freedomTarget')">
          <el-input-number
            v-model="currentScenario.financialFreedomTarget"
            :min="100000"
            :step="100000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('scenarioSimulator.unitYuan') }}</span>
          <HelpTooltip :content="scenarioTutorial.parameters.financialFreedomTarget" />
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 新场景输入 -->
    <div class="finance-card input-card">
      <div class="card-header">
        <span class="card-title">{{ t('scenarioSimulator.newScenario') }}</span>
        <el-tag type="success">{{ t('scenarioSimulator.simulateChanges') }}</el-tag>
      </div>
      
      <el-form :model="newScenario" label-width="120px" class="scenario-form">
        <el-form-item :label="t('scenarioSimulator.netAssets')">
          <el-input-number
            v-model="newScenario.netAssets"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
            :placeholder="t('scenarioSimulator.leaveEmptyUnchanged')"
          />
          <span class="unit">{{ t('scenarioSimulator.leaveEmptyUnchanged') }}</span>
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.monthlyIncome')">
          <el-input-number
            v-model="newScenario.monthlyIncome"
            :min="0"
            :step="1000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('scenarioSimulator.leaveEmptyUnchanged') }}</span>
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.monthlyExpense')">
          <el-input-number
            v-model="newScenario.monthlyExpense"
            :min="0"
            :step="1000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('scenarioSimulator.leaveEmptyUnchanged') }}</span>
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.annualReturn')">
          <el-slider
            v-model="newScenario.annualReturn"
            :min="0"
            :max="20"
            :step="0.5"
            show-input
            :show-input-controls="false"
          />
          <span class="unit">{{ t('scenarioSimulator.unitPercent') }}</span>
        </el-form-item>

        <el-form-item :label="t('scenarioSimulator.freedomTarget')">
          <el-input-number
            v-model="newScenario.financialFreedomTarget"
            :min="100000"
            :step="100000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">{{ t('scenarioSimulator.leaveEmptyUnchanged') }}</span>
        </el-form-item>
      </el-form>

      <div class="button-group">
        <el-button type="primary" @click="simulate" size="large">
          {{ t('scenarioSimulator.startSimulation') }}
        </el-button>
        <el-button @click="reset" size="large">
          {{ t('scenarioSimulator.reset') }}
        </el-button>
      </div>
    </div>
    
    <!-- 模拟结果 -->
    <div v-if="simulationResult" class="result-section">
      <!-- 核心指标对比 -->
      <div class="finance-card">
        <div class="card-header">
          <span class="card-title">{{ t('scenarioSimulator.comparisonResult') }}</span>
          <el-tag type="warning">{{ t('scenarioSimulator.changeAnalysis') }}</el-tag>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">{{ t('scenarioSimulator.monthlyBalance') }}</div>
            <div class="metric-value">
              ¥{{ simulationResult.current.monthlySavings.toLocaleString() }}
            </div>
            <div v-if="simulationResult.changes.monthlySavings !== 0"
                 :class="['metric-change', simulationResult.changes.monthlySavings > 0 ? 'positive' : 'negative']">
              {{ simulationResult.changes.monthlySavings > 0 ? '+' : '' }}
              ¥{{ simulationResult.changes.monthlySavings.toLocaleString() }}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">{{ t('scenarioSimulator.savingsRate') }}</div>
            <div class="metric-value">
              {{ simulationResult.current.savingsRate }}%
            </div>
            <div v-if="simulationResult.changes.savingsRate !== 0"
                 :class="['metric-change', simulationResult.changes.savingsRate > 0 ? 'positive' : 'negative']">
              {{ simulationResult.changes.savingsRate > 0 ? '+' : '' }}
              {{ simulationResult.changes.savingsRate }}%
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">{{ t('scenarioSimulator.financialFreedomTime') }}</div>
            <div class="metric-value">
              {{ simulationResult.current.yearsToFinancialFreedom }}{{ t('scenarioSimulator.unitYuan').charAt(0) }}
              {{ simulationResult.current.remainingMonthsToFinancialFreedom }}{{ t('scenarioSimulator.monthsUnit') }}
            </div>
            <div v-if="simulationResult.changes.financialFreedomMonths !== 0"
                 :class="['metric-change', simulationResult.changes.financialFreedomMonths > 0 ? 'positive' : 'negative']">
              {{ simulationResult.changes.financialFreedomMonths > 0 ? t('scenarioSimulator.advance') : t('scenarioSimulator.delay') }}
              {{ Math.abs(simulationResult.changes.financialFreedomMonths) }}{{ t('scenarioSimulator.monthsUnit') }}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">{{ t('scenarioSimulator.financialSecurity') }}</div>
            <div class="metric-value">
              {{ Math.floor(simulationResult.current.monthsToGuarantee / 12) }}{{ t('scenarioSimulator.unitYuan').charAt(0) }}
              {{ simulationResult.current.monthsToGuarantee % 12 }}{{ t('scenarioSimulator.monthsUnit') }}
            </div>
            <div v-if="simulationResult.changes.guaranteeMonths !== 0"
                 :class="['metric-change', simulationResult.changes.guaranteeMonths > 0 ? 'positive' : 'negative']">
              {{ simulationResult.changes.guaranteeMonths > 0 ? t('scenarioSimulator.advance') : t('scenarioSimulator.delay') }}
              {{ Math.abs(simulationResult.changes.guaranteeMonths) }}{{ t('scenarioSimulator.monthsUnit') }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 洞察提示 -->
      <div class="finance-card">
        <div class="card-header">
          <span class="card-title">{{ t('scenarioSimulator.insightTitle') }}</span>
          <el-tag type="info">{{ t('scenarioSimulator.smartAnalysis') }}</el-tag>
        </div>
        
        <div class="insights-list">
          <div v-for="(insight, index) in simulationResult.insight" 
               :key="index" 
               class="insight-item">
            {{ insight }}
          </div>
        </div>
      </div>
      
      <!-- 详细对比 -->
      <div class="finance-card">
        <div class="card-header">
          <span class="card-title">{{ t('scenarioSimulator.detailedComparison') }}</span>
          <el-tag>{{ t('scenarioSimulator.scenarioData') }}</el-tag>
        </div>
        
        <el-table :data="comparisonData" border style="width: 100%">
          <el-table-column prop="metric" :label="t('scenarioSimulator.metricCol')" width="180" />
          <el-table-column prop="current" :label="t('scenarioSimulator.currentScenarioCol')">
            <template #default="scope">
              {{ scope.row.current }}
            </template>
          </el-table-column>
          <el-table-column prop="new" :label="t('scenarioSimulator.newScenarioCol')">
            <template #default="scope">
              {{ scope.row.new }}
            </template>
          </el-table-column>
          <el-table-column prop="change" :label="t('scenarioSimulator.changeCol')">
            <template #default="scope">
              <span :style="{ color: scope.row.changeColor }">
                {{ scope.row.change }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 财务自由路径对比 -->
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('scenarioSimulator.freedomPathComparison') }}</span>
          <div>
            <el-tag>{{ t('scenarioSimulator.visualAnalysis') }}</el-tag>
            <el-button type="primary" text @click="handleExportChart">
              <el-icon><Picture /></el-icon>
              {{ t('scenarioSimulator.saveChart') }}
            </el-button>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 场景管理对话框 -->
    <el-dialog
      v-model="scenarioDialogVisible"
      :title="t('scenarioSimulator.scenarioManagement')"
      width="600px"
    >
      <!-- 保存场景表单 -->
      <el-form :model="{ name: currentScenarioName, description: currentScenarioDescription }" label-width="100px">
        <el-form-item :label="t('scenarioSimulator.scenarioName')">
          <el-input
            v-model="currentScenarioName"
            :placeholder="t('scenarioSimulator.scenarioNamePlaceholder')"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('scenarioSimulator.scenarioDescription')">
          <el-input
            v-model="currentScenarioDescription"
            type="textarea"
            :placeholder="t('scenarioSimulator.scenarioDescPlaceholder')"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveCurrentScenario" :icon="Plus">
            {{ t('scenarioSimulator.saveCurrentScenario') }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 已保存场景列表 -->
      <el-divider />

      <div v-if="savedScenarios.length === 0" class="empty-scenarios">
        {{ t('scenarioSimulator.noSavedScenarios') }}
      </div>
      <div v-else>
        <div class="scenarios-header">
          <span>{{ t('scenarioSimulator.savedScenarios', { count: savedScenarios.length }) }}</span>
        </div>
        <el-scrollbar max-height="400px">
          <div
            v-for="scenario in savedScenarios"
            :key="scenario.name"
            class="scenario-item"
          >
            <div class="scenario-info">
              <div class="scenario-name">{{ scenario.name }}</div>
              <div v-if="scenario.description" class="scenario-description">
                {{ scenario.description }}
              </div>
              <div class="scenario-meta">
                {{ t('scenarioSimulator.netAssetsLabel', { amount: scenario.data?.current?.netAssets?.toLocaleString() }) }} ·
                {{ t('scenarioSimulator.monthlyIncomeLabel', { amount: scenario.data?.current?.monthlyIncome?.toLocaleString() }) }} ·
                {{ t('scenarioSimulator.updated', { date: formatDate(scenario.updatedAt) }) }}
              </div>
            </div>
            <div class="scenario-actions">
              <el-button type="primary" size="small" @click="loadSavedScenario(scenario.name)" :icon="Download">
                {{ t('scenarioSimulator.load') }}
              </el-button>
              <el-button type="danger" size="small" @click="confirmDeleteScenario(scenario.name)" :icon="Delete">
                {{ t('scenarioSimulator.delete') }}
              </el-button>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, Plus, Delete, Download, Picture, Document, DocumentCopy } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { financialGoals } from '../stores/financialGoals'
import { saveScenario, loadScenario, getScenarios, deleteScenario, autoSaveScene, loadAutoSaveScene } from '../utils/localStorage'
import { exportToPDF, exportChartToImage, exportToExcel, prepareYearlyDataForExcel } from '../utils/export'
import { getScenarioChartConfig } from '../utils/chart-optimizer'
import HelpTooltip from '../components/HelpTooltip.vue'
import { scenarioTutorial } from '../utils/tutorial-content'
import useI18n from '../i18n'

const { t } = useI18n()

// 工具名称（用于存储）
const TOOL_NAME = 'scenario-simulator'

// 当前场景
const currentScenario = ref({
  netAssets: 1100000,  // 用户净资产
  monthlyIncome: 30000,
  monthlyExpense: 10000,
  annualReturn: 8,
  financialFreedomTarget: financialGoals.freedom
})

// 新场景
const newScenario = ref({
  netAssets: undefined as number | undefined,
  monthlyIncome: undefined as number | undefined,
  monthlyExpense: undefined as number | undefined,
  annualReturn: 8,
  financialFreedomTarget: undefined as number | undefined
})

// 模拟结果
const simulationResult = ref<any>(null)

// 场景管理相关
const savedScenarios = ref<any[]>([])
const scenarioDialogVisible = ref(false)
const currentScenarioName = ref('')
const currentScenarioDescription = ref('')

// 计算财务自由路径
function calculateFinancialFreedomPath(
  netAssets: number,
  monthlyIncome: number,
  monthlyExpense: number,
  annualReturn: number,
  financialFreedomTarget: number
) {
  const monthlySavings = monthlyIncome - monthlyExpense
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome * 100).toFixed(1) : '0'
  const monthlyRate = annualReturn / 100 / 12
  
  let assets = netAssets
  let months = 0
  const maxMonths = 600 // 最多50年
  
  while (assets < financialFreedomTarget && months < maxMonths) {
    const monthlyReturn = assets * monthlyRate
    assets += monthlyReturn + monthlySavings
    months++
  }
  
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  
  // 计算财务保障达成时间
  const guaranteeTarget = monthlyExpense * 6
  let guaranteeMonths = 0
  assets = netAssets
  while (assets < guaranteeTarget && guaranteeMonths < maxMonths) {
    const monthlyReturn = assets * monthlyRate
    assets += monthlyReturn + monthlySavings
    guaranteeMonths++
  }
  
  // 计算财务安全达成时间
  const securityTarget = monthlyExpense * 150
  let securityMonths = 0
  assets = netAssets
  while (assets < securityTarget && securityMonths < maxMonths) {
    const monthlyReturn = assets * monthlyRate
    assets += monthlyReturn + monthlySavings
    securityMonths++
  }
  
  return {
    netAssets,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    savingsRate,
    annualReturn,
    financialFreedomTarget,
    monthsToFinancialFreedom: months,
    yearsToFinancialFreedom: years,
    remainingMonthsToFinancialFreedom: remainingMonths,
    monthsToGuarantee: guaranteeMonths,
    monthsToSecurity: securityMonths,
    isAchievable: months < maxMonths
  }
}

// 情景模拟
function simulateScenario(current: any, newParams: any) {
  // 计算当前场景
  const currentPath = calculateFinancialFreedomPath(
    current.netAssets,
    current.monthlyIncome,
    current.monthlyExpense,
    current.annualReturn,
    current.financialFreedomTarget
  )
  
  // 计算新场景
  const newPath = calculateFinancialFreedomPath(
    newParams.netAssets !== undefined ? newParams.netAssets : current.netAssets,
    newParams.monthlyIncome !== undefined ? newParams.monthlyIncome : current.monthlyIncome,
    newParams.monthlyExpense !== undefined ? newParams.monthlyExpense : current.monthlyExpense,
    newParams.annualReturn,
    newParams.financialFreedomTarget !== undefined ? newParams.financialFreedomTarget : current.financialFreedomTarget
  )
  
  // 计算变化
  const changes = {
    netAssets: (newParams.netAssets !== undefined ? newParams.netAssets : current.netAssets) - current.netAssets,
    monthlyIncome: (newParams.monthlyIncome !== undefined ? newParams.monthlyIncome : current.monthlyIncome) - current.monthlyIncome,
    monthlyExpense: (newParams.monthlyExpense !== undefined ? newParams.monthlyExpense : current.monthlyExpense) - current.monthlyExpense,
    monthlySavings: newPath.monthlySavings - currentPath.monthlySavings,
    savingsRate: (parseFloat(newPath.savingsRate) - parseFloat(currentPath.savingsRate)).toFixed(1),
    financialFreedomMonths: currentPath.monthsToFinancialFreedom - newPath.monthsToFinancialFreedom,
    guaranteeMonths: currentPath.monthsToGuarantee - newPath.monthsToGuarantee,
    securityMonths: currentPath.monthsToSecurity - newPath.monthsToSecurity
  }
  
  // 生成洞察
  const insight = generateInsight(currentPath, newPath, changes)
  
  return {
    current: currentPath,
    new: newPath,
    changes,
    insight
  }
}

// 生成洞察
function generateInsight(currentPath: any, newPath: any, changes: any) {
  const insights: string[] = []

  // 财务自由时间变化
  if (changes.financialFreedomMonths > 0) {
    const y = Math.floor(changes.financialFreedomMonths / 12)
    const m = changes.financialFreedomMonths % 12
    if (y > 0) {
      const monthStr = m > 0 ? m + t('scenarioSimulator.unitMonth') : ''
      insights.push(t('scenarioSimulator.insightAdvanceYears').replace('{years}', String(y)).replace('{months}', monthStr))
    } else {
      insights.push(t('scenarioSimulator.insightAdvanceMonths').replace('{months}', String(m)))
    }
  } else if (changes.financialFreedomMonths < 0) {
    const y = Math.floor(Math.abs(changes.financialFreedomMonths) / 12)
    const m = Math.abs(changes.financialFreedomMonths) % 12
    if (y > 0) {
      const monthStr = m > 0 ? m + t('scenarioSimulator.unitMonth') : ''
      insights.push(t('scenarioSimulator.insightDelayYears').replace('{years}', String(y)).replace('{months}', monthStr))
    } else {
      insights.push(t('scenarioSimulator.insightDelayMonths').replace('{months}', String(m)))
    }
  } else {
    insights.push(t('scenarioSimulator.insightNoEffect'))
  }

  // 储蓄率变化
  if (parseFloat(changes.savingsRate) > 0) {
    insights.push(t('scenarioSimulator.insightSavingsRateUp')
      .replace('{current}', String(currentPath.savingsRate))
      .replace('{new}', String(newPath.savingsRate))
      .replace('{change}', String(changes.savingsRate)))
  } else if (parseFloat(changes.savingsRate) < 0) {
    insights.push(t('scenarioSimulator.insightSavingsRateDown')
      .replace('{current}', String(currentPath.savingsRate))
      .replace('{new}', String(newPath.savingsRate))
      .replace('{change}', String(changes.savingsRate)))
  }

  // 月结余变化
  if (changes.monthlySavings > 0) {
    insights.push(t('scenarioSimulator.insightMonthlySavingsUp')
      .replace('{change}', changes.monthlySavings.toLocaleString())
      .replace('{current}', currentPath.monthlySavings.toLocaleString())
      .replace('{new}', newPath.monthlySavings.toLocaleString()))
  } else if (changes.monthlySavings < 0) {
    insights.push(t('scenarioSimulator.insightMonthlySavingsDown')
      .replace('{change}', Math.abs(changes.monthlySavings).toLocaleString())
      .replace('{current}', currentPath.monthlySavings.toLocaleString())
      .replace('{new}', newPath.monthlySavings.toLocaleString()))
  }

  return insights
}

// 执行模拟
function simulate() {
  // 验证当前场景数据
  if (currentScenario.value.monthlyIncome <= 0) {
    ElMessage.warning(t('scenarioSimulator.pleaseInputIncome'))
    return
  }

  if (currentScenario.value.monthlyExpense <= 0) {
    ElMessage.warning(t('scenarioSimulator.pleaseInputExpense'))
    return
  }

  if (currentScenario.value.monthlyExpense >= currentScenario.value.monthlyIncome) {
    ElMessage.warning(t('scenarioSimulator.expenseGteIncome'))
    return
  }

  // 执行模拟
  simulationResult.value = simulateScenario(currentScenario.value, newScenario.value)

  // 初始化图表
  setTimeout(() => {
    initChart()
  }, 100)

  ElMessage.success(t('scenarioSimulator.simulationComplete'))
}

// 重置
function reset() {
  currentScenario.value = {
    netAssets: 1100000,  // 用户净资产
    monthlyIncome: 30000,
    monthlyExpense: 10000,
    annualReturn: 8,
    financialFreedomTarget: financialGoals.freedom
  }

  newScenario.value = {
    netAssets: undefined,
    monthlyIncome: undefined,
    monthlyExpense: undefined,
    annualReturn: 8,
    financialFreedomTarget: undefined
  }

  simulationResult.value = null
  currentScenarioName.value = ''
  currentScenarioDescription.value = ''
}

// 加载示例数据
const loadExampleData = () => {
  currentScenario.value = {
    netAssets: scenarioTutorial.exampleData.netAssets,
    monthlyIncome: scenarioTutorial.exampleData.monthlyIncome,
    monthlyExpense: scenarioTutorial.exampleData.monthlyExpense,
    annualReturn: scenarioTutorial.exampleData.annualReturn,
    financialFreedomTarget: scenarioTutorial.exampleData.financialFreedomTarget
  }
  simulationResult.value = null
  ElMessage.success(t('scenarioSimulator.exampleLoadSuccess'))
}

// 场景管理函数
function openScenarioDialog() {
  loadSavedScenarios()
  scenarioDialogVisible.value = true
}

function loadSavedScenarios() {
  const scenarios = getScenarios(TOOL_NAME)
  savedScenarios.value = Object.values(scenarios).map((scenario: any) => ({
    ...scenario,
    updatedAt: new Date(scenario.updatedAt)
  })).sort((a: any, b: any) => b.updatedAt - a.updatedAt)
}

function saveCurrentScenario() {
  if (!currentScenarioName.value.trim()) {
    ElMessage.warning(t('scenarioSimulator.pleaseInputName'))
    return
  }

  const scenarioData = {
    current: currentScenario.value,
    new: newScenario.value,
    description: currentScenarioDescription.value
  }

  if (saveScenario(TOOL_NAME, currentScenarioName.value, scenarioData)) {
    ElMessage.success(t('scenarioSimulator.scenarioSaveSuccess'))
    loadSavedScenarios()
    scenarioDialogVisible.value = false
  } else {
    ElMessage.error(t('scenarioSimulator.scenarioSaveFailed'))
  }
}

function loadSavedScenario(scenarioName: string) {
  const data = loadScenario(TOOL_NAME, scenarioName)
  if (data) {
    currentScenario.value = { ...data.current }
    newScenario.value = { ...data.new }
    currentScenarioName.value = scenarioName
    currentScenarioDescription.value = data.description || ''
    simulationResult.value = null
    ElMessage.success(t('scenarioSimulator.scenarioLoadSuccess'))
    scenarioDialogVisible.value = false
  } else {
    ElMessage.error(t('scenarioSimulator.scenarioLoadFailed'))
  }
}

function confirmDeleteScenario(scenarioName: string) {
  ElMessageBox.confirm(
    t('scenarioSimulator.deleteConfirm').replace('{name}', scenarioName),
    t('scenarioSimulator.deleteConfirmTitle'),
    {
      confirmButtonText: t('scenarioSimulator.delete'),
      cancelButtonText: t('scenarioSimulator.delete'),
      type: 'warning'
    }
  ).then(() => {
    if (deleteScenario(TOOL_NAME, scenarioName)) {
      ElMessage.success(t('scenarioSimulator.scenarioDeleteSuccess'))
      loadSavedScenarios()
    } else {
      ElMessage.error(t('scenarioSimulator.scenarioDeleteFailed'))
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 格式化日期
function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('scenarioSimulator.justNow')
  if (minutes < 60) return t('scenarioSimulator.minutesAgo', { minutes })
  if (hours < 24) return t('scenarioSimulator.hoursAgo', { hours })
  if (days < 7) return t('scenarioSimulator.daysAgo', { days })
  return date.toLocaleDateString('zh-CN')
}

// 对比数据
const comparisonData = computed(() => {
  if (!simulationResult.value) return []
  
  const result = simulationResult.value
  
  return [
    {
      metric: t('scenarioSimulator.metricNetAssets'),
      current: `¥${result.current.netAssets.toLocaleString()}`,
      new: `¥${result.new.netAssets.toLocaleString()}`,
      change: result.changes.netAssets >= 0
        ? `+¥${result.changes.netAssets.toLocaleString()}`
        : `-¥${Math.abs(result.changes.netAssets).toLocaleString()}`,
      changeColor: result.changes.netAssets >= 0 ? '#67C23A' : '#F56C6C'
    },
    {
      metric: t('scenarioSimulator.metricMonthlyIncome'),
      current: `¥${result.current.monthlyIncome.toLocaleString()}`,
      new: `¥${result.new.monthlyIncome.toLocaleString()}`,
      change: result.changes.monthlyIncome >= 0
        ? `+¥${result.changes.monthlyIncome.toLocaleString()}`
        : `-¥${Math.abs(result.changes.monthlyIncome).toLocaleString()}`,
      changeColor: result.changes.monthlyIncome >= 0 ? '#67C23A' : '#F56C6C'
    },
    {
      metric: t('scenarioSimulator.metricMonthlyExpense'),
      current: `¥${result.current.monthlyExpense.toLocaleString()}`,
      new: `¥${result.new.monthlyExpense.toLocaleString()}`,
      change: result.changes.monthlyExpense >= 0
        ? `+¥${result.changes.monthlyExpense.toLocaleString()}`
        : `-¥${Math.abs(result.changes.monthlyExpense).toLocaleString()}`,
      changeColor: result.changes.monthlyExpense <= 0 ? '#67C23A' : '#F56C6C'
    },
    {
      metric: t('scenarioSimulator.metricMonthlyBalance'),
      current: `¥${result.current.monthlySavings.toLocaleString()}`,
      new: `¥${result.new.monthlySavings.toLocaleString()}`,
      change: result.changes.monthlySavings >= 0
        ? `+¥${result.changes.monthlySavings.toLocaleString()}`
        : `-¥${Math.abs(result.changes.monthlySavings).toLocaleString()}`,
      changeColor: result.changes.monthlySavings >= 0 ? '#67C23A' : '#F56C6C'
    },
    {
      metric: t('scenarioSimulator.metricSavingsRate'),
      current: `${result.current.savingsRate}%`,
      new: `${result.new.savingsRate}%`,
      change: parseFloat(result.changes.savingsRate) >= 0
        ? `+${result.changes.savingsRate}%`
        : `${result.changes.savingsRate}%`,
      changeColor: parseFloat(result.changes.savingsRate) >= 0 ? '#67C23A' : '#F56C6C'
    },
    {
      metric: t('scenarioSimulator.metricFreedomTime'),
      current: `${result.current.yearsToFinancialFreedom}${t('scenarioSimulator.unitYuan').charAt(0)}${result.current.remainingMonthsToFinancialFreedom}${t('scenarioSimulator.monthsUnit')}`,
      new: `${result.new.yearsToFinancialFreedom}${t('scenarioSimulator.unitYuan').charAt(0)}${result.new.remainingMonthsToFinancialFreedom}${t('scenarioSimulator.monthsUnit')}`,
      change: result.changes.financialFreedomMonths > 0
        ? t('scenarioSimulator.advanceMonths', { months: result.changes.financialFreedomMonths })
        : result.changes.financialFreedomMonths < 0
          ? t('scenarioSimulator.delayMonths', { months: Math.abs(result.changes.financialFreedomMonths) })
          : t('scenarioSimulator.noChange'),
      changeColor: result.changes.financialFreedomMonths >= 0 ? '#67C23A' : '#F56C6C'
    },
    {
      metric: t('scenarioSimulator.metricSecurityTime'),
      current: `${Math.floor(result.current.monthsToGuarantee / 12)}${t('scenarioSimulator.unitYuan').charAt(0)}${result.current.monthsToGuarantee % 12}${t('scenarioSimulator.monthsUnit')}`,
      new: `${Math.floor(result.new.monthsToGuarantee / 12)}${t('scenarioSimulator.unitYuan').charAt(0)}${result.new.monthsToGuarantee % 12}${t('scenarioSimulator.monthsUnit')}`,
      change: result.changes.guaranteeMonths > 0
        ? t('scenarioSimulator.advanceMonths', { months: result.changes.guaranteeMonths })
        : result.changes.guaranteeMonths < 0
          ? t('scenarioSimulator.delayMonths', { months: Math.abs(result.changes.guaranteeMonths) })
          : t('scenarioSimulator.noChange'),
      changeColor: result.changes.guaranteeMonths >= 0 ? '#67C23A' : '#F56C6C'
    },
    {
      metric: t('scenarioSimulator.metricAnnualReturn'),
      current: `${result.current.annualReturn}%`,
      new: `${result.new.annualReturn}%`,
      change: `${(result.new.annualReturn - result.current.annualReturn).toFixed(1)}%`,
      changeColor: result.new.annualReturn >= result.current.annualReturn ? '#67C23A' : '#F56C6C'
    }
  ]
})

// 页面加载时自动执行模拟

// ==================== 导出功能 ====================

const chartRef = ref<HTMLElement>()
const chartInstance = ref<any>(null)

// 导出 PDF
const handleExportPDF = () => {
  exportToPDF(t('scenarioSimulator.title'))
}

// 导出图表
const handleExportChart = () => {
  if (!chartInstance.value) {
    ElMessage.error(t('scenarioSimulator.chartNotInit'))
    return
  }
  exportChartToImage(chartInstance.value, t('scenarioSimulator.exportChartName'))
}

// 导出 Excel
const handleExportExcel = () => {
  if (!simulationResult.value) {
    ElMessage.error(t('scenarioSimulator.pleaseSimulate'))
    return
  }

  const data = prepareYearlyDataForExcel(simulationResult.value.yearlyData)
  exportToExcel(data, t('scenarioSimulator.exportExcelName'), t('scenarioSimulator.exportExcelSheet'))
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !simulationResult.value) return

  const chart = echarts.init(chartRef.value)

  // 计算每年数据
  const years = []
  const currentAssetsData = []
  const newAssetsData = []

  const maxYears = Math.max(
    simulationResult.value.current.monthsToFinancialFreedom,
    simulationResult.value.new.monthsToFinancialFreedom
  )

  for (let month = 0; month <= maxYears; month++) {
    if (month % 12 === 0) {
      years.push(t('scenarioSimulator.chartYearLabel').replace('{year}', String(month / 12)))
    }

    // 计算当前场景的资产
    const currentMonthlySavings = simulationResult.value.current.monthlySavings
    const currentMonthlyRate = simulationResult.value.current.annualReturn / 12
    let currentAssets = simulationResult.value.current.netAssets
    for (let m = 0; m < month; m++) {
      currentAssets = currentAssets * (1 + currentMonthlyRate) + currentMonthlySavings
    }
    if (month % 12 === 0) {
      currentAssetsData.push(Math.round(currentAssets))
    }

    // 计算新场景的资产
    const newMonthlySavings = simulationResult.value.new.monthlySavings
    const newMonthlyRate = simulationResult.value.new.annualReturn / 12
    let newAssets = simulationResult.value.new.netAssets
    for (let m = 0; m < month; m++) {
      newAssets = newAssets * (1 + newMonthlyRate) + newMonthlySavings
    }
    if (month % 12 === 0) {
      newAssetsData.push(Math.round(newAssets))
    }
  }

  // 使用优化后的图表配置
  chart.setOption(getScenarioChartConfig(years, currentAssetsData, newAssetsData))

  // 保存图表实例
  chartInstance.value = chart
}

onMounted(() => {
  // 尝试加载自动保存的场景
  const autoSaved = loadAutoSaveScene(TOOL_NAME)
  if (autoSaved) {
    currentScenario.value = { ...autoSaved.current }
    newScenario.value = { ...autoSaved.new }
    ElMessage.info(t('scenarioSimulator.restoredScene'))
  }

  simulate()
})

// 自动保存
watch([currentScenario, newScenario], () => {
  const scenarioData = {
    current: currentScenario.value,
    new: newScenario.value
  }
  autoSaveScene(TOOL_NAME, scenarioData)
}, { deep: true })
</script>

<style scoped>
  .scenario-simulator {
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

      .scenario-simulator-form {
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
