/**
 * v1.3.0 AI IPC 处理程序
 * 
 * 注册 ai 命名空间到 ipcMain
 * 桥接 AI 服务层与渲染进程
 */

import { ipcMain } from 'electron';
import { aiService } from './aiService';
import {
  SPENDING_ANALYSIS_PROMPT,
  SAVINGS_PLAN_PROMPT,
  INVESTMENT_ADVICE_PROMPT,
  CHAT_PROMPT,
  generateQuickTips,
  type FinancialContext,
} from './aiPromptTemplates';
import { naturalLanguageQuery, getQuickQueries, type NLQueryDataContext } from './nlQueryEngine';
import { checkLimit } from './license';

/**
 * 初始化 AI 相关 IPC 处理程序
 */
export function initAIHandlers(db: any): void {

  // ====== 配置管理 ======

  ipcMain.handle('ai:getConfig', () => {
    return aiService.getConfig();
  });

  ipcMain.handle('ai:updateConfig', (_event, config: any) => {
    aiService.updateConfig(config);
    return { success: true };
  });

  // ====== 快速建议（本地规则引擎，无需 LLM） ======

  ipcMain.handle('ai:quickTips', (_event, ctx: FinancialContext) => {
    return generateQuickTips(ctx);
  });

  // ====== 智能支出分析 ======

  ipcMain.handle('ai:analyzeSpending', async (_event, ctx: FinancialContext) => {
    const limited = checkLimit('aiCalls');
    if (!limited.allowed) {
      return { content: '⚠️ AI 功能需要升级到基础版或旗舰版。', cached: false };
    }

    const prompt = SPENDING_ANALYSIS_PROMPT(ctx);
    return aiService.chat([{ role: 'user', content: prompt }]);
  });

  // ====== 储蓄目标规划 ======

  ipcMain.handle('ai:savingsPlan', async (_event, ctx: FinancialContext, targetAmount: number, targetDate?: string) => {
    const limited = checkLimit('aiCalls');
    if (!limited.allowed) {
      return { content: '⚠️ AI 功能需要升级到基础版或旗舰版。', cached: false };
    }

    const prompt = SAVINGS_PLAN_PROMPT(ctx, targetAmount, targetDate);
    return aiService.chat([{ role: 'user', content: prompt }]);
  });

  // ====== 投资组合建议 ======

  ipcMain.handle('ai:investmentAdvice', async (_event, ctx: FinancialContext, holdings: any[], riskLevel: string) => {
    const limited = checkLimit('aiCalls');
    if (!limited.allowed) {
      return { content: '⚠️ AI 功能需要升级到基础版或旗舰版。', cached: false };
    }

    const prompt = INVESTMENT_ADVICE_PROMPT(ctx, holdings, riskLevel);
    return aiService.chat([{ role: 'user', content: prompt }]);
  });

  // ====== 自由问答 ======

  ipcMain.handle('ai:chat', async (_event, ctx: FinancialContext, question: string, history: any[]) => {
    const limited = checkLimit('aiCalls');
    if (!limited.allowed) {
      return { content: '⚠️ AI 功能需要升级到基础版或旗舰版。', cached: false };
    }

    const prompt = CHAT_PROMPT(ctx, question, history);
    const messages = [
      { role: 'system' as const, content: '你是财富自由之路 App 的 AI 财务助手。' },
      { role: 'user' as const, content: prompt },
    ];
    return aiService.chat(messages);
  });

  // ====== 用量统计 ======

  ipcMain.handle('ai:usage', () => {
    return aiService.getTodayUsage();
  });

  // ====== 自然语言查询（本地规则引擎，无需 API Key） ======

  ipcMain.handle('ai:naturalQuery', async (_event, query: string) => {
    // 收集财务数据上下文
    const [accounts, debts, transactions, goals, investments] = await Promise.all([
      db.prepare('SELECT * FROM accounts').all().catch(() => []),
      db.prepare('SELECT * FROM debts').all().catch(() => []),
      db.prepare('SELECT * FROM transactions').all().catch(() => []),
      db.prepare('SELECT * FROM goals').all().catch(() => []),
      db.prepare('SELECT * FROM investments').all().catch(() => []),
    ]);

    const ctx: NLQueryDataContext = {
      transactions: transactions || [],
      accounts: accounts || [],
      debts: debts || [],
      goals: goals || [],
      investments: investments || [],
    };

    return naturalLanguageQuery(query, ctx);
  });

  ipcMain.handle('ai:quickQueries', () => {
    return getQuickQueries();
  });

  // ====== 缓存管理 ======

  ipcMain.handle('ai:clearCache', () => {
    aiService.clearCache();
    return { success: true };
  });
}
