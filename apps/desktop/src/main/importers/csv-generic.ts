/**
 * 通用 CSV 导入器
 * 
 * 支持用户自定义映射，或自动识别常见列名
 * 期望格式：date,type,category,amount,description
 */

import type { Importer, ImportedTransaction, RawRecord } from './types';

export const genericImporter: Importer = {
  name: '通用CSV',

  detect(headers: string[]): number {
    const lower = headers.map(h => h.toLowerCase().trim());
    const hasDate = lower.some(h => ['date', '日期', '交易日期', 'transaction_date'].includes(h));
    const hasAmount = lower.some(h => ['amount', '金额', '交易金额', 'transaction_amount'].includes(h));
    if (hasDate && hasAmount) return 0.8;
    if (hasDate || hasAmount) return 0.3;
    return 0;
  },

  parse(rows: RawRecord[]): ImportedTransaction[] {
    return rows.map(row => parseGenericRow(row)).filter((r): r is ImportedTransaction => r !== null);
  },
};

function parseGenericRow(row: RawRecord): ImportedTransaction | null {
  const date = findAndParseDate(row);
  if (!date) return null;

  const amount = findAndParseAmount(row);
  if (amount === null || amount <= 0) return null;

  const type = detectType(row, amount);
  const category = row['category'] || row['分类'] || row['类型'] || '其他';
  const description = row['description'] || row['备注'] || row['说明'] || row['摘要'] || category;
  const counterparty = row['counterparty'] || row['对方'] || row['交易对方'] || undefined;

  return { date, type, category, amount, description, counterparty, tags: [] };
}

function findAndParseDate(row: RawRecord): string | null {
  const candidates = ['date', '日期', '交易日期', 'transaction_date', 'time', '时间', '交易时间'];
  for (const key of candidates) {
    const val = row[key];
    if (val) {
      const m = val.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (m) {
        return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
      }
    }
  }
  return null;
}

function findAndParseAmount(row: RawRecord): number | null {
  const candidates = ['amount', '金额', '交易金额', 'transaction_amount', 'money'];
  for (const key of candidates) {
    const val = row[key];
    if (val) {
      const num = parseFloat(val.replace(/[¥,，\s]/g, ''));
      if (!isNaN(num)) return Math.abs(num);
    }
  }
  return null;
}

function detectType(row: RawRecord, amount: number): 'income' | 'expense' | 'transfer' {
  // 显式类型字段
  const typeField = (row['type'] || row['类型'] || row['收/支'] || row['收支'] || '').toLowerCase();
  if (typeField.includes('收') || typeField === 'income' || typeField === 'in') return 'income';
  if (typeField.includes('支') || typeField === 'expense' || typeField === 'out') return 'expense';
  if (typeField.includes('转') || typeField === 'transfer') return 'transfer';

  // 金额符号判断：负数为支出
  const rawAmount = row['amount'] || row['金额'] || '';
  if (rawAmount.startsWith('-')) return 'expense';

  return 'expense'; // 默认支出
}
