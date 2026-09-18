// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 质量维度
export enum QualityDimension {
  COMPLETENESS = 'completeness',       // 完整性
  CONSISTENCY = 'consistency',         // 一致性
  ACCURACY = 'accuracy',               // 准确性
  UNIQUENESS = 'uniqueness',           // 唯一性
  TIMELINESS = 'timeliness',           // 时效性
  VALIDITY = 'validity',               // 有效性
  RELEVANCE = 'relevance',             // 相关性
}

// 质量检查类型
export enum QualityCheckType {
  NULL_CHECK = 'null_check',           // 空值检查
  DUPLICATE_CHECK = 'duplicate_check', // 重复检查
  FORMAT_CHECK = 'format_check',       // 格式检查
  RANGE_CHECK = 'range_check',         // 范围检查
  PATTERN_CHECK = 'pattern_check',     // 模式检查
  OUTLIER_CHECK = 'outlier_check',     // 异常值检查
  CROSS_FIELD_CHECK = 'cross_field',   // 跨字段检查
}

// 质量检查结果
export interface QualityCheckResult {
  id: string;
  datasetId: string;
  datasetName: string;
  overallScore: number;
  dimensions: Array<{
    dimension: QualityDimension;
    score: number;
    weight: number;
    issues: QualityIssue[];
  }>;
  checks: Array<{
    type: QualityCheckType;
    field: string;
    passed: boolean;
    failedCount: number;
    totalCount: number;
    passRate: number;
    details?: any;
  }>;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
}

// 质量问题
export interface QualityIssue {
  id: string;
  type: QualityCheckType;
  dimension: QualityDimension;
  severity: 'critical' | 'warning' | 'info';
  field?: string;
  description: string;
  affectedRows: number[];
  suggestion?: string;
}

// 质量规则
export interface QualityRule {
  id: string;
  name: string;
  description?: string;
  type: QualityCheckType;
  dimension: QualityDimension;
  config: {
    field?: string;
    pattern?: string;
    minValue?: number;
    maxValue?: number;
    allowedValues?: any[];
    required?: boolean;
    unique?: boolean;
  };
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  createdAt: Date;
}

@Injectable()
export class DataQualityService {
  private results: QualityCheckResult[] = [];
  private rules: QualityRule[] = [];

  constructor() {
    this.initDefaultRules();
  }

  // 初始化默认规则
  private initDefaultRules(): void {
    this.rules = [
      {
        id: 'rule_null_check',
        name: '空值检查',
        type: QualityCheckType.NULL_CHECK,
        dimension: QualityDimension.COMPLETENESS,
        config: { required: true },
        severity: 'critical',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'rule_duplicate_check',
        name: '重复检查',
        type: QualityCheckType.DUPLICATE_CHECK,
        dimension: QualityDimension.UNIQUENESS,
        config: { unique: true },
        severity: 'warning',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'rule_format_check',
        name: '格式检查',
        type: QualityCheckType.FORMAT_CHECK,
        dimension: QualityDimension.VALIDITY,
        config: {},
        severity: 'warning',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'rule_range_check',
        name: '范围检查',
        type: QualityCheckType.RANGE_CHECK,
        dimension: QualityDimension.ACCURACY,
        config: {},
        severity: 'warning',
        enabled: true,
        createdAt: new Date(),
      },
    ];
  }

  // 执行质量检查
  async checkQuality(datasetId: string, datasetName: string, data: any[]): Promise<QualityCheckResult> {
    const id = `quality_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const enabledRules = this.rules.filter(r => r.enabled);

    const dimensions = new Map<QualityDimension, { score: number; weight: number; issues: QualityIssue[] }>();
    const checks: QualityCheckResult['checks'] = [];

    // 执行各项检查
    for (const rule of enabledRules) {
      const checkResult = this.executeCheck(rule, data);
      checks.push(checkResult);

      // 收集问题
      if (!checkResult.passed) {
        const issue: QualityIssue = {
          id: `issue_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: rule.type,
          dimension: rule.dimension,
          severity: rule.severity,
          field: rule.config.field,
          description: `${rule.name}失败`,
          affectedRows: checkResult.details?.affectedRows || [],
          suggestion: this.getSuggestion(rule.type),
        };

        if (!dimensions.has(rule.dimension)) {
          dimensions.set(rule.dimension, { score: 1.0, weight: 1.0, issues: [] });
        }
        dimensions.get(rule.dimension)!.issues.push(issue);
      }
    }

    // 计算各维度分数
    for (const [dimension, data] of dimensions.entries()) {
      data.score = Math.max(0, 1 - data.issues.length * 0.1);
    }

    // 计算总分
    const dimensionScores = Array.from(dimensions.values());
    const totalWeight = dimensionScores.reduce((sum, d) => sum + d.weight, 0);
    const overallScore = dimensionScores.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight;

    // 统计问题
    const allIssues = dimensionScores.flatMap(d => d.issues);
    const summary = {
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
      warningIssues: allIssues.filter(i => i.severity === 'warning').length,
      infoIssues: allIssues.filter(i => i.severity === 'info').length,
    };

    const result: QualityCheckResult = {
      id,
      datasetId,
      datasetName,
      overallScore,
      dimensions: Array.from(dimensions.entries()).map(([dimension, data]) => ({
        dimension,
        score: data.score,
        weight: data.weight,
        issues: data.issues,
      })),
      checks,
      summary,
      metadata: { totalRows: data.length, checkedAt: new Date() },
      createdAt: new Date(),
    };

    this.results.push(result);
    return result;
  }

  // 执行单项检查
  private executeCheck(rule: QualityRule, data: any[]): QualityCheckResult['checks'][0] {
    const field = rule.config.field || 'input';
    let passed = true;
    let failedCount = 0;
    let details: any = {};

    switch (rule.type) {
      case QualityCheckType.NULL_CHECK:
        const nullRows: number[] = [];
        data.forEach((item, index) => {
          if (!item[field] || item[field] === null || item[field] === '') {
            nullRows.push(index);
            failedCount++;
          }
        });
        passed = failedCount === 0;
        details = { affectedRows: nullRows };
        break;

      case QualityCheckType.DUPLICATE_CHECK:
        const seen = new Map<string, number[]>();
        data.forEach((item, index) => {
          const key = JSON.stringify(item);
          if (!seen.has(key)) seen.set(key, []);
          seen.get(key)!.push(index);
        });
        const duplicateRows: number[] = [];
        for (const indices of seen.values()) {
          if (indices.length > 1) {
            duplicateRows.push(...indices.slice(1));
            failedCount += indices.length - 1;
          }
        }
        passed = failedCount === 0;
        details = { affectedRows: duplicateRows };
        break;

      case QualityCheckType.FORMAT_CHECK:
        if (rule.config.pattern) {
          const regex = new RegExp(rule.config.pattern);
          const invalidRows: number[] = [];
          data.forEach((item, index) => {
            if (item[field] && !regex.test(item[field])) {
              invalidRows.push(index);
              failedCount++;
            }
          });
          passed = failedCount === 0;
          details = { affectedRows: invalidRows };
        }
        break;

      case QualityCheckType.RANGE_CHECK:
        if (rule.config.minValue !== undefined || rule.config.maxValue !== undefined) {
          const outOfRangeRows: number[] = [];
          data.forEach((item, index) => {
            const value = Number(item[field]);
            if (!isNaN(value)) {
              if (rule.config.minValue !== undefined && value < rule.config.minValue) {
                outOfRangeRows.push(index);
                failedCount++;
              } else if (rule.config.maxValue !== undefined && value > rule.config.maxValue) {
                outOfRangeRows.push(index);
                failedCount++;
              }
            }
          });
          passed = failedCount === 0;
          details = { affectedRows: outOfRangeRows };
        }
        break;

      default:
        passed = true;
    }

    return {
      type: rule.type,
      field,
      passed,
      failedCount,
      totalCount: data.length,
      passRate: (data.length - failedCount) / data.length,
      details,
    };
  }

  // 获取建议
  private getSuggestion(type: QualityCheckType): string {
    const suggestions: Record<QualityCheckType, string> = {
      [QualityCheckType.NULL_CHECK]: '补充缺失数据或移除不完整记录',
      [QualityCheckType.DUPLICATE_CHECK]: '检查并移除重复数据',
      [QualityCheckType.FORMAT_CHECK]: '修正数据格式以符合规范',
      [QualityCheckType.RANGE_CHECK]: '检查并修正超出范围的值',
      [QualityCheckType.PATTERN_CHECK]: '修正不符合模式的数据',
      [QualityCheckType.OUTLIER_CHECK]: '检查异常值并决定是否保留',
      [QualityCheckType.CROSS_FIELD_CHECK]: '检查字段间关系的一致性',
    };
    return suggestions[type] || '检查数据质量';
  }

  // 获取质量检查结果列表
  async getResults(datasetId?: string, limit: number = 20): Promise<QualityCheckResult[]> {
    let filtered = [...this.results];
    if (datasetId) filtered = filtered.filter(r => r.datasetId === datasetId);
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  // 获取质量检查结果详情
  async getResult(id: string): Promise<QualityCheckResult | undefined> {
    return this.results.find(r => r.id === id);
  }

  // 删除质量检查结果
  async deleteResult(id: string): Promise<boolean> {
    const index = this.results.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.results.splice(index, 1);
    return true;
  }

  // 获取质量规则列表
  async getRules(type?: QualityCheckType): Promise<QualityRule[]> {
    if (type) return this.rules.filter(r => r.type === type);
    return this.rules;
  }

  // 添加质量规则
  async addRule(data: {
    name: string;
    description?: string;
    type: QualityCheckType;
    dimension: QualityDimension;
    config: QualityRule['config'];
    severity: 'critical' | 'warning' | 'info';
  }): Promise<QualityRule> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const rule: QualityRule = {
      id,
      name: data.name,
      description: data.description,
      type: data.type,
      dimension: data.dimension,
      config: data.config,
      severity: data.severity,
      enabled: true,
      createdAt: new Date(),
    };
    this.rules.push(rule);
    return rule;
  }

  // 更新规则
  async updateRule(id: string, data: Partial<QualityRule>): Promise<QualityRule> {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) throw new Error('Rule not found');
    Object.assign(rule, data);
    return rule;
  }

  // 删除规则
  async deleteRule(id: string): Promise<boolean> {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.rules.splice(index, 1);
    return true;
  }

  // 获取质量维度
  getDimensions(): Array<{ id: QualityDimension; name: string; description: string }> {
    return [
      { id: QualityDimension.COMPLETENESS, name: '完整性', description: '数据是否完整，无缺失' },
      { id: QualityDimension.CONSISTENCY, name: '一致性', description: '数据是否一致，无矛盾' },
      { id: QualityDimension.ACCURACY, name: '准确性', description: '数据是否准确，无错误' },
      { id: QualityDimension.UNIQUENESS, name: '唯一性', description: '数据是否唯一，无重复' },
      { id: QualityDimension.TIMELINESS, name: '时效性', description: '数据是否及时，无过期' },
      { id: QualityDimension.VALIDITY, name: '有效性', description: '数据是否有效，符合规范' },
      { id: QualityDimension.RELEVANCE, name: '相关性', description: '数据是否相关，有价值' },
    ];
  }

  // 获取质量检查类型
  getCheckTypes(): Array<{ id: QualityCheckType; name: string; description: string }> {
    return [
      { id: QualityCheckType.NULL_CHECK, name: '空值检查', description: '检查数据是否为空' },
      { id: QualityCheckType.DUPLICATE_CHECK, name: '重复检查', description: '检查数据是否重复' },
      { id: QualityCheckType.FORMAT_CHECK, name: '格式检查', description: '检查数据格式是否正确' },
      { id: QualityCheckType.RANGE_CHECK, name: '范围检查', description: '检查数据是否在范围内' },
      { id: QualityCheckType.PATTERN_CHECK, name: '模式检查', description: '检查数据是否符合模式' },
      { id: QualityCheckType.OUTLIER_CHECK, name: '异常值检查', description: '检查异常值' },
      { id: QualityCheckType.CROSS_FIELD_CHECK, name: '跨字段检查', description: '检查字段间关系' },
    ];
  }
}
