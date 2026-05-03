<template>
  <FeatureGate feature="hasInsights" :featureName="t('insights.title')" :description="t('insights.featureDesc')">
  <div class="insight-page">
    <div class="page-header">
      <h2>{{ t('insights.title') }}</h2>
      <p class="subtitle">{{ t('insights.subtitle') }}</p>
    </div>

    <!-- 标签切换 -->
    <el-tabs v-model="activeTab" class="insight-tabs">
      <!-- 基准对比 -->
      <el-tab-pane :label="t('insights.tabBenchmark')" name="benchmark">
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>{{ t('insights.analyzing') }}</span>
        </div>
        <div v-else-if="benchmarks.length" class="benchmark-grid">
          <div v-for="cat in benchmarks" :key="cat.name" class="benchmark-card">
            <div class="card-header">
              <span class="card-icon">{{ cat.icon }}</span>
              <span class="card-title">{{ cat.name }}</span>
              <el-progress :percentage="cat.score" :stroke-width="8" :color="getScoreColor(cat.score)" class="card-score" />
            </div>
            <div class="benchmark-items">
              <div v-for="item in cat.items" :key="item.key" class="benchmark-item">
                <div class="item-header">
                  <span class="item-label">{{ item.label }}</span>
                  <span :class="['level-badge', item.level]">
                    {{ levelLabel(item.level) }}
                  </span>
                </div>
                <div class="item-compare">
                  <div class="compare-bar">
                    <div class="compare-user" :style="{ width: Math.min(100, (item.userValue / (item.benchmarkValue * 2)) * 100) + '%' }">
                      <span class="value">{{ item.userValue }}{{ item.unit }}</span>
                    </div>
                  </div>
                  <div class="compare-benchmark">
                    {{ t('insights.benchmarkLabel') }}：{{ item.benchmarkValue }}{{ item.unit }}
                  </div>
                </div>
                <p class="item-desc">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else :description="t('insights.noDataRecord')" />
      </el-tab-pane>

      <!-- 成就系统 -->
      <el-tab-pane :label="t('insights.tabAchievements')" name="achievements">
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>{{ t('insights.loadingAchievements') }}</span>
        </div>
        <template v-else-if="achievementData">
          <!-- 成就概览 -->
          <div class="achievement-summary">
            <div class="summary-card total">
              <div class="summary-icon">⭐</div>
              <div class="summary-value">{{ achievementData.score.total }}</div>
              <div class="summary-label">{{ t('insights.achievementScore') }}</div>
            </div>
            <div class="summary-card unlocked">
              <div class="summary-icon">🏆</div>
              <div class="summary-value">{{ achievementData.score.unlocked }}/{{ achievementData.score.total_count }}</div>
              <div class="summary-label">{{ t('insights.unlocked') }}</div>
            </div>
            <div class="summary-card progress">
              <div class="summary-icon">📈</div>
              <div class="summary-value">{{ Math.round(achievementData.score.total / achievementData.score.max * 100) }}%</div>
              <div class="summary-label">{{ t('insights.completion') }}</div>
            </div>
          </div>

          <!-- 成就分组 -->
          <div v-for="group in achievementData.groups" :key="group.category" class="achievement-group">
            <h3 class="group-title">
              <span>{{ group.icon }}</span> {{ group.label }}
            </h3>
            <div class="achievement-grid">
              <div
                v-for="a in group.achievements"
                :key="a.id"
                :class="['achievement-card', { unlocked: a.unlockedAt, locked: !a.unlockedAt }]"
              >
                <div class="achievement-icon">{{ a.icon }}</div>
                <div class="achievement-info">
                  <div class="achievement-name">{{ a.name }}</div>
                  <div class="achievement-desc">{{ a.description }}</div>
                  <el-progress
                    v-if="!a.unlockedAt"
                    :percentage="a.progress"
                    :stroke-width="4"
                    :show-text="true"
                    :format="(p: number) => p + '%'"
                    size="small"
                  />
                  <div v-else class="unlocked-time">
                    ✅ {{ new Date(a.unlockedAt).toLocaleDateString() }}
                  </div>
                </div>
                <div :class="['tier-badge', a.tier]">
                  {{ tierLabel(a.tier) }}
                </div>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else :description="t('insights.noData')" />
      </el-tab-pane>

      <!-- 洞察摘要 -->
      <el-tab-pane :label="t('insights.tabSummary')" name="summary">
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
        <template v-else-if="summaryData">
          <div class="summary-insight">
            <div :class="['phase-card', summaryData.financialPhase]">
              <div class="phase-icon">{{ phaseIcon(summaryData.financialPhase) }}</div>
              <div class="phase-label">{{ phaseLabel(summaryData.financialPhase) }}</div>
              <div class="phase-networth">
                {{ t('insights.netWorth') }}：¥{{ summaryData.netWorth?.toLocaleString() }}
              </div>
            </div>
            <div class="recommendation-card">
              <h3>💡 {{ t('insights.recommendation') }}</h3>
              <p>{{ summaryData.recommendation }}</p>
            </div>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
  </FeatureGate>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import FeatureGate from '@/components/FeatureGate.vue'
import useI18n from '../i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { safeCall } = useErrorHandler()

const { t } = useI18n()

const activeTab = ref('benchmark')
const loading = ref(false)
const benchmarks = ref<any[]>([])
const achievementData = ref<any>(null)
const summaryData = ref<any>(null)

const levelLabel = (level: string) => {
  const map: Record<string, string> = { excellent: t('insights.levelExcellent'), good: t('insights.levelGood'), warning: t('insights.levelWarning'), danger: t('insights.levelDanger') }
  return map[level] || level
}

const tierLabel = (tier: string) => {
  const map: Record<string, string> = { bronze: t('insights.tierBronze'), silver: t('insights.tierSilver'), gold: t('insights.tierGold'), diamond: t('insights.tierDiamond') }
  return map[tier] || tier
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#409eff'
  if (score >= 50) return '#e6a23c'
  return '#f56c6c'
}

const phaseIcon = (phase: string) => {
  const map: Record<string, string> = { accumulation: '🏗️', growth: '🌱', freedom: '🏖️' }
  return map[phase] || '📊'
}

const phaseLabel = (phase: string) => {
  const map: Record<string, string> = { accumulation: t('insights.phaseAccumulation'), growth: t('insights.phaseGrowth'), freedom: t('insights.phaseFreedom') }
  return map[phase] || phase
}

const loadBenchmarks = async () => {
  await safeCall(async () => {
    const res = await window.electronAPI.insight.benchmarks()
    if (res.success) benchmarks.value = res.data
  })
}

const loadAchievements = async () => {
  await safeCall(async () => {
    const res = await window.electronAPI.insight.achievements()
    if (res.success) achievementData.value = res.data
  })
}

const loadSummary = async () => {
  await safeCall(async () => {
    const res = await window.electronAPI.insight.summary()
    if (res.success) summaryData.value = res.data
  })
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadBenchmarks(), loadAchievements(), loadSummary()])
  loading.value = false
})
</script>

<style scoped>
.insight-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px;
  color: #909399;
}

/* 基准对比 */
.benchmark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.benchmark-card {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.card-score {
  width: 120px;
}

.benchmark-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.benchmark-item {
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-label {
  font-weight: 500;
  font-size: 14px;
}

.level-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.level-badge.excellent { background: #f0f9eb; color: #67c23a; }
.level-badge.good { background: #ecf5ff; color: #409eff; }
.level-badge.warning { background: #fdf6ec; color: #e6a23c; }
.level-badge.danger { background: #fef0f0; color: #f56c6c; }

.compare-bar {
  height: 24px;
  background: var(--el-fill-color);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 4px;
}

.compare-user {
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  min-width: fit-content;
  transition: width 0.5s ease;
}

.compare-user .value {
  color: white;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.compare-benchmark {
  font-size: 12px;
  color: #909399;
}

.item-desc {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #606266;
}

/* 成就系统 */
.achievement-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid var(--el-border-color-lighter);
}

.summary-card.total { background: linear-gradient(135deg, #fef9e7, #fff); }
.summary-card.unlocked { background: linear-gradient(135deg, #e8f5e9, #fff); }
.summary-card.progress { background: linear-gradient(135deg, #e3f2fd, #fff); }

.summary-icon { font-size: 24px; margin-bottom: 4px; }
.summary-value { font-size: 28px; font-weight: 700; color: var(--el-text-color-primary); }
.summary-label { font-size: 13px; color: #909399; margin-top: 2px; }

.achievement-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 16px;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
}

.achievement-card.unlocked {
  background: linear-gradient(135deg, #f0f9eb, #fff);
  border-color: #b3e19d;
}

.achievement-card.locked {
  opacity: 0.7;
  background: var(--el-fill-color-lighter);
}

.achievement-icon {
  font-size: 28px;
  min-width: 36px;
  text-align: center;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-weight: 600;
  font-size: 14px;
}

.achievement-desc {
  font-size: 12px;
  color: #909399;
  margin: 2px 0 4px 0;
}

.unlocked-time {
  font-size: 11px;
  color: #67c23a;
}

.tier-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  min-width: 28px;
  text-align: center;
}

.tier-badge.bronze { background: #fde2c8; color: #b87333; }
.tier-badge.silver { background: #e8e8e8; color: #808080; }
.tier-badge.gold { background: #fff3cd; color: #b8860b; }
.tier-badge.diamond { background: #e8eaf6; color: #5c6bc0; }

/* 洞察摘要 */
.summary-insight {
  max-width: 600px;
}

.phase-card {
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 20px;
}

.phase-card.accumulation { background: linear-gradient(135deg, #fff3e0, #fff); }
.phase-card.growth { background: linear-gradient(135deg, #e8f5e9, #fff); }
.phase-card.freedom { background: linear-gradient(135deg, #e3f2fd, #fff); }

.phase-icon { font-size: 48px; margin-bottom: 8px; }
.phase-label { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.phase-networth { font-size: 16px; color: #606266; }

.recommendation-card {
  padding: 20px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
}

.recommendation-card h3 {
  margin: 0 0 8px 0;
}

.recommendation-card p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

/* 暗色模式 */
:root.dark .benchmark-card,
:root.dark .achievement-card,
:root.dark .summary-card,
:root.dark .recommendation-card {
  background: var(--el-bg-color-overlay);
}

:root.dark .achievement-card.unlocked {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1), var(--el-bg-color-overlay));
}

:root.dark .benchmark-item {
  background: var(--el-fill-color);
}
</style>
