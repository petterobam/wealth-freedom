<template>
  <div class="large-expense-planner">
    <h1 class="page-title">大额支出规划</h1>
    
    <!-- 输入参数 -->
    <div class="finance-card input-card">
      <div class="card-header">
        <span class="card-title">规划参数</span>
        <el-tag type="info">目标清晰，路径明确</el-tag>
      </div>
      
      <el-form :model="plannerForm" label-width="120px" class="planner-form">
        <el-form-item label="目标名称">
          <el-input
            v-model="plannerForm.goalName"
            placeholder="例如：买房首付、买车、教育基金"
          />
          <HelpTooltip :content="largeExpenseTutorial.parameters.goalName" />
        </el-form-item>

        <el-form-item label="目标金额">
          <el-input-number
            v-model="plannerForm.targetAmount"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">元</span>
          <HelpTooltip :content="largeExpenseTutorial.parameters.targetAmount" />
        </el-form-item>

        <el-form-item label="目标时间">
          <el-input-number
            v-model="plannerForm.yearsToTarget"
            :min="1"
            :max="30"
            controls-position="right"
          />
          <span class="unit">年</span>
          <HelpTooltip :content="largeExpenseTutorial.parameters.yearsToTarget" />
        </el-form-item>

        <el-form-item label="当前储蓄">
          <el-input-number
            v-model="plannerForm.currentSavings"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">元</span>
          <HelpTooltip :content="largeExpenseTutorial.parameters.currentSavings" />
        </el-form-item>

        <el-form-item label="每月储蓄">
          <el-input-number
            v-model="plannerForm.monthlySavings"
            :min="0"
            :step="1000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">元</span>
          <HelpTooltip :content="largeExpenseTutorial.parameters.monthlySavings" />
        </el-form-item>

        <el-form-item label="年化收益率">
          <el-slider
            v-model="plannerForm.annualRate"
            :min="0"
            :max="15"
            :step="0.5"
            :marks="rateMarks"
            show-input
          />
          <span class="hint">推荐：8%（基于历史数据）</span>
          <HelpTooltip :content="largeExpenseTutorial.parameters.annualRate" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="calculatePlan" size="large">
            计算规划
          </el-button>
          <el-button @click="resetForm" size="large">重置</el-button>
          <el-button type="success" @click="openScenarioDialog" size="large">
            <el-icon><FolderOpened /></el-icon>
            场景管理
          </el-button>
          <el-button type="warning" @click="loadExampleData" size="large">
            <el-icon><DocumentCopy /></el-icon>
            示例数据
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 场景管理对话框 -->
    <el-dialog v-model="showScenarioDialog" title="场景管理" width="600px">
      <div class="scenario-actions">
        <el-input
          v-model="currentScenarioName"
          placeholder="输入场景名称"
          style="width: 200px"
        />
        <el-button type="primary" @click="handleSaveScenario(currentScenarioName)">
          保存当前场景
        </el-button>
      </div>

      <el-divider />

      <div class="scenario-list">
        <el-empty v-if="Object.keys(scenarios).length === 0" description="暂无保存的场景" />

        <el-table v-else :data="Object.entries(scenarios).map(([name, data]) => ({ name, ...data }))" style="width: 100%">
          <el-table-column prop="name" label="场景名称" width="200" />
          <el-table-column label="参数" width="300">
            <template #default="{ row }">
              <div class="scenario-params">
                <span>{{ row.data?.goalName }}</span>
                <span>目标: ¥{{ row.data?.targetAmount?.toLocaleString() }}</span>
                <span>{{ row.data?.yearsToTarget }}年, {{ row.data?.annualRate }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleLoadScenario(row.name)">
                加载
              </el-button>
              <el-button type="danger" link @click="handleDeleteScenario(row.name)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 计算结果 -->
    <div v-if="result" class="result-section">
      <!-- 核心指标 -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">目标金额</div>
          <div class="metric-value">{{ formatMoney(result.targetAmount) }}</div>
          <div class="metric-sub">{{ result.yearsToTarget }}年后</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">未来资产</div>
          <div class="metric-value">{{ formatMoney(result.futureAssets) }}</div>
          <div class="metric-sub">考虑复利增长</div>
        </div>
        
        <div class="metric-card" :class="result.isAchievable ? 'success' : 'warning'">
          <div class="metric-label">是否可达成</div>
          <div class="metric-value">
            {{ result.isAchievable ? '✅ 是' : '❌ 否' }}
          </div>
          <div class="metric-sub">
            {{ result.isAchievable ? `${result.yearsToAchieve}年达成` : `缺口${formatMoney(result.gap)}` }}
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">建议方案</div>
          <div class="metric-value" :class="result.isAchievable ? 'success-text' : 'warning-text'">
            {{ result.isAchievable ? '保持现状' : `月存+${formatMoney(result.additionalSavingsNeeded)}` }}
          </div>
          <div class="metric-sub">{{ result.recommendation }}</div>
        </div>
      </div>
      
      <!-- 详细分析 -->
      <div class="finance-card detail-card">
        <div class="card-header">
          <span class="card-title">详细分析</span>
        </div>
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">当前储蓄：</span>
            <span class="detail-value">{{ formatMoney(result.currentSavings) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">每月储蓄：</span>
            <span class="detail-value">{{ formatMoney(result.monthlySavings) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">总投入：</span>
            <span class="detail-value">{{ formatMoney(result.futureAssetsDetail.totalContribution) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">投资收益：</span>
            <span class="detail-value">{{ formatMoney(result.futureAssetsDetail.totalInterest) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">收益率：</span>
            <span class="detail-value">{{ result.futureAssetsDetail.interestRatio }}%</span>
          </div>
          <div class="detail-item" v-if="!result.isAchievable">
            <span class="detail-label">缺口金额：</span>
            <span class="detail-value warning-text">{{ formatMoney(result.gap) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 时间计算器 -->
      <div class="finance-card time-calculator-card">
        <div class="card-header">
          <span class="card-title">时间计算器</span>
          <el-tag type="info">保持当前储蓄，需要多久？</el-tag>
        </div>
        
        <div class="time-result">
          <div class="time-item">
            <span class="time-label">达成时间：</span>
            <span class="time-value">
              {{ timeResult.years }}年{{ timeResult.months }}个月
            </span>
          </div>
          <div class="time-item">
            <span class="time-label">最终金额：</span>
            <span class="time-value">{{ formatMoney(timeResult.finalAmount) }}</span>
          </div>
          <div class="time-item" v-if="timeResult.years > parseFloat(result.yearsToTarget)">
            <span class="time-label">延长：</span>
            <span class="time-value warning-text">
              {{ (timeResult.years - parseFloat(result.yearsToTarget)).toFixed(1) }}年
            </span>
          </div>
        </div>
      </div>
      
      <!-- 建议提示 -->
      <div class="finance-card suggestion-card">
        <div class="card-header">
          <span class="card-title">💡 建议提示</span>
        </div>
        
        <div class="suggestions">
          <div class="suggestion-item" v-if="result.isAchievable">
            <el-icon class="suggestion-icon"><SuccessFilled /></el-icon>
            <span>目标可达成！继续按计划储蓄和投资，{{ result.yearsToAchieve }}年后达成目标。</span>
          </div>
          
          <div class="suggestion-item" v-if="!result.isAchievable">
            <el-icon class="suggestion-icon warning"><WarningFilled /></el-icon>
            <span>目标不足。建议每月增加{{ formatMoney(result.additionalSavingsNeeded) }}元储蓄，或延长目标时间至{{ timeResult.years }}年{{ timeResult.months }}个月。</span>
          </div>
          
          <div class="suggestion-item">
            <el-icon class="suggestion-icon"><TrendCharts /></el-icon>
            <span>复利效应显著：{{ result.yearsToTarget }}年投资收益可达{{ formatMoney(result.futureAssetsDetail.totalInterest) }}（收益率{{ result.futureAssetsDetail.interestRatio }}%）。</span>
          </div>
          
          <div class="suggestion-item">
            <el-icon class="suggestion-icon"><InfoFilled /></el-icon>
            <span>年化收益率8%基于历史数据，实际收益可能波动。建议分散投资降低风险。</span>
          </div>
        </div>
      </div>

      <!-- 资产增长曲线 -->
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">资产增长曲线</span>
          <div>
            <el-tag>可视化分析</el-tag>
            <el-button type="primary" text @click="handleExportChart">
              <el-icon><Picture /></el-icon>
              保存图表
            </el-button>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { SuccessFilled, WarningFilled, TrendCharts, InfoFilled, FolderOpened, Download, Picture, Document, DocumentCopy } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { saveScenario, loadScenario, getScenarios, deleteScenario, autoSaveScene, loadAutoSaveScene, clearAutoSaveScene } from '../utils/localStorage'
import { exportToPDF, exportChartToImage, exportToExcel, prepareYearlyDataForExcel } from '../utils/export'
import { getLargeExpenseChartConfig } from '../utils/chart-optimizer'
import { ElMessage } from 'element-plus'
import HelpTooltip from '../components/HelpTooltip.vue'
import { largeExpenseTutorial } from '../utils/tutorial-content'

// 表单数据
const plannerForm = reactive({
  goalName: '买房首付',
  targetAmount: 1000000,
  yearsToTarget: 3,
  currentSavings: 1100000,  // 用户净资产
  monthlySavings: 20000,
  annualRate: 8
})

// 收益率标记
const rateMarks = {
  0: '0%',
  4: '4%',
  8: '8%',
  12: '12%',
  15: '15%'
}

// 计算结果
const result = ref<any>(null)
const timeResult = ref<any>(null)

// ==================== 场景管理 ====================
const currentScenarioName = ref('')
const showScenarioDialog = ref(false)
const scenarios = ref<Record<string, any>>({})

// 加载场景列表
const loadScenariosList = () => {
  scenarios.value = getScenarios('largeExpense')
}

// 保存当前场景
const handleSaveScenario = (scenarioName: string) => {
  if (!scenarioName.trim()) {
    ElMessage.error('场景名称不能为空')
    return
  }

  const success = saveScenario('largeExpense', scenarioName, {
    goalName: plannerForm.goalName,
    targetAmount: plannerForm.targetAmount,
    yearsToTarget: plannerForm.yearsToTarget,
    currentSavings: plannerForm.currentSavings,
    monthlySavings: plannerForm.monthlySavings,
    annualRate: plannerForm.annualRate
  })

  if (success) {
    ElMessage.success(`场景 "${scenarioName}" 保存成功`)
    currentScenarioName.value = scenarioName
    loadScenariosList()
  } else {
    ElMessage.error('保存失败，请重试')
  }
}

// 加载场景
const handleLoadScenario = (scenarioName: string) => {
  const data = loadScenario('largeExpense', scenarioName)

  if (data) {
    plannerForm.goalName = data.goalName
    plannerForm.targetAmount = data.targetAmount
    plannerForm.yearsToTarget = data.yearsToTarget
    plannerForm.currentSavings = data.currentSavings
    plannerForm.monthlySavings = data.monthlySavings
    plannerForm.annualRate = data.annualRate
    currentScenarioName.value = scenarioName
    result.value = null
    timeResult.value = null
    calculatePlan()
    ElMessage.success(`场景 "${scenarioName}" 加载成功`)
  } else {
    ElMessage.error('加载失败，请重试')
  }
}

// 删除场景
const handleDeleteScenario = (scenarioName: string) => {
  const success = deleteScenario('largeExpense', scenarioName)

  if (success) {
    ElMessage.success(`场景 "${scenarioName}" 删除成功`)
    loadScenariosList()
    if (currentScenarioName.value === scenarioName) {
      currentScenarioName.value = ''
    }
  } else {
    ElMessage.error('删除失败，请重试')
  }
}

// 打开场景管理对话框
const openScenarioDialog = () => {
  loadScenariosList()
  showScenarioDialog.value = true
}

// 自动保存当前表单数据
watch(() => plannerForm, (newForm) => {
  autoSaveScene('largeExpense', newForm)
}, { deep: true })

// 复利计算器
function calculateCompoundInterest(principal: number, monthlyContribution: number, years: number, annualRate: number) {
  if (annualRate === 0) {
    const totalContribution = principal + (monthlyContribution * years * 12)
    return {
      totalFuture: Math.round(totalContribution),
      totalContribution: Math.round(totalContribution),
      totalInterest: 0,
      interestRatio: 0,
      yearlyData: []
    }
  }
  
  const monthlyRate = annualRate / 100 / 12
  const months = years * 12
  
  const principalFuture = principal * Math.pow(1 + monthlyRate, months)
  const contributionFuture = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  
  const totalFuture = principalFuture + contributionFuture
  const totalContribution = principal + (monthlyContribution * months)
  const totalInterest = totalFuture - totalContribution
  
  const yearlyData = []
  for (let year = 1; year <= years; year++) {
    const yearMonths = year * 12
    const yearPrincipalFuture = principal * Math.pow(1 + monthlyRate, yearMonths)
    const yearContributionFuture = monthlyContribution * 
      ((Math.pow(1 + monthlyRate, yearMonths) - 1) / monthlyRate)
    const yearTotal = yearPrincipalFuture + yearContributionFuture
    
    yearlyData.push({
      year: year,
      totalAssets: Math.round(yearTotal),
      totalContribution: principal + (monthlyContribution * yearMonths),
      totalInterest: Math.round(yearTotal - principal - (monthlyContribution * yearMonths))
    })
  }
  
  return {
    totalFuture: Math.round(totalFuture),
    totalContribution: Math.round(totalContribution),
    totalInterest: Math.round(totalInterest),
    interestRatio: ((totalInterest / totalContribution) * 100).toFixed(1),
    yearlyData: yearlyData
  }
}

// 大额支出规划
function planLargeExpense(targetAmount: number, monthsToTarget: number, currentSavings: number, monthlySavings: number, annualReturn: number) {
  const yearsToTarget = monthsToTarget / 12
  const futureAssets = calculateCompoundInterest(currentSavings, monthlySavings, yearsToTarget, annualReturn)
  
  const isAchievable = futureAssets.totalFuture >= targetAmount
  
  let monthsToAchieve = null
  if (isAchievable) {
    if (annualReturn === 0) {
      monthsToAchieve = Math.ceil((targetAmount - currentSavings) / monthlySavings)
    } else {
      const monthlyRate = annualReturn / 100 / 12
      let assets = currentSavings
      monthsToAchieve = 0
      
      while (assets < targetAmount && monthsToAchieve < monthsToTarget) {
        const monthlyReturn = assets * monthlyRate
        assets += monthlyReturn + monthlySavings
        monthsToAchieve++
      }
    }
  }
  
  let additionalSavingsNeeded = 0
  if (!isAchievable) {
    if (annualReturn === 0) {
      additionalSavingsNeeded = Math.ceil((targetAmount - currentSavings) / monthsToTarget) - monthlySavings
    } else {
      const monthlyRate = annualReturn / 100 / 12
      const targetMonths = monthsToTarget
      
      const futureValueOfPrincipal = currentSavings * Math.pow(1 + monthlyRate, targetMonths)
      const requiredContribution = (targetAmount - futureValueOfPrincipal) / 
        ((Math.pow(1 + monthlyRate, targetMonths) - 1) / monthlyRate)
      
      additionalSavingsNeeded = Math.ceil(requiredContribution - monthlySavings)
    }
  }
  
  const gap = targetAmount - futureAssets.totalFuture
  
  let recommendation = ''
  if (isAchievable) {
    const yearsToAchieve = (monthsToAchieve! / 12).toFixed(1)
    recommendation = `目标可达成！预计 ${yearsToAchieve} 年后达成`
  } else {
    recommendation = `目标不足，需要每月增加 ${additionalSavingsNeeded.toLocaleString()} 元储蓄`
  }
  
  return {
    targetAmount: targetAmount,
    monthsToTarget: monthsToTarget,
    yearsToTarget: (monthsToTarget / 12).toFixed(1),
    currentSavings: currentSavings,
    monthlySavings: monthlySavings,
    futureAssets: futureAssets.totalFuture,
    isAchievable: isAchievable,
    monthsToAchieve: monthsToAchieve,
    yearsToAchieve: monthsToAchieve ? (monthsToAchieve / 12).toFixed(1) : null,
    gap: gap > 0 ? Math.round(gap) : 0,
    additionalSavingsNeeded: additionalSavingsNeeded > 0 ? additionalSavingsNeeded : 0,
    recommendation: recommendation,
    futureAssetsDetail: futureAssets
  }
}

// 时间计算器
function calculateTimeToGoal(targetAmount: number, currentSavings: number, monthlySavings: number, annualReturn: number) {
  if (annualReturn === 0) {
    const months = Math.ceil((targetAmount - currentSavings) / monthlySavings)
    return {
      years: Math.floor(months / 12),
      months: months % 12,
      totalMonths: months,
      finalAmount: currentSavings + monthlySavings * months
    }
  }
  
  const monthlyRate = annualReturn / 100 / 12
  let assets = currentSavings
  let months = 0
  
  while (assets < targetAmount) {
    const monthlyReturn = assets * monthlyRate
    assets += monthlyReturn + monthlySavings
    months++
    
    if (months > 1200) {
      return {
        years: 100,
        months: 0,
        totalMonths: 1200,
        finalAmount: assets,
        unreachable: true
      }
    }
  }
  
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    totalMonths: months,
    finalAmount: Math.round(assets)
  }
}

// 计算规划
function calculatePlan() {
  const monthsToTarget = plannerForm.yearsToTarget * 12

  result.value = planLargeExpense(
    plannerForm.targetAmount,
    monthsToTarget,
    plannerForm.currentSavings,
    plannerForm.monthlySavings,
    plannerForm.annualRate
  )

  timeResult.value = calculateTimeToGoal(
    plannerForm.targetAmount,
    plannerForm.currentSavings,
    plannerForm.monthlySavings,
    plannerForm.annualRate
  )

  // 初始化图表
  setTimeout(() => {
    initChart()
  }, 100)
}

// 重置表单
function resetForm() {
  plannerForm.goalName = '买房首付'
  plannerForm.targetAmount = 1000000
  plannerForm.yearsToTarget = 3
  plannerForm.currentSavings = 1100000  // 用户净资产
  plannerForm.monthlySavings = 20000
  plannerForm.annualRate = 8
  result.value = null
  timeResult.value = null
}

// 加载示例数据
const loadExampleData = () => {
  plannerForm.goalName = largeExpenseTutorial.exampleData.goalName
  plannerForm.targetAmount = largeExpenseTutorial.exampleData.targetAmount
  plannerForm.yearsToTarget = largeExpenseTutorial.exampleData.yearsToTarget
  plannerForm.currentSavings = largeExpenseTutorial.exampleData.currentSavings
  plannerForm.monthlySavings = largeExpenseTutorial.exampleData.monthlySavings
  plannerForm.annualRate = largeExpenseTutorial.exampleData.annualRate
  result.value = null
  timeResult.value = null
  ElMessage.success('示例数据加载成功，点击"计算规划"查看结果')
}

// 格式化金额
function formatMoney(value: number) {
  return '¥' + value.toLocaleString()
}

// 页面加载时自动计算

// ==================== 导出功能 ====================

const chartRef = ref<HTMLElement>()
const chartInstance = ref<any>(null)

// 导出 PDF
const handleExportPDF = () => {
  exportToPDF('大额支出规划')
}

// 导出图表
const handleExportChart = () => {
  if (!chartInstance.value) {
    ElMessage.error('图表未初始化')
    return
  }
  exportChartToImage(chartInstance.value, '大额支出规划_图表')
}

// 导出 Excel
const handleExportExcel = () => {
  if (!result.value) {
    ElMessage.error('请先计算')
    return
  }

  const data = prepareYearlyDataForExcel(result.value.yearlyData)
  exportToExcel(data, '大额支出规划_年度明细', '年度明细')
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !result.value) return

  const chart = echarts.init(chartRef.value)

  // 计算每年数据
  const years = []
  const targetData = []
  const assetsData = []

  for (let year = 1; year <= plannerForm.yearsToTarget; year++) {
    years.push(`第${year}年`)

    // 目标金额（不变）
    targetData.push(plannerForm.targetAmount)

    // 未来资产
    const futureAssets = calculateCompoundInterest(
      plannerForm.currentSavings,
      plannerForm.monthlySavings,
      year,
      plannerForm.annualRate
    )
    assetsData.push(futureAssets.totalFuture)
  }

  // 使用优化后的图表配置
  chart.setOption(getLargeExpenseChartConfig(years, targetData, assetsData))

  // 保存图表实例
  chartInstance.value = chart
}

onMounted(() => {
  // 加载自动保存的数据
  const autoSaveData = loadAutoSaveScene('largeExpense')
  if (autoSaveData) {
    plannerForm.goalName = autoSaveData.goalName
    plannerForm.targetAmount = autoSaveData.targetAmount
    plannerForm.yearsToTarget = autoSaveData.yearsToTarget
    plannerForm.currentSavings = autoSaveData.currentSavings
    plannerForm.monthlySavings = autoSaveData.monthlySavings
    plannerForm.annualRate = autoSaveData.annualRate
  }

  // 加载场景列表
  loadScenariosList()

  // 自动执行一次计算
  calculatePlan()
})

// 组件卸载时清除自动保存的数据
onUnmounted(() => {
  clearAutoSaveScene('largeExpense')
})
</script>

<style scoped>
  .calculator {
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

      .calculator-form {
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
