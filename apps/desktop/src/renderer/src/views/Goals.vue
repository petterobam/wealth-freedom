<template>
  <div class="goals-page">
    <h1 class="page-title">{{ t('goals.title') }}</h1>
    <p class="page-desc">{{ t('goals.subtitle') }}</p>

    <div class="goals-container">
      <!-- 财务保障 -->
      <div class="goal-section">
        <div class="goal-header">
          <div class="goal-icon">🛡️</div>
          <div class="goal-info">
            <h2>{{ t('goals.security') }}</h2>
            <p>{{ t('goals.securityDesc') }}</p>
          </div>
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <el-progress 
              :percentage="securityProgress" 
              :stroke-width="20"
              :color="securityProgress >= 100 ? '#67c23a' : '#4facfe'"
            />
          </div>
          <div class="progress-info">
            <div class="info-item">
              <span class="label">{{ t('goals.targetAmount') }}</span>
              <span class="value">{{ formatCurrency(securityGoal?.targetAmount || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ t('goals.currentReserve') }}</span>
              <span class="value highlight">{{ formatCurrency(netWorth) }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ t('goals.gap') }}</span>
              <span class="value">{{ formatCurrency(securityGap) }}</span>
            </div>
          </div>
        </div>

        <!-- 理论洞察 -->
        <div class="theory-insight" v-if="securityProgress < 100">
          <el-icon><Sunny /></el-icon>
          <div class="insight-content">
            <strong>{{ t('goals.securityInsightTitle') }}</strong>
            <p>{{ t('goals.securityInsightDesc') }}</p>
          </div>
        </div>
        <div class="achievement-tip" v-else>
          <el-icon><SuccessFilled /></el-icon>
          <span>{{ t('goals.securityAchieved') }}</span>
        </div>
      </div>

      <!-- 财务安全 -->
      <div class="goal-section">
        <div class="goal-header">
          <div class="goal-icon">🔒</div>
          <div class="goal-info">
            <h2>{{ t('goals.safety') }}</h2>
            <p>{{ t('goals.safetyDesc') }}</p>
          </div>
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <el-progress 
              :percentage="safetyProgress" 
              :stroke-width="20"
              :color="safetyProgress >= 100 ? '#67c23a' : '#4facfe'"
            />
          </div>
          <div class="progress-info">
            <div class="info-item">
              <span class="label">{{ t('goals.targetAmount') }}</span>
              <span class="value">{{ formatCurrency(safetyGoal?.targetAmount || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ t('goals.currentInvestable') }}</span>
              <span class="value highlight">{{ formatCurrency(netWorth) }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ t('goals.estimatedArrival') }}</span>
              <span class="value">{{ calculateETA(safetyGoal) }}</span>
            </div>
          </div>
          <div class="goal-formula">
            <el-icon><InfoFilled /></el-icon>
            {{ t('goals.formula') }}
          </div>
        </div>

        <!-- 理论洞察 -->
        <div class="theory-insight" v-if="safetyProgress < 100">
          <el-icon><Sunny /></el-icon>
          <div class="insight-content">
            <strong>{{ t('goals.safetyInsightTitle') }}</strong>
            <p>{{ t('goals.safetyInsightDesc') }}</p>
          </div>
        </div>
        <div class="achievement-tip" v-else>
          <el-icon><SuccessFilled /></el-icon>
          <span>{{ t('goals.safetyAchieved') }}</span>
        </div>
      </div>

      <!-- 财务自由 -->
      <div class="goal-section freedom">
        <div class="goal-header">
          <div class="goal-icon">✨</div>
          <div class="goal-info">
            <h2>{{ t('goals.freedom') }}</h2>
            <p>{{ t('goals.freedomDesc') }}</p>
          </div>
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <el-progress 
              :percentage="freedomProgress" 
              :stroke-width="20"
              color="linear-gradient(90deg, #4facfe, #00f2fe)"
            />
          </div>
          <div class="progress-info">
            <div class="info-item">
              <span class="label">{{ t('goals.targetAmount') }}</span>
              <span class="value">{{ formatCurrency(freedomGoal?.targetAmount || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ t('goals.currentAssets') }}</span>
              <span class="value highlight">{{ formatCurrency(freedomGoal?.currentAmount || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ t('goals.dreamMonthlyExpense') }}</span>
              <span class="value">{{ formatCurrency((freedomGoal?.targetAmount || 0) / 150) }}</span>
            </div>
          </div>
          <div class="goal-actions">
            <el-button type="primary" @click="$router.push('/dreams')">
              <el-icon><PictureFilled /></el-icon>
              {{ t('goals.editDreamBoard') }}
            </el-button>
          </div>
        </div>

        <!-- 理论洞察 -->
        <div class="theory-insight" v-if="freedomProgress < 100">
          <el-icon><Sunny /></el-icon>
          <div class="insight-content">
            <strong>{{ t('goals.freedomInsightTitle') }}</strong>
            <p>{{ t('goals.freedomInsightDesc') }}</p>
          </div>
        </div>
        <div class="achievement-tip" v-else>
          <el-icon><SuccessFilled /></el-icon>
          <span>{{ t('goals.freedomAchieved') }}</span>
        </div>
      </div>
    </div>

    <!-- 时间路径预测 -->
    <div class="timeline-section" v-if="timelineResult">
      <h2 class="section-title">
        <el-icon><Clock /></el-icon>
        {{ t('goals.timelineTitle') }}
      </h2>
      <p class="section-desc">{{ t('goals.timelineDesc') }}</p>
      
      <div class="timeline-cards">
        <div class="timeline-card" v-for="(milestone, key) in timelineResult.milestones" :key="key">
          <div class="timeline-header">
            <span class="timeline-icon">{{ getMilestoneIcon(key) }}</span>
            <span class="timeline-name">{{ milestone.name }}</span>
          </div>
          <div class="timeline-body">
            <div class="timeline-time">
              <span class="time-value" v-if="milestone.years > 0">{{ milestone.years }} {{ t('goals.yearUnit') }}</span>
              <span class="time-value" v-if="milestone.months > 0">{{ milestone.months }} {{ t('goals.monthUnit') }}</span>
              <span class="time-value" v-if="milestone.totalMonths === 0">{{ t('goals.achieved') }}</span>
            </div>
            <div class="timeline-amount">
              {{ t('goals.targetLabel') }}{{ formatCurrency(milestone.targetAmount) }}
            </div>
            <el-progress 
              :percentage="Math.round(milestone.currentProgress * 100)" 
              :stroke-width="8"
              :color="key === 'freedom' ? '#667eea' : '#4facfe'"
            />
          </div>
        </div>
      </div>

      <!-- 关键指标 -->
      <div class="key-metrics">
        <div class="metric">
          <span class="metric-label">{{ t('goals.first100k') }}</span>
          <span class="metric-value">{{ timelineResult.keyMetrics.first100k.years }}{{ t('goals.yearUnit') }}{{ timelineResult.keyMetrics.first100k.months }}{{ t('goals.monthUnit') }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t('goals.firstDoubling') }}</span>
          <span class="metric-value">{{ timelineResult.keyMetrics.firstDoubling.years }}{{ t('goals.yearUnit') }}{{ timelineResult.keyMetrics.firstDoubling.months }}{{ t('goals.monthUnit') }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t('goals.passiveIncomeAtFreedom') }}</span>
          <span class="metric-value">{{ formatCurrency(timelineResult.keyMetrics.passiveIncomeAtFreedom) }}{{ t('goals.perMonth') }}</span>
        </div>
      </div>

      <!-- 参数调节 -->
      <div class="params-adjust">
        <div class="param-item">
          <span class="param-label">{{ t('goals.savingsRateLabel') }}</span>
          <el-slider v-model="timelineParams.savingsRate" :min="10" :max="60" :step="5" :format-tooltip="(v: number) => `${v}%`" />
        </div>
        <div class="param-item">
          <span class="param-label">{{ t('goals.annualReturnLabel') }}</span>
          <el-slider v-model="timelineParams.annualReturnRate" :min="4" :max="15" :step="1" :format-tooltip="(v: number) => `${v}%`" />
        </div>
        <el-button type="primary" size="small" @click="recalculateTimeline">{{ t('goals.recalculate') }}</el-button>
      </div>
    </div>

    <!-- 更新目标 -->
    <div class="update-section">
      <el-button @click="showUpdateDialog = true">{{ t('goals.updateProgress') }}</el-button>
    </div>

    <el-dialog v-model="showUpdateDialog" :title="t('goals.updateGoal')" width="500px">
      <el-form :model="updateForm" label-width="120px">
        <el-form-item :label="t('goals.selectStage')">
          <el-select v-model="updateForm.stage" :placeholder="t('goals.selectStagePlaceholder')">
            <el-option :label="t('goals.security')" value="security" />
            <el-option :label="t('goals.safety')" value="safety" />
            <el-option :label="t('goals.freedom')" value="freedom" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('goals.currentAmount')">
          <el-input-number v-model="updateForm.currentAmount" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item :label="t('goals.targetDate')">
          <el-date-picker v-model="updateForm.targetDate" type="date" :placeholder="t('goals.selectTargetDate')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpdateDialog = false">{{ t('dashboard.cancel') }}</el-button>
        <el-button type="primary" @click="handleUpdateGoal">{{ t('dashboard.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { InfoFilled, PictureFilled, Clock, Sunny, SuccessFilled } from '@element-plus/icons-vue'
import { useGoalStore } from '@/stores/goals'
import { useAccountStore } from '@/stores/accounts'
import { useDebtStore } from '@/stores/debts'
import { useTransactionStore } from '@/stores/transactions'
// import { calculateFreedomTimeline, FreedomTimelineOutput, FreedomTimelineInput } from '@wealth-freedom/shared/calculators/freedom-timeline'
import dayjs from 'dayjs'
import { useI18n } from '@/i18n'

const { t } = useI18n()

// 临时定义类型（避免导入错误）
interface FreedomTimelineOutput {
  milestones: any
  yearlyProgress: any[]
  keyMetrics: any
}

const goalStore = useGoalStore()
const accountStore = useAccountStore()
const debtStore = useDebtStore()
const transactionStore = useTransactionStore()

const showUpdateDialog = ref(false)
const updateForm = ref({
  stage: 'security' as 'security' | 'safety' | 'freedom',
  currentAmount: 0,
  targetDate: ''
})

// 时间路径计算
const timelineResult = ref<FreedomTimelineOutput | null>(null)
const timelineParams = ref({
  savingsRate: 20,
  annualReturnRate: 8
})

const securityGoal = computed(() => goalStore.securityGoal)
const safetyGoal = computed(() => goalStore.safetyGoal)
const freedomGoal = computed(() => goalStore.freedomGoal)

const netWorth = computed(() => accountStore.totalAssets - debtStore.totalDebt)

const securityProgress = computed(() => {
  if (!securityGoal.value) return 0
  return Math.min(100, Math.round((netWorth.value / securityGoal.value.targetAmount) * 100))
})

const safetyProgress = computed(() => {
  if (!safetyGoal.value) return 0
  return Math.min(100, Math.round((netWorth.value / safetyGoal.value.targetAmount) * 100))
})

const freedomProgress = computed(() => {
  if (!freedomGoal.value) return 0
  return Math.min(100, Math.round((netWorth.value / freedomGoal.value.targetAmount) * 100))
})

const securityGap = computed(() => {
  if (!securityGoal.value) return 0
  return Math.max(0, securityGoal.value.targetAmount - netWorth.value)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const calculateETA = (goal: { targetAmount: number; currentAmount: number } | null) => {
  if (!goal) return '—'
  const gap = goal.targetAmount - netWorth.value
  if (gap <= 0) return t('goals.achieved')

  // 假设每月储蓄 20000（基于用户的月结余）
  const months = Math.ceil(gap / 20000)
  if (months > 120) return `${Math.round(months / 12)} ${t('goals.yearUnit')}`
  return `${months} ${t('goals.monthUnit')}`
}

const handleUpdateGoal = async () => {
  const goalMap = {
    security: securityGoal.value,
    safety: safetyGoal.value,
    freedom: freedomGoal.value
  }
  
  const goal = goalMap[updateForm.value.stage]
  if (goal) {
    await goalStore.updateGoal(goal.id, {
      currentAmount: updateForm.value.currentAmount,
      targetDate: updateForm.value.targetDate ? dayjs(updateForm.value.targetDate).format('YYYY-MM-DD') : ''
    })
  }
  
  showUpdateDialog.value = false
}

// 时间路径计算
const recalculateTimeline = () => {
  const input: FreedomTimelineInput = {
    currentNetAssets: netWorth.value,
    monthlyIncome: transactionStore.monthlyIncome || 10000,
    monthlyExpense: transactionStore.monthlyExpense || 8000,
    savingsRate: timelineParams.value.savingsRate / 100,
    annualRaiseRate: 0.05,
    annualReturnRate: timelineParams.value.annualReturnRate / 100,
    securityMonths: 6,
    monthlyBasicLiving: transactionStore.monthlyExpense || 8000,
    monthlyDreamLiving: 20000
  }
  
  timelineResult.value = null // calculateFreedomTimeline(input)
}

const getMilestoneIcon = (key: string) => {
  const icons: Record<string, string> = {
    security: '🛡️',
    safety: '🔒',
    freedom: '✨'
  }
  return icons[key] || '🎯'
}

// 数据变化时重新计算
watch([() => netWorth.value, () => transactionStore.monthlyIncome, () => transactionStore.monthlyExpense], () => {
  if (netWorth.value > 0) {
    recalculateTimeline()
  }
})

onMounted(async () => {
  await Promise.all([
    goalStore.fetchGoals(),
    accountStore.fetchAccounts(),
    debtStore.fetchDebts(),
    transactionStore.fetchTransactions()
  ])
  
  // 加载完成后计算时间路径
  recalculateTimeline()
})
</script>

<style lang="scss" scoped>
.goals-page {
  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .page-desc {
    color: #909399;
    margin-bottom: 24px;
  }

  .goals-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .goal-section {
    background: #fff;
    border-radius: 16px;
    padding: 24px;

    &.freedom {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;

      .goal-header h2,
      .goal-header p {
        color: #fff;
      }

      .progress-info .label {
        color: rgba(255, 255, 255, 0.8);
      }

      .progress-info .value {
        color: #fff;
      }

      .goal-formula {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .goal-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    .goal-icon {
      font-size: 48px;
    }

    .goal-info {
      h2 {
        font-size: 20px;
        margin-bottom: 4px;
      }

      p {
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .goal-progress {
    .progress-bar {
      margin-bottom: 20px;
    }

    .progress-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 16px;

      .info-item {
        .label {
          display: block;
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .value {
          font-size: 18px;
          font-weight: 600;

          &.highlight {
            color: #4facfe;
          }
        }
      }
    }

    .goal-formula {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      font-size: 13px;
      color: #606266;
    }

    .goal-actions {
      margin-top: 16px;
    }
  }

  .update-section {
    margin-top: 24px;
    text-align: center;
  }

  .timeline-section {
    margin-top: 32px;
    padding: 24px;
    background: #f8f9fb;
    border-radius: 16px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .section-desc {
      color: #909399;
      font-size: 14px;
      margin-bottom: 20px;
    }
  }

  .timeline-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .timeline-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);

    .timeline-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;

      .timeline-icon {
        font-size: 24px;
      }

      .timeline-name {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .timeline-time {
      margin-bottom: 12px;

      .time-value {
        display: inline-block;
        font-size: 20px;
        font-weight: 700;
        color: #4facfe;
        margin-right: 8px;
      }
    }

    .timeline-amount {
      font-size: 13px;
      color: #909399;
      margin-bottom: 12px;
    }
  }

  .key-metrics {
    display: flex;
    gap: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    margin-bottom: 20px;

    .metric {
      flex: 1;
      text-align: center;

      .metric-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .params-adjust {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 12px;

    .param-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;

      .param-label {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
      }

      .el-slider {
        flex: 1;
      }
    }
  }

  .theory-insight {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #fff9e6;
    border-left: 4px solid #ffc107;
    border-radius: 8px;
    margin-top: 16px;

    .el-icon {
      color: #ffc107;
      font-size: 20px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .insight-content {
      flex: 1;

      strong {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 6px;
      }

      p {
        font-size: 13px;
        color: #606266;
        line-height: 1.6;
        margin: 0;
      }
    }
  }

  .achievement-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: #f0f9ff;
    border-left: 4px solid #67c23a;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
    color: #606266;

    .el-icon {
      color: #67c23a;
      font-size: 20px;
    }
  }
}
</style>
