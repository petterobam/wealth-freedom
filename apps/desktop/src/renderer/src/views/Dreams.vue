<template>
  <div class="dreams-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('dreams.title') }}</h1>
      <p class="page-desc">{{ t('dreams.subtitle') }}</p>
    </div>

    <!-- 梦想卡片 -->
    <div class="dreams-grid">
      <div v-for="dream in dreams" :key="dream.id" class="dream-card">
        <div class="dream-image" :style="{ backgroundImage: `url(${dream.imageUrl})` }">
          <div class="dream-overlay">
            <el-button circle @click="handleEdit(dream)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button circle type="danger" @click="handleDelete(dream.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="dream-content">
          <h3 class="dream-title">{{ dream.title }}</h3>
          <p class="dream-desc">{{ dream.description }}</p>
          <div class="dream-cost">
            <span class="label">{{ t('dreams.estimatedCost') }}</span>
            <span class="value">{{ formatCurrency(dream.estimatedCost) }}{{ t('dreams.perMonth') }}</span>
          </div>
        </div>
      </div>

      <!-- 添加梦想卡片 -->
      <div class="dream-card add-card" @click="showAddDialog = true">
        <div class="add-content">
          <el-icon><Plus /></el-icon>
          <span>{{ t('dreams.addDream') }}</span>
        </div>
      </div>
    </div>

    <!-- 梦想与财务自由的联系 -->
    <div class="dream-freedom-link">
      <h3>{{ t('dreams.dreamFreedom') }}</h3>
      <p v-html="t('dreams.monthlyCost', { amount: formatCurrency(totalDreamCost) })"></p>
      <p v-html="t('dreams.requiredPrincipal', { amount: formatCurrency(totalDreamCost * 150) })"></p>
      <el-progress
        :percentage="freedomProgress"
        :stroke-width="16"
        color="linear-gradient(90deg, #4facfe, #00f2fe)"
      />
      <p class="progress-text">{{ t('dreams.currentProgress', { percent: freedomProgress }) }}</p>
    </div>

    <!-- 添加/编辑梦想弹窗 -->
    <el-dialog v-model="showAddDialog" :title="editingDream ? t('dreams.editDream') : t('dreams.addDream')" width="500px">
      <el-form :model="dreamForm" label-width="100px">
        <el-form-item :label="t('dreams.form.title')">
          <el-input v-model="dreamForm.title" :placeholder="t('dreams.form.titlePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('dreams.form.description')">
          <el-input v-model="dreamForm.description" type="textarea" :rows="3" :placeholder="t('dreams.form.descPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('dreams.form.imageUrl')">
          <el-input v-model="dreamForm.imageUrl" :placeholder="t('dreams.form.imagePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('dreams.form.estimatedCost')">
          <el-input-number v-model="dreamForm.estimatedCost" :min="0" :precision="0" style="width: 100%" />
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
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAccountStore } from '@/stores/accounts'
import { useDebtStore } from '@/stores/debts'
import { useI18n } from '@/i18n'
import type { Dream } from '@wealth-freedom/shared'

const { t } = useI18n()
const userStore = useUserStore()
const accountStore = useAccountStore()
const debtStore = useDebtStore()

const showAddDialog = ref(false)
const editingDream = ref<Dream | null>(null)

// TODO: 替换为真实的 store
const dreams = ref<Dream[]>([
  {
    id: '1',
    userId: '1',
    title: '环游世界',
    description: '每年旅行3个月，探索世界的每一个角落',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    estimatedCost: 20000,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: '2',
    userId: '1',
    title: '海边别墅',
    description: '在海边拥有一套属于自己的房子',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    estimatedCost: 15000,
    createdAt: '',
    updatedAt: ''
  }
])

const dreamForm = ref({
  title: '',
  description: '',
  imageUrl: '',
  estimatedCost: 0
})

const totalDreamCost = computed(() => {
  return dreams.value.reduce((sum, d) => sum + d.estimatedCost, 0)
})

const netWorth = computed(() => accountStore.totalAssets - debtStore.totalDebt)

const freedomProgress = computed(() => {
  const target = totalDreamCost.value * 150
  if (target === 0) return 0
  return Math.min(100, Math.round((netWorth.value / target) * 100))
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

const handleEdit = (dream: Dream) => {
  editingDream.value = dream
  dreamForm.value = {
    title: dream.title,
    description: dream.description,
    imageUrl: dream.imageUrl,
    estimatedCost: dream.estimatedCost
  }
  showAddDialog.value = true
}

const handleDelete = async (id: string) => {
  dreams.value = dreams.value.filter(d => d.id !== id)
}

const handleSave = async () => {
  if (editingDream.value) {
    const index = dreams.value.findIndex(d => d.id === editingDream.value!.id)
    if (index > -1) {
      dreams.value[index] = {
        ...editingDream.value,
        ...dreamForm.value
      }
    }
  } else {
    const user = userStore.user
    if (user) {
      dreams.value.push({
        id: Date.now().toString(),
        userId: user.id,
        ...dreamForm.value,
        createdAt: '',
        updatedAt: ''
      })
    }
  }

  showAddDialog.value = false
  editingDream.value = null
  dreamForm.value = { title: '', description: '', imageUrl: '', estimatedCost: 0 }
}

onMounted(() => {
  accountStore.fetchAccounts()
  debtStore.fetchDebts()
})
</script>

<style lang="scss" scoped>
.dreams-page {
  .page-header {
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .page-desc {
    color: var(--text-secondary);
  }

  .dreams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .dream-card {
    background: var(--bg-card);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }

    .dream-image {
      height: 180px;
      background-size: cover;
      background-position: center;
      position: relative;

      .dream-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        opacity: 0;
        transition: opacity 0.3s;
      }

      &:hover .dream-overlay {
        opacity: 1;
      }
    }

    .dream-content {
      padding: 16px;
    }

    .dream-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .dream-desc {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .dream-cost {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;

      .label {
        color: var(--text-secondary);
        font-size: 14px;
      }

      .value {
        font-weight: 600;
        color: #4facfe;
      }
    }

    &.add-card {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 280px;
      border: 2px dashed var(--border-color);
      background: transparent;
      cursor: pointer;

      &:hover {
        border-color: #4facfe;
        background: rgba(79, 172, 254, 0.05);
      }

      .add-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);

        .el-icon {
          font-size: 32px;
        }
      }
    }
  }

  .dream-freedom-link {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 30px;
    color: var(--bg-card);

    h3 {
      font-size: 20px;
      margin-bottom: 16px;
    }

    p {
      margin-bottom: 12px;
      opacity: 0.9;

      strong {
        font-size: 20px;
        opacity: 1;
      }
    }

    .progress-text {
      text-align: center;
      margin-top: 12px;
      font-size: 14px;
    }
  }
}
</style>
