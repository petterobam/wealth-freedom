/**
 * 支付宝 CSV 导入器
 * 
 * 支付宝导出格式（账单CSV）：
 * 前 N 行为头部信息（账号、统计等），然后空行，然后是列标题行，最后是数据行
 * 
 * 关键列：交易时间, 交易分类, 交易对方, 商品说明, 收/支, 金额, 交易状态
 */

import type { Importer, ImportedTransaction, RawRecord } from './types';

export const alipayImporter: Importer = {
  name: '支付宝',

  detect(headers: string[]): number {
    const headerStr = headers.join(',');
    const hits = ['交易时间', '交易对方', '商品说明', '收/支', '金额'].filter(h => headerStr.includes(h));
    return hits.length >= 3 ? 0.9 : hits.length >= 2 ? 0.5 : 0;
  },

  parse(rows: RawRecord[]): ImportedTransaction[] {
    const result: ImportedTransaction[] = [];

    for (const row of rows) {
      try {
        const date = parseDate(row['交易时间'] || row['交易创建时间'] || '');
        if (!date) continue;

        const direction = (row['收/支'] || '').trim();
        if (direction === '不计收支') continue;

        const amountStr = (row['金额'] || '').replace(/[¥,\s]/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) continue;

        // 只导入交易成功的
        const status = (row['交易状态'] || '').trim();
        if (status && status !== '交易成功' && status !== '已付款') continue;

        const type = direction === '收入' ? 'income' : 'expense';
        const category = mapCategory(row['交易分类'] || row['交易分类名称'] || '');
        const description = (row['商品说明'] || row['商品名称'] || '').trim();
        const counterparty = (row['交易对方'] || '').trim();

        result.push({
          date,
          type,
          category,
          amount,
          description: description || category,
          counterparty: counterparty || undefined,
          tags: ['支付宝'],
        });
      } catch {
        // skip malformed rows
      }
    }

    return result;
  },
};

/** 支付宝分类 → 应用分类映射 */
const CATEGORY_MAP: Record<string, string> = {
  '餐饮美食': '餐饮',
  '服饰装扮': '购物',
  '日用百货': '购物',
  '交通出行': '交通',
  '住房物业': '居住',
  '医疗健康': '医疗',
  '文教娱乐': '娱乐',
  '充值缴费': '水电',
  '金融保险': '保险',
  '转账红包': '转账',
  '公益': '公益',
  '其他': '其他',
};

function mapCategory(raw: string): string {
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(key)) return val;
  }
  return '其他';
}

function parseDate(raw: string): string | null {
  // 支付宝格式：2026-04-15 12:30:45 或 2026/04/15 12:30:45
  const m = raw.match(/(\d{4})[/-](\d{2})[/-](\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}
