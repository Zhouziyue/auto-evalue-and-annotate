// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 配置类型
export enum ConfigType {
  SYSTEM = 'system',
  MODEL = 'model',
  EVAL = 'eval',
  DATASET = 'dataset',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  FEATURE_FLAG = 'feature_flag',
}

// 配置项
export interface ConfigItem {
  id: string;
  key: string;
  value: any;
  type: ConfigType;
  description?: string;
  scope: 'global' | 'tenant' | 'user';
  scopeId?: string;
  encrypted: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

// 配置变更记录
export interface ConfigChange {
  id: string;
  configId: string;
  key: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

@Injectable()
export class EvalConfigService {
  private configs: Map<string, ConfigItem> = new Map();
  private changes: ConfigChange[] = [];
  private defaults: Map<string, any> = new Map();

  constructor() {
    this.initDefaults();
  }

  // 初始化默认配置
  private initDefaults(): void {
    const defaults: Record<string, any> = {
      'system.max_concurrent_evals': 10,
      'system.eval_timeout_ms': 300000,
      'system.max_retry_count': 3,
      'system.rate_limit_rpm': 100,
      'model.default_temperature': 0.7,
      'model.max_tokens': 2048,
      'model.default_provider': 'openai',
      'eval.default_metrics': ['accuracy', 'relevance', 'coherence'],
      'eval.batch_size': 50,
      'eval.auto_save': true,
      'notification.email_enabled': false,
      'notification.webhook_enabled': true,
      'notification.slack_enabled': false,
      'feature.multi_tenant': false,
      'feature.audit_log': true,
      'feature.semantic_cache': true,
      'feature.online_eval': false,
    };

    for (const [key, value] of Object.entries(defaults)) {
      this.defaults.set(key, value);
    }
  }

  // 获取配置（带默认值和继承）
  async get(key: string, scopeId?: string): Promise<any> {
    // 先查 scope 级别
    if (scopeId) {
      const scoped = Array.from(this.configs.values()).find(
        c => c.key === key && c.scopeId === scopeId,
      );
      if (scoped) return scoped.value;
    }

    // 再查全局
    const global = Array.from(this.configs.values()).find(
      c => c.key === key && c.scope === 'global',
    );
    if (global) return global.value;

    // 最后用默认值
    return this.defaults.get(key);
  }

  // 设置配置
  async set(data: {
    key: string;
    value: any;
    type: ConfigType;
    description?: string;
    scope?: 'global' | 'tenant' | 'user';
    scopeId?: string;
    encrypted?: boolean;
    updatedBy?: string;
    reason?: string;
  }): Promise<ConfigItem> {
    const existing = Array.from(this.configs.values()).find(
      c => c.key === data.key && c.scopeId === data.scopeId,
    );

    if (existing) {
      const oldValue = existing.value;
      existing.value = data.value;
      existing.version++;
      existing.updatedAt = new Date();
      existing.updatedBy = data.updatedBy;

      // 记录变更
      this.changes.push({
        id: `change_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        configId: existing.id,
        key: data.key,
        oldValue,
        newValue: data.value,
        changedBy: data.updatedBy || 'system',
        changedAt: new Date(),
        reason: data.reason,
      });

      return existing;
    }

    const id = `cfg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const config: ConfigItem = {
      id,
      key: data.key,
      value: data.value,
      type: data.type,
      description: data.description,
      scope: data.scope || 'global',
      scopeId: data.scopeId,
      encrypted: data.encrypted || false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: data.updatedBy,
    };

    this.configs.set(id, config);
    return config;
  }

  // 批量获取
  async getMany(keys: string[], scopeId?: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const key of keys) {
      result[key] = await this.get(key, scopeId);
    }
    return result;
  }

  // 批量设置
  async setMany(items: Array<{
    key: string;
    value: any;
    type: ConfigType;
    scope?: 'global' | 'tenant' | 'user';
    scopeId?: string;
    updatedBy?: string;
  }>): Promise<ConfigItem[]> {
    const results: ConfigItem[] = [];
    for (const item of items) {
      results.push(await this.set(item));
    }
    return results;
  }

  // 删除配置
  async delete(id: string): Promise<boolean> {
    return this.configs.delete(id);
  }

  // 获取配置列表
  async list(type?: ConfigType, scope?: string): Promise<ConfigItem[]> {
    let configs = Array.from(this.configs.values());
    if (type) configs = configs.filter(c => c.type === type);
    if (scope) configs = configs.filter(c => c.scope === scope);
    return configs.sort((a, b) => a.key.localeCompare(b.key));
  }

  // 获取变更历史
  async getChangeHistory(configId?: string, limit: number = 50): Promise<ConfigChange[]> {
    let changes = [...this.changes];
    if (configId) changes = changes.filter(c => c.configId === configId);
    changes.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
    return changes.slice(0, limit);
  }

  // 回滚到上一个版本
  async rollback(configId: string, userId: string): Promise<ConfigItem | null> {
    const relevantChanges = this.changes
      .filter(c => c.configId === configId)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());

    if (relevantChanges.length === 0) return null;

    const lastChange = relevantChanges[0];
    const config = this.configs.get(configId);
    if (!config) return null;

    config.value = lastChange.oldValue;
    config.version++;
    config.updatedAt = new Date();
    config.updatedBy = userId;

    return config;
  }

  // 获取所有默认配置
  getDefaults(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.defaults.entries()) {
      result[key] = value;
    }
    return result;
  }

  // 导出配置
  async exportConfig(scopeId?: string): Promise<string> {
    const configs = await this.list(undefined, scopeId ? 'tenant' : undefined);
    const exportData = configs.map(c => ({
      key: c.key,
      value: c.encrypted ? '***' : c.value,
      type: c.type,
      scope: c.scope,
      description: c.description,
    }));
    return JSON.stringify(exportData, null, 2);
  }

  // 导入配置
  async importConfig(json: string, userId: string): Promise<number> {
    const items = JSON.parse(json);
    let count = 0;
    for (const item of items) {
      await this.set({
        key: item.key,
        value: item.value,
        type: item.type || ConfigType.SYSTEM,
        description: item.description,
        scope: item.scope || 'global',
        updatedBy: userId,
        reason: 'imported',
      });
      count++;
    }
    return count;
  }

  // 验证配置
  validateConfig(key: string, value: any): { valid: boolean; error?: string } {
    // 简化验证
    if (!key || key.trim() === '') return { valid: false, error: 'Key cannot be empty' };
    if (value === undefined || value === null) return { valid: false, error: 'Value cannot be null' };
    return { valid: true };
  }
}
