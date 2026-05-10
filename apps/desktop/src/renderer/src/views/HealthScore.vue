<template>
  <FeatureGate feature="hasHealthScore" :feature-name="t('healthScore.featureName')" :description="t('healthScore.featureDesc')" required-tier="basic">
  <div class="health-score-page" v-loading="loading">
    <div v-if="!loading && !score" class="empty-state">
      <div class="empty-icon">🏥</div>
      <p>{{ t('healthScore.noData') }}</p>
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
            <div class="score-label">{{ t('healthScore.overallScore') }}</div>
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
        <h3>{{ t('healthScore.adviceTitle') }}</h3>
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
import { useI18n } from '@/i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { t } = useI18n()

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
  if (s >= 90) return t('healthScore.excellent')
  if (s >= 80) return t('healthScore.good')
  if (s >= 60) return t('healthScore.fair')
  if (s >= 40) return t('healthScore.needsImprovement')
  return t('healthScore.needsAttention')
})

const scoreTip = computed(() => {
  const s = score.value?.totalScore ?? 0
  if (s >= 80) return t('healthScore.tipExcellent')
  if (s >= 60) return t('healthScore.tipGood')
  if (s >= 40) return t('healthScore.tipFair')
  return t('healthScore.tipBad')
})

const advices = computed(() => {
  if (!score.value) return []
  const dims = score.value.dimensions
  const list: { icon: string; text: string }[] = []

  if (dims.savings?.score < 60) {
    list.push({ icon: '🐷', text: t('healthScore.adviceSavings') })
  }
  if (dims.investment?.score < 50) {
    list.push({ icon: '📈', text: t('healthScore.adviceInvestment') })
  }
  if (dims.debt?.score < 60) {
    list.push({ icon: '💳', text: t('healthScore.adviceDebt') })
  }
  if (dims.stability?.score < 50) {
    list.push({ icon: '🔧', text: t('healthScore.adviceStability') })
  }
  if (dims.growth?.score < 50) {
    list.push({ icon: '🌱', text: t('healthScore.adviceGrowth') })
  }

  if (list.length === 0) {
    list.push({ icon: '🎉', text: t('healthScore.adviceAllGood') })
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
  if (key === 'savings') return t('healthScore.savingsRate').replace('{value}', String(dim.value))
  if (key === 'investment') return t('healthScore.investmentRatio').replace('{value}', String(dim.value))
  if (key === 'debt') return t('healthScore.debtRatio').replace('{value}', String(dim.value))
  if (key === 'stability') return t('healthScore.incomeSources').replace('{value}', String(dim.value))
  if (key === 'growth') return t('healthScore.growthRate').replace('{value}', String(dim.value))
  return `${dim.value}`
}

async function loadScore() {
  if (!window.electronAPI) return
const { safeCall } = useErrorHandler()

  loading.value = true
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return
    score.value = await window.electronAPI.report.healthScore(user.id)
  })
  loading.value = false
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
  color: var(--text-secondary);
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
}

// 总分展示
.score-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 24px;
  background: var(--bg-card);
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
      color: var(--text-secondary);
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
    color: var(--text-regular);
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
