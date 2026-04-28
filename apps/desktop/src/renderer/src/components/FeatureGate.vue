<template>
  <div v-if="locked" class="feature-gate-overlay">
    <div class="gate-card">
      <div class="gate-icon">🔒</div>
      <h3 class="gate-title">{{ featureName }}</h3>
      <p class="gate-desc">{{ description || '升级以解锁此功能' }}</p>
      <div class="gate-badges">
        <span v-if="requiredTier === 'basic'" class="badge badge-basic">基础版</span>
        <span v-else class="badge badge-pro">旗舰版</span>
        <span class="badge badge-trial">30天免费试用</span>
      </div>
      <el-button type="primary" @click="goToLicense">
        立即升级
      </el-button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLicense } from '@/composables/useLicense'

const props = defineProps<{
  feature: string
  featureName: string
  description?: string
  requiredTier?: 'basic' | 'pro'
}>()

const router = useRouter()
const { features, status } = useLicense()

const locked = computed(() => {
  if (status.value.tier === 'trial') return false // 试用版解锁所有功能
  const value = (features.value as any)[props.feature]
  if (typeof value === 'boolean') return !value
  return false
})

const goToLicense = () => {
  router.push('/license')
}
</script>

<style lang="scss" scoped>
.feature-gate-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.gate-card {
  text-align: center;
  max-width: 360px;
  padding: 48px 36px;
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.gate-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.gate-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
}

.gate-desc {
  color: var(--el-text-color-secondary);
  margin: 0 0 20px;
  font-size: 14px;
}

.gate-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &-basic {
    background: #e6f7ff;
    color: #1890ff;
  }

  &-pro {
    background: #fff7e6;
    color: #fa8c16;
  }

  &-trial {
    background: #f6ffed;
    color: #52c41a;
  }
}
</style>
