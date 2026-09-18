// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 筛选规则类型
export enum FilterRuleType {
  LENGTH = 'length',               // 长度过滤
  LANGUAGE = 'language',           // 语言检测
  DEDUPLICATION = 'deduplication', // 去重
  QUALITY_SCORE = 'quality_score', // 质量评分
  KEYWORD = 'keyword',             // 关键词过滤
  REGEX = 'regex',                 // 正则匹配
  COMPLEXITY = 'complexity',       // 复杂度过滤
}

// 筛选规则
export interface FilterRule {
  id: string;
  name: string;
  type: FilterRuleType;
  enabled: boolean;
  config: Record<string, any>;
  action: 'keep' | 'remove' | 'flag';
}

// 清洗结果
export interface CleaningResult {
  originalCount: number;
  filteredCount: number;
  removedCount: number;
  flaggedCount: number;
  removedItems: Array<{
    id: string;
    reason: string;
    rule: string;
  }>;
  flaggedItems: Array<{
    id: string;
    reason: string;
    rule: string;
  }>;
  statistics: {
    avgLength: number;
    minLength: number;
    maxLength: number;
    languageDistribution: Record<string, number>;
    duplicateCount: number;
  };
}

// 数据集质量报告
export interface QualityReport {
  datasetId: string;
  totalCases: number;
  qualityScore: number;
  issues: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  suggestions: string[];
}

@Injectable()
export class DatasetCurationService {
  private rules: Map<string, FilterRule> = new Map();

  constructor(private prisma: PrismaService) {
    // 初始化默认规则
    this.initDefaultRules();
  }

  private initDefaultRules() {
    const defaults: FilterRule[] = [
      {
        id: 'min_length',
        name: '最小长度过滤',
        type: FilterRuleType.LENGTH,
        enabled: true,
        config: { min: 5 },
        action: 'remove',
      },
      {
        id: 'max_length',
        name: '最大长度过滤',
        type: FilterRuleType.LENGTH,
        enabled: true,
        config: { max: 10000 },
        action: 'remove',
      },
      {
        id: 'dedup_exact',
        name: '精确去重',
        type: FilterRuleType.DEDUPLICATION,
        enabled: true,
        config: { mode: 'exact' },
        action: 'remove',
      },
      {
        id: 'empty_check',
        name: '空值检查',
        type: FilterRuleType.QUALITY_SCORE,
        enabled: true,
        config: { checkEmpty: true, checkWhitespace: true },
        action: 'remove',
      },
    ];

    for (const rule of defaults) {
      this.rules.set(rule.id, rule);
    }
  }

  // 清洗数据集
  async cleanDataset(datasetId: string): Promise<CleaningResult> {
    const testCases = await this.prisma.testCase.findMany({
      where: { datasetId },
    });

    const originalCount = testCases.length;
    const removedItems: CleaningResult['removedItems'] = [];
    const flaggedItems: CleaningResult['flaggedItems'] = [];
    const seen = new Set<string>();
    let duplicateCount = 0;
    let totalLength = 0;
    let minLength = Infinity;
    let maxLength = 0;
    const languageDistribution: Record<string, number> = {};

    for (const tc of testCases) {
      const input = tc.input || '';
      const length = input.length;
      totalLength += length;
      minLength = Math.min(minLength, length);
      maxLength = Math.max(maxLength, length);

      // 语言检测（简化版）
      const lang = this.detectLanguage(input);
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;

      // 应用规则
      for (const rule of Array.from(this.rules.values())) {
        if (!rule.enabled) continue;

        const result = this.applyRule(rule, tc);
        if (!result.passed) {
          if (rule.action === 'remove') {
            removedItems.push({
              id: tc.id,
              reason: result.reason,
              rule: rule.name,
            });
          } else if (rule.action === 'flag') {
            flaggedItems.push({
              id: tc.id,
              reason: result.reason,
              rule: rule.name,
            });
          }
          break; // 一个用例只需标记一次
        }
      }

      // 去重检查
      const hash = input.trim().toLowerCase();
      if (seen.has(hash)) {
        duplicateCount++;
        const dedupRule = this.rules.get('dedup_exact');
        if (dedupRule?.enabled) {
          removedItems.push({
            id: tc.id,
            reason: '重复内容',
            rule: '精确去重',
          });
        }
      }
      seen.add(hash);
    }

    // 去重 removedItems
    const uniqueRemoved = Array.from(
      new Map(removedItems.map(item => [item.id, item])).values()
    );

    return {
      originalCount,
      filteredCount: originalCount - uniqueRemoved.length,
      removedCount: uniqueRemoved.length,
      flaggedCount: flaggedItems.length,
      removedItems: uniqueRemoved,
      flaggedItems,
      statistics: {
        avgLength: originalCount > 0 ? totalLength / originalCount : 0,
        minLength: minLength === Infinity ? 0 : minLength,
        maxLength,
        languageDistribution,
        duplicateCount,
      },
    };
  }

  // 生成质量报告
  async generateQualityReport(datasetId: string): Promise<QualityReport> {
    const testCases = await this.prisma.testCase.findMany({
      where: { datasetId },
    });

    const totalCases = testCases.length;
    const issues: QualityReport['issues'] = [];
    const suggestions: string[] = [];

    // 检查空值
    const emptyInputs = testCases.filter(tc => !tc.input || tc.input.trim() === '');
    if (emptyInputs.length > 0) {
      issues.push({
        type: 'empty_input',
        count: emptyInputs.length,
        severity: 'high',
        description: `${emptyInputs.length} 个用例的输入为空`,
      });
      suggestions.push('删除或补充空输入的用例');
    }

    // 检查缺少期望输出
    const noExpected = testCases.filter(tc => !tc.expectedOutput || tc.expectedOutput.trim() === '');
    if (noExpected.length > 0) {
      issues.push({
        type: 'no_expected_output',
        count: noExpected.length,
        severity: 'medium',
        description: `${noExpected.length} 个用例缺少期望输出`,
      });
      suggestions.push('为缺少期望输出的用例添加参考答案');
    }

    // 检查长度分布
    const lengths = testCases.map(tc => (tc.input || '').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
    const shortInputs = testCases.filter(tc => (tc.input || '').length < 5);
    if (shortInputs.length > 0) {
      issues.push({
        type: 'too_short',
        count: shortInputs.length,
        severity: 'low',
        description: `${shortInputs.length} 个用例输入过短（<5字符）`,
      });
      suggestions.push('检查过短的输入是否有足够的评测价值');
    }

    // 检查重复
    const seen = new Set<string>();
    let dupCount = 0;
    for (const tc of testCases) {
      const hash = (tc.input || '').trim().toLowerCase();
      if (seen.has(hash)) dupCount++;
      seen.add(hash);
    }
    if (dupCount > 0) {
      issues.push({
        type: 'duplicates',
        count: dupCount,
        severity: 'medium',
        description: `发现 ${dupCount} 个重复用例`,
      });
      suggestions.push('使用去重功能清理重复数据');
    }

    // 检查难度分布
    const difficulties: Record<string, number> = {};
    for (const tc of testCases) {
      const diff = (tc as any).difficulty || 'medium';
      difficulties[diff] = (difficulties[diff] || 0) + 1;
    }

    // 计算质量分数
    let qualityScore = 1;
    if (totalCases > 0) {
      qualityScore -= (emptyInputs.length / totalCases) * 0.3;
      qualityScore -= (noExpected.length / totalCases) * 0.2;
      qualityScore -= (dupCount / totalCases) * 0.2;
      qualityScore -= (shortInputs.length / totalCases) * 0.1;
    }
    qualityScore = Math.max(0, Math.min(1, qualityScore));

    if (suggestions.length === 0) {
      suggestions.push('数据集质量良好，无需额外处理');
    }

    return {
      datasetId,
      totalCases,
      qualityScore,
      issues,
      suggestions,
    };
  }

  // 获取筛选规则
  getRules(): FilterRule[] {
    return Array.from(this.rules.values());
  }

  // 创建筛选规则
  createRule(rule: Omit<FilterRule, 'id'>): FilterRule {
    const id = `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newRule: FilterRule = { ...rule, id };
    this.rules.set(id, newRule);
    return newRule;
  }

  // 切换规则
  toggleRule(id: string, enabled: boolean): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // 应用规则
  private applyRule(rule: FilterRule, testCase: any): { passed: boolean; reason: string } {
    const input = testCase.input || '';

    switch (rule.type) {
      case FilterRuleType.LENGTH:
        if (rule.config.min && input.length < rule.config.min) {
          return { passed: false, reason: `输入长度 ${input.length} 小于最小值 ${rule.config.min}` };
        }
        if (rule.config.max && input.length > rule.config.max) {
          return { passed: false, reason: `输入长度 ${input.length} 超过最大值 ${rule.config.max}` };
        }
        return { passed: true, reason: '' };

      case FilterRuleType.QUALITY_SCORE:
        if (rule.config.checkEmpty && input.trim() === '') {
          return { passed: false, reason: '输入为空' };
        }
        if (rule.config.checkWhitespace && input !== input.trim()) {
          return { passed: false, reason: '输入包含多余空白' };
        }
        return { passed: true, reason: '' };

      case FilterRuleType.KEYWORD:
        if (rule.config.keywords) {
          const found = rule.config.keywords.filter((kw: string) =>
            input.toLowerCase().includes(kw.toLowerCase()),
          );
          if (rule.config.mode === 'include' && found.length === 0) {
            return { passed: false, reason: '未包含必需关键词' };
          }
          if (rule.config.mode === 'exclude' && found.length > 0) {
            return { passed: false, reason: `包含禁止关键词: ${found.join(', ')}` };
          }
        }
        return { passed: true, reason: '' };

      case FilterRuleType.REGEX:
        if (rule.config.pattern) {
          try {
            const regex = new RegExp(rule.config.pattern);
            if (!regex.test(input)) {
              return { passed: false, reason: `不匹配正则: ${rule.config.pattern}` };
            }
          } catch (e) {
            return { passed: false, reason: `正则错误: ${e.message}` };
          }
        }
        return { passed: true, reason: '' };

      default:
        return { passed: true, reason: '' };
    }
  }

  // 语言检测（简化版）
  private detectLanguage(text: string): string {
    const chineseRegex = /[\u4e00-\u9fff]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanRegex = /[\uac00-\ud7af]/;

    if (japaneseRegex.test(text)) return 'ja';
    if (koreanRegex.test(text)) return 'ko';
    if (chineseRegex.test(text)) return 'zh';
    return 'en';
  }
}
