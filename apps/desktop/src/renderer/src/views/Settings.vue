<template>
  <div class="settings-page">
    <h1 class="page-title">设置</h1>
    <p class="page-desc">管理你的财务基础数据，调整后目标会自动重新计算</p>

    <!-- 财务基础数据 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">💰 财务基础数据</span>
          <el-button type="primary" size="small" @click="saveBasicData" :loading="saving">
            保存更改
          </el-button>
        </div>
      </template>

      <el-form :model="basicForm" label-width="120px" class="basic-form">
        <div class="form-section">
          <h3 class="section-title">收支情况</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="月收入">
                <el-input-number 
                  v-model="basicForm.monthlyIncome" 
                  :min="0" 
                  :precision="0"
                  @change="handleBasicChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="月支出">
                <el-input-number 
                  v-model="basicForm.monthlyExpense" 
                  :min="0" 
                  :precision="0"
                  @change="handleBasicChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <div class="calculated-box">
            <div class="calc-item">
              <span class="calc-label">每月结余</span>
              <span class="calc-value" :class="{ positive: monthlySurplus > 0, negative: monthlySurplus < 0 }">
                {{ formatCurrency(monthlySurplus) }}
              </span>
            </div>
            <div class="calc-item">
              <span class="calc-label">储蓄率</span>
              <span class="calc-value" :class="{ positive: savingsRate > 30, warning: savingsRate <= 30 && savingsRate > 0 }">
                {{ savingsRate.toFixed(1) }}%
              </span>
            </div>
          </div>

          <div class="theory-tip" v-if="savingsRate < 20">
            <el-icon><InfoFilled /></el-icon>
            <span>💡 储蓄率低于 20%，建议提升收入或减少支出。富人平均储蓄率超过 30%。</span>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">资产情况</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="现金及存款">
                <el-input-number 
                  v-model="basicForm.cashAssets" 
                  :min="0" 
                  :precision="0"
                  @change="handleBasicChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="投资资产">
                <el-input-number 
                  v-model="basicForm.investmentAssets" 
                  :min="0" 
                  :precision="0"
                  @change="handleBasicChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="负债总额">
                <el-input-number 
                  v-model="basicForm.totalDebt" 
                  :min="0" 
                  :precision="0"
                  @change="handleBasicChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <div class="calculated-box">
            <div class="calc-item">
              <span class="calc-label">净资产</span>
              <span class="calc-value highlight">{{ formatCurrency(netWorth) }}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">总资产</span>
              <span class="calc-value">{{ formatCurrency(totalAssets) }}</span>
            </div>
          </div>

          <div class="theory-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>💡 净资产 = 真正的财富水平。总资产只是表面数字，扣除负债后才是你的真实财富。</span>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">目标参数</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="保障月数">
                <el-input-number 
                  v-model="basicForm.guaranteeMonths" 
                  :min="3" 
                  :max="24"
                  @change="handleBasicChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预期年化收益">
                <el-input-number 
                  v-model="basicForm.expectedReturnRate" 
                  :min="1" 
                  :max="20"
                  :precision="1"
                  :step="0.5"
                  @change="handleBasicChange"
                  style="width: 100%"
                />
                <span class="unit">%</span>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="theory-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>💡 8% 年化收益是保守估计。长期定投指数基金，历史平均收益约 10-12%。</span>
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- 自动计算的目标 -->
    <el-card class="settings-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="card-title">🎯 目标自动计算</span>
          <el-tag type="info">基于基础数据自动更新</el-tag>
        </div>
      </template>

      <div class="goals-preview">
        <div class="goal-preview-item">
          <div class="goal-icon">🛡️</div>
          <div class="goal-info">
            <div class="goal-name">财务保障</div>
            <div class="goal-formula">月支出 × {{ basicForm.guaranteeMonths }} = {{ formatCurrency(basicForm.monthlyExpense * basicForm.guaranteeMonths) }}</div>
            <div class="goal-progress" :class="{ achieved: netWorth >= basicForm.monthlyExpense * basicForm.guaranteeMonths }">
              进度：{{ formatCurrency(netWorth) }} / {{ formatCurrency(basicForm.monthlyExpense * basicForm.guaranteeMonths) }}
              <span v-if="netWorth >= basicForm.monthlyExpense * basicForm.guaranteeMonths">✅ 已达成</span>
            </div>
          </div>
          <div class="goal-theory">
            <el-tooltip content="拥有 6-12 个月的生活储备金，不被意外击倒" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <div class="goal-preview-item">
          <div class="goal-icon">🔒</div>
          <div class="goal-info">
            <div class="goal-name">财务安全</div>
            <div class="goal-formula">月支出 × 150 = {{ formatCurrency(basicForm.monthlyExpense * 150) }}</div>
            <div class="goal-progress" :class="{ achieved: netWorth >= basicForm.monthlyExpense * 150 }">
              进度：{{ formatCurrency(netWorth) }} / {{ formatCurrency(basicForm.monthlyExpense * 150) }}
              <span v-if="netWorth >= basicForm.monthlyExpense * 150">✅ 已达成</span>
            </div>
          </div>
          <div class="goal-theory">
            <el-tooltip content="靠投资利息覆盖日常支出，不再被迫工作。公式：月支出 ÷ (年化收益/12) = 所需本金" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <div class="goal-preview-item">
          <div class="goal-icon">✨</div>
          <div class="goal-info">
            <div class="goal-name">财务自由</div>
            <div class="goal-formula">梦想月支出 × 150 = {{ formatCurrency(dreamMonthlyExpense * 150) }}</div>
            <div class="goal-progress" :class="{ achieved: netWorth >= dreamMonthlyExpense * 150 }">
              进度：{{ formatCurrency(netWorth) }} / {{ formatCurrency(dreamMonthlyExpense * 150) }}
              <span v-if="netWorth >= dreamMonthlyExpense * 150">✅ 已达成</span>
            </div>
          </div>
          <div class="goal-theory">
            <el-tooltip content="靠利息实现梦想生活，本金永不动用。梦想月支出默认为当前支出的 2 倍" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </div>

      <div class="theory-tip" style="margin-top: 16px">
        <el-icon><InfoFilled /></el-icon>
        <span>💡 财务自由三阶段递进：先建立保障金抵御风险，再积累本金实现安全，最终达到自由。每个阶段都是下一个的基础。</span>
      </div>
    </el-card>

    <!-- 数据管理 -->
    <el-card class="settings-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="card-title">⚠️ 数据管理</span>
        </div>
      </template>

      <el-alert
        title="危险操作警告"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <p>重新初始化将清除所有数据，包括：</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>所有账户（资产）数据</li>
          <li>所有负债记录</li>
          <li>所有交易记录</li>
          <li>所有目标和梦想数据</li>
          <li>用户信息</li>
        </ul>
        <p><strong>此操作不可恢复！</strong></p>
      </el-alert>

      <div class="settings-actions">
        <el-button-group style="margin-bottom: 12px;">
          <el-button type="success" @click="handleExportBackup" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出备份
          </el-button>
          <el-button type="warning" @click="handleImportBackup" :loading="importing">
            <el-icon><Upload /></el-icon>
            导入数据
          </el-button>
        </el-button-group>

        <el-button 
          type="danger" 
          @click="showResetDialog"
          :loading="resetting"
        >
          <el-icon><RefreshRight /></el-icon>
          重新初始化
        </el-button>
        
        <p class="action-hint">
          导出备份：将所有数据保存为 JSON 文件，用于数据迁移或备份<br>
          导入数据：从 JSON/Excel 文件恢复数据（会覆盖现有数据）<br>
          重新初始化：清除所有数据，重新进入引导流程
        </p>
      </div>
    </el-card>

    <el-card class="settings-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="card-title">📊 数据统计</span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="账户数量">{{ accountCount }}</el-descriptions-item>
        <el-descriptions-item label="负债数量">{{ debtCount }}</el-descriptions-item>
        <el-descriptions-item label="交易记录">{{ transactionCount }}</el-descriptions-item>
        <el-descriptions-item label="目标数量">{{ goalCount }}</el-descriptions-item>
        <el-descriptions-item label="梦想数量">{{ dreamCount }}</el-descriptions-item>
        <el-descriptions-item label="数据创建时间">{{ createdAt }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 导入预览对话框 -->
    <el-dialog
      v-model="importPreviewVisible"
      title="📦 导入数据预览"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        <p v-if="importMode === 'replace'">全量覆盖：将替换当前所有数据。系统会先自动备份当前数据。</p>
        <p v-else>增量合并：仅添加新记录，不删除现有数据。重复记录将被跳过。</p>
      </el-alert>
      <pre class="import-preview-text">{{ importPreviewText }}</pre>
      <div style="margin-top: 16px">
        <el-radio-group v-model="importMode">
          <el-radio value="incremental">增量合并（推荐）</el-radio>
          <el-radio value="replace">全量覆盖</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="importPreviewVisible = false">取消</el-button>
        <el-button type="primary" @click="executeImport" :loading="importing">
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="resetDialogVisible"
      title="确认重新初始化"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <p><strong>你确定要重新初始化吗？</strong></p>
        <p style="margin-top: 10px;">这将删除所有数据，此操作不可恢复！</p>
      </el-alert>

      <el-form :model="confirmForm" label-width="120px">
        <el-form-item label="输入'确认'">
          <el-input 
            v-model="confirmForm.text" 
            placeholder="请输入'确认'以继续"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="handleReset"
          :disabled="confirmForm.text !== '确认'"
          :loading="resetting"
        >
          确认重新初始化
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight, InfoFilled, QuestionFilled, Upload, Download } from '@element-plus/icons-vue'
import { pickFile, exportFullBackup, previewImport, formatPreviewText, type FullBackupData } from '@/utils/import'
import { exportMultiSheetToExcel } from '@/utils/export'
import { useUserStore } from '@/stores/user'
import { useAccountStore } from '@/stores/accounts'
import { useDebtStore } from '@/stores/debts'
import { useTransactionStore } from '@/stores/transactions'
import { useGoalStore } from '@/stores/goals'

const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()
const debtStore = useDebtStore()
const transactionStore = useTransactionStore()
const goalStore = useGoalStore()

const saving = ref(false)
const resetting = ref(false)
const exporting = ref(false)
const importing = ref(false)
const resetDialogVisible = ref(false)
const importPreviewVisible = ref(false)
const importPreviewText = ref('')
const importMode = ref<'replace' | 'incremental'>('incremental')
let pendingImportData: FullBackupData | null = null
const confirmForm = ref({
  text: ''
})

// 基础数据表单
const basicForm = ref({
  monthlyIncome: 0,
  monthlyExpense: 0,
  cashAssets: 0,
  investmentAssets: 0,
  totalDebt: 0,
  guaranteeMonths: 6,
  expectedReturnRate: 8.0
})

// 计算属性
const monthlySurplus = computed(() => basicForm.value.monthlyIncome - basicForm.value.monthlyExpense)
const savingsRate = computed(() => {
  if (basicForm.value.monthlyIncome <= 0) return 0
  return (monthlySurplus.value / basicForm.value.monthlyIncome) * 100
})
const totalAssets = computed(() => basicForm.value.cashAssets + basicForm.value.investmentAssets)
const netWorth = computed(() => totalAssets.value - basicForm.value.totalDebt)
const dreamMonthlyExpense = computed(() => basicForm.value.monthlyExpense * 2)

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

// 基础数据变化
const handleBasicChange = () => {
  // 自动更新目标会在保存时触发
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    await userStore.fetchUser()
    await accountStore.fetchAccounts()
    await debtStore.fetchDebts()

    // 从用户设置加载
    if (userStore.user?.settings) {
      const settings = typeof userStore.user.settings === 'string'
        ? JSON.parse(userStore.user.settings)
        : userStore.user.settings

      basicForm.value.monthlyIncome = settings.monthlyIncome || 0
      basicForm.value.monthlyExpense = settings.monthlyExpense || 0
      basicForm.value.guaranteeMonths = settings.guaranteeMonths || 6
      basicForm.value.expectedReturnRate = settings.expectedReturnRate || 8.0
    }

    // 从账户加载资产
    const cashAccount = accountStore.accounts.find(a => a.type === 'cash')
    const investmentAccount = accountStore.accounts.find(a => a.type === 'investment')

    basicForm.value.cashAssets = cashAccount?.balance || 0
    basicForm.value.investmentAssets = investmentAccount?.balance || 0

    // 从负债加载
    basicForm.value.totalDebt = debtStore.totalDebt
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 保存基础数据
const saveBasicData = async () => {
  saving.value = true

  try {
    // 1. 更新用户设置
    if (userStore.user) {
      await userStore.updateUser(userStore.user.id, {
        settings: JSON.stringify({
          monthlyIncome: basicForm.value.monthlyIncome,
          monthlyExpense: basicForm.value.monthlyExpense,
          guaranteeMonths: basicForm.value.guaranteeMonths,
          expectedReturnRate: basicForm.value.expectedReturnRate
        })
      })
    }

    // 2. 更新账户
    const cashAccount = accountStore.accounts.find(a => a.type === 'cash')
    if (cashAccount) {
      await accountStore.updateAccount(cashAccount.id, {
        balance: basicForm.value.cashAssets
      })
    }

    const investmentAccount = accountStore.accounts.find(a => a.type === 'investment')
    if (investmentAccount) {
      await accountStore.updateAccount(investmentAccount.id, {
        balance: basicForm.value.investmentAssets
      })
    }

    // 3. 更新负债
    if (debtStore.debts.length > 0) {
      await debtStore.updateDebt(debtStore.debts[0].id, {
        totalAmount: basicForm.value.totalDebt,
        remainingAmount: basicForm.value.totalDebt
      })
    }

    // 4. 更新目标
    await goalStore.fetchGoals()

    const securityGoal = goalStore.securityGoal
    if (securityGoal) {
      await goalStore.updateGoal(securityGoal.id, {
        targetAmount: basicForm.value.monthlyExpense * basicForm.value.guaranteeMonths,
        currentAmount: netWorth.value
      })
    }

    const safetyGoal = goalStore.safetyGoal
    if (safetyGoal) {
      await goalStore.updateGoal(safetyGoal.id, {
        targetAmount: basicForm.value.monthlyExpense * 150,
        currentAmount: netWorth.value
      })
    }

    const freedomGoal = goalStore.freedomGoal
    if (freedomGoal) {
      await goalStore.updateGoal(freedomGoal.id, {
        targetAmount: dreamMonthlyExpense.value * 150,
        currentAmount: netWorth.value
      })
    }

    ElMessage.success('基础数据已保存，目标已自动更新！')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 数据统计
const accountCount = ref(0)
const debtCount = ref(0)
const transactionCount = ref(0)
const goalCount = ref(0)
const dreamCount = ref(0)
const createdAt = ref('-')

// 加载数据统计
const loadStatistics = async () => {
  try {
    await accountStore.fetchAccounts()
    await debtStore.fetchDebts()
    await transactionStore.fetchTransactions()
    await goalStore.fetchGoals()

    accountCount.value = accountStore.accounts.length
    debtCount.value = debtStore.debts.length
    transactionCount.value = transactionStore.transactions.length
    goalCount.value = goalStore.goals.length

    // 获取创建时间（如果有数据）
    if (userStore.user) {
      createdAt.value = new Date().toLocaleDateString('zh-CN')
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 显示重置对话框
const showResetDialog = () => {
  confirmForm.value.text = ''
  resetDialogVisible.value = true
}

// 执行重置
const handleReset = async () => {
  if (confirmForm.value.text !== '确认') {
    ElMessage.warning('请输入"确认"以继续')
    return
  }

  resetting.value = true

  try {
    // 删除数据库
    const result = await window.electronAPI.resetDatabase()

    if (result.success) {
      ElMessage.success('数据已清除，即将重新初始化...')

      // 清空所有 store
      userStore.$reset()
      accountStore.$reset()
      debtStore.$reset()
      transactionStore.$reset()
      goalStore.$reset()

      // 刷新页面，重新进入初始化流程
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      throw new Error(result.error || '重置失败')
    }
  } catch (error) {
    console.error('重置失败:', error)
    ElMessage.error('重置失败，请查看控制台日志')
  } finally {
    resetting.value = false
    resetDialogVisible.value = false
  }
}

// 导出全量备份
const handleExportBackup = async () => {
  exporting.value = true
  try {
    const backup: FullBackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: userStore.user || undefined,
      accounts: accountStore.accounts || [],
      debts: debtStore.debts || [],
      transactions: transactionStore.transactions || [],
      goals: goalStore.goals || [],
      settings: userStore.user?.settings || undefined
    }
    exportFullBackup(backup)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出备份失败')
  } finally {
    exporting.value = false
  }
}

// 导入数据（先预览）
const handleImportBackup = async () => {
  try {
    const { content } = await pickFile()
    const preview = previewImport(content)
    importPreviewText.value = formatPreviewText(preview)
    pendingImportData = content
    importPreviewVisible.value = true
  } catch (error: any) {
    if (error.message !== '未选择文件') {
      console.error('读取文件失败:', error)
      ElMessage.error(`读取失败: ${error.message}`)
    }
  }
}

// 导入前自动备份当前数据
const autoBackupBeforeImport = (): FullBackupData => {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    user: userStore.user || undefined,
    accounts: accountStore.accounts || [],
    debts: debtStore.debts || [],
    transactions: transactionStore.transactions || [],
    goals: goalStore.goals || [],
    settings: userStore.user?.settings || undefined
  }
}

// 执行导入（预览确认后）
const executeImport = async () => {
  if (!pendingImportData) return

  importing.value = true
  const isIncremental = importMode.value === 'incremental'

  // 全量覆盖模式下自动备份
  if (!isIncremental) {
    try {
      const backup = autoBackupBeforeImport()
      exportFullBackup(backup)
    } catch (e) {
      console.warn('自动备份失败，继续导入:', e)
    }
  }

  try {
    const content = pendingImportData
    let importedCount = 0
    let skippedCount = 0

    if (isIncremental) {
      // ========== 增量合并模式 ==========

      // 账户：按 type 匹配，存在则更新，不存在则创建
      if (content.accounts?.length) {
        for (const account of content.accounts) {
          const existing = accountStore.accounts.find(a => a.type === account.type)
          if (existing) {
            await accountStore.updateAccount(existing.id, account)
            importedCount++
          } else {
            try {
              await accountStore.createAccount(account)
              importedCount++
            } catch (e) {
              skippedCount++
            }
          }
        }
      }

      // 负债：按名称匹配
      if (content.debts?.length) {
        for (const debt of content.debts) {
          const existing = debtStore.debts.find(d => d.name === debt.name)
          if (existing) {
            await debtStore.updateDebt(existing.id, debt)
            importedCount++
          } else {
            try {
              await debtStore.createDebt(debt)
              importedCount++
            } catch (e) {
              skippedCount++
            }
          }
        }
      }

      // 交易记录：按 id 去重
      if (content.transactions?.length) {
        const existingIds = new Set(transactionStore.transactions.map(t => t.id))
        for (const tx of content.transactions) {
          if (existingIds.has(tx.id)) {
            skippedCount++
          } else {
            try {
              await transactionStore.createTransaction(tx)
              importedCount++
            } catch (e) {
              skippedCount++
            }
          }
        }
      }

      // 目标：按类型匹配
      if (content.goals?.length) {
        for (const goal of content.goals) {
          const existing = goalStore.goals.find(g => g.type === goal.type)
          if (existing) {
            await goalStore.updateGoal(existing.id, goal)
            importedCount++
          } else {
            try {
              await goalStore.createGoal(goal)
              importedCount++
            } catch (e) {
              skippedCount++
            }
          }
        }
      }

      // 用户设置：合并
      if (content.settings && userStore.user) {
        const existingSettings = typeof userStore.user.settings === 'string'
          ? JSON.parse(userStore.user.settings)
          : userStore.user.settings || {}
        const newSettings = typeof content.settings === 'string'
          ? JSON.parse(content.settings)
          : content.settings
        const merged = { ...existingSettings, ...newSettings }
        await userStore.updateUser(userStore.user.id, { settings: JSON.stringify(merged) })
      }

    } else {
      // ========== 全量覆盖模式（原有逻辑） ==========

      // 导入账户
      if (content.accounts?.length) {
        for (const account of content.accounts) {
          const existing = accountStore.accounts.find(a => a.type === account.type)
          if (existing) {
            await accountStore.updateAccount(existing.id, account)
          }
        }
        importedCount += content.accounts.length
      }

      // 导入负债
      if (content.debts?.length) {
        for (const debt of content.debts) {
          if (debtStore.debts.length > 0 && debtStore.debts[0]) {
            await debtStore.updateDebt(debtStore.debts[0].id, debt)
          }
        }
        importedCount += content.debts.length
      }

      // 导入交易记录
      if (content.transactions?.length) {
        importedCount += content.transactions.length
        for (const tx of content.transactions) {
          try {
            await transactionStore.createTransaction(tx)
          } catch (e) {
            // 跳过重复记录
          }
        }
      }

      // 导入用户设置
      if (content.settings && userStore.user) {
        const settings = typeof content.settings === 'string'
          ? JSON.parse(content.settings)
          : content.settings
        await userStore.updateUser(userStore.user.id, { settings: JSON.stringify(settings) })
      }
    }

    const modeMsg = isIncremental ? '增量合并' : '全量覆盖'
    const skipMsg = skippedCount > 0 ? `，跳过 ${skippedCount} 条重复` : ''
    ElMessage.success(`${modeMsg}导入成功！共导入 ${importedCount} 条记录${skipMsg}`)
    importPreviewVisible.value = false
    pendingImportData = null

    await loadBasicData()
    await loadStatistics()
  } catch (error: any) {
    console.error('导入失败:', error)
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  await loadBasicData()
  await loadStatistics()
})
</script>

<style lang="scss" scoped>
.settings-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.page-desc {
  color: #909399;
  margin-bottom: 24px;
}

.settings-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
  }
}

.basic-form {
  .form-section {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 16px;
    }
  }

  .unit {
    margin-left: 8px;
    color: #909399;
  }
}

.calculated-box {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-top: 16px;

  .calc-item {
    flex: 1;
    text-align: center;

    .calc-label {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-bottom: 6px;
    }

    .calc-value {
      font-size: 20px;
      font-weight: 700;
      color: #303133;

      &.highlight {
        color: #409eff;
      }

      &.positive {
        color: #67c23a;
      }

      &.negative {
        color: #f56c6c;
      }

      &.warning {
        color: #e6a23c;
      }
    }
  }
}

.theory-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #ecf5ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  margin-top: 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;

  .el-icon {
    color: #409eff;
    font-size: 16px;
    margin-top: 2px;
  }
}

.goals-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-preview-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    background: #ecf5ff;
  }

  .goal-icon {
    font-size: 32px;
  }

  .goal-info {
    flex: 1;

    .goal-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .goal-formula {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
      font-family: 'Courier New', monospace;
    }

    .goal-progress {
      font-size: 14px;
      color: #606266;

      &.achieved {
        color: #67c23a;
        font-weight: 600;
      }
    }
  }

  .goal-theory {
    .el-icon {
      font-size: 20px;
      color: #909399;
      cursor: help;

      &:hover {
        color: #409eff;
      }
    }
  }
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .action-hint {
    font-size: 13px;
    color: #909399;
    margin: 0;
  }
}

.import-preview-text {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  margin: 0;
}

:deep(.el-alert) {
  ul {
    margin: 10px 0;
    padding-left: 20px;

    li {
      margin: 5px 0;
    }
  }
}
</style>
