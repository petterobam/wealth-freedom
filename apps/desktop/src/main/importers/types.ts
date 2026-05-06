/**
 * 导入器共享类型定义
 */

/** 原始解析记录 */
export interface RawRecord {
  [key: string]: string;
}

/** 标准化交易记录 */
export interface ImportedTransaction {
  date: string;        // YYYY-MM-DD
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  description: string;
  counterparty?: string; // 交易对方
  tags?: string[];
}

/** 来源检测结果 */
export interface SourceDetection {
  source: 'alipay' | 'wechat' | 'cmb' | 'icbc' | 'generic';
  confidence: number;  // 0-1
  encoding: string;    // utf-8, gbk
  name: string;        // 显示名
}

/** 预览结果 */
export interface ImportPreview {
  source: SourceDetection;
  totalRows: number;
  parsed: ImportedTransaction[];
  skipped: number;
  errors: string[];
  dateRange: { start: string; end: string };
  incomeTotal: number;
  expenseTotal: number;
}

/** 导入结果 */
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** 导入器接口 */
export interface Importer {
  name: string;
  detect(headers: string[], sampleRows: RawRecord[]): number; // 0-1 confidence
  parse(rows: RawRecord[]): ImportedTransaction[];
}
