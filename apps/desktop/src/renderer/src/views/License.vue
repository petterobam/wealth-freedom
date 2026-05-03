<template>
  <div class="license-page">
    <h2>{{ t('license.title') }}</h2>

    <!-- 当前状态卡片 -->
    <el-card class="status-card" shadow="hover">
      <div class="status-header">
        <div class="status-info">
          <el-tag :type="statusTagType" size="large" effect="dark">
            {{ statusLabel }}
          </el-tag>
          <span v-if="licenseStatus.daysLeft !== null && licenseStatus.isActive" class="days-left">
            {{ licenseStatus.daysLeft > 0 ? t('license.daysLeft', { days: licenseStatus.daysLeft }) : licenseStatus.message }}
          </span>
        </div>
        <el-button v-if="licenseStatus.tier !== 'free' && licenseStatus.tier !== 'trial'"
                   type="danger" plain size="small" @click="handleDeactivate">
          {{ t('license.deactivate') }}
        </el-button>
      </div>
      <p class="status-message">{{ licenseStatus.message }}</p>
    </el-card>

    <!-- 在线验证状态 -->
    <el-card v-if="licenseStatus.tier !== 'free'" class="online-status-card" shadow="hover">
      <div class="online-status-header">
        <span>{{ t('license.onlineCheck') }}</span>
        <el-tag :type="onlineCheckNeeded ? 'warning' : 'success'" size="small">
          {{ onlineCheckNeeded ? t('license.onlineCheckNeeded') : t('license.onlineCheckNormal') }}
        </el-tag>
      </div>
      <p class="online-status-desc">
        {{ onlineCheckNeeded ? t('license.onlineCheckNeededDesc') : t('license.onlineCheckNormalDesc') }}
      </p>
      <el-button v-if="onlineCheckNeeded" type="primary" size="small" :loading="checkingOnline" @click="handleOnlineCheck">
        {{ t('license.verifyNow') }}
      </el-button>
    </el-card>

    <!-- 版本对比 -->
    <div class="plans">
      <el-card v-for="plan in plans" :key="plan.key"
               class="plan-card"
               :class="{ active: licenseStatus.tier === plan.key }"
               shadow="hover">
        <div class="plan-header">
          <span class="plan-icon">{{ plan.icon }}</span>
          <h3>{{ plan.nameLabel }}</h3>
          <div class="plan-price">
            <span class="price">{{ plan.priceLabel }}</span>
            <span class="period">{{ plan.periodLabel }}</span>
          </div>
        </div>
        <ul class="plan-features">
          <li v-for="f in plan.featureItems" :key="f">
            <el-icon color="#67c23a"><Select /></el-icon>
            {{ f }}
          </li>
          <li v-for="f in plan.limitationItems" :key="f" class="limited">
            <el-icon color="#909399"><CloseBold /></el-icon>
            {{ f }}
          </li>
        </ul>
        <el-button v-if="plan.key !== 'free' && licenseStatus.tier !== plan.key"
                   :type="plan.key === 'pro' ? 'primary' : 'default'"
                   @click="handleUpgrade(plan.key)">
          {{ t('license.upgradeTo', { name: plan.nameLabel }) }}
        </el-button>
        <el-tag v-else-if="licenseStatus.tier === plan.key" type="success" effect="plain">
          {{ t('license.currentVersion') }}
        </el-tag>
      </el-card>
    </div>

    <!-- 激活密钥 -->
    <el-card class="activate-card" shadow="hover">
      <h3>{{ t('license.activateLicense') }}</h3>
      <p class="activate-desc">{{ t('license.activateDesc') }}</p>
      <div class="activate-form">
        <el-input
          v-model="licenseKey"
          :placeholder="t('license.inputPlaceholder')"
          size="large"
          clearable
          @keyup.enter="handleActivate"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" :loading="activating" @click="handleActivate">
          {{ t('license.activateBtn') }}
        </el-button>
      </div>
    </el-card>

    <!-- 续期 -->
    <el-card v-if="licenseStatus.tier !== 'free' && licenseStatus.tier !== 'trial'" class="renew-card" shadow="hover">
      <div class="renew-header">
        <h3>{{ t('license.renewManagement') }}</h3>
        <el-button type="primary" plain :loading="renewing" @click="handleRenew">
          {{ t('license.renewNow') }}
        </el-button>
      </div>
      <p>{{ t('license.renewInfo') }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Select, CloseBold, Key } from '@element-plus/icons-vue'
import useI18n from '../i18n'

const { t } = useI18n()

interface LicenseStatus {
  tier: string
  isActive: boolean
  isTrial: boolean
  expiresAt: string | null
  daysLeft: number | null
  message: string
}

const licenseStatus = ref<LicenseStatus>({
  tier: 'free',
  isActive: true,
  isTrial: false,
  expiresAt: null,
  daysLeft: null,
  message: '免费版',
})

const licenseKey = ref('')
const activating = ref(false)
const renewing = ref(false)
const onlineCheckNeeded = ref(false)
const checkingOnline = ref(false)

const plans = computed(() => [
  {
    key: 'free',
    nameLabel: t('license.planFree'),
    priceLabel: t('license.planFreePrice'),
    periodLabel: t('license.planFreePeriod'),
    icon: '🆓',
    featureItems: t('license.freeFeatures').split(', '),
    limitationItems: t('license.freeLimitations').split(', '),
  },
  {
    key: 'basic',
    nameLabel: t('license.planBasic'),
    priceLabel: t('license.planBasicPrice'),
    periodLabel: t('license.planBasicPeriod'),
    icon: '⭐',
    featureItems: t('license.basicFeatures').split(', '),
    limitationItems: t('license.basicLimitations').split(', '),
  },
  {
    key: 'pro',
    nameLabel: t('license.planPro'),
    priceLabel: t('license.planProPrice'),
    periodLabel: t('license.planProPeriod'),
    icon: '👑',
    featureItems: t('license.proFeatures').split(', '),
    limitationItems: [],
  },
])

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    free: t('license.statusFree'),
    trial: t('license.statusTrial'),
    basic: t('license.statusBasic'),
    pro: t('license.statusPro'),
  }
  return map[licenseStatus.value.tier] || t('license.statusFree')
})

const statusTagType = computed(() => {
  if (!licenseStatus.value.isActive) return 'danger'
  const map: Record<string, string> = {
    free: 'info',
    trial: 'warning',
    basic: 'success',
    pro: 'primary',
  }
  return map[licenseStatus.value.tier] || 'info'
})

async function refreshStatus() {
  try {
    const status = await window.electronAPI.license.status()
    licenseStatus.value = status
    // 检查是否需要在线验证
    if (status.tier !== 'free' && status.tier !== 'trial') {
      try {
        onlineCheckNeeded.value = await window.electronAPI.license.needsOnlineCheck()
      } catch {
        onlineCheckNeeded.value = false
      }
    }
  } catch (e) {
    console.error('获取授权状态失败:', e)
  }
}

async function handleOnlineCheck() {
  checkingOnline.value = true
  try {
    const result = await window.electronAPI.license.onlineCheck()
    if (result.revoked) {
      ElMessage.error(t('license.revokeMessage'))
    } else {
      ElMessage.success(t('license.verifySuccess'))
    }
    await refreshStatus()
  } catch (e: any) {
    ElMessage.error(t('license.verifyFailed') + '：' + e.message)
  } finally {
    checkingOnline.value = false
  }
}

async function handleActivate() {
  if (!licenseKey.value.trim()) {
    ElMessage.warning(t('license.inputKey'))
    return
  }
  activating.value = true
  try {
    // 优先在线激活（v1.8.0）
    let result
    try {
      result = await window.electronAPI.license.activateOnline(licenseKey.value.trim())
    } catch {
      // 网络失败，回退本地激活
      result = await window.electronAPI.license.activate(licenseKey.value.trim())
    }
    if (result.success) {
      ElMessage.success(result.message)
      licenseKey.value = ''
      await refreshStatus()
    } else {
      ElMessage.error(result.message)
    }
  } catch (e: any) {
    ElMessage.error(t('license.activateFailed') + '：' + e.message)
  } finally {
    activating.value = false
  }
}

async function handleDeactivate() {
  try {
    await ElMessageBox.confirm(t('license.deactivateMessage'), t('license.deactivateTitle'), {
      type: 'warning',
    })
    const result = await window.electronAPI.license.deactivate()
    if (result.success) {
      ElMessage.success(result.message)
      await refreshStatus()
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // cancelled
  }
}

async function handleRenew() {
  renewing.value = true
  try {
    const result = await window.electronAPI.license.renew()
    if (result.success) {
      ElMessage.success(result.message)
      await refreshStatus()
    } else {
      ElMessage.error(result.message)
    }
  } catch (e: any) {
    ElMessage.error(t('license.renewFailed') + '：' + e.message)
  } finally {
    renewing.value = false
  }
}

function handleUpgrade(tier: string) {
  ElMessage.info(tier === 'basic' ? t('license.upgradeBasic') : t('license.upgradePro'))
}

onMounted(() => {
  refreshStatus()
})
</script>

<style scoped>
.license-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.license-page h2 {
  margin-bottom: 20px;
}

.status-card {
  margin-bottom: 24px;
}

.online-status-card {
  margin-bottom: 24px;
}

.online-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.online-status-desc {
  color: #666;
  font-size: 13px;
  margin-bottom: 8px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.days-left {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.status-message {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: 0;
}

.plans {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.plan-card {
  text-align: center;
  transition: all 0.3s;
}

.plan-card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.plan-header {
  margin-bottom: 16px;
}

.plan-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.plan-price {
  margin-top: 8px;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.period {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  text-align: left;
}

.plan-features li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
}

.plan-features li.limited {
  color: var(--el-text-color-placeholder);
  text-decoration: line-through;
}

.activate-card,
.renew-card {
  margin-bottom: 16px;
}

.activate-card h3,
.renew-card h3 {
  margin: 0 0 8px;
}

.activate-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin: 0 0 16px;
}

.activate-form {
  display: flex;
  gap: 12px;
}

.activate-form .el-input {
  flex: 1;
}

.renew-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.renew-card p {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .plans {
    grid-template-columns: 1fr;
  }

  .activate-form {
    flex-direction: column;
  }
}

/* 暗色模式适配 */
:root.dark .plan-card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}
</style>
