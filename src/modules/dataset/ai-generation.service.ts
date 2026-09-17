// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SelectAnswerDto } from './dataset.dto';
import axios from 'axios';

export interface CandidateAnswer {
  text: string;
  style: string;
  scores: { accuracy: number; completeness: number; quality: number };
}

@Injectable()
export class AiGenerationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * AI 生成 3 个候选标准答案
   */
  async generateCandidates(input: string, context?: string) {
    const prompt = this.buildGenerationPrompt(input, context);

    try {
      const response = await this.callLLM(prompt);
      const candidates = this.parseCandidates(response);

      // AI 智能优选：推荐最优答案
      const recommendation = this.recommendBest(candidates);

      // 保存生成记录
      const record = await this.prisma.generationRecord.create({
        data: {
          testCaseId: '', // 关联用例ID（选择后创建）
          input,
          candidates: candidates as any,
          aiRecommendation: recommendation,
        },
      });

      return {
        generationId: record.id,
        input,
        candidates,
        recommendation,
      };
    } catch (error: any) {
      throw new Error(`AI 生成失败: ${error.message}`);
    }
  }

  /**
   * 批量生成
   */
  async batchGenerate(inputs: string[]) {
    const results = [];
    for (const input of inputs) {
      try {
        const result = await this.generateCandidates(input);
        results.push(result);
      } catch (error: any) {
        results.push({ input, error: error.message });
      }
    }
    return results;
  }

  /**
   * 人工选择/修正答案
   */
  async selectAnswer(dto: SelectAnswerDto) {
    const record = await this.prisma.generationRecord.findUnique({
      where: { id: dto.generationId },
    });

    if (!record) throw new Error('生成记录不存在');

    let finalOutput: string;

    if (dto.customAnswer) {
      // 人工修正
      finalOutput = dto.customAnswer;
    } else if (dto.selectedIndex !== undefined) {
      // 选择候选答案
      const candidates = record.candidates as CandidateAnswer[];
      finalOutput = candidates[dto.selectedIndex]?.text || '';
    } else {
      throw new Error('请选择答案或提供自定义答案');
    }

    // 创建用例
    const testCase = await this.prisma.testCase.create({
      data: {
        datasetId: '', // 需要传入
        input: record.input,
        expectedOutput: finalOutput,
        difficulty: 'medium',
      },
    });

    // 更新生成记录
    await this.prisma.generationRecord.update({
      where: { id: dto.generationId },
      data: {
        testCaseId: testCase.id,
        selectedIndex: dto.selectedIndex,
        finalOutput,
      },
    });

    return { testCase, finalOutput };
  }

  private buildGenerationPrompt(input: string, context?: string): string {
    let prompt = `请为以下问题生成 3 个不同风格的标准答案：

问题：${input}
`;

    if (context) {
      prompt += `\n上下文：${context}\n`;
    }

    prompt += `
要求：
1. 生成 3 个答案，分别采用不同风格（简洁型、详细型、结构化）
2. 每个答案要准确、完整、表达清晰
3. 按以下 JSON 格式返回：

{
  "candidates": [
    { "text": "答案内容", "style": "简洁型" },
    { "text": "答案内容", "style": "详细型" },
    { "text": "答案内容", "style": "结构化" }
  ]
}
`;
    return prompt;
  }

  private async callLLM(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      // 模拟返回（开发环境）
      return JSON.stringify({
        candidates: [
          { text: `简洁答案：这是针对"${prompt.slice(0, 30)}..."的简洁回答`, style: '简洁型' },
          { text: `详细答案：这是针对"${prompt.slice(0, 30)}..."的详细回答，包含更多解释和背景信息`, style: '详细型' },
          { text: `结构化答案：\n1. 要点一\n2. 要点二\n3. 要点三`, style: '结构化' },
        ],
      });
    }

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      },
    );

    return response.data.choices[0]?.message?.content || '';
  }

  private parseCandidates(response: string): CandidateAnswer[] {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.candidates) {
          return parsed.candidates.map((c: any, i: number) => ({
            text: c.text || '',
            style: c.style || `风格${i + 1}`,
            scores: {
              accuracy: Math.random() * 0.3 + 0.7, // 模拟评分
              completeness: Math.random() * 0.3 + 0.7,
              quality: Math.random() * 0.3 + 0.7,
            },
          }));
        }
      }
    } catch {
      // 解析失败，返回默认
    }

    return [
      { text: response.slice(0, 200), style: '默认', scores: { accuracy: 0.7, completeness: 0.7, quality: 0.7 } },
      { text: response.slice(0, 200), style: '默认', scores: { accuracy: 0.7, completeness: 0.7, quality: 0.7 } },
      { text: response.slice(0, 200), style: '默认', scores: { accuracy: 0.7, completeness: 0.7, quality: 0.7 } },
    ];
  }

  private recommendBest(candidates: CandidateAnswer[]): number {
    let bestIndex = 0;
    let bestScore = 0;

    candidates.forEach((c, i) => {
      const score = (c.scores.accuracy + c.scores.completeness + c.scores.quality) / 3;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    return bestIndex;
  }
}
