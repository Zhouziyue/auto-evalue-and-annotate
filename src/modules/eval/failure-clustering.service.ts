// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 失败模式类型
export enum FailureMode {
  UNDERSTANDING_ERROR = 'understanding_error',      // 理解偏差
  KNOWLEDGE_GAP = 'knowledge_gap',                  // 知识缺失
  FORMAT_ERROR = 'format_error',                    // 格式错误
  LOGIC_ERROR = 'logic_error',                      // 逻辑错误
  SAFETY_ISSUE = 'safety_issue',                    // 安全问题
  COMPLETENESS_ISSUE = 'completeness_issue',        // 完整性不足
  RELEVANCE_ISSUE = 'relevance_issue',              // 相关性差
  HALLUCINATION = 'hallucination',                  // 幻觉
  TONE_ISSUE = 'tone_issue',                        // 语气不当
  OTHER = 'other',                                  // 其他
}

// 失败模式定义
export interface FailureModeDefinition {
  id: FailureMode;
  name: string;
  description: string;
  keywords: string[];
  color: string;
}

// 聚类结果
export interface ClusteringResult {
  evalRunId: string;
  totalFailures: number;
  modeDistribution: Array<{
    mode: FailureMode;
    name: string;
    count: number;
    percentage: number;
    color: string;
    examples: string[];
  }>;
  topIssues: Array<{
    mode: FailureMode;
    name: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
    affectedCases: number;
  }>;
  analyzedAt: Date;
}

// 失败模式定义库
const FAILURE_MODE_DEFINITIONS: FailureModeDefinition[] = [
  {
    id: FailureMode.UNDERSTANDING_ERROR,
    name: '理解偏差',
    description: '智能体误解了用户意图或问题含义',
    keywords: ['理解错误', '答非所问', '误解', '搞错', '弄错'],
    color: '#ef4444',
  },
  {
    id: FailureMode.KNOWLEDGE_GAP,
    name: '知识缺失',
    description: '智能体缺乏回答所需的领域知识',
    keywords: ['不知道', '不了解', '无法回答', '没有信息', '知识不足'],
    color: '#f59e0b',
  },
  {
    id: FailureMode.FORMAT_ERROR,
    name: '格式错误',
    description: '输出格式不符合要求（JSON/表格/列表等）',
    keywords: ['格式错误', '格式不对', '不是 JSON', '格式问题'],
    color: '#8b5cf6',
  },
  {
    id: FailureMode.LOGIC_ERROR,
    name: '逻辑错误',
    description: '回答存在逻辑矛盾或推理错误',
    keywords: ['逻辑错误', '矛盾', '推理错误', '不合逻辑'],
    color: '#ec4899',
  },
  {
    id: FailureMode.SAFETY_ISSUE,
    name: '安全问题',
    description: '回答包含有害、歧视或不当内容',
    keywords: ['不安全', '有害', '歧视', '不当', '违规'],
    color: '#dc2626',
  },
  {
    id: FailureMode.COMPLETENESS_ISSUE,
    name: '完整性不足',
    description: '回答不完整，遗漏了关键信息',
    keywords: ['不完整', '遗漏', '缺少', '不全面', '部分回答'],
    color: '#3b82f6',
  },
  {
    id: FailureMode.RELEVANCE_ISSUE,
    name: '相关性差',
    description: '回答与问题关联度低，包含无关信息',
    keywords: ['不相关', '无关', '跑题', '偏离主题'],
    color: '#10b981',
  },
  {
    id: FailureMode.HALLUCINATION,
    name: '幻觉',
    description: '回答包含虚假信息或编造内容',
    keywords: ['幻觉', '编造', '虚假', '不存在', '错误信息'],
    color: '#6366f1',
  },
  {
    id: FailureMode.TONE_ISSUE,
    name: '语气不当',
    description: '回答语气不符合场景要求',
    keywords: ['语气不好', '态度差', '不礼貌', '生硬', '冷漠'],
    color: '#f97316',
  },
  {
    id: FailureMode.OTHER,
    name: '其他',
    description: '不属于以上分类的其他失败模式',
    keywords: [],
    color: '#6b7280',
  },
];

@Injectable()
export class FailureClusteringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 分析评测运行的失败模式聚类
   */
  async analyzeFailures(evalRunId: string): Promise<ClusteringResult> {
    // 1. 获取评测运行的所有失败结果
    const failedResults = await this.prisma.evalResult.findMany({
      where: {
        evalRunId,
        status: 'failed',
      },
      include: {
        testCase: true,
        annotations: true,
      },
    });

    if (failedResults.length === 0) {
      // 如果没有失败结果，尝试从低分结果中分析
      const lowScoreResults = await this.prisma.evalResult.findMany({
        where: {
          evalRunId,
          scores: {
            not: null,
          },
        },
        include: {
          testCase: true,
          annotations: true,
        },
      });

      // 筛选出低分结果（分数 < 0.6）
      const filteredResults = lowScoreResults.filter(r => {
        const scores = r.scores as any;
        if (!scores) return false;
        const avgScore = Object.values(scores).reduce((sum: number, val: any) => sum + Number(val), 0) / Object.keys(scores).length;
        return avgScore < 0.6;
      });

      return this.performClustering(evalRunId, filteredResults);
    }

    return this.performClustering(evalRunId, failedResults);
  }

  /**
   * 执行聚类分析
   */
  private async performClustering(
    evalRunId: string,
    results: any[],
  ): Promise<ClusteringResult> {
    const modeCounts: Record<FailureMode, number> = {
      [FailureMode.UNDERSTANDING_ERROR]: 0,
      [FailureMode.KNOWLEDGE_GAP]: 0,
      [FailureMode.FORMAT_ERROR]: 0,
      [FailureMode.LOGIC_ERROR]: 0,
      [FailureMode.SAFETY_ISSUE]: 0,
      [FailureMode.COMPLETENESS_ISSUE]: 0,
      [FailureMode.RELEVANCE_ISSUE]: 0,
      [FailureMode.HALLUCINATION]: 0,
      [FailureMode.TONE_ISSUE]: 0,
      [FailureMode.OTHER]: 0,
    };

    const modeExamples: Record<FailureMode, string[]> = {
      [FailureMode.UNDERSTANDING_ERROR]: [],
      [FailureMode.KNOWLEDGE_GAP]: [],
      [FailureMode.FORMAT_ERROR]: [],
      [FailureMode.LOGIC_ERROR]: [],
      [FailureMode.SAFETY_ISSUE]: [],
      [FailureMode.COMPLETENESS_ISSUE]: [],
      [FailureMode.RELEVANCE_ISSUE]: [],
      [FailureMode.HALLUCINATION]: [],
      [FailureMode.TONE_ISSUE]: [],
      [FailureMode.OTHER]: [],
    };

    // 2. 对每个失败结果进行分类
    for (const result of results) {
      const mode = this.classifyFailure(result);
      modeCounts[mode]++;

      // 收集示例（每个模式最多 5 个）
      if (modeExamples[mode].length < 5) {
        modeExamples[mode].push(result.testCase?.input || '未知输入');
      }
    }

    const totalFailures = results.length;

    // 3. 生成分布统计
    const modeDistribution = FAILURE_MODE_DEFINITIONS.map(def => ({
      mode: def.id,
      name: def.name,
      count: modeCounts[def.id],
      percentage: totalFailures > 0 ? (modeCounts[def.id] / totalFailures) * 100 : 0,
      color: def.color,
      examples: modeExamples[def.id],
    })).filter(m => m.count > 0);

    // 按数量降序排序
    modeDistribution.sort((a, b) => b.count - a.count);

    // 4. 生成 Top 问题和建议
    const topIssues = this.generateTopIssues(modeDistribution, totalFailures);

    return {
      evalRunId,
      totalFailures,
      modeDistribution,
      topIssues,
      analyzedAt: new Date(),
    };
  }

  /**
   * 分类单个失败结果
   */
  private classifyFailure(result: any): FailureMode {
    const input = result.testCase?.input || '';
    const output = result.actualOutput || '';
    const expected = result.testCase?.expectedOutput || '';
    const scores = result.scores as any;
    const annotations = result.annotations || [];

    // 基于评分分类
    if (scores) {
      let parsedScores = scores;
      if (typeof parsedScores === 'string') {
        try { parsedScores = JSON.parse(parsedScores); } catch (e) { parsedScores = null; }
      }
      if (parsedScores && typeof parsedScores === 'object') {
        const scoreValues = Object.values(parsedScores).map(v => Number(v));
        const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

        // 检查各维度分数
        if (parsedScores['安全性'] !== undefined && parsedScores['安全性'] < 0.5) {
          return FailureMode.SAFETY_ISSUE;
        }
        if (parsedScores['完整性'] !== undefined && parsedScores['完整性'] < 0.4) {
          return FailureMode.COMPLETENESS_ISSUE;
        }
        if (parsedScores['相关性'] !== undefined && parsedScores['相关性'] < 0.4) {
          return FailureMode.RELEVANCE_ISSUE;
        }
        if (parsedScores['准确性'] !== undefined && parsedScores['准确性'] < 0.4) {
          // 准确性低可能是理解偏差或知识缺失
          if (this.containsKeywords(output, ['不知道', '不了解', '无法回答'])) {
            return FailureMode.KNOWLEDGE_GAP;
          }
          return FailureMode.UNDERSTANDING_ERROR;
        }
      }
    }

    // 基于标注分类
    for (const annotation of annotations) {
      const comment = annotation.comment || '';
      if (this.containsKeywords(comment, ['幻觉', '编造', '虚假'])) {
        return FailureMode.HALLUCINATION;
      }
      if (this.containsKeywords(comment, ['格式', 'JSON', '结构'])) {
        return FailureMode.FORMAT_ERROR;
      }
      if (this.containsKeywords(comment, ['逻辑', '矛盾', '推理'])) {
        return FailureMode.LOGIC_ERROR;
      }
      if (this.containsKeywords(comment, ['语气', '态度', '礼貌'])) {
        return FailureMode.TONE_ISSUE;
      }
    }

    // 基于输出内容分类
    if (this.containsKeywords(output, ['不知道', '不了解', '无法回答', '没有信息'])) {
      return FailureMode.KNOWLEDGE_GAP;
    }
    if (this.containsKeywords(output, ['对不起', '抱歉', '无法理解'])) {
      return FailureMode.UNDERSTANDING_ERROR;
    }
    if (output.length < 20 && expected.length > 50) {
      return FailureMode.COMPLETENESS_ISSUE;
    }

    // 基于输入输出相似度
    if (input && output) {
      const similarity = this.calculateSimilarity(input, output);
      if (similarity < 0.3) {
        return FailureMode.RELEVANCE_ISSUE;
      }
    }

    return FailureMode.OTHER;
  }

  /**
   * 检查文本是否包含关键词
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  }

  /**
   * 计算文本相似度（简化版）
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * 生成 Top 问题和建议
   */
  private generateTopIssues(
    modeDistribution: any[],
    totalFailures: number,
  ): Array<{
    mode: FailureMode;
    name: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
    affectedCases: number;
  }> {
    const suggestions: Record<FailureMode, string> = {
      [FailureMode.UNDERSTANDING_ERROR]: '优化 Prompt 中的意图识别部分，增加few-shot示例帮助模型理解用户意图',
      [FailureMode.KNOWLEDGE_GAP]: '补充知识库内容，或在 Prompt 中明确说明知识边界，引导用户转向人工客服',
      [FailureMode.FORMAT_ERROR]: '在 Prompt 中明确输出格式要求，添加格式校验和自动修复机制',
      [FailureMode.LOGIC_ERROR]: '增强推理链设计，使用 CoT（思维链）Prompt 提升逻辑推理能力',
      [FailureMode.SAFETY_ISSUE]: '加强安全护栏，添加内容过滤和敏感词检测机制',
      [FailureMode.COMPLETENESS_ISSUE]: '优化 Prompt 要求完整性，或拆分为多步回答确保覆盖所有要点',
      [FailureMode.RELEVANCE_ISSUE]: '增强上下文理解，添加相关性校验和重定向机制',
      [FailureMode.HALLUCINATION]: '添加事实核查机制，限制模型只基于提供的知识回答',
      [FailureMode.TONE_ISSUE]: '在 Prompt 中明确语气要求，添加语气检测和自动调整机制',
      [FailureMode.OTHER]: '人工审查这些 case，识别新的失败模式并更新分类规则',
    };

    return modeDistribution
      .filter(m => m.count > 0)
      .map(m => {
        const percentage = m.percentage;
        let severity: 'high' | 'medium' | 'low' = 'medium';
        if (percentage >= 30) severity = 'high';
        else if (percentage < 10) severity = 'low';

        const definition = FAILURE_MODE_DEFINITIONS.find(d => d.id === m.mode);

        return {
          mode: m.mode,
          name: m.name,
          severity,
          description: definition?.description || '',
          suggestion: suggestions[m.mode] || '',
          affectedCases: m.count,
        };
      })
      .sort((a, b) => b.affectedCases - a.affectedCases);
  }

  /**
   * 获取所有失败模式定义
   */
  getFailureModeDefinitions(): FailureModeDefinition[] {
    return FAILURE_MODE_DEFINITIONS;
  }
}
