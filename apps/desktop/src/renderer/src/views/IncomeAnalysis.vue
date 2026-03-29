<template>
  <div class="income-analysis">
    <h1 class="page-title">收入分析</h1>

    <!-- 分析时间范围选择 -->
    <div class="time-range-selector">
      <el-radio-group v-model="timeRange" @change="loadAnalysisData">
        <el-radio-button value="1m">近 1 个月</el-radio-button>
        <el-radio-button value="3m">近 3 个月</el-radio-button>
        <el-radio-button value="6m">近 6 个月</el-radio-button>
        <el-radio-button value="1y">近 1 年</el-radio-button>
      </el-radio-group>
      <el-button @click="loadAnalysisData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <!-- 核心指标概览 -->
    <div class="metric-cards">
      <div class="metric-card gradient-primary">
        <div class="metric-icon">💰</div>
        <div class="metric-info">
          <div class="metric-label">总收入</div>
          <div class="metric-value">{{ formatCurrency(analysis.totalIncome) }}</div>
          <div class="metric-change" :class="analysis.totalGrowthRate >= 0 ? 'positive' : 'negative'">
            {{ analysis.totalGrowthRate >= 0 ? '▲' : '▼' }} {{ Math.abs(analysis.totalGrowthRate) }}% 同比
          </div>
        </div>
      </div>

      <div class="metric-card gradient-success">
        <div class="metric-icon">🏃</div>
        <div class="metric-info">
          <div class="metric-label">主动收入</div>
          <div class="metric-value">{{ formatCurrency(analysis.activeIncome) }}</div>
          <div class="metric-change">{{ analysis.activePercentage }}%</div>
        </div>
      </div>

      <div class="metric-card gradient-warning">
        <div class="metric-icon">🌴</div>
        <div class="metric-info">
          <div class="metric-label">被动收入</div>
          <div class="metric-value">{{ formatCurrency(analysis.passiveIncome) }}</div>
          <div class="metric-change">{{ analysis.passivePercentage }}%</div>
        </div>
      </div>

      <div class="metric-card gradient-info">
        <div class="metric-icon">📈</div>
        <div class="metric-info">
          <div class="metric-label">月均收入</div>
          <div class="metric-value">{{ formatCurrency(analysis.avgMonthlyIncome) }}</div>
          <div class="metric-change">{{ analysis.months }} 个月平均</div>
        </div>
      </div>
    </div>

    <!-- 收入结构分析 -->
    <div class="charts-row">
      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">主动收入 vs 被动收入</span>
        </div>
        <div ref="incomeTypeChartRef" class="chart-container"></div>
      </div>

      <div class="finance-card chart-card">
        <div class="card-header">
          <span class="card-title">收入来源分布</span>
        </div>
        <div ref="incomeSourceChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 收入趋势分析 -->
    <div class="finance-card">
      <div class="card-header">
        <span class="card-title">收入趋势</span>
      </div>
      <div ref="incomeTrendChartRef" class="chart-container-large"></div>
    </div>

    <!-- 收入结构详情 -->
    <div class="section-title">收入结构详情</div>
    <div class="income-structure">
      <div class="structure-item">
        <div class="structure-header">
          <span class="structure-label">主动收入占比</span>
          <span class="structure-value">{{ analysis.activePercentage }}%</span>
        </div>
        <el-progress
          :percentage="analysis.activePercentage"
          color="#67C23A"
          :stroke-width="20"
        />
        <div class="structure-tip">
          主动收入需要持续投入时间和精力，建议逐步提高被动收入占比
        </div>
      </div>

      <div class="structure-item">
        <div class="structure-header">
          <span class="structure-label">被动收入占比</span>
          <span class="structure-value">{{ analysis.passivePercentage }}%</span>
        </div>
        <el-progress
          :percentage="analysis.passivePercentage"
          color="#E6A23C"
          :stroke-width="20"
        />
        <div class="structure-tip">
          被动收入是财务自由的关键，目标：50% → 100%
        </div>
      </div>

      <div class="structure-item">
        <div class="structure-header">
          <span class="structure-label">主要收入来源</span>
          <span class="structure-value">{{ analysis.mainSource || '-' }}</span>
        </div>
        <el-progress
          :percentage="analysis.sourceConcentration"
          :color="analysis.sourceConcentration > 70 ? '#F56C6C' : '#409EFF'"
          :stroke-width="20"
        />
        <div class="structure-tip" :class="analysis.sourceConcentration > 70 ? 'warning' : ''">
          {{ analysis.sourceConcentration > 70 ? '⚠️ 收入来源过于集中，建议分散收入来源' : '✅ 收入来源较为分散' }}
        </div>
      </div>

      <div class="structure-item">
        <div class="structure-header">
          <span class="structure-label">收入稳定性评分</span>
          <span class="structure-value">{{ analysis.stabilityRating }}/5</span>
        </div>
        <el-rate
          v-model="analysis.stabilityRating"
          disabled
          show-score
          text-color="#ff9900"
        />
        <div class="structure-tip">
          {{ getStabilityTip(analysis.stabilityRating) }}
        </div>
      </div>
    </div>

    <!-- 收入增长率分析 -->
    <div class="section-title">收入增长率分析</div>
    <div class="growth-analysis">
      <div v-for="item in analysis.growthRates" :key="item.type" class="growth-item">
        <div class="growth-header">
          <span class="growth-label">{{ item.label }}</span>
          <span class="growth-value" :class="item.rate >= 0 ? 'positive' : 'negative'">
            {{ item.rate >= 0 ? '▲' : '▼' }} {{ Math.abs(item.rate) }}%
          </span>
        </div>
        <div class="growth-detail">
          上期：{{ formatCurrency(item.previousAmount) }} → 本期：{{ formatCurrency(item.currentAmount) }}
        </div>
      </div>
    </div>

    <!-- 收入优化建议 -->
    <div class="section-title">收入优化建议</div>
    <div class="optimization-suggestions">
      <el-empty v-if="analysis.suggestions.length === 0" description="暂无优化建议，您的收入结构很健康！" />
      <el-card
        v-for="suggestion in analysis.suggestions"
        :key="suggestion.id"
        class="suggestion-card"
        :class="`priority-${suggestion.priority}`"
      >
        <template #header>
          <div class="suggestion-header">
            <div class="header-left">
              <el-tag :type="getPriorityTag(suggestion.priority)" size="small">
                {{ getPriorityLabel(suggestion.priority) }}
              </el-tag>
              <span class="suggestion-title">{{ suggestion.title }}</span>
            </div>
            <div class="header-right">
              <el-tag :type="getCategoryTag(suggestion.category)" size="small">
                {{ getCategoryLabel(suggestion.category) }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="suggestion-content">
          <div class="suggestion-description">{{ suggestion.description }}</div>

          <div class="suggestion-actions" v-if="suggestion.actions && suggestion.actions.length > 0">
            <div class="actions-title">建议行动：</div>
            <ul class="actions-list">
              <li v-for="(action, index) in suggestion.actions" :key="index">
                {{ action }}
              </li>
            </ul>
          </div>

          <div class="suggestion-footer">
            <el-button type="primary" size="small" @click="applySuggestion(suggestion)">
              <el-icon><Check /></el-icon>
              应用此建议
            </el-button>
            <el-button size="small" @click="dismissSuggestion(suggestion)">
              <el-icon><Close /></el-icon>
              暂不处理
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 高增长收入来源 -->
    <div v-if="analysis.highestGrowthSource" class="section-title">高增长收入来源</div>
    <div v-if="analysis.highestGrowthSource" class="growth-sources">
      <div class="growth-source-card">
        <div class="growth-source-icon">🚀</div>
        <div class="growth-source-info">
          <div class="growth-source-name">{{ analysis.highestGrowthSource.name }}</div>
          <div class="growth-source-rate positive">
            ▲ {{ analysis.highestGrowthSource.growthRate }}%
          </div>
          <div class="growth-source-amount">
            上期：{{ formatCurrency(analysis.highestGrowthSource.previousAmount) }} →
            本期：{{ formatCurrency(analysis.highestGrowthSource.currentAmount) }}
          </div>
        </div>
      </div>
      <div class="growth-source-tip">
        建议加大对该收入来源的投入，复制成功经验到其他领域
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Check, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useIncomeStore } from '@/stores/income'

const incomeStore = useIncomeStore()

// 分析时间范围
const timeRange = ref('6m')
const loading = ref(false)

// 分析数据
const analysis = ref<any>({
  totalIncome: 0,
  activeIncome: 0,
  passiveIncome: 0,
  avgMonthlyIncome: 0,
  activePercentage: 0,
  passivePercentage: 0,
  totalGrowthRate: 0,
  mainSource: '',
  sourceConcentration: 0,
  stabilityRating: 3,
  months: 6,
  growthRates: [],
  suggestions: [],
  highestGrowthSource: null
})

// 图表引用
const incomeTypeChartRef = ref<HTMLElement>()
const incomeSourceChartRef = ref<HTMLElement>()
const incomeTrendChartRef = ref<HTMLElement>()

// 图表实例
let incomeTypeChart: echarts.ECharts | null = null
let incomeSourceChart: echarts.ECharts | null = null
let incomeTrendChart: echarts.ECharts | null = null

// 格式化货币
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// 获取稳定性提示
const getStabilityTip = (rating: number): string => {
  const tips = {
    1: '⚠️ 收入极不稳定，建议建立应急基金，寻找稳定的收入来源',
    2: '⚠️ 收入不稳定，建议减少不稳定收入来源的依赖',
    3: 'ℹ️ 收入稳定性一般，建议逐步提高稳定性',
    4: '✅ 收入较为稳定，继续保持',
    5: '✅ 收入非常稳定，财务安全性高'
  }
  return tips[rating] || tips[3]
}

// 获取优先级标签
const getPriorityTag = (priority: string): string => {
  const tags = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return tags[priority] || 'info'
}

const getPriorityLabel = (priority: string): string => {
  const labels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return labels[priority] || '普通'
}

// 获取类别标签
const getCategoryTag = (category: string): string => {
  const tags = {
    passive_income: 'warning',
    diversification: 'info',
    growth: 'success',
    stability: 'danger'
  }
  return tags[category] || 'info'
}

const getCategoryLabel = (category: string): string => {
  const labels = {
    passive_income: '被动收入',
    diversification: '多元化',
    growth: '增长',
    stability: '稳定性'
  }
  return labels[category] || category
}

// 应用建议
const applySuggestion = (suggestion: any) => {
  ElMessage.success(`已应用建议：${suggestion.title}`)
  // 这里可以触发相应的操作，比如打开策略库、创建目标等
}

// 忽略建议
const dismissSuggestion = (suggestion: any) => {
  const index = analysis.value.suggestions.findIndex((s: any) => s.id === suggestion.id)
  if (index !== -1) {
    analysis.value.suggestions.splice(index, 1)
    ElMessage.info('已忽略此建议')
  }
}

// 加载分析数据
const loadAnalysisData = async () => {
  loading.value = true
  try {
    // 这里应该调用后端 API 获取分析数据
    // const response = await incomeStore.getAnalysis(timeRange.value)
    // analysis.value = response

    // 暂时使用模拟数据
    analysis.value = {
      totalIncome: 180000,
      activeIncome: 126000,
      passiveIncome: 54000,
      avgMonthlyIncome: 30000,
      activePercentage: 70,
      passivePercentage: 30,
      totalGrowthRate: 12.5,
      mainSource: '工资收入',
      sourceConcentration: 60,
      stabilityRating: 4,
      months: 6,
      growthRates: [
        { type: 'total', label: '总收入', previousAmount: 160000, currentAmount: 180000, rate: 12.5 },
        { type: 'active', label: '主动收入', previousAmount: 112000, currentAmount: 126000, rate: 12.5 },
        { type: 'passive', label: '被动收入', previousAmount: 48000, currentAmount: 54000, rate: 12.5 }
      ],
      suggestions: [
        {
          id: '1',
          priority: 'high',
          category: 'passive_income',
          title: '提升被动收入占比',
          description: '当前被动收入占比仅 30%，建议提升至 50% 以上',
          actions: [
            '优化投资组合，提高投资收益',
            '开发可重复销售的产品或课程',
            '寻找其他被动收入来源（租金、版税等）'
          ]
        },
        {
          id: '2',
          priority: 'medium',
          category: 'diversification',
          title: '分散收入来源',
          description: '当前工资收入占比高达 60%，建议降低对单一收入来源的依赖',
          actions: [
            '开发新的收入来源',
            '降低对单一收入来源的依赖',
            '建立多元化的收入结构'
          ]
        }
      ],
      highestGrowthSource: {
        name: '投资收益',
        growthRate: 25,
        previousAmount: 24000,
        currentAmount: 30000
      }
    }

    // 等待 DOM 更新后渲染图表
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('加载分析数据失败:', error)
    ElMessage.error('加载分析数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderCharts = () => {
  // 主动收入 vs 被动收入图表
  if (incomeTypeChartRef.value) {
    incomeTypeChart = echarts.init(incomeTypeChartRef.value)
    incomeTypeChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '收入类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          data: [
            { value: analysis.value.activeIncome, name: '主动收入', itemStyle: { color: '#67C23A' } },
            { value: analysis.value.passiveIncome, name: '被动收入', itemStyle: { color: '#E6A23C' } }
          ]
        }
      ]
    })
  }

  // 收入来源分布图表
  if (incomeSourceChartRef.value) {
    incomeSourceChart = echarts.init(incomeSourceChartRef.value)
    incomeSourceChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '收入来源',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 108000, name: '工资收入', itemStyle: { color: '#409EFF' } },
            { value: 18000, name: '兼职收入', itemStyle: { color: '#67C23A' } },
            { value: 30000, name: '投资收益', itemStyle: { color: '#E6A23C' } },
            { value: 12000, name: '产品收入', itemStyle: { color: '#F56C6C' } },
            { value: 12000, name: '其他收入', itemStyle: { color: '#909399' } }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
  }

  // 收入趋势图表
  if (incomeTrendChartRef.value) {
    incomeTrendChart = echarts.init(incomeTrendChartRef.value)
    incomeTrendChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['总收入', '主动收入', '被动收入']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['10月', '11月', '12月', '1月', '2月', '3月']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${value / 1000}k`
        }
      },
      series: [
        {
          name: '总收入',
          type: 'line',
          data: [25000, 27000, 28000, 29000, 30000, 30000],
          itemStyle: { color: '#409EFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          }
        },
        {
          name: '主动收入',
          type: 'line',
          data: [17500, 18900, 19600, 20300, 21000, 21000],
          itemStyle: { color: '#67C23A' }
        },
        {
          name: '被动收入',
          type: 'line',
          data: [7500, 8100, 8400, 8700, 9000, 9000],
          itemStyle: { color: '#E6A23C' }
        }
      ]
    })
  }
}

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  incomeTypeChart?.resize()
  incomeSourceChart?.resize()
  incomeTrendChart?.resize()
}

onMounted(() => {
  loadAnalysisData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  incomeTypeChart?.dispose()
  incomeSourceChart?.dispose()
  incomeTrendChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.income-analysis {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-title {
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.time-range-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  font-size: 48px;
  margin-right: 20px;
}

.metric-info {
  flex: 1;
}

.metric-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.metric-change {
  font-size: 14px;
  opacity: 0.9;
}

.metric-change.positive {
  color: #67C23A;
}

.metric-change.negative {
  color: #F56C6C;
}

.gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.gradient-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.gradient-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.finance-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-card {
  height: 350px;
}

.chart-container {
  width: 100%;
  height: 250px;
}

.chart-container-large {
  width: 100%;
  height: 400px;
}

.section-title {
  margin: 30px 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.income-structure {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.structure-item {
  margin-bottom: 30px;
}

.structure-item:last-child {
  margin-bottom: 0;
}

.structure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.structure-label {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.structure-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.structure-tip {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}

.structure-tip.warning {
  color: #E6A23C;
}

.growth-analysis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.growth-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.growth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.growth-label {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.growth-value {
  font-size: 20px;
  font-weight: 600;
  color: #67C23A;
}

.growth-value.negative {
  color: #F56C6C;
}

.growth-detail {
  font-size: 14px;
  color: #909399;
}

.optimization-suggestions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.suggestion-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.suggestion-card.priority-high {
  border-left: 4px solid #F56C6C;
}

.suggestion-card.priority-medium {
  border-left: 4px solid #E6A23C;
}

.suggestion-card.priority-low {
  border-left: 4px solid #409EFF;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.suggestion-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.suggestion-content {
  margin-top: 15px;
}

.suggestion-description {
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.actions-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.actions-list {
  margin: 0 0 15px 0;
  padding-left: 20px;
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.suggestion-footer {
  display: flex;
  gap: 10px;
}

.growth-sources {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.growth-source-card {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.growth-source-icon {
  font-size: 48px;
  margin-right: 20px;
}

.growth-source-info {
  flex: 1;
}

.growth-source-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.growth-source-rate {
  font-size: 24px;
  font-weight: 600;
  color: #67C23A;
  margin-bottom: 5px;
}

.growth-source-amount {
  font-size: 14px;
  color: #909399;
}

.growth-source-tip {
  font-size: 14px;
  color: #67C23A;
  background: #f0f9ff;
  padding: 10px;
  border-radius: 6px;
  border-left: 4px solid #67C23A;
}
</style>
