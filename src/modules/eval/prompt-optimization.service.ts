// @ts-nocheck
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

// 优化策略
export enum OptimizationStrategy {
  ITERATIVE = 'iterative',           // 迭代优化
  GENETIC = 'genetic',               // 遗传算法
  GRADIENT = 'gradient',             // 梯度优化（DSPy 风格）
  META_PROMPT = 'meta_prompt',       // 元提示优化
}

// 优化配置
export interface OptimizationConfig {
  strategy: OptimizationStrategy;
  maxIterations: number;
  targetMetric: string;
  targetScore: number;
  temperature?: number;
  examples?: Array<{ input: string; expectedOutput: string }>;
}

// 优化结果
export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  iterations: number;
  scoreHistory: number[];
  finalScore: number;
  improvement: number;
  strategy: OptimizationStrategy;
  optimizationLog: Array<{
    iteration: number;
    prompt: string;
    score: number;
    feedback: string;
  }>;
}

@Injectable()
export class PromptOptimizationService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  // 优化 Prompt
  async optimizePrompt(
    prompt: string,
    config: OptimizationConfig,
  ): Promise<OptimizationResult> {
    switch (config.strategy) {
      case OptimizationStrategy.ITERATIVE:
        return this.iterativeOptimize(prompt, config);
      case OptimizationStrategy.META_PROMPT:
        return this.metaPromptOptimize(prompt, config);
      default:
        return this.iterativeOptimize(prompt, config);
    }
  }

  // 迭代优化
  private async iterativeOptimize(
    prompt: string,
    config: OptimizationConfig,
  ): Promise<OptimizationResult> {
    const maxIterations = config.maxIterations || 5;
    const scoreHistory: number[] = [];
    const optimizationLog: OptimizationResult['optimizationLog'] = [];
    
    let currentPrompt = prompt;
    let currentScore = await this.evaluatePrompt(currentPrompt, config);
    scoreHistory.push(currentScore);
    let bestPrompt = currentPrompt;
    let bestScore = currentScore;

    for (let i = 0; i < maxIterations; i++) {
      // 生成优化建议
      const feedback = await this.generateFeedback(currentPrompt, currentScore, config);
      
      // 基于反馈优化 prompt
      const newPrompt = await this.applyOptimization(currentPrompt, feedback);
      
      // 评估新 prompt
      const newScore = await this.evaluatePrompt(newPrompt, config);
      scoreHistory.push(newScore);

      optimizationLog.push({
        iteration: i + 1,
        prompt: newPrompt,
        score: newScore,
        feedback,
      });

      // 如果更好则更新
      if (newScore > bestScore) {
        bestScore = newScore;
        bestPrompt = newPrompt;
        currentPrompt = newPrompt;
        currentScore = newScore;
      }

      // 达到目标分数则停止
      if (newScore >= config.targetScore) {
        break;
      }
    }

    const improvement = ((bestScore - scoreHistory[0]) / scoreHistory[0]) * 100;

    return {
      originalPrompt: prompt,
      optimizedPrompt: bestPrompt,
      iterations: optimizationLog.length,
      scoreHistory,
      finalScore: bestScore,
      improvement,
      strategy: config.strategy,
      optimizationLog,
    };
  }

  // 元提示优化
  private async metaPromptOptimize(
    prompt: string,
    config: OptimizationConfig,
  ): Promise<OptimizationResult> {
    const metaPrompt = `你是一个专业的 Prompt 工程师。请优化以下 Prompt，使其在给定任务上表现更好。

原始 Prompt：
${prompt}

${config.examples ? `示例输入输出：
${config.examples.map(e => `输入: ${e.input}\n期望输出: ${e.expectedOutput}`).join('\n---\n')}` : ''}

目标指标：${config.targetMetric}
目标分数：${config.targetScore}

请分析原始 Prompt 的不足之处，并给出优化后的版本。
请以JSON格式返回：
{
  "analysis": "分析原始 Prompt 的问题",
  "optimized_prompt": "优化后的完整 Prompt",
  "improvements": ["改进点1", "改进点2"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: metaPrompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      let optimizedPrompt = prompt;
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          optimizedPrompt = parsed.optimized_prompt || prompt;
        } catch (e) {
          // JSON 解析失败，使用原文
        }
      }

      const finalScore = await this.evaluatePrompt(optimizedPrompt, config);
      const originalScore = await this.evaluatePrompt(prompt, config);

      return {
        originalPrompt: prompt,
        optimizedPrompt,
        iterations: 1,
        scoreHistory: [originalScore, finalScore],
        finalScore,
        improvement: ((finalScore - originalScore) / originalScore) * 100,
        strategy: config.strategy,
        optimizationLog: [{
          iteration: 1,
          prompt: optimizedPrompt,
          score: finalScore,
          feedback: content.substring(0, 500),
        }],
      };
    } catch (e) {
      return {
        originalPrompt: prompt,
        optimizedPrompt: prompt,
        iterations: 0,
        scoreHistory: [0],
        finalScore: 0,
        improvement: 0,
        strategy: config.strategy,
        optimizationLog: [],
      };
    }
  }

  // 生成优化反馈
  private async generateFeedback(
    prompt: string,
    score: number,
    config: OptimizationConfig,
  ): Promise<string> {
    const feedbackPrompt = `请分析以下 Prompt 并提供改进建议。

Prompt：
${prompt}

当前评分：${(score * 100).toFixed(1)}%
目标指标：${config.targetMetric}
目标分数：${config.targetScore}

${config.examples ? `示例：
${config.examples.slice(0, 3).map(e => `输入: ${e.input}\n期望: ${e.expectedOutput}`).join('\n---\n')}` : ''}

请给出具体的改进建议，重点关注如何提高 ${config.targetMetric} 指标。`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: feedbackPrompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '需要改进';
    } catch (e) {
      return '需要改进表达清晰度和准确性';
    }
  }

  // 应用优化
  private async applyOptimization(prompt: string, feedback: string): Promise<string> {
    const optimizePrompt = `请根据以下反馈优化 Prompt。

原始 Prompt：
${prompt}

改进建议：
${feedback}

请输出优化后的完整 Prompt，不要包含任何解释。`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: optimizePrompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content?.trim() || prompt;
    } catch (e) {
      return prompt;
    }
  }

  // 评估 Prompt 质量
  private async evaluatePrompt(
    prompt: string,
    config: OptimizationConfig,
  ): Promise<number> {
    if (!config.examples || config.examples.length === 0) {
      // 无示例时，使用 Prompt 质量评分
      return this.evaluatePromptQuality(prompt);
    }

    // 有示例时，基于实际效果评分
    let totalScore = 0;
    const sampleCount = Math.min(config.examples.length, 5);

    for (let i = 0; i < sampleCount; i++) {
      const example = config.examples[i];
      try {
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [{ role: 'user', content: `${prompt}\n\n输入：${example.input}` }],
          temperature: 0.1,
          max_tokens: 500,
        });

        const output = response.choices[0]?.message?.content || '';
        const score = await this.evaluateOutput(output, example.expectedOutput);
        totalScore += score;
      } catch (e) {
        totalScore += 0.5;
      }
    }

    return totalScore / sampleCount;
  }

  // 评估 Prompt 质量（无示例时）
  private async evaluatePromptQuality(prompt: string): Promise<number> {
    const evalPrompt = `请评估以下 Prompt 的质量。

Prompt：
${prompt}

请从以下维度评分（0-1）：
1. 清晰度：指令是否明确
2. 完整性：是否包含必要的上下文
3. 约束性：是否有明确的输出格式要求
4. 可执行性：LLM 是否能准确理解并执行

以JSON格式返回：{"score": 0.8}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: evalPrompt }],
        temperature: 0.1,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content || '';
      const match = content.match(/"score"[:\s]*(\d+\.?\d*)/);
      if (match) return Math.max(0, Math.min(1, parseFloat(match[1])));
    } catch (e) {
      // 降级
    }

    return 0.5;
  }

  // 评估输出质量
  private async evaluateOutput(output: string, expected: string): Promise<number> {
    const evalPrompt = `请评估以下输出与期望答案的匹配度。

输出：${output}
期望答案：${expected}

请给出0-1的匹配度分数。
以JSON格式返回：{"score": 0.8}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: evalPrompt }],
        temperature: 0.1,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content || '';
      const match = content.match(/"score"[:\s]*(\d+\.?\d*)/);
      if (match) return Math.max(0, Math.min(1, parseFloat(match[1])));
    } catch (e) {
      // 降级
    }

    // 简单的文本相似度
    const outputWords = new Set(output.toLowerCase().split(/\s+/));
    const expectedWords = new Set(expected.toLowerCase().split(/\s+/));
    const intersection = [...outputWords].filter(w => expectedWords.has(w));
    const union = new Set([...outputWords, ...expectedWords]);
    
    return intersection.length / union.size || 0.5;
  }
}
