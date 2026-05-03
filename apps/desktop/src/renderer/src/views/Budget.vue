<template>
  <FeatureGate :feature="'hasBudget'" :feature-name="t('budget.title')" :description="t('budget.subtitle')" required-tier="basic">
  <div class="budget-page">
    <h1 class="page-title">{{ t('budget.title') }}</h1>
    <p class="page-desc">{{ t('budget.subtitle') }}</p>

    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="period-selector">
        <el-date-picker
          v-model="currentMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          @change="loadBudgetStatus"
        />
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建预算
      </el-button>
    </div>

    <!-- 预算概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon">📊</div>
        <div class="card-info">
          <div class="card-label">总预算</div>
          <div class="card-value">{{ formatCurrency(totalBudget) }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">💸</div>
        <div class="card-info">
          <div class="card-label">已支出</div>
          <div class="card-value">{{ formatCurrency(totalSpent) }}</div>
        </div>
      </div>
      <div class="overview-card" :class="{ warning: totalRemaining < 0 }">
        <div class="card-icon">{{ totalRemaining >= 0 ? '💰' : '⚠️' }}</div>
        <div class="card-info">
          <div class="card-label">剩余</div>
          <div class="card-value">{{ formatCurrency(totalRemaining) }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">📈</div>
        <div class="card-info">
          <div class="card-label">预测月末支出</div>
          <div class="card-value">{{ formatCurrency(totalProjected) }}</div>
        </div>
      </div>
    </div>

    <!-- 预算列表 -->
    <div class="budget-list" v-loading="loading">
      <div v-if="budgetStatuses.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">🎯</div>
        <p>还没有预算计划</p>
        <p class="empty-hint">创建第一个预算，开始掌控你的支出</p>
        <el-button type="primary" @click="showCreateDialog = true">创建预算</el-button>
      </div>

      <div
        v-for="item in budgetStatuses"
        :key="item.budget.id"
        class="budget-item"
        :class="`status-${item.status}`"
      >
        <div class="budget-header">
          <div class="budget-left">
            <span class="budget-icon">{{ item.budget.icon || '📌' }}</span>
            <div class="budget-meta">
              <span class="budget-name">{{ item.budget.name }}</span>
              <span class="budget-category" v-if="item.budget.category">
                {{ item.budget.category }}
              </span>
            </div>
          </div>
          <div class="budget-actions">
            <el-tag
              :type="item.status === 'green' ? 'success' : item.status === 'yellow' ? 'warning' : 'danger'"
              size="small"
            >
              {{ item.status === 'green' ? '健康' : item.status === 'yellow' ? '注意' : '超支' }}
            </el-tag>
            <el-dropdown trigger="click" @command="(cmd: string) => handleAction(cmd, item)">
              <el-button text size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="history">历史趋势</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="budget-progress">
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :class="`fill-${item.status}`"
              :style="{ width: Math.min(item.percentage, 100) + '%' }"
            />
          </div>
          <div class="progress-label">
            <span>{{ formatCurrency(item.spent) }} / {{ formatCurrency(item.budget.amount) }}</span>
            <span>{{ item.percentage.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- 预测信息 -->
        <div class="budget-footer">
          <span class="footer-item">
            剩余 <strong>{{ formatCurrency(item.remaining) }}</strong>
          </span>
          <span class="footer-item" v-if="item.projectedEndOfMonth > 0">
            预测月末 <strong>{{ formatCurrency(item.projectedEndOfMonth) }}</strong>
            <el-tag
              v-if="item.projectedEndOfMonth > item.budget.amount"
              type="danger"
              size="small"
              style="margin-left: 4px"
            >
              预计超支 {{ formatCurrency(item.projectedEndOfMonth - item.budget.amount) }}
            </el-tag>
          </span>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingBudget ? '编辑预算' : '新建预算'"
      width="480px"
      @close="resetForm"
    >
      <el-form :model="budgetForm" label-width="80px" label-position="left">
        <el-form-item label="名称" required>
          <el-input v-model="budgetForm.name" placeholder="如：餐饮预算" />
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number
            v-model="budgetForm.amount"
            :min="1"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="budgetForm.category" placeholder="留空则跟踪所有支出" />
        </el-form-item>
        <el-form-item label="周期">
          <el-select v-model="budgetForm.period" style="width: 100%">
            <el-option label="每月" value="monthly" />
            <el-option label="每周" value="weekly" />
            <el-option label="每年" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="budgetForm.icon" placeholder="🍔" style="width: 80px" />
        </el-form-item>
        <el-form-item label="结转">
          <el-switch v-model="budgetForm.rollover" />
          <span class="form-hint">未用完的预算自动结转到下期</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBudget" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 历史趋势对话框 -->
    <el-dialog v-model="showHistoryDialog" title="历史趋势" width="560px">
      <div v-if="historyData.length === 0" class="empty-state" style="padding: 20px">
        <p>暂无历史数据</p>
      </div>
      <div v-else class="history-list">
        <div v-for="snap in historyData" :key="snap.id" class="history-item">
          <div class="history-period">
            {{ snap.period_start?.slice(0, 7) || '-' }}
          </div>
          <div class="history-bar">
            <div
              class="history-fill"
              :style="{ width: Math.min(snap.percentage, 100) + '%' }"
              :class="{ over: snap.percentage >= 100 }"
            />
          </div>
          <div class="history-nums">
            {{ formatCurrency(snap.actual_amount) }} / {{ formatCurrency(snap.budget_amount) }}
            ({{ snap.percentage?.toFixed(0) }}%)
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
  </FeatureGate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import FeatureGate from '@/components/FeatureGate.vue'
import { useI18n } from '@/i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { t } = useI18n()
const { safeCall } = useErrorHandler()

interface BudgetStatus {
  budget: any
  spent: number
  remaining: number
  percentage: number
  status: 'green' | 'yellow' | 'red'
  projectedEndOfMonth: number
}

const loading = ref(false)
const saving = ref(false)
const budgetStatuses = ref<BudgetStatus[]>([])
const currentMonth = ref(new Date().toISOString().slice(0, 7))
const showCreateDialog = ref(false)
const showHistoryDialog = ref(false)
const editingBudget = ref<any>(null)
const historyData = ref<any[]>([])

const budgetForm = ref({
  name: '',
  amount: 1000,
  category: '',
  period: 'monthly',
  icon: '',
  rollover: false
})

const totalBudget = computed(() => budgetStatuses.value.reduce((s, b) => s + b.budget.amount, 0))
const totalSpent = computed(() => budgetStatuses.value.reduce((s, b) => s + b.spent, 0))
const totalRemaining = computed(() => budgetStatuses.value.reduce((s, b) => s + b.remaining, 0))
const totalProjected = computed(() => budgetStatuses.value.reduce((s, b) => s + b.projectedEndOfMonth, 0))

function formatCurrency(val: number) {
  return '¥' + (val ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getPeriodDates() {
  const [y, m] = currentMonth.value.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return {
    start: `${y}-${String(m).padStart(2, '0')}-01`,
    end: `${y}-${String(m).padStart(2, '0')}-${lastDay}`
  }
}

async function loadBudgetStatus() {
  if (!window.electronAPI) return
  loading.value = true
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const { start, end } = getPeriodDates()
    budgetStatuses.value = await window.electronAPI.getBudgetStatus({
      userId: user.id,
      periodStart: start,
      periodEnd: end
    })
  })
  loading.value = false
}

async function saveBudget() {
  if (!budgetForm.value.name || budgetForm.value.amount <= 0) {
    ElMessage.warning('请填写名称和金额')
    return
  }
  saving.value = true
  const action = editingBudget.value ? '更新' : '创建'
  await safeCall(async () => {
    const user = await window.electronAPI.getUser()
    if (!user) return

    if (editingBudget.value) {
      await window.electronAPI.updateBudget({
        id: editingBudget.value.id,
        name: budgetForm.value.name,
        amount: budgetForm.value.amount,
        category: budgetForm.value.category || undefined,
        period: budgetForm.value.period,
        icon: budgetForm.value.icon || undefined,
        rollover: budgetForm.value.rollover
      })
    } else {
      const { start } = getPeriodDates()
      await window.electronAPI.createBudget({
        userId: user.id,
        name: budgetForm.value.name,
        amount: budgetForm.value.amount,
        category: budgetForm.value.category || undefined,
        period: budgetForm.value.period,
        startDate: start,
        icon: budgetForm.value.icon || undefined,
        rollover: budgetForm.value.rollover
      })
    }
    showCreateDialog.value = false
    await loadBudgetStatus()
  }, { successMsg: `预算已${action}` })
  saving.value = false
}

function resetForm() {
  budgetForm.value = { name: '', amount: 1000, category: '', period: 'monthly', icon: '', rollover: false }
  editingBudget.value = null
}

async function handleAction(cmd: string, item: BudgetStatus) {
  if (cmd === 'edit') {
    editingBudget.value = item.budget
    budgetForm.value = {
      name: item.budget.name,
      amount: item.budget.amount,
      category: item.budget.category || '',
      period: item.budget.period || 'monthly',
      icon: item.budget.icon || '',
      rollover: !!item.budget.rollover
    }
    showCreateDialog.value = true
  } else if (cmd === 'history') {
    historyData.value = await safeCall(() => window.electronAPI.getBudgetHistory({ budgetId: item.budget.id, limit: 12 }))
    if (historyData.value) showHistoryDialog.value = true
  } else if (cmd === 'delete') {
    await ElMessageBox.confirm(`确定删除预算「${item.budget.name}」？`, '确认删除', { type: 'warning' })
    await window.electronAPI.deleteBudget({ id: item.budget.id })
    ElMessage.success('已删除')
    await loadBudgetStatus()
  }
}

onMounted(loadBudgetStatus)
</script>

<style lang="scss" scoped>
.budget-page {
  max-width: 960px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.page-desc {
  color: #666;
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.overview-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }
  &.warning { border-left: 3px solid #e6a23c; }

  .card-icon { font-size: 28px; }
  .card-label { font-size: 12px; color: #999; }
  .card-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-hint { font-size: 13px; margin-bottom: 16px; }
}

.budget-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #67c23a;
  transition: transform 0.2s;

  &:hover { transform: translateY(-1px); }
  &.status-yellow { border-left-color: #e6a23c; }
  &.status-red { border-left-color: #f56c6c; }
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.budget-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.budget-icon { font-size: 22px; }

.budget-meta {
  display: flex;
  flex-direction: column;
}

.budget-name { font-weight: 600; color: #1a1a2e; }
.budget-category { font-size: 12px; color: #999; }

.budget-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.budget-progress {
  margin-bottom: 8px;
}

.progress-bar-track {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;

  &.fill-green { background: linear-gradient(90deg, #67c23a, #85ce61); }
  &.fill-yellow { background: linear-gradient(90deg, #e6a23c, #f0c060); }
  &.fill-red { background: linear-gradient(90deg, #f56c6c, #f89898); }
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.budget-footer {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;

  strong { color: #1a1a2e; }
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.history-period {
  width: 80px;
  color: #666;
  flex-shrink: 0;
}

.history-bar {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.history-fill {
  height: 100%;
  background: #4facfe;
  border-radius: 3px;
  &.over { background: #f56c6c; }
}

.history-nums {
  color: #666;
  white-space: nowrap;
}
</style>
