/**
 * 微信支付 CSV 导入器
 * 
 * 微信导出格式：
 * 关键列：交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态
 */

import type { Importer, ImportedTransaction, RawRecord } from './types';

export const wechatImporter: Importer = {
  name: '微信支付',

  detect(headers: string[]): number {
    const headerStr = headers.join(',');
    const hits = ['交易时间', '交易对方', '收/支', '金额(元)', '当前状态'].filter(h => headerStr.includes(h));
    return hits.length >= 3 ? 0.85 : hits.length >= 2 ? 0.4 : 0;
  },

  parse(rows: RawRecord[]): ImportedTransaction[] {
    const result: ImportedTransaction[] = [];

    for (const row of rows) {
      try {
        const date = parseDate(row['交易时间'] || '');
        if (!date) continue;

        const direction = (row['收/支'] || '').trim();
        if (!direction || direction === '/') continue;

        const amountStr = (row['金额(元)'] || row['金额'] || '').replace(/[¥¥,\s]/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) continue;

        // 微信状态：支付成功, 已转账, 已收款 等
        const status = (row['当前状态'] || '').trim();
        if (status.includes('已退款') || status.includes('已关闭')) continue;

        const type = direction === '收入' ? 'income' : direction === '支出' ? 'expense' : 'transfer';
        const category = mapWechatType(row['交易类型'] || '');
        const description = (row['商品'] || '').trim();
        const counterparty = (row['交易对方'] || '').trim();

        result.push({
          date,
          type,
          category,
          amount,
          description: description || category,
          counterparty: counterparty || undefined,
          tags: ['微信'],
        });
      } catch {
        // skip
      }
    }

    return result;
  },
};

function mapWechatType(type: string): string {
  const map: Record<string, string> = {
    '商户消费': '购物',
    '扫二维码付款': '购物',
    '转账': '转账',
    '红包': '转账',
    '信用卡还款': '还贷',
    '生活缴费': '水电',
    '面对面收款': '转账',
    '群收款': '转账',
  };
  for (const [key, val] of Object.entries(map)) {
    if (type.includes(key)) return val;
  }
  return '其他';
}

function parseDate(raw: string): string | null {
  const m = raw.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}
