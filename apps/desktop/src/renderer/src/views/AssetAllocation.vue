<template>
  <div class="asset-allocation">
    <h1 class="page-title">{{ t('assetAllocation.title') }}</h1>

    <!-- 财务阶段选择器 -->
    <div class="finance-card stage-selector">
      <div class="card-header">
        <span class="card-title">{{ t('assetAllocation.financialStage') }}</span>
        <HelpTooltip :content="t('assetAllocation.dragSlider')" />
      </div>
      <el-radio-group v-model="selectedStage" @change="onStageChange" class="stage-radio-group">
        <el-radio-button value="guarantee">
          <span class="stage-name">{{ t('assetAllocation.stageGuarantee') }}</span>
          <el-tag v-if="currentStage === 'guarantee'" type="success" size="small">{{ t('assetAllocation.currentStage') }}</el-tag>
          <span class="stage-desc">{{ stageConfigs.guarantee.description }}</span>
        </el-radio-button>
        <el-radio-button value="safety">
          <span class="stage-name">{{ t('assetAllocation.stageSecurity') }}</span>
          <el-tag v-if="currentStage === 'safety'" type="warning" size="small">{{ t('assetAllocation.recommended') }}</el-tag>
          <span class="stage-desc">{{ stageConfigs.safety.description }}</span>
        </el-radio-button>
        <el-radio-button value="freedom">
          <span class="stage-name">{{ t('assetAllocation.stageFreedom') }}</span>
          <el-tag v-if="currentStage === 'freedom'" type="info" size="small">{{ t('assetAllocation.futureGoal') }}</el-tag>
          <span class="stage-desc">{{ stageConfigs.freedom.description }}</span>
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 资产配置饼图 -->
    <div class="allocation-grid">
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('assetAllocation.pieChartTitle') }}</span>
          <HelpTooltip :content="t('assetAllocation.dragSlider')" />
        </div>
        <div ref="pieChartRef" class="chart-container"></div>

        <!-- 交互式滑块 -->
        <div class="allocation-sliders">
          <div class="slider-item">
            <div class="slider-header">
              <span class="label">{{ t('assetAllocation.lowRisk') }}</span>
              <span class="percentage">{{ allocation.low }}%</span>
              <span class="amount">¥{{ formatAmount(allocation.low * totalAssets / 100) }}</span>
            </div>
            <el-slider
              v-model="allocation.low"
              :min="0"
              :max="100"
              @input="onAllocationChange"
              color="#67c23a"
              :show-tooltip="false"
            />
          </div>

          <div class="slider-item">
            <div class="slider-header">
              <span class="label">{{ t('assetAllocation.mediumRisk') }}</span>
              <span class="percentage">{{ allocation.medium }}%</span>
              <span class="amount">¥{{ formatAmount(allocation.medium * totalAssets / 100) }}</span>
            </div>
            <el-slider
              v-model="allocation.medium"
              :min="0"
              :max="100"
              @input="onAllocationChange"
              color="#e6a23c"
              :show-tooltip="false"
            />
          </div>

          <div class="slider-item">
            <div class="slider-header">
              <span class="label">{{ t('assetAllocation.highRisk') }}</span>
              <span class="percentage">{{ allocation.high }}%</span>
              <span class="amount">¥{{ formatAmount(allocation.high * totalAssets / 100) }}</span>
            </div>
            <el-slider
              v-model="allocation.high"
              :min="0"
              :max="100"
              @input="onAllocationChange"
              color="#f56c6c"
              :show-tooltip="false"
            />
          </div>

          <!-- 总比例提示 -->
          <div class="total-allocation" :class="{ 'valid': totalPercentage === 100 }">
            {{ t('assetAllocation.totalRatio') }}: {{ totalPercentage }}%
            <span v-if="totalPercentage !== 100" class="error-msg">
              {{ t('assetAllocation.mustEqual100') }}
            </span>
          </div>
        </div>
      </div>

      <!-- 风险-收益雷达图 -->
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">{{ t('assetAllocation.riskReturnTitle') }}</span>
          <HelpTooltip :content="t('assetAllocation.dragSlider')" />
        </div>
        <div ref="radarChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 配置详情表格 -->
    <div class="finance-card">
      <div class="card-header">
        <span class="card-title">{{ t('assetAllocation.configDetailsTitle') }}</span>
      </div>
      <el-table :data="assetTypes" border stripe>
        <el-table-column prop="name" :label="t('assetAllocation.assetType')" width="120" />
        <el-table-column prop="currentPercent" :label="t('assetAllocation.currentPercent')" width="100">
          <template #default="scope">
            <span :class="{ 'diff': scope.row.currentPercent !== scope.row.recommendedPercent }">
              {{ scope.row.currentPercent }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="recommendedPercent" :label="t('assetAllocation.recommendedPercent')" width="100">
          <template #default="scope">
            <el-tag type="primary" size="small">{{ scope.row.recommendedPercent }}%</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" :label="t('assetAllocation.riskLevel')" width="120">
          <template #default="scope">
            <span :class="'risk-' + scope.row.riskLevel">
              {{ '★'.repeat(scope.row.stars) + '☆'.repeat(5 - scope.row.stars) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="expectedReturn" :label="t('assetAllocation.expectedReturn')" width="120" />
        <el-table-column prop="examples" :label="t('assetAllocation.investmentTarget')" />
      </el-table>
    </div>

    <!-- 收益预测曲线 -->
    <div class="finance-card chart-card">
      <div class="card-header">
        <span class="card-title">{{ t('assetAllocation.revenueForecast') }}</span>
        <HelpTooltip :content="t('assetAllocation.dragSlider')" />
      </div>
      <div class="year-selector">
        <el-radio-group v-model="selectedYears" @change="onYearsChange">
          <el-radio-button :value="5">5{{ t('assetAllocation.yearsSuffix') }}</el-radio-button>
          <el-radio-button :value="10">10{{ t('assetAllocation.yearsSuffix') }}</el-radio-button>
          <el-radio-button :value="20">20{{ t('assetAllocation.yearsSuffix') }}</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="growthChartRef" class="chart-container"></div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button
        type="primary"
        size="large"
        @click="applyRecommendedAllocation"
        :disabled="isAllocationMatchRecommended"
      >
        <el-icon><Check /></el-icon>
        {{ t('assetAllocation.applyRecommended') }}
      </el-button>

      <el-button size="large" @click="exportReport">
        <el-icon><Download /></el-icon>
        {{ t('assetAllocation.exportReport') }}
      </el-button>

      <el-button size="large" @click="saveConfiguration">
        <el-icon><Folder /></el-icon>
        {{ t('assetAllocation.saveConfiguration') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Download, Folder } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import HelpTooltip from '@/components/HelpTooltip.vue'
import { exportToPDF, exportChartToImage, exportMultipleChartsToImage } from '@/utils/export'
import useI18n from '../i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { safeCall } = useErrorHandler()

const { t } = useI18n()

// 财务阶段配置
const stageConfigs = {
  guarantee: {
    name: t('assetAllocation.stageGuarantee'),
    description: t('assetAllocation.guaranteeDesc'),
    allocation: {
      low: 100,
      medium: 0,
      high: 0
    },
    targetAmount: t('assetAllocation.guaranteeDesc'),
    riskLevel: '★☆☆☆☆'
  },
  safety: {
    name: t('assetAllocation.stageSecurity'),
    description: t('assetAllocation.securityDesc'),
    allocation: {
      low: 40,
      medium: 40,
      high: 20
    },
    targetAmount: t('assetAllocation.securityDesc'),
    riskLevel: '★★★☆☆'
  },
  freedom: {
    name: t('assetAllocation.stageFreedom'),
    description: t('assetAllocation.freedomDesc'),
    allocation: {
      low: 0,
      medium: 50,
      high: 50
    },
    targetAmount: t('assetAllocation.freedomDesc'),
    riskLevel: '★★★★☆'
  }
}

// 状态
const selectedStage = ref('safety')
const selectedYears = ref(10)
const totalAssets = ref(900000)
const allocation = ref({
  low: 40,
  medium: 40,
  high: 20
})

// 图表实例
const pieChartRef = ref()
const radarChartRef = ref()
const growthChartRef = ref()
let pieChartInstance: echarts.ECharts | null = null
let radarChartInstance: echarts.ECharts | null = null
let growthChartInstance: echarts.ECharts | null = null

// 计算属性
const totalPercentage = computed(() =>
  allocation.value.low + allocation.value.medium + allocation.value.high
)

const recommendedAllocation = computed(() =>
  stageConfigs[selectedStage.value].allocation
)

const currentStage = computed(() => {
  if (totalAssets.value < 60000) return 'guarantee'
  if (totalAssets.value < 1500000) return 'safety'
  return 'freedom'
})

const isAllocationMatchRecommended = computed(() => {
  const recommended = stageConfigs[selectedStage.value].allocation
  return allocation.value.low === recommended.low &&
         allocation.value.medium === recommended.medium &&
         allocation.value.high === recommended.high
})

// 资产类型表格数据
const assetTypes = ref([
  {
    name: '低风险',
    currentPercent: allocation.value.low,
    recommendedPercent: stageConfigs[selectedStage.value].allocation.low,
    stars: 1,
    riskLevel: 'low',
    expectedReturn: '2%~4%',
    examples: '货币基金、债券基金、定期存款'
  },
  {
    name: '中风险',
    currentPercent: allocation.value.medium,
    recommendedPercent: stageConfigs[selectedStage.value].allocation.medium,
    stars: 3,
    riskLevel: 'medium',
    expectedReturn: '6%~10%',
    examples: '指数基金、混合基金、蓝筹股'
  },
  {
    name: '高风险',
    currentPercent: allocation.value.high,
    recommendedPercent: stageConfigs[selectedStage.value].allocation.high,
    stars: 5,
    riskLevel: 'high',
    expectedReturn: '10%~20%+',
    examples: '成长股、行业基金、新兴市场'
  }
])

// 方法
const formatAmount = (amount: number) => {
  return Math.round(amount).toLocaleString()
}

const onStageChange = () => {
  allocation.value = { ...stageConfigs[selectedStage.value].allocation }
  updateAssetTypes()
  updateCharts()
}

const onAllocationChange = () => {
  updateAssetTypes()
  updateCharts()
}

const onYearsChange = () => {
  updateGrowthChart()
}

const updateAssetTypes = () => {
  assetTypes.value = [
    {
      name: t('assetAllocation.lowRisk'),
      currentPercent: allocation.value.low,
      recommendedPercent: stageConfigs[selectedStage.value].allocation.low,
      stars: 1,
      riskLevel: 'low',
      expectedReturn: '2%~4%',
      examples: '货币基金、债券基金、定期存款'
    },
    {
      name: t('assetAllocation.mediumRisk'),
      currentPercent: allocation.value.medium,
      recommendedPercent: stageConfigs[selectedStage.value].allocation.medium,
      stars: 3,
      riskLevel: 'medium',
      expectedReturn: '6%~10%',
      examples: '指数基金、混合基金、蓝筹股'
    },
    {
      name: t('assetAllocation.highRisk'),
      currentPercent: allocation.value.high,
      recommendedPercent: stageConfigs[selectedStage.value].allocation.high,
      stars: 5,
      riskLevel: 'high',
      expectedReturn: '10%~20%+',
      examples: '成长股、行业基金、新兴市场'
    }
  ]
}

const initPieChart = () => {
  if (!pieChartRef.value) return

  pieChartInstance = echarts.init(pieChartRef.value)
  updatePieChart()
}

const updatePieChart = () => {
  if (!pieChartInstance) return

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const amount = formatAmount(params.value * totalAssets.value / 100)
        return `${params.name}: ${params.value}% (${params.percent}%)<br/>${t('assetAllocation.assetsAmount')}: ¥${amount}`
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: [t('assetAllocation.lowRisk'), t('assetAllocation.mediumRisk'), t('assetAllocation.highRisk')]
    },
    series: [
      {
        name: t('assetAllocation.title'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        data: [
          {
            name: t('assetAllocation.lowRisk'),
            value: allocation.value.low,
            itemStyle: { color: '#67c23a' }
          },
          {
            name: t('assetAllocation.mediumRisk'),
            value: allocation.value.medium,
            itemStyle: { color: '#e6a23c' }
          },
          {
            name: t('assetAllocation.highRisk'),
            value: allocation.value.high,
            itemStyle: { color: '#f56c6c' }
          }
        ]
      }
    ]
  }
  pieChartInstance.setOption(option)
}

const calculateMetrics = (alloc: { low: number, medium: number, high: number }) => {
  const safety = alloc.low * 1.0 + alloc.medium * 0.6 + alloc.high * 0.2
  const returnRate = alloc.low * 0.3 + alloc.medium * 0.8 + alloc.high * 1.0
  const liquidity = alloc.low * 1.0 + alloc.medium * 0.7 + alloc.high * 0.4
  const volatility = alloc.low * 0.2 + alloc.medium * 0.6 + alloc.high * 1.0
  const dispersion = 100 - Math.abs(alloc.low - 33.3) - Math.abs(alloc.medium - 33.3) - Math.abs(alloc.high - 33.3)
  return [safety, returnRate, liquidity, volatility, dispersion]
}

const initRadarChart = () => {
  if (!radarChartRef.value) return

  radarChartInstance = echarts.init(radarChartRef.value)
  updateRadarChart()
}

const updateRadarChart = () => {
  if (!radarChartInstance) return

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: [t('assetAllocation.currentConfig'), t('assetAllocation.recommendedConfig')],
      bottom: 0
    },
    radar: {
      indicator: [
        { name: t('assetAllocation.safety'), max: 100 },
        { name: t('assetAllocation.returnRate'), max: 100 },
        { name: t('assetAllocation.liquidity'), max: 100 },
        { name: t('assetAllocation.volatility'), max: 100 },
        { name: t('assetAllocation.dispersion'), max: 100 }
      ]
    },
    series: [
      {
        name: '配置对比',
        type: 'radar',
        data: [
          {
            value: calculateMetrics(allocation.value),
            name: t('assetAllocation.currentConfig'),
            areaStyle: { color: 'rgba(103, 194, 58, 0.3)' },
            lineStyle: { color: '#67c23a' }
          },
          {
            value: calculateMetrics(recommendedAllocation.value),
            name: t('assetAllocation.recommendedConfig'),
            areaStyle: { color: 'rgba(64, 158, 255, 0.3)' },
            lineStyle: { color: '#409eff' }
          }
        ]
      }
    ]
  }
  radarChartInstance.setOption(option)
}

const calculateFutureGrowth = (years: number) => {
  const scenarios = {
    optimistic: { low: 0.04, medium: 0.12, high: 0.25 },
    expected: { low: 0.03, medium: 0.08, high: 0.15 },
    pessimistic: { low: 0.02, medium: 0.04, high: 0.05 }
  }

  const result: { year: number, optimistic: number, expected: number, pessimistic: number }[] = []
  let currentAssets = totalAssets.value

  for (let y = 1; y <= years; y++) {
    const yearlyReturn =
      (currentAssets * allocation.value.low / 100) * scenarios.expected.low +
      (currentAssets * allocation.value.medium / 100) * scenarios.expected.medium +
      (currentAssets * allocation.value.high / 100) * scenarios.expected.high

    currentAssets += yearlyReturn

    result.push({
      year: y,
      optimistic: currentAssets * 1.5,
      expected: currentAssets,
      pessimistic: currentAssets * 0.7
    })
  }

  return result
}

const initGrowthChart = () => {
  if (!growthChartRef.value) return

  growthChartInstance = echarts.init(growthChartRef.value)
  updateGrowthChart()
}

const updateGrowthChart = () => {
  if (!growthChartInstance) return

  const years = selectedYears.value
  const data = calculateFutureGrowth(years)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: [t('assetAllocation.optimistic'), t('assetAllocation.expected'), t('assetAllocation.pessimistic')],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: data.map(d => `${d.year}${t('assetAllocation.yearsLater')}`)
    },
    yAxis: {
      type: 'value',
      name: t('assetAllocation.assetsAmount'),
      axisLabel: {
        formatter: (value: number) => (value / 10000).toFixed(0) + '万'
      }
    },
    series: [
      {
        name: t('assetAllocation.optimistic'),
        type: 'line',
        data: data.map(d => d.optimistic),
        lineStyle: { color: '#67c23a', type: 'dashed' },
        areaStyle: { color: 'rgba(103, 194, 58, 0.1)' }
      },
      {
        name: t('assetAllocation.expected'),
        type: 'line',
        data: data.map(d => d.expected),
        lineStyle: { color: '#409eff', width: 3 },
        areaStyle: { color: 'rgba(64, 158, 255, 0.2)' }
      },
      {
        name: t('assetAllocation.pessimistic'),
        type: 'line',
        data: data.map(d => d.pessimistic),
        lineStyle: { color: '#f56c6c', type: 'dashed' },
        areaStyle: { color: 'rgba(245, 108, 108, 0.1)' }
      }
    ]
  }
  growthChartInstance.setOption(option)
}

const updateCharts = () => {
  updatePieChart()
  updateRadarChart()
  updateGrowthChart()
}

const applyRecommendedAllocation = () => {
  allocation.value = { ...stageConfigs[selectedStage.value].allocation }
  updateAssetTypes()
  updateCharts()
  ElMessage.success(t('assetAllocation.appliedRecommended'))
}

const exportReport = async () => {
  await safeCall(async () => {
    ElMessage.info(t('assetAllocation.generatingReport'))

    // 确保所有图表都已完全渲染
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 收集需要导出的图表
    const chartsToExport = []

    if (pieChartInstance) {
      chartsToExport.push({
        instance: pieChartInstance,
        filename: '资产配置饼图'
      })
    } else {
      console.error('❌ 饼图实例未初始化')
    }

    if (radarChartInstance) {
      chartsToExport.push({
        instance: radarChartInstance,
        filename: '风险收益评估雷达图'
      })
    } else {
      console.error('❌ 雷达图实例未初始化')
    }

    if (growthChartInstance) {
      // 强制更新增长曲线图表
      updateGrowthChart()

      // 强制图表重新渲染
      try {
        growthChartInstance.resize()
      } catch (e) {
        console.error('强制渲染失败:', e)
      }

      // 等待图表完全渲染（增加延迟时间）
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 再次强制刷新并等待
      growthChartInstance.resize()
      await new Promise(resolve => setTimeout(resolve, 500))

      chartsToExport.push({
        instance: growthChartInstance,
        filename: `收益预测曲线${selectedYears.value}年`
      })
    } else {
      console.error('❌ 增长曲线实例未初始化，跳过导出')
    }

    // 导出所有图表
    if (chartsToExport.length > 0) {
      await exportMultipleChartsToImage(chartsToExport)
    }

    // 导出 PDF
    const stageName = stageConfigs[selectedStage.value].name
    await exportToPDF(`资产配置报告_${stageName}`)

    ElMessage.success(t('assetAllocation.exportSuccess'))
  })
}

const saveConfiguration = () => {
  localStorage.setItem('asset-allocation', JSON.stringify({
    stage: selectedStage.value,
    allocation: allocation.value,
    savedAt: new Date().toISOString()
  }))
  ElMessage.success(t('assetAllocation.configSaved'))
}

// 监听窗口大小变化，调整图表
const handleResize = () => {
  pieChartInstance?.resize()
  radarChartInstance?.resize()
  growthChartInstance?.resize()
}

// 初始化
onMounted(() => {
  // 加载保存的配置
  const savedConfig = localStorage.getItem('asset-allocation')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      selectedStage.value = config.stage || 'safety'
      allocation.value = config.allocation || allocation.value
    } catch (e) {
      console.error('Failed to load saved config:', e)
    }
  } else {
    // 自动判断当前阶段
    selectedStage.value = currentStage.value
    allocation.value = { ...stageConfigs[selectedStage.value].allocation }
  }

  updateAssetTypes()

  // 初始化图表
  initPieChart()
  initRadarChart()
  initGrowthChart()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChartInstance?.dispose()
  radarChartInstance?.dispose()
  growthChartInstance?.dispose()
})
</script>

<style scoped lang="scss">
.asset-allocation {
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;

  .page-title {
    margin: 0 0 20px 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    animation: slideDown 0.5s ease-out;
  }

  .finance-card {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        position: relative;

        &::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
          border-radius: 2px;
        }
      }
    }

    &.chart-card {
      .chart-container {
        height: 400px;
        margin-bottom: 20px;
        transition: height 0.3s ease;
      }
    }
  }

  .stage-selector {
    .stage-radio-group {
      display: flex;
      gap: 20px;

      :deep(.el-radio-button) {
        flex: 1;
        transition: all 0.3s ease;

        .el-radio-button__inner {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 16px;
          height: auto;
          line-height: 1.5;
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.02);
          }

          .stage-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .stage-desc {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 4px;
          }
        }

        &.is-active {
          .el-radio-button__inner {
            animation: pulse 0.3s ease-in-out;

            .stage-name {
              color: var(--bg-card);
            }

            .stage-desc {
              color: rgba(255, 255, 255, 0.85);
            }
          }
        }
      }
    }
  }

  .allocation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .allocation-sliders {
      .slider-item {
        margin-bottom: 20px;
        padding: 12px;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          background: var(--bg-body);
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .label {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
          }

          .percentage {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-color-primary);
            transition: color 0.3s ease;
          }

          .amount {
            font-size: 14px;
            color: var(--text-secondary);
          }
        }

        :deep(.el-slider) {
          .el-slider__runway {
            background: var(--border-color);
            transition: all 0.3s ease;
          }

          .el-slider__bar {
            transition: all 0.3s ease;
          }

          .el-slider__button {
            transition: all 0.3s ease;

            &:hover {
              transform: scale(1.2);
            }
          }
        }
      }

      .total-allocation {
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-color-danger);
        padding: 12px;
        background: #fef0f0;
        border-radius: 6px;
        transition: all 0.3s ease;

        &.valid {
          color: var(--el-color-success);
          background: var(--el-color-primary-light-9);
          animation: successPulse 0.5s ease-in-out;
        }

        .error-msg {
          font-size: 14px;
          font-weight: normal;
        }
      }
    }
  }

  :deep(.el-table) {
    .diff {
      color: var(--el-color-danger);
      font-weight: 600;
      animation: shake 0.5s ease-in-out;
    }

    .risk-low {
      color: var(--el-color-success);
    }

    .risk-medium {
      color: var(--el-color-warning);
    }

    .risk-high {
      color: var(--el-color-danger);
    }

    .el-table__row {
      transition: all 0.3s ease;

      &:hover {
        background: var(--bg-body);
      }
    }
  }

  .year-selector {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;

    :deep(.el-radio-button) {
      .el-radio-button__inner {
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 20px;

    .el-button {
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}

// 动画定义
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes successPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
}

// 响应式优化
@media (max-width: 1200px) {
  .asset-allocation {
    .finance-card {
      &.chart-card {
        .chart-container {
          height: 360px;
        }
      }
    }
  }
}

@media (max-width: 992px) {
  .asset-allocation {
    .finance-card {
      &.chart-card {
        .chart-container {
          height: 340px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .asset-allocation {
    padding: 16px;

    .page-title {
      font-size: 24px;
      margin-bottom: 16px;
    }

    .finance-card {
      padding: 16px;
      margin-bottom: 16px;

      .card-header {
        .card-title {
          font-size: 16px;
        }
      }

      &.chart-card {
        .chart-container {
          height: 280px;
          margin-bottom: 16px;
        }
      }
    }

    .stage-selector {
      .stage-radio-group {
        gap: 12px;

        :deep(.el-radio-button) {
          .el-radio-button__inner {
            padding: 12px;

            .stage-name {
              font-size: 14px;
            }

            .stage-desc {
              font-size: 11px;
            }
          }
        }
      }
    }

    .allocation-grid {
      gap: 16px;

      .allocation-sliders {
        .slider-item {
          margin-bottom: 16px;
          padding: 8px;

          .slider-header {
            .label {
              font-size: 13px;
            }

            .percentage {
              font-size: 14px;
            }

            .amount {
              font-size: 12px;
            }
          }
        }

        .total-allocation {
          font-size: 14px;
          padding: 10px;
        }
      }
    }

    .year-selector {
      margin-bottom: 16px;

      :deep(.el-radio-button) {
        .el-radio-button__inner {
          padding: 8px 12px;
        }
      }
    }

    .action-buttons {
      margin-top: 16px;
      gap: 8px;

      .el-button {
        padding: 10px 16px;
      }
    }
  }
}

@media (max-width: 576px) {
  .asset-allocation {
    .page-title {
      font-size: 20px;
    }

    .finance-card {
      &.chart-card {
        .chart-container {
          height: 240px;
        }
      }
    }

    :deep(.el-table) {
      font-size: 12px;

      .el-table__header th {
        padding: 8px 0;
      }

      .el-table__body td {
        padding: 6px 0;
      }
    }

    .allocation-grid {
      .allocation-sliders {
        .slider-item {
          .slider-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      }
    }
  }
}
</style>
