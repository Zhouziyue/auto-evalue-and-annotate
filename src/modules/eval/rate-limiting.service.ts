// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 限流策略
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',     // 固定窗口
  SLIDING_WINDOW = 'sliding_window', // 滑动窗口
  TOKEN_BUCKET = 'token_bucket',     // 令牌桶
  LEAKY_BUCKET = 'leaky_bucket',     // 漏桶
}

// 限流配置
export interface RateLimitConfig {
  id: string;
  name: string;
  strategy: RateLimitStrategy;
  maxRequests: number;
  windowMs: number;
  burstLimit?: number; // 令牌桶突发上限
  keyGenerator: 'ip' | 'user' | 'api_key' | 'tenant' | 'custom';
  skipPaths?: string[];
  enabled: boolean;
  createdAt: Date;
}

// 限流记录
export interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: number;
  tokens: number; // 令牌桶用
  lastRefill: number;
}

// 限流结果
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  retryAfterMs?: number;
}

// 限流统计
export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  byConfig: Record<string, { total: number; blocked: number }>;
  topOffenders: Array<{ key: string; count: number }>;
}

@Injectable()
export class RateLimitingService {
  private configs: Map<string, RateLimitConfig> = new Map();
  private entries: Map<string, RateLimitEntry> = new Map();
  private stats = { totalRequests: 0, blockedRequests: 0 };
  private blockedKeys: Map<string, number> = new Map(); // key -> count

  constructor() {
    // 初始化默认限流配置
    this.initDefaults();
  }

  private initDefaults(): void {
    const defaults: Array<{ name: string; strategy: RateLimitStrategy; maxRequests: number; windowMs: number; keyGenerator: string }> = [
      { name: '全局API限流', strategy: RateLimitStrategy.FIXED_WINDOW, maxRequests: 1000, windowMs: 60000, keyGenerator: 'ip' },
      { name: '评测执行限流', strategy: RateLimitStrategy.TOKEN_BUCKET, maxRequests: 10, windowMs: 60000, keyGenerator: 'user' },
      { name: '导入导出限流', strategy: RateLimitStrategy.SLIDING_WINDOW, maxRequests: 5, windowMs: 300000, keyGenerator: 'user' },
    ];

    for (const d of defaults) {
      const id = `rl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      this.configs.set(id, {
        id,
        name: d.name,
        strategy: d.strategy,
        maxRequests: d.maxRequests,
        windowMs: d.windowMs,
        burstLimit: d.maxRequests * 2,
        keyGenerator: d.keyGenerator as any,
        enabled: true,
        createdAt: new Date(),
      });
    }
  }

  // 检查限流（核心入口）
  async check(configId: string, key: string): Promise<RateLimitResult> {
    const config = this.configs.get(configId);
    if (!config || !config.enabled) {
      return { allowed: true, remaining: Infinity, resetAt: new Date(), limit: Infinity };
    }

    this.stats.totalRequests++;
    const entryKey = `${configId}:${key}`;
    let entry = this.entries.get(entryKey);
    const now = Date.now();

    let result: RateLimitResult;

    switch (config.strategy) {
      case RateLimitStrategy.FIXED_WINDOW:
        result = this.checkFixedWindow(config, entry, entryKey, now);
        break;
      case RateLimitStrategy.SLIDING_WINDOW:
        result = this.checkSlidingWindow(config, entry, entryKey, now);
        break;
      case RateLimitStrategy.TOKEN_BUCKET:
        result = this.checkTokenBucket(config, entry, entryKey, now);
        break;
      case RateLimitStrategy.LEAKY_BUCKET:
        result = this.checkLeakyBucket(config, entry, entryKey, now);
        break;
      default:
        result = { allowed: true, remaining: config.maxRequests, resetAt: new Date(now + config.windowMs), limit: config.maxRequests };
    }

    if (!result.allowed) {
      this.stats.blockedRequests++;
      this.blockedKeys.set(key, (this.blockedKeys.get(key) || 0) + 1);
    }

    return result;
  }

  // 固定窗口
  private checkFixedWindow(config: RateLimitConfig, entry: RateLimitEntry | undefined, key: string, now: number): RateLimitResult {
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const resetAt = new Date(windowStart + config.windowMs);

    if (!entry || entry.windowStart !== windowStart) {
      entry = { key, count: 1, windowStart, tokens: 0, lastRefill: now };
      this.entries.set(key, entry);
      return { allowed: true, remaining: config.maxRequests - 1, resetAt, limit: config.maxRequests };
    }

    if (entry.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt, limit: config.maxRequests, retryAfterMs: resetAt.getTime() - now };
    }

    entry.count++;
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt, limit: config.maxRequests };
  }

  // 滑动窗口
  private checkSlidingWindow(config: RateLimitConfig, entry: RateLimitEntry | undefined, key: string, now: number): RateLimitResult {
    const windowStart = now - config.windowMs;
    const resetAt = new Date(now + config.windowMs);

    if (!entry || entry.windowStart < windowStart) {
      entry = { key, count: 1, windowStart: now, tokens: 0, lastRefill: now };
      this.entries.set(key, entry);
      return { allowed: true, remaining: config.maxRequests - 1, resetAt, limit: config.maxRequests };
    }

    if (entry.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt, limit: config.maxRequests, retryAfterMs: config.windowMs };
    }

    entry.count++;
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt, limit: config.maxRequests };
  }

  // 令牌桶
  private checkTokenBucket(config: RateLimitConfig, entry: RateLimitEntry | undefined, key: string, now: number): RateLimitResult {
    const maxTokens = config.burstLimit || config.maxRequests * 2;
    const refillRate = config.maxRequests / config.windowMs; // tokens per ms
    const resetAt = new Date(now + config.windowMs);

    if (!entry) {
      entry = { key, count: 0, windowStart: now, tokens: maxTokens - 1, lastRefill: now };
      this.entries.set(key, entry);
      return { allowed: true, remaining: maxTokens - 1, resetAt, limit: maxTokens };
    }

    // 补充令牌
    const elapsed = now - entry.lastRefill;
    entry.tokens = Math.min(maxTokens, entry.tokens + elapsed * refillRate);
    entry.lastRefill = now;

    if (entry.tokens < 1) {
      const waitMs = Math.ceil((1 - entry.tokens) / refillRate);
      return { allowed: false, remaining: 0, resetAt, limit: maxTokens, retryAfterMs: waitMs };
    }

    entry.tokens -= 1;
    return { allowed: true, remaining: Math.floor(entry.tokens), resetAt, limit: maxTokens };
  }

  // 漏桶
  private checkLeakyBucket(config: RateLimitConfig, entry: RateLimitEntry | undefined, key: string, now: number): RateLimitResult {
    const resetAt = new Date(now + config.windowMs);

    if (!entry) {
      entry = { key, count: 1, windowStart: now, tokens: 0, lastRefill: now };
      this.entries.set(key, entry);
      return { allowed: true, remaining: config.maxRequests - 1, resetAt, limit: config.maxRequests };
    }

    // 漏出
    const elapsed = now - entry.lastRefill;
    const leaked = Math.floor(elapsed / (config.windowMs / config.maxRequests));
    entry.count = Math.max(0, entry.count - leaked);
    entry.lastRefill = now;

    if (entry.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt, limit: config.maxRequests, retryAfterMs: config.windowMs / config.maxRequests };
    }

    entry.count++;
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt, limit: config.maxRequests };
  }

  // 创建限流配置
  async createConfig(data: {
    name: string;
    strategy: RateLimitStrategy;
    maxRequests: number;
    windowMs: number;
    burstLimit?: number;
    keyGenerator?: string;
    skipPaths?: string[];
  }): Promise<RateLimitConfig> {
    const id = `rl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const config: RateLimitConfig = {
      id,
      name: data.name,
      strategy: data.strategy,
      maxRequests: data.maxRequests,
      windowMs: data.windowMs,
      burstLimit: data.burstLimit,
      keyGenerator: (data.keyGenerator as any) || 'ip',
      skipPaths: data.skipPaths,
      enabled: true,
      createdAt: new Date(),
    };
    this.configs.set(id, config);
    return config;
  }

  // 获取配置列表
  async listConfigs(): Promise<RateLimitConfig[]> {
    return Array.from(this.configs.values());
  }

  // 更新配置
  async updateConfig(id: string, updates: Partial<RateLimitConfig>): Promise<RateLimitConfig | undefined> {
    const config = this.configs.get(id);
    if (!config) return undefined;
    Object.assign(config, updates);
    return config;
  }

  // 删除配置
  async deleteConfig(id: string): Promise<boolean> {
    return this.configs.delete(id);
  }

  // 重置计数器
  async resetCounters(configId?: string): Promise<number> {
    let count = 0;
    for (const [key] of this.entries.entries()) {
      if (!configId || key.startsWith(configId)) {
        this.entries.delete(key);
        count++;
      }
    }
    return count;
  }

  // 获取统计
  getStats(): RateLimitStats {
    const byConfig: Record<string, { total: number; blocked: number }> = {};
    for (const [key, entry] of this.entries.entries()) {
      const configId = key.split(':')[0];
      if (!byConfig[configId]) byConfig[configId] = { total: 0, blocked: 0 };
      byConfig[configId].total += entry.count;
    }

    const topOffenders = Array.from(this.blockedKeys.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));

    return {
      totalRequests: this.stats.totalRequests,
      blockedRequests: this.stats.blockedRequests,
      blockRate: this.stats.totalRequests > 0 ? this.stats.blockedRequests / this.stats.totalRequests : 0,
      byConfig,
      topOffenders,
    };
  }

  // 获取黑名单
  getBlocklist(): Array<{ key: string; blockCount: number }> {
    return Array.from(this.blockedKeys.entries())
      .map(([key, count]) => ({ key, blockCount: count }))
      .sort((a, b) => b.blockCount - a.blockCount);
  }

  // 清除黑名单
  clearBlocklist(): void {
    this.blockedKeys.clear();
  }
}
