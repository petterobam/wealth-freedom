<template>
  <div class="transactions-page">
    <div class="page-header">
      <h1 class="page-title">收支记录</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        记一笔
      </el-button>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handleDateChange"
      />
      <el-select v-model="filterType" placeholder="类型" clearable @change="handleFilterChange">
        <el-option label="收入" value="income" />
        <el-option label="支出" value="expense" />
      </el-select>
      <el-select v-model="filterCategory" placeholder="分类" clearable>
        <el-option label="餐饮" value="food" />
        <el-option label="交通" value="transport" />
        <el-option label="购物" value="shopping" />
        <el-option label="娱乐" value="entertainment" />
        <el-option label="工资" value="salary" />
        <el-option label="投资收益" value="investment" />
        <el-option label="其他" value="other" />
      </el-select>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card income">
        <div class="stat-label">本期收入</div>
        <div class="stat-value">{{ formatCurrency(periodIncome) }}</div>
      </div>
      <div class="stat-card expense">
        <div class="stat-label">本期支出</div>
        <div class="stat-value">{{ formatCurrency(periodExpense) }}</div>
      </div>
      <div class="stat-card balance">
        <div class="stat-label">本期结余</div>
        <div class="stat-value" :class="periodBalance >= 0 ? 'positive' : 'negative'">
          {{ formatCurrency(periodBalance) }}
        </div>
      </div>
    </div>

    <!-- 交易列表 -->
    <div class="transaction-list">
      <el-table :data="filteredTransactions" stripe>
        <el-table-column label="日期" prop="date" width="120" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" prop="category" width="100">
          <template #default="{ row }">
            {{ categoryMap[row.category] || row.category }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'income-amount' : 'expense-amount'">
              {{ row.type === 'income' ? '+' : '-' }}{{ formatCurrency(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="note" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" text size="small" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加交易弹窗 -->
    <el-dialog v-model="showAddDialog" title="记一笔" width="450px">
      <el-form :model="transactionForm" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="transactionForm.type">
            <el-radio value="expense">支出</el-radio>
            <el-radio value="income">收入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="transactionForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="transactionForm.category" placeholder="选择分类" style="width: 100%">
            <template v-if="transactionForm.type === 'expense'">
              <el-option label="餐饮" value="food" />
              <el-option label="交通" value="transport" />
              <el-option label="购物" value="shopping" />
              <el-option label="娱乐" value="entertainment" />
              <el-option label="其他" value="other" />
            </template>
            <template v-else>
              <el-option-group label="主动收入">
                <el-option label="工资" value="salary" />
                <el-option label="兼职" value="parttime" />
                <el-option label="其他" value="other" />
              </el-option-group>
              <el-option-group label="被动收入">
                <el-option label="投资收益" value="investment" />
                <el-option label="分红" value="dividend" />
                <el-option label="利息" value="interest" />
                <el-option label="产品收入" value="product" />
                <el-option label="租金" value="rental" />
                <el-option label="版税" value="royalty" />
                <el-option label="其他被动收入" value="passive" />
              </el-option-group>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="transactionForm.date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="transactionForm.note" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddTransaction">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useTransactionStore } from '@/stores/transactions'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

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

const categoryMap: Record<string, string> = {
  food: '餐饮',
  transport: '交通',
  shopping: '购物',
  entertainment: '娱乐',
  salary: '工资',
  parttime: '兼职',
  investment: '投资收益',
  dividend: '分红',
  interest: '利息',
  product: '产品收入',
  rental: '租金',
  royalty: '版税',
  passive: '其他被动收入',
  other: '其他'
}

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
    type: transactionForm.value.type,
    amount: transactionForm.value.amount,
    category: transactionForm.value.category,
    date: dayjs(transactionForm.value.date).format('YYYY-MM-DD'),
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
