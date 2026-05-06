/**
 * 银行导入器共享工具函数
 */

import type { ImportedTransaction, RawRecord } from './types';

/** 银行摘要关键词 → 分类映射 */
const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/餐饮|美团|饿了么|肯德基|麦当劳|星巴克|瑞幸|外卖/, '餐饮'],
  [/超市|便利店|沃尔玛|永辉|盒马|京东|淘宝|天猫|拼多多/, '购物'],
  [/滴滴|高德|地铁|公交|加油|停车|高速/, '交通'],
  [/房租|物业|水电|燃气|供暖/, '居住'],
  [/医院|药房|体检|保险/, '医疗'],
  [/电影|游戏|音乐|视频|健身|旅游/, '娱乐'],
  [/工资|薪酬|奖金|补贴/, '工资'],
  [/转账|汇款|还款/, '转账'],
  [/理财|基金|国债|存款/, '理财'],
  [/学费|培训|教育/, '教育'],
  [/话费|充值|流量/, '通讯'],
];

export function mapCategory(description: string): string {
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(description)) return category;
  }
  return '其他';
}

/** 内部交易过滤 */
export function isInternalTransaction(description: string): boolean {
  return [/转入|转出|冲正|退汇|手续费/].some(p => p.test(description));
}

export function parseDate(raw: string): string | null {
  const m = raw.match(/(\d{4})[/-]?(\d{2})[/-]?(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}
