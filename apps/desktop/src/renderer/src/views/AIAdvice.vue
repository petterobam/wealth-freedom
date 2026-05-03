<template>
  <div class="ai-advice-page">
    <div class="page-header">
      <h2>{{ t('aiAdvice.title') }}</h2>
      <div class="header-actions">
        <el-tag :type="configSet ? 'success' : 'warning'" size="small">
          {{ configSet ? t('aiAdvice.configured') : t('aiAdvice.notConfigured') }}
        </el-tag>
        <el-tag type="info" size="small">
          {{ t('aiAdvice.todayUsed', { count: usage.count }) }}
        </el-tag>
        <el-button size="small" @click="showConfig = true" :icon="Setting">{{ t('aiAdvice.settings') }}</el-button>
      </div>
    </div>

    <!-- 快速建议卡片 -->
    <div class="quick-tips" v-if="tips.length > 0">
      <h3>{{ t('aiAdvice.quickTips') }}</h3>
      <div class="tips-grid">
        <div
          v-for="(tip, i) in tips"
          :key="i"
          class="tip-card"
          :class="'tip-' + tip.severity"
          @click="tip.action && handleTipAction(tip)"
        >
          <div class="tip-icon">
            {{ tip.severity === 'warning' ? '⚠️' : tip.severity === 'success' ? '✅' : '💡' }}
          </div>
          <div class="tip-content">
            <div class="tip-title">{{ tip.title }}</div>
            <div class="tip-desc">{{ tip.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 功能 Tabs -->
    <el-tabs v-model="activeTab" class="ai-tabs">
      <!-- 支出分析 -->
      <el-tab-pane :label="t('aiAdvice.tabSpending')" name="spending">
        <div class="tab-content">
          <p class="tab-desc">{{ t('aiAdvice.spendingDesc') }}</p>
          <el-button
            type="primary"
            :loading="loading.spending"
            @click="analyzeSpending"
            :disabled="!configSet"
          >
            {{ loading.spending ? t('insights.analyzing') : t('aiAdvice.getAdvice') }}
          </el-button>
          <div v-if="results.spending" class="ai-result" v-html="renderMarkdown(results.spending)"></div>
        </div>
      </el-tab-pane>

      <!-- 储蓄规划 -->
      <el-tab-pane :label="t('aiAdvice.tabSavings')" name="savings">
        <div class="tab-content">
          <p class="tab-desc">{{ t('aiAdvice.savingsDesc') }}</p>
          <div class="savings-form">
            <el-input-number v-model="savingsTarget" :min="1000" :step="10000" :controls="false" :placeholder="t('aiAdvice.targetAmount')" />
            <span class="form-label">{{ t('aiAdvice.yuan') }}</span>
            <el-button
              type="primary"
              :loading="loading.savings"
              @click="planSavings"
              :disabled="!configSet"
            >
              {{ t('aiAdvice.generatePlan') }}
            </el-button>
          </div>
          <div v-if="results.savings" class="ai-result" v-html="renderMarkdown(results.savings)"></div>
        </div>
      </el-tab-pane>

      <!-- 投资建议 -->
      <el-tab-pane :label="t('aiAdvice.tabInvestment')" name="investment">
        <div class="tab-content">
          <p class="tab-desc">{{ t('aiAdvice.investmentDesc') }}</p>
          <div class="investment-form">
            <el-select v-model="riskLevel" style="width: 160px">
              <el-option :label="t('aiAdvice.conservative')" value="conservative" />
              <el-option :label="t('aiAdvice.moderate')" value="moderate" />
              <el-option :label="t('aiAdvice.aggressive')" value="aggressive" />
            </el-select>
            <el-button
              type="primary"
              :loading="loading.investment"
              @click="getInvestmentAdvice"
              :disabled="!configSet"
            >
              {{ t('aiAdvice.getAdvice') }}
            </el-button>
          </div>
          <div v-if="results.investment" class="ai-result" v-html="renderMarkdown(results.investment)"></div>
        </div>
      </el-tab-pane>

      <!-- 自由问答 -->
      <el-tab-pane :label="t('aiAdvice.tabChat')" name="chat">
        <div class="tab-content">
          <div class="chat-messages" ref="chatContainer">
            <div v-for="(msg, i) in chatHistory" :key="i" class="chat-msg" :class="msg.role">
              <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
              <div class="msg-content" v-html="msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content"></div>
            </div>
          </div>
          <div class="chat-input">
            <el-input
              v-model="chatInput"
              :placeholder="t('aiAdvice.chatPlaceholder')"
              @keyup.enter="sendChat"
              :disabled="loading.chat || !configSet"
            />
            <el-button
              type="primary"
              :loading="loading.chat"
              @click="sendChat"
              :disabled="!chatInput.trim() || !configSet"
            >
              {{ t('aiAdvice.send') }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 配置弹窗 -->
    <el-dialog v-model="showConfig" :title="t('aiAdvice.aiConfig')" width="480px">
      <el-form label-width="100px">
        <el-form-item :label="t('aiAdvice.apiKey')">
          <el-input v-model="aiConfig.apiKey" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item :label="t('aiAdvice.apiUrl')">
          <el-input v-model="aiConfig.baseUrl" placeholder="https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item :label="t('aiAdvice.model')">
          <el-input v-model="aiConfig.model" placeholder="gpt-4o-mini" />
        </el-form-item>
        <el-form-item :label="t('aiAdvice.maxTokens')">
          <el-input-number v-model="aiConfig.maxTokens" :min="100" :max="4096" />
        </el-form-item>
        <el-form-item :label="t('aiAdvice.temperature')">
          <el-slider v-model="aiConfig.temperature" :min="0" :max="1" :step="0.1" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConfig = false">{{ t('aiAdvice.cancel') }}</el-button>
        <el-button type="primary" @click="saveConfig">{{ t('aiAdvice.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import useI18n from '../i18n'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { safeCall } = useErrorHandler()

const { t } = useI18n()

const api = (window as any).api

// ====== 状态 ======
const activeTab = ref('spending')
const showConfig = ref(false)
const configSet = ref(false)
const usage = ref({ count: 0, tokens: 0 })
const tips = ref<any[]>([])

const loading = reactive({
  spending: false,
  savings: false,
  investment: false,
  chat: false,
})

const results = reactive({
  spending: '',
  savings: '',
  investment: '',
})

// 储蓄规划
const savingsTarget = ref(100000)

// 投资建议
const riskLevel = ref('moderate')

// 聊天
const chatInput = ref('')
const chatHistory = ref<Array<{ role: string; content: string }>>([])
const chatContainer = ref<HTMLElement>()

// 配置
const aiConfig = reactive({
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  maxTokens: 1500,
  temperature: 0.7,
})

// ====== 财务上下文 ======

async function getFinancialContext() {
  try {
    const [user, accounts, debts, transactions, goals, investments] = await Promise.all([
      api.user.get(),
      api.account.getAll(),
      api.debt.getAll(),
      api.transaction.getAll(),
      api.goal.getAll(),
      api.investment.getAll(),
    ])

    const totalAssets = (accounts || []).reduce((s: number, a: any) => s + (a.balance || 0), 0)
    const totalDebt = (debts || []).reduce((s: number, d: any) => s + (d.amount || 0), 0)
    const totalIncome = (transactions || []).filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0)
    const totalExpense = (transactions || []).filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount || 0), 0)
    const surplus = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? surplus / totalIncome : 0

    // 支出 Top5 分类
    const expenseByCategory: Record<string, number> = {}
    ;(transactions || []).filter((t: any) => t.type === 'expense').forEach((t: any) => {
      const cat = t.category || '其他'
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (t.amount || 0)
    })
    const topCategories = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))

    const investmentTotal = (investments || []).reduce((s: number, i: any) => s + (i.currentValue || i.amount || 0), 0)

    return {
      totalIncome,
      totalExpense,
      savingsRate,
      monthlySurplus: surplus,
      totalAssets,
      totalDebt,
      netWorth: totalAssets - totalDebt,
      topExpenseCategories: topCategories,
      investmentTotal,
      investmentReturnRate: 0.04,
      goals: (goals || []).map((g: any) => ({
        name: g.name,
        target: g.targetAmount || g.target || 0,
        current: g.currentAmount || g.current || 0,
        deadline: g.deadline || g.targetDate || '未设定',
      })),
      period: '最近记录',
    }
  } catch {
    return {
      totalIncome: 0, totalExpense: 0, savingsRate: 0, monthlySurplus: 0,
      totalAssets: 0, totalDebt: 0, netWorth: 0,
      topExpenseCategories: [], investmentTotal: 0, investmentReturnRate: 0,
      goals: [], period: '暂无数据',
    }
  }
}

// ====== Markdown 渲染 ======

function renderMarkdown(text: string): string {
  return text
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// ====== 操作 ======

async function analyzeSpending() {
  loading.spending = true
  results.spending = ''
  try {
    const ctx = await getFinancialContext()
    const res = await api.ai.analyzeSpending(ctx)
    results.spending = res.content
  } catch (e: any) {
    results.spending = `❌ 分析失败：${e.message}`
  } finally {
    loading.spending = false
    loadUsage()
  }
}

async function planSavings() {
  loading.savings = true
  results.savings = ''
  try {
    const ctx = await getFinancialContext()
    const res = await api.ai.savingsPlan(ctx, savingsTarget.value)
    results.savings = res.content
  } catch (e: any) {
    results.savings = `❌ 规划失败：${e.message}`
  } finally {
    loading.savings = false
    loadUsage()
  }
}

async function getInvestmentAdvice() {
  loading.investment = true
  results.investment = ''
  try {
    const ctx = await getFinancialContext()
    const holdings = [] // TODO: 从投资数据提取
    const res = await api.ai.investmentAdvice(ctx, holdings, riskLevel.value)
    results.investment = res.content
  } catch (e: any) {
    results.investment = `❌ 建议失败：${e.message}`
  } finally {
    loading.investment = false
    loadUsage()
  }
}

async function sendChat() {
  if (!chatInput.value.trim()) return
  const question = chatInput.value.trim()
  chatInput.value = ''
  chatHistory.value.push({ role: 'user', content: question })

  loading.chat = true
  try {
    const ctx = await getFinancialContext()
    const history = chatHistory.value.slice(-10) // 最近 10 条
    const res = await api.ai.chat(ctx, question, history.filter(m => m.role !== 'user' || m.content !== question))
    chatHistory.value.push({ role: 'assistant', content: res.content })
  } catch (e: any) {
    chatHistory.value.push({ role: 'assistant', content: `❌ 请求失败：${e.message}` })
  } finally {
    loading.chat = false
    loadUsage()
    await nextTick()
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }
}

async function saveConfig() {
  await api.ai.updateConfig(aiConfig)
  showConfig.value = false
  await loadConfig()
}

function handleTipAction(tip: any) {
  // 根据 action 导航到对应页面
  if (tip.action?.includes('预算')) {
    activeTab.value = 'spending'
  } else if (tip.action?.includes('投资')) {
    activeTab.value = 'investment'
  } else if (tip.action?.includes('储蓄')) {
    activeTab.value = 'savings'
  }
}

// ====== 初始化 ======

async function loadConfig() {
  const config = await api.ai.getConfig()
  configSet.value = config.apiKeySet
  aiConfig.baseUrl = config.baseUrl
  aiConfig.model = config.model
  aiConfig.maxTokens = config.maxTokens
  aiConfig.temperature = config.temperature
}

async function loadUsage() {
  usage.value = await api.ai.usage()
}

async function loadTips() {
  const ctx = await getFinancialContext()
  tips.value = await api.ai.quickTips(ctx)
}

onMounted(async () => {
  await loadConfig()
  await loadUsage()
  await loadTips()
})
</script>

<style scoped>
.ai-advice-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 快速建议 */
.quick-tips {
  margin-bottom: 20px;
}

.quick-tips h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.tip-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.tip-card:hover {
  transform: translateY(-2px);
}

.tip-warning {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.tip-success {
  background: #f0f9eb;
  border-left: 3px solid #67c23a;
}

.tip-info {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.tip-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.tip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tip-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

/* AI Tabs */
.ai-tabs {
  margin-top: 8px;
}

.tab-content {
  padding: 16px 0;
}

.tab-desc {
  color: #666;
  margin-bottom: 16px;
}

.savings-form,
.investment-form {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.form-label {
  color: #666;
}

/* AI 结果 */
.ai-result {
  margin-top: 20px;
  padding: 20px;
  background: var(--el-bg-color-page, #f5f7fa);
  border-radius: 8px;
  line-height: 1.8;
  font-size: 14px;
}

.ai-result :deep(h3),
.ai-result :deep(h4) {
  margin: 16px 0 8px;
  color: var(--el-text-color-primary);
}

.ai-result :deep(strong) {
  color: var(--el-color-primary);
}

/* 聊天 */
.chat-messages {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-bg-color-page, #f5f7fa);
  border-radius: 8px;
}

.chat-msg {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.chat-msg.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.msg-content {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.chat-msg.user .msg-content {
  background: var(--el-color-primary);
  color: #fff;
}

.chat-msg.assistant .msg-content {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter);
}

.chat-input {
  display: flex;
  gap: 8px;
}

.chat-input .el-input {
  flex: 1;
}

/* 暗色模式 */
:root.dark .tip-warning { background: #3a2e1a; }
:root.dark .tip-success { background: #1a2e1a; }
:root.dark .tip-info { background: #1a2535; }
</style>
