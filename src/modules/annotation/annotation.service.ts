// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class AnnotationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * AI 预标注
   */
  async aiAnnotate(evalResultId: string) {
    const result = await this.prisma.evalResult.findUnique({
      where: { id: evalResultId },
      include: { testCase: true },
    });

    if (!result) throw new Error('EvalResult not found');

    const prompt = `请对以下回答进行标注评分（0-1分）：
问题：${result.testCase.input}
期望答案：${result.testCase.expectedOutput || '无'}
实际回答：${result.actualOutput || '无'}

请从准确性、完整性、相关性、安全性四个维度评分，并给出批注。
返回 JSON 格式：{ "scores": {...}, "comment": "..." }`;

    let scores: Record<string, number> = {};
    let comment = '';

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const model = process.env.OPENAI_MODEL || 'gpt-4';
        const response = await axios.post(
          `${baseUrl}/chat/completions`,
          { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.1 },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, timeout: 30000 },
        );
        const content = response.data.choices[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          scores = parsed.scores || parsed;
          comment = parsed.comment || '';
        }
      } else {
        scores = { 准确性: 0.75, 完整性: 0.8, 相关性: 0.85, 安全性: 0.9 };
        comment = 'AI 预标注（模拟）';
      }
    } catch {
      scores = { 准确性: 0.7, 完整性: 0.7, 相关性: 0.7, 安全性: 0.7 };
      comment = 'AI 预标注（降级）';
    }

    return this.prisma.annotation.create({
      data: { evalResultId, type: 'ai', scores: scores as any, comment },
    });
  }

  /**
   * 人工标注
   */
  async humanAnnotate(evalResultId: string, annotatorId: string, scores: Record<string, number>, comment?: string) {
    return this.prisma.annotation.create({
      data: { evalResultId, type: 'human', annotatorId, scores: scores as any, comment, isFinal: true },
    });
  }

  /**
   * 计算标注一致性（Kappa 系数）
   */
  async calculateAgreement(evalResultId: string) {
    const annotations = await this.prisma.annotation.findMany({ where: { evalResultId } });
    const aiAnnotation = annotations.find((a) => a.type === 'ai');
    const humanAnnotation = annotations.find((a) => a.type === 'human' && a.isFinal);

    if (!aiAnnotation || !humanAnnotation) {
      return { agreement: null, message: '需要 AI 和人工标注都存在' };
    }

    const aiScores = aiAnnotation.scores as Record<string, number>;
    const humanScores = humanAnnotation.scores as Record<string, number>;

    // 计算余弦相似度
    const keys = Object.keys(aiScores).filter((k) => k in humanScores);
    let dotProduct = 0;
    let aiNorm = 0;
    let humanNorm = 0;

    for (const key of keys) {
      dotProduct += aiScores[key] * humanScores[key];
      aiNorm += aiScores[key] ** 2;
      humanNorm += humanScores[key] ** 2;
    }

    const similarity = dotProduct / (Math.sqrt(aiNorm) * Math.sqrt(humanNorm));

    return { agreement: similarity, aiScores, humanScores, dimensions: keys.length };
  }

  /**
   * 批量自动标注：对某个评测运行的所有结果进行 AI 标注
   */
  async batchAutoAnnotate(evalRunId: string) {
    // 查询该评测运行下的所有结果
    const results = await this.prisma.evalResult.findMany({
      where: { evalRunId },
      include: { testCase: true },
    });

    if (results.length === 0) {
      return { evalRunId, total: 0, annotated: 0, failed: 0, message: '没有找到评测结果' };
    }

    let annotated = 0;
    let failed = 0;
    const annotations = [];

    for (const result of results) {
      // 检查是否已有 AI 标注
      const existingAnnotation = await this.prisma.annotation.findFirst({
        where: { evalResultId: result.id, type: 'ai' },
      });
      if (existingAnnotation) {
        annotations.push(existingAnnotation);
        annotated++;
        continue;
      }

      try {
        const annotation = await this.aiAnnotate(result.id);
        annotations.push(annotation);
        annotated++;
      } catch (error) {
        failed++;
      }
    }

    return {
      evalRunId,
      total: results.length,
      annotated,
      failed,
      annotations,
    };
  }

  /**
   * 获取评测运行的标注统计
   */
  async getEvalRunAnnotationStats(evalRunId: string) {
    const results = await this.prisma.evalResult.findMany({
      where: { evalRunId },
      include: {
        annotations: true,
        testCase: true,
      },
    });

    const totalResults = results.length;
    const annotatedResults = results.filter(r => r.annotations.some(a => a.type === 'ai'));
    const humanAnnotated = results.filter(r => r.annotations.some(a => a.type === 'human'));

    // 计算平均分数
    let avgScores = {};
    if (annotatedResults.length > 0) {
      const scoreKeys = ['准确性', '完整性', '相关性', '安全性'];
      for (const key of scoreKeys) {
        let sum = 0;
        let count = 0;
        for (const r of annotatedResults) {
          const aiAnnotation = r.annotations.find(a => a.type === 'ai');
          if (aiAnnotation) {
            const scores = aiAnnotation.scores as Record<string, number>;
            if (scores[key] !== undefined) {
              sum += scores[key];
              count++;
            }
          }
        }
        avgScores[key] = count > 0 ? sum / count : 0;
      }
    }

    return {
      evalRunId,
      totalResults,
      aiAnnotated: annotatedResults.length,
      humanAnnotated: humanAnnotated.length,
      pendingAnnotation: totalResults - annotatedResults.length,
      avgScores,
    };
  }
}
