/**
 * v1.3.0 AI 服务层
 * 
 * LLM 调用 + 缓存 + 用量控制
 * 支持 OpenAI 兼容 API（OpenAI / Claude / DeepSeek / 本地模型）
 */

import net from 'net';
import type { FinancialContext } from './aiPromptTemplates';

// ====== 类型定义 ======

export interface AIConfig {
  apiKey: string;
  baseUrl: string;   // e.g. https://api.openai.com/v1
  model: string;     // e.g. gpt-4o-mini, claude-3-haiku
  maxTokens: number;
  temperature: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
  cached: boolean;
}

interface CacheEntry {
  content: string;
  timestamp: number;
  usage: { promptTokens: number; completionTokens: number };
}

interface UsageRecord {
  date: string;     // YYYY-MM-DD
  count: number;
  tokens: number;
}

// ====== 默认配置 ======

const DEFAULT_CONFIG: AIConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  maxTokens: 1500,
  temperature: 0.7,
};

// ====== AI 服务 ======

class AIService {
  private config: AIConfig = { ...DEFAULT_CONFIG };
  private cache = new Map<string, CacheEntry>();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24h
  private usageHistory: UsageRecord[] = [];

  /**
   * 更新 AI 配置
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置（隐藏 API Key）
   */
  getConfig(): Omit<AIConfig, 'apiKey'> & { apiKeySet: boolean } {
    return {
      apiKeySet: this.config.apiKey.length > 0,
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };
  }

  /**
   * 发送聊天请求
   */
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    // 检查配置
    if (!this.config.apiKey) {
      return {
        content: '⚠️ AI 功能未配置。请在设置中填写 API Key。',
        cached: false,
      };
    }

    // 缓存检查
    const cacheKey = this.getCacheKey(messages);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return { content: cached.content, usage: cached.usage, cached: true };
    }

    try {
      // 调用 LLM API
      const result = await this.callLLM(messages);

      // 缓存结果
      this.cache.set(cacheKey, {
        content: result.content,
        timestamp: Date.now(),
        usage: result.usage!,
      });

      // 记录用量
      this.recordUsage(result.usage?.completionTokens ?? 0);

      return { ...result, cached: false };
    } catch (error: any) {
      return {
        content: `❌ AI 请求失败：${error.message || '未知错误'}。请检查网络连接和 API 配置。`,
        cached: false,
      };
    }
  }

  /**
   * 获取今日用量
   */
  getTodayUsage(): { count: number; tokens: number } {
    const today = new Date().toISOString().slice(0, 10);
    const record = this.usageHistory.find(r => r.date === today);
    return record ?? { count: 0, tokens: 0 };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ====== 私有方法 ======

  private async callLLM(messages: AIMessage[]): Promise<AIResponse> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;

    const body = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API 返回 ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json() as any;

    return {
      content: data.choices?.[0]?.message?.content ?? '（无回复）',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
      cached: false,
    };
  }

  private getCacheKey(messages: AIMessage[]): string {
    const raw = JSON.stringify(messages);
    // 简单 hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const chr = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString(36);
  }

  private recordUsage(tokens: number): void {
    const today = new Date().toISOString().slice(0, 10);
    const record = this.usageHistory.find(r => r.date === today);
    if (record) {
      record.count++;
      record.tokens += tokens;
    } else {
      this.usageHistory.push({ date: today, count: 1, tokens });
    }
    // 只保留最近 30 天
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    this.usageHistory = this.usageHistory.filter(r => r.date >= cutoffStr);
  }
}

// 单例
export const aiService = new AIService();
