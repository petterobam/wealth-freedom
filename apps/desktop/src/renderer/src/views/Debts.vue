<template>
  <div class="debts-page">
    <div class="page-header">
      <h1 class="page-title">负债管理</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加负债
      </el-button>
    </div>

    <!-- 总负债卡片 -->
    <div class="debt-summary">
      <div class="summary-card total-debt">
        <div class="summary-icon">💳</div>
        <div class="summary-info">
          <div class="summary-label">总负债</div>
          <div class="summary-value">{{ formatCurrency(debtStore.totalDebt) }}</div>
        </div>
      </div>
      <div class="summary-card monthly-payment">
        <div class="summary-icon">📅</div>
        <div class="summary-info">
          <div class="summary-label">月还款额</div>
          <div class="summary-value">{{ formatCurrency(debtStore.monthlyPayment) }}</div>
        </div>
      </div>
    </div>

    <!-- 消费债警告 -->
    <div v-if="debtStore.consumerDebts.length > 0" class="warning-card">
      <el-icon><WarningFilled /></el-icon>
      <div class="warning-content">
        <h4>发现 {{ debtStore.consumerDebts.length }} 笔消费债</h4>
        <p>消费债（信用卡、花呗等）没有任何优点，建议优先清偿！</p>
      </div>
    </div>

    <!-- 负债列表 -->
    <div class="debt-list">
      <div v-for="debt in debtStore.debts" :key="debt.id" class="debt-card">
        <div class="debt-header">
          <div class="debt-type-tag" :class="debt.type">
            {{ debtTypeMap[debt.type] }}
          </div>
          <div class="debt-actions">
            <el-button text size="small" @click="handleEdit(debt)">编辑</el-button>
            <el-button text size="small" type="danger" @click="handleDelete(debt.id)">删除</el-button>
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
            <span class="label">总金额</span>
            <span class="value">{{ formatCurrency(debt.totalAmount) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">剩余</span>
            <span class="value highlight">{{ formatCurrency(debt.remainingAmount) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">月还款</span>
            <span class="value">{{ formatCurrency(debt.monthlyPayment) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">利率</span>
            <span class="value">{{ debt.interestRate }}%</span>
          </div>
        </div>
      </div>

      <div v-if="debtStore.debts.length === 0" class="empty-state">
        <span class="empty-icon">🎉</span>
        <p>暂无负债记录</p>
        <p class="empty-tip">保持无债一身轻！</p>
      </div>
    </div>

    <!-- 添加/编辑负债弹窗 -->
    <el-dialog v-model="showAddDialog" :title="editingDebt ? '编辑负债' : '添加负债'" width="500px">
      <el-form :model="debtForm" label-width="100px">
        <el-form-item label="负债名称">
          <el-input v-model="debtForm.name" placeholder="如：招商银行信用卡" />
        </el-form-item>
        <el-form-item label="负债类型">
          <el-select v-model="debtForm.type" placeholder="选择类型" style="width: 100%">
            <el-option label="消费债（信用卡）" value="consumer" />
            <el-option label="房贷" value="mortgage" />
            <el-option label="车贷" value="car" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="总金额">
          <el-input-number v-model="debtForm.totalAmount" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="剩余金额">
          <el-input-number v-model="debtForm.remainingAmount" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="月还款额">
          <el-input-number v-model="debtForm.monthlyPayment" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="年利率(%)">
          <el-input-number v-model="debtForm.interestRate" :min="0" :precision="2" :step="0.1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, WarningFilled } from '@element-plus/icons-vue'
import { useDebtStore } from '@/stores/debts'
import { useUserStore } from '@/stores/user'
import type { Debt } from '@wealth-freedom/shared'

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
  consumer: '消费债',
  mortgage: '房贷',
  car: '车贷',
  other: '其他'
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
    color: #f56c6c;

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
    background: #fff;
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
        color: #f56c6c;
      }

      &.mortgage {
        background: #f4f4f5;
        color: #909399;
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
          color: #909399;
          margin-bottom: 4px;
        }

        .value {
          font-weight: 600;

          &.highlight {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px;
    background: #fff;
    border-radius: 12px;

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
    }

    .empty-tip {
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
