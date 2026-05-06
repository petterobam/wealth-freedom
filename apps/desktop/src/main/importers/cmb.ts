/**
 * 招商银行 CSV 导入器
 *
 * 招商银行导出格式（交易明细CSV）：
 * - 编码: GBK/UTF-8（自动检测）
 * - 前 N 行为账户信息头部，空行后为列标题行
 * - 关键列：交易日期, 交易摘要, 金额, 余额, 收/支方向
 *
 * 常见列名变体：
 *   交易日期 / 记账日期
 *   交易摘要 / 摘要 / 交易类型
 *   交易金额 / 金额 / 发生额
 *   账户余额 / 余额
 *   收入金额 / 支出金额（分开列）
 *   对方账户名 / 交易对方 / 对方信息
 */

import type { Importer, ImportedTransaction, RawRecord } from './types';
import { parseDate, mapCategory, isInternalTransaction } from './bank-utils';

export const cmbImporter: Importer = {
  name: '招商银行',

  detect(headers: string[]): number {
    const headerStr = headers.join(',');
    // 招行特征列名
    const hits = ['招商银行', '交易日期', '交易摘要', '交易金额', '发生额', '收入金额', '支出金额', '账户余额']
      .filter(h => headerStr.includes(h));
    if (hits.length >= 3) return 0.9;
    if (hits.length >= 2) return 0.6;
    // 通用银行格式：日期+摘要+金额+余额
    const generic = ['交易日期', '记账日期'].filter(h => headerStr.includes(h)).length
      + ['交易摘要', '摘要'].filter(h => headerStr.includes(h)).length
      + ['交易金额', '金额', '发生额'].filter(h => headerStr.includes(h)).length;
    if (generic >= 2) return 0.3;
    return 0;
  },

  parse(rows: RawRecord[]): ImportedTransaction[] {
    const result: ImportedTransaction[] = [];

    for (const row of rows) {
      try {
        const date = parseDate(
          row['交易日期'] || row['记账日期'] || row['日期'] || ''
        );
        if (!date) continue;

        // 方式1: 统一金额列 + 方向列
        // 方式2: 收入/支出分开列
        let amount = 0;
        let type: 'income' | 'expense' | 'transfer' = 'expense';

        const incomeStr = (row['收入金额'] || row['收入'] || row['贷方发生额'] || '').replace(/[,，\s]/g, '');
        const expenseStr = (row['支出金额'] || row['支出'] || row['借方发生额'] || '').replace(/[,，\s]/g, '');

        if (incomeStr && parseFloat(incomeStr) > 0) {
          amount = parseFloat(incomeStr);
          type = 'income';
        } else if (expenseStr && parseFloat(expenseStr) > 0) {
          amount = parseFloat(expenseStr);
          type = 'expense';
        } else {
          // 统一金额列
          const amountStr = (row['交易金额'] || row['金额'] || row['发生额'] || '').replace(/[,，\s]/g, '');
          amount = Math.abs(parseFloat(amountStr));
          if (isNaN(amount) || amount <= 0) continue;

          // 判断方向
          const direction = (row['收/支方向'] || row['收/支'] || row['方向'] || '').trim();
          const amountRaw = parseFloat(amountStr);
          if (direction.includes('收入') || direction.includes('贷') || amountRaw > 0) {
            type = 'income';
          } else if (direction.includes('支出') || direction.includes('借') || amountRaw < 0) {
            type = 'expense';
          }
          // 无方向标记则默认expense（银行明细通常支出更多）
        }

        if (amount <= 0) continue;

        const description = (
          row['交易摘要'] || row['摘要'] || row['交易类型'] || row['备注'] || ''
        ).trim();

        const counterparty = (
          row['对方账户名'] || row['交易对方'] || row['对方信息'] || row['对方户名'] || ''
        ).trim();

        const category = mapCategory(description);

        // 过滤掉内部转账（余额变动、结息等）
        if (isInternalTransaction(description)) {
          // 但结息保留为收入
          if (description.includes('结息') || description.includes('利息')) {
            type = 'income';
          } else {
            continue;
          }
        }

        result.push({
          date,
          type,
          category,
          amount,
          description: description || category,
          counterparty: counterparty || undefined,
          tags: ['招商银行'],
        });
      } catch {
        // skip malformed rows
      }
    }

    return result;
  },
};

// 共享工具函数已提取到 bank-utils.ts
