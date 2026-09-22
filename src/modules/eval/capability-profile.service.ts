// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 能力维度
export enum CapabilityDimension {
  LANGUAGE = 'language',           // 语言理解
  KNOWLEDGE = 'knowledge',         // 知识问答
  REASONING = 'reasoning',         // 逻辑推理
  CODE = 'code',                   // 代码能力
  MATH = 'math',                   // 数学能力
  CREATIVITY = 'creativity',       // 创造力
  SAFETY = 'safety',               // 安全性
  INSTRUCTION = 'instruction',     // 指令遵循
  ACCURACY = 'accuracy',           // 准确性
  COMPLETENESS = 'completeness',   // 完整性
  RELEVANCE = 'relevance',         // 相关性
  FAITHFULNESS = 'faithfulness',   // 忠实度
}

// 能力维度定义
export interface CapabilityDefinition {
  id: CapabilityDimension;
  name: string;
  description: string;
  color: string;
}

// 能力画像结果
export interface CapabilityProfile {
  evalRunId: string;
  modelName?: string;
  overallScore: number;
  dimensions: Array<{
    dimension: CapabilityDimension;
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
    color: string;
    description: string;
  }>;
  strengths: Array<{
    dimension: CapabilityDimension;
    name: string;
    score: number;
    percentage: number;
  }>;
  weaknesses: Array<{
    dimension: CapabilityDimension;
    name: string;
    score: number;
    percentage: number;
  }>;
  radarChartData: {
    labels: string[];
    values: number[];
    maxValues: number[];
  };
  summary: string;
  generatedAt: Date;
}

// 能力维度定义库
const CAPABILITY_DEFINITIONS: CapabilityDefinition[] = [
  {
    id: CapabilityDimension.ACCURACY,
    name: '准确性',
    description: '回答的正确程度，包括事实准确性和逻辑正确性',
    color: '#22c55e',
  },
  {
    id: CapabilityDimension.COMPLETENESS,
    name: '完整性',
    description: '回答的完整程度，是否覆盖所有要点',
    color: '#3b82f6',
  },
  {
    id: CapabilityDimension.RELEVANCE,
    name: '相关性',
    description: '回答与问题的相关程度',
    color: '#8b5cf6',
  },
  {
    id: CapabilityDimension.FAITHFULNESS,
    name: '忠实度',
    description: '回答是否忠于上下文，无幻觉',
    color: '#f59e0b',
  },
  {
    id: CapabilityDimension.SAFETY,
    name: '安全性',
    description: '回答的安全性，无有害内容',
    color: '#ef4444',
  },
  {
    id: CapabilityDimension.LANGUAGE,
    name: '语言理解',
    description: '语言理解和表达能力',
    color: '#06b6d4',
  },
  {
    id: CapabilityDimension.KNOWLEDGE,
    name: '知识问答',
    description: '知识储备和问答能力',
    color: '#84cc16',
  },
  {
    id: CapabilityDimension.REASONING,
    name: '逻辑推理',
    description: '逻辑推理和分析能力',
    color: '#ec4899',
  },
  {
    id: CapabilityDimension.CODE,
    name: '代码能力',
    description: '代码生成和理解能力',
    color: '#6366f1',
  },
  {
    id: CapabilityDimension.CREATIVITY,
    name: '创造力',
    description: '创造性思维和表达能力',
    color: '#f97316',
  },
  {
    id: CapabilityDimension.INSTRUCTION,
    name: '指令遵循',
    description: '遵循用户指令的能力',
    color: '#14b8a6',
  },
  {
    id: CapabilityDimension.MATH,
    name: '数学能力',
    description: '数学计算和推理能力',
    color: '#a855f7',
  },
];

@Injectable()
export class CapabilityProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 基于评测运行生成能力画像
   */
  async generateProfile(evalRunId: string): Promise<CapabilityProfile> {
    // 1. 获取评测运行信息
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: {
        results: {
          include: {
            testCase: true,
          },
        },
      },
    });

    if (!evalRun) {
      throw new NotFoundException(`评测运行 ${evalRunId} 不存在`);
    }

    // 2. 计算各维度分数
    const dimensionScores = await this.calculateDimensionScores(evalRun.results);

    // 3. 识别优势和劣势
    const sortedDimensions = [...dimensionScores].sort((a, b) => b.percentage - a.percentage);
    const strengths = sortedDimensions.slice(0, 3).map(d => ({
      dimension: d.dimension,
      name: d.name,
      score: d.score,
      percentage: d.percentage,
    }));
    const weaknesses = sortedDimensions.slice(-3).reverse().map(d => ({
      dimension: d.dimension,
      name: d.name,
      score: d.score,
      percentage: d.percentage,
    }));

    // 4. 计算总体分数
    const overallScore = dimensionScores.length > 0
      ? dimensionScores.reduce((sum, d) => sum + d.percentage, 0) / dimensionScores.length
      : 0;

    // 5. 生成雷达图数据
    const radarChartData = {
      labels: dimensionScores.map(d => d.name),
      values: dimensionScores.map(d => d.percentage),
      maxValues: dimensionScores.map(() => 100),
    };

    // 6. 生成总结
    const summary = this.generateSummary(overallScore, strengths, weaknesses);

    return {
      evalRunId,
      modelName: evalRun.skillName || evalRun.endpointName,
      overallScore,
      dimensions: dimensionScores,
      strengths,
      weaknesses,
      radarChartData,
      summary,
      generatedAt: new Date(),
    };
  }

  /**
   * 计算各维度分数
   */
  private async calculateDimensionScores(results: any[]): Promise<CapabilityProfile['dimensions']> {
    const scores: Record<CapabilityDimension, { total: number; count: number }> = {
      [CapabilityDimension.ACCURACY]: { total: 0, count: 0 },
      [CapabilityDimension.COMPLETENESS]: { total: 0, count: 0 },
      [CapabilityDimension.RELEVANCE]: { total: 0, count: 0 },
      [CapabilityDimension.FAITHFULNESS]: { total: 0, count: 0 },
      [CapabilityDimension.SAFETY]: { total: 0, count: 0 },
      [CapabilityDimension.LANGUAGE]: { total: 0, count: 0 },
      [CapabilityDimension.KNOWLEDGE]: { total: 0, count: 0 },
      [CapabilityDimension.REASONING]: { total: 0, count: 0 },
      [CapabilityDimension.CODE]: { total: 0, count: 0 },
      [CapabilityDimension.CREATIVITY]: { total: 0, count: 0 },
      [CapabilityDimension.INSTRUCTION]: { total: 0, count: 0 },
      [CapabilityDimension.MATH]: { total: 0, count: 0 },
    };

    // 从评测结果中提取分数
    for (const result of results) {
      let resultScores = result.scores;
      // scores 可能是 JSON 字符串，需要解析
      if (typeof resultScores === 'string') {
        try {
          resultScores = JSON.parse(resultScores);
        } catch (e) {
          continue;
        }
      }
      if (!resultScores || typeof resultScores !== 'object') continue;

      // 映射评测指标到能力维度（支持中英文键名）
      const accVal = resultScores['准确性'] ?? resultScores['accuracy'];
      if (accVal !== undefined) {
        scores[CapabilityDimension.ACCURACY].total += Number(accVal) * 100;
        scores[CapabilityDimension.ACCURACY].count++;
      }
      const compVal = resultScores['完整性'] ?? resultScores['completeness'];
      if (compVal !== undefined) {
        scores[CapabilityDimension.COMPLETENESS].total += Number(compVal) * 100;
        scores[CapabilityDimension.COMPLETENESS].count++;
      }
      const relVal = resultScores['相关性'] ?? resultScores['relevance'];
      if (relVal !== undefined) {
        scores[CapabilityDimension.RELEVANCE].total += Number(relVal) * 100;
        scores[CapabilityDimension.RELEVANCE].count++;
      }
      const faithVal = resultScores['忠实度'] ?? resultScores['faithfulness'];
      if (faithVal !== undefined) {
        scores[CapabilityDimension.FAITHFULNESS].total += Number(faithVal) * 100;
        scores[CapabilityDimension.FAITHFULNESS].count++;
      }
      const safeVal = resultScores['安全性'] ?? resultScores['safety'];
      if (safeVal !== undefined) {
        scores[CapabilityDimension.SAFETY].total += Number(safeVal) * 100;
        scores[CapabilityDimension.SAFETY].count++;
      }
      // 额外英文维度映射
      const fluVal = resultScores['fluency'] ?? resultScores['流畅性'];
      if (fluVal !== undefined) {
        scores[CapabilityDimension.LANGUAGE].total += Number(fluVal) * 100;
        scores[CapabilityDimension.LANGUAGE].count++;
      }
      const cohVal = resultScores['coherence'] ?? resultScores['连贯性'];
      if (cohVal !== undefined) {
        scores[CapabilityDimension.LANGUAGE].total += Number(cohVal) * 100;
        scores[CapabilityDimension.LANGUAGE].count++;
      }
      const hallVal = resultScores['hallucination'] ?? resultScores['幻觉'];
      if (hallVal !== undefined) {
        scores[CapabilityDimension.FAITHFULNESS].total += (1 - Number(hallVal)) * 100;
        scores[CapabilityDimension.FAITHFULNESS].count++;
      }
      const toxVal = resultScores['toxicity'] ?? resultScores['毒性'];
      if (toxVal !== undefined) {
        scores[CapabilityDimension.SAFETY].total += (1 - Number(toxVal)) * 100;
        scores[CapabilityDimension.SAFETY].count++;
      }

      // 从 testCase 标签推断其他维度
      const tags = result.testCase?.tags || [];
      if (tags.includes('language') || tags.includes('语言')) {
        scores[CapabilityDimension.LANGUAGE].total += this.estimateScore(result) * 100;
        scores[CapabilityDimension.LANGUAGE].count++;
      }
      if (tags.includes('knowledge') || tags.includes('知识')) {
        scores[CapabilityDimension.KNOWLEDGE].total += this.estimateScore(result) * 100;
        scores[CapabilityDimension.KNOWLEDGE].count++;
      }
      if (tags.includes('reasoning') || tags.includes('推理')) {
        scores[CapabilityDimension.REASONING].total += this.estimateScore(result) * 100;
        scores[CapabilityDimension.REASONING].count++;
      }
      if (tags.includes('code') || tags.includes('代码')) {
        scores[CapabilityDimension.CODE].total += this.estimateScore(result) * 100;
        scores[CapabilityDimension.CODE].count++;
      }
      if (tags.includes('creativity') || tags.includes('创意')) {
        scores[CapabilityDimension.CREATIVITY].total += this.estimateScore(result) * 100;
        scores[CapabilityDimension.CREATIVITY].count++;
      }
      if (tags.includes('instruction') || tags.includes('指令')) {
        scores[CapabilityDimension.INSTRUCTION].total += this.estimateScore(result) * 100;
        scores[CapabilityDimension.INSTRUCTION].count++;
      }
      if (tags.includes('math') || tags.includes('数学')) {
        scores[CapabilityDimension.MATH].total += this.estimateScore(result) * 100;
        scores[CapabilityDimension.MATH].count++;
      }
    }

    // 生成维度分数
    return CAPABILITY_DEFINITIONS.map(def => {
      const scoreData = scores[def.id];
      const avgScore = scoreData.count > 0 ? scoreData.total / scoreData.count : 0;
      const percentage = Math.min(100, Math.max(0, avgScore));

      return {
        dimension: def.id,
        name: def.name,
        score: Math.round(percentage) / 100,
        maxScore: 1,
        percentage: Math.round(percentage * 10) / 10,
        color: def.color,
        description: def.description,
      };
    }).filter(d => d.percentage > 0); // 只返回有数据的维度
  }

  /**
   * 估算分数（当没有直接评分时）
   */
  private estimateScore(result: any): number {
    if (result.status === 'passed') return 0.9;
    if (result.status === 'failed') return 0.3;
    return 0.5;
  }

  /**
   * 生成总结
   */
  private generateSummary(
    overallScore: number,
    strengths: CapabilityProfile['strengths'],
    weaknesses: CapabilityProfile['weaknesses'],
  ): string {
    const strengthNames = strengths.map(s => s.name).join('、');
    const weaknessNames = weaknesses.map(w => w.name).join('、');

    let level = '优秀';
    if (overallScore < 60) level = '待改进';
    else if (overallScore < 75) level = '良好';
    else if (overallScore < 85) level = '较好';

    return `该智能体整体表现${level}，综合得分 ${overallScore.toFixed(1)} 分。` +
      `在${strengthNames}方面表现突出，建议重点关注${weaknessNames}的提升。`;
  }

  /**
   * 获取所有能力维度定义
   */
  getCapabilityDefinitions(): CapabilityDefinition[] {
    return CAPABILITY_DEFINITIONS;
  }
}
