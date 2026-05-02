<template>
  <div class="bigscreen-container" :class="{ 'auto-rotate': autoRotate }">
    <!-- 顶部标题栏 -->
    <header class="bs-header">
      <div class="bs-title">
        <span class="bs-title-icon">💰</span>
        <h1>财富自由之路 · 数据大屏</h1>
      </div>
      <div class="bs-header-right">
        <span class="bs-time">{{ currentTime }}</span>
        <el-button-group>
          <el-button size="small" @click="toggleAutoRotate" :type="autoRotate ? 'primary' : ''">
            {{ autoRotate ? '⏸ 停止轮播' : '▶ 自动轮播' }}
          </el-button>
          <el-button size="small" @click="exportScreenshot">📷 截图</el-button>
          <el-button size="small" @click="goBack">✕ 退出</el-button>
        </el-button-group>
      </div>
    </header>

    <!-- 三阶段进度条 -->
    <div class="bs-stage-bar">
      <div class="stage" :class="{ active: currentStage === 1 }">
        <span class="stage-label">财务保障</span>
        <span class="stage-value">6-12月储备金</span>
      </div>
      <div class="stage-divider"></div>
      <div class="stage" :class="{ active: currentStage === 2 }">
        <span class="stage-label">财务安全</span>
        <span class="stage-value">利息覆盖支出</span>
      </div>
      <div class="stage-divider"></div>
      <div class="stage" :class="{ active: currentStage === 3 }">
        <span class="stage-label">财务自由</span>
        <span class="stage-value">利息实现梦想</span>
      </div>
    </div>

    <!-- 6大卡片网格 -->
    <div class="bs-grid">
      <!-- 1. 净资产翻牌器 -->
      <div class="bs-card bs-card-networth" :class="{ highlight: highlightedCard === 0 }">
        <div class="bs-card-title">净资产总览</div>
        <div class="flip-numbers">
          <div class="flip-item">
            <div class="flip-label">总资产</div>
            <div class="flip-value positive">¥{{ formatMoney(netWorth.totalAssets) }}</div>
          </div>
          <div class="flip-item">
            <div class="flip-label">总负债</div>
            <div class="flip-value negative">¥{{ formatMoney(netWorth.totalDebts) }}</div>
          </div>
          <div class="flip-item flip-main">
            <div class="flip-label">净资产</div>
            <div class="flip-value grand">¥{{ formatMoney(netWorth.netWorth) }}</div>
          </div>
        </div>
      </div>

      <!-- 2. 收支趋势 -->
      <div class="bs-card bs-card-trend" :class="{ highlight: highlightedCard === 1 }">
        <div class="bs-card-title">收支趋势（近12月）</div>
        <div ref="trendChartRef" class="bs-chart"></div>
      </div>

      <!-- 3. 资产配置 -->
      <div class="bs-card bs-card-asset" :class="{ highlight: highlightedCard === 2 }">
        <div class="bs-card-title">资产配置</div>
        <div ref="assetChartRef" class="bs-chart"></div>
      </div>

      <!-- 4. 预算执行 -->
      <div class="bs-card bs-card-budget" :class="{ highlight: highlightedCard === 3 }">
        <div class="bs-card-title">预算执行</div>
        <div ref="budgetChartRef" class="bs-chart"></div>
      </div>

      <!-- 5. 储蓄进度 -->
      <div class="bs-card bs-card-savings" :class="{ highlight: highlightedCard === 4 }">
        <div class="bs-card-title">储蓄进度</div>
        <div class="savings-progress-list">
          <div v-for="goal in savingsGoals" :key="goal.name" class="savings-item">
            <div class="savings-item-header">
              <span class="savings-name">{{ goal.name }}</span>
              <span class="savings-pct">{{ goal.percent }}%</span>
            </div>
            <div class="savings-bar-bg">
              <div class="savings-bar-fill" :style="{ width: goal.percent + '%', background: goal.color }"></div>
            </div>
            <div class="savings-detail">¥{{ formatMoney(goal.current) }} / ¥{{ formatMoney(goal.target) }}</div>
          </div>
        </div>
      </div>

      <!-- 6. 投资收益 -->
      <div class="bs-card bs-card-invest" :class="{ highlight: highlightedCard === 5 }">
        <div class="bs-card-title">投资持仓</div>
        <div ref="investChartRef" class="bs-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'

const router = useRouter()

// Time display
const currentTime = ref('')
let timeTimer: ReturnType<typeof setInterval> | null = null
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

// Data
const netWorth = ref({ totalAssets: 1250000, totalDebts: 280000, netWorth: 970000 })
const savingsGoals = ref([
  { name: '财务保障金', current: 82000, target: 120000, percent: 68, color: '#409EFF' },
  { name: '财务安全金', current: 350000, target: 1500000, percent: 23, color: '#67C23A' },
  { name: '财务自由金', current: 350000, target: 5000000, percent: 7, color: '#E6A23C' },
])
const currentStage = computed(() => {
  const p = savingsGoals.value[0].percent
  if (p < 100) return 1
  const p2 = savingsGoals.value[1].percent
  return p2 < 100 ? 2 : 3
})

// Chart refs
const trendChartRef = ref<HTMLDivElement>()
const assetChartRef = ref<HTMLDivElement>()
const budgetChartRef = ref<HTMLDivElement>()
const investChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | null = null
let assetChart: echarts.ECharts | null = null
let budgetChart: echarts.ECharts | null = null
let investChart: echarts.ECharts | null = null

// Auto rotate
const autoRotate = ref(false)
const highlightedCard = ref(-1)
let rotateTimer: ReturnType<typeof setInterval> | null = null

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value
  if (autoRotate.value) {
    highlightedCard.value = 0
    rotateTimer = setInterval(() => {
      highlightedCard.value = (highlightedCard.value + 1) % 6
    }, 5000)
  } else {
    highlightedCard.value = -1
    if (rotateTimer) { clearInterval(rotateTimer); rotateTimer = null }
  }
}

function goBack() { router.push('/dashboard') }

function formatMoney(val: number): string {
  if (val >= 10000) return (val / 10000).toFixed(1) + '万'
  return val.toLocaleString('zh-CN')
}

// Screenshot (html2canvas-like via canvas)
function exportScreenshot() {
  const el = document.querySelector('.bigscreen-container') as HTMLElement
  if (!el) return
  // Use built-in approach: open print dialog
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<html><head><title>财富自由大屏截图</title><style>body{margin:0;background:#0a0e27;display:flex;justify-content:center;align-items:center;min-height:100vh}</style></head><body>`)
  w.document.write(`<p style="color:#fff;font-size:24px">截图提示：按 Ctrl+Shift+S (Mac: Cmd+Shift+4) 截取屏幕区域</p>`)
  w.document.write('</body></html>')
  w.document.close()
}

// Chart init helpers
function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value, 'dark')
  const months = ['7月','8月','9月','10月','11月','12月','1月','2月','3月','4月','5月','6月']
  trendChart.setOption({
    backgroundColor: 'transparent',
    grid: { top: 40, right: 30, bottom: 30, left: 60 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入','支出'], textStyle: { color: '#ccc' }, top: 5 },
    xAxis: { type: 'category', data: months, axisLabel: { color: '#999' } },
    yAxis: { type: 'value', axisLabel: { color: '#999', formatter: (v: number) => (v/10000).toFixed(0)+'万' } },
    series: [
      { name: '收入', type: 'line', smooth: true, data: [42000,43000,41500,44000,45000,42000,48000,47000,46000,49000,51000,50000], itemStyle: { color: '#67C23A' }, areaStyle: { color: 'rgba(103,194,58,0.15)' } },
      { name: '支出', type: 'line', smooth: true, data: [18000,17000,19000,17500,18500,18000,16500,19000,17000,18000,17500,18500], itemStyle: { color: '#F56C6C' }, areaStyle: { color: 'rgba(245,108,108,0.15)' } }
    ]
  })
}

function initAssetChart() {
  if (!assetChartRef.value) return
  assetChart = echarts.init(assetChartRef.value, 'dark')
  assetChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['40%','70%'], center: ['50%','55%'],
      label: { color: '#ccc', formatter: '{b}\n{d}%' },
      data: [
        { value: 450000, name: '银行存款', itemStyle: { color: '#409EFF' } },
        { value: 380000, name: '基金投资', itemStyle: { color: '#67C23A' } },
        { value: 200000, name: '股票', itemStyle: { color: '#E6A23C' } },
        { value: 150000, name: '数字货币', itemStyle: { color: '#F56C6C' } },
        { value: 70000, name: '其他', itemStyle: { color: '#909399' } },
      ]
    }]
  })
}

function initBudgetChart() {
  if (!budgetChartRef.value) return
  budgetChart = echarts.init(budgetChartRef.value, 'dark')
  budgetChart.setOption({
    backgroundColor: 'transparent',
    grid: { top: 10, right: 30, bottom: 30, left: 80 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { color: '#999', formatter: (v: number) => (v/1000)+'k' } },
    yAxis: { type: 'category', data: ['餐饮','交通','购物','娱乐','居住','其他'], axisLabel: { color: '#ccc' } },
    series: [
      { name: '预算', type: 'bar', data: [3000,1500,2000,1000,5000,1500], itemStyle: { color: 'rgba(64,158,255,0.4)' }, barWidth: 8 },
      { name: '实际', type: 'bar', data: [2800,1200,2300,800,5000,1100], itemStyle: { color: '#409EFF' }, barWidth: 8 },
    ]
  })
}

function initInvestChart() {
  if (!investChartRef.value) return
  investChart = echarts.init(investChartRef.value, 'dark')
  investChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 30, right: 20, bottom: 30, left: 80 },
    xAxis: { type: 'value', axisLabel: { color: '#999', formatter: (v: number) => v+'%' } },
    yAxis: { type: 'category', data: ['纳斯达克ETF','沪深300','比特币','茅台','国债'], axisLabel: { color: '#ccc' } },
    series: [{
      type: 'bar',
      data: [
        { value: 12.5, itemStyle: { color: '#67C23A' } },
        { value: 5.2, itemStyle: { color: '#67C23A' } },
        { value: -3.8, itemStyle: { color: '#F56C6C' } },
        { value: 8.1, itemStyle: { color: '#67C23A' } },
        { value: 2.3, itemStyle: { color: '#67C23A' } },
      ],
      barWidth: 12,
      label: { show: true, position: 'right', formatter: (p: any) => p.value+'%', color: '#ccc' }
    }]
  })
}

// Load real data from DB
async function loadData() {
  try {
    const data = await (window as any).api?.dashboard?.getSummary()
    if (data) {
      netWorth.value = {
        totalAssets: data.totalAssets || 0,
        totalDebts: data.totalDebts || 0,
        netWorth: (data.totalAssets || 0) - (data.totalDebts || 0)
      }
    }
    const goals = await (window as any).api?.goals?.getAll()
    if (goals && goals.length > 0) {
      savingsGoals.value = goals.slice(0, 5).map((g: any) => ({
        name: g.name,
        current: g.currentAmount || 0,
        target: g.targetAmount || 100000,
        percent: g.targetAmount ? Math.min(100, Math.round(((g.currentAmount || 0) / g.targetAmount) * 100)) : 0,
        color: ['#409EFF','#67C23A','#E6A23C','#F56C6C','#909399'][goals.indexOf(g) % 5]
      }))
    }
  } catch (e) {
    // Use demo data
  }
}

// Resize handler
function handleResize() {
  trendChart?.resize()
  assetChart?.resize()
  budgetChart?.resize()
  investChart?.resize()
}

onMounted(async () => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  await loadData()
  await nextTick()
  initTrendChart()
  initAssetChart()
  initBudgetChart()
  initInvestChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  if (rotateTimer) clearInterval(rotateTimer)
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  assetChart?.dispose()
  budgetChart?.dispose()
  investChart?.dispose()
})
</script>

<style scoped>
.bigscreen-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1e3a 50%, #0d1130 100%);
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Header */
.bs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.bs-title { display: flex; align-items: center; gap: 10px; }
.bs-title-icon { font-size: 28px; }
.bs-title h1 {
  font-size: 22px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}
.bs-header-right { display: flex; align-items: center; gap: 16px; }
.bs-time { font-size: 14px; color: #999; font-variant-numeric: tabular-nums; }

/* Stage bar */
.bs-stage-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
  background: rgba(255,255,255,0.02);
}
.stage {
  padding: 4px 20px;
  border-radius: 20px;
  font-size: 13px;
  opacity: 0.5;
  transition: all 0.3s;
  text-align: center;
}
.stage.active {
  opacity: 1;
  background: rgba(64,158,255,0.15);
  border: 1px solid rgba(64,158,255,0.3);
}
.stage-label { font-weight: 600; }
.stage-value { font-size: 11px; color: #999; margin-left: 6px; }
.stage-divider { width: 40px; height: 1px; background: rgba(255,255,255,0.15); }

/* Grid */
.bs-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  padding: 16px 24px 20px;
}

/* Card base */
.bs-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.5s;
  overflow: hidden;
}
.bs-card.highlight {
  border-color: rgba(64,158,255,0.5);
  box-shadow: 0 0 20px rgba(64,158,255,0.15);
}
.bs-card-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
  font-weight: 500;
}
.bs-chart { flex: 1; min-height: 0; }

/* Net worth flip */
.flip-numbers { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.flip-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
.flip-label { color: #999; font-size: 14px; }
.flip-value { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
.flip-value.positive { color: #67C23A; }
.flip-value.negative { color: #F56C6C; }
.flip-value.grand { font-size: 32px; color: #409EFF; }
.flip-main { padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); }

/* Savings progress */
.savings-progress-list { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.savings-item {}
.savings-item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.savings-name { font-size: 13px; color: #ccc; }
.savings-pct { font-size: 13px; font-weight: 600; color: #409EFF; }
.savings-bar-bg {
  height: 8px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  overflow: hidden;
}
.savings-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease;
}
.savings-detail { font-size: 11px; color: #666; margin-top: 2px; }

/* Dark override for Element Plus */
:deep(.el-button) {
  --el-button-bg-color: rgba(255,255,255,0.08);
  --el-button-border-color: rgba(255,255,255,0.15);
  --el-button-text-color: #ccc;
  --el-button-hover-bg-color: rgba(64,158,255,0.2);
  --el-button-hover-border-color: rgba(64,158,255,0.4);
}
</style>
