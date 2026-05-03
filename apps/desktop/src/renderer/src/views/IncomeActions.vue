<template>
  <div class="income-actions">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-icon :size="32" color="#409EFF"><List /></el-icon>
          <div>
            <h2>{{ t('incomeActions.title') }}</h2>
            <p>{{ t('incomeActions.subtitle') }}</p>
          </div>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="openAddAction">
            <el-icon><Plus /></el-icon>
            {{ t('incomeActions.newAction') }}
          </el-button>
          <el-button @click="openChangeStrategy">
            <el-icon><Refresh /></el-icon>
            {{ t('incomeActions.adjustStrategy') }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 当前策略信息 -->
    <el-card v-if="currentStrategy" class="strategy-info-card">
      <div class="strategy-info">
        <div class="strategy-name">
          <el-tag :type="getStrategyTypeColor(currentStrategy.type)" size="large">
            {{ getStrategyTypeName(currentStrategy.type) }}
          </el-tag>
          <span>{{ currentStrategy.name }}</span>
        </div>
        <div class="strategy-meta">
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>{{ t('incomeActions.estimatedTime') }}：{{ currentStrategy.estimatedTime }}</span>
          </div>
          <div class="meta-item" v-if="currentStrategy.expectedIncome">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ t('incomeActions.expectedIncrease') }}：+¥{{ formatNumber(currentStrategy.expectedIncome) }}/月</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 行动清单 -->
    <el-card class="actions-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ t('incomeActions.actionList') }}</span>
          <div class="header-actions">
            <el-radio-group v-model="timeFilter" size="small">
              <el-radio-button value="month">{{ t('incomeActions.thisMonth') }}</el-radio-button>
              <el-radio-button value="quarter">{{ t('incomeActions.thisQuarter') }}</el-radio-button>
              <el-radio-button value="year">{{ t('incomeActions.thisYear') }}</el-radio-button>
            </el-radio-group>
            <el-select v-model="statusFilter" size="small" :placeholder="t('incomeActions.statusFilter')" style="width: 120px; margin-left: 10px;">
              <el-option :label="t('incomeActions.all')" value="all" />
              <el-option :label="t('incomeActions.todo')" value="todo" />
              <el-option :label="t('incomeActions.inProgress')" value="in_progress" />
              <el-option :label="t('incomeActions.completed')" value="completed" />
            </el-select>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <el-empty v-if="filteredActions.length === 0" :description="t('incomeActions.noActions')" />

        <div v-else class="actions-list">
          <div
            v-for="action in filteredActions"
            :key="action.id"
            class="action-item"
            :class="{
              'is-completed': action.status === 'completed',
              'is-in-progress': action.status === 'in_progress'
            }"
          >
            <div class="action-checkbox">
              <el-checkbox
                :model-value="action.status === 'completed'"
                @change="toggleActionStatus(action)"
                size="large"
              />
            </div>
            <div class="action-content">
              <div class="action-header">
                <div class="action-title">{{ action.title }}</div>
                <div class="action-priority">
                  <el-tag :type="getPriorityType(action.priority)" size="small">
                    {{ getPriorityText(action.priority) }}
                  </el-tag>
                </div>
              </div>
              <div class="action-desc">{{ action.description }}</div>
              <div class="action-meta">
                <div class="meta-item" v-if="action.deadline">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ t('incomeActions.deadline') }}：{{ formatDate(action.deadline) }}</span>
                </div>
                <div class="meta-item" v-if="action.expectedIncome">
                  <el-icon><TrendCharts /></el-icon>
                  <span>{{ t('incomeActions.expectedIncome') }}：+¥{{ formatNumber(action.expectedIncome) }}</span>
                </div>
                <div class="meta-item" v-if="action.completedAt">
                  <el-icon><Check /></el-icon>
                  <span>{{ t('incomeActions.completedAt') }}：{{ formatDate(action.completedAt) }}</span>
                </div>
              </div>
            </div>
            <div class="action-actions">
              <el-button
                v-if="action.status === 'todo'"
                link
                @click="startAction(action)"
              >
                {{ t('incomeActions.start') }}
              </el-button>
              <el-button
                v-if="action.status === 'in_progress'"
                link
                @click="completeAction(action)"
              >
                {{ t('incomeActions.completeBtn') }}
              </el-button>
              <el-button
                link
                type="danger"
                @click="deleteAction(action)"
              >
                {{ t('incomeActions.deleteBtn') }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 进度统计 -->
        <div v-if="filteredActions.length > 0" class="progress-section">
          <div class="progress-header">
            <span>{{ t('incomeActions.completionProgress') }}</span>
            <span class="progress-text">{{ completedCount }} / {{ totalCount }} ({{ completionPercentage }}%)</span>
          </div>
          <el-progress
            :percentage="completionPercentage"
            :stroke-width="8"
            :color="progressColor"
          />
          <div class="progress-summary">
            <div class="summary-item">
              <span class="label">{{ t('incomeActions.expectedIncomeIncrease') }}</span>
              <span class="value">+¥{{ formatNumber(totalExpectedIncome) }}/月</span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('incomeActions.completedIncome') }}</span>
              <span class="value">+¥{{ formatNumber(completedExpectedIncome) }}/月</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 新增行动对话框 -->
    <el-dialog
      v-model="showAddAction"
      :title="t('incomeActions.actionDialogTitle')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="actionFormRef"
        :model="actionForm"
        :rules="actionFormRules"
        label-width="100px"
      >
        <el-form-item :label="t('incomeActions.actionTitle')" prop="title">
          <el-input
            v-model="actionForm.title"
            :placeholder="t('incomeActions.actionTitlePlaceholder')"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('incomeActions.actionDesc')" prop="description">
          <el-input
            v-model="actionForm.description"
            type="textarea"
            :placeholder="t('incomeActions.actionDescPlaceholder')"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('incomeActions.priority')" prop="priority">
          <el-radio-group v-model="actionForm.priority">
            <el-radio-button value="high">{{ t('incomeActions.high') }}</el-radio-button>
            <el-radio-button value="medium">{{ t('incomeActions.medium') }}</el-radio-button>
            <el-radio-button value="low">{{ t('incomeActions.low') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('incomeActions.deadlineDate')">
          <el-date-picker
            v-model="actionForm.deadline"
            type="date"
            :placeholder="t('incomeActions.selectDeadline')"
            style="width: 100%;"
            :disabled-date="disabledDate"
          />
        </el-form-item>
        <el-form-item :label="t('incomeActions.expectedIncomeLabel')">
          <el-input-number
            v-model="actionForm.expectedIncome"
            :min="0"
            :max="999999"
            :step="1000"
            :placeholder="t('incomeActions.expectedIncomePlaceholder')"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAction = false">{{ t('incomeActions.cancel') }}</el-button>
        <el-button type="primary" @click="submitAddAction">{{ t('incomeActions.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 调整策略对话框 -->
    <el-dialog
      v-model="showChangeStrategy"
      :title="t('incomeActions.adjustStrategyTitle')"
      width="800px"
    >
      <div class="strategy-select">
        <p class="strategy-select-tip">{{ t('incomeActions.selectStrategyTip') }}</p>
        <div class="strategy-grid">
          <el-card
            v-for="strategy in strategies"
            :key="strategy.id"
            class="strategy-select-card"
            :class="{ 'is-selected': selectedStrategyId === strategy.id }"
            shadow="hover"
            @click="selectStrategy(strategy.id)"
          >
            <div class="strategy-card-header">
              <div class="strategy-icon">
                <el-icon :size="28">
                  <component :is="strategy.icon" />
                </el-icon>
              </div>
              <div class="strategy-info">
                <div class="strategy-name">{{ strategy.name }}</div>
                <div class="strategy-desc">{{ strategy.shortDesc }}</div>
              </div>
            </div>
            <div class="strategy-card-meta">
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ strategy.estimatedTime }}
              </span>
              <span class="meta-item" v-if="strategy.expectedIncome">
                <el-icon><TrendCharts /></el-icon>
                {{ t('incomeActions.expectedIncrease') }} +¥{{ formatNumber(strategy.expectedIncome) }}/月
              </span>
            </div>
            <el-tag
              v-if="currentStrategy && strategy.id === currentStrategy.id"
              type="info"
              class="current-tag"
            >
              {{ t('incomeActions.currentStrategy') }}
            </el-tag>
          </el-card>
        </div>
      </div>
      <template #footer>
        <el-button @click="showChangeStrategy = false">{{ t('incomeActions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="!selectedStrategyId || selectedStrategyId === currentStrategy?.id"
          @click="applyStrategy"
        >
          {{ t('incomeActions.applyStrategy') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { List, Plus, Refresh, Clock, TrendCharts, Calendar, Check, Star, User, GoldMedal, DataLine, Money } from '@element-plus/icons-vue'
import { useIncomeStore } from '@/stores/income'
import { formatNumber, formatDate } from '@/utils/format'
import useI18n from '../i18n'

const { t } = useI18n()

// 图标映射
const iconMap = {
  expert: User,
  product: Star,
  leverage: GoldMedal,
  investment: DataLine,
  passive: Money
}

// Store
const incomeStore = useIncomeStore()

// 状态
const loading = ref(false)
const timeFilter = ref<'month' | 'quarter' | 'year'>('month')
const statusFilter = ref<'all' | 'todo' | 'in_progress' | 'completed'>('all')
const showAddAction = ref(false)
const showChangeStrategy = ref(false)
const selectedStrategyId = ref('')

// 表单
const actionFormRef = ref<FormInstance>()
const actionForm = ref({
  title: '',
  description: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  deadline: null as Date | null,
  expectedIncome: 0
})
const actionFormRules: FormRules = {
  title: [
    { required: true, message: t('incomeActions.actionTitlePlaceholder'), trigger: 'blur' }
  ],
  description: [
    { required: true, message: t('incomeActions.actionDescPlaceholder'), trigger: 'blur' }
  ],
  priority: [
    { required: true, message: t('incomeActions.priority'), trigger: 'change' }
  ]
}

// 当前策略
const currentStrategy = computed(() => {
  return strategies.value.find(s => s.isActive)
})

// 所有策略
const strategies = computed(() => incomeStore.strategies || [])

// 行动列表
const actions = computed(() => incomeStore.actions || [])

// 筛选后的行动
const filteredActions = computed(() => {
  let result = actions.value

  // 按时间筛选
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const thisYear = new Date(now.getFullYear(), 0, 1)

  result = result.filter(action => {
    const createdAt = action.createdAt ? new Date(action.createdAt) : new Date()
    if (timeFilter.value === 'month') {
      return createdAt >= thisMonth
    } else if (timeFilter.value === 'quarter') {
      return createdAt >= thisQuarter
    } else if (timeFilter.value === 'year') {
      return createdAt >= thisYear
    }
    return true
  })

  // 按状态筛选
  if (statusFilter.value !== 'all') {
    result = result.filter(action => action.status === statusFilter.value)
  }

  // 排序：优先级高 -> 低，已完成 -> 待完成
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  result.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'completed' ? 1 : -1
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return result
})

// 统计数据
const totalCount = computed(() => filteredActions.value.length)
const completedCount = computed(() => filteredActions.value.filter(a => a.status === 'completed').length)
const completionPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})
const totalExpectedIncome = computed(() => {
  return filteredActions.value.reduce((sum, a) => sum + (a.expectedIncome || 0), 0)
})
const completedExpectedIncome = computed(() => {
  return filteredActions.value.filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.expectedIncome || 0), 0)
})
const progressColor = computed(() => {
  if (completionPercentage.value < 30) return '#F56C6C'
  if (completionPercentage.value < 70) return '#E6A23C'
  return '#67C23A'
})

// 方法
function getStrategyTypeColor(type: string) {
  const colorMap: Record<string, any> = {
    expert: 'primary',
    product: 'success',
    leverage: 'warning',
    investment: 'info',
    passive: 'danger'
  }
  return colorMap[type] || ''
}

function getStrategyTypeName(type: string) {
  const nameMap: Record<string, string> = {
    expert: t('incomeActions.strategyTypeExpert'),
    product: t('incomeActions.strategyTypeProduct'),
    leverage: t('incomeActions.strategyTypeLeverage'),
    investment: t('incomeActions.strategyTypeInvestment'),
    passive: t('incomeActions.strategyTypePassive')
  }
  return nameMap[type] || ''
}

function getPriorityType(priority: string) {
  const typeMap: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[priority] || ''
}

function getPriorityText(priority: string) {
  const textMap: Record<string, string> = {
    high: t('incomeActions.high'),
    medium: t('incomeActions.medium'),
    low: t('incomeActions.low')
  }
  return textMap[priority] || ''
}

function disabledDate(date: Date) {
  return date < new Date()
}

// 操作
async function toggleActionStatus(action: any) {
  const newStatus = action.status === 'completed' ? 'todo' : 'completed'
  await incomeStore.updateAction(action.id, {
    status: newStatus,
    completedAt: newStatus === 'completed' ? new Date() : undefined
  })
  ElMessage.success(newStatus === 'completed' ? t('incomeActions.completedMsg') : t('incomeActions.cancelledMsg'))
}

async function startAction(action: any) {
  await incomeStore.updateAction(action.id, {
    status: 'in_progress'
  })
  ElMessage.success(t('incomeActions.startedMsg'))
}

async function completeAction(action: any) {
  await ElMessageBox.confirm(
    t('incomeActions.completeConfirm', { amount: formatNumber(action.expectedIncome || 0) }),
    t('incomeActions.confirm'),
    {
      type: 'warning'
    }
  )
  await incomeStore.updateAction(action.id, {
    status: 'completed',
    completedAt: new Date()
  })
  ElMessage.success(t('incomeActions.completedMsg'))
}

async function deleteAction(action: any) {
  await ElMessageBox.confirm(
    t('incomeActions.deleteConfirm'),
    t('incomeActions.confirm'),
    {
      type: 'warning'
    }
  )
  await incomeStore.deleteAction(action.id)
  ElMessage.success(t('incomeActions.completedMsg'))
}

function openAddAction() {
  actionForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    deadline: null,
    expectedIncome: 0
  }
  showAddAction.value = true
}

async function submitAddAction() {
  if (!actionFormRef.value) return

  await actionFormRef.value.validate(async (valid) => {
    if (valid) {
      await incomeStore.addAction({
        title: actionForm.value.title,
        description: actionForm.value.description,
        priority: actionForm.value.priority,
        deadline: actionForm.value.deadline,
        expectedIncome: actionForm.value.expectedIncome,
        strategyId: currentStrategy.value?.id
      })
      ElMessage.success(t('incomeActions.addSuccess'))
      showAddAction.value = false
      actionFormRef.value?.resetFields()
    }
  })
}

function openChangeStrategy() {
  selectedStrategyId.value = currentStrategy.value?.id || ''
  showChangeStrategy.value = true
}

function selectStrategy(strategyId: string) {
  selectedStrategyId.value = strategyId
}

async function applyStrategy() {
  if (!selectedStrategyId.value) return

  const strategy = strategies.value.find(s => s.id === selectedStrategyId.value)
  if (!strategy) return

  await incomeStore.applyStrategy(selectedStrategyId.value)
  ElMessage.success(t('incomeActions.strategySwitched', { name: strategy.name }))
  showChangeStrategy.value = false
}

// 初始化
onMounted(async () => {
  loading.value = true
  try {
    await incomeStore.loadStrategies()
    await incomeStore.loadActions()
  } catch (error) {
    console.error(t('incomeActions.loadDataFailed'), error)
    ElMessage.error(t('incomeActions.loadDataFailed'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.income-actions {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      h2 {
        margin: 0;
        font-size: 20px;
        color: #303133;
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #909399;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }
}

.strategy-info-card {
  margin-bottom: 20px;

  .strategy-info {
    .strategy-name {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .strategy-meta {
      display: flex;
      gap: 24px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #606266;
        font-size: 14px;
      }
    }
  }
}

.actions-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }
  }

  .actions-list {
    margin-top: 20px;

    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: #ffffff;
      border: 1px solid #EBEEF5;
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }

      &.is-completed {
        background: #F5F7FA;
        opacity: 0.7;

        .action-title {
          text-decoration: line-through;
          color: #909399;
        }
      }

      &.is-in-progress {
        border-left: 3px solid #409EFF;
      }

      .action-checkbox {
        padding-top: 4px;
      }

      .action-content {
        flex: 1;

        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;

          .action-title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
          }

          .action-priority {
            margin-left: 12px;
          }
        }

        .action-desc {
          font-size: 14px;
          color: #606266;
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .action-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #909399;

            .el-icon {
              font-size: 14px;
            }
          }
        }
      }

      .action-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-left: 12px;
        border-left: 1px solid #EBEEF5;
      }
    }
  }

  .progress-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #EBEEF5;

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      span {
        font-size: 14px;
        color: #606266;
      }

      .progress-text {
        font-weight: 600;
        color: #409EFF;
      }
    }

    .progress-summary {
      display: flex;
      justify-content: space-around;
      margin-top: 24px;
      padding: 16px;
      background: #F5F7FA;
      border-radius: 8px;

      .summary-item {
        text-align: center;

        .label {
          display: block;
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
        }

        .value {
          display: block;
          font-size: 18px;
          font-weight: 600;
          color: #409EFF;
        }
      }
    }
  }
}

// 策略选择对话框
.strategy-select {
  .strategy-select-tip {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: #606266;
  }

  .strategy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;

    .strategy-select-card {
      cursor: pointer;
      transition: all 0.3s;
      position: relative;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      &.is-selected {
        border: 2px solid #409EFF;
        background: #ECF5FF;
      }

      .strategy-card-header {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;

        .strategy-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F5F7FA;
          border-radius: 8px;
          color: #409EFF;
        }

        .strategy-info {
          flex: 1;

          .strategy-name {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .strategy-desc {
            font-size: 13px;
            color: #909399;
            line-height: 1.5;
          }
        }
      }

      .strategy-card-meta {
        display: flex;
        gap: 16px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #606266;

          .el-icon {
            font-size: 14px;
          }
        }
      }

      .current-tag {
        position: absolute;
        top: 12px;
        right: 12px;
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .header-card {
    .header-content {
      flex-direction: column;
      gap: 16px;

      .header-right {
        width: 100%;
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  }

  .actions-card {
    .card-header {
      flex-direction: column;
      gap: 12px;

      .header-actions {
        width: 100%;
        flex-direction: column;

        .el-select {
          width: 100% !important;
          margin-left: 0 !important;
        }
      }
    }

    .action-item {
      flex-direction: column;

      .action-actions {
        width: 100%;
        flex-direction: row;
        justify-content: flex-end;
        padding-left: 0;
        border-left: none;
        border-top: 1px solid #EBEEF5;
        padding-top: 12px;
      }
    }
  }

  .progress-summary {
    flex-direction: column;
    gap: 16px;
  }

  .strategy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
