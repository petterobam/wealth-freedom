<template>
  <div class="welcome-container">
    <div class="welcome-card">
      <div class="welcome-header">
        <span class="welcome-icon">💰</span>
        <h1>欢迎使用财富自由之路</h1>
        <p>让我们开始你的财富自由之旅</p>
      </div>

      <el-steps :active="currentStep" align-center class="welcome-steps">
        <el-step title="基本信息" />
        <el-step title="财务现状" />
        <el-step title="目标设定" />
      </el-steps>

      <!-- 步骤1：基本信息 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form :model="form" label-width="100px" class="welcome-form">
          <el-form-item label="姓名">
            <el-input v-model="form.name" placeholder="请输入你的名字" />
          </el-form-item>
          <el-form-item label="每月收入">
            <el-input-number 
              v-model="form.monthlyIncome" 
              :min="0" 
              :precision="0"
              placeholder="税后收入"
              style="width: 200px"
            />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="每月支出">
            <el-input-number 
              v-model="form.monthlyExpense" 
              :min="0" 
              :precision="0"
              placeholder="基本生活开支"
              style="width: 200px"
            />
            <span class="unit">元</span>
          </el-form-item>
        </el-form>

        <div class="summary-box" v-if="form.monthlyIncome > 0">
          <p>每月结余：<span class="highlight">{{ formatCurrency(form.monthlyIncome - form.monthlyExpense) }}</span></p>
          <p class="summary-note">储蓄率：{{ Math.round((form.monthlyIncome - form.monthlyExpense) / form.monthlyIncome * 100) }}%</p>
        </div>
      </div>

      <!-- 步骤2：财务现状 -->
      <div v-show="currentStep === 1" class="step-content">
        <el-form :model="form" label-width="120px" class="welcome-form">
          <el-form-item label="现金及存款">
            <el-input-number 
              v-model="form.cashAssets" 
              :min="0" 
              :precision="0"
              style="width: 200px"
            />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="投资资产">
            <el-input-number 
              v-model="form.investmentAssets" 
              :min="0" 
              :precision="0"
              style="width: 200px"
            />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="负债总额">
            <el-input-number 
              v-model="form.totalDebt" 
              :min="0" 
              :precision="0"
              style="width: 200px"
            />
            <span class="unit">元</span>
          </el-form-item>
          <el-form-item label="月收入">
            <el-input-number 
              v-model="form.monthlyIncome" 
              :min="0" 
              :precision="0"
              style="width: 200px"
            />
            <span class="unit">元</span>
          </el-form-item>
        </el-form>

        <div class="summary-box">
          <p>你的净资产：<span class="highlight">{{ formatCurrency(netWorth) }}</span></p>
        </div>
      </div>

      <!-- 步骤3：目标设定 -->
      <div v-show="currentStep === 2" class="step-content">
        <div class="goal-intro">
          <h3>财务自由三阶段目标</h3>
          <p>系统会根据你的月支出自动计算目标金额</p>
        </div>

        <div class="goal-cards">
          <div class="goal-card">
            <div class="goal-icon">🛡️</div>
            <div class="goal-name">财务保障</div>
            <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 6) }}</div>
            <div class="goal-note">6个月支出</div>
          </div>
          <div class="goal-card">
            <div class="goal-icon">🔒</div>
            <div class="goal-name">财务安全</div>
            <div class="goal-amount">{{ formatCurrency(form.monthlyExpense * 150) }}</div>
            <div class="goal-note">靠利息生活</div>
          </div>
          <div class="goal-card">
            <div class="goal-icon">✨</div>
            <div class="goal-name">财务自由</div>
            <div class="goal-amount">{{ formatCurrency((form.monthlyExpense * 2) * 150) }}</div>
            <div class="goal-note">梦想生活</div>
          </div>
        </div>
      </div>

      <div class="welcome-actions">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 2" type="primary" @click="handleComplete" :loading="loading">开始使用</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
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

const form = ref({
  name: '',
  monthlyIncome: 0,
  monthlyExpense: 5000,
  cashAssets: 0,
  investmentAssets: 0,
  totalDebt: 0
})

const netWorth = computed(() => {
  return form.value.cashAssets + form.value.investmentAssets - form.value.totalDebt
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const handleComplete = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    // 1. 创建用户
    const user = await userStore.createUser({
      name: form.value.name || '用户',
      settings: JSON.stringify({
        monthlyIncome: form.value.monthlyIncome,
        monthlyExpense: form.value.monthlyExpense
      })
    })

    // 2. 创建初始账户
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

    // 3. 创建负债
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

    // 4. 创建三阶段目标
    const stages = [
      { stage: 'security' as const, targetAmount: form.value.monthlyExpense * 6 },
      { stage: 'safety' as const, targetAmount: form.value.monthlyExpense * 150 },
      { stage: 'freedom' as const, targetAmount: form.value.monthlyExpense * 2 * 150 }
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
</script>

<style lang="scss" scoped>
.welcome-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-card {
  width: 600px;
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
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
  max-width: 400px;
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

  .highlight {
    font-size: 24px;
    font-weight: 700;
    color: #67c23a;
  }
}

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

  .goal-icon {
    font-size: 32px;
    margin-bottom: 10px;
  }

  .goal-name {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .goal-amount {
    font-size: 16px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 6px;
  }

  .goal-note {
    font-size: 12px;
    color: #909399;
  }
}

.welcome-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
}
</style>
