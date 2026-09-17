// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

interface EvalDimension {
  name: string;
  weight: number;
}

@Injectable()
export class EvalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 规则评测
   */
  async ruleEval(evalRunId: string) {
    const results = await this.prisma.evalResult.findMany({
      where: { evalRunId },
      include: { testCase: true },
    });

    for (const result of results) {
      const scores: Record<string, number> = {};

      // 精确匹配
      if (result.testCase.expectedOutput) {
        scores.exactMatch = result.actualOutput === result.testCase.expectedOutput ? 1 : 0;
      }

      // 关键词匹配
      if (result.testCase.metadata) {
        const meta = result.testCase.metadata as Record<string, any>;
        if (meta.keywords) {
          const matched = meta.keywords.filter((kw: string) =>
            result.actualOutput?.includes(kw),
          ).length;
          scores.keywordMatch = matched / meta.keywords.length;
        }
      }

      // 格式校验
      if (result.testCase.metadata) {
        const meta = result.testCase.metadata as Record<string, any>;
        if (meta.format === 'json') {
          try {
            JSON.parse(result.actualOutput || '');
            scores.formatCheck = 1;
          } catch {
            scores.formatCheck = 0;
          }
        }
      }

      await this.prisma.evalResult.update({
        where: { id: result.id },
        data: { scores: scores as any },
      });
    }

    return { evalRunId, type: 'rule', results: results.length };
  }

  /**
   * AI 评测
   */
  async aiEval(evalRunId: string, dimensions: EvalDimension[] = []) {
    const defaultDimensions: EvalDimension[] = [
      { name: '准确性', weight: 0.4 },
      { name: '完整性', weight: 0.3 },
      { name: '相关性', weight: 0.2 },
      { name: '安全性', weight: 0.1 },
    ];

    const dims = dimensions.length > 0 ? dimensions : defaultDimensions;

    const results = await this.prisma.evalResult.findMany({
      where: { evalRunId },
      include: { testCase: true },
    });

    for (const result of results) {
      const prompt = this.buildEvalPrompt(result.testCase.input, result.actualOutput || '', result.testCase.expectedOutput || '', dims);
      const scores = await this.callLLMForEval(prompt, dims);

      await this.prisma.evalResult.update({
        where: { id: result.id },
        data: { scores: { ...((result.scores as Record<string, any>) || {}), ai: scores } as any },
      });
    }

    return { evalRunId, type: 'ai', dimensions: dims, results: results.length };
  }

  /**
   * 指标评测
   */
  async metricsEval(evalRunId: string) {
    const results = await this.prisma.evalResult.findMany({ where: { evalRunId } });

    for (const result of results) {
      const metrics = (result.metrics as Record<string, any>) || {};
      const metricScores: Record<string, number> = {};

      // 响应时间评分（<1s 满分，>10s 0分）
      if (metrics.totalLatency) {
        metricScores.latencyScore = Math.max(0, 1 - (metrics.totalLatency - 1000) / 9000);
      }

      // 首 token 延迟评分
      if (metrics.ttft) {
        metricScores.ttftScore = Math.max(0, 1 - (metrics.ttft - 200) / 1800);
      }

      await this.prisma.evalResult.update({
        where: { id: result.id },
        data: { scores: { ...((result.scores as Record<string, any>) || {}), metrics: metricScores } as any },
      });
    }

    return { evalRunId, type: 'metrics', results: results.length };
  }

  private buildEvalPrompt(input: string, output: string, expected: string, dims: EvalDimension[]): string {
    return `请对以下回答进行评分（0-1分）：

问题：${input}
期望答案：${expected}
实际回答：${output}

评分维度：
${dims.map((d) => `- ${d.name}（权重${d.weight}）`).join('\n')}

请按 JSON 格式返回：
${JSON.stringify(Object.fromEntries(dims.map((d) => [d.name, 0.8])))}
`;
  }

  private async callLLMForEval(prompt: string, dims: EvalDimension[]): Promise<Record<string, number>> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // 模拟评分
      const scores: Record<string, number> = {};
      dims.forEach((d) => {
        scores[d.name] = Math.random() * 0.4 + 0.6;
      });
      return scores;
    }

    try {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        },
      );

      const content = response.data.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // 降级处理
    }

    const scores: Record<string, number> = {};
    dims.forEach((d) => {
      scores[d.name] = 0.7;
    });
    return scores;
  }
}
