// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// LLM 调用记录
export interface LLMCallRecord {
  id: string;
  model: string;
  provider: string;
  timestamp: Date;
  latency: number;              // 毫秒
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;                 // 美元
  temperature: number;
  maxTokens: number;
  status: 'success' | 'error';
  errorMessage?: string;
  traceId?: string;
  sessionId?: string;
  userId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 可观测性统计
export interface ObservabilityStats {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  errorRate: number;
  modelBreakdown: {
    model: string;
    calls: number;
    tokens: number;
    cost: number;
    avgLatency: number;
  }[];
  hourlyDistribution: {
    hour: string;
    calls: number;
    tokens: number;
    cost: number;
  }[];
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

// 告警规则
export interface AlertRule {
  id: string;
  name: string;
  metric: 'latency' | 'error_rate' | 'cost' | 'tokens';
  threshold: number;
  operator: '>' | '<' | '>=' | '<=';
  windowMinutes: number;
  enabled: boolean;
  lastTriggeredAt?: Date;
}

// 告警事件
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  triggeredAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// 模型成本配置（每 1K token 价格）
const MODEL_COSTS: Record<string, { prompt: number; completion: number }> = {
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'qwen-plus': { prompt: 0.0008, completion: 0.002 },
  'qwen-turbo': { prompt: 0.0003, completion: 0.0006 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
};

@Injectable()
export class ObservabilityService {
  constructor(private prisma: PrismaService) {}

  // 记录 LLM 调用
  async recordLLMCall(data: {
    model: string;
    provider?: string;
    latency: number;
    promptTokens: number;
    completionTokens: number;
    temperature?: number;
    maxTokens?: number;
    status: 'success' | 'error';
    errorMessage?: string;
    traceId?: string;
    sessionId?: string;
    userId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<LLMCallRecord> {
    const totalTokens = data.promptTokens + data.completionTokens;
    const cost = this.calculateCost(data.model, data.promptTokens, data.completionTokens);

    const record: LLMCallRecord = {
      id: `llm_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      model: data.model,
      provider: data.provider || this.getProvider(data.model),
      timestamp: new Date(),
      latency: data.latency,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens,
      cost,
      temperature: data.temperature || 0.7,
      maxTokens: data.maxTokens || 4096,
      status: data.status,
      errorMessage: data.errorMessage,
      traceId: data.traceId,
      sessionId: data.sessionId,
      userId: data.userId,
      tags: data.tags || [],
      metadata: data.metadata || {},
    };

    // 存储到数据库
    await this.prisma.evalRun.create({
      data: {
        id: record.id,
        status: data.status === 'success' ? 'completed' : 'failed',
        totalCases: totalTokens,
        passedCases: data.promptTokens,
        failedCases: data.completionTokens,
        metadata: JSON.stringify(record),
      },
    });

    // 检查是否触发告警
    await this.checkAlerts(record);

    return record;
  }

  // 计算成本
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = MODEL_COSTS[model] || { prompt: 0.001, completion: 0.002 };
    return (promptTokens / 1000 * costs.prompt) + (completionTokens / 1000 * costs.completion);
  }

  // 获取提供商
  private getProvider(model: string): string {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('qwen-')) return 'dashscope';
    return 'unknown';
  }

  // 获取可观测性统计
  async getStats(options?: {
    hours?: number;
    model?: string;
    sessionId?: string;
  }): Promise<ObservabilityStats> {
    const hours = options?.hours || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // 获取所有相关记录
    const records = await this.getRecords({ since, model: options?.model, sessionId: options?.sessionId });

    if (records.length === 0) {
      return {
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        avgLatency: 0,
        errorRate: 0,
        modelBreakdown: [],
        hourlyDistribution: [],
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
      };
    }

    // 基础统计
    const totalCalls = records.length;
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const avgLatency = records.reduce((sum, r) => sum + r.latency, 0) / totalCalls;
    const errorRate = records.filter(r => r.status === 'error').length / totalCalls;

    // 延迟百分位
    const latencies = records.map(r => r.latency).sort((a, b) => a - b);
    const p50Latency = latencies[Math.floor(latencies.length * 0.5)];
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)];

    // 按模型分组
    const modelMap = new Map<string, { calls: number; tokens: number; cost: number; latencies: number[] }>();
    for (const r of records) {
      if (!modelMap.has(r.model)) {
        modelMap.set(r.model, { calls: 0, tokens: 0, cost: 0, latencies: [] });
      }
      const data = modelMap.get(r.model)!;
      data.calls++;
      data.tokens += r.totalTokens;
      data.cost += r.cost;
      data.latencies.push(r.latency);
    }

    const modelBreakdown = Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      calls: data.calls,
      tokens: data.tokens,
      cost: data.cost,
      avgLatency: data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length,
    }));

    // 按小时分布
    const hourMap = new Map<string, { calls: number; tokens: number; cost: number }>();
    for (const r of records) {
      const hour = new Date(r.timestamp).toISOString().slice(0, 13);
      if (!hourMap.has(hour)) {
        hourMap.set(hour, { calls: 0, tokens: 0, cost: 0 });
      }
      const data = hourMap.get(hour)!;
      data.calls++;
      data.tokens += r.totalTokens;
      data.cost += r.cost;
    }

    const hourlyDistribution = Array.from(hourMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      totalCalls,
      totalTokens,
      totalCost,
      avgLatency,
      errorRate,
      modelBreakdown,
      hourlyDistribution,
      p50Latency,
      p95Latency,
      p99Latency,
    };
  }

  // 获取调用记录
  async getRecords(options?: {
    since?: Date;
    model?: string;
    sessionId?: string;
    limit?: number;
  }): Promise<LLMCallRecord[]> {
    const where: any = {};
    
    if (options?.since) {
      where.createdAt = { gte: options.since };
    }

    const evalRuns = await this.prisma.evalRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 1000,
    });

    const records: LLMCallRecord[] = [];
    for (const run of evalRuns) {
      const metadata = JSON.parse(run.metadata || '{}');
      if (!metadata.model) continue;
      
      if (options?.model && metadata.model !== options.model) continue;
      if (options?.sessionId && metadata.sessionId !== options.sessionId) continue;

      records.push(metadata as LLMCallRecord);
    }

    return records;
  }

  // 检查告警
  private async checkAlerts(record: LLMCallRecord): Promise<void> {
    // 获取启用的告警规则
    const rules = await this.getActiveAlertRules();
    
    for (const rule of rules) {
      const recentRecords = await this.getRecords({
        since: new Date(Date.now() - rule.windowMinutes * 60 * 1000),
      });

      let value = 0;
      switch (rule.metric) {
        case 'latency':
          value = recentRecords.reduce((sum, r) => sum + r.latency, 0) / recentRecords.length;
          break;
        case 'error_rate':
          value = recentRecords.filter(r => r.status === 'error').length / recentRecords.length * 100;
          break;
        case 'cost':
          value = recentRecords.reduce((sum, r) => sum + r.cost, 0);
          break;
        case 'tokens':
          value = recentRecords.reduce((sum, r) => sum + r.totalTokens, 0);
          break;
      }

      const triggered = this.evaluateCondition(value, rule.operator, rule.threshold);
      if (triggered) {
        await this.createAlertEvent(rule, value);
      }
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      default: return false;
    }
  }

  // 获取启用的告警规则（简化版，实际应存储在数据库）
  private async getActiveAlertRules(): Promise<AlertRule[]> {
    return [
      {
        id: 'rule_1',
        name: '高延迟告警',
        metric: 'latency',
        threshold: 10000,
        operator: '>',
        windowMinutes: 5,
        enabled: true,
      },
      {
        id: 'rule_2',
        name: '高错误率告警',
        metric: 'error_rate',
        threshold: 10,
        operator: '>',
        windowMinutes: 5,
        enabled: true,
      },
    ];
  }

  // 创建告警事件
  private async createAlertEvent(rule: AlertRule, value: number): Promise<void> {
    console.warn(`[ALERT] ${rule.name}: ${rule.metric} = ${value} (${rule.operator} ${rule.threshold})`);
    // 实际应存储到数据库
  }
}
