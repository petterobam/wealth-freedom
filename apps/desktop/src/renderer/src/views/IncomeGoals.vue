<template>
  <div class="income-goals">
    <h1 class="page-title">{{ t('incomeGoals.title') }}</h1>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        {{ t('incomeGoals.addGoal') }}
      </el-button>
      <el-button @click="showStrategies = true">
        <el-icon><TrendCharts /></el-icon>
        {{ t('incomeGoals.viewStrategies') }}
      </el-button>
    </div>

    <!-- 目标统计 -->
    <div class="goal-summary">
      <div class="summary-card">
        <div class="summary-icon">🎯</div>
        <div class="summary-info">
          <div class="summary-label">{{ t('incomeGoals.activeGoals') }}</div>
          <div class="summary-value">{{ activeGoals.length }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">✅</div>
        <div class="summary-info">
          <div class="summary-label">{{ t('incomeGoals.achieved') }}</div>
          <div class="summary-value">{{ achievedGoals.length }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⏰</div>
        <div class="summary-info">
          <div class="summary-label">{{ t('incomeGoals.inProgress') }}</div>
          <div class="summary-value">{{ inProgressGoals.length }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⚠️</div>
        <div class="summary-info">
          <div class="summary-label">{{ t('incomeGoals.expiringSoon') }}</div>
          <div class="summary-value">{{ upcomingGoals.length }}</div>
        </div>
      </div>
    </div>

    <!-- 目标列表 -->
    <div class="goal-list">
      <el-card v-for="goal in sortedGoals" :key="goal.id" class="goal-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-tag :type="getGoalTypeTag(goal.type)" size="small">{{ getGoalTypeLabel(goal.type) }}</el-tag>
              <span class="goal-title">{{ goal.name }}</span>
              <el-tag v-if="isGoalAchieved(goal)" type="success" size="small">{{ t('incomeGoals.achievedTag') }}</el-tag>
              <el-tag v-else-if="isGoalOverdue(goal)" type="danger" size="small">{{ t('incomeGoals.overdueTag') }}</el-tag>
              <el-tag v-else-if="isGoalUpcoming(goal)" type="warning" size="small">{{ t('incomeGoals.expiringTag') }}</el-tag>
            </div>
            <div class="header-right">
              <el-button size="small" text @click="editGoal(goal)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" text type="danger" @click="deleteGoal(goal)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </template>

        <div class="goal-content">
          <!-- 目标金额 -->
          <div class="goal-metric">
            <div class="metric-label">{{ t('incomeGoals.targetAmount') }}</div>
            <div class="metric-value">{{ formatCurrency(goal.targetAmount) }}</div>
            <div class="metric-period">/ {{ getPeriodLabel(goal.period) }}</div>
          </div>

          <!-- 当前进度 -->
          <div class="goal-progress">
            <div class="progress-header">
              <span class="progress-label">{{ t('incomeGoals.currentProgress') }}</span>
              <span class="progress-value">{{ formatCurrency(goal.currentAmount) }} ({{ getProgressPercentage(goal) }}%)</span>
            </div>
            <el-progress
              :percentage="getProgressPercentage(goal)"
              :status="getProgressStatus(goal)"
              :stroke-width="20"
            />
          </div>

          <!-- 剩余金额 -->
          <div class="goal-remaining">
            <span class="remaining-label">{{ t('incomeGoals.stillNeeded') }}</span>
            <span class="remaining-value">{{ formatCurrency(goal.targetAmount - goal.currentAmount) }}</span>
            <span class="remaining-diff" :class="getDiffClass(goal)">
              {{ getRemainingText(goal) }}
            </span>
          </div>

          <!-- 截止日期 -->
          <div class="goal-deadline">
            <span class="deadline-label">{{ t('incomeGoals.deadline') }}</span>
            <span class="deadline-value">{{ formatDate(goal.deadline) }}</span>
            <span class="deadline-days">{{ getDaysRemaining(goal) }}</span>
          </div>

          <!-- 备注 -->
          <div v-if="goal.notes" class="goal-notes">
            <div class="notes-label">{{ t('incomeGoals.notes') }}</div>
            <div class="notes-text">{{ goal.notes }}</div>
          </div>
        </div>
      </el-card>

      <!-- 空状态 -->
      <el-empty v-if="goals.length === 0" :description="t('incomeGoals.noGoals')" />
    </div>

    <!-- 创建/编辑目标对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingGoal ? t('incomeGoals.editGoal') : t('incomeGoals.createGoal')"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="goalForm" :rules="goalRules" ref="goalFormRef" label-width="120px">
        <el-form-item :label="t('incomeGoals.goalName')" prop="name">
          <el-input v-model="goalForm.name" :placeholder="t('incomeGoals.goalNamePlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('incomeGoals.goalType')" prop="type">
          <el-select v-model="goalForm.type" :placeholder="t('incomeGoals.selectGoalType')" style="width: 100%">
            <el-option :label="t('incomeGoals.typeTotal')" value="total" />
            <el-option :label="t('incomeGoals.typeActive')" value="active" />
            <el-option :label="t('incomeGoals.typePassive')" value="passive" />
            <el-option :label="t('incomeGoals.typeSalary')" value="salary" />
            <el-option :label="t('incomeGoals.typeFreelance')" value="freelance" />
            <el-option :label="t('incomeGoals.typeInvestment')" value="investment" />
            <el-option :label="t('incomeGoals.typeProduct')" value="product" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('incomeGoals.goalAmount')" prop="targetAmount">
          <el-input-number
            v-model="goalForm.targetAmount"
            :min="0"
            :step="1000"
            :precision="0"
            controls-position="right"
            style="width: 100%"
          />
          <div class="form-tip">{{ goalForm.type === 'total' ? t('incomeGoals.currentTotalIncome') : getGoalTypeLabel(goalForm.type) }}：{{ formatCurrency(getCurrentAmount(goalForm.type)) }}</div>
        </el-form-item>

        <el-form-item :label="t('incomeGoals.period')" prop="period">
          <el-radio-group v-model="goalForm.period">
            <el-radio value="monthly">{{ t('incomeGoals.periodMonthly') }}</el-radio>
            <el-radio value="quarterly">{{ t('incomeGoals.periodQuarterly') }}</el-radio>
            <el-radio value="yearly">{{ t('incomeGoals.periodYearly') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="t('incomeGoals.goalDeadline')" prop="deadline">
          <el-date-picker
            v-model="goalForm.deadline"
            type="date"
            :placeholder="t('incomeGoals.selectDeadline')"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="t('incomeGoals.goalNotes')" prop="notes">
          <el-input
            v-model="goalForm.notes"
            type="textarea"
            :rows="3"
            :placeholder="t('incomeGoals.notesPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{ t('incomeGoals.cancel') }}</el-button>
        <el-button type="primary" @click="submitGoal" :loading="submitting">
          {{ editingGoal ? t('incomeGoals.save') : t('incomeGoals.create') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 策略对话框 -->
    <el-dialog v-model="showStrategies" :title="t('incomeGoals.strategyDialog')" width="80%" top="5vh">
      <div class="strategies-content">
        <div class="strategy-category">
          <h3>{{ t('incomeGoals.expertStrategy') }}</h3>
          <p>{{ t('incomeGoals.expertStrategyDesc') }}</p>
          <el-button type="primary" @click="applyStrategy('expert')">{{ t('incomeGoals.applyStrategy') }}</el-button>
        </div>
        <div class="strategy-category">
          <h3>{{ t('incomeGoals.productStrategy') }}</h3>
          <p>{{ t('incomeGoals.productStrategyDesc') }}</p>
          <el-button type="primary" @click="applyStrategy('product')">{{ t('incomeGoals.applyStrategy') }}</el-button>
        </div>
        <div class="strategy-category">
          <h3>{{ t('incomeGoals.leverageStrategy') }}</h3>
          <p>{{ t('incomeGoals.leverageStrategyDesc') }}</p>
          <el-button type="primary" @click="applyStrategy('leverage')">{{ t('incomeGoals.applyStrategy') }}</el-button>
        </div>
        <div class="strategy-category">
          <h3>{{ t('incomeGoals.investmentStrategy') }}</h3>
          <p>{{ t('incomeGoals.investmentStrategyDesc') }}</p>
          <el-button type="primary" @click="applyStrategy('investment')">{{ t('incomeGoals.applyStrategy') }}</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Delete, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useIncomeStore } from '@/stores/income'
import { formatCurrency, formatDate } from '@/utils/format'
import type { IncomeGoal } from '@wealth-freedom/shared'
import useI18n from "../i18n"

const incomeStore = useIncomeStore()
const { t } = useI18n()

// 加载目标数据
onMounted(async () => {
  await incomeStore.loadGoals()
})

// 对话框状态
const showCreateDialog = ref(false)
const showStrategies = ref(false)
const editingGoal = ref<IncomeGoal | null>(null)
const submitting = ref(false)
const goalFormRef = ref<FormInstance>()

// 目标表单
const goalForm = ref({
  name: '',
  type: 'total',
  targetAmount: 0,
  period: 'monthly',
  deadline: '',
  notes: ''
})

// 表单验证规则
const goalRules = {
  name: [{ required: true, message: t('incomeGoals.nameRequired'), trigger: 'blur' }],
  type: [{ required: true, message: t('incomeGoals.typeRequired'), trigger: 'change' }],
  targetAmount: [{ required: true, message: t('incomeGoals.amountRequired'), trigger: 'blur' }],
  period: [{ required: true, message: t('incomeGoals.periodRequired'), trigger: 'change' }],
  deadline: [{ required: true, message: t('incomeGoals.deadlineRequired'), trigger: 'change' }]
}

// 目标列表
const goals = computed(() => incomeStore.incomeGoals)

// 活跃目标（未删除且未过期）
const activeGoals = computed(() => {
  const now = new Date()
  return goals.value.filter(g => new Date(g.deadline) >= now)
})

// 已达成目标
const achievedGoals = computed(() => {
  return activeGoals.value.filter(g => g.currentAmount >= g.targetAmount)
})

// 进行中目标
const inProgressGoals = computed(() => {
  const now = new Date()
  return activeGoals.value.filter(g => new Date(g.deadline) >= now && g.currentAmount < g.targetAmount)
})

// 即将到期目标（7天内）
const upcomingGoals = computed(() => {
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return inProgressGoals.value.filter(g => new Date(g.deadline) <= sevenDaysLater)
})

// 排序后的目标列表
const sortedGoals = computed(() => {
  return [...goals.value].sort((a, b) => {
    // 先按状态排序（已达成 → 进行中 → 逾期）
    const aAchieved = isGoalAchieved(a)
    const bAchieved = isGoalAchieved(b)
    if (aAchieved && !bAchieved) return 1
    if (!aAchieved && bAchieved) return -1

    const aOverdue = isGoalOverdue(a)
    const bOverdue = isGoalOverdue(b)
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // 再按截止日期排序
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })
})

// 获取当前金额
const getCurrentAmount = (type: string): number => {
  const current = incomeStore.getCurrentMonthIncome()
  switch (type) {
    case 'total': return current.active + current.passive
    case 'active': return current.active
    case 'passive': return current.passive
    case 'salary': {
      const sources = incomeStore.getCurrentMonthIncomeBySource()
      const salary = sources.find(s => s.category === 'salary')
      return salary ? salary.amount : 0
    }
    case 'freelance': {
      const sources = incomeStore.getCurrentMonthIncomeBySource()
      const freelance = sources.find(s => s.category === 'freelance')
      return freelance ? freelance.amount : 0
    }
    case 'investment': {
      const sources = incomeStore.getCurrentMonthIncomeBySource()
      const investment = sources.find(s => s.category === 'investment')
      return investment ? investment.amount : 0
    }
    case 'product': {
      const sources = incomeStore.getCurrentMonthIncomeBySource()
      const product = sources.find(s => s.category === 'product')
      return product ? product.amount : 0
    }
    default: return 0
  }
}

// 获取目标类型标签
const getGoalTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    total: t('incomeGoals.typeTotal'),
    active: t('incomeGoals.typeActive'),
    passive: t('incomeGoals.typePassive'),
    salary: t('incomeGoals.typeSalary'),
    freelance: t('incomeGoals.typeFreelance'),
    investment: t('incomeGoals.typeInvestment'),
    product: t('incomeGoals.typeProduct')
  }
  return labels[type] || type
}

// 获取目标类型标签样式
const getGoalTypeTag = (type: string): string => {
  const tags: Record<string, string> = {
    total: 'primary',
    active: 'success',
    passive: 'warning',
    salary: 'info',
    freelance: '',
    investment: 'warning',
    product: 'danger'
  }
  return tags[type] || ''
}

// 获取周期标签
const getPeriodLabel = (period: string): string => {
  const labels: Record<string, string> = {
    monthly: t('incomeGoals.periodMonthly'),
    quarterly: t('incomeGoals.periodQuarterly'),
    yearly: t('incomeGoals.periodYearly')
  }
  return labels[period] || period
}

// 获取进度百分比
const getProgressPercentage = (goal: IncomeGoal): number => {
  if (goal.targetAmount === 0) return 0
  const percentage = (goal.currentAmount / goal.targetAmount) * 100
  return Math.min(100, Math.max(0, percentage))
}

// 获取进度状态
const getProgressStatus = (goal: IncomeGoal): string | undefined => {
  const percentage = getProgressPercentage(goal)
  if (percentage >= 100) return 'success'
  if (percentage >= 70) return undefined
  if (percentage >= 30) return 'warning'
  return 'exception'
}

// 获取剩余文本
const getRemainingText = (goal: IncomeGoal): string => {
  const daysRemaining = getDaysRemainingNumber(goal)
  if (daysRemaining < 0) return t('incomeGoals.overdue')
  if (daysRemaining === 0) return t('incomeGoals.dueToday')
  if (daysRemaining === 1) return t('incomeGoals.dueTomorrow')
  if (daysRemaining <= 7) return t('incomeGoals.dueInDays').replace('{days}', String(daysRemaining))
  return ''
}

// 获取剩余样式
const getDiffClass = (goal: IncomeGoal): string => {
  if (isGoalOverdue(goal)) return 'text-danger'
  if (isGoalUpcoming(goal)) return 'text-warning'
  return ''
}

// 获取剩余天数
const getDaysRemaining = (goal: IncomeGoal): string => {
  const days = getDaysRemainingNumber(goal)
  if (days < 0) return t('incomeGoals.overdueDays').replace('{days}', String(Math.abs(days)))
  if (days === 0) return t('incomeGoals.dueToday')
  if (days === 1) return t('incomeGoals.dueTomorrow')
  return t('incomeGoals.remainingDays').replace('{days}', String(days))
}

// 获取剩余天数数值
const getDaysRemainingNumber = (goal: IncomeGoal): number => {
  const now = new Date()
  const deadline = new Date(goal.deadline)
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

// 判断目标是否达成
const isGoalAchieved = (goal: IncomeGoal): boolean => {
  return goal.currentAmount >= goal.targetAmount
}

// 判断目标是否逾期
const isGoalOverdue = (goal: IncomeGoal): boolean => {
  const now = new Date()
  return new Date(goal.deadline) < now && goal.currentAmount < goal.targetAmount
}

// 判断目标是否即将到期
const isGoalUpcoming = (goal: IncomeGoal): boolean => {
  const days = getDaysRemainingNumber(goal)
  return days > 0 && days <= 7 && goal.currentAmount < goal.targetAmount
}

// 编辑目标
const editGoal = (goal: IncomeGoal) => {
  editingGoal.value = goal
  goalForm.value = {
    name: goal.name,
    type: goal.type,
    targetAmount: goal.targetAmount,
    period: goal.period,
    deadline: goal.deadline,
    notes: goal.notes || ''
  }
  showCreateDialog.value = true
}

// 删除目标
const deleteGoal = (goal: IncomeGoal) => {
  ElMessageBox.confirm(
    t('incomeGoals.confirmDeleteGoal').replace('{name}', goal.name),
    t('incomeGoals.confirmDelete'),
    {
      confirmButtonText: t('incomeGoals.deleteBtn'),
      cancelButtonText: t('incomeGoals.cancel'),
      type: 'warning'
    }
  ).then(async () => {
    try {
      await incomeStore.deleteGoal(goal.id)
      ElMessage.success(t('incomeGoals.deleteSuccess'))
    } catch (error) {
      ElMessage.error(t('incomeGoals.deleteFailed'))
    }
  })
}

// 提交目标
const submitGoal = async () => {
  if (!goalFormRef.value) return

  await goalFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (editingGoal.value) {
        // 更新目标
        await incomeStore.updateGoal(editingGoal.value.id, {
          ...goalForm.value,
          deadline: goalForm.value.deadline as string
        })
        ElMessage.success(t('incomeGoals.updateSuccess'))
      } else {
        // 创建目标
        await incomeStore.createGoal({
          ...goalForm.value,
          deadline: goalForm.value.deadline as string,
          currentAmount: getCurrentAmount(goalForm.value.type)
        })
        ElMessage.success(t('incomeGoals.createSuccess'))
      }
      showCreateDialog.value = false
    } catch (error) {
      ElMessage.error(editingGoal.value ? t('incomeGoals.updateFailed') : t('incomeGoals.createFailed'))
    } finally {
      submitting.value = false
    }
  })
}

// 应用策略
const applyStrategy = (strategy: string) => {
  ElMessage.success(t('incomeGoals.strategyApplied').replace('{strategy}', strategy))
  showStrategies.value = false
}

// 重置表单
const resetForm = () => {
  editingGoal.value = null
  goalForm.value = {
    name: '',
    type: 'total',
    targetAmount: 0,
    period: 'monthly',
    deadline: '',
    notes: ''
  }
  goalFormRef.value?.resetFields()
}
</script>

<style scoped>
.income-goals {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.goal-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.summary-icon {
  font-size: 32px;
}

.summary-info {
  flex: 1;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 4px;
}

.goal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-metric {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.metric-period {
  font-size: 14px;
  color: #909399;
}

.goal-progress {
  margin-top: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.goal-remaining {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remaining-label {
  font-size: 14px;
  color: #909399;
}

.remaining-value {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.remaining-diff {
  font-size: 14px;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

.goal-deadline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.deadline-label {
  font-size: 14px;
  color: #909399;
}

.deadline-value {
  font-size: 14px;
  color: #606266;
}

.deadline-days {
  font-size: 14px;
  color: #e6a23c;
  font-weight: 500;
}

.goal-notes {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.notes-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.notes-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.strategies-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.strategy-category {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
}

.strategy-category h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.strategy-category p {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
}
</style>
