<template>
  <div class="investment-page">
    <h1 class="page-title">投资追踪</h1>
    <p class="page-desc">让钱为你工作，用数据驱动投资决策</p>

    <!-- 投资概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon">📈</div>
        <div class="card-info">
          <div class="card-label">总市值</div>
          <div class="card-value">{{ formatCurrency(summary.total_market_value) }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">💰</div>
        <div class="card-info">
          <div class="card-label">总成本</div>
          <div class="card-value">{{ formatCurrency(summary.total_cost) }}</div>
        </div>
      </div>
      <div class="overview-card" :class="{ positive: summary.total_profit_loss >= 0, negative: summary.total_profit_loss < 0 }">
        <div class="card-icon">{{ summary.total_profit_loss >= 0 ? '✅' : '🔻' }}</div>
        <div class="card-info">
          <div class="card-label">总盈亏</div>
          <div class="card-value">{{ formatCurrency(summary.total_profit_loss) }}</div>
          <div class="card-sub" :class="summary.total_profit_loss >= 0 ? 'text-green' : 'text-red'">
            {{ summary.total_return_pct.toFixed(2) }}%
          </div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">🏦</div>
        <div class="card-info">
          <div class="card-label">持有标的</div>
          <div class="card-value">{{ summary.holding_count }}</div>
        </div>
      </div>
    </div>

    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 持仓总览 -->
      <el-tab-pane label="持仓总览" name="holdings">
        <div class="toolbar">
          <el-select v-model="selectedAccountId" placeholder="筛选账户" clearable @change="loadPortfolios" style="width: 200px">
            <el-option v-for="a in accounts" :key="a.id" :label="`${a.name} (${a.platform})`" :value="a.id" />
          </el-select>
          <div class="toolbar-actions">
            <el-button type="primary" @click="showAddAccountDialog = true">
              <el-icon><Plus /></el-icon> 新建账户
            </el-button>
            <el-button @click="showAddPortfolioDialog = true" :disabled="accounts.length === 0">
              <el-icon><Plus /></el-icon> 新建组合
            </el-button>
            <el-button @click="showAddHoldingDialog = true" :disabled="allPortfolios.length === 0">
              <el-icon><Plus /></el-icon> 添加持仓
            </el-button>
          </div>
        </div>

        <!-- 账户列表 -->
        <div v-if="accounts.length === 0" class="empty-state">
          <div class="empty-icon">🏦</div>
          <p>还没有投资账户，点击「新建账户」开始</p>
        </div>

        <!-- 按账户/组合展示持仓 -->
        <div v-for="account in filteredAccounts" :key="account.id" class="account-section">
          <div class="account-header" @click="toggleAccount(account.id)">
            <div class="account-info">
              <span class="account-name">{{ account.name }}</span>
              <el-tag size="small" type="info">{{ account.platform }}</el-tag>
              <el-tag size="small">{{ account.type }}</el-tag>
            </div>
            <el-icon :class="{ rotated: expandedAccounts[account.id] }"><ArrowDown /></el-icon>
          </div>
          <div v-show="expandedAccounts[account.id]" class="account-body">
            <div v-for="portfolio in getAccountPortfolios(account.id)" :key="portfolio.id" class="portfolio-block">
              <div class="portfolio-header">
                <span class="portfolio-name">{{ portfolio.name }}</span>
                <div class="portfolio-actions">
                  <el-button size="small" text @click="openAddHoldingForPortfolio(portfolio.id)">
                    <el-icon><Plus /></el-icon> 添加
                  </el-button>
                  <el-popconfirm title="确定删除此组合？" @confirm="deletePortfolio(portfolio.id)">
                    <template #reference>
                      <el-button size="small" text type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
              <el-table :data="getPortfolioHoldings(portfolio.id)" stripe size="small" class="holdings-table">
                <el-table-column prop="symbol" label="代码" width="100" />
                <el-table-column prop="name" label="名称" min-width="120" />
                <el-table-column prop="type" label="类型" width="80">
                  <template #default="{ row }">
                    <el-tag size="small" :type="typeTagMap[row.type] || 'info'">{{ typeLabelMap[row.type] || row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="持仓量" width="100" align="right">
                  <template #default="{ row }">{{ row.quantity?.toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="均价" width="110" align="right">
                  <template #default="{ row }">{{ formatCurrency(row.avg_cost) }}</template>
                </el-table-column>
                <el-table-column label="现价" width="110" align="right">
                  <template #default="{ row }">
                    <span class="editable-price" @click="openEditPrice(row)">{{ formatCurrency(row.current_price) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="市值" width="120" align="right">
                  <template #default="{ row }">{{ formatCurrency(row.market_value) }}</template>
                </el-table-column>
                <el-table-column label="盈亏" width="130" align="right">
                  <template #default="{ row }">
                    <span :class="row.profit_loss >= 0 ? 'text-green' : 'text-red'">
                      {{ formatCurrency(row.profit_loss) }}
                      <small>({{ row.profit_loss_pct?.toFixed(2) }}%)</small>
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180" align="center">
                  <template #default="{ row }">
                    <el-button size="small" text @click="openAddTransaction(row)">交易</el-button>
                    <el-popconfirm title="确定删除此持仓及其交易记录？" @confirm="deleteHolding(row.id)">
                      <template #reference>
                        <el-button size="small" text type="danger">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="getPortfolioHoldings(portfolio.id).length === 0" class="empty-portfolio">
                暂无持仓，点击「添加」开始
              </div>
            </div>
            <div v-if="getAccountPortfolios(account.id).length === 0" class="empty-portfolio">
              暂无组合，点击上方「新建组合」
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 交易记录 -->
      <el-tab-pane label="交易记录" name="transactions">
        <div class="toolbar">
          <el-select v-model="txFilterType" placeholder="交易类型" clearable style="width: 130px">
            <el-option label="买入" value="buy" />
            <el-option label="卖出" value="sell" />
            <el-option label="分红" value="dividend" />
          </el-select>
          <el-button @click="loadTransactions">刷新</el-button>
        </div>
        <el-table :data="transactions" stripe size="small">
          <el-table-column prop="transaction_date" label="日期" width="110" />
          <el-table-column prop="symbol" label="代码" width="90" />
          <el-table-column prop="holding_name" label="名称" min-width="120" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.type === 'buy' ? 'success' : row.type === 'sell' ? 'danger' : 'warning'">
                {{ row.type === 'buy' ? '买入' : row.type === 'sell' ? '卖出' : '分红' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="90" align="right">
            <template #default="{ row }">{{ row.quantity?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="价格" width="110" align="right">
            <template #default="{ row }">{{ formatCurrency(row.price) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
          </el-table-column>
          <el-table-column label="手续费" width="100" align="right">
            <template #default="{ row }">{{ row.fee ? formatCurrency(row.fee) : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-popconfirm title="确定删除？" @confirm="deleteTransaction(row.id)">
                <template #reference>
                  <el-button size="small" text type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="transactions.length === 0" class="empty-state">
          <p>暂无交易记录</p>
        </div>
      </el-tab-pane>

      <!-- 资产配置 -->
      <el-tab-pane label="资产配置" name="allocation">
        <div v-if="allocation" class="allocation-section">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="allocation-card">
                <h3>按类型分布</h3>
                <div v-for="item in allocation.by_type" :key="item.type" class="alloc-bar">
                  <div class="alloc-label">
                    <span>{{ typeLabelMap[item.type] || item.type }}</span>
                    <span>{{ formatCurrency(item.value) }} ({{ allocPct(item.value) }}%)</span>
                  </div>
                  <div class="alloc-track">
                    <div class="alloc-fill" :style="{ width: allocPct(item.value) + '%' }"></div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="allocation-card">
                <h3>按账户分布</h3>
                <div v-for="item in allocation.by_account" :key="item.account_name" class="alloc-bar">
                  <div class="alloc-label">
                    <span>{{ item.account_name }} ({{ item.platform }})</span>
                    <span>{{ formatCurrency(item.value) }} ({{ allocPct(item.value) }}%)</span>
                  </div>
                  <div class="alloc-track">
                    <div class="alloc-fill blue" :style="{ width: allocPct(item.value) + '%' }"></div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
          <div class="allocation-card top-holdings">
            <h3>Top 10 持仓</h3>
            <el-table :data="allocation.top_holdings" stripe size="small">
              <el-table-column prop="symbol" label="代码" width="100" />
              <el-table-column prop="name" label="名称" min-width="120" />
              <el-table-column label="市值" width="130" align="right">
                <template #default="{ row }">{{ formatCurrency(row.market_value) }}</template>
              </el-table-column>
              <el-table-column label="盈亏%" width="100" align="right">
                <template #default="{ row }">
                  <span :class="row.profit_loss_pct >= 0 ? 'text-green' : 'text-red'">
                    {{ row.profit_loss_pct?.toFixed(2) }}%
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无持仓数据</p>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建账户弹窗 -->
    <el-dialog v-model="showAddAccountDialog" title="新建投资账户" width="450px">
      <el-form :model="accountForm" label-width="80px">
        <el-form-item label="账户名称">
          <el-input v-model="accountForm.name" placeholder="如：A股账户" />
        </el-form-item>
        <el-form-item label="平台">
          <el-input v-model="accountForm.platform" placeholder="如：华泰证券" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="accountForm.type" style="width: 100%">
            <el-option label="股票" value="stock" />
            <el-option label="基金" value="fund" />
            <el-option label="债券" value="bond" />
            <el-option label="期货" value="future" />
            <el-option label="加密货币" value="crypto" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="accountForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAccountDialog = false">取消</el-button>
        <el-button type="primary" @click="addAccount">创建</el-button>
      </template>
    </el-dialog>

    <!-- 新建组合弹窗 -->
    <el-dialog v-model="showAddPortfolioDialog" title="新建投资组合" width="450px">
      <el-form :model="portfolioForm" label-width="80px">
        <el-form-item label="所属账户">
          <el-select v-model="portfolioForm.account_id" style="width: 100%">
            <el-option v-for="a in accounts" :key="a.id" :label="`${a.name} (${a.platform})`" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="组合名称">
          <el-input v-model="portfolioForm.name" placeholder="如：核心持仓" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="portfolioForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPortfolioDialog = false">取消</el-button>
        <el-button type="primary" @click="addPortfolio">创建</el-button>
      </template>
    </el-dialog>

    <!-- 添加持仓弹窗 -->
    <el-dialog v-model="showAddHoldingDialog" title="添加持仓" width="500px">
      <el-form :model="holdingForm" label-width="80px">
        <el-form-item label="所属组合">
          <el-select v-model="holdingForm.portfolio_id" style="width: 100%">
            <el-option v-for="p in allPortfolios" :key="p.id" :label="`${p.account_name || ''} - ${p.name}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="代码">
          <el-input v-model="holdingForm.symbol" placeholder="如：600519" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="holdingForm.name" placeholder="如：贵州茅台" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="holdingForm.type" style="width: 100%">
            <el-option label="股票" value="stock" />
            <el-option label="基金" value="fund" />
            <el-option label="债券" value="bond" />
            <el-option label="ETF" value="etf" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="holdingForm.quantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="均价">
          <el-input-number v-model="holdingForm.avg_cost" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddHoldingDialog = false">取消</el-button>
        <el-button type="primary" @click="addHolding">添加</el-button>
      </template>
    </el-dialog>

    <!-- 新增交易弹窗 -->
    <el-dialog v-model="showAddTransactionDialog" title="新增交易" width="500px">
      <el-form :model="txForm" label-width="80px">
        <el-form-item label="标的">
          <el-input :model-value="`${txForm.symbol} ${txForm.name}`" disabled />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="txForm.type" style="width: 100%">
            <el-option label="买入" value="buy" />
            <el-option label="卖出" value="sell" />
            <el-option label="分红" value="dividend" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="txForm.quantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="txForm.price" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
        <el-form-item label="手续费">
          <el-input-number v-model="txForm.fee" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="txForm.transaction_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="txForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTransactionDialog = false">取消</el-button>
        <el-button type="primary" @click="addTransaction">确认</el-button>
      </template>
    </el-dialog>

    <!-- 修改价格弹窗 -->
    <el-dialog v-model="showEditPriceDialog" title="更新当前价格" width="350px">
      <el-form label-width="80px">
        <el-form-item :label="editPriceTarget?.name">
          <el-input-number v-model="editPriceValue" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditPriceDialog = false">取消</el-button>
        <el-button type="primary" @click="updatePrice">更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const api = (window as any).electronAPI

// ========== 状态 ==========
const activeTab = ref('holdings')
const accounts = ref<any[]>([])
const allPortfolios = ref<any[]>([])
const holdingsMap = ref<Record<string, any[]>>({})
const transactions = ref<any[]>([])
const summary = ref<any>({ total_market_value: 0, total_cost: 0, total_profit_loss: 0, total_return_pct: 0, holding_count: 0, realized_profit: 0 })
const allocation = ref<any>(null)

const selectedAccountId = ref<string | undefined>(undefined)
const expandedAccounts = ref<Record<string, boolean>>({})
const txFilterType = ref<string | undefined>(undefined)

// 弹窗控制
const showAddAccountDialog = ref(false)
const showAddPortfolioDialog = ref(false)
const showAddHoldingDialog = ref(false)
const showAddTransactionDialog = ref(false)
const showEditPriceDialog = ref(false)

// 表单
const accountForm = reactive({ name: '', platform: '', type: 'stock', notes: '' })
const portfolioForm = reactive({ account_id: '', name: '', description: '' })
const holdingForm = reactive({ portfolio_id: '', symbol: '', name: '', type: 'stock', quantity: 0, avg_cost: 0 })
const txForm = reactive({ holding_id: '', symbol: '', name: '', type: 'buy', quantity: 0, price: 0, fee: 0, transaction_date: new Date().toISOString().slice(0, 10), notes: '' })
const editPriceTarget = ref<any>(null)
const editPriceValue = ref(0)

const typeLabelMap: Record<string, string> = { stock: '股票', fund: '基金', bond: '债券', etf: 'ETF', future: '期货', crypto: '加密', other: '其他' }
const typeTagMap: Record<string, string> = { stock: 'success', fund: '', bond: 'warning', etf: 'info', future: 'danger', crypto: 'warning', other: 'info' }

// ========== 计算 ==========
const filteredAccounts = computed(() => {
  if (!selectedAccountId.value) return accounts.value
  return accounts.value.filter(a => a.id === selectedAccountId.value)
})

const totalAllocValue = computed(() => {
  if (!allocation.value) return 1
  const types = allocation.value.by_type || []
  return types.reduce((s: number, t: any) => s + (t.value || 0), 0) || 1
})

function allocPct(value: number) {
  return ((value / totalAllocValue.value) * 100).toFixed(1)
}

function getAccountPortfolios(accountId: string) {
  return allPortfolios.value.filter(p => p.account_id === accountId)
}

function getPortfolioHoldings(portfolioId: string) {
  return holdingsMap.value[portfolioId] || []
}

function toggleAccount(id: string) {
  expandedAccounts.value[id] = !expandedAccounts.value[id]
}

// ========== 加载 ==========
async function loadAll() {
  await Promise.all([loadAccounts(), loadSummary(), loadAllocation(), loadTransactions()])
}

async function loadAccounts() {
  accounts.value = await api.getInvestmentAccounts()
  accounts.value.forEach((a: any) => { if (expandedAccounts.value[a.id] === undefined) expandedAccounts.value[a.id] = true })
}

async function loadPortfolios() {
  allPortfolios.value = await api.getPortfolios(selectedAccountId.value || undefined)
  // Load holdings for each portfolio
  for (const p of allPortfolios.value) {
    holdingsMap.value[p.id] = await api.getHoldings(p.id)
  }
}

async function loadTransactions() {
  const opts: any = { limit: 100 }
  if (txFilterType.value) opts.type = txFilterType.value
  transactions.value = await api.getInvestmentTransactions(opts)
}

async function loadSummary() {
  summary.value = await api.getInvestmentSummary()
}

async function loadAllocation() {
  allocation.value = await api.getInvestmentAllocation()
}

// ========== 操作 ==========
async function addAccount() {
  if (!accountForm.name || !accountForm.platform) { ElMessage.warning('请填写账户名称和平台'); return }
  await api.addInvestmentAccount({ ...accountForm })
  ElMessage.success('账户已创建')
  showAddAccountDialog.value = false
  Object.assign(accountForm, { name: '', platform: '', type: 'stock', notes: '' })
  await loadAccounts()
}

async function addPortfolio() {
  if (!portfolioForm.account_id || !portfolioForm.name) { ElMessage.warning('请选择账户并填写组合名称'); return }
  await api.addPortfolio({ ...portfolioForm })
  ElMessage.success('组合已创建')
  showAddPortfolioDialog.value = false
  Object.assign(portfolioForm, { account_id: '', name: '', description: '' })
  await loadPortfolios()
}

async function addHolding() {
  if (!holdingForm.portfolio_id || !holdingForm.symbol) { ElMessage.warning('请选择组合并填写代码'); return }
  await api.addHolding({ ...holdingForm })
  ElMessage.success('持仓已添加')
  showAddHoldingDialog.value = false
  Object.assign(holdingForm, { portfolio_id: '', symbol: '', name: '', type: 'stock', quantity: 0, avg_cost: 0 })
  await Promise.all([loadPortfolios(), loadSummary(), loadAllocation()])
}

async function deletePortfolio(id: string) {
  await api.deletePortfolio(id)
  ElMessage.success('组合已删除')
  await Promise.all([loadPortfolios(), loadSummary(), loadAllocation()])
}

async function deleteHolding(id: string) {
  await api.deleteHolding(id)
  ElMessage.success('持仓已删除')
  await Promise.all([loadPortfolios(), loadSummary(), loadAllocation()])
}

async function deleteTransaction(id: string) {
  await api.deleteInvestmentTransaction(id)
  ElMessage.success('交易已删除')
  await Promise.all([loadTransactions(), loadPortfolios(), loadSummary()])
}

function openAddHoldingForPortfolio(portfolioId: string) {
  holdingForm.portfolio_id = portfolioId
  showAddHoldingDialog.value = true
}

function openAddTransaction(holding: any) {
  txForm.holding_id = holding.id
  txForm.symbol = holding.symbol
  txForm.name = holding.name
  txForm.type = 'buy'
  txForm.quantity = 0
  txForm.price = holding.current_price || 0
  txForm.fee = 0
  txForm.transaction_date = new Date().toISOString().slice(0, 10)
  txForm.notes = ''
  showAddTransactionDialog.value = true
}

async function addTransaction() {
  if (!txForm.holding_id || txForm.quantity <= 0) { ElMessage.warning('请填写交易数量'); return }
  await api.addInvestmentTransaction({ ...txForm })
  ElMessage.success('交易已记录')
  showAddTransactionDialog.value = false
  await Promise.all([loadPortfolios(), loadTransactions(), loadSummary(), loadAllocation()])
}

function openEditPrice(holding: any) {
  editPriceTarget.value = holding
  editPriceValue.value = holding.current_price || 0
  showEditPriceDialog.value = true
}

async function updatePrice() {
  if (!editPriceTarget.value) return
  await api.updateHoldingPrice({ id: editPriceTarget.value.id, current_price: editPriceValue.value })
  ElMessage.success('价格已更新')
  showEditPriceDialog.value = false
  await Promise.all([loadPortfolios(), loadSummary(), loadAllocation()])
}

function formatCurrency(val: number | undefined) {
  if (val === undefined || val === null) return '¥0.00'
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(loadAll)
</script>

<style scoped>
.investment-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.page-desc { color: #909399; margin-bottom: 20px; }

.overview-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.overview-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 16px; transition: transform 0.2s; }
.overview-card:hover { transform: translateY(-2px); }
.card-icon { font-size: 32px; }
.card-label { font-size: 13px; color: #909399; }
.card-value { font-size: 22px; font-weight: 700; }
.card-sub { font-size: 13px; font-weight: 600; }
.positive { border-left: 3px solid #67c23a; }
.negative { border-left: 3px solid #f56c6c; }
.text-green { color: #67c23a; }
.text-red { color: #f56c6c; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.toolbar-actions { display: flex; gap: 8px; }

.account-section { background: #fff; border-radius: 12px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.account-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; cursor: pointer; background: #fafafa; border-bottom: 1px solid #ebeef5; }
.account-header:hover { background: #f5f7fa; }
.account-name { font-weight: 600; font-size: 15px; margin-right: 10px; }
.account-info { display: flex; align-items: center; gap: 8px; }
.account-body { padding: 16px 20px; }

.portfolio-block { margin-bottom: 16px; }
.portfolio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.portfolio-name { font-weight: 600; font-size: 14px; color: #606266; }
.portfolio-actions { display: flex; gap: 4px; }
.empty-portfolio { text-align: center; color: #c0c4cc; padding: 20px 0; }

.editable-price { cursor: pointer; border-bottom: 1px dashed #409eff; }
.editable-price:hover { color: #409eff; }

.empty-state { text-align: center; padding: 60px 0; color: #c0c4cc; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }

.allocation-section { margin-top: 8px; }
.allocation-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; }
.allocation-card h3 { font-size: 16px; margin-bottom: 16px; color: #303133; }
.alloc-bar { margin-bottom: 12px; }
.alloc-label { display: flex; justify-content: space-between; font-size: 13px; color: #606266; margin-bottom: 4px; }
.alloc-track { height: 8px; background: #f0f2f5; border-radius: 4px; overflow: hidden; }
.alloc-fill { height: 100%; background: linear-gradient(90deg, #409eff, #67c23a); border-radius: 4px; transition: width 0.3s; }
.alloc-fill.blue { background: linear-gradient(90deg, #409eff, #36d399); }
.top-holdings { margin-top: 16px; }

:deep(.el-table) { font-size: 13px; }
:deep(.el-tag) { font-size: 11px; }

@media (max-width: 768px) {
  .investment-page { padding: 12px; }
  .overview-cards { grid-template-columns: 1fr 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
}
</style>
