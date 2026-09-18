// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 缓存条目
export interface CacheEntry {
  id: string;
  key: string;              // 原始查询
  keyHash: string;          // 查询哈希
  embedding?: number[];     // 查询向量
  response: string;         // 缓存的响应
  model: string;            // 使用的模型
  parameters: Record<string, any>; // 请求参数
  hitCount: number;         // 命中次数
  lastHitAt: Date;          // 最后命中时间
  createdAt: Date;          // 创建时间
  expiresAt?: Date;         // 过期时间
  tags: string[];           // 标签
  metadata: Record<string, any>; // 元数据
}

// 缓存查询结果
export interface CacheLookupResult {
  hit: boolean;
  entry?: CacheEntry;
  similarity?: number;      // 语义相似度
  latency: number;          // 查询延迟
}

// 缓存统计
export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  hitRate: number;
  avgLatency: number;
  sizeBytes: number;
  byModel: Record<string, { entries: number; hits: number }>;
}

// 缓存配置
export interface CacheConfig {
  maxEntries: number;
  ttlSeconds: number;
  similarityThreshold: number; // 语义相似度阈值
  enabled: boolean;
}

@Injectable()
export class SemanticCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig = {
    maxEntries: 10000,
    ttlSeconds: 86400, // 24小时
    similarityThreshold: 0.9,
    enabled: true,
  };
  private totalHits = 0;
  private totalLookups = 0;

  constructor() {}

  // 查询缓存
  async lookup(query: string, model?: string): Promise<CacheLookupResult> {
    const startTime = Date.now();
    this.totalLookups++;

    if (!this.config.enabled) {
      return { hit: false, latency: Date.now() - startTime };
    }

    // 精确匹配
    const keyHash = this.hashKey(query);
    for (const entry of this.cache.values()) {
      if (entry.keyHash === keyHash && (!model || entry.model === model)) {
        // 检查是否过期
        if (entry.expiresAt && entry.expiresAt < new Date()) {
          this.cache.delete(entry.id);
          continue;
        }

        entry.hitCount++;
        entry.lastHitAt = new Date();
        this.totalHits++;

        return {
          hit: true,
          entry,
          similarity: 1.0,
          latency: Date.now() - startTime,
        };
      }
    }

    // 语义相似度匹配（简化版）
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    for (const entry of this.cache.values()) {
      if (model && entry.model !== model) continue;
      if (entry.expiresAt && entry.expiresAt < new Date()) continue;

      const similarity = this.calculateSimilarity(query, entry.key);
      if (similarity > bestSimilarity && similarity >= this.config.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      bestMatch.hitCount++;
      bestMatch.lastHitAt = new Date();
      this.totalHits++;

      return {
        hit: true,
        entry: bestMatch,
        similarity: bestSimilarity,
        latency: Date.now() - startTime,
      };
    }

    return { hit: false, latency: Date.now() - startTime };
  }

  // 存储到缓存
  async store(
    query: string,
    response: string,
    options?: {
      model?: string;
      parameters?: Record<string, any>;
      tags?: string[];
      metadata?: Record<string, any>;
      ttlSeconds?: number;
    },
  ): Promise<CacheEntry> {
    const id = `cache_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const keyHash = this.hashKey(query);

    const entry: CacheEntry = {
      id,
      key: query,
      keyHash,
      response,
      model: options?.model || 'default',
      parameters: options?.parameters || {},
      hitCount: 0,
      lastHitAt: new Date(),
      createdAt: new Date(),
      expiresAt: options?.ttlSeconds
        ? new Date(Date.now() + options.ttlSeconds * 1000)
        : new Date(Date.now() + this.config.ttlSeconds * 1000),
      tags: options?.tags || [],
      metadata: options?.metadata || {},
    };

    // 检查缓存容量
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(id, entry);
    return entry;
  }

  // 删除缓存条目
  async delete(id: string): Promise<boolean> {
    return this.cache.delete(id);
  }

  // 按标签删除
  async deleteByTag(tag: string): Promise<number> {
    let count = 0;
    for (const [id, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(id);
        count++;
      }
    }
    return count;
  }

  // 清空缓存
  async clear(): Promise<void> {
    this.cache.clear();
    this.totalHits = 0;
    this.totalLookups = 0;
  }

  // 获取缓存统计
  async getStats(): Promise<CacheStats> {
    const byModel: Record<string, { entries: number; hits: number }> = {};
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { entries: 0, hits: 0 };
      }
      byModel[entry.model].entries++;
      byModel[entry.model].hits += entry.hitCount;
      totalSize += JSON.stringify(entry).length;
    }

    return {
      totalEntries: this.cache.size,
      totalHits: this.totalHits,
      hitRate: this.totalLookups > 0 ? this.totalHits / this.totalLookups : 0,
      avgLatency: 0, // 简化处理
      sizeBytes: totalSize,
      byModel,
    };
  }

  // 获取缓存条目列表
  async list(options?: {
    model?: string;
    tags?: string[];
    limit?: number;
  }): Promise<CacheEntry[]> {
    let entries = Array.from(this.cache.values());

    if (options?.model) {
      entries = entries.filter(e => e.model === options.model);
    }
    if (options?.tags && options.tags.length > 0) {
      entries = entries.filter(e =>
        options.tags!.some(tag => e.tags.includes(tag)),
      );
    }

    // 按创建时间倒序
    entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  // 更新配置
  updateConfig(config: Partial<CacheConfig>): void {
    Object.assign(this.config, config);
  }

  // 获取配置
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // LRU 淘汰
  private evictLRU(): void {
    let oldest: CacheEntry | null = null;
    for (const entry of this.cache.values()) {
      if (!oldest || entry.lastHitAt < oldest.lastHitAt) {
        oldest = entry;
      }
    }
    if (oldest) {
      this.cache.delete(oldest.id);
    }
  }

  // 计算字符串哈希
  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // 计算文本相似度（简化版 Jaccard 相似度）
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // 预热缓存（批量导入）
  async warmup(entries: Array<{
    query: string;
    response: string;
    model?: string;
    tags?: string[];
  }>): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.store(entry.query, entry.response, {
        model: entry.model,
        tags: entry.tags,
      });
      count++;
    }
    return count;
  }

  // 获取缓存命中率趋势
  async getHitRateTrend(buckets: number = 24): Promise<Array<{
    timestamp: Date;
    hitRate: number;
    lookups: number;
    hits: number;
  }>> {
    // 简化实现：返回总体统计
    const now = new Date();
    const bucketSize = (this.config.ttlSeconds * 1000) / buckets;

    const trend = [];
    for (let i = buckets - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * bucketSize);
      trend.push({
        timestamp,
        hitRate: this.totalLookups > 0 ? this.totalHits / this.totalLookups : 0,
        lookups: Math.floor(this.totalLookups / buckets),
        hits: Math.floor(this.totalHits / buckets),
      });
    }

    return trend;
  }
}
