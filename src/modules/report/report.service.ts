// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成评测报告
   */
  async generateReport(evalRunId: string) {
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: {
        results: { include: { testCase: true, annotations: true } },
        skill: true,
        endpoint: true,
      },
    });

    if (!evalRun) throw new Error('EvalRun not found');

    const totalCases = evalRun.results.length;
    const passedCases = evalRun.results.filter((r) => r.status === 'passed').length;
    const failedCases = totalCases - passedCases;
    const passRate = totalCases > 0 ? passedCases / totalCases : 0;

    // 聚合评分
    const allScores: Record<string, number[]> = {};
    for (const result of evalRun.results) {
      const scores = (result.scores as Record<string, number>) || {};
      for (const [key, value] of Object.entries(scores)) {
        if (typeof value === 'number') {
          if (!allScores[key]) allScores[key] = [];
          allScores[key].push(value);
        }
      }
    }

    const avgScores: Record<string, number> = {};
    for (const [key, values] of Object.entries(allScores)) {
      avgScores[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    // 性能指标
    const latencies = evalRun.results
      .map((r) => ((r.metrics as Record<string, any>)?.totalLatency || 0))
      .filter((l) => l > 0);
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    return {
      evalRunId,
      skillName: evalRun.skill.name,
      endpointName: evalRun.endpoint.name,
      totalCases,
      passedCases,
      failedCases,
      passRate,
      avgScores,
      avgLatency,
      startTime: evalRun.startTime,
      endTime: evalRun.endTime,
      badCases: evalRun.results.filter((r) => r.status === 'failed').map((r) => ({
        id: r.id,
        input: r.testCase.input,
        actualOutput: r.actualOutput,
        expectedOutput: r.testCase.expectedOutput,
        scores: r.scores,
      })),
    };
  }

  /**
   * AI 智能统计分析
   */
  async aiAnalysis(evalRunId: string) {
    const report = await this.generateReport(evalRunId);

    const prompt = `请对以下评测结果进行深度分析：

技能：${report.skillName}
总用例数：${report.totalCases}
通过率：${(report.passRate * 100).toFixed(1)}%
平均评分：${JSON.stringify(report.avgScores)}
平均延迟：${report.avgLatency.toFixed(0)}ms

Bad Cases（前5个）：
${report.badCases.slice(0, 5).map((c: any) => `- 输入: ${c.input}\n  输出: ${c.actualOutput?.slice(0, 100)}`).join('\n')}

请分析：
1. 失败模式聚类（归纳失败原因类别）
2. 能力画像（擅长什么、弱项在哪）
3. 改进建议（优先级排序）
4. 自然语言总结`;

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const model = process.env.OPENAI_MODEL || 'gpt-4';
        const response = await axios.post(
          `${baseUrl}/chat/completions`,
          { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, timeout: 60000 },
        );
        return { analysis: response.data.choices[0]?.message?.content || '', report };
      }
    } catch {
      // 降级处理
    }

    return {
      analysis: `评测通过率 ${(report.passRate * 100).toFixed(1)}%，共 ${report.totalCases} 个用例，${report.failedCases} 个失败。`,
      report,
    };
  }

  /**
   * 看板数据
   */
  async getDashboard() {
    const recentRuns = await this.prisma.evalRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { skill: true },
    });

    const totalSkills = await this.prisma.skill.count();
    const totalDatasets = await this.prisma.dataset.count();
    const totalTestCases = await this.prisma.testCase.count();

    return {
      overview: {
        totalSkills,
        totalDatasets,
        totalTestCases,
        recentRuns: recentRuns.length,
      },
      recentRuns: recentRuns.map((r) => ({
        id: r.id,
        skillName: r.skill.name,
        status: r.status,
        passRate: r.totalCases > 0 ? r.passedCases / r.totalCases : 0,
        createdAt: r.createdAt,
      })),
    };
  }
}
