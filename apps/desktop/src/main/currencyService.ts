/**
 * 多币种支持服务
 * v1.9.0 — 汇率获取 + 缓存 + 换算
 */

import type { Database } from 'better-sqlite3';

// 支持的币种列表
export const SUPPORTED_CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF' },
  { code: 'THB', name: '泰铢', symbol: '฿' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  fetchedAt: string; // ISO timestamp
  source: string;
}

// 内存缓存
let ratesCache: Map<string, ExchangeRate> = new Map();
let lastFetchTime = 0;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4小时

/**
 * 获取汇率（优先缓存，过期则从API获取）
 */
export async function getExchangeRate(
  from: string,
  to: string,
  apiKey?: string
): Promise<number> {
  if (from === to) return 1;

  const cacheKey = `${from}_${to}`;
  const cached = ratesCache.get(cacheKey);

  // 缓存未过期
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
    return cached.rate;
  }

  // 从API获取
  try {
    const rate = await fetchRateFromAPI(from, to, apiKey);
    ratesCache.set(cacheKey, {
      from,
      to,
      rate,
      fetchedAt: new Date().toISOString(),
      source: 'exchangerate-api',
    });
    lastFetchTime = Date.now();
    return rate;
  } catch (err) {
    // API失败时使用旧缓存（即使过期）
    if (cached) {
      console.warn(`[currency] API失败，使用过期缓存 ${from}->${to}:`, err);
      return cached.rate;
    }
    // 无缓存，尝试反向汇率
    const reverseKey = `${to}_${from}`;
    const reverseCached = ratesCache.get(reverseKey);
    if (reverseCached) {
      return 1 / reverseCached.rate;
    }
    throw new Error(`无法获取汇率 ${from}->${to}: ${err}`);
  }
}

/**
 * 从 exchangerate-api.com 获取汇率
 */
async function fetchRateFromAPI(from: string, to: string, apiKey?: string): Promise<number> {
  // 免费API（无需key，1500次/月）
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`
    : `https://open.er-api.com/v6/latest/${from}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API返回 ${res.status}`);

  const data = await res.json();

  if (apiKey) {
    // Pair endpoint
    if (data.result === 'success') return data.conversion_rate;
    throw new Error(data['error-type'] || '未知API错误');
  } else {
    // Latest endpoint
    if (data.rates && data.rates[to] !== undefined) return data.rates[to];
    throw new Error(`无 ${to} 汇率数据`);
  }
}

/**
 * 批量获取多个币种对基准币的汇率
 */
export async function getRatesForBaseCurrency(
  baseCurrency: string,
  currencies: string[],
  apiKey?: string
): Promise<Map<string, number>> {
  const rates = new Map<string, number>();
  rates.set(baseCurrency, 1);

  // 尝试批量获取（一次API调用）
  try {
    const url = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      : `https://open.er-api.com/v6/latest/${baseCurrency}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        for (const cur of currencies) {
          if (data.rates[cur] !== undefined) {
            rates.set(cur, data.rates[cur]);
            ratesCache.set(`${baseCurrency}_${cur}`, {
              from: baseCurrency,
              to: cur,
              rate: data.rates[cur],
              fetchedAt: new Date().toISOString(),
              source: 'exchangerate-api',
            });
          }
        }
        lastFetchTime = Date.now();
        return rates;
      }
    }
  } catch {
    // 批量失败，逐个获取
  }

  // 逐个获取
  for (const cur of currencies) {
    if (cur === baseCurrency) continue;
    try {
      const rate = await getExchangeRate(baseCurrency, cur, apiKey);
      rates.set(cur, rate);
    } catch {
      rates.set(cur, 0); // 标记为不可用
    }
  }

  return rates;
}

/**
 * 金额换算
 */
export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  apiKey?: string
): Promise<{ converted: number; rate: number }> {
  const rate = await getExchangeRate(fromCurrency, toCurrency, apiKey);
  return { converted: amount * rate, rate };
}

/**
 * 将多币种金额统一换算为基准币
 */
export async function convertToBaseCurrency(
  items: Array<{ amount: number; currency: string }>,
  baseCurrency: string,
  apiKey?: string
): Promise<{ total: number; details: Array<{ amount: number; currency: string; rate: number; converted: number }> }> {
  // 收集需要的币种
  const currencies = [...new Set(items.map(i => i.currency))];
  const rates = await getRatesForBaseCurrency(baseCurrency, currencies, apiKey);

  let total = 0;
  const details = items.map(item => {
    const rate = rates.get(item.currency) ?? 1;
    const converted = item.amount * rate;
    total += converted;
    return { amount: item.amount, currency: item.currency, rate, converted };
  });

  return { total, details };
}

/**
 * 获取货币符号
 */
export function getCurrencySymbol(code: string): string {
  const cur = SUPPORTED_CURRENCIES.find(c => c.code === code);
  return cur?.symbol ?? code;
}

/**
 * 格式化金额（带币种符号）
 */
export function formatCurrency(amount: number, currency: string, decimals?: number): string {
  const symbol = getCurrencySymbol(currency);
  const dec = decimals ?? (currency === 'JPY' || currency === 'KRW' ? 0 : 2);
  return `${symbol}${amount.toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
}

/**
 * 缓存状态（调试用）
 */
export function getCacheStatus(): {
  cachedPairs: number;
  lastFetch: string | null;
  ttlRemaining: number;
} {
  return {
    cachedPairs: ratesCache.size,
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    ttlRemaining: Math.max(0, CACHE_TTL_MS - (Date.now() - lastFetchTime)),
  };
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  ratesCache = new Map();
  lastFetchTime = 0;
}
