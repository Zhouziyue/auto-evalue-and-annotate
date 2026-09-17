// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class FixerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * AI 诊断问题并生成修复建议
   */
  async diagnose(evalResultId: string) {
    const result = await this.prisma.evalResult.findUnique({
      where: { id: evalResultId },
      include: { testCase: true },
    });

    if (!result) throw new Error('EvalResult not found');

    const prompt = `请分析以下评测结果的问题根因，并给出修复建议：

问题：${result.testCase.input}
期望答案：${result.testCase.expectedOutput || '无'}
实际回答：${result.actualOutput || '无'}
错误信息：${result.errorMessage || '无'}
评分：${JSON.stringify(result.scores)}

请分析：
1. 问题根因（prompt问题/模型能力/知识缺失/格式错误）
2. 修复建议（改写prompt/补充知识/调整参数）
3. 具体修复内容

返回 JSON：{ "diagnosis": "...", "suggestion": "...", "fixType": "prompt|knowledge|parameter", "fixContent": {...} }`;

    let diagnosis = '';
    let suggestion = '';
    let fixType = 'prompt';
    let fixContent: Record<string, any> = {};

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const response = await axios.post(
          `${baseUrl}/chat/completions`,
          { model: 'gpt-4', messages: [{ role: 'user', content: prompt }], temperature: 0.3 },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, timeout: 30000 },
        );
        const content = response.data.choices[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          diagnosis = parsed.diagnosis || '';
          suggestion = parsed.suggestion || '';
          fixType = parsed.fixType || 'prompt';
          fixContent = parsed.fixContent || {};
        }
      } else {
        diagnosis = 'AI 诊断（模拟）：回答不够准确，可能缺少关键信息';
        suggestion = '建议在 prompt 中增加更明确的约束条件';
        fixType = 'prompt';
        fixContent = { original: '', suggested: '优化后的 prompt' };
      }
    } catch {
      diagnosis = '诊断失败';
      suggestion = '请人工检查';
    }

    return this.prisma.fixRecord.create({
      data: {
        evalResultId,
        diagnosis,
        suggestion,
        fixType,
        fixContent: fixContent as any,
      },
    });
  }

  /**
   * 应用修复
   */
  async applyFix(fixRecordId: string) {
    const record = await this.prisma.fixRecord.findUnique({ where: { id: fixRecordId } });
    if (!record) throw new Error('FixRecord not found');

    return this.prisma.fixRecord.update({
      where: { id: fixRecordId },
      data: { appliedAt: new Date() },
    });
  }

  /**
   * 验证修复效果
   */
  async verifyFix(fixRecordId: string, newEvalResultId: string) {
    const record = await this.prisma.fixRecord.findUnique({ where: { id: fixRecordId } });
    if (!record) throw new Error('FixRecord not found');

    const newResult = await this.prisma.evalResult.findUnique({ where: { id: newEvalResultId } });
    if (!newResult) throw new Error('New EvalResult not found');

    // 比较新旧评分
    const oldScores = (record as any).scores || {};
    const newScores = (newResult.scores as Record<string, number>) || {};

    const improved = Object.keys(newScores).some((k) => newScores[k] > (oldScores[k] || 0));

    return this.prisma.fixRecord.update({
      where: { id: fixRecordId },
      data: { verified: improved },
    });
  }
}
