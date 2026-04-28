<template>
  <div class="welcome-container" :class="{ 'is-dark': isDark }">
    <div class="welcome-card">
      <div class="welcome-header">
        <span class="welcome-icon">💰</span>
        <h1>欢迎使用财富自由之路</h1>
        <p>让我们开始你的财富自由之旅</p>
      </div>

      <el-steps :active="currentStep" align-center class="welcome-steps" finish-status="success">
        <el-step title="基本信息" icon="User" />
        <el-step title="财务现状" icon="Wallet" />
        <el-step title="目标设定" icon="Flag" />
      </el-steps>

      <!-- 步骤1：基本信息 -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="currentStep === 0" key="step0" class="step-content">
          <el-form :model="form" :rules="rules0" ref="formRef0" label-width="100px" class="welcome-form">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入你的名字" maxlength="20" />
            </el-form-item>
            <el-form-item label="每月收入" prop="monthlyIncome">
              <el-input-number
                v-model="form.monthlyIncome"
                :min="0"
                :precision="0"
                :step="1000"
                placeholder="税后收入"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item label="每月支出" prop="monthlyExpense">
              <el-input-number
                v-model="form.monthlyExpense"
                :min="0"
                :precision="0"
                :step="500"
                placeholder="基本生活开支"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
          </el-form>

          <div class="summary-box" v-if="form.monthlyIncome > 0">
            <p>每月结余：<span class="highlight" :class="{ negative: form.monthlyIncome - form.monthlyExpense < 0 }">{{ formatCurrency(form.monthlyIncome - form.monthlyExpense) }}</span></p>
            <p class="summary-note">
              储蓄率：<span :class="savingsRateClass">{{ savingsRate }}%</span>
              <el-tooltip v-if="savingsRate >= 50" content="优秀！储蓄率超过50%" placement="top">
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
            <el-form-item label="现金及存款">
              <el-input-number
                v-model="form.cashAssets"
                :min="0"
                :precision="0"
                :step="10000"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item label="投资资产">
              <el-input-number
                v-model="form.investmentAssets"
                :min="0"
                :precision="0"
                :step="10000"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item label="负债总额">
              <el-input-number
                v-model="form.totalDebt"
                :min="0"
                :precision="0"
                :step="10000"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
          </el-form>

          <div class="summary-box">
            <p>你的净资产：<span class="highlight" :class="{ negative: netWorth < 0 }">{{ formatCurrency(netWorth) }}</span></p>
            <p class="summary-note" v-if="netWorth >= 0">
              离财务保障还需：<span :class="shortfallClass">{{ formatCurrency(Math.max(0, form.monthlyExpense * 6 - netWorth)) }}</span>
            </p>
          </div>
        </div>
      </transition>

      <!-- 步骤3：目标设定 -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="currentStep === 2" key="step2" class="step-content">
          <div class="goal-intro">
            <h3>财务自由三阶段目标</h3>
            <p>系统会根据你的月支出自动计算目标金额</p>
          </div>

          <div class="goal-cards">
            <div class="goal-card" :class="{ achieved: netWorth >= form.monthlyExpense * 6 }">
              <div class="goal-icon">🛡️</div>
              <div class="goal-name">财务保障</div>
              <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 6) }}</div>
              <div class="goal-note">6个月支出</div>
              <el-progress
                v-if="netWorth > 0"
                :percentage="Math.min(100, Math.round(netWorth / (form.monthlyExpense * 6) * 100))"
                :stroke-width="6"
                :color="progressColors"
                style="margin-top: 8px"
              />
              <div v-if="netWorth >= form.monthlyExpense * 6" class="goal-check">✅ 已达成</div>
            </div>
            <div class="goal-card" :class="{ achieved: netWorth >= form.monthlyExpense * 150 }">
              <div class="goal-icon">🔒</div>
              <div class="goal-name">财务安全</div>
              <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 150) }}</div>
              <div class="goal-note">靠利息生活</div>
              <el-progress
                v-if="netWorth > 0"
                :percentage="Math.min(100, Math.round(netWorth / (form.monthlyExpense * 150) * 100))"
                :stroke-width="6"
                :color="progressColors"
                style="margin-top: 8px"
              />
              <div v-if="netWorth >= form.monthlyExpense * 150" class="goal-check">✅ 已达成</div>
            </div>
            <div class="goal-card" :class="{ achieved: netWorth >= form.monthlyExpense * 300 }">
              <div class="goal-icon">✨</div>
              <div class="goal-name">财务自由</div>
              <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 300) }}</div>
              <div class="goal-note">梦想生活</div>
              <el-progress
                v-if="netWorth > 0"
                :percentage="Math.min(100, Math.round(netWorth / (form.monthlyExpense * 300) * 100))"
                :stroke-width="6"
                :color="progressColors"
                style="margin-top: 8px"
              />
              <div v-if="netWorth >= form.monthlyExpense * 300" class="goal-check">✅ 已达成</div>
            </div>
          </div>

          <div class="goal-tip" v-if="form.monthlyExpense > 0">
            <el-icon><InfoFilled /></el-icon>
            以当前储蓄率 {{ savingsRate }}%，预计约 <strong>{{ estimatedYears }}</strong> 年达成财务安全
          </div>
        </div>
      </transition>

      <div class="welcome-actions">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 2" type="primary" @click="handleComplete" :loading="loading" size="large">
          🚀 开始使用
        </el-button>
      </div>

      <div class="demo-entry">
        <el-divider>或者</el-divider>
        <el-button type="warning" plain size="large" @click="handleDemoMode" :loading="demoLoading">
          🎮 体验演示模式
        </el-button>
        <p class="demo-hint">加载示例数据，快速体验全部功能</p>
        <el-button link type="info" size="small" @click="handleSkip" style="margin-top: 8px">
          跳过引导，直接进入 →
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAccountStore } from '@/stores/accounts'
import { useDebtStore } from '@/stores/debts'
import { useGoalStore } from '@/stores/goals'

const emit = defineEmits(['complete'])

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
  name: [{ required: true, message: '请输入你的名字', trigger: 'blur' }],
  monthlyIncome: [{ type: 'number' as const, min: 1, message: '请输入月收入', trigger: 'blur' }],
  monthlyExpense: [{ type: 'number' as const, min: 1, message: '请输入月支出', trigger: 'blur' }]
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

  try {
    const user = await userStore.createUser({
      name: form.value.name || '用户',
      settings: JSON.stringify({
        monthlyIncome: form.value.monthlyIncome,
        monthlyExpense: form.value.monthlyExpense
      })
    })

    if (form.value.cashAssets > 0) {
      await accountStore.createAccount({
        userId: user.id,
        name: '现金及存款',
        type: 'cash',
        balance: form.value.cashAssets,
        icon: '💵'
      })
    }

    if (form.value.investmentAssets > 0) {
      await accountStore.createAccount({
        userId: user.id,
        name: '投资资产',
        type: 'investment',
        balance: form.value.investmentAssets,
        icon: '📈'
      })
    }

    if (form.value.totalDebt > 0) {
      await debtStore.createDebt({
        userId: user.id,
        name: '负债',
        type: 'other',
        totalAmount: form.value.totalDebt,
        remainingAmount: form.value.totalDebt,
        monthlyPayment: 0,
        interestRate: 0
      })
    }

    const stages = [
      { stage: 'security' as const, targetAmount: form.value.monthlyExpense * 6 },
      { stage: 'safety' as const, targetAmount: form.value.monthlyExpense * 150 },
      { stage: 'freedom' as const, targetAmount: form.value.monthlyExpense * 300 }
    ]

    for (const goal of stages) {
      await goalStore.createGoal({
        userId: user.id,
        ...goal,
        currentAmount: netWorth.value > 0 ? netWorth.value : 0,
        targetDate: ''
      })
    }

    ElMessage.success('初始化成功！开始你的财务自由之旅吧！')
    emit('complete')
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('初始化失败，请检查输入信息后重试')
  } finally {
    loading.value = false
  }
}

const handleDemoMode = async () => {
  if (demoLoading.value) return
  demoLoading.value = true
  try {
    const result = await (window as any).electronAPI.demo.seed()
    if (result.success) {
      ElMessage.success('演示数据已加载！正在进入...')
      emit('complete')
    }
  } catch (error) {
    console.error('演示模式加载失败:', error)
    ElMessage.error('演示数据加载失败')
  } finally {
    demoLoading.value = false
  }
}

const handleSkip = async () => {
  try {
    await userStore.createUser({
      name: '用户',
      settings: JSON.stringify({ monthlyIncome: 0, monthlyExpense: 0 })
    })
    ElMessage.success('已跳过引导')
    emit('complete')
  } catch (error) {
    console.error('跳过失败:', error)
    ElMessage.error('操作失败')
  }
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
  background: #fff;
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
    color: #303133;
    margin-bottom: 8px;

    .is-dark & {
      color: #e0e0e0;
    }
  }

  p {
    color: #909399;
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
    color: #909399;
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
