<template>
  <div class="accounts-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('accounts.title') }}</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        {{ t('accounts.addBtn') }}
      </el-button>
    </div>

    <!-- 总资产卡片 -->
    <div class="total-card">
      <div class="total-label">{{ t('accounts.totalAssets') }}</div>
      <div class="total-value">{{ formatCurrency(accountStore.totalAssets) }}</div>
    </div>

    <!-- 账户分类 -->
    <div class="account-sections">
      <div v-for="group in accountGroups" :key="group.type" class="account-section">
        <div class="section-header">
          <span class="section-icon">{{ group.icon }}</span>
          <span class="section-title">{{ group.name }}</span>
          <span class="section-total">{{ formatCurrency(group.total) }}</span>
        </div>
        <div class="account-cards">
          <div v-for="account in group.accounts" :key="account.id" class="account-card">
            <div class="account-info">
              <span class="account-icon">{{ account.icon }}</span>
              <span class="account-name">{{ account.name }}</span>
            </div>
            <div class="account-balance">{{ formatCurrency(account.balance) }}</div>
            <div class="account-actions">
              <el-button text size="small" @click="handleEdit(account)">编辑</el-button>
              <el-button text size="small" type="danger" @click="handleDelete(account.id)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑账户弹窗 -->
    <el-dialog v-model="showAddDialog" :title="editingAccount ? '编辑账户' : '添加账户'" width="450px">
      <el-form :model="accountForm" label-width="80px">
        <el-form-item label="账户名称">
          <el-input v-model="accountForm.name" placeholder="如：招商银行储蓄卡" />
        </el-form-item>
        <el-form-item label="账户类型">
          <el-select v-model="accountForm.type" placeholder="选择类型" style="width: 100%">
            <el-option label="现金" value="cash" />
            <el-option label="银行卡" value="bank" />
            <el-option label="投资账户" value="investment" />
            <el-option label="固定资产" value="fixed" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="余额">
          <el-input-number v-model="accountForm.balance" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="accountForm.icon" placeholder="选择图标" style="width: 100%">
            <el-option label="💵 现金" value="💵" />
            <el-option label="🏦 银行" value="🏦" />
            <el-option label="📈 投资" value="📈" />
            <el-option label="🏠 房产" value="🏠" />
            <el-option label="🚗 车辆" value="🚗" />
            <el-option label="💰 基金" value="💰" />
            <el-option label="💎 其他" value="💎" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useAccountStore } from '@/stores/accounts'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/i18n'
import type { Account } from '@wealth-freedom/shared'

const accountStore = useAccountStore()
const userStore = useUserStore()
const { t } = useI18n()

const showAddDialog = ref(false)
const editingAccount = ref<Account | null>(null)

const accountForm = ref({
  name: '',
  type: 'cash' as Account['type'],
  balance: 0,
  icon: '💵'
})

const accountGroups = computed(() => {
  const groups = [
    { type: 'cash' as const, name: t('accounts.cash'), icon: '💵', accounts: [] as Account[], total: 0 },
    { type: 'bank' as const, name: t('accounts.bank'), icon: '🏦', accounts: [] as Account[], total: 0 },
    { type: 'investment' as const, name: t('accounts.investment'), icon: '📈', accounts: [] as Account[], total: 0 },
    { type: 'fixed' as const, name: '固定资产', icon: '🏠', accounts: [] as Account[], total: 0 },
    { type: 'other' as const, name: t('accounts.other'), icon: '💎', accounts: [] as Account[], total: 0 }
  ]

  accountStore.accounts.forEach(account => {
    const group = groups.find(g => g.type === account.type)
    if (group) {
      group.accounts.push(account)
      group.total += account.balance
    }
  })

  return groups.filter(g => g.accounts.length > 0 || g.type === 'cash')
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const handleEdit = (account: Account) => {
  editingAccount.value = account
  accountForm.value = {
    name: account.name,
    type: account.type,
    balance: account.balance,
    icon: account.icon
  }
  showAddDialog.value = true
}

const handleDelete = async (id: string) => {
  await accountStore.deleteAccount(id)
}

const handleSave = async () => {
  const user = userStore.user
  if (!user) return

  if (editingAccount.value) {
    await accountStore.updateAccount(editingAccount.value.id, accountForm.value)
  } else {
    await accountStore.createAccount({
      userId: user.id,
      ...accountForm.value
    })
  }

  showAddDialog.value = false
  editingAccount.value = null
  accountForm.value = { name: '', type: 'cash', balance: 0, icon: '💵' }
}

onMounted(() => {
  accountStore.fetchAccounts()
})
</script>

<style lang="scss" scoped>
.accounts-page {
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

  .total-card {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border-radius: 16px;
    padding: 30px;
    color: #fff;
    margin-bottom: 24px;

    .total-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .total-value {
      font-size: 36px;
      font-weight: 700;
    }
  }

  .account-sections {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .account-section {
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .section-icon {
        font-size: 24px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
      }

      .section-total {
        margin-left: auto;
        font-size: 16px;
        font-weight: 600;
        color: #4facfe;
      }
    }

    .account-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
  }

  .account-card {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;

    .account-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .account-icon {
        font-size: 24px;
      }

      .account-name {
        font-weight: 500;
      }
    }

    .account-balance {
      font-size: 18px;
      font-weight: 600;
    }

    .account-actions {
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .account-actions {
      opacity: 1;
    }
  }
}
</style>
