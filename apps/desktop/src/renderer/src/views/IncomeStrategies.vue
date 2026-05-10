<template>
  <div class="income-strategies">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-icon :size="32" color="#409EFF"><Trophy /></el-icon>
          <div>
            <h2>{{ t('incomeStrategies.title') }}</h2>
            <p>{{ t('incomeStrategies.subtitle') }}</p>
          </div>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showRecommendations = true">
            <el-icon><Guide /></el-icon>
            {{ t('incomeStrategies.getRecommendations') }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 推荐策略 -->
    <el-card v-if="recommendations.length > 0" class="recommendation-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Star /></el-icon>
            {{ t('incomeStrategies.recommendedStrategies') }}
          </span>
          <el-button link @click="showRecommendations = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      <div class="recommendation-list">
        <el-card
          v-for="strategy in recommendations"
          :key="strategy.id"
          class="strategy-card recommendation"
          shadow="hover"
          @click="openStrategyDetail(strategy)"
        >
          <div class="strategy-header">
            <div class="strategy-icon">
              <el-icon :size="24">
                <component :is="strategy.icon" />
              </el-icon>
            </div>
            <div class="strategy-title">{{ strategy.name }}</div>
            <el-tag type="success" size="small">{{ t('incomeStrategies.recommended') }}</el-tag>
          </div>
          <div class="strategy-desc">{{ strategy.shortDesc }}</div>
          <div class="strategy-meta">
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ strategy.estimatedTime }}
            </span>
            <span class="meta-item" v-if="strategy.expectedIncome">
              <el-icon><TrendCharts /></el-icon>
              {{ t('incomeStrategies.expectedIncome', { amount: formatNumber(strategy.expectedIncome) }) }}
            </span>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 所有策略 -->
    <el-card class="strategies-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ t('incomeStrategies.allStrategies') }}</span>
          <div class="filter-tabs">
            <el-radio-group v-model="activeFilter" size="small">
              <el-radio-button value="all">{{ t('incomeStrategies.filterAll') }}</el-radio-button>
              <el-radio-button value="expert">{{ t('incomeStrategies.filterExpert') }}</el-radio-button>
              <el-radio-button value="product">{{ t('incomeStrategies.filterProduct') }}</el-radio-button>
              <el-radio-button value="leverage">{{ t('incomeStrategies.filterLeverage') }}</el-radio-button>
              <el-radio-button value="investment">{{ t('incomeStrategies.filterInvestment') }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <div class="strategies-grid" v-loading="loading">
        <el-empty v-if="filteredStrategies.length === 0" :description="t('incomeStrategies.noStrategies')" />
        <el-card
          v-for="strategy in filteredStrategies"
          :key="strategy.id"
          class="strategy-card"
          shadow="hover"
          :class="{ 'is-active': strategy.isActive }"
          @click="openStrategyDetail(strategy)"
        >
          <div class="strategy-header">
            <div class="strategy-icon">
              <el-icon :size="24">
                <component :is="strategy.icon" />
              </el-icon>
            </div>
            <div class="strategy-info">
              <div class="strategy-title">{{ strategy.name }}</div>
              <el-tag v-if="strategy.isActive" type="success" size="small">{{ t('incomeStrategies.applied') }}</el-tag>
            </div>
          </div>
          <div class="strategy-desc">{{ strategy.shortDesc }}</div>
          <div class="strategy-meta">
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ strategy.estimatedTime }}
            </span>
            <span class="meta-item" v-if="strategy.expectedIncome">
              <el-icon><TrendCharts /></el-icon>
              {{ t('incomeStrategies.expectedIncome', { amount: formatNumber(strategy.expectedIncome) }) }}
            </span>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 策略详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedStrategy?.name"
      width="800px"
      :before-close="closeDialog"
    >
      <div v-if="selectedStrategy" class="strategy-detail">
        <!-- 核心思想 -->
        <div class="detail-section">
          <h3>
            <el-icon><Lightning /></el-icon>
            {{ t('incomeStrategies.coreIdea') }}
          </h3>
          <p>{{ selectedStrategy.coreIdea }}</p>
        </div>

        <!-- 适用场景/优势 -->
        <div class="detail-section" v-if="selectedStrategy.scenario || selectedStrategy.advantages">
          <h3>
            <el-icon><Compass /></el-icon>
            {{ selectedStrategy.scenario ? t('incomeStrategies.applicableScenario') : t('incomeStrategies.advantages') }}
          </h3>
          <p>{{ selectedStrategy.scenario || selectedStrategy.advantages }}</p>
        </div>

        <!-- 执行步骤 -->
        <div class="detail-section">
          <h3>
            <el-icon><List /></el-icon>
            {{ t('incomeStrategies.executionSteps') }}
          </h3>
          <el-steps :active="selectedStrategy.isActive ? selectedStrategy.steps.length : 0" finish-status="success" align-center>
            <el-step
              v-for="(step, index) in selectedStrategy.steps"
              :key="index"
              :title="step"
            />
          </el-steps>
        </div>

        <!-- 案例参考/产品类型/杠杆类型 -->
        <div class="detail-section" v-if="selectedStrategy.cases || selectedStrategy.productTypes || selectedStrategy.leverageTypes">
          <h3>
            <el-icon><Document /></el-icon>
            {{ selectedStrategy.cases ? t('incomeStrategies.caseReference') : (selectedStrategy.productTypes ? t('incomeStrategies.productTypes') : t('incomeStrategies.leverageTypes')) }}
          </h3>
          <div v-if="selectedStrategy.cases" class="cases-list">
            <div v-for="(item, index) in selectedStrategy.cases" :key="index" class="case-item">
              <span class="case-name">{{ item.name }}</span>
              <span class="case-value">{{ item.value }}</span>
            </div>
          </div>
          <div v-else-if="selectedStrategy.productTypes" class="types-list">
            <el-tag
              v-for="(item, index) in selectedStrategy.productTypes"
              :key="index"
              class="type-tag"
            >
              {{ item.name }}：¥{{ formatNumber(item.price) }}
            </el-tag>
          </div>
          <div v-else-if="selectedStrategy.leverageTypes" class="types-list">
            <el-tag
              v-for="(item, index) in selectedStrategy.leverageTypes"
              :key="index"
              class="type-tag"
            >
              {{ item }}
            </el-tag>
          </div>
        </div>

        <!-- 执行计划 -->
        <div class="detail-section" v-if="selectedStrategy.executionPlan">
          <h3>
            <el-icon><Calendar /></el-icon>
            {{ t('incomeStrategies.executionPlan') }}
          </h3>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in selectedStrategy.executionPlan"
              :key="index"
              :timestamp="item.time"
            >
              {{ item.task }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">{{ t('incomeStrategies.close') }}</el-button>
          <el-button
            type="primary"
            @click="applyStrategy"
            :loading="applying"
          >
            {{ selectedStrategy?.isActive ? t('incomeStrategies.continueExecution') : t('incomeStrategies.applyThisStrategy') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 推荐策略对话框 -->
    <el-dialog
      v-model="showRecommendations"
      :title="t('incomeStrategies.recommendationDialog')"
      width="600px"
    >
      <div class="recommendations-content">
        <el-alert
          :title="t('incomeStrategies.recommendationAlert')"
          type="info"
          :closable="false"
          show-icon
        />
        <div class="recommendation-list">
          <el-card
            v-for="strategy in allStrategies"
            :key="strategy.id"
            class="strategy-card recommendation"
            shadow="hover"
            @click="openStrategyDetail(strategy)"
          >
            <div class="strategy-header">
              <div class="strategy-icon">
                <el-icon :size="24">
                  <component :is="strategy.icon" />
                </el-icon>
              </div>
              <div class="strategy-title">{{ strategy.name }}</div>
              <el-tag :type="strategy.recommendationLevel === 'high' ? 'success' : 'warning'" size="small">
                {{ strategy.recommendationLevel === 'high' ? t('incomeStrategies.highlyRecommended') : t('incomeStrategies.recommended') }}
              </el-tag>
            </div>
            <div class="strategy-desc">{{ strategy.shortDesc }}</div>
            <div class="strategy-meta">
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ strategy.estimatedTime }}
              </span>
              <span class="meta-item" v-if="strategy.expectedIncome">
                <el-icon><TrendCharts /></el-icon>
                {{ t('incomeStrategies.expectedIncome', { amount: formatNumber(strategy.expectedIncome) }) }}
              </span>
            </div>
            <div class="strategy-reason" v-if="strategy.recommendationReason">
              <el-icon><InfoFilled /></el-icon>
              {{ strategy.recommendationReason }}
            </div>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import useI18n from "../i18n"
import { useErrorHandler } from '@/composables/useErrorHandler'
import {
  Trophy,
  Guide,
  Star,
  Close,
  Clock,
  TrendCharts,
  Lightning,
  Compass,
  List,
  Document,
  Calendar,
  InfoFilled,
  User,
  Box,
  MagicStick,
  Money,
  Medal
} from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/format'
import { useIncomeStore } from '@/stores/income'

const { safeCall } = useErrorHandler()

const incomeStore = useIncomeStore()
const { t } = useI18n()

const loading = ref(false)
const dialogVisible = ref(false)
const showRecommendations = ref(false)
const activeFilter = ref('all')
const applying = ref(false)
const selectedStrategy = ref<any>(null)

// 策略数据
const allStrategies = ref([
  {
    id: 'expert',
    name: '专家定位策略',
    icon: User,
    type: 'expert',
    shortDesc: '成为某个细分领域的专家，获得溢价',
    coreIdea: '通过深耕细分领域，建立专业壁垒和品牌影响力，实现收入溢价',
    scenario: '技术、设计、咨询、培训等领域',
    estimatedTime: '6-12 个月',
    expectedIncome: 10000,
    isActive: false,
    recommendationLevel: 'high',
    recommendationReason: '您的技术背景深厚，适合成为 AI 开发或全栈开发专家',
    steps: [
      '识别你的强项（天赋 + 兴趣 + 经验）',
      '选择一个细分领域深耕',
      '持续输出内容（文章/视频/案例）',
      '建立个人品牌和影响力',
      '提供咨询服务/培训/课程'
    ],
    cases: [
      { name: 'AI 助手开发专家', value: '¥2,000/小时咨询' },
      { name: 'UI/UX 设计专家', value: '¥50,000/项目' },
      { name: '财务规划师', value: '¥1,500/月持续顾问' }
    ]
  },
  {
    id: 'product',
    name: '产品化策略',
    icon: Box,
    type: 'product',
    shortDesc: '将技能或知识转化为可重复销售的产品',
    coreIdea: '一次开发，多次销售，不受时间限制，构建可规模化的收入来源',
    advantages: '一次开发，多次销售，不受时间限制',
    estimatedTime: '3-6 个月',
    expectedIncome: 5000,
    isActive: true,
    appliedAt: '2026-03-15',
    recommendationLevel: 'high',
    recommendationReason: '您正在开发的财务自由软件就是产品化策略的最佳实践',
    steps: [
      '选择产品类型',
      '验证需求',
      '开发 MVP',
      '小范围测试',
      '正式发布',
      '持续迭代'
    ],
    productTypes: [
      { name: '数字课程', price: 99 },
      { name: 'SaaS 软件', price: 99 },
      { name: '付费社群', price: 99 },
      { name: '电子书/专栏', price: 19 },
      { name: '模板/插件/工具', price: 19 }
    ],
    executionPlan: [
      { time: '第 1 个月', task: '选择产品类型，验证需求' },
      { time: '第 2-3 个月', task: '开发 MVP，小范围测试' },
      { time: '第 4-6 个月', task: '正式发布，持续迭代' }
    ]
  },
  {
    id: 'leverage',
    name: '杠杆策略',
    icon: MagicStick,
    type: 'leverage',
    shortDesc: '利用杠杆放大收入，而非出卖时间',
    coreIdea: '利用时间、金钱、技术、人脉、内容等杠杆，以有限的投入获得无限的产出',
    estimatedTime: '持续进行',
    expectedIncome: 8000,
    isActive: false,
    recommendationLevel: 'medium',
    recommendationReason: '您有一定的资金和技术积累，适合开始构建杠杆',
    steps: [
      '选择杠杆类型（时间/金钱/技术/人脉/内容）',
      '构建杠杆系统',
      '规模化输出',
      '持续优化'
    ],
    leverageTypes: [
      '时间杠杆：雇佣助手，复制自己',
      '金钱杠杆：投资赚钱，用钱生钱',
      '技术杠杆：自动化系统，规模化输出',
      '人脉杠杆：合作共赢，资源互换',
      '内容杠杆：一次创作，多次分发'
    ]
  },
  {
    id: 'investment',
    name: '投资策略',
    icon: Money,
    type: 'investment',
    shortDesc: '通过投资产生被动收入',
    coreIdea: '利用复利的力量，让资产自动增值，产生持续被动收入',
    estimatedTime: '长期',
    expectedIncome: 3000,
    isActive: false,
    recommendationLevel: 'high',
    recommendationReason: '您的投资资产占比偏低，应逐步提高投资收益',
    steps: [
      '学习投资知识',
      '确定投资目标',
      '选择投资产品',
      '构建投资组合',
      '定期调仓'
    ],
    executionPlan: [
      { time: '第 1-3 个月', task: '学习投资知识，确定投资目标' },
      { time: '第 4-6 个月', task: '选择投资产品，构建投资组合' },
      { time: '第 7-12 个月', task: '定期调仓，优化配置' }
    ]
  },
  {
    id: 'passive',
    name: '被动收入策略',
    icon: Medal,
    type: 'passive',
    shortDesc: '构建多元化被动收入体系',
    coreIdea: '建立多个独立的被动收入来源，降低对单一收入的依赖，提高财务安全感',
    estimatedTime: '长期',
    expectedIncome: 15000,
    isActive: false,
    recommendationLevel: 'medium',
    recommendationReason: '您的被动收入占比仅 30%，目标应提升至 50% 以上',
    steps: [
      '列出所有潜在被动收入来源',
      '评估每个来源的可行性',
      '选择 1-2 个优先级最高的',
      '开始执行',
      '定期评估和调整'
    ],
    cases: [
      { name: '租金收入', value: '¥2,000-5,000/月' },
      { name: '股息收入', value: '¥500-2,000/月' },
      { name: '版税收入', value: '¥200-1,000/月' },
      { name: '会员订阅', value: '¥1,000-3,000/月' }
    ]
  }
])

// 过滤后的策略
const filteredStrategies = computed(() => {
  if (activeFilter.value === 'all') {
    return allStrategies.value
  }
  return allStrategies.value.filter(s => s.type === activeFilter.value)
})

// 推荐策略
const recommendations = computed(() => {
  return allStrategies.value
    .filter(s => s.recommendationLevel === 'high')
    .slice(0, 3)
})

// 打开策略详情
const openStrategyDetail = (strategy: any) => {
  selectedStrategy.value = strategy
  dialogVisible.value = true
}

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
  selectedStrategy.value = null
}

// 应用策略
const applyStrategy = async () => {
  if (!selectedStrategy.value) return

  applying.value = true
  try {
    if (selectedStrategy.value.isActive) {
      ElMessage.success(t('incomeStrategies.continueSuccess'))
    } else {
      await ElMessageBox.confirm(
        t('incomeStrategies.confirmApplyStrategy', { name: selectedStrategy.value.name, amount: formatNumber(selectedStrategy.value.expectedIncome) }),
        t('incomeStrategies.confirmApplyTitle'),
        {
          confirmButtonText: t('incomeStrategies.confirmBtn'),
          cancelButtonText: t('incomeStrategies.cancelBtn'),
          type: 'warning'
        }
      )

      // 更新策略状态
      selectedStrategy.value.isActive = true
      selectedStrategy.value.appliedAt = new Date().toISOString().split('T')[0]

      // TODO: 调用 API 保存策略应用记录
      await incomeStore.applyStrategy(selectedStrategy.value.id)

      ElMessage.success(t('incomeStrategies.appliedSuccess', { name: selectedStrategy.value.name }))
      closeDialog()
    }
  } catch (error) {
    // 用户取消操作
  } finally {
    applying.value = false
  }
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 初始化
onMounted(() => {
  // TODO: 从后端加载策略数据
  loading.value = false
})
</script>

<style scoped>
.income-strategies {
  padding: 20px;
  background-color: var(--bg-body);
  min-height: 100vh;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-left p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.recommendation-card {
  margin-bottom: 20px;
  border: 2px solid var(--el-color-success);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tabs {
  display: flex;
  gap: 12px;
}

.strategies-card {
  margin-bottom: 20px;
}

.strategies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.strategy-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid var(--border-color);
}

.strategy-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.strategy-card.recommendation {
  border: 2px solid var(--el-color-success);
}

.strategy-card.is-active {
  border-color: var(--el-color-success);
  background-color: var(--el-color-primary-light-9);
}

.strategy-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.strategy-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.strategy-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.strategy-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.strategy-desc {
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.6;
  margin-bottom: 12px;
}

.strategy-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.strategy-reason {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f4f4f5;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-regular);
  display: flex;
  align-items: center;
  gap: 6px;
}

.strategy-detail {
  padding: 20px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.detail-section p {
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.8;
  margin: 0;
}

.cases-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.case-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #f4f4f5;
  border-radius: 4px;
}

.case-name {
  font-size: 14px;
  color: var(--text-regular);
}

.case-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.types-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-tag {
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.recommendations-content {
  padding: 20px 0;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
  }

  .header-right .el-button {
    width: 100%;
  }

  .strategies-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    flex-wrap: wrap;
  }

  .filter-tabs .el-radio-group {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
