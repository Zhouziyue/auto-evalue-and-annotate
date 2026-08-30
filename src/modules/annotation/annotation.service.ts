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
        const response = await axios.post(
          `${baseUrl}/chat/completions`,
          { model: 'gpt-4', messages: [{ role: 'user', content: prompt }], temperature: 0.1 },
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
}
