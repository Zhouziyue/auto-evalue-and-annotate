// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentService } from '../agent/agent.service';

// 验证报告接口
export interface ValidationReport {
  datasetId: string;
  totalCases: number;
  difficultyDistribution: { easy: number; medium: number; hard: number };
  coverageScore: number;
  discriminationScore: number;
  overallQuality: number;
  problematicCases: Array<{
    testCaseId: string;
    issue: 'too_easy' | 'too_hard' | 'low_discrimination' | 'duplicate_intent';
    suggestion: string;
  }>;
  suggestions: string[];
  status: 'draft' | 'validated' | 'rejected';
  validatedAt?: Date;
}

// 试跑结果
interface TrialRunResult {
  testCaseId: string;
  input: string;
  expectedOutput: string | null;
  actualOutput: string | null;
  score: number;
  latency: number;
}

@Injectable()
export class DatasetValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
  ) {}

  /**
   * 执行评测集验证（试跑）
   */
  async validateDataset(datasetId: string, baselineEndpointId?: string): Promise<ValidationReport> {
    // 1. 获取数据集
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
      include: { testCases: true },
    });

    if (!dataset) {
      throw new NotFoundException(`数据集 ${datasetId} 不存在`);
    }

    if (dataset.testCases.length === 0) {
      throw new BadRequestException('数据集为空，无法验证');
    }

    // 2. 更新状态为验证中
    await this.prisma.dataset.update({
      where: { id: datasetId },
      data: { validationStatus: 'validating' },
    });

    // 3. 试跑测试用例
    const trialResults = await this.runTrialTests(dataset.testCases, baselineEndpointId);

    // 4. 分析结果
    const report = this.analyzeResults(datasetId, trialResults);

    // 5. 保存报告
    await this.prisma.dataset.update({
      where: { id: datasetId },
      data: {
        validationStatus: 'draft', // 等待人工审批
        validationReport: JSON.stringify(report),
      },
    });

    return report;
  }

  /**
   * 执行试跑测试
   */
  private async runTrialTests(
    testCases: any[],
    baselineEndpointId?: string,
  ): Promise<TrialRunResult[]> {
    const results: TrialRunResult[] = [];

    // 如果没有指定基准端点，使用模拟评分
    const useMock = !baselineEndpointId;

    for (const tc of testCases) {
      const startTime = Date.now();
      let actualOutput: string | null = null;
      let score = 0;

      if (!useMock) {
        try {
          const agentResult = await this.agentService.invoke(baselineEndpointId, tc.input);
          actualOutput = agentResult.output || null;

          // 计算得分：基于预期输出匹配
          score = this.calculateScore(tc.expectedOutput, actualOutput);
        } catch (error) {
          actualOutput = null;
          score = 0;
        }
      } else {
        // 模拟模式：根据难度生成模拟得分
        const difficulty = tc.difficulty || 'medium';
        const baseScore = difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 0.6 : 0.4;
        score = baseScore + (Math.random() * 0.2 - 0.1); // 添加随机波动
        score = Math.max(0, Math.min(1, score));
        actualOutput = `[模拟输出] ${tc.input}`;
      }

      const latency = Date.now() - startTime;

      results.push({
        testCaseId: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        score,
        latency,
      });
    }

    return results;
  }

  /**
   * 计算得分
   */
  private calculateScore(expected: string | null, actual: string | null): number {
    if (!expected || !actual) return 0;

    // 精确匹配
    if (expected.trim() === actual.trim()) return 1;

    // 关键词匹配
    const expectedKeywords = expected.split(/\s+/).filter(k => k.length > 2);
    const actualKeywords = actual.split(/\s+/).filter(k => k.length > 2);

    if (expectedKeywords.length === 0) return 0;

    const matchedKeywords = expectedKeywords.filter(k =>
      actualKeywords.some(ak => ak.includes(k) || k.includes(ak))
    );

    return matchedKeywords.length / expectedKeywords.length;
  }

  /**
   * 分析试跑结果
   */
  private analyzeResults(datasetId: string, results: TrialRunResult[]): ValidationReport {
    const totalCases = results.length;

    // 1. 难度分布分析
    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
    for (const r of results) {
      if (r.score >= 0.8) difficultyDistribution.easy++;
      else if (r.score >= 0.5) difficultyDistribution.medium++;
      else difficultyDistribution.hard++;
    }

    // 2. 覆盖度分析（基于标签/场景多样性）
    const uniqueInputs = new Set(results.map(r => r.input.toLowerCase().slice(0, 50)));
    const coverageScore = Math.min(1, uniqueInputs.size / totalCases);

    // 3. 区分度分析（得分方差）
    const scores = results.map(r => r.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const discriminationScore = Math.min(1, variance * 10); // 方差越大区分度越高

    // 4. 识别问题用例
    const problematicCases: ValidationReport['problematicCases'] = [];

    for (const r of results) {
      // 太简单（得分过高）
      if (r.score >= 0.95) {
        problematicCases.push({
          testCaseId: r.testCaseId,
          issue: 'too_easy',
          suggestion: '该用例过于简单，建议增加难度或移除',
        });
      }
      // 太难（得分过低）
      else if (r.score <= 0.1) {
        problematicCases.push({
          testCaseId: r.testCaseId,
          issue: 'too_hard',
          suggestion: '该用例难度过高，建议降低难度或检查预期输出',
        });
      }
      // 区分度低（得分在中间范围）
      else if (r.score >= 0.4 && r.score <= 0.6) {
        problematicCases.push({
          testCaseId: r.testCaseId,
          issue: 'low_discrimination',
          suggestion: '该用例区分度较低，建议调整以更好区分模型能力',
        });
      }
    }

    // 5. 生成建议
    const suggestions: string[] = [];

    if (difficultyDistribution.easy > totalCases * 0.5) {
      suggestions.push('数据集过于简单，建议增加中等和困难用例');
    }
    if (difficultyDistribution.hard > totalCases * 0.5) {
      suggestions.push('数据集过于困难，建议增加简单和中等用例');
    }
    if (coverageScore < 0.6) {
      suggestions.push('用例覆盖度较低，建议增加更多样化的测试场景');
    }
    if (discriminationScore < 0.3) {
      suggestions.push('数据集区分度较低，建议调整用例以更好区分模型能力');
    }
    if (problematicCases.length > totalCases * 0.3) {
      suggestions.push('问题用例较多，建议逐一审查并调整');
    }

    // 6. 综合质量分
    const overallQuality = (
      coverageScore * 0.3 +
      discriminationScore * 0.3 +
      (1 - problematicCases.length / totalCases) * 0.4
    );

    return {
      datasetId,
      totalCases,
      difficultyDistribution,
      coverageScore,
      discriminationScore,
      overallQuality,
      problematicCases,
      suggestions,
      status: 'draft',
    };
  }

  /**
   * 获取验证报告
   */
  async getValidationReport(datasetId: string): Promise<ValidationReport | null> {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      throw new NotFoundException(`数据集 ${datasetId} 不存在`);
    }

    if (!dataset.validationReport) {
      return null;
    }

    return JSON.parse(dataset.validationReport);
  }

  /**
   * 审批通过数据集
   */
  async approveDataset(datasetId: string): Promise<{ success: boolean; message: string }> {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      throw new NotFoundException(`数据集 ${datasetId} 不存在`);
    }

    if (!dataset.validationReport) {
      throw new BadRequestException('请先执行验证');
    }

    await this.prisma.dataset.update({
      where: { id: datasetId },
      data: { validationStatus: 'validated' },
    });

    return { success: true, message: '数据集已审批通过，可用于正式评测' };
  }

  /**
   * 审批拒绝数据集
   */
  async rejectDataset(datasetId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      throw new NotFoundException(`数据集 ${datasetId} 不存在`);
    }

    await this.prisma.dataset.update({
      where: { id: datasetId },
      data: { validationStatus: 'rejected' },
    });

    return { success: true, message: reason || '数据集已被拒绝' };
  }
}
