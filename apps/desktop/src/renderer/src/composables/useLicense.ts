/**
 * v1.0.0 授权状态 Composable
 * 
 * 提供响应式的授权状态和功能门控检查
 * 在组件中使用：const { features, status, gated } = useLicense()
 */

import { ref, reactive, onMounted } from 'vue'

interface LicenseStatus {
  tier: string
  isActive: boolean
  isTrial: boolean
  expiresAt: string | null
  daysLeft: number | null
  message: string
}

interface FeatureMap {
  maxAccounts: number
  maxTransactions: number
  exportFormats: string[]
  hasBudget: boolean
  hasInvestment: boolean
  hasPdfReport: boolean
  hasAutoBackup: boolean
  hasHealthScore: boolean
}

const status = ref<LicenseStatus>({
  tier: 'free',
  isActive: true,
  isTrial: false,
  expiresAt: null,
  daysLeft: null,
  message: '免费版',
})

const features = ref<FeatureMap>({
  maxAccounts: 3,
  maxTransactions: 200,
  exportFormats: ['csv'],
  hasBudget: false,
  hasInvestment: false,
  hasPdfReport: false,
  hasAutoBackup: false,
  hasHealthScore: false,
})

let loaded = false

export function useLicense() {
  const loadStatus = async () => {
    if (!window.electronAPI?.license) return
    try {
      const [s, f] = await Promise.all([
        window.electronAPI.license.status(),
        window.electronAPI.license.features(),
      ])
      status.value = s
      features.value = f
      loaded = true
    } catch (e) {
      console.warn('读取授权状态失败:', e)
    }
  }

  // 首次调用时加载
  if (!loaded) {
    onMounted(loadStatus)
  }

  /**
   * 功能门控装饰器
   * 用法：gated('hasBudget', () => { ... }) 或直接检查
   */
  const gated = (feature: keyof FeatureMap, callback?: () => void): boolean => {
    const value = features.value[feature]
    if (typeof value === 'boolean' && !value) {
      if (callback) callback()
      return false
    }
    return true
  }

  /**
   * 检查数量限制
   */
  const checkLimit = async (feature: 'maxAccounts' | 'maxTransactions', currentCount: number) => {
    if (!window.electronAPI?.license) return { allowed: true, limit: Infinity }
    return window.electronAPI.license.checkLimit(feature, currentCount)
  }

  /**
   * 是否为付费用户
   */
  const isPaid = () => status.value.tier !== 'free'

  return {
    status,
    features,
    gated,
    checkLimit,
    isPaid,
    refresh: loadStatus,
  }
}
