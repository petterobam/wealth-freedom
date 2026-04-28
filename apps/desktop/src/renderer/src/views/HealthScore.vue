<template>
  <FeatureGate feature="hasHealthScore" feature-name="健康评分" description="五维财务健康评分，发现财务盲点" required-tier="basic">
  <div class="health-score-page" v-loading="loading">
    <div v-if="!loading && !score" class="empty-state">
      <div class="empty-icon">🏥</div>
      <p>暂无财务数据，无法计算健康评分</p>
    </div>

    <template v-if="score">
      <!-- 总分环形图 -->
      <div class="score-hero">
        <div class="score-ring" :style="{ '--score': score.totalScore, '--color': scoreColor }">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" stroke-width="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              :stroke="scoreColor"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="326.73"
              :stroke-dashoffset="326.73 - (326.73 * score.totalScore / 100)"
              transform="rotate(-90 60 60)"
              class="score-arc"
            />
          </svg>
          <div class="score-center">
            <div class="score-number" :style="{ color: scoreColor }">{{ score.totalScore }}</div>
            <div class="score-label">综合评分</div>
          </div>
        </div>
        <div class="score-desc">
          <div class="score-level" :style="{ color: scoreColor }">{{ scoreLevel }}</div>
          <p class="score-tip">{{ scoreTip }}</p>
        </div>
      </div>

      <!-- 5 维度雷达 -->
      <div class="dimensions">
        <div
          v-for="(dim, key) in score.dimensions"
          :key="key"
          class="dimension-card"
          :class="dimLevel(dim.score)"
        >
          <div class="dim-header">
            <span class="dim-label">{{ dim.label }}</span>
            <span class="dim-score">{{ dim.score }}</span>
          </div>
          <div class="dim-bar">
            <div class="dim-fill" :style="{ width: dim.score + '%' }" />
          </div>
          <div class="dim-value">{{ formatDimValue(key, dim) }}</div>
        </div>
      </div>

      <!-- 建议区 -->
      <div class="advice-section" v-if="advices.length">
        <h3>💡 优化建议</h3>
        <div class="advice-list">
          <div v-for="(a, i) in advices" :key="i" class="advice-item">
            <span class="advice-icon">{{ a.icon }}</span>
            <span class="advice-text">{{ a.text }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
  </FeatureGate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FeatureGate from '@/components/FeatureGate.vue'

interface Dimension {
  score: number
  value: number
  label: string
}

interface HealthScore {
  totalScore: number
  dimensions: Record<string, Dimension>
}

const loading = ref(false)
const score = ref<HealthScore | null>(null)

const scoreColor = computed(() => {
  const s = score.value?.totalScore ?? 0
  if (s >= 80) return '#67c23a'
  if (s >= 60) return '#e6a23c'
  if (s >= 40) return '#f89c30'
  return '#f56c6c'
})

const scoreLevel = computed(() => {
  const s = score.value?.totalScore ?? 0
  if (s >= 90) return '优秀'
  if (s >= 80) return '良好'
  if (s >= 60) return '一般'
  if (s >= 40) return '需改善'
  return '需警惕'
})

const scoreTip = computed(() => {
  const s = score.value?.totalScore ?? 0
  if (s >= 80) return '你的财务状况很健康，继续保持！'
  if (s >= 60) return '整体不错，还有提升空间，看看下方建议。'
  if (s >= 40) return '需要关注几个维度，建议优先改善最弱项。'
  return '财务状况需要认真改善，建议从储蓄和债务入手。'
})

const advices = computed(() => {
  if (!score.value) return []
  const dims = score.value.dimensions
  const list: { icon: string; text: string }[] = []

  if (dims.savings?.score < 60) {
    list.push({ icon: '🐷', text: '储蓄率偏低，建议将储蓄率提升至 30% 以上，先存后花。' })
  }
  if (dims.investment?.score < 50) {
    list.push({ icon: '📈', text: '投资占比不足，建议适当增加投资资产比例（30%-60%为佳）。' })
  }
  if (dims.debt?.score < 60) {
    list.push({ icon: '💳', text: '债务负担较重，优先偿还高利率债务，降低负债率。' })
  }
  if (dims.stability?.score < 50) {
    list.push({ icon: '🔧', text: '收入来源单一，建议开拓副业或被动收入渠道。' })
  }
  if (dims.growth?.score < 50) {
    list.push({ icon: '🌱', text: '财务成长放缓，回顾支出结构，寻找增加净储蓄的方法。' })
  }

  if (list.length === 0) {
    list.push({ icon: '🎉', text: '各方面表现优秀！继续保持，向财务自由迈进。' })
  }
  return list
})

function dimLevel(s: number) {
  if (s >= 80) return 'level-good'
  if (s >= 60) return 'level-ok'
  if (s >= 40) return 'level-warn'
  return 'level-bad'
}

function formatDimValue(key: string, dim: Dimension) {
  if (key === 'savings') return `储蓄率 ${dim.value}%`
  if (key === 'investment') return `投资占比 ${dim.value}%`
  if (key === 'debt') return `负债率 ${dim.value}%`
  if (key === 'stability') return `${dim.value} 个收入源`
  if (key === 'growth') return `成长率 ${dim.value}%`
  return `${dim.value}`
}

async function loadScore() {
  if (!window.electronAPI) return
  loading.value = true
  try {
    const user = await window.electronAPI.getUser()
    if (!user) return
    score.value = await window.electronAPI.report.healthScore(user.id)
  } catch (e) {
    console.error('加载健康评分失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadScore)
</script>

<style lang="scss" scoped>
.health-score-page {
  padding: 10px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
}

// 总分展示
.score-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
}

.score-ring {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;

  svg { width: 100%; height: 100%; }

  .score-arc {
    transition: stroke-dashoffset 1s ease;
  }

  .score-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;

    .score-number {
      font-size: 32px;
      font-weight: 800;
      line-height: 1;
    }

    .score-label {
      font-size: 11px;
      color: #999;
      margin-top: 2px;
    }
  }
}

.score-desc {
  .score-level {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .score-tip {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
}

// 维度卡片
.dimensions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 767px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dimension-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-top: 3px solid #ddd;
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }

  &.level-good { border-top-color: #67c23a; }
  &.level-ok { border-top-color: #e6a23c; }
  &.level-warn { border-top-color: #f89c30; }
  &.level-bad { border-top-color: #f56c6c; }
}

.dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .dim-label { font-size: 13px; color: #666; }
  .dim-score { font-size: 18px; font-weight: 700; color: #1a1a2e; }
}

.dim-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;

  .dim-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #4facfe, #00f2fe);
    transition: width 0.6s ease;
  }
}

.dim-value {
  font-size: 11px;
  color: #999;
}

// 建议
.advice-section {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 14px;
  }
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #444;
  line-height: 1.5;

  .advice-icon { font-size: 18px; flex-shrink: 0; }
}
</style>
