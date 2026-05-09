/**
 * 多币种 composable
 * v1.9.0 — 全局币种感知 + 汇率换算
 */
import { ref, readonly } from 'vue'

const baseCurrency = ref('CNY')
const rates = ref<Record<string, number>>({})
const supportedCurrencies = ref<Array<{ code: string; name: string; symbol: string }>>([])
const loaded = ref(false)

export function useCurrency() {
  const api = (window as any).electronAPI || (window as any).api

  async function init(userId?: string) {
    if (!api?.currency) return
    try {
      supportedCurrencies.value = await api.currency.getSupported()
      if (userId) {
        baseCurrency.value = await api.currency.getBaseCurrency(userId)
      }
      // 预加载常见汇率
      const currencies = supportedCurrencies.value.map(c => c.code)
      rates.value = await api.currency.getRatesForBase(baseCurrency.value, currencies)
      loaded.value = true
    } catch (e) {
      console.warn('[useCurrency] 初始化失败:', e)
    }
  }

  async function setBase(userId: string, currency: string) {
    if (!api?.currency) return
    await api.currency.setBaseCurrency(userId, currency)
    baseCurrency.value = currency
    // 刷新汇率
    const currencies = supportedCurrencies.value.map(c => c.code)
    rates.value = await api.currency.getRatesForBase(currency, currencies)
  }

  function convert(amount: number, from: string): number {
    if (from === baseCurrency.value || !rates.value[from]) return amount
    return amount * rates.value[from]
  }

  function formatMoney(amount: number, currency?: string): string {
    const cur = currency ?? baseCurrency.value
    const info = supportedCurrencies.value.find(c => c.code === cur)
    const symbols: Record<string, string> = {
      CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩',
      HKD: 'HK$', TWD: 'NT$', SGD: 'S$', AUD: 'A$', CAD: 'C$', CHF: 'CHF'
    }
    const symbol = info?.symbol ?? symbols[cur] ?? cur
    const dec = (cur === 'JPY' || cur === 'KRW') ? 0 : 0 // Dashboard 默认整数
    return `${symbol}${amount.toLocaleString('zh-CN', { maximumFractionDigits: dec })}`
  }

  /** 带汇率换算的格式化 */
  function formatConverted(amount: number, fromCurrency: string): string {
    const converted = convert(amount, fromCurrency)
    return formatMoney(converted)
  }

  function getSymbol(code?: string): string {
    const cur = supportedCurrencies.value.find(c => c.code === (code ?? baseCurrency.value))
    return cur?.symbol ?? (code ?? '¥')
  }

  return {
    baseCurrency: readonly(baseCurrency),
    rates: readonly(rates),
    supportedCurrencies: readonly(supportedCurrencies),
    loaded: readonly(loaded),
    init,
    setBase,
    convert,
    formatMoney,
    formatConverted,
    getSymbol,
  }
}
