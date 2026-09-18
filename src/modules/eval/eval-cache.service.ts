// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 缓存策略
export enum EvalCacheStrategy {
  EXACT = 'exact',         // 精确匹配
  SEMANTIC = 'semantic',   // 语义匹配
  HASH = 'hash',           // 哈希匹配
  TTL = 'ttl',             // TTL 过期
  LRU = 'lru',             // LRU 淘汰
}

// 缓存条目
export interface EvalCacheEntry {
  key: string;
  hash: string;
  input: any;
  output: any;
  scores: Record<string, number>;
  metadata: Record<string, any>;
  strategy: EvalCacheStrategy;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  sizeBytes: number;
}

// 缓存配置
export interface EvalCacheConfig {
  maxEntries: number;
  maxMemoryMb: number;
  defaultTtl: number;
  strategy: EvalCacheStrategy;
  similarityThreshold: number;
}

@Injectable()
export class EvalCacheService {
  private cache: Map<string, EvalCacheEntry> = new Map();
  private config: EvalCacheConfig = {
    maxEntries: 10000,
    maxMemoryMb: 500,
    defaultTtl: 86400000,
    strategy: EvalCacheStrategy.EXACT,
    similarityThreshold: 0.9,
  };
  private stats = { hits: 0, misses: 0, evictions: 0, sets: 0 };

  constructor() {}

  // 查询缓存
  async get(key: string): Promise<{ hit: boolean; entry?: EvalCacheEntry }> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return { hit: false };
    }

    // 检查过期
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return { hit: false };
    }

    entry.lastAccessedAt = new Date();
    entry.accessCount++;
    this.stats.hits++;
    return { hit: true, entry };
  }

  // 写入缓存
  async set(key: string, data: {
    input: any;
    output: any;
    scores: Record<string, number>;
    metadata?: Record<string, any>;
    ttl?: number;
  }): Promise<EvalCacheEntry> {
    // 检查容量
    if (this.cache.size >= this.config.maxEntries) {
      this.evict();
    }

    const hash = this.computeHash(JSON.stringify(data.input));
    const now = new Date();
    const ttl = data.ttl || this.config.defaultTtl;

    const entry: EvalCacheEntry = {
      key,
      hash,
      input: data.input,
      output: data.output,
      scores: data.scores,
      metadata: data.metadata || {},
      strategy: this.config.strategy,
      ttl,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      lastAccessedAt: now,
      accessCount: 0,
      sizeBytes: JSON.stringify(data).length * 2,
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    return entry;
  }

  // 按哈希查询
  async getByHash(hash: string): Promise<EvalCacheEntry | undefined> {
    for (const entry of this.cache.values()) {
      if (entry.hash === hash && new Date() <= entry.expiresAt) {
        entry.accessCount++;
        this.stats.hits++;
        return entry;
      }
    }
    this.stats.misses++;
    return undefined;
  }

  // 语义搜索（简化版）
  async semanticSearch(query: string, limit: number = 5): Promise<Array<{ entry: EvalCacheEntry; similarity: number }>> {
    const queryHash = this.computeHash(query);
    const results: Array<{ entry: EvalCacheEntry; similarity: number }> = [];

    for (const entry of this.cache.values()) {
      if (new Date() > entry.expiresAt) continue;
      const similarity = this.computeSimilarity(queryHash, entry.hash);
      if (similarity >= this.config.similarityThreshold) {
        results.push({ entry, similarity });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  // 批量查询
  async getMany(keys: string[]): Promise<Map<string, EvalCacheEntry>> {
    const result = new Map<string, EvalCacheEntry>();
    for (const key of keys) {
      const { hit, entry } = await this.get(key);
      if (hit && entry) result.set(key, entry);
    }
    return result;
  }

  // 批量删除
  async deleteMany(keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) count++;
    }
    return count;
  }

  // 按标签删除
  async deleteByTag(tag: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.tags?.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // 清除过期
  async clearExpired(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // 清空全部
  async clearAll(): Promise<number> {
    const count = this.cache.size;
    this.cache.clear();
    return count;
  }

  // LRU 淘汰
  private evict(): void {
    let oldest: EvalCacheEntry | null = null;
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.lastAccessedAt < oldest.lastAccessedAt) {
        oldest = entry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  // 计算哈希
  private computeHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // 计算相似度
  private computeSimilarity(hash1: string, hash2: string): number {
    if (hash1 === hash2) return 1;
    let matches = 0;
    const len = Math.min(hash1.length, hash2.length);
    for (let i = 0; i < len; i++) {
      if (hash1[i] === hash2[i]) matches++;
    }
    return len > 0 ? matches / len : 0;
  }

  // 获取统计
  getStats(): {
    size: number;
    maxEntries: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    sets: number;
    memoryUsageMb: number;
  } {
    let totalBytes = 0;
    for (const entry of this.cache.values()) {
      totalBytes += entry.sizeBytes;
    }

    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      evictions: this.stats.evictions,
      sets: this.stats.sets,
      memoryUsageMb: totalBytes / 1024 / 1024,
    };
  }

  // 更新配置
  updateConfig(config: Partial<EvalCacheConfig>): void {
    Object.assign(this.config, config);
  }

  // 获取配置
  getConfig(): EvalCacheConfig {
    return { ...this.config };
  }

  // 预热缓存
  async warmup(entries: Array<{ key: string; input: any; output: any; scores: Record<string, number> }>): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.set(entry.key, entry);
      count++;
    }
    return count;
  }
}
