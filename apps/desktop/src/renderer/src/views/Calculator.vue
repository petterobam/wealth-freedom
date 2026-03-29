<template>
  <div class="calculator">
    <h1 class="page-title">复利计算器</h1>
    
    <!-- 输入参数 -->
    <div class="finance-card input-card">
      <div class="card-header">
        <span class="card-title">计算参数</span>
        <el-tag type="info">复利的力量</el-tag>
      </div>
      
      <el-form :model="calculatorForm" label-width="120px" class="calculator-form">
        <el-form-item label="初始本金">
          <el-input-number
            v-model="calculatorForm.principal"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">元</span>
          <HelpTooltip :content="calculatorTutorial.parameters.principal" />
        </el-form-item>

        <el-form-item label="每月定投">
          <el-input-number
            v-model="calculatorForm.monthlyContribution"
            :min="0"
            :step="1000"
            :precision="0"
            controls-position="right"
          />
          <span class="unit">元</span>
          <HelpTooltip :content="calculatorTutorial.parameters.monthlyContribution" />
        </el-form-item>

        <el-form-item label="投资年限">
          <el-input-number
            v-model="calculatorForm.years"
            :min="1"
            :max="50"
            controls-position="right"
          />
          <span class="unit">年</span>
          <HelpTooltip :content="calculatorTutorial.parameters.years" />
        </el-form-item>

        <el-form-item label="年化收益率">
          <el-slider
            v-model="calculatorForm.annualRate"
            :min="0"
            :max="20"
            :step="0.5"
            :marks="rateMarks"
            show-input
          />
          <span class="unit">%</span>
          <HelpTooltip :content="calculatorTutorial.parameters.annualRate" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleCalculate">
            <el-icon><TrendCharts /></el-icon>
            计算
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="openScenarioDialog">
            <el-icon><FolderOpened /></el-icon>
            场景管理
          </el-button>
          <el-button type="warning" @click="loadExampleData">
            <el-icon><DocumentCopy /></el-icon>
            示例数据
          </el-button>
          <el-button v-if="result" type="info" @click="handleExportPDF">
            <el-icon><Download /></el-icon>
            导出 PDF
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
                <span>本金: ¥{{ row.data?.principal?.toLocaleString() }}</span>
                <span>定投: ¥{{ row.data?.monthlyContribution?.toLocaleString() }}/月</span>
                <span>{{ row.data?.years }}年, {{ row.data?.annualRate }}%</span>
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
      <div class="section-title">计算结果</div>
      
      <!-- 核心指标 -->
      <div class="metric-cards">
        <div class="metric-card gradient-primary">
          <div class="metric-icon">💰</div>
          <div class="metric-info">
            <div class="metric-label">总投入</div>
            <div class="metric-value">{{ formatCurrency(result.totalContribution) }}</div>
          </div>
        </div>
        
        <div class="metric-card gradient-success">
          <div class="metric-icon">📈</div>
          <div class="metric-info">
            <div class="metric-label">总收益</div>
            <div class="metric-value">{{ formatCurrency(result.totalInterest) }}</div>
          </div>
        </div>
        
        <div class="metric-card gradient-info">
          <div class="metric-icon">💎</div>
          <div class="metric-info">
            <div class="metric-label">总资产</div>
            <div class="metric-value">{{ formatCurrency(result.totalFuture) }}</div>
          </div>
        </div>
        
        <div class="metric-card gradient-warning">
          <div class="metric-icon">📊</div>
          <div class="metric-info">
            <div class="metric-label">收益率</div>
            <div class="metric-value">{{ result.interestRatio }}%</div>
          </div>
        </div>
      </div>
      
      <!-- 资产增长曲线 -->
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">资产增长曲线</span>
          <div>
            <el-tag>复利的力量</el-tag>
            <el-button type="primary" text @click="handleExportChart">
              <el-icon><Picture /></el-icon>
              保存图表
            </el-button>
          </div>
        </div>
        <div ref="growthChartRef" class="chart-container"></div>
      </div>
      
      <!-- 年度明细表 -->
      <div class="finance-card table-card">
        <div class="card-header">
          <span class="card-title">年度明细</span>
          <div>
            <el-button text @click="showTable = !showTable">
              {{ showTable ? '收起' : '展开' }}
              <el-icon><component :is="showTable ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
            </el-button>
            <el-button type="primary" text @click="handleExportExcel" v-if="showTable">
              <el-icon><Document /></el-icon>
              导出 Excel
            </el-button>
          </div>
        </div>
        
        <el-table v-show="showTable" :data="result.yearlyData" stripe>
          <el-table-column prop="year" label="年份" width="80" align="center">
            <template #default="{ row }">
              第{{ row.year }}年
            </template>
          </el-table-column>
          <el-table-column prop="totalAssets" label="总资产" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.totalAssets) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalContribution" label="总投入" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.totalContribution) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalInterest" label="总收益" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.totalInterest) }}
            </template>
          </el-table-column>
          <el-table-column label="收益率" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getInterestRateTag(row)">
                {{ ((row.totalInterest / row.totalContribution) * 100).toFixed(1) }}%
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <!-- 财务自由目标计算 -->
    <div class="finance-card goals-card">
      <div class="card-header">
        <span class="card-title">财务自由三阶段</span>
        <el-tag type="success">基于当前参数</el-tag>
      </div>
      
      <div class="goals-grid">
        <div class="goal-item">
          <div class="goal-icon">🛡️</div>
          <div class="goal-title">财务保障</div>
          <div class="goal-amount">{{ formatCurrency(financialGoals.guarantee) }}</div>
          <div class="goal-time" v-if="goalsTime.security">
            <el-icon><Timer /></el-icon>
            {{ goalsTime.security.years }}年{{ goalsTime.security.months }}个月
          </div>
          <div class="goal-status" v-if="goalsTime.security">
            <el-tag :type="goalsTime.security.totalMonths <= 3 ? 'success' : 'info'">
              {{ goalsTime.security.totalMonths <= 3 ? '快速达成' : '稳步前进' }}
            </el-tag>
          </div>
        </div>

        <div class="goal-item">
          <div class="goal-icon">🔒</div>
          <div class="goal-title">财务安全</div>
          <div class="goal-amount">{{ formatCurrency(financialGoals.safety) }}</div>
          <div class="goal-time" v-if="goalsTime.safety">
            <el-icon><Timer /></el-icon>
            {{ goalsTime.safety.years }}年{{ goalsTime.safety.months }}个月
          </div>
          <div class="goal-status" v-if="goalsTime.safety">
            <el-tag :type="goalsTime.safety.years <= 5 ? 'success' : 'info'">
              {{ goalsTime.safety.years <= 5 ? '快速达成' : '稳步前进' }}
            </el-tag>
          </div>
        </div>

        <div class="goal-item">
          <div class="goal-icon">🚀</div>
          <div class="goal-title">财务自由</div>
          <div class="goal-amount">{{ formatCurrency(financialGoals.freedom) }}</div>
          <div class="goal-time" v-if="goalsTime.freedom">
            <el-icon><Timer /></el-icon>
            {{ goalsTime.freedom.years }}年{{ goalsTime.freedom.months }}个月
          </div>
          <div class="goal-status" v-if="goalsTime.freedom">
            <el-tag :type="goalsTime.freedom.years <= 10 ? 'success' : 'info'">
              {{ goalsTime.freedom.years <= 10 ? '快速达成' : '稳步前进' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { TrendCharts, Timer, ArrowUp, ArrowDown, FolderOpened, Download, Picture, Document, DocumentCopy } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { financialGoals } from '../stores/financialGoals'
import { saveScenario, loadScenario, getScenarios, deleteScenario, autoSaveScene, loadAutoSaveScene, clearAutoSaveScene } from '../utils/localStorage'
import { exportToPDF, exportChartToImage, exportToExcel, prepareYearlyDataForExcel } from '../utils/export'
import { getCalculatorChartConfig } from '../utils/chart-optimizer'
import { ElMessage } from 'element-plus'
import HelpTooltip from '../components/HelpTooltip.vue'
import { calculatorTutorial } from '../utils/tutorial-content'

// ==================== 复利计算器核心算法 ====================

interface YearlyData {
  year: number
  totalAssets: number
  totalContribution: number
  totalInterest: number
}

interface CalculatorResult {
  totalFuture: number
  totalContribution: number
  totalInterest: number
  interestRatio: string
  yearlyData: YearlyData[]
}

interface TimeResult {
  years: number
  months: number
  totalMonths: number
  finalAmount: number
}

/**
 * 复利计算器
 */
function calculateCompoundInterest(
  principal: number,
  monthlyContribution: number,
  years: number,
  annualRate: number
): CalculatorResult {
  const monthlyRate = annualRate / 12
  const months = years * 12
  
  let totalFuture: number, principalFuture: number, contributionFuture: number
  
  // 处理收益率为0的特殊情况
  if (annualRate === 0) {
    principalFuture = principal
    contributionFuture = monthlyContribution * months
    totalFuture = principalFuture + contributionFuture
  } else {
    // 本金的复利
    principalFuture = principal * Math.pow(1 + monthlyRate, months)
    
    // 每月定投的复利（年金终值公式）
    contributionFuture = monthlyContribution * 
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    
    totalFuture = principalFuture + contributionFuture
  }
  
  const totalContribution = principal + (monthlyContribution * months)
  const totalInterest = totalFuture - totalContribution
  
  // 计算每年的资产增长（用于可视化）
  const yearlyData: YearlyData[] = []
  for (let year = 1; year <= years; year++) {
    const yearMonths = year * 12
    let yearTotal: number
    
    if (annualRate === 0) {
      yearTotal = principal + (monthlyContribution * yearMonths)
    } else {
      const yearPrincipalFuture = principal * Math.pow(1 + monthlyRate, yearMonths)
      const yearContributionFuture = monthlyContribution * 
        ((Math.pow(1 + monthlyRate, yearMonths) - 1) / monthlyRate)
      yearTotal = yearPrincipalFuture + yearContributionFuture
    }
    
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

/**
 * 计算达成目标所需的时间
 */
function calculateTimeToTarget(
  targetAmount: number,
  principal: number,
  monthlyContribution: number,
  annualRate: number
): TimeResult {
  const monthlyRate = annualRate / 12
  let months = 0
  let currentAmount = principal
  
  // 逐月计算，直到达到目标
  while (currentAmount < targetAmount && months < 1200) { // 最多100年
    months++
    currentAmount = currentAmount * (1 + monthlyRate) + monthlyContribution
  }
  
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    totalMonths: months,
    finalAmount: Math.round(currentAmount)
  }
}

// ==================== Vue 组件逻辑 ====================

const calculatorForm = ref({
  principal: 900000,  // 用户当前投资资产
  monthlyContribution: 20000,
  years: 10,
  annualRate: 8
})

const result = ref<CalculatorResult | null>(null)
const showTable = ref(false)
const growthChartRef = ref<HTMLElement>()

const goalsTime = ref<{
  security: TimeResult | null
  safety: TimeResult | null
  freedom: TimeResult | null
}>({
  security: null,
  safety: null,
  freedom: null
})

const rateMarks = {
  0: '0%',
  5: '5%',
  8: '8%',
  10: '10%',
  15: '15%',
  20: '20%'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const getInterestRateTag = (row: YearlyData) => {
  const rate = (row.totalInterest / row.totalContribution) * 100
  if (rate >= 50) return 'success'
  if (rate >= 30) return 'warning'
  return 'info'
}

const handleCalculate = () => {
  // 计算复利结果
  result.value = calculateCompoundInterest(
    calculatorForm.value.principal,
    calculatorForm.value.monthlyContribution,
    calculatorForm.value.years,
    calculatorForm.value.annualRate / 100 // 转换为小数
  )
  
  // 计算财务自由三阶段时间
  const rate = calculatorForm.value.annualRate / 100
  
  if (calculatorForm.value.monthlyContribution > 0) {
    goalsTime.value.security = calculateTimeToTarget(
      financialGoals.guarantee,
      calculatorForm.value.principal,
      calculatorForm.value.monthlyContribution,
      0 // 财务保障通常用无风险收益
    )

    goalsTime.value.safety = calculateTimeToTarget(
      financialGoals.safety,
      calculatorForm.value.principal,
      calculatorForm.value.monthlyContribution,
      rate
    )

    goalsTime.value.freedom = calculateTimeToTarget(
      financialGoals.freedom,
      calculatorForm.value.principal,
      calculatorForm.value.monthlyContribution,
      rate
    )
  }
  
  // 初始化图表
  setTimeout(() => {
    initGrowthChart()
  }, 100)
}

const handleReset = () => {
  calculatorForm.value = {
    principal: 900000,  // 用户当前投资资产
    monthlyContribution: 20000,
    years: 10,
    annualRate: 8
  }
  result.value = null
  goalsTime.value = {
    security: null,
    safety: null,
    freedom: null
  }
}

// 加载示例数据
const loadExampleData = () => {
  calculatorForm.value = {
    principal: calculatorTutorial.exampleData.principal,
    monthlyContribution: calculatorTutorial.exampleData.monthlyContribution,
    years: calculatorTutorial.exampleData.years,
    annualRate: calculatorTutorial.exampleData.annualRate
  }
  result.value = null
  goalsTime.value = {
    security: null,
    safety: null,
    freedom: null
  }
  ElMessage.success('示例数据加载成功，点击"计算"查看结果')
}

// ==================== 场景管理 ====================

const currentScenarioName = ref('')
const showScenarioDialog = ref(false)
const scenarios = ref<Record<string, any>>({})

// 加载场景列表
const loadScenariosList = () => {
  scenarios.value = getScenarios('calculator')
}

// 保存当前场景
const handleSaveScenario = (scenarioName: string) => {
  if (!scenarioName.trim()) {
    ElMessage.error('场景名称不能为空')
    return
  }

  const success = saveScenario('calculator', scenarioName, {
    principal: calculatorForm.value.principal,
    monthlyContribution: calculatorForm.value.monthlyContribution,
    years: calculatorForm.value.years,
    annualRate: calculatorForm.value.annualRate
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
  const data = loadScenario('calculator', scenarioName)

  if (data) {
    calculatorForm.value = {
      principal: data.principal,
      monthlyContribution: data.monthlyContribution,
      years: data.years,
      annualRate: data.annualRate
    }
    currentScenarioName.value = scenarioName
    result.value = null
    goalsTime.value = {
      security: null,
      safety: null,
      freedom: null
    }
    ElMessage.success(`场景 "${scenarioName}" 加载成功`)
  } else {
    ElMessage.error('加载失败，请重试')
  }
}

// 删除场景
const handleDeleteScenario = (scenarioName: string) => {
  const success = deleteScenario('calculator', scenarioName)

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
watch(calculatorForm, (newForm) => {
  autoSaveScene('calculator', newForm)
}, { deep: true })

// 组件挂载时加载自动保存的数据
onMounted(() => {
  const autoSaveData = loadAutoSaveScene('calculator')
  if (autoSaveData) {
    calculatorForm.value = {
      principal: autoSaveData.principal,
      monthlyContribution: autoSaveData.monthlyContribution,
      years: autoSaveData.years,
      annualRate: autoSaveData.annualRate
    }
  }

  // 加载场景列表
  loadScenariosList()
})

// 组件卸载时清除自动保存的数据
onUnmounted(() => {
  clearAutoSaveScene('calculator')
})

// ==================== 导出功能 ====================

const growthChartInstance = ref<any>(null)

// 导出 PDF
const handleExportPDF = () => {
  exportToPDF('复利计算器')
}

// 导出图表
const handleExportChart = () => {
  if (!growthChartInstance.value) {
    ElMessage.error('图表未初始化')
    return
  }
  exportChartToImage(growthChartInstance.value, '复利计算器_资产增长曲线')
}

// 导出 Excel
const handleExportExcel = () => {
  if (!result.value) {
    ElMessage.error('请先计算')
    return
  }

  const data = prepareYearlyDataForExcel(result.value.yearlyData)
  exportToExcel(data, '复利计算器_年度明细', '年度明细')
}

const initGrowthChart = () => {
  if (!growthChartRef.value || !result.value) return

  const chart = echarts.init(growthChartRef.value)

  const years = result.value.yearlyData.map(d => `第${d.year}年`)
  const assetsData = result.value.yearlyData.map(d => d.totalAssets)
  const contributionData = result.value.yearlyData.map(d => d.totalContribution)
  const interestData = result.value.yearlyData.map(d => d.totalInterest)

  // 使用优化后的图表配置
  chart.setOption(getCalculatorChartConfig(years, assetsData, contributionData, interestData))

  // 保存图表实例
  growthChartInstance.value = chart
}

onMounted(() => {
  // 自动执行一次计算
  handleCalculate()
})
</script>

<style lang="scss" scoped>
.calculator {
  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;

    // 响应式字体大小
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
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;

      // 响应式网格
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

        // 响应式图表高度
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

  .goals-card {
    margin-top: 24px;

    @media (max-width: 575px) {
      margin-top: 20px;
    }

    .goals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 20px;

      // 响应式网格
      @media (max-width: 575px) {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 16px;
      }

      @media (min-width: 576px) and (max-width: 767px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
    }

    .goal-item {
      background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid #e4e7ed;

      @media (max-width: 575px) {
        padding: 16px;
      }

      .goal-icon {
        font-size: 48px;
        margin-bottom: 12px;

        @media (max-width: 575px) {
          font-size: 40px;
          margin-bottom: 10px;
        }
      }

      .goal-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;

        @media (max-width: 575px) {
          font-size: 14px;
          margin-bottom: 6px;
        }
      }

      .goal-amount {
        font-size: 24px;
        font-weight: 700;
        color: #409eff;
        margin-bottom: 12px;

        @media (max-width: 575px) {
          font-size: 20px;
          margin-bottom: 10px;
        }

        @media (min-width: 576px) and (max-width: 767px) {
          font-size: 22px;
        }
      }

      .goal-time {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 16px;
        color: #67c23a;
        font-weight: 600;
        margin-bottom: 12px;

        @media (max-width: 575px) {
          font-size: 14px;
          margin-bottom: 10px;
          flex-direction: column;
          gap: 4px;
        }
      }

      .goal-status {
        margin-top: 8px;

        @media (max-width: 575px) {
          margin-top: 6px;
        }
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

// 场景管理样式
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
