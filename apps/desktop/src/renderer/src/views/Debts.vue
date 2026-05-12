<template>
  <div class="debts-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('debts.title') }}</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        {{ t('debts.addDebt') }}
      </el-button>
    </div>

    <!-- 总负债卡片 -->
    <div class="debt-summary">
      <div class="summary-card total-debt">
        <div class="summary-icon">💳</div>
        <div class="summary-info">
          <div class="summary-label">{{ t('debts.totalDebt') }}</div>
          <div class="summary-value">{{ formatCurrency(debtStore.totalDebt) }}</div>
        </div>
      </div>
      <div class="summary-card monthly-payment">
        <div class="summary-icon">📅</div>
        <div class="summary-info">
          <div class="summary-label">{{ t('debts.monthlyPayment') }}</div>
          <div class="summary-value">{{ formatCurrency(debtStore.monthlyPayment) }}</div>
        </div>
      </div>
    </div>

    <!-- 消费债警告 -->
    <div v-if="debtStore.consumerDebts.length > 0" class="warning-card">
      <el-icon><WarningFilled /></el-icon>
      <div class="warning-content">
        <h4>{{ t('debts.consumerDebtFound', { count: debtStore.consumerDebts.length }) }}</h4>
        <p>{{ t('debts.consumerDebtWarning') }}</p>
      </div>
    </div>

    <!-- 负债列表 -->
    <div class="debt-list">
      <div v-for="debt in debtStore.debts" :key="debt.id" class="debt-card">
        <div class="debt-header">
          <div class="debt-type-tag" :class="debt.type">
            {{ t('debts.types.' + debt.type) }}
          </div>
          <div class="debt-actions">
            <el-button text size="small" @click="handleEdit(debt)">{{ t('common.edit') }}</el-button>
            <el-button text size="small" type="danger" @click="handleDelete(debt.id)">{{ t('common.delete') }}</el-button>
          </div>
        </div>

        <h3 class="debt-name">{{ debt.name }}</h3>

        <div class="debt-progress">
          <el-progress
            :percentage="debtProgress(debt)"
            :stroke-width="12"
            :color="debtProgress(debt) >= 100 ? '#67c23a' : '#e6a23c'"
          />
        </div>

        <div class="debt-details">
          <div class="detail-item">
            <span class="label">{{ t('debts.totalAmount') }}</span>
            <span class="value">{{ formatCurrency(debt.totalAmount) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ t('debts.remaining') }}</span>
            <span class="value highlight">{{ formatCurrency(debt.remainingAmount) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ t('debts.monthlyPayment') }}</span>
            <span class="value">{{ formatCurrency(debt.monthlyPayment) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ t('debts.interestRate') }}</span>
            <span class="value">{{ debt.interestRate }}%</span>
          </div>
        </div>
      </div>

      <div v-if="debtStore.debts.length === 0" class="empty-state">
        <span class="empty-icon">🎉</span>
        <p>{{ t('debts.noDebts') }}</p>
        <p class="empty-tip">{{ t('debts.emptyTip') }}</p>
      </div>
    </div>

    <!-- 添加/编辑负债弹窗 -->
    <el-dialog v-model="showAddDialog" :title="editingDebt ? t('debts.editDebt') : t('debts.addDebt')" width="500px">
      <el-form :model="debtForm" label-width="100px">
        <el-form-item :label="t('debts.form.name')">
          <el-input v-model="debtForm.name" :placeholder="t('debts.form.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('debts.form.type')">
          <el-select v-model="debtForm.type" :placeholder="t('debts.form.selectType')" style="width: 100%">
            <el-option :label="t('debts.types.consumer')" value="consumer" />
            <el-option :label="t('debts.types.mortgage')" value="mortgage" />
            <el-option :label="t('debts.types.car')" value="car" />
            <el-option :label="t('debts.types.other')" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('debts.form.totalAmount')">
          <el-input-number v-model="debtForm.totalAmount" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('debts.form.remainingAmount')">
          <el-input-number v-model="debtForm.remainingAmount" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('debts.form.monthlyPayment')">
          <el-input-number v-model="debtForm.monthlyPayment" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('debts.form.interestRate')">
          <el-input-number v-model="debtForm.interestRate" :min="0" :precision="2" :step="0.1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, WarningFilled } from '@element-plus/icons-vue'
import { useDebtStore } from '@/stores/debts'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/i18n'
import type { Debt } from '@wealth-freedom/shared'

const { t } = useI18n()
const debtStore = useDebtStore()
const userStore = useUserStore()

const showAddDialog = ref(false)
const editingDebt = ref<Debt | null>(null)

const debtForm = ref({
  name: '',
  type: 'consumer' as Debt['type'],
  totalAmount: 0,
  remainingAmount: 0,
  monthlyPayment: 0,
  interestRate: 0
})

const debtTypeMap: Record<string, string> = {
  consumer: t('debts.types.consumer'),
  mortgage: t('debts.types.mortgage'),
  car: t('debts.types.car'),
  other: t('debts.types.other')
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const debtProgress = (debt: Debt) => {
  if (debt.totalAmount === 0) return 0
  return Math.round(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100)
}

const handleEdit = (debt: Debt) => {
  editingDebt.value = debt
  debtForm.value = {
    name: debt.name,
    type: debt.type,
    totalAmount: debt.totalAmount,
    remainingAmount: debt.remainingAmount,
    monthlyPayment: debt.monthlyPayment,
    interestRate: debt.interestRate
  }
  showAddDialog.value = true
}

const handleDelete = async (id: string) => {
  await debtStore.deleteDebt(id)
}

const handleSave = async () => {
  const user = userStore.user
  if (!user) return

  if (editingDebt.value) {
    await debtStore.updateDebt(editingDebt.value.id, debtForm.value)
  } else {
    await debtStore.createDebt({
      userId: user.id,
      ...debtForm.value
    })
  }

  showAddDialog.value = false
  editingDebt.value = null
  debtForm.value = {
    name: '',
    type: 'consumer',
    totalAmount: 0,
    remainingAmount: 0,
    monthlyPayment: 0,
    interestRate: 0
  }
}

onMounted(() => {
  debtStore.fetchDebts()
})
</script>

<style lang="scss" scoped>
.debts-page {
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

  .debt-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 12px;

    &.total-debt {
      background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%);
      color: #fff;
    }

    &.monthly-payment {
      background: linear-gradient(135deg, #e6a23c 0%, #f5d442 100%);
      color: #fff;
    }

    .summary-icon {
      font-size: 36px;
    }

    .summary-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
    }
  }

  .warning-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #fef0f0;
    border-radius: 12px;
    margin-bottom: 20px;
    color: var(--el-color-danger);

    h4 {
      margin-bottom: 4px;
    }

    p {
      font-size: 14px;
      opacity: 0.9;
    }
  }

  .debt-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .debt-card {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 20px;

    .debt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .debt-type-tag {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;

      &.consumer {
        background: #fef0f0;
        color: var(--el-color-danger);
      }

      &.mortgage {
        background: #f4f4f5;
        color: var(--text-secondary);
      }
    }

    .debt-name {
      font-size: 18px;
      margin-bottom: 16px;
    }

    .debt-progress {
      margin-bottom: 16px;
    }

    .debt-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .detail-item {
        .label {
          display: block;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .value {
          font-weight: 600;

          &.highlight {
            color: var(--el-color-danger);
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px;
    background: var(--bg-card);
    border-radius: 12px;

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
    }

    .empty-tip {
      color: var(--text-secondary);
      font-size: 14px;
    }
  }
}
</style>
