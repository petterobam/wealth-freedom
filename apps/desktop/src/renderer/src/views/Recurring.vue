<template>
  <FeatureGate feature="hasRecurring" feature-name="周期性交易" description="自动记录周期性收支，告别重复手动录入" required-tier="basic">
  <div class="recurring-page">
    <h1 class="page-title">周期性交易</h1>
    <p class="page-desc">自动化你的周期收支，让规律性收入支出不再手动录入</p>

    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterStatus" style="width: 120px" @change="loadRules">
          <el-option label="全部" value="all" />
          <el-option label="活跃" value="active" />
          <el-option label="已暂停" value="paused" />
        </el-select>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新建规则
      </el-button>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon">🔄</div>
        <div class="card-info">
          <div class="card-label">活跃规则</div>
          <div class="card-value">{{ activeCount }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">💰</div>
        <div class="card-info">
          <div class="card-label">月度自动收入</div>
          <div class="card-value">{{ formatCurrency(monthlyIncome) }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">💸</div>
        <div class="card-info">
          <div class="card-label">月度自动支出</div>
          <div class="card-value">{{ formatCurrency(monthlyExpense) }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">📅</div>
        <div class="card-info">
          <div class="card-label">下次执行</div>
          <div class="card-value">{{ nextExecution || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- 规则列表 -->
    <div class="rule-list" v-loading="loading">
      <div v-if="filteredRules.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">🔄</div>
        <p>还没有周期性交易规则</p>
        <p class="empty-hint">创建规则，自动记录工资、房租、订阅等周期性收支</p>
        <el-button type="primary" @click="openCreateDialog">创建规则</el-button>
      </div>

      <div
        v-for="rule in filteredRules"
        :key="rule.id"
        class="rule-item"
        :class="{ paused: rule.status === 'paused' }"
      >
        <div class="rule-header">
          <div class="rule-left">
            <span class="rule-type-badge" :class="rule.type">
              {{ rule.type === 'income' ? '收入' : '支出' }}
            </span>
            <div class="rule-meta">
              <span class="rule-name">{{ rule.name }}</span>
              <span class="rule-freq">{{ formatFrequency(rule) }}</span>
            </div>
          </div>
          <div class="rule-actions">
            <el-tag
              :type="rule.status === 'active' ? 'success' : 'info'"
              size="small"
            >
              {{ rule.status === 'active' ? '活跃' : '已暂停' }}
            </el-tag>
            <el-dropdown trigger="click" @command="(cmd: string) => handleAction(cmd, rule)">
              <el-button text size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="toggle">
                    {{ rule.status === 'active' ? '暂停' : '恢复' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="rule-details">
          <div class="detail-item">
            <span class="detail-label">金额</span>
            <span class="detail-value amount" :class="rule.type">
              {{ rule.type === 'income' ? '+' : '-' }}{{ formatCurrency(rule.amount) }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">下次执行</span>
            <span class="detail-value">{{ rule.next_execution || '-' }}</span>
          </div>
          <div class="detail-item" v-if="rule.last_execution">
            <span class="detail-label">上次执行</span>
            <span class="detail-value">{{ rule.last_execution }}</span>
          </div>
          <div class="detail-item" v-if="rule.end_date">
            <span class="detail-label">结束日期</span>
            <span class="detail-value">{{ rule.end_date }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="editingRule ? '编辑规则' : '新建周期性交易'"
      width="520px"
      @close="resetForm"
    >
      <el-form :model="form" label-width="90px" label-position="left">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="如：月工资、房租、Netflix订阅" />
        </el-form-item>

        <el-form-item label="类型" required>
          <el-radio-group v-model="form.type">
            <el-radio value="income">收入</el-radio>
            <el-radio value="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="金额" required>
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="账户" required>
          <el-select v-model="form.account_id" style="width: 100%" placeholder="选择关联账户">
            <el-option
              v-for="acc in accounts"
              :key="acc.id"
              :label="acc.name"
              :value="acc.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="如：工资、房租、娱乐" />
        </el-form-item>

        <el-divider content-position="left">执行频率</el-divider>

        <el-form-item label="频率" required>
          <el-select v-model="form.frequency" style="width: 100%">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="每年" value="yearly" />
          </el-select>
        </el-form-item>

        <el-form-item label="间隔" v-if="form.frequency !== 'monthly' || form.interval_num > 1">
          <el-input-number
            v-model="form.interval_num"
            :min="1"
            :max="99"
            style="width: 100%"
          />
          <span class="form-hint">{{ intervalHint }}</span>
        </el-form-item>

        <el-form-item label="执行日" v-if="form.frequency === 'weekly'">
          <el-select v-model="form.day_of_week" style="width: 100%">
            <el-option :value="0" label="周日" />
            <el-option :value="1" label="周一" />
            <el-option :value="2" label="周二" />
            <el-option :value="3" label="周三" />
            <el-option :value="4" label="周四" />
            <el-option :value="5" label="周五" />
            <el-option :value="6" label="周六" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行日" v-if="form.frequency === 'monthly'">
          <el-input-number
            v-model="form.day_of_month"
            :min="1"
            :max="28"
            style="width: 160px"
          />
          <span class="form-hint">每月几号执行（1-28，自动处理月末）</span>
        </el-form-item>

        <el-divider content-position="left">时间范围</el-divider>

        <el-form-item label="开始日期" required>
          <el-date-picker
            v-model="form.start_date"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束日期">
          <el-date-picker
            v-model="form.end_date"
            type="date"
            placeholder="留空则永久执行"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            :disabled-date="(d: Date) => d < new Date(form.start_date)"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
  </FeatureGate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import FeatureGate from '@/components/FeatureGate.vue'

interface RecurringRule {
  id: string
  user_id: string
  name: string
  amount: number
  type: 'income' | 'expense'
  account_id: string
  category: string | null
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval_num: number
  day_of_week: number | null
  day_of_month: number | null
  start_date: string
  end_date: string | null
  next_execution: string
  status: 'active' | 'paused'
  last_execution: string | null
  notes: string | null
}

const loading = ref(false)
const saving = ref(false)
const rules = ref<RecurringRule[]>([])
const accounts = ref<any[]>([])
const filterStatus = ref('all')
const showDialog = ref(false)
const editingRule = ref<RecurringRule | null>(null)

const form = ref({
  name: '',
  amount: 1000,
  type: 'income' as 'income' | 'expense',
  account_id: '',
  category: '',
  frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval_num: 1,
  day_of_week: 1 as number | null,
  day_of_month: 1 as number | null,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  notes: ''
})

const filteredRules = computed(() => {
  if (filterStatus.value === 'all') return rules.value
  return rules.value.filter(r => r.status === filterStatus.value)
})

const activeCount = computed(() => rules.value.filter(r => r.status === 'active').length)

const monthlyIncome = computed(() => {
  return rules.value
    .filter(r => r.status === 'active' && r.type === 'income')
    .reduce((sum, r) => sum + toMonthly(r), 0)
})

const monthlyExpense = computed(() => {
  return rules.value
    .filter(r => r.status === 'active' && r.type === 'expense')
    .reduce((sum, r) => sum + toMonthly(r), 0)
})

const nextExecution = computed(() => {
  const active = rules.value
    .filter(r => r.status === 'active' && r.next_execution)
    .sort((a, b) => a.next_execution.localeCompare(b.next_execution))
  return active[0]?.next_execution || ''
})

const intervalHint = computed(() => {
  const unit: Record<string, string> = { daily: '天', weekly: '周', monthly: '月', yearly: '年' }
  return `每${form.value.interval_num}${unit[form.value.frequency] || ''}执行一次`
})

function toMonthly(rule: RecurringRule): number {
  const { frequency, interval_num, amount } = rule
  switch (frequency) {
    case 'daily': return (amount / interval_num) * 30
    case 'weekly': return (amount / interval_num) * (30 / 7)
    case 'monthly': return amount / interval_num
    case 'yearly': return (amount / interval_num) / 12
    default: return 0
  }
}

function formatCurrency(val: number) {
  return '¥' + (val ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFrequency(rule: RecurringRule): string {
  const unit: Record<string, string> = { daily: '天', weekly: '周', monthly: '月', yearly: '年' }
  const u = unit[rule.frequency] || ''
  if (rule.interval_num === 1) return `每${u}`
  return `每${rule.interval_num}${u}`
}

async function loadRules() {
  if (!window.electronAPI) return
  loading.value = true
  try {
    const user = await window.electronAPI.getUser()
    if (!user) return
    const [ruleList, accList] = await Promise.all([
      window.electronAPI.listRecurringRules(user.id),
      window.electronAPI.getAccounts()
    ])
    rules.value = ruleList || []
    accounts.value = accList || []
  } catch (e: any) {
    ElMessage.error('加载失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingRule.value = null
  form.value = {
    name: '',
    amount: 1000,
    type: 'income',
    account_id: accounts.value[0]?.id || '',
    category: '',
    frequency: 'monthly',
    interval_num: 1,
    day_of_week: 1,
    day_of_month: 1,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    notes: ''
  }
  showDialog.value = true
}

async function saveRule() {
  if (!form.value.name || form.value.amount <= 0 || !form.value.account_id || !form.value.start_date) {
    ElMessage.warning('请填写必要信息')
    return
  }
  saving.value = true
  try {
    const user = await window.electronAPI.getUser()
    if (!user) return

    const data: any = {
      user_id: user.id,
      name: form.value.name,
      amount: form.value.amount,
      type: form.value.type,
      account_id: form.value.account_id,
      category: form.value.category || null,
      frequency: form.value.frequency,
      interval_num: form.value.interval_num,
      day_of_week: form.value.frequency === 'weekly' ? form.value.day_of_week : null,
      day_of_month: form.value.frequency === 'monthly' ? form.value.day_of_month : null,
      start_date: form.value.start_date,
      end_date: form.value.end_date || null,
      notes: form.value.notes || null,
      status: 'active'
    }

    if (editingRule.value) {
      await window.electronAPI.updateRecurringRule(editingRule.value.id, data)
      ElMessage.success('规则已更新')
    } else {
      await window.electronAPI.createRecurringRule(data)
      ElMessage.success('规则已创建')
    }
    showDialog.value = false
    await loadRules()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  editingRule.value = null
}

async function handleAction(cmd: string, rule: RecurringRule) {
  if (cmd === 'toggle') {
    await window.electronAPI.toggleRecurringRule(rule.id)
    ElMessage.success(rule.status === 'active' ? '已暂停' : '已恢复')
    await loadRules()
  } else if (cmd === 'edit') {
    editingRule.value = rule
    form.value = {
      name: rule.name,
      amount: rule.amount,
      type: rule.type,
      account_id: rule.account_id,
      category: rule.category || '',
      frequency: rule.frequency,
      interval_num: rule.interval_num,
      day_of_week: rule.day_of_week,
      day_of_month: rule.day_of_month,
      start_date: rule.start_date,
      end_date: rule.end_date || '',
      notes: rule.notes || ''
    }
    showDialog.value = true
  } else if (cmd === 'delete') {
    await ElMessageBox.confirm(`确定删除规则「${rule.name}」？`, '确认删除', { type: 'warning' })
    await window.electronAPI.deleteRecurringRule(rule.id)
    ElMessage.success('已删除')
    await loadRules()
  }
}

onMounted(loadRules)
</script>

<style lang="scss" scoped>
.recurring-page {
  max-width: 960px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #1a1a2e);
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
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }

  .card-icon { font-size: 28px; }
  .card-label { font-size: 12px; color: #999; }
  .card-value { font-size: 16px; font-weight: 700; color: var(--text-primary, #1a1a2e); }
}

.rule-list {
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

.rule-item {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #4facfe;
  transition: transform 0.2s, opacity 0.2s;

  &:hover { transform: translateY(-1px); }

  &.paused {
    border-left-color: #c0c4cc;
    opacity: 0.7;
  }
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rule-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rule-type-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;

  &.income {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
  }
  &.expense {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
  }
}

.rule-meta {
  display: flex;
  flex-direction: column;
}

.rule-name {
  font-weight: 600;
  color: var(--text-primary, #1a1a2e);
}

.rule-freq {
  font-size: 12px;
  color: #999;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-details {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #999;
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary, #1a1a2e);

  &.amount.income { color: #67c23a; }
  &.amount.expense { color: #f56c6c; }
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}
</style>
