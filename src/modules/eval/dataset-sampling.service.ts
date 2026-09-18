// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 采样策略
export enum SamplingStrategy {
  RANDOM = 'random',               // 随机采样
  STRATIFIED = 'stratified',       // 分层采样
  SYSTEMATIC = 'systematic',       // 系统采样
  CLUSTER = 'cluster',             // 聚类采样
  DIFFICULTY_BASED = 'difficulty', // 难度优先
  DIVERSITY = 'diversity',         // 多样性采样
  ACTIVE_LEARNING = 'active',      // 主动学习
  WEIGHTED = 'weighted',           // 加权采样
}

// 采样请求
export interface SamplingRequest {
  datasetId: string;
  strategy: SamplingStrategy;
  sampleSize: number;
  config?: {
    strata?: string;          // 分层字段
    difficultyField?: string; // 难度字段
    weights?: Record<string, number>; // 权重
    seed?: number;            // 随机种子
    minDiversity?: number;    // 最小多样性
    uncertaintyThreshold?: number; // 不确定度阈值
  };
}

// 采样结果
export interface SamplingResult {
  id: string;
  request: SamplingRequest;
  sampledItems: any[];
  originalSize: number;
  sampledSize: number;
  samplingRate: number;
  statistics: SamplingStatistics;
  createdAt: Date;
}

// 采样统计
export interface SamplingStatistics {
  distribution: Record<string, number>;
  coverage: number;
  representativeness: number;
  biasScore: number;
}

@Injectable()
export class DatasetSamplingService {
  constructor(private prisma: PrismaService) {}

  private results: Map<string, SamplingResult> = new Map();

  // 执行采样
  async sample(request: SamplingRequest): Promise<SamplingResult> {
    const id = `sample_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // 获取数据集
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: request.datasetId },
      include: { items: true },
    });

    const items = dataset?.items || [];
    const originalSize = items.length;

    if (request.sampleSize >= originalSize) {
      // 采样数大于等于数据集大小，返回全部
      return {
        id,
        request,
        sampledItems: items,
        originalSize,
        sampledSize: originalSize,
        samplingRate: 1,
        statistics: this.calculateStatistics(items, items),
        createdAt: new Date(),
      };
    }

    let sampledItems: any[];

    switch (request.strategy) {
      case SamplingStrategy.RANDOM:
        sampledItems = this.randomSample(items, request.sampleSize, request.config?.seed);
        break;
      case SamplingStrategy.STRATIFIED:
        sampledItems = this.stratifiedSample(items, request.sampleSize, request.config?.strata || 'difficulty');
        break;
      case SamplingStrategy.SYSTEMATIC:
        sampledItems = this.systematicSample(items, request.sampleSize);
        break;
      case SamplingStrategy.CLUSTER:
        sampledItems = this.clusterSample(items, request.sampleSize);
        break;
      case SamplingStrategy.DIFFICULTY_BASED:
        sampledItems = this.difficultyBasedSample(items, request.sampleSize, request.config?.difficultyField || 'difficulty');
        break;
      case SamplingStrategy.DIVERSITY:
        sampledItems = this.diversitySample(items, request.sampleSize, request.config?.minDiversity || 0.5);
        break;
      case SamplingStrategy.ACTIVE_LEARNING:
        sampledItems = this.activeLearningSample(items, request.sampleSize, request.config?.uncertaintyThreshold || 0.5);
        break;
      case SamplingStrategy.WEIGHTED:
        sampledItems = this.weightedSample(items, request.sampleSize, request.config?.weights || {});
        break;
      default:
        sampledItems = this.randomSample(items, request.sampleSize);
    }

    const result: SamplingResult = {
      id,
      request,
      sampledItems,
      originalSize,
      sampledSize: sampledItems.length,
      samplingRate: sampledItems.length / originalSize,
      statistics: this.calculateStatistics(items, sampledItems),
      createdAt: new Date(),
    };

    this.results.set(id, result);
    return result;
  }

  // 随机采样
  private randomSample(items: any[], size: number, seed?: number): any[] {
    const shuffled = [...items];
    // 简单 Fisher-Yates 洗牌
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = seed ? (seed * (i + 1) * 9301 + 49297) % 233280 / 233280 * (i + 1) | 0 : Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, size);
  }

  // 分层采样
  private stratifiedSample(items: any[], size: number, strataField: string): any[] {
    const strata = new Map<string, any[]>();
    for (const item of items) {
      const key = (item as any)[strataField] || 'default';
      if (!strata.has(key)) strata.set(key, []);
      strata.get(key)!.push(item);
    }

    const totalItems = items.length;
    const sampled: any[] = [];

    for (const [key, group] of strata.entries()) {
      const proportion = group.length / totalItems;
      const groupSize = Math.round(size * proportion);
      const groupSampled = this.randomSample(group, Math.min(groupSize, group.length));
      sampled.push(...groupSampled);
    }

    return sampled.slice(0, size);
  }

  // 系统采样
  private systematicSample(items: any[], size: number): any[] {
    const interval = Math.ceil(items.length / size);
    const start = Math.floor(Math.random() * interval);
    const sampled: any[] = [];
    for (let i = start; i < items.length && sampled.length < size; i += interval) {
      sampled.push(items[i]);
    }
    return sampled;
  }

  // 聚类采样
  private clusterSample(items: any[], size: number): any[] {
    // 简化：按输入长度分桶，随机选桶
    const bucketCount = Math.max(2, Math.ceil(Math.sqrt(items.length)));
    const buckets: any[][] = Array.from({ length: bucketCount }, () => []);

    for (let i = 0; i < items.length; i++) {
      buckets[i % bucketCount].push(items[i]);
    }

    // 随机选几个桶
    const selectedBuckets = this.randomSample(
      Array.from({ length: bucketCount }, (_, i) => i),
      Math.max(1, Math.ceil(bucketCount * size / items.length)),
    );

    const sampled: any[] = [];
    for (const idx of selectedBuckets) {
      sampled.push(...buckets[idx]);
    }

    return sampled.slice(0, size);
  }

  // 难度优先采样
  private difficultyBasedSample(items: any[], size: number, difficultyField: string): any[] {
    // 难度分布：简单30%，中等40%，困难30%
    const difficulties: Record<string, any[]> = { easy: [], medium: [], hard: [] };

    for (const item of items) {
      const diff = (item as any)[difficultyField] || 'medium';
      const key = diff === 'easy' || diff === '简单' ? 'easy' : diff === 'hard' || diff === '困难' ? 'hard' : 'medium';
      difficulties[key].push(item);
    }

    const ratios = { easy: 0.3, medium: 0.4, hard: 0.3 };
    const sampled: any[] = [];

    for (const [diff, ratio] of Object.entries(ratios)) {
      const count = Math.round(size * ratio);
      const group = difficulties[diff];
      sampled.push(...this.randomSample(group, Math.min(count, group.length)));
    }

    return sampled.slice(0, size);
  }

  // 多样性采样（基于文本相似度）
  private diversitySample(items: any[], size: number, minDiversity: number): any[] {
    if (items.length <= size) return items;

    const sampled: any[] = [items[0]]; // 第一个总是选
    const remaining = items.slice(1);

    while (sampled.length < size && remaining.length > 0) {
      let bestIdx = 0;
      let bestDiversity = -1;

      for (let i = 0; i < remaining.length; i++) {
        const minDist = sampled.reduce((min, s) => {
          const dist = this.textDistance(
            this.getTextContent(s),
            this.getTextContent(remaining[i]),
          );
          return Math.min(min, dist);
        }, 1);

        if (minDist > bestDiversity) {
          bestDiversity = minDist;
          bestIdx = i;
        }
      }

      sampled.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    return sampled;
  }

  // 主动学习采样（选择最不确定的样本）
  private activeLearningSample(items: any[], size: number, threshold: number): any[] {
    // 简化：基于输入长度方差选择（越长越不确定）
    const scored = items.map(item => ({
      item,
      score: this.uncertaintyScore(item),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, size).map(s => s.item);
  }

  // 加权采样
  private weightedSample(items: any[], size: number, weights: Record<string, number>): any[] {
    const itemWeights = items.map(item => {
      let weight = 1;
      for (const [key, value] of Object.entries(weights)) {
        if ((item as any)[key] !== undefined) {
          weight *= (value as number);
        }
      }
      return { item, weight };
    });

    const totalWeight = itemWeights.reduce((sum, iw) => sum + iw.weight, 0);
    const sampled: any[] = [];
    const remaining = [...itemWeights];

    while (sampled.length < size && remaining.length > 0) {
      const r = Math.random() * remaining.reduce((sum, iw) => sum + iw.weight, 0);
      let cumulative = 0;

      for (let i = 0; i < remaining.length; i++) {
        cumulative += remaining[i].weight;
        if (r <= cumulative) {
          sampled.push(remaining[i].item);
          remaining.splice(i, 1);
          break;
        }
      }
    }

    return sampled;
  }

  // 辅助方法
  private getTextContent(item: any): string {
    if (typeof item === 'string') return item;
    if (item.input) return typeof item.input === 'string' ? item.input : JSON.stringify(item.input);
    return JSON.stringify(item);
  }

  private textDistance(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...setA].filter(x => setB.has(x));
    const union = new Set([...setA, ...setB]);
    return 1 - intersection.length / union.size; // Jaccard distance
  }

  private uncertaintyScore(item: any): number {
    const text = this.getTextContent(item);
    // 简化：基于文本长度和特殊字符
    return Math.min(1, text.length / 1000 + (text.match(/[?!]/g) || []).length * 0.1);
  }

  private calculateStatistics(original: any[], sampled: any[]): SamplingStatistics {
    // 简化统计
    const distribution: Record<string, number> = {};
    for (const item of sampled) {
      const key = typeof item === 'object' && item.difficulty ? item.difficulty : 'default';
      distribution[key] = (distribution[key] || 0) + 1;
    }

    const coverage = original.length > 0 ? sampled.length / original.length : 0;
    const representativeness = Math.min(1, coverage * 1.2); // 简化
    const biasScore = Math.max(0, 1 - representativeness);

    return { distribution, coverage, representativeness, biasScore };
  }

  // 获取采样结果
  async getResult(id: string): Promise<SamplingResult | undefined> {
    return this.results.get(id);
  }

  // 获取所有采样记录
  async listResults(): Promise<SamplingResult[]> {
    return Array.from(this.results.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取可用策略
  getStrategies(): Array<{ id: SamplingStrategy; name: string; description: string }> {
    return [
      { id: SamplingStrategy.RANDOM, name: '随机采样', description: '完全随机选择样本' },
      { id: SamplingStrategy.STRATIFIED, name: '分层采样', description: '按类别比例分层采样' },
      { id: SamplingStrategy.SYSTEMATIC, name: '系统采样', description: '等间隔采样' },
      { id: SamplingStrategy.CLUSTER, name: '聚类采样', description: '按聚类分桶后选桶' },
      { id: SamplingStrategy.DIFFICULTY_BASED, name: '难度优先', description: '按难度比例采样' },
      { id: SamplingStrategy.DIVERSITY, name: '多样性采样', description: '最大化样本多样性' },
      { id: SamplingStrategy.ACTIVE_LEARNING, name: '主动学习', description: '选择最不确定的样本' },
      { id: SamplingStrategy.WEIGHTED, name: '加权采样', description: '按权重概率采样' },
    ];
  }
}
