// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 脱敏类型
export enum AnonymizationType {
  NAME = 'name',
  EMAIL = 'email',
  PHONE = 'phone',
  ID_CARD = 'id_card',
  BANK_CARD = 'bank_card',
  ADDRESS = 'address',
  IP = 'ip',
  CUSTOM = 'custom',
}

// 脱敏规则
export interface AnonymizationRule {
  id: string;
  name: string;
  type: AnonymizationType;
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  enabled: boolean;
  priority: number;
}

// 脱敏结果
export interface AnonymizationResult {
  original: string;
  anonymized: string;
  replacements: Array<{
    type: AnonymizationType;
    original: string;
    replacement: string;
    position: number;
  }>;
  stats: {
    totalReplacements: number;
    byType: Record<string, number>;
  };
}

@Injectable()
export class DataAnonymizationService {
  private rules: AnonymizationRule[] = [];

  constructor() {
    this.initDefaultRules();
  }

  // 初始化默认规则
  private initDefaultRules(): void {
    this.rules = [
      {
        id: 'phone',
        name: '手机号脱敏',
        type: AnonymizationType.PHONE,
        pattern: /1[3-9]\d{9}/g,
        replacement: (m: string) => m.substring(0, 3) + '****' + m.substring(7),
        enabled: true,
        priority: 1,
      },
      {
        id: 'email',
        name: '邮箱脱敏',
        type: AnonymizationType.EMAIL,
        pattern: /[\w.-]+@[\w.-]+\.\w+/g,
        replacement: (m: string) => {
          const [local, domain] = m.split('@');
          return local.substring(0, 2) + '***@' + domain;
        },
        enabled: true,
        priority: 2,
      },
      {
        id: 'id_card',
        name: '身份证脱敏',
        type: AnonymizationType.ID_CARD,
        pattern: /\d{17}[\dXx]/g,
        replacement: (m: string) => m.substring(0, 6) + '********' + m.substring(14),
        enabled: true,
        priority: 0,
      },
      {
        id: 'bank_card',
        name: '银行卡脱敏',
        type: AnonymizationType.BANK_CARD,
        pattern: /\d{16,19}/g,
        replacement: (m: string) => m.substring(0, 4) + ' **** **** ' + m.substring(m.length - 4),
        enabled: true,
        priority: 0,
      },
      {
        id: 'ip',
        name: 'IP地址脱敏',
        type: AnonymizationType.IP,
        pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        replacement: (m: string) => {
          const parts = m.split('.');
          return `${parts[0]}.${parts[1]}.*.*`;
        },
        enabled: true,
        priority: 3,
      },
      {
        id: 'name_cn',
        name: '中文姓名脱敏',
        type: AnonymizationType.NAME,
        pattern: /(?<=[\u4e00-\u9fa5]{1})[\u4e00-\u9fa5]+(?=[\u4e00-\u9fa5]{0,1})/g,
        replacement: (m: string) => '*'.repeat(m.length),
        enabled: true,
        priority: 4,
      },
    ];
  }

  // 脱敏文本
  anonymize(text: string, customRules?: AnonymizationRule[]): AnonymizationResult {
    let result = text;
    const replacements: AnonymizationResult['replacements'] = [];
    const byType: Record<string, number> = {};
    const allRules = [...this.rules, ...(customRules || [])]
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of allRules) {
      const matches = text.match(rule.pattern);
      if (!matches) continue;

      for (const match of matches) {
        const replacement = typeof rule.replacement === 'function'
          ? rule.replacement(match)
          : rule.replacement;

        replacements.push({
          type: rule.type,
          original: match,
          replacement,
          position: result.indexOf(match),
        });

        byType[rule.type] = (byType[rule.type] || 0) + 1;
      }

      result = result.replace(rule.pattern, typeof rule.replacement === 'function' ? rule.replacement as any : rule.replacement);
    }

    return {
      original: text,
      anonymized: result,
      replacements,
      stats: {
        totalReplacements: replacements.length,
        byType,
      },
    };
  }

  // 批量脱敏
  anonymizeBatch(texts: string[]): AnonymizationResult[] {
    return texts.map(t => this.anonymize(t));
  }

  // 脱敏 JSON 对象
  anonymizeJson(obj: any, fields?: string[]): any {
    if (typeof obj === 'string') return this.anonymize(obj).anonymized;
    if (Array.isArray(obj)) return obj.map(item => this.anonymizeJson(item, fields));
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (fields && !fields.includes(key)) {
          result[key] = value;
        } else if (typeof value === 'string') {
          result[key] = this.anonymize(value).anonymized;
        } else {
          result[key] = this.anonymizeJson(value, fields);
        }
      }
      return result;
    }
    return obj;
  }

  // 添加自定义规则
  addRule(rule: {
    name: string;
    type: AnonymizationType;
    pattern: string;
    replacement: string;
    priority?: number;
  }): AnonymizationRule {
    const newRule: AnonymizationRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: rule.name,
      type: rule.type,
      pattern: new RegExp(rule.pattern, 'g'),
      replacement: rule.replacement,
      enabled: true,
      priority: rule.priority || 5,
    };
    this.rules.push(newRule);
    return newRule;
  }

  // 获取规则列表
  getRules(): Array<{ id: string; name: string; type: AnonymizationType; enabled: boolean; priority: number }> {
    return this.rules.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      enabled: r.enabled,
      priority: r.priority,
    }));
  }

  // 启用/禁用规则
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = enabled;
  }

  // 删除规则
  deleteRule(ruleId: string): boolean {
    const idx = this.rules.findIndex(r => r.id === ruleId);
    if (idx === -1) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  // 检测敏感信息
  detectSensitiveData(text: string): Array<{
    type: AnonymizationType;
    value: string;
    position: number;
    confidence: number;
  }> {
    const detections: Array<{ type: AnonymizationType; value: string; position: number; confidence: number }> = [];

    for (const rule of this.rules.filter(r => r.enabled)) {
      const matches = text.matchAll(rule.pattern);
      for (const match of matches) {
        detections.push({
          type: rule.type,
          value: match[0],
          position: match.index || 0,
          confidence: 0.9,
        });
      }
    }

    return detections.sort((a, b) => a.position - b.position);
  }
}
