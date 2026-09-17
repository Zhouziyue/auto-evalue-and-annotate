// @ts-nocheck
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

// 多模态评测类型
export enum MultimodalEvalType {
  IMAGE_CAPTION = 'image_caption',         // 图像描述
  IMAGE_QA = 'image_qa',                   // 图像问答
  IMAGE_CLASSIFICATION = 'image_classification', // 图像分类
  VISUAL_GROUNDING = 'visual_grounding',   // 视觉定位
  AUDIO_TRANSCRIPTION = 'audio_transcription', // 音频转写
  AUDIO_QA = 'audio_qa',                   // 音频问答
}

// 多模态评测输入
export interface MultimodalEvalInput {
  type: MultimodalEvalType;
  input: string;              // 文本输入（问题/指令）
  mediaUrl?: string;          // 媒体 URL
  mediaBase64?: string;       // 媒体 Base64
  expectedOutput?: string;    // 期望输出
  context?: string;           // 上下文
}

// 多模态评测结果
export interface MultimodalEvalResult {
  type: MultimodalEvalType;
  output: string;
  metrics: {
    bleu?: number;
    rouge?: number;
    clipScore?: number;
    accuracy?: number;
    relevance?: number;
  };
  latency: number;
  createdAt: Date;
}

@Injectable()
export class MultimodalEvalService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  // 运行多模态评测
  async runMultimodalEval(input: MultimodalEvalInput): Promise<MultimodalEvalResult> {
    const startTime = Date.now();
    let output = '';

    try {
      switch (input.type) {
        case MultimodalEvalType.IMAGE_CAPTION:
        case MultimodalEvalType.IMAGE_QA:
          output = await this.evalImageTask(input);
          break;
        case MultimodalEvalType.AUDIO_TRANSCRIPTION:
        case MultimodalEvalType.AUDIO_QA:
          output = await this.evalAudioTask(input);
          break;
        default:
          output = await this.evalTextTask(input);
      }
    } catch (e) {
      output = `Error: ${e.message}`;
    }

    const latency = Date.now() - startTime;
    const metrics = await this.calculateMetrics(input, output);

    return {
      type: input.type,
      output,
      metrics,
      latency,
      createdAt: new Date(),
    };
  }

  // 图像任务评测
  private async evalImageTask(input: MultimodalEvalInput): Promise<string> {
    const messages: any[] = [];

    if (input.mediaUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: input.input },
          { type: 'image_url', image_url: { url: input.mediaUrl } },
        ],
      });
    } else if (input.mediaBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: input.input },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${input.mediaBase64}` } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: input.input });
    }

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  }

  // 音频任务评测
  private async evalAudioTask(input: MultimodalEvalInput): Promise<string> {
    // 简化版：使用文本模拟
    const prompt = `这是一个音频评测任务。
    
任务描述：${input.input}
${input.context ? `上下文：${input.context}` : ''}

请根据任务描述给出回答。`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  }

  // 文本任务评测
  private async evalTextTask(input: MultimodalEvalInput): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: input.input }],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  }

  // 计算评测指标
  private async calculateMetrics(
    input: MultimodalEvalInput,
    output: string,
  ): Promise<MultimodalEvalResult['metrics']> {
    const metrics: MultimodalEvalResult['metrics'] = {};

    if (input.expectedOutput) {
      // BLEU 分数（简化版）
      metrics.bleu = this.calculateBLEU(output, input.expectedOutput);
      
      // 相关性评分
      metrics.relevance = await this.evaluateRelevance(input.input, output, input.expectedOutput);
    }

    // 图像描述评测
    if (input.type === MultimodalEvalType.IMAGE_CAPTION && input.mediaUrl) {
      metrics.clipScore = await this.calculateCLIPScore(input.mediaUrl, output);
    }

    return metrics;
  }

  // 简化版 BLEU 计算
  private calculateBLEU(output: string, reference: string): number {
    const outputWords = output.toLowerCase().split(/\s+/);
    const refWords = reference.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of outputWords) {
      if (refWords.includes(word)) matches++;
    }
    
    const precision = outputWords.length > 0 ? matches / outputWords.length : 0;
    const recall = refWords.length > 0 ? matches / refWords.length : 0;
    
    if (precision + recall === 0) return 0;
    return 2 * (precision * recall) / (precision + recall);
  }

  // 评估相关性
  private async evaluateRelevance(input: string, output: string, expected: string): Promise<number> {
    const prompt = `请评估以下回答与期望答案的相关性。

输入：${input}
回答：${output}
期望答案：${expected}

请给出0-1的相关性分数。
以JSON格式返回：{"score": 0.85}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content || '';
      const match = content.match(/"score"[:\s]*(\d+\.?\d*)/);
      if (match) return Math.max(0, Math.min(1, parseFloat(match[1])));
    } catch (e) {
      console.error('Relevance evaluation failed:', e);
    }

    return 0.5;
  }

  // 计算 CLIP Score（简化版，实际应使用 CLIP 模型）
  private async calculateCLIPScore(imageUrl: string, caption: string): Promise<number> {
    // 这里是模拟实现，实际应调用 CLIP 模型
    const prompt = `请评估以下图像描述的质量。

图像URL：${imageUrl}
描述：${caption}

请给出0-1的CLIP Score。
以JSON格式返回：{"score": 0.75}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content || '';
      const match = content.match(/"score"[:\s]*(\d+\.?\d*)/);
      if (match) return Math.max(0, Math.min(1, parseFloat(match[1])));
    } catch (e) {
      console.error('CLIP Score calculation failed:', e);
    }

    return 0.5;
  }
}
