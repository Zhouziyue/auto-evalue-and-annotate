// @ts-nocheck
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

// RAG 评测指标类型
export enum RAGMetricType {
  CONTEXT_PRECISION = 'context_precision',     // 上下文精度
  CONTEXT_RECALL = 'context_recall',           // 上下文召回
  NOISE_SENSITIVITY = 'noise_sensitivity',     // 噪声敏感度
  FAITHFULNESS = 'faithfulness',               // 忠实度
  ANSWER_RELEVANCY = 'answer_relevancy',       // 答案相关性
}

export interface RAGEvalInput {
  question: string;            // 用户问题
  answer: string;              // 模型回答
  contexts: string[];          // 检索到的上下文
  groundTruth?: string;        // 标准答案（可选）
}

export interface RAGMetricResult {
  metric: RAGMetricType;
  score: number;
  reason: string;
  details?: any;
}

@Injectable()
export class RAGMetricsService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  // 运行所有 RAG 指标
  async runAllMetrics(input: RAGEvalInput): Promise<RAGMetricResult[]> {
    const results: RAGMetricResult[] = [];
    
    const metrics = [
      this.evaluateContextPrecision.bind(this),
      this.evaluateContextRecall.bind(this),
      this.evaluateFaithfulness.bind(this),
      this.evaluateAnswerRelevancy.bind(this),
      this.evaluateNoiseSensitivity.bind(this),
    ];

    for (const metricFn of metrics) {
      try {
        const result = await metricFn(input);
        results.push(result);
      } catch (e) {
        console.error(`RAG metric ${metricFn.name} failed:`, e);
      }
    }

    return results;
  }

  // Context Precision：检索的上下文中有多少是真正有用的
  async evaluateContextPrecision(input: RAGEvalInput): Promise<RAGMetricResult> {
    if (!input.contexts || input.contexts.length === 0) {
      return {
        metric: RAGMetricType.CONTEXT_PRECISION,
        score: 0,
        reason: '未提供上下文',
      };
    }

    const contexts = input.contexts.map((c, i) => `[上下文${i + 1}] ${c}`).join('\n\n');
    
    const prompt = `你是一个RAG评测专家。请评估检索到的上下文对于回答问题的精度。

问题：${input.question}

${input.groundTruth ? `标准答案：${input.groundTruth}\n` : ''}
检索到的上下文：
${contexts}

请逐一评估每个上下文片段是否对回答问题有帮助。

评分标准：
- 1.0：完全相关且包含回答问题所需的全部信息
- 0.7：大部分相关，包含部分有用信息
- 0.4：部分相关，但有用信息有限
- 0.1：几乎不相关
- 0.0：完全不相关或误导

请以JSON格式返回：
{
  "verdicts": [
    {"contextId": 1, "verdict": 1/0.7/0.4/0.1/0, "reason": "理由"},
    ...
  ],
  "score": 平均精度分数,
  "reason": "总体评价理由"
}`;

    const result = await this.callLLM(prompt);
    return {
      metric: RAGMetricType.CONTEXT_PRECISION,
      score: result.score,
      reason: result.reason,
      details: { verdicts: result.verdicts },
    };
  }

  // Context Recall：标准答案中的信息有多少能在上下文中找到
  async evaluateContextRecall(input: RAGEvalInput): Promise<RAGMetricResult> {
    if (!input.groundTruth || !input.contexts || input.contexts.length === 0) {
      return {
        metric: RAGMetricType.CONTEXT_RECALL,
        score: 0,
        reason: '需要提供标准答案和上下文',
      };
    }

    const contexts = input.contexts.join('\n\n');
    
    const prompt = `你是一个RAG评测专家。请评估检索到的上下文对标准答案的召回率。

问题：${input.question}

标准答案：${input.groundTruth}

检索到的上下文：
${contexts}

请分析标准答案中的每个关键信息点，判断是否能在上下文中找到支持。

评分标准：
- 列出标准答案中的所有关键信息点
- 对每个信息点判断：能否在上下文中找到支持
- 最终分数 = 能找到支持的信息点数 / 总信息点数

请以JSON格式返回：
{
  "keyPoints": ["信息点1", "信息点2", ...],
  "supportedPoints": ["被支持的信息点1", ...],
  "score": 召回率分数,
  "reason": "总体评价理由"
}`;

    const result = await this.callLLM(prompt);
    return {
      metric: RAGMetricType.CONTEXT_RECALL,
      score: result.score,
      reason: result.reason,
      details: { 
        keyPoints: result.keyPoints,
        supportedPoints: result.supportedPoints,
      },
    };
  }

  // Faithfulness：回答是否忠实于上下文
  async evaluateFaithfulness(input: RAGEvalInput): Promise<RAGMetricResult> {
    const contexts = input.contexts?.join('\n\n') || '无提供上下文';
    
    const prompt = `你是一个RAG评测专家。请评估回答是否忠实于提供的上下文。

问题：${input.question}

上下文：
${contexts}

回答：${input.answer}

请检查回答中的每个事实性陈述，判断是否能在上下文中找到依据。

评分标准：
1. 列出回答中的所有事实性陈述（claims）
2. 对每个陈述判断：能否在上下文中找到支持
3. 最终分数 = 有依据的陈述数 / 总陈述数

注意：
- 如果回答编造了上下文中不存在的信息，应扣分
- 如果回答正确引用了上下文信息，应加分

请以JSON格式返回：
{
  "claims": [
    {"statement": "陈述内容", "supported": true/false, "evidence": "证据或说明"},
    ...
  ],
  "score": 忠实度分数,
  "reason": "总体评价理由"
}`;

    const result = await this.callLLM(prompt);
    return {
      metric: RAGMetricType.FAITHFULNESS,
      score: result.score,
      reason: result.reason,
      details: { claims: result.claims },
    };
  }

  // Answer Relevancy：回答与问题的相关性
  async evaluateAnswerRelevancy(input: RAGEvalInput): Promise<RAGMetricResult> {
    const prompt = `你是一个RAG评测专家。请评估回答与问题的相关性。

问题：${input.question}

回答：${input.answer}

请从以下维度评估：
1. 回答是否直接针对问题
2. 回答内容是否与问题主题相关
3. 是否包含无关信息
4. 回答的完整程度

评分标准：
- 1.0：完全相关，直接回答问题
- 0.7：大部分相关，略有偏离
- 0.4：部分相关，包含较多无关信息
- 0.1：几乎不相关
- 0.0：完全不相关

请以JSON格式返回：
{
  "score": 相关性分数,
  "reason": "评价理由"
}`;

    const result = await this.callLLM(prompt);
    return {
      metric: RAGMetricType.ANSWER_RELEVANCY,
      score: result.score,
      reason: result.reason,
    };
  }

  // Noise Sensitivity：对噪声上下文的敏感度
  async evaluateNoiseSensitivity(input: RAGEvalInput): Promise<RAGMetricResult> {
    if (!input.contexts || input.contexts.length === 0) {
      return {
        metric: RAGMetricType.NOISE_SENSITIVITY,
        score: 0.5,
        reason: '未提供上下文，无法评估',
      };
    }

    const contexts = input.contexts.join('\n\n');
    
    const prompt = `你是一个RAG评测专家。请评估回答在存在噪声上下文时的表现。

问题：${input.question}

上下文（包含相关和不相关信息）：
${contexts}

回答：${input.answer}

请评估：
1. 回答是否正确识别并使用了相关上下文
2. 回答是否被不相关的上下文误导
3. 回答是否忽略了噪声信息

评分标准：
- 1.0：完全不受噪声影响，准确使用相关信息
- 0.7：基本不受影响，略有偏差
- 0.4：受到一定影响，部分信息被噪声误导
- 0.1：严重受噪声影响
- 0.0：完全被噪声误导

请以JSON格式返回：
{
  "score": 敏感度分数（越低表示越容易被噪声影响）,
  "reason": "评价理由"
}`;

    const result = await this.callLLM(prompt);
    return {
      metric: RAGMetricType.NOISE_SENSITIVITY,
      score: result.score,
      reason: result.reason,
    };
  }

  // 调用 LLM
  private async callLLM(prompt: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // 尝试解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          parsed.score = Math.max(0, Math.min(1, parseFloat(parsed.score) || 0));
          return parsed;
        } catch {
          // JSON 解析失败
        }
      }

      // 尝试提取分数
      const scoreMatch = content.match(/score["\s:]+(\d+\.?\d*)/i);
      if (scoreMatch) {
        return {
          score: Math.max(0, Math.min(1, parseFloat(scoreMatch[1]) || 0.5)),
          reason: content.slice(0, 300),
        };
      }

      return { score: 0.5, reason: '无法解析评测结果' };
    } catch (e) {
      console.error('LLM call failed:', e);
      return { score: 0, reason: `评测调用失败: ${e.message}` };
    }
  }
}
