/**
 * 导入器入口 - 自动识别来源、解析、执行导入
 */

import fs from 'fs';
import path from 'path';
import type { SourceDetection, ImportPreview, ImportedTransaction, RawRecord, Importer } from './types';
import { alipayImporter } from './alipay';
import { wechatImporter } from './wechat';
import { genericImporter } from './csv-generic';
import { cmbImporter } from './cmb';
import { icbcImporter } from './icbc';

const IMPORTERS: Importer[] = [alipayImporter, wechatImporter, cmbImporter, icbcImporter, genericImporter];

/**
 * 读取 CSV 文件（自动处理编码和头部）
 */
export function readCSV(filePath: string): { headers: string[]; rows: RawRecord[] } {
  let content = tryReadFile(filePath);
  
  // 支付宝 CSV 前几行是头部信息，找到真正的列标题行
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  
  // 尝试找标题行（包含多个逗号的行）
  let headerIdx = 0;
  let maxCommas = 0;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const commas = (lines[i].match(/,/g) || []).length;
    if (commas > maxCommas) {
      maxCommas = commas;
      headerIdx = i;
    }
  }

  const headers = parseCSVLine(lines[headerIdx]);
  const rows: RawRecord[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 跳过支付宝的统计行
    if (line.startsWith('共') || line.startsWith('---') || line.startsWith('导出')) continue;

    const values = parseCSVLine(line);
    if (values.length < headers.length - 1) continue; // 跳过不完整的行

    const record: RawRecord = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j].trim()] = (values[j] || '').trim();
    }
    rows.push(record);
  }

  return { headers, rows };
}

/**
 * 检测文件来源
 */
export function detectSource(filePath: string, headers: string[]): SourceDetection {
  const ext = path.extname(filePath).toLowerCase();
  
  let bestSource: SourceDetection = { source: 'generic', confidence: 0, encoding: 'utf-8', name: '通用CSV' };
  
  for (const importer of IMPORTERS) {
    const confidence = importer.detect(headers, []);
    if (confidence > bestSource.confidence) {
      bestSource = {
        source: importer === alipayImporter ? 'alipay' : importer === wechatImporter ? 'wechat' : importer === cmbImporter ? 'cmb' : importer === icbcImporter ? 'icbc' : 'generic',
        confidence,
        encoding: 'utf-8',
        name: importer.name,
      };
    }
  }

  return bestSource;
}

/**
 * 预览导入
 */
export function previewImport(filePath: string): ImportPreview {
  const { headers, rows } = readCSV(filePath);
  const source = detectSource(filePath, headers);
  
  // 选择最佳导入器
  const importer = IMPORTERS.find(imp => {
    const s = imp === alipayImporter ? 'alipay' : imp === wechatImporter ? 'wechat' : 'generic';
    return s === source.source;
  }) || genericImporter;

  const parsed = importer.parse(rows);
  const valid = parsed.filter(t => t.date && t.amount > 0);
  const errors: string[] = [];
  
  if (valid.length < parsed.length) {
    errors.push(`${parsed.length - valid.length} 条记录格式异常已跳过`);
  }

  const incomeTotal = valid.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = valid.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const dates = valid.map(t => t.date).sort();
  
  return {
    source,
    totalRows: rows.length,
    parsed: valid.slice(0, 20), // 预览前20条
    skipped: rows.length - valid.length,
    errors,
    dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : { start: '', end: '' },
    incomeTotal,
    expenseTotal,
  };
}

/**
 * 解析 CSV 行（处理引号内的逗号）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * 尝试读取文件（UTF-8 优先，回退 GBK）
 */
function tryReadFile(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  
  // 尝试 UTF-8
  try {
    const content = buf.toString('utf-8');
    // 检查是否有乱码（简单检测）
    if (!content.includes('')) {
      return content;
    }
  } catch { /* fall through */ }

  // 回退 GBK（使用 TextDecoder）
  try {
    const decoder = new TextDecoder('gbk');
    return decoder.decode(buf);
  } catch { /* fall through */ }

  return buf.toString('utf-8');
}
