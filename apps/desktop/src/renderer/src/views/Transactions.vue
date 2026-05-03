<template>
  <div class="transactions-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('transactions.title') }}</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        {{ t('transactions.addBtn') }}
      </el-button>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="-"
        :start-placeholder="t('transactions.startDate')"
        :end-placeholder="t('transactions.endDate')"
        @change="handleDateChange"
      />
      <el-select v-model="filterType" :placeholder="t('transactions.typeFilter')" clearable @change="handleFilterChange">
        <el-option :label="t('common.income')" value="income" />
        <el-option :label="t('common.expense')" value="expense" />
      </el-select>
      <el-select v-model="filterCategory" :placeholder="t('transactions.categoryFilter')" clearable>
        <el-option v-for="(label, key) in categoryOptions" :key="key" :label="label" :value="key" />
      </el-select>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card income">
        <div class="stat-label">{{ t('transactions.periodIncome') }}</div>
        <div class="stat-value">{{ formatCurrency(periodIncome) }}</div>
      </div>
      <div class="stat-card expense">
        <div class="stat-label">{{ t('transactions.periodExpense') }}</div>
        <div class="stat-value">{{ formatCurrency(periodExpense) }}</div>
      </div>
      <div class="stat-card balance">
        <div class="stat-label">{{ t('transactions.periodBalance') }}</div>
        <div class="stat-value" :class="periodBalance >= 0 ? 'positive' : 'negative'">
          {{ formatCurrency(periodBalance) }}
        </div>
      </div>
    </div>

    <!-- 交易列表 -->
    <div class="transaction-list">
      <el-table :data="filteredTransactions" stripe>
        <el-table-column :label="t('common.date')" prop="date" width="120" />
        <el-table-column :label="t('common.type')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'income' ? t('common.income') : t('common.expense') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.category')" prop="category" width="100">
          <template #default="{ row }">
            {{ t('transactions.categories.' + row.category) || row.category }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.amount')" width="120">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'income-amount' : 'expense-amount'">
              {{ row.type === 'income' ? '+' : '-' }}{{ formatCurrency(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.note')" prop="note" />
        <el-table-column :label="t('transactions.operation')" width="100">
          <template #default="{ row }">
            <el-button type="danger" text size="small" @click="handleDelete(row.id)">
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加交易弹窗 -->
    <el-dialog v-model="showAddDialog" :title="t('transactions.addBtn')" width="450px">
      <el-form :model="transactionForm" label-width="80px">
        <el-form-item :label="t('common.type')">
          <el-radio-group v-model="transactionForm.type">
            <el-radio value="expense">{{ t('common.expense') }}</el-radio>
            <el-radio value="income">{{ t('common.income') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('common.amount')">
          <el-input-number v-model="transactionForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('common.category')">
          <el-select v-model="transactionForm.category" :placeholder="t('transactions.selectCategory')" style="width: 100%">
            <template v-if="transactionForm.type === 'expense'">
              <el-option v-for="cat in expenseCategories" :key="cat.value" :label="cat.label" :value="cat.value" />
            </template>
            <template v-else>
              <el-option-group :label="t('transactions.activeIncome')">
                <el-option v-for="cat in activeIncomeCategories" :key="cat.value" :label="cat.label" :value="cat.value" />
              </el-option-group>
              <el-option-group :label="t('transactions.passiveIncome')">
                <el-option v-for="cat in passiveIncomeCategories" :key="cat.value" :label="cat.label" :value="cat.value" />
              </el-option-group>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.date')">
          <el-date-picker v-model="transactionForm.date" type="date" :placeholder="t('transactions.selectDate')" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('common.note')">
          <el-input v-model="transactionForm.note" :placeholder="t('transactions.optionalNote')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleAddTransaction">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useTransactionStore } from '@/stores/transactions'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/i18n'
import dayjs from 'dayjs'

const { t } = useI18n()

const transactionStore = useTransactionStore()
const userStore = useUserStore()

const showAddDialog = ref(false)
const dateRange = ref<[Date, Date] | null>(null)
const filterType = ref('')
const filterCategory = ref('')

const transactionForm = ref({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  category: '',
  date: new Date(),
  note: ''
})

const categoryOptions = computed(() => {
  const keys = ['food', 'transport', 'shopping', 'entertainment', 'salary', 'parttime', 'investment', 'dividend', 'interest', 'product', 'rental', 'royalty', 'passive', 'other']
  const map: Record<string, string> = {}
  keys.forEach(k => { map[k] = t('transactions.categories.' + k) })
  return map
})

const expenseCategories = computed(() => [
  { value: 'food', label: t('transactions.categories.food') },
  { value: 'transport', label: t('transactions.categories.transport') },
  { value: 'shopping', label: t('transactions.categories.shopping') },
  { value: 'entertainment', label: t('transactions.categories.entertainment') },
  { value: 'other', label: t('transactions.categories.other') },
])

const activeIncomeCategories = computed(() => [
  { value: 'salary', label: t('transactions.categories.salary') },
  { value: 'parttime', label: t('transactions.categories.parttime') },
  { value: 'other', label: t('transactions.categories.other') },
])

const passiveIncomeCategories = computed(() => [
  { value: 'investment', label: t('transactions.categories.investment') },
  { value: 'dividend', label: t('transactions.categories.dividend') },
  { value: 'interest', label: t('transactions.categories.interest') },
  { value: 'product', label: t('transactions.categories.product') },
  { value: 'rental', label: t('transactions.categories.rental') },
  { value: 'royalty', label: t('transactions.categories.royalty') },
  { value: 'passive', label: t('transactions.categories.passiveOther') },
])

const filteredTransactions = computed(() => {
  let result = transactionStore.transactions

  if (filterType.value) {
    result = result.filter(t => t.type === filterType.value)
  }

  if (filterCategory.value) {
    result = result.filter(t => t.category === filterCategory.value)
  }

  return result
})

const periodIncome = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const periodExpense = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

const periodBalance = computed(() => periodIncome.value - periodExpense.value)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const handleDateChange = () => {
  if (dateRange.value) {
    transactionStore.fetchTransactions({
      startDate: dayjs(dateRange.value[0]).format('YYYY-MM-DD'),
      endDate: dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    })
  }
}

const handleFilterChange = () => {
  // 筛选逻辑已在 computed 中处理
}

const handleAddTransaction = async () => {
  const user = userStore.user
  if (!user) return

  await transactionStore.createTransaction({
    userId: user.id,
    type: transactionForm.value.type as any,
    amount: transactionForm.value.amount,
    category: transactionForm.value.category,
    date: new Date(transactionForm.value.date) as any,
    note: transactionForm.value.note
  })

  showAddDialog.value = false
  transactionForm.value = {
    type: 'expense',
    amount: 0,
    category: '',
    date: new Date(),
    note: ''
  }
}

const handleDelete = async (id: string) => {
  await transactionStore.deleteTransaction(id)
}

onMounted(() => {
  transactionStore.fetchTransactions()
})
</script>

<style lang="scss" scoped>
.transactions-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 600;
  }

  .filters {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    text-align: center;

    &.income {
      border-left: 4px solid #67c23a;
    }

    &.expense {
      border-left: 4px solid #f56c6c;
    }

    &.balance {
      border-left: 4px solid #4facfe;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;

      &.positive {
        color: #67c23a;
      }

      &.negative {
        color: #f56c6c;
      }
    }
  }

  .transaction-list {
    background: #fff;
    border-radius: 12px;
    padding: 16px;

    .income-amount {
      color: #67c23a;
      font-weight: 600;
    }

    .expense-amount {
      color: #f56c6c;
      font-weight: 600;
    }
  }
}
</style>
