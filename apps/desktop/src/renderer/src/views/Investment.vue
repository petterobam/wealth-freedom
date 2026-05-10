<template>
  <FeatureGate feature="hasInvestment" :feature-name="t('investment.featureName')" :description="t('investment.featureDesc')" required-tier="basic">
  <div class="investment-page">
    <h1 class="page-title">{{ t('investment.title') }}</h1>
    <p class="page-desc">{{ t('investment.desc') }}</p>

    <!-- 投资概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon">📈</div>
        <div class="card-info">
          <div class="card-label">{{ t('investment.totalMarketValue') }}</div>
          <div class="card-value">{{ formatCurrency(summary.total_market_value) }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">💰</div>
        <div class="card-info">
          <div class="card-label">{{ t('investment.totalCost') }}</div>
          <div class="card-value">{{ formatCurrency(summary.total_cost) }}</div>
        </div>
      </div>
      <div class="overview-card" :class="{ positive: summary.total_profit_loss >= 0, negative: summary.total_profit_loss < 0 }">
        <div class="card-icon">{{ summary.total_profit_loss >= 0 ? '✅' : '🔻' }}</div>
        <div class="card-info">
          <div class="card-label">{{ t('investment.totalProfitLoss') }}</div>
          <div class="card-value">{{ formatCurrency(summary.total_profit_loss) }}</div>
          <div class="card-sub" :class="summary.total_profit_loss >= 0 ? 'text-green' : 'text-red'">
            {{ summary.total_return_pct.toFixed(2) }}%
          </div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">🏦</div>
        <div class="card-info">
          <div class="card-label">{{ t('investment.holdingCount') }}</div>
          <div class="card-value">{{ summary.holding_count }}</div>
        </div>
      </div>
    </div>

    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 持仓总览 -->
      <el-tab-pane :label="t('investment.holdings')" name="holdings">
        <div class="toolbar">
          <el-select v-model="selectedAccountId" :placeholder="t('investment.filterAccount')" clearable @change="loadPortfolios" style="width: 200px">
            <el-option v-for="a in accounts" :key="a.id" :label="`${a.name} (${a.platform})`" :value="a.id" />
          </el-select>
          <div class="toolbar-actions">
            <el-button type="primary" @click="showAddAccountDialog = true">
              <el-icon><Plus /></el-icon> {{ t('investment.newAccount') }}
            </el-button>
            <el-button @click="showAddPortfolioDialog = true" :disabled="accounts.length === 0">
              <el-icon><Plus /></el-icon> {{ t('investment.newPortfolio') }}
            </el-button>
            <el-button @click="showAddHoldingDialog = true" :disabled="allPortfolios.length === 0">
              <el-icon><Plus /></el-icon> {{ t('investment.addHolding') }}
            </el-button>
          </div>
        </div>

        <!-- 账户列表 -->
        <div v-if="accounts.length === 0" class="empty-state">
          <div class="empty-icon">🏦</div>
          <p>{{ t('investment.noAccount') }}</p>
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
                    <el-icon><Plus /></el-icon> {{ t('investment.add') }}
                  </el-button>
                  <el-popconfirm :title="t('investment.confirmDeletePortfolio')" @confirm="deletePortfolio(portfolio.id)">
                    <template #reference>
                      <el-button size="small" text type="danger"> {{ t('investment.delete') }}</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
              <el-table :data="getPortfolioHoldings(portfolio.id)" stripe size="small" class="holdings-table">
                <el-table-column prop="symbol" :label="t('investment.colSymbol')" width="100" />
                <el-table-column prop="name" :label="t('investment.colName')" min-width="120" />
                <el-table-column prop="type" :label="t('investment.colType')" width="80">
                  <template #default="{ row }">
                    <el-tag size="small" :type="typeTagMap[row.type] || 'info'">{{ typeLabelMap[row.type] || row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="t('investment.colQuantity')" width="100" align="right">
                  <template #default="{ row }">{{ row.quantity?.toFixed(2) }}</template>
                </el-table-column>
                <el-table-column :label="t('investment.colAvgCost')" width="110" align="right">
                  <template #default="{ row }">{{ formatCurrency(row.avg_cost) }}</template>
                </el-table-column>
                <el-table-column :label="t('investment.colCurrentPrice')" width="110" align="right">
                  <template #default="{ row }">
                    <span class="editable-price" @click="openEditPrice(row)">{{ formatCurrency(row.current_price) }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('investment.colMarketValue')" width="120" align="right">
                  <template #default="{ row }">{{ formatCurrency(row.market_value) }}</template>
                </el-table-column>
                <el-table-column :label="t('investment.colProfitLoss')" width="130" align="right">
                  <template #default="{ row }">
                    <span :class="row.profit_loss >= 0 ? 'text-green' : 'text-red'">
                      {{ formatCurrency(row.profit_loss) }}
                      <small>({{ row.profit_loss_pct?.toFixed(2) }}%)</small>
                    </span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('investment.colActions')" width="180" align="center">
                  <template #default="{ row }">
                    <el-button size="small" text @click="openAddTransaction(row)">{{ t('investment.trade') }}</el-button>
                    <el-popconfirm :title="t('investment.confirmDeleteHolding')" @confirm="deleteHolding(row.id)">
                      <template #reference>
                        <el-button size="small" text type="danger">{{ t('investment.delete') }}</el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="getPortfolioHoldings(portfolio.id).length === 0" class="empty-portfolio">
                {{ t('investment.noHolding') }}
              </div>
            </div>
            <div v-if="getAccountPortfolios(account.id).length === 0" class="empty-portfolio">
              {{ t('investment.noPortfolio') }}
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 交易记录 -->
      <el-tab-pane :label="t('investment.transactions')" name="transactions">
        <div class="toolbar">
          <el-select v-model="txFilterType" :placeholder="t('investment.transactionType')" clearable style="width: 130px">
            <el-option :label="t('investment.buy')" value="buy" />
            <el-option :label="t('investment.sell')" value="sell" />
            <el-option :label="t('investment.dividend')" value="dividend" />
          </el-select>
          <el-button @click="loadTransactions">{{ t('investment.refresh') }}</el-button>
        </div>
        <el-table :data="transactions" stripe size="small">
          <el-table-column prop="transaction_date" :label="t('investment.colDate')" width="110" />
          <el-table-column prop="symbol" :label="t('investment.colSymbol')" width="90" />
          <el-table-column prop="holding_name" :label="t('investment.colName')" min-width="120" />
          <el-table-column prop="type" :label="t('investment.type')" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.type === 'buy' ? 'success' : row.type === 'sell' ? 'danger' : 'warning'">
                {{ row.type === 'buy' ? t('investment.buy') : row.type === 'sell' ? t('investment.sell') : t('investment.dividend') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('investment.quantity')" width="90" align="right">
            <template #default="{ row }">{{ row.quantity?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column :label="t('investment.colPrice')" width="110" align="right">
            <template #default="{ row }">{{ formatCurrency(row.price) }}</template>
          </el-table-column>
          <el-table-column :label="t('investment.amount')" width="120" align="right">
            <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
          </el-table-column>
          <el-table-column :label="t('investment.colFee')" width="100" align="right">
            <template #default="{ row }">{{ row.fee ? formatCurrency(row.fee) : '-' }}</template>
          </el-table-column>
          <el-table-column :label="t('investment.colActions')" width="80" align="center">
            <template #default="{ row }">
              <el-popconfirm :title="t('investment.confirmDelete')" @confirm="deleteTransaction(row.id)">
                <template #reference>
                  <el-button size="small" text type="danger">{{ t('investment.delete') }}</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="transactions.length === 0" class="empty-state">
          <p>{{ t('investment.noTransactions') }}</p>
        </div>
      </el-tab-pane>

      <!-- 资产配置 -->
      <el-tab-pane :label="t('investment.allocation')" name="allocation">
        <div v-if="allocation" class="allocation-section">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="allocation-card">
                <h3>{{ t('investment.byType') }}</h3>
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
                <h3>{{ t('investment.byAccount') }}</h3>
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
            <h3>{{ t('investment.topHoldings') }}</h3>
            <el-table :data="allocation.top_holdings" stripe size="small">
              <el-table-column prop="symbol" :label="t('investment.symbol')" width="100" />
              <el-table-column prop="name" :label="t('investment.name')" min-width="120" />
              <el-table-column :label="t('investment.colMarketValue')" width="130" align="right">
                <template #default="{ row }">{{ formatCurrency(row.market_value) }}</template>
              </el-table-column>
              <el-table-column :label="t('investment.colProfitLoss')" width="100" align="right">
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
          <p>{{ t('investment.noAllocation') }}</p>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建账户弹窗 -->
    <el-dialog v-model="showAddAccountDialog" :title="t('investment.newInvestmentAccount')" width="450px">
      <el-form :model="accountForm" label-width="80px">
        <el-form-item :label="t('investment.accountName')">
          <el-input v-model="accountForm.name" :placeholder="t('investment.accountNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('investment.platform')">
          <el-input v-model="accountForm.platform" :placeholder="t('investment.platformPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('investment.type')">
          <el-select v-model="accountForm.type" style="width: 100%">
            <el-option :label="t('investment.stock')" value="stock" />
            <el-option :label="t('investment.fund')" value="fund" />
            <el-option :label="t('investment.bond')" value="bond" />
            <el-option :label="t('investment.future')" value="future" />
            <el-option :label="t('investment.crypto')" value="crypto" />
            <el-option :label="t('investment.other')" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('investment.notes')">
          <el-input v-model="accountForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAccountDialog = false"> {{ t('investment.cancel') }}</el-button>
        <el-button type="primary" @click="addAccount">{{ t('investment.create') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新建组合弹窗 -->
    <el-dialog v-model="showAddPortfolioDialog" :title="t('investment.newPortfolioDialog')" width="450px">
      <el-form :model="portfolioForm" label-width="80px">
        <el-form-item :label="t('investment.selectAccount')">
          <el-select v-model="portfolioForm.account_id" style="width: 100%">
            <el-option v-for="a in accounts" :key="a.id" :label="`${a.name} (${a.platform})`" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('investment.portfolioName')">
          <el-input v-model="portfolioForm.name" :placeholder="t('investment.portfolioNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('investment.description')">
          <el-input v-model="portfolioForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPortfolioDialog = false"> {{ t('investment.cancel') }}</el-button>
        <el-button type="primary" @click="addPortfolio">{{ t('investment.create') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加持仓弹窗 -->
    <el-dialog v-model="showAddHoldingDialog" :title="t('investment.addHolding')" width="500px">
      <el-form :model="holdingForm" label-width="80px">
        <el-form-item :label="t('investment.selectPortfolio')">
          <el-select v-model="holdingForm.portfolio_id" style="width: 100%">
            <el-option v-for="p in allPortfolios" :key="p.id" :label="`${p.account_name || ''} - ${p.name}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('investment.symbol')">
          <el-input v-model="holdingForm.symbol" :placeholder="t('investment.symbolPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('investment.name')">
          <el-input v-model="holdingForm.name" :placeholder="t('investment.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('investment.type')">
          <el-select v-model="holdingForm.type" style="width: 100%">
            <el-option :label="t('investment.stock')" value="stock" />
            <el-option :label="t('investment.fund')" value="fund" />
            <el-option :label="t('investment.bond')" value="bond" />
            <el-option :label="t('investment.etf')" value="etf" />
            <el-option :label="t('investment.other')" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('investment.quantity')">
          <el-input-number v-model="holdingForm.quantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('investment.avgCost')">
          <el-input-number v-model="holdingForm.avg_cost" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddHoldingDialog = false"> {{ t('investment.cancel') }}</el-button>
        <el-button type="primary" @click="addHolding">{{ t('investment.add') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增交易弹窗 -->
    <el-dialog v-model="showAddTransactionDialog" :title="t('investment.newTransaction')" width="500px">
      <el-form :model="txForm" label-width="80px">
        <el-form-item :label="t('investment.target')">
          <el-input :model-value="`${txForm.symbol} ${txForm.name}`" disabled />
        </el-form-item>
        <el-form-item :label="t('investment.type')">
          <el-select v-model="txForm.type" style="width: 100%">
            <el-option :label="t('investment.buy')" value="buy" />
            <el-option :label="t('investment.sell')" value="sell" />
            <el-option :label="t('investment.dividend')" value="dividend" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('investment.quantity')">
          <el-input-number v-model="txForm.quantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('investment.price')">
          <el-input-number v-model="txForm.price" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('investment.fee')">
          <el-input-number v-model="txForm.fee" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('investment.date')">
          <el-date-picker v-model="txForm.transaction_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('investment.notes')">
          <el-input v-model="txForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTransactionDialog = false"> {{ t('investment.cancel') }}</el-button>
        <el-button type="primary" @click="addTransaction">{{ t('investment.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 修改价格弹窗 -->
    <el-dialog v-model="showEditPriceDialog" :title="t('investment.updatePrice')" width="350px">
      <el-form label-width="80px">
        <el-form-item :label="editPriceTarget?.name">
          <el-input-number v-model="editPriceValue" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditPriceDialog = false"> {{ t('investment.cancel') }}</el-button>
        <el-button type="primary" @click="updatePrice">{{ t('investment.update') }}</el-button>
      </template>
    </el-dialog>
  </div>
  </FeatureGate>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FeatureGate from '@/components/FeatureGate.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

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

const typeLabelMap = computed<Record<string, string>>(() => ({ stock: t('investment.stock'), fund: t('investment.fund'), bond: t('investment.bond'), etf: t('investment.etf'), future: t('investment.future'), crypto: t('investment.crypto'), other: t('investment.other') }))
const typeTagMap: Record<string, string> = { stock: 'success', fund: '', bond: 'warning', etf: 'info', future: 'danger', crypto: 'warning', other: 'info' }

// ========== 计算 ==========
const filteredAccounts = computed(() => {
  if (!selectedAccountId.value) return accounts.value
  return accounts.value.filter(a => a.id === selectedAccountId.value)
})

const totalAllocValue = computed(() => {
  if (!allocation.value) return 1
  const types = allocation.value.by_type || []
  return types.reduce((s: number, item: any) => s + (item.value || 0), 0) || 1
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
  if (!accountForm.name || !accountForm.platform) { ElMessage.warning(t('investment.fillAccountAndPlatform')); return }
  await api.addInvestmentAccount({ ...accountForm })
  ElMessage.success(t('investment.accountCreated'))
  showAddAccountDialog.value = false
  Object.assign(accountForm, { name: '', platform: '', type: 'stock', notes: '' })
  await loadAccounts()
}

async function addPortfolio() {
  if (!portfolioForm.account_id || !portfolioForm.name) { ElMessage.warning(t('investment.selectAccountAndName')); return }
  await api.addPortfolio({ ...portfolioForm })
  ElMessage.success(t('investment.portfolioCreated'))
  showAddPortfolioDialog.value = false
  Object.assign(portfolioForm, { account_id: '', name: '', description: '' })
  await loadPortfolios()
}

async function addHolding() {
  if (!holdingForm.portfolio_id || !holdingForm.symbol) { ElMessage.warning(t('investment.selectPortfolioAndSymbol')); return }
  await api.addHolding({ ...holdingForm })
  ElMessage.success(t('investment.holdingAdded'))
  showAddHoldingDialog.value = false
  Object.assign(holdingForm, { portfolio_id: '', symbol: '', name: '', type: 'stock', quantity: 0, avg_cost: 0 })
  await Promise.all([loadPortfolios(), loadSummary(), loadAllocation()])
}

async function deletePortfolio(id: string) {
  await api.deletePortfolio(id)
  ElMessage.success(t('investment.portfolioDeleted'))
  await Promise.all([loadPortfolios(), loadSummary(), loadAllocation()])
}

async function deleteHolding(id: string) {
  await api.deleteHolding(id)
  ElMessage.success(t('investment.holdingDeleted'))
  await Promise.all([loadPortfolios(), loadSummary(), loadAllocation()])
}

async function deleteTransaction(id: string) {
  await api.deleteInvestmentTransaction(id)
  ElMessage.success(t('investment.transactionDeleted'))
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
  if (!txForm.holding_id || txForm.quantity <= 0) { ElMessage.warning(t('investment.fillQuantity')); return }
  await api.addInvestmentTransaction({ ...txForm })
  ElMessage.success(t('investment.transactionRecorded'))
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
  ElMessage.success(t('investment.priceUpdated'))
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
.page-desc { color: var(--text-secondary); margin-bottom: 20px; }

.overview-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.overview-card { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 16px; transition: transform 0.2s; }
.overview-card:hover { transform: translateY(-2px); }
.card-icon { font-size: 32px; }
.card-label { font-size: 13px; color: var(--text-secondary); }
.card-value { font-size: 22px; font-weight: 700; }
.card-sub { font-size: 13px; font-weight: 600; }
.positive { border-left: 3px solid var(--el-color-success); }
.negative { border-left: 3px solid var(--el-color-danger); }
.text-green { color: var(--el-color-success); }
.text-red { color: var(--el-color-danger); }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.toolbar-actions { display: flex; gap: 8px; }

.account-section { background: var(--bg-card); border-radius: 12px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.account-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; cursor: pointer; background: var(--bg-body); border-bottom: 1px solid #ebeef5; }
.account-header:hover { background: var(--bg-body); }
.account-name { font-weight: 600; font-size: 15px; margin-right: 10px; }
.account-info { display: flex; align-items: center; gap: 8px; }
.account-body { padding: 16px 20px; }

.portfolio-block { margin-bottom: 16px; }
.portfolio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.portfolio-name { font-weight: 600; font-size: 14px; color: var(--text-regular); }
.portfolio-actions { display: flex; gap: 4px; }
.empty-portfolio { text-align: center; color: var(--text-placeholder); padding: 20px 0; }

.editable-price { cursor: pointer; border-bottom: 1px dashed var(--el-color-primary); }
.editable-price:hover { color: var(--el-color-primary); }

.empty-state { text-align: center; padding: 60px 0; color: var(--text-placeholder); }
.empty-icon { font-size: 48px; margin-bottom: 12px; }

.allocation-section { margin-top: 8px; }
.allocation-card { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; }
.allocation-card h3 { font-size: 16px; margin-bottom: 16px; color: var(--text-primary); }
.alloc-bar { margin-bottom: 12px; }
.alloc-label { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-regular); margin-bottom: 4px; }
.alloc-track { height: 8px; background: #f0f2f5; border-radius: 4px; overflow: hidden; }
.alloc-fill { height: 100%; background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success)); border-radius: 4px; transition: width 0.3s; }
.alloc-fill.blue { background: linear-gradient(90deg, var(--el-color-primary), #36d399); }
.top-holdings { margin-top: 16px; }

:deep(.el-table) { font-size: 13px; }
:deep(.el-tag) { font-size: 11px; }

@media (max-width: 768px) {
  .investment-page { padding: 12px; }
  .overview-cards { grid-template-columns: 1fr 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
}
</style>
