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
          <span class="logo-text" v-show="sidebarVisible">财富自由之路</span>
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
              <span>财务管理</span>
            </template>
            <el-menu-item index="/dashboard">
              <el-icon><DataBoard /></el-icon>
              <template #title>财务看板</template>
            </el-menu-item>
            <el-menu-item index="/goals">
              <el-icon><Flag /></el-icon>
              <template #title>目标追踪</template>
            </el-menu-item>
            <el-menu-item index="/transactions">
              <el-icon><List /></el-icon>
              <template #title>收支记录</template>
            </el-menu-item>
            <el-menu-item index="/accounts">
              <el-icon><Wallet /></el-icon>
              <template #title>账户管理</template>
            </el-menu-item>
            <el-menu-item index="/debts">
              <el-icon><CreditCard /></el-icon>
              <template #title>负债管理</template>
            </el-menu-item>
            <el-menu-item index="/budget">
              <el-icon><PieChart /></el-icon>
              <template #title>预算管理</template>
            </el-menu-item>
            <el-menu-item index="/recurring">
              <el-icon><Refresh /></el-icon>
              <template #title>周期性交易</template>
            </el-menu-item>
            <el-menu-item index="/investment">
              <el-icon><TrendCharts /></el-icon>
              <template #title>投资追踪</template>
            </el-menu-item>
            <el-menu-item index="/report">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>报表分析</template>
            </el-menu-item>
            <el-menu-item index="/pdf-report">
              <el-icon><Document /></el-icon>
              <template #title>综合报告</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 收入提升分组 -->
          <el-sub-menu index="income">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>收入提升</span>
            </template>
            <el-menu-item index="/income-dashboard">
              <el-icon><DataBoard /></el-icon>
              <template #title>收入看板</template>
            </el-menu-item>
            <el-menu-item index="/income-goals">
              <el-icon><Flag /></el-icon>
              <template #title>收入目标</template>
            </el-menu-item>
            <el-menu-item index="/income-analysis">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>收入分析</template>
            </el-menu-item>
            <el-menu-item index="/income-strategies">
              <el-icon><Trophy /></el-icon>
              <template #title>收入策略</template>
            </el-menu-item>
            <el-menu-item index="/income-actions">
              <el-icon><List /></el-icon>
              <template #title>行动计划</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 规划工具分组 -->
          <el-sub-menu index="planning">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>规划工具</span>
            </template>
            <el-menu-item index="/calculator">
              <el-icon><TrendCharts /></el-icon>
              <template #title>复利计算器</template>
            </el-menu-item>
            <el-menu-item index="/prepayment-calculator">
              <el-icon><CreditCard /></el-icon>
              <template #title>提前还款计算器</template>
            </el-menu-item>
            <el-menu-item index="/retirement-planner">
              <el-icon><Flag /></el-icon>
              <template #title>退休规划</template>
            </el-menu-item>
            <el-menu-item index="/large-expense-planner">
              <el-icon><Wallet /></el-icon>
              <template #title>大额支出规划</template>
            </el-menu-item>
            <el-menu-item index="/scenario-simulator">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>情景模拟</template>
            </el-menu-item>
            <el-menu-item index="/asset-allocation">
              <el-icon><PieChart /></el-icon>
              <template #title>资产配置</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 其他功能 -->
          <el-menu-item index="/ai-advice">
            <el-icon><MagicStick /></el-icon>
            <template #title>AI 助手</template>
          </el-menu-item>
          <el-menu-item index="/dreams">
            <el-icon><PictureFilled /></el-icon>
            <template #title>梦想图册</template>
          </el-menu-item>
          <el-menu-item index="/license">
            <el-icon><Key /></el-icon>
            <template #title>授权管理</template>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <template #title>设置</template>
          </el-menu-item>
        </el-menu>

        <!-- 主题切换 + 更新提示 -->
        <div class="sidebar-bottom">
          <div v-if="hasUpdate" class="update-badge" @click="openUpdateDownload">
            <span class="update-icon">🔴</span>
            <span class="update-text" v-show="sidebarVisible">新版本 v{{ updateInfo?.latestVersion }}</span>
          </div>
          <div class="theme-toggle" @click="toggleTheme">
            <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
            <span class="theme-label" v-show="sidebarVisible">{{ isDark ? '切换亮色' : '切换暗色' }}</span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="app-main" :style="{ paddingLeft: mainPadding }">
        <router-view />
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
  MagicStick
} from '@element-plus/icons-vue'
import Welcome from '@/views/Welcome.vue'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'
import { useUpdate } from '@/composables/useUpdate'
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
