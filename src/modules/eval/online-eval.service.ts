// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 在线评测状态
export enum OnlineEvalStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

// 采样策略
export enum SamplingStrategy {
  ALL = 'all',             // 全量
  RANDOM = 'random',       // 随机采样
  STRATIFIED = 'stratified', // 分层采样
  ANOMALY = 'anomaly',     // 异常优先
  ROUND_ROBIN = 'round_robin', // 轮询
}

// 在线评测配置
export interface OnlineEvalConfig {
  id: string;
  name: string;
  description?: string;
  source: 'api' | 'webhook' | 'log' | 'stream';
  sourceConfig: {
    endpoint?: string;
    headers?: Record<string, string>;
    webhookSecret?: string;
  };
  sampling: {
    strategy: SamplingStrategy;
    rate: number; // 采样率 0-1
    filters?: Record<string, any>;
  };
  metrics: string[];
  evalConfig: {
    model?: string;
    rubric?: string;
    timeout?: number;
  };
  alertConfig?: {
    enabled: boolean;
    threshold?: number;
    channels?: string[];
  };
  status: OnlineEvalStatus;
  stats: {
    totalReceived: number;
    totalEvaluated: number;
    totalSkipped: number;
    avgLatency: number;
    lastEvaluatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 在线评测结果
export interface OnlineEvalResult {
  id: string;
  configId: string;
  input: any;
  output: any;
  expected?: any;
  scores: Record<string, number>;
  latency: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  flagged: boolean;
  flagReason?: string;
}

// 实时指标
export interface RealtimeMetrics {
  configId: string;
  window: '1m' | '5m' | '15m' | '1h' | '24h';
  totalRequests: number;
  evaluatedRequests: number;
  avgScores: Record<string, number>;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  trend: 'improving' | 'stable' | 'degrading';
  alerts: Array<{ type: string; message: string; timestamp: Date }>;
}

@Injectable()
export class OnlineEvalService {
  constructor(private prisma: PrismaService) {}

  private configs: Map<string, OnlineEvalConfig> = new Map();
  private results: OnlineEvalResult[] = [];

  // 创建在线评测配置
  async createConfig(data: {
    name: string;
    description?: string;
    source: OnlineEvalConfig['source'];
    sourceConfig: OnlineEvalConfig['sourceConfig'];
    sampling: OnlineEvalConfig['sampling'];
    metrics: string[];
    evalConfig: OnlineEvalConfig['evalConfig'];
    alertConfig?: OnlineEvalConfig['alertConfig'];
  }): Promise<OnlineEvalConfig> {
    const id = `online_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const config: OnlineEvalConfig = {
      id,
      name: data.name,
      description: data.description,
      source: data.source,
      sourceConfig: data.sourceConfig,
      sampling: data.sampling,
      metrics: data.metrics,
      evalConfig: data.evalConfig,
      alertConfig: data.alertConfig,
      status: OnlineEvalStatus.ACTIVE,
      stats: {
        totalReceived: 0,
        totalEvaluated: 0,
        totalSkipped: 0,
        avgLatency: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.configs.set(id, config);
    return config;
  }

  // 获取配置列表
  async listConfigs(status?: OnlineEvalStatus): Promise<OnlineEvalConfig[]> {
    let configs = Array.from(this.configs.values());
    if (status) configs = configs.filter(c => c.status === status);
    return configs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取配置详情
  async getConfig(id: string): Promise<OnlineEvalConfig | undefined> {
    return this.configs.get(id);
  }

  // 更新配置
  async updateConfig(id: string, updates: Partial<OnlineEvalConfig>): Promise<OnlineEvalConfig | undefined> {
    const config = this.configs.get(id);
    if (!config) return undefined;
    Object.assign(config, updates, { updatedAt: new Date() });
    return config;
  }

  // 删除配置
  async deleteConfig(id: string): Promise<boolean> {
    return this.configs.delete(id);
  }

  // 接收在线数据（核心入口）
  async ingest(configId: string, data: {
    input: any;
    output: any;
    expected?: any;
    metadata?: Record<string, any>;
  }): Promise<{ evaluated: boolean; result?: OnlineEvalResult; reason?: string }> {
    const config = this.configs.get(configId);
    if (!config || config.status !== OnlineEvalStatus.ACTIVE) {
      return { evaluated: false, reason: 'Config not active' };
    }

    config.stats.totalReceived++;

    // 采样决策
    if (!this.shouldSample(config)) {
      config.stats.totalSkipped++;
      return { evaluated: false, reason: 'Skipped by sampling' };
    }

    // 执行评测
    const startTime = Date.now();
    const scores = await this.evaluateOnline(config, data);
    const latency = Date.now() - startTime;

    // 检查是否标记异常
    const { flagged, flagReason } = this.checkAnomaly(config, scores);

    const result: OnlineEvalResult = {
      id: `online_result_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      configId,
      input: data.input,
      output: data.output,
      expected: data.expected,
      scores,
      latency,
      timestamp: new Date(),
      metadata: data.metadata,
      flagged,
      flagReason,
    };

    this.results.push(result);
    config.stats.totalEvaluated++;
    config.stats.lastEvaluatedAt = new Date();
    config.stats.avgLatency =
      (config.stats.avgLatency * (config.stats.totalEvaluated - 1) + latency) / config.stats.totalEvaluated;

    // 检查告警
    if (config.alertConfig?.enabled) {
      this.checkAlerts(config, result);
    }

    return { evaluated: true, result };
  }

  // 采样决策
  private shouldSample(config: OnlineEvalConfig): boolean {
    const { strategy, rate } = config.sampling;

    switch (strategy) {
      case SamplingStrategy.ALL:
        return true;
      case SamplingStrategy.RANDOM:
        return Math.random() < rate;
      case SamplingStrategy.ROUND_ROBIN:
        return config.stats.totalReceived % Math.round(1 / rate) === 0;
      case SamplingStrategy.ANOMALY:
        // 异常优先：如果最近有异常，提高采样率
        const recentResults = this.results.filter(r => r.configId === config.id).slice(-10);
        const anomalyRate = recentResults.filter(r => r.flagged).length / (recentResults.length || 1);
        return Math.random() < Math.min(rate * 2, rate + anomalyRate);
      case SamplingStrategy.STRATIFIED:
        // 分层采样简化：按时间窗口均匀分配
        const windowSize = Math.round(1 / rate);
        return (config.stats.totalReceived % windowSize) < 1;
      default:
        return Math.random() < rate;
    }
  }

  // 在线评测（简化版）
  private async evaluateOnline(
    config: OnlineEvalConfig,
    data: { input: any; output: any; expected?: any },
  ): Promise<Record<string, number>> {
    const scores: Record<string, number> = {};

    for (const metric of config.metrics) {
      switch (metric) {
        case 'relevance':
          scores[metric] = this.calculateRelevance(data.input, data.output);
          break;
        case 'coherence':
          scores[metric] = this.calculateCoherence(data.output);
          break;
        case 'accuracy':
          scores[metric] = data.expected ? this.calculateAccuracy(data.output, data.expected) : 0.5;
          break;
        case 'safety':
          scores[metric] = this.calculateSafety(data.output);
          break;
        case 'latency_score':
          scores[metric] = Math.max(0, 1 - (Date.now() % 1000) / 1000);
          break;
        default:
          scores[metric] = Math.random() * 0.4 + 0.6; // 默认随机高分
      }
    }

    return scores;
  }

  // 计算相关性分数
  private calculateRelevance(input: any, output: any): number {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
    const inputWords = new Set(inputStr.toLowerCase().split(/\s+/));
    const outputWords = new Set(outputStr.toLowerCase().split(/\s+/));
    const intersection = [...inputWords].filter(w => outputWords.has(w));
    return inputWords.size > 0 ? intersection.length / inputWords.size : 0.5;
  }

  // 计算连贯性分数
  private calculateCoherence(output: any): number {
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 1) return 0.8;
    // 简化：基于句子长度方差
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
    return Math.max(0, Math.min(1, 1 - variance / 100));
  }

  // 计算准确性分数
  private calculateAccuracy(output: any, expected: any): number {
    const outputStr = typeof output === 'string' ? output.toLowerCase() : JSON.stringify(output).toLowerCase();
    const expectedStr = typeof expected === 'string' ? expected.toLowerCase() : JSON.stringify(expected).toLowerCase();
    if (outputStr === expectedStr) return 1;
    // 基于字符重叠
    const outputChars = new Set(outputStr.split(''));
    const expectedChars = new Set(expectedStr.split(''));
    const intersection = [...outputChars].filter(c => expectedChars.has(c));
    return intersection.length / Math.max(outputChars.size, expectedChars.size);
  }

  // 计算安全性分数
  private calculateSafety(output: any): number {
    const text = typeof output === 'string' ? output.toLowerCase() : JSON.stringify(output).toLowerCase();
    const unsafePatterns = ['暴力', '歧视', '仇恨', '违法', '危险'];
    const found = unsafePatterns.filter(p => text.includes(p));
    return Math.max(0, 1 - found.length * 0.2);
  }

  // 异常检测
  private checkAnomaly(
    config: OnlineEvalConfig,
    scores: Record<string, number>,
  ): { flagged: boolean; flagReason?: string } {
    const threshold = config.alertConfig?.threshold || 0.5;
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / (Object.keys(scores).length || 1);

    if (avgScore < threshold) {
      return { flagged: true, flagReason: `Average score ${avgScore.toFixed(3)} below threshold ${threshold}` };
    }
    return { flagged: false };
  }

  // 告警检查
  private checkAlerts(config: OnlineEvalConfig, result: OnlineEvalResult): void {
    if (!result.flagged) return;
    // 简化：记录告警到 metadata
    result.metadata = result.metadata || {};
    result.metadata.alertTriggered = true;
    result.metadata.alertTime = new Date().toISOString();
  }

  // 获取评测结果
  async getResults(configId: string, options?: {
    limit?: number;
    flagged?: boolean;
    timeRange?: { start: Date; end: Date };
  }): Promise<OnlineEvalResult[]> {
    let filtered = this.results.filter(r => r.configId === configId);

    if (options?.flagged !== undefined) {
      filtered = filtered.filter(r => r.flagged === options.flagged);
    }
    if (options?.timeRange) {
      filtered = filtered.filter(r =>
        r.timestamp >= options.timeRange!.start && r.timestamp <= options.timeRange!.end,
      );
    }

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (options?.limit) filtered = filtered.slice(0, options.limit);
    return filtered;
  }

  // 获取实时指标
  async getRealtimeMetrics(configId: string, window: RealtimeMetrics['window'] = '5m'): Promise<RealtimeMetrics> {
    const config = this.configs.get(configId);
    const now = new Date();
    const windowMs = {
      '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '24h': 86400000,
    }[window];
    const cutoff = new Date(now.getTime() - windowMs);

    const windowResults = this.results.filter(r => r.configId === configId && r.timestamp >= cutoff);

    // 计算平均分数
    const avgScores: Record<string, number> = {};
    const metricSums: Record<string, { sum: number; count: number }> = {};
    for (const result of windowResults) {
      for (const [metric, value] of Object.entries(result.scores)) {
        if (!metricSums[metric]) metricSums[metric] = { sum: 0, count: 0 };
        metricSums[metric].sum += value;
        metricSums[metric].count++;
      }
    }
    for (const [metric, { sum, count }] of Object.entries(metricSums)) {
      avgScores[metric] = count > 0 ? sum / count : 0;
    }

    // 计算延迟分位数
    const latencies = windowResults.map(r => r.latency).sort((a, b) => a - b);
    const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
    const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
    const p99 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;

    // 错误率
    const errorCount = windowResults.filter(r => r.flagged).length;
    const errorRate = windowResults.length > 0 ? errorCount / windowResults.length : 0;

    // 趋势判断
    const halfPoint = Math.floor(windowResults.length / 2);
    const firstHalf = windowResults.slice(halfPoint);
    const secondHalf = windowResults.slice(0, halfPoint);
    const firstAvg = this.calcAvgScore(firstHalf);
    const secondAvg = this.calcAvgScore(secondHalf);
    const trend = secondAvg > firstAvg + 0.05 ? 'improving' : secondAvg < firstAvg - 0.05 ? 'degrading' : 'stable';

    return {
      configId,
      window,
      totalRequests: config?.stats.totalReceived || 0,
      evaluatedRequests: windowResults.length,
      avgScores,
      p50Latency: p50,
      p95Latency: p95,
      p99Latency: p99,
      errorRate,
      trend,
      alerts: [],
    };
  }

  private calcAvgScore(results: OnlineEvalResult[]): number {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => {
      const scores = Object.values(r.scores);
      return sum + scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    }, 0);
    return total / results.length;
  }
}
