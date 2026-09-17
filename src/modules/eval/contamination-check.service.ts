// @ts-nocheck
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

// 污染检测结果
export interface ContaminationResult {
  datasetId: string;
  datasetName: string;
  totalSamples: number;
  contaminatedSamples: number;
  contaminationRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: ContaminationDetail[];
  summary: string;
  checkedAt: Date;
}

export interface ContaminationDetail {
  sampleId: string;
  sampleInput: string;
  modelOutput: string;
  similarityScore: number;
  isContaminated: boolean;
  reason: string;
}

// 污染检测配置
export interface ContaminationCheckConfig {
  datasetId: string;
  datasetName: string;
  samples: { id: string; input: string; expectedOutput?: string }[];
  modelName: string;
  threshold?: number;         // 相似度阈值，默认 0.8
  checkMethod?: 'exact' | 'semantic' | 'both';  // 检测方法
}

@Injectable()
export class ContaminationCheckService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  // 运行污染检测
  async checkContamination(config: ContaminationCheckConfig): Promise<ContaminationResult> {
    const threshold = config.threshold || 0.8;
    const method = config.checkMethod || 'both';
    const details: ContaminationDetail[] = [];

    for (const sample of config.samples) {
      const detail = await this.checkSample(sample, config.modelName, method, threshold);
      details.push(detail);
    }

    const contaminatedSamples = details.filter(d => d.isContaminated).length;
    const contaminationRate = contaminatedSamples / config.samples.length;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (contaminationRate >= 0.5) riskLevel = 'critical';
    else if (contaminationRate >= 0.3) riskLevel = 'high';
    else if (contaminationRate >= 0.1) riskLevel = 'medium';
    else riskLevel = 'low';

    const summary = this.generateSummary(config.datasetName, contaminationRate, riskLevel, details);

    return {
      datasetId: config.datasetId,
      datasetName: config.datasetName,
      totalSamples: config.samples.length,
      contaminatedSamples,
      contaminationRate,
      riskLevel,
      details,
      summary,
      checkedAt: new Date(),
    };
  }

  // 检测单个样本
  private async checkSample(
    sample: { id: string; input: string; expectedOutput?: string },
    modelName: string,
    method: string,
    threshold: number,
  ): Promise<ContaminationDetail> {
    let similarityScore = 0;
    let modelOutput = '';

    try {
      // 获取模型回答
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: sample.input }],
        temperature: 0.1,  // 低温度以获得确定性输出
        max_tokens: 2000,
      });

      modelOutput = response.choices[0]?.message?.content || '';

      // 精确匹配检测
      if (method === 'exact' || method === 'both') {
        if (sample.expectedOutput) {
          const exactScore = this.calculateExactSimilarity(modelOutput, sample.expectedOutput);
          similarityScore = Math.max(similarityScore, exactScore);
        }
      }

      // 语义相似度检测
      if (method === 'semantic' || method === 'both') {
        if (sample.expectedOutput) {
          const semanticScore = await this.calculateSemanticSimilarity(
            modelOutput,
            sample.expectedOutput,
          );
          similarityScore = Math.max(similarityScore, semanticScore);
        }
      }

      // 如果没有期望输出，使用 LLM 判断是否过度拟合
      if (!sample.expectedOutput) {
        const overfitCheck = await this.checkOverfitting(sample.input, modelOutput);
        similarityScore = overfitCheck.score;
      }
    } catch (e) {
      return {
        sampleId: sample.id,
        sampleInput: sample.input.slice(0, 200),
        modelOutput: '',
        similarityScore: 0,
        isContaminated: false,
        reason: `检测失败: ${e.message}`,
      };
    }

    const isContaminated = similarityScore >= threshold;

    return {
      sampleId: sample.id,
      sampleInput: sample.input.slice(0, 200),
      modelOutput: modelOutput.slice(0, 500),
      similarityScore,
      isContaminated,
      reason: isContaminated
        ? `模型输出与期望答案高度相似（${(similarityScore * 100).toFixed(1)}%），可能存在数据泄露`
        : `相似度 ${(similarityScore * 100).toFixed(1)}%，在正常范围内`,
    };
  }

  // 计算精确相似度
  private calculateExactSimilarity(output: string, expected: string): number {
    // 去除空白和标点
    const cleanOutput = output.replace(/\s+/g, ' ').trim().toLowerCase();
    const cleanExpected = expected.replace(/\s+/g, ' ').trim().toLowerCase();

    // 完全匹配
    if (cleanOutput === cleanExpected) return 1.0;

    // 包含匹配
    if (cleanOutput.includes(cleanExpected) || cleanExpected.includes(cleanOutput)) {
      const shorter = Math.min(cleanOutput.length, cleanExpected.length);
      const longer = Math.max(cleanOutput.length, cleanExpected.length);
      return shorter / longer;
    }

    // 词级 Jaccard 相似度
    const wordsOutput = new Set(cleanOutput.split(/\s+/));
    const wordsExpected = new Set(cleanExpected.split(/\s+/));
    const intersection = new Set([...wordsOutput].filter(w => wordsExpected.has(w)));
    const union = new Set([...wordsOutput, ...wordsExpected]);
    
    return intersection.size / union.size;
  }

  // 计算语义相似度（使用 LLM 判断）
  private async calculateSemanticSimilarity(output: string, expected: string): Promise<number> {
    const prompt = `请判断以下两段文本在语义上的相似程度。

文本A（模型输出）：
${output}

文本B（期望答案）：
${expected}

请评估：
1. 核心意思是否相同
2. 关键信息是否一致
3. 是否存在过度匹配（模型可能记住了标准答案）

请返回0-1的相似度分数，1表示完全相同。

请以JSON格式返回：{"score": 0.85, "reason": "判断理由"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Math.max(0, Math.min(1, parseFloat(parsed.score) || 0));
      }
    } catch (e) {
      console.error('Semantic similarity check failed:', e);
    }

    return 0.5;
  }

  // 检查过拟合（没有标准答案时）
  private async checkOverfitting(input: string, output: string): Promise<{ score: number }> {
    const prompt = `请判断以下AI回答是否可能是"记忆"了训练数据中的标准答案（过拟合），而不是真正理解了问题。

问题：${input}

AI回答：${output}

请从以下角度判断：
1. 回答是否过于"完美"，像是直接背诵
2. 回答是否缺乏推理过程
3. 回答的措辞是否像教科书/标准答案
4. 是否存在不自然的精确性

返回0-1的过拟合可能性分数，1表示很可能是记忆/过拟合。

请以JSON格式返回：{"score": 0.3, "reason": "判断理由"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { score: Math.max(0, Math.min(1, parseFloat(parsed.score) || 0)) };
      }
    } catch (e) {
      console.error('Overfitting check failed:', e);
    }

    return { score: 0.5 };
  }

  // 生成摘要
  private generateSummary(
    datasetName: string,
    contaminationRate: number,
    riskLevel: string,
    details: ContaminationDetail[],
  ): string {
    const ratePercent = (contaminationRate * 100).toFixed(1);
    
    const riskDescriptions = {
      low: '数据污染风险较低，评测结果可信度高',
      medium: '存在一定数据污染风险，建议关注评测结果的可靠性',
      high: '数据污染风险较高，评测结果可能不够客观',
      critical: '数据污染风险极高，评测结果可信度很低，建议更换评测数据集',
    };

    return `数据集"${datasetName}"的污染率为 ${ratePercent}%。${riskDescriptions[riskLevel] || ''}`;
  }
}
