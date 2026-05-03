<template>
  <div v-if="error" class="error-boundary">
    <div class="error-content">
      <span class="error-icon">{{ icon }}</span>
      <h3>{{ message }}</h3>
      <p class="error-detail" v-if="showDetail">{{ detail }}</p>
      <div class="error-actions">
        <el-button type="primary" @click="handleRetry" v-if="retryable">
          🔄 重新加载
        </el-button>
        <el-button @click="handleDismiss">
          关闭
        </el-button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const props = withDefaults(defineProps<{
  retryable?: boolean
  showDetail?: boolean
  message?: string
}>(), {
  retryable: true,
  showDetail: false,
  message: '页面加载出错'
})

const emit = defineEmits<{
  retry: []
  dismiss: []
}>()

const error = ref<Error | null>(null)
const icon = ref('⚠️')
const detail = ref('')

onErrorCaptured((err: Error) => {
  error.value = err
  detail.value = err.message || '未知错误'

  const lower = err.message?.toLowerCase() || ''
  if (lower.includes('network') || lower.includes('fetch')) {
    icon.value = '🌐'
  } else if (lower.includes('storage') || lower.includes('database')) {
    icon.value = '💾'
  }

  return false // 阻止继续冒泡
})

const handleRetry = () => {
  error.value = null
  detail.value = ''
  emit('retry')
}

const handleDismiss = () => {
  error.value = null
  detail.value = ''
  emit('dismiss')
}
</script>

<style lang="scss" scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px;

  .error-content {
    text-align: center;
    max-width: 400px;

    .error-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 16px;
      color: #606266;
      margin-bottom: 8px;

      .is-dark & {
        color: #b0b0b0;
      }
    }

    .error-detail {
      font-size: 13px;
      color: #909399;
      margin-bottom: 20px;
      word-break: break-all;
    }

    .error-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }
  }
}
</style>
