<template>
  <div class="app-container">
    <el-container v-if="initialized">
      <!-- 移动端菜单按钮 -->
      <div class="mobile-menu-button" @click="toggleSidebar">
        <el-icon size="24"><Menu /></el-icon>
      </div>

      <!-- 侧边栏 -->
      <el-aside :width="sidebarWidth + 'px'" class="app-aside" :class="{ 'sidebar-collapsed': !sidebarVisible }">
        <div class="logo">
          <span class="logo-icon">💰</span>
          <span class="logo-text" v-show="sidebarVisible">{{ t('app.name') }}</span>
        </div>
        <el-menu
          :default-active="currentRoute"
          router
          class="app-menu"
          :collapse="!sidebarVisible"
          :unique-opened="true"
        >
          <!-- 财务管理分组 -->
          <el-sub-menu index="finance">
            <template #title>
              <el-icon><Wallet /></el-icon>
              <span>{{ t('sidebar.finance') }}</span>
            </template>
            <el-menu-item index="/dashboard">
              <el-icon><DataBoard /></el-icon>
              <template #title>{{ t('sidebar.dashboard') }}</template>
            </el-menu-item>
            <el-menu-item index="/goals">
              <el-icon><Flag /></el-icon>
              <template #title>{{ t('sidebar.goals') }}</template>
            </el-menu-item>
            <el-menu-item index="/transactions">
              <el-icon><List /></el-icon>
              <template #title>{{ t('sidebar.transactions') }}</template>
            </el-menu-item>
            <el-menu-item index="/accounts">
              <el-icon><Wallet /></el-icon>
              <template #title>{{ t('sidebar.accounts') }}</template>
            </el-menu-item>
            <el-menu-item index="/debts">
              <el-icon><CreditCard /></el-icon>
              <template #title>{{ t('sidebar.debts') }}</template>
            </el-menu-item>
            <el-menu-item index="/budget">
              <el-icon><PieChart /></el-icon>
              <template #title>{{ t('sidebar.budget') }}</template>
            </el-menu-item>
            <el-menu-item index="/recurring">
              <el-icon><Refresh /></el-icon>
              <template #title>{{ t('sidebar.recurring') }}</template>
            </el-menu-item>
            <el-menu-item index="/investment">
              <el-icon><TrendCharts /></el-icon>
              <template #title>{{ t('sidebar.investment') }}</template>
            </el-menu-item>
            <el-menu-item index="/report">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>{{ t('sidebar.report') }}</template>
            </el-menu-item>
            <el-menu-item index="/pdf-report">
              <el-icon><Document /></el-icon>
              <template #title>{{ t('sidebar.pdfReport') }}</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 收入提升分组 -->
          <el-sub-menu index="income">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>{{ t('sidebar.income') }}</span>
            </template>
            <el-menu-item index="/income-dashboard">
              <el-icon><DataBoard /></el-icon>
              <template #title>{{ t('sidebar.incomeDashboard') }}</template>
            </el-menu-item>
            <el-menu-item index="/income-goals">
              <el-icon><Flag /></el-icon>
              <template #title>{{ t('sidebar.incomeGoals') }}</template>
            </el-menu-item>
            <el-menu-item index="/income-analysis">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>{{ t('sidebar.incomeAnalysis') }}</template>
            </el-menu-item>
            <el-menu-item index="/income-strategies">
              <el-icon><Trophy /></el-icon>
              <template #title>{{ t('sidebar.incomeStrategies') }}</template>
            </el-menu-item>
            <el-menu-item index="/income-actions">
              <el-icon><List /></el-icon>
              <template #title>{{ t('sidebar.incomeActions') }}</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 规划工具分组 -->
          <el-sub-menu index="planning">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>{{ t('sidebar.planning') }}</span>
            </template>
            <el-menu-item index="/calculator">
              <el-icon><TrendCharts /></el-icon>
              <template #title>{{ t('sidebar.calculator') }}</template>
            </el-menu-item>
            <el-menu-item index="/prepayment-calculator">
              <el-icon><CreditCard /></el-icon>
              <template #title>{{ t('sidebar.prepaymentCalc') }}</template>
            </el-menu-item>
            <el-menu-item index="/retirement-planner">
              <el-icon><Flag /></el-icon>
              <template #title>{{ t('sidebar.retirement') }}</template>
            </el-menu-item>
            <el-menu-item index="/large-expense-planner">
              <el-icon><Wallet /></el-icon>
              <template #title>{{ t('sidebar.largeExpense') }}</template>
            </el-menu-item>
            <el-menu-item index="/scenario-simulator">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>{{ t('sidebar.scenario') }}</template>
            </el-menu-item>
            <el-menu-item index="/asset-allocation">
              <el-icon><PieChart /></el-icon>
              <template #title>{{ t('sidebar.assetAllocation') }}</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 其他功能 -->
          <el-menu-item index="/ai-advice">
            <el-icon><MagicStick /></el-icon>
            <template #title>{{ t('sidebar.aiAdvice') }}</template>
          </el-menu-item>
          <el-menu-item index="/insights">
            <el-icon><TrendCharts /></el-icon>
            <template #title>{{ t('sidebar.insights') }}</template>
          </el-menu-item>
          <el-menu-item index="/dreams">
            <el-icon><PictureFilled /></el-icon>
            <template #title>{{ t('sidebar.dreams') }}</template>
          </el-menu-item>
          <el-menu-item index="/license">
            <el-icon><Key /></el-icon>
            <template #title>{{ t('sidebar.license') }}</template>
          </el-menu-item>
          <el-menu-item index="/bigscreen">
            <el-icon><Monitor /></el-icon>
            <template #title>{{ t('sidebar.bigscreen') }}</template>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <template #title>{{ t('sidebar.settings') }}</template>
          </el-menu-item>
        </el-menu>

        <!-- 主题切换 + 更新提示 -->
        <div class="sidebar-bottom">
          <!-- 语言切换 -->
          <div class="lang-toggle" @click="setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')">
            <span class="lang-icon">🌐</span>
            <span class="lang-label" v-show="sidebarVisible">{{ locale === 'zh-CN' ? 'English' : '中文' }}</span>
          </div>
          <div v-if="hasUpdate" class="update-badge" @click="openUpdateDownload">
            <span class="update-icon">🔴</span>
            <span class="update-text" v-show="sidebarVisible">{{ t('app.newVersion') }} v{{ updateInfo?.latestVersion }}</span>
          </div>
          <div class="theme-toggle" @click="toggleTheme">
            <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
            <span class="theme-label" v-show="sidebarVisible">{{ isDark ? t('app.switchLight') : t('app.switchDark') }}</span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="app-main" :style="{ paddingLeft: mainPadding }">
        <ErrorBoundary :retryable="true" :show-detail="true">
          <router-view />
        </ErrorBoundary>
      </el-main>
    </el-container>

    <!-- 初始化引导 -->
    <Welcome v-else @complete="handleWelcomeComplete" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataBoard,
  Flag,
  List,
  Wallet,
  CreditCard,
  PictureFilled,
  TrendCharts,
  DataAnalysis,
  Trophy,
  Setting,
  Menu,
  PieChart,
  Document,
  Key,
  Refresh,
  MagicStick,
  Monitor
} from '@element-plus/icons-vue'
import Welcome from '@/views/Welcome.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'
import { useUpdate } from '@/composables/useUpdate'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useI18n } from '@/i18n'
import {
  getCurrentBreakpoint,
  getSidebarWidth,
  getMainPadding,
  onWindowResize
} from '@/utils/responsive'

const route = useRoute()
const userStore = useUserStore()
const { isDark, toggleTheme } = useTheme()
const { updateInfo, checkUpdate, openDownload } = useUpdate()
const { setupGlobalHandlers } = useErrorHandler()
const { t, locale, setLocale } = useI18n()
const hasUpdate = computed(() => updateInfo.value?.hasUpdate ?? false)
const openUpdateDownload = () => {
  if (updateInfo.value?.downloadUrl) openDownload(updateInfo.value.downloadUrl)
}

const currentRoute = computed(() => route.path)
const initialized = ref(false)

// 响应式状态
const sidebarVisible = ref(true)
const sidebarWidth = ref(220)
const mainPadding = ref('20px')

// 更新响应式布局
const updateResponsiveLayout = () => {
  const breakpoint = getCurrentBreakpoint()

  // 移动端：隐藏侧边栏
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    sidebarVisible.value = false
    sidebarWidth.value = 0
  } else {
    sidebarVisible.value = true
    sidebarWidth.value = getSidebarWidth()
  }

  // 更新主内容区 padding
  mainPadding.value = getMainPadding()
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
  sidebarWidth.value = sidebarVisible.value ? getSidebarWidth() : 0
}

const handleWelcomeComplete = async () => {
  initialized.value = true
}

// 检查是否已有用户数据
const checkInit = async () => {
  try {
    // 检查是否在 Electron 环境中
    if (!window.electronAPI) {
      initialized.value = true
      return
    }

    const user = await window.electronAPI.getUser()
    if (user) {
      userStore.setUser(user)
      initialized.value = true
    } else {
      initialized.value = false
    }
  } catch (error) {
    console.error('检查初始化状态失败:', error)
    // 如果出错，仍然初始化（用于浏览器测试）
    initialized.value = true
  }
}

onMounted(() => {
  setupGlobalHandlers()
  checkInit()
  updateResponsiveLayout()

  // 监听窗口大小变化
  const cleanup = onWindowResize(updateResponsiveLayout)
  onUnmounted(cleanup)
})
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  background: var(--bg-body);
}

// 移动端菜单按钮
.mobile-menu-button {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  background: #fff;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  // 仅在移动端显示
  @media (max-width: 575px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.app-aside {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;

  // 侧边栏折叠时的样式
  &.sidebar-collapsed {
    width: 0 !important;
    overflow: hidden;
  }

  // 移动端：覆盖整个屏幕
  @media (max-width: 575px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 999;
  }
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 600;
  }
}

.app-menu {
  border-right: none;
  background: transparent;

  :deep(.el-menu-item) {
    color: rgba(255, 255, 255, 0.7);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    &.is-active {
      background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
      color: #fff;
    }
  }

  // 子菜单标题样式
  :deep(.el-sub-menu__title) {
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .el-sub-menu__icon-arrow {
      color: rgba(255, 255, 255, 0.5);
    }
  }

  // 子菜单展开时的背景
  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #fff;
  }

  // 子菜单内的菜单项
  :deep(.el-sub-menu .el-menu-item) {
    padding-left: 52px !important;
    min-width: auto;
  }

  // 折叠状态下子菜单的弹出菜单样式
  :deep(.el-menu--vertical .el-menu--popup) {
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);

    .el-menu-item {
      color: rgba(255, 255, 255, 0.7);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      &.is-active {
        background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
        color: #fff;
      }
    }
  }
}

.app-main {
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
  transition: padding-left 0.3s ease;
  background: var(--bg-body);

  // 移动端：调整 padding
  @media (max-width: 575px) {
    padding: 16px;
  }

  // 小屏：调整 padding
  @media (min-width: 576px) and (max-width: 767px) {
    padding: 16px;
  }
}

.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

// 更新提示徽章
.update-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: #67c23a;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(103, 194, 58, 0.08);

  &:hover {
    background: rgba(103, 194, 58, 0.15);
  }

  .update-icon {
    font-size: 10px;
    width: 24px;
    text-align: center;
  }

  .update-text {
    font-size: 13px;
    font-weight: 500;
  }
}

// 语言切换按钮
.lang-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .lang-icon {
    font-size: 16px;
    width: 24px;
    text-align: center;
  }

  .lang-label {
    font-size: 13px;
  }
}

// 主题切换按钮
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .theme-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  .theme-label {
    font-size: 14px;
  }
}
</style>
