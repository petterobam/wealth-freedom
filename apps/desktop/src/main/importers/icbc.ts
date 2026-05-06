/**
 * 工商银行 CSV 导入器
 *
 * 工行导出格式（账户历史明细）：
 * - 编码: GBK 常见
 * - 关键列：交易日期, 摘要, 发生额, 余额, 对方户名
 * - 金额方向：贷方（收入）正数，借方（支出）负数，或分列
 */

import type { Importer, ImportedTransaction, RawRecord } from './types';
import { parseDate, mapCategory, isInternalTransaction } from './bank-utils';

export const icbcImporter: Importer = {
  name: '工商银行',

  detect(headers: string[]): number {
    const headerStr = headers.join(',');
    const hits = ['中国工商银行', '工行', '发生额', '对方户名', '凭证号', '摘要'].filter(h => headerStr.includes(h));
    if (hits.length >= 3) return 0.9;
    if (hits.length >= 2) return 0.5;
    return 0;
  },

  parse(rows: RawRecord[]): ImportedTransaction[] {
    const result: ImportedTransaction[] = [];

    for (const row of rows) {
      try {
        const date = parseDate(row['交易日期'] || row['记账日期'] || row['日期'] || '');
        if (!date) continue;

        let amount = 0;
        let type: 'income' | 'expense' | 'transfer' = 'expense';

        // 工行通常用 发生额 统一列（正=收入，负=支出）
        const amountStr = (row['发生额'] || row['交易金额'] || row['金额'] || '').replace(/[,，\s]/g, '');
        const amountRaw = parseFloat(amountStr);
        if (isNaN(amountRaw) || amountRaw === 0) continue;

        amount = Math.abs(amountRaw);
        type = amountRaw > 0 ? 'income' : 'expense';

        // 也可能分列
        const creditStr = (row['贷方发生额'] || row['收入'] || '').replace(/[,，\s]/g, '');
        const debitStr = (row['借方发生额'] || row['支出'] || '').replace(/[,，\s]/g, '');
        if (creditStr && parseFloat(creditStr) > 0) {
          amount = parseFloat(creditStr);
          type = 'income';
        } else if (debitStr && parseFloat(debitStr) > 0) {
          amount = parseFloat(debitStr);
          type = 'expense';
        }

        if (amount <= 0) continue;

        const description = (row['摘要'] || row['交易摘要'] || row['备注'] || '').trim();
        const counterparty = (row['对方户名'] || row['对方账户名'] || row['对方信息'] || '').trim();

        if (isInternalTransaction(description)) continue;

        result.push({
          date,
          type,
          category: mapCategory(description),
          amount,
          description: description || '其他',
          counterparty: counterparty || undefined,
          tags: ['工商银行'],
        });
      } catch {
        // skip
      }
    }

    return result;
  },
};
