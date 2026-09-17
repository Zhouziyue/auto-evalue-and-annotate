// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 模型定价
export interface ModelPricing {
  model: string;
  provider: string;
  inputPricePer1K: number;    // 每1K token 输入价格（美元）
  outputPricePer1K: number;   // 每1K token 输出价格（美元）
  currency: string;
}

// 使用记录
export interface UsageRecord {
  id: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  tags?: string[];
}

// 成本统计
export interface CostStats {
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  avgCostPerRequest: number;
  avgLatency: number;
  byModel: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
  byDay: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
}

// 预算告警
export interface BudgetAlert {
  id: string;
  name: string;
  threshold: number;
  currentSpend: number;
  percentage: number;
  triggered: boolean;
  period: 'daily' | 'weekly' | 'monthly';
}

// 默认模型定价（美元/1K tokens）
const DEFAULT_PRICING: ModelPricing[] = [
  { model: 'gpt-4', provider: 'openai', inputPricePer1K: 0.03, outputPricePer1K: 0.06, currency: 'USD' },
  { model: 'gpt-4-turbo', provider: 'openai', inputPricePer1K: 0.01, outputPricePer1K: 0.03, currency: 'USD' },
  { model: 'gpt-3.5-turbo', provider: 'openai', inputPricePer1K: 0.0005, outputPricePer1K: 0.0015, currency: 'USD' },
  { model: 'gpt-4o', provider: 'openai', inputPricePer1K: 0.005, outputPricePer1K: 0.015, currency: 'USD' },
  { model: 'gpt-4o-mini', provider: 'openai', inputPricePer1K: 0.00015, outputPricePer1K: 0.0006, currency: 'USD' },
  { model: 'qwen-plus', provider: 'dashscope', inputPricePer1K: 0.0008, outputPricePer1K: 0.002, currency: 'USD' },
  { model: 'qwen-turbo', provider: 'dashscope', inputPricePer1K: 0.0003, outputPricePer1K: 0.0006, currency: 'USD' },
  { model: 'qwen-max', provider: 'dashscope', inputPricePer1K: 0.004, outputPricePer1K: 0.012, currency: 'USD' },
  { model: 'claude-3-opus', provider: 'anthropic', inputPricePer1K: 0.015, outputPricePer1K: 0.075, currency: 'USD' },
  { model: 'claude-3-sonnet', provider: 'anthropic', inputPricePer1K: 0.003, outputPricePer1K: 0.015, currency: 'USD' },
  { model: 'claude-3-haiku', provider: 'anthropic', inputPricePer1K: 0.00025, outputPricePer1K: 0.00125, currency: 'USD' },
];

@Injectable()
export class CostTrackingService {
  private pricing: Map<string, ModelPricing> = new Map();
  private records: UsageRecord[] = [];
  private alerts: BudgetAlert[] = [];

  constructor(private prisma: PrismaService) {
    // 初始化默认定价
    for (const p of DEFAULT_PRICING) {
      this.pricing.set(`${p.provider}/${p.model}`, p);
    }
  }

  // 记录使用量
  async recordUsage(data: {
    model: string;
    provider?: string;
    promptTokens: number;
    completionTokens: number;
    latency?: number;
    userId?: string;
    sessionId?: string;
    traceId?: string;
    tags?: string[];
  }): Promise<UsageRecord> {
    const provider = data.provider || 'openai';
    const pricingKey = `${provider}/${data.model}`;
    const pricing = this.pricing.get(pricingKey);

    const inputCost = pricing
      ? (data.promptTokens / 1000) * pricing.inputPricePer1K
      : this.estimateCost(data.promptTokens, 'input');
    
    const outputCost = pricing
      ? (data.completionTokens / 1000) * pricing.outputPricePer1K
      : this.estimateCost(data.completionTokens, 'output');

    const record: UsageRecord = {
      id: `usage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      model: data.model,
      provider,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.promptTokens + data.completionTokens,
      cost: inputCost + outputCost,
      latency: data.latency || 0,
      timestamp: new Date(),
      userId: data.userId,
      sessionId: data.sessionId,
      traceId: data.traceId,
      tags: data.tags,
    };

    this.records.push(record);

    // 检查预算告警
    await this.checkBudgetAlerts();

    return record;
  }

  // 获取成本统计
  async getStats(options?: {
    since?: Date;
    until?: Date;
    model?: string;
    userId?: string;
  }): Promise<CostStats> {
    let filtered = [...this.records];

    if (options?.since) {
      filtered = filtered.filter(r => r.timestamp >= options.since);
    }
    if (options?.until) {
      filtered = filtered.filter(r => r.timestamp <= options.until);
    }
    if (options?.model) {
      filtered = filtered.filter(r => r.model === options.model);
    }
    if (options?.userId) {
      filtered = filtered.filter(r => r.userId === options.userId);
    }

    const totalCost = filtered.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = filtered.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalInputTokens = filtered.reduce((sum, r) => sum + r.promptTokens, 0);
    const totalOutputTokens = filtered.reduce((sum, r) => sum + r.completionTokens, 0);
    const totalRequests = filtered.length;
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgLatency = totalRequests > 0
      ? filtered.reduce((sum, r) => sum + r.latency, 0) / totalRequests
      : 0;

    // 按模型分组
    const byModel: Record<string, { cost: number; tokens: number; requests: number }> = {};
    for (const r of filtered) {
      if (!byModel[r.model]) {
        byModel[r.model] = { cost: 0, tokens: 0, requests: 0 };
      }
      byModel[r.model].cost += r.cost;
      byModel[r.model].tokens += r.totalTokens;
      byModel[r.model].requests += 1;
    }

    // 按天分组
    const byDay: Record<string, { cost: number; tokens: number; requests: number }> = {};
    for (const r of filtered) {
      const day = r.timestamp.toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = { cost: 0, tokens: 0, requests: 0 };
      }
      byDay[day].cost += r.cost;
      byDay[day].tokens += r.totalTokens;
      byDay[day].requests += 1;
    }

    return {
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalRequests,
      avgCostPerRequest,
      avgLatency,
      byModel,
      byDay,
    };
  }

  // 获取使用记录
  async getRecords(options?: {
    since?: Date;
    model?: string;
    limit?: number;
  }): Promise<UsageRecord[]> {
    let filtered = [...this.records];

    if (options?.since) {
      filtered = filtered.filter(r => r.timestamp >= options.since);
    }
    if (options?.model) {
      filtered = filtered.filter(r => r.model === options.model);
    }

    // 按时间倒序
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // 获取模型定价
  getPricing(): ModelPricing[] {
    return Array.from(this.pricing.values());
  }

  // 添加/更新模型定价
  setPricing(pricing: ModelPricing): void {
    const key = `${pricing.provider}/${pricing.model}`;
    this.pricing.set(key, pricing);
  }

  // 计算指定模型的成本
  estimateCostForModel(model: string, provider: string, promptTokens: number, completionTokens: number): number {
    const key = `${provider}/${model}`;
    const pricing = this.pricing.get(key);
    
    if (!pricing) return 0;
    
    return (promptTokens / 1000) * pricing.inputPricePer1K +
           (completionTokens / 1000) * pricing.outputPricePer1K;
  }

  // 创建预算告警
  createBudgetAlert(alert: Omit<BudgetAlert, 'id' | 'currentSpend' | 'percentage' | 'triggered'>): BudgetAlert {
    const newAlert: BudgetAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      currentSpend: 0,
      percentage: 0,
      triggered: false,
    };
    this.alerts.push(newAlert);
    return newAlert;
  }

  // 获取预算告警
  getBudgetAlerts(): BudgetAlert[] {
    return this.alerts;
  }

  // 检查预算告警
  private async checkBudgetAlerts(): Promise<void> {
    const now = new Date();
    
    for (const alert of this.alerts) {
      let periodStart: Date;
      switch (alert.period) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          periodStart = new Date(0);
      }

      const periodRecords = this.records.filter(r => r.timestamp >= periodStart);
      alert.currentSpend = periodRecords.reduce((sum, r) => sum + r.cost, 0);
      alert.percentage = (alert.currentSpend / alert.threshold) * 100;
      alert.triggered = alert.currentSpend >= alert.threshold;
    }
  }

  // 估算成本（无定价信息时）
  private estimateCost(tokens: number, type: 'input' | 'output'): number {
    // 默认使用 GPT-3.5 的价格作为估算
    const defaultPrice = type === 'input' ? 0.0005 : 0.0015;
    return (tokens / 1000) * defaultPrice;
  }

  // 获取成本预测
  async getCostPrediction(model: string, provider: string, estimatedMonthlyTokens: number): Promise<{
    estimatedCost: number;
    breakdown: {
      inputCost: number;
      outputCost: number;
    };
    recommendations: string[];
  }> {
    const key = `${provider}/${model}`;
    const pricing = this.pricing.get(key);

    // 假设输入输出比例为 3:1
    const inputTokens = estimatedMonthlyTokens * 0.75;
    const outputTokens = estimatedMonthlyTokens * 0.25;

    let inputCost: number;
    let outputCost: number;

    if (pricing) {
      inputCost = (inputTokens / 1000) * pricing.inputPricePer1K;
      outputCost = (outputTokens / 1000) * pricing.outputPricePer1K;
    } else {
      inputCost = this.estimateCost(inputTokens, 'input');
      outputCost = this.estimateCost(outputTokens, 'output');
    }

    const recommendations: string[] = [];
    
    // 生成优化建议
    if (inputCost + outputCost > 100) {
      recommendations.push('考虑使用更经济的模型，如 GPT-4o-mini 或 Qwen-Turbo');
    }
    if (inputTokens > outputTokens * 5) {
      recommendations.push('输入 token 占比较高，建议优化 Prompt 长度或使用缓存');
    }
    recommendations.push('启用 Prompt 缓存可以减少重复输入的成本');
    recommendations.push('批量处理请求通常比逐个请求更经济');

    return {
      estimatedCost: inputCost + outputCost,
      breakdown: { inputCost, outputCost },
      recommendations,
    };
  }
}
