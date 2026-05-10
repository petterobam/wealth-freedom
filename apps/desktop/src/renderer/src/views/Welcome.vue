<template>
  <div class="welcome-container" :class="{ 'is-dark': isDark }">
    <div class="welcome-card">
      <div class="welcome-header">
        <span class="welcome-icon">💰</span>
        <h1>{{ t('welcome.title') }}</h1>
        <p>{{ t('welcome.subtitle') }}</p>
      </div>

      <el-steps :active="currentStep" align-center class="welcome-steps" finish-status="success">
        <el-step :title="t('welcome.steps.basicInfo')" icon="User" />
        <el-step :title="t('welcome.steps.financialStatus')" icon="Wallet" />
        <el-step :title="t('welcome.steps.goalSetting')" icon="Flag" />
      </el-steps>

      <!-- 步骤1：基本信息 -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="currentStep === 0" key="step0" class="step-content">
          <el-form :model="form" :rules="rules0" ref="formRef0" label-width="100px" class="welcome-form">
            <el-form-item :label="t('welcome.form.name')" prop="name">
              <el-input v-model="form.name" :placeholder="t('welcome.form.namePlaceholder')" maxlength="20" />
            </el-form-item>
            <el-form-item :label="t('welcome.form.monthlyIncome')" prop="monthlyIncome">
              <el-input-number
                v-model="form.monthlyIncome"
                :min="0"
                :precision="0"
                :step="1000"
                :placeholder="t('welcome.form.afterTax')"
                style="width: 200px"
              />
              <span class="unit">{{ t('welcome.form.unit') }}</span>
            </el-form-item>
            <el-form-item :label="t('welcome.form.monthlyExpense')" prop="monthlyExpense">
              <el-input-number
                v-model="form.monthlyExpense"
                :min="0"
                :precision="0"
                :step="500"
                :placeholder="t('welcome.form.livingExpenses')"
                style="width: 200px"
              />
              <span class="unit">{{ t('welcome.form.unit') }}</span>
            </el-form-item>
          </el-form>

          <div class="summary-box" v-if="form.monthlyIncome > 0">
            <p>{{ t('welcome.monthlyBalance') }}<span class="highlight" :class="{ negative: form.monthlyIncome - form.monthlyExpense < 0 }">{{ formatCurrency(form.monthlyIncome - form.monthlyExpense) }}</span></p>
            <p class="summary-note">
              {{ t('welcome.savingsRate') }}<span :class="savingsRateClass">{{ savingsRate }}%</span>
              <el-tooltip v-if="savingsRate >= 50" :content="t('welcome.savingsRateTip')" placement="top">
                <el-tag type="success" size="small" style="margin-left: 8px">🏆</el-tag>
              </el-tooltip>
            </p>
          </div>
        </div>
      </transition>

      <!-- 步骤2：财务现状 -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="currentStep === 1" key="step1" class="step-content">
          <el-form :model="form" label-width="120px" class="welcome-form">
            <el-form-item :label="t('welcome.form.cashAssets')">
              <el-input-number
                v-model="form.cashAssets"
                :min="0"
                :precision="0"
                :step="10000"
                style="width: 200px"
              />
              <span class="unit">{{ t('welcome.form.unit') }}</span>
            </el-form-item>
            <el-form-item :label="t('welcome.form.investmentAssets')">
              <el-input-number
                v-model="form.investmentAssets"
                :min="0"
                :precision="0"
                :step="10000"
                style="width: 200px"
              />
              <span class="unit">{{ t('welcome.form.unit') }}</span>
            </el-form-item>
            <el-form-item :label="t('welcome.form.totalDebt')">
              <el-input-number
                v-model="form.totalDebt"
                :min="0"
                :precision="0"
                :step="10000"
                style="width: 200px"
              />
              <span class="unit">{{ t('welcome.form.unit') }}</span>
            </el-form-item>
          </el-form>

          <div class="summary-box">
            <p>{{ t('welcome.yourNetWorth') }}<span class="highlight" :class="{ negative: netWorth < 0 }">{{ formatCurrency(netWorth) }}</span></p>
            <p class="summary-note" v-if="netWorth >= 0">
              {{ t('welcome.gapToSecurity', { amount: formatCurrency(Math.max(0, form.monthlyExpense * 6 - netWorth)) }) }}
            </p>
          </div>
        </div>
      </transition>

      <!-- 步骤3：目标设定 -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="currentStep === 2" key="step2" class="step-content">
          <div class="goal-intro">
            <h3>{{ t('welcome.goals.threeStages') }}</h3>
            <p>{{ t('welcome.goals.autoCalculate') }}</p>
          </div>

          <div class="goal-cards">
            <div class="goal-card" :class="{ achieved: netWorth >= form.monthlyExpense * 6 }">
              <div class="goal-icon">🛡️</div>
              <div class="goal-name">{{ t('welcome.goals.security') }}</div>
              <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 6) }}</div>
              <div class="goal-note">{{ t('welcome.goals.sixMonths') }}</div>
              <el-progress
                v-if="netWorth > 0"
                :percentage="Math.min(100, Math.round(netWorth / (form.monthlyExpense * 6) * 100))"
                :stroke-width="6"
                :color="progressColors"
                style="margin-top: 8px"
              />
              <div v-if="netWorth >= form.monthlyExpense * 6" class="goal-check">✅ {{ t('welcome.goals.achieved') }}</div>
            </div>
            <div class="goal-card" :class="{ achieved: netWorth >= form.monthlyExpense * 150 }">
              <div class="goal-icon">🔒</div>
              <div class="goal-name">{{ t('welcome.goals.safety') }}</div>
              <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 150) }}</div>
              <div class="goal-note">{{ t('welcome.goals.liveOnInterest') }}</div>
              <el-progress
                v-if="netWorth > 0"
                :percentage="Math.min(100, Math.round(netWorth / (form.monthlyExpense * 150) * 100))"
                :stroke-width="6"
                :color="progressColors"
                style="margin-top: 8px"
              />
              <div v-if="netWorth >= form.monthlyExpense * 150" class="goal-check">✅ {{ t('welcome.goals.achieved') }}</div>
            </div>
            <div class="goal-card" :class="{ achieved: netWorth >= form.monthlyExpense * 300 }">
              <div class="goal-icon">✨</div>
              <div class="goal-name">{{ t('welcome.goals.freedom') }}</div>
              <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 300) }}</div>
              <div class="goal-note">{{ t('welcome.goals.dreamLife') }}</div>
              <el-progress
                v-if="netWorth > 0"
                :percentage="Math.min(100, Math.round(netWorth / (form.monthlyExpense * 300) * 100))"
                :stroke-width="6"
                :color="progressColors"
                style="margin-top: 8px"
              />
              <div v-if="netWorth >= form.monthlyExpense * 300" class="goal-check">✅ {{ t('welcome.goals.achieved') }}</div>
            </div>
          </div>

          <div class="goal-tip" v-if="form.monthlyExpense > 0">
            <el-icon><InfoFilled /></el-icon>
            {{ t('welcome.estimatedYears', { rate: savingsRate, years: estimatedYears }) }}
          </div>
        </div>
      </transition>

      <div class="welcome-actions">
        <el-button v-if="currentStep > 0" @click="prevStep">{{ t('welcome.previousStep') }}</el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep">{{ t('welcome.nextStep') }}</el-button>
        <el-button v-if="currentStep === 2" type="primary" @click="handleComplete" :loading="loading" size="large">
          🚀 {{ t('welcome.startUsing') }}
        </el-button>
      </div>

      <div class="demo-entry">
        <el-divider>{{ t('welcome.or') }}</el-divider>
        <el-button type="warning" plain size="large" @click="handleDemoMode" :loading="demoLoading">
          🎮 {{ t('welcome.demoMode') }}
        </el-button>
        <p class="demo-hint">{{ t('welcome.demoHint') }}</p>
        <el-button link type="info" size="small" @click="handleSkip" style="margin-top: 8px">
          {{ t('welcome.skipGuide') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AccountType, DebtType, GoalType, GoalStatus, DEFAULT_USER_SETTINGS } from '@wealth-freedom/shared'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAccountStore } from '@/stores/accounts'
import { useDebtStore } from '@/stores/debts'
import { useGoalStore } from '@/stores/goals'
import { useI18n } from '@/i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { safeCall } = useErrorHandler()

const emit = defineEmits(['complete'])

const { t } = useI18n()
const userStore = useUserStore()
const accountStore = useAccountStore()
const debtStore = useDebtStore()
const goalStore = useGoalStore()

const currentStep = ref(0)
const loading = ref(false)
const demoLoading = ref(false)
const formRef0 = ref()

const isDark = computed(() => {
  return document.documentElement.classList.contains('dark')
})

const form = ref({
  name: '',
  monthlyIncome: 0,
  monthlyExpense: 5000,
  cashAssets: 0,
  investmentAssets: 0,
  totalDebt: 0
})

const rules0 = {
  name: [{ required: true, message: t('welcome.form.nameRequired'), trigger: 'blur' }],
  monthlyIncome: [{ type: 'number' as const, min: 1, message: t('welcome.form.incomeRequired'), trigger: 'blur' }],
  monthlyExpense: [{ type: 'number' as const, min: 1, message: t('welcome.form.expenseRequired'), trigger: 'blur' }]
}

const netWorth = computed(() => {
  return form.value.cashAssets + form.value.investmentAssets - form.value.totalDebt
})

const savingsRate = computed(() => {
  if (form.value.monthlyIncome <= 0) return 0
  return Math.round((form.value.monthlyIncome - form.value.monthlyExpense) / form.value.monthlyIncome * 100)
})

const savingsRateClass = computed(() => {
  const r = savingsRate.value
  if (r >= 50) return 'rate-excellent'
  if (r >= 30) return 'rate-good'
  if (r >= 0) return 'rate-normal'
  return 'rate-danger'
})

const shortfallClass = computed(() => {
  return netWorth.value >= form.value.monthlyExpense * 6 ? 'rate-excellent' : ''
})

const estimatedYears = computed(() => {
  const monthly = form.value.monthlyIncome - form.value.monthlyExpense
  if (monthly <= 0) return '∞'
  const target = form.value.monthlyExpense * 150
  const months = Math.max(0, (target - netWorth.value)) / monthly
  return months <= 0 ? '0' : Math.ceil(months / 12).toString()
})

const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#409eff', percentage: 70 },
  { color: '#67c23a', percentage: 100 }
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const nextStep = async () => {
  if (currentStep.value === 0 && formRef0.value) {
    try {
      await formRef0.value.validate()
    } catch {
      return
    }
  }
  if (currentStep.value < 2) currentStep.value++
}

const handleComplete = async () => {
  if (loading.value) return
  loading.value = true
  await safeCall(async () => {
    const user = await userStore.createUser({
      name: form.value.name || t('welcome.defaultUser'),
      settings: {
        language: 'zh',
        theme: 'light',
        startDayOfMonth: 1,
        guaranteeMonths: 6,
        expectedReturnRate: 0.04
      }
    })

    if (form.value.cashAssets > 0) {
      await accountStore.createAccount({
        userId: user.id,
        name: t('welcome.accounts.cash'),
        type: AccountType.CASH,
        balance: form.value.cashAssets,
        icon: '💵',
        color: '#67C23A',
        currency: 'CNY',
        isReserved: false,
        includeInNetWorth: true
      })
    }

    if (form.value.investmentAssets > 0) {
      await accountStore.createAccount({
        userId: user.id,
        name: t('welcome.accounts.investment'),
        type: AccountType.INVESTMENT,
        balance: form.value.investmentAssets,
        icon: '📈',
        color: '#409EFF',
        currency: 'CNY',
        isReserved: false,
        includeInNetWorth: true
      })
    }

    if (form.value.totalDebt > 0) {
      await debtStore.createDebt({
        userId: user.id,
        name: t('welcome.accounts.debt'),
        type: DebtType.OTHER,
        totalAmount: form.value.totalDebt,
        remainingAmount: form.value.totalDebt,
        monthlyPayment: 0,
        interestRate: 0,
        isPaidOff: false
      })
    }

    const stages = [
      { type: GoalType.GUARANTEE, targetAmount: form.value.monthlyExpense * 6 },
      { type: GoalType.SECURITY, targetAmount: form.value.monthlyExpense * 150 },
      { type: GoalType.FREEDOM, targetAmount: form.value.monthlyExpense * 300 }
    ]

    for (const goal of stages) {
      await goalStore.createGoal({
        userId: user.id,
        type: goal.type,
        targetAmount: goal.targetAmount,
        currentAmount: netWorth.value > 0 ? netWorth.value : 0,
        monthlyExpense: form.value.monthlyExpense,
        status: GoalStatus.IN_PROGRESS
      })
    }

    ElMessage.success(t('welcome.initSuccess'))
    emit('complete')
  })
  loading.value = false
}

const handleDemoMode = async () => {
  if (demoLoading.value) return
  demoLoading.value = true
  await safeCall(async () => {
    const result = await (window as any).electronAPI.demo.seed()
    if (result.success) {
      ElMessage.success(t('welcome.demoLoaded'))
      emit('complete')
    }
  })
  demoLoading.value = false
}

const handleSkip = async () => {
  await safeCall(async () => {
    await userStore.createUser({
      name: t('welcome.defaultUser'),
      currency: 'CNY',
      settings: { ...DEFAULT_USER_SETTINGS } as any
    })
    ElMessage.success(t('welcome.skipped'))
    emit('complete')
  })
}
</script>

<style lang="scss" scoped>
.welcome-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: background 0.3s ease;

  &.is-dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
}

.welcome-card {
  width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: cardAppear 0.5s ease-out;

  .is-dark & {
    background: #1e1e2e;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.welcome-header {
  text-align: center;
  margin-bottom: 30px;

  .welcome-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 10px;
  }

  h1 {
    font-size: 24px;
    color: var(--text-primary);
    margin-bottom: 8px;

    .is-dark & {
      color: var(--text-primary);
    }
  }

  p {
    color: var(--text-secondary);
  }
}

.welcome-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 200px;
}

.welcome-form {
  max-width: 420px;
  margin: 0 auto;

  .unit {
    margin-left: 10px;
    color: var(--text-secondary);
  }
}

.summary-box {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 10px;
  margin-top: 20px;
  transition: background 0.3s ease;

  .is-dark & {
    background: #2a2a3e;
  }

  .highlight {
    font-size: 24px;
    font-weight: 700;
    color: #67c23a;

    &.negative {
      color: #f56c6c;
    }
  }
}

.summary-note {
  margin-top: 4px;
  font-size: 14px;
  color: #909399;
}

.rate-excellent { color: #67c23a; font-weight: 600; }
.rate-good { color: #409eff; font-weight: 600; }
.rate-normal { color: #e6a23c; }
.rate-danger { color: #f56c6c; font-weight: 600; }

.goal-intro {
  text-align: center;
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  p {
    color: #909399;
    font-size: 14px;
  }
}

.goal-cards {
  display: flex;
  gap: 16px;
}

.goal-card {
  flex: 1;
  text-align: center;
  padding: 20px 16px;
  background: #f5f7fa;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  .is-dark & {
    background: #2a2a3e;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.achieved {
    border-color: #67c23a;
    background: #f0f9eb;

    .is-dark & {
      background: #1a2e1a;
      border-color: #67c23a;
    }
  }

  .goal-icon {
    font-size: 32px;
    margin-bottom: 10px;
  }

  .goal-name {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .goal-amount {
    font-size: 15px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 6px;
  }

  .goal-note {
    font-size: 12px;
    color: #909399;
  }

  .goal-check {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #67c23a;
  }
}

.goal-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px;
  background: #ecf5ff;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;

  .is-dark & {
    background: #1a2a3e;
    color: #b0b0b0;
  }
}

.welcome-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
}

.demo-entry {
  text-align: center;
  margin-top: 10px;

  .demo-hint {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
  }
}
</style>
