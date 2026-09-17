// @ts-nocheck
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

// 矩阵评测配置
export interface MatrixEvalConfig {
  prompts: PromptVariant[];      // 多个 prompt 变体
  models: ModelConfig[];          // 多个模型
  testCases: TestCase[];          // 测试用例
  metrics?: string[];             // 评测指标
}

export interface PromptVariant {
  id: string;
  name: string;
  template: string;              // 带 {{variable}} 的模板
}

export interface ModelConfig {
  id: string;
  name: string;
  baseURL?: string;
  apiKey?: string;
  model: string;
}

export interface TestCase {
  id: string;
  input: string;                 // 用户输入
  variables?: Record<string, string>;  // 模板变量
  expectedOutput?: string;       // 期望输出
  tags?: string[];
}

// 矩阵评测结果
export interface MatrixResult {
  config: MatrixEvalConfig;
  results: MatrixCell[][];       // [prompt][testCase] 的结果矩阵
  summary: MatrixSummary;
  createdAt: Date;
}

export interface MatrixCell {
  promptId: string;
  modelId: string;
  testCaseId: string;
  output: string;
  latency: number;               // 毫秒
  tokens: { prompt: number; completion: number; total: number };
  scores: Record<string, number>;
  error?: string;
}

export interface MatrixSummary {
  totalCells: number;
  successCells: number;
  failedCells: number;
  avgLatency: number;
  totalCost: number;
  bestPrompt: string;
  bestModel: string;
  modelRankings: { modelId: string; avgScore: number }[];
  promptRankings: { promptId: string; avgScore: number }[];
}

@Injectable()
export class MatrixEvalService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // 运行矩阵评测
  async runMatrixEval(config: MatrixEvalConfig): Promise<MatrixResult> {
    const results: MatrixCell[][] = [];
    const modelScores: Record<string, number[]> = {};
    const promptScores: Record<string, number[]> = {};
    
    let totalLatency = 0;
    let successCount = 0;
    let failCount = 0;

    // 遍历每个 prompt 变体
    for (const prompt of config.prompts) {
      const promptResults: MatrixCell[] = [];
      
      // 遍历每个测试用例
      for (const testCase of config.testCases) {
        // 遍历每个模型
        for (const model of config.models) {
          try {
            const startTime = Date.now();
            
            // 渲染 prompt 模板
            const renderedPrompt = this.renderTemplate(prompt.template, testCase.variables || { input: testCase.input });
            
            // 调用模型
            const client = this.getClientForModel(model);
            const response = await client.chat.completions.create({
              model: model.model,
              messages: [{ role: 'user', content: renderedPrompt }],
              temperature: 0.7,
              max_tokens: 2000,
            });

            const latency = Date.now() - startTime;
            const output = response.choices[0]?.message?.content || '';
            const tokens = {
              prompt: response.usage?.prompt_tokens || 0,
              completion: response.usage?.completion_tokens || 0,
              total: response.usage?.total_tokens || 0,
            };

            // 计算分数（简单匹配）
            const scores = this.calculateScores(testCase, output);
            const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

            // 记录分数
            if (!modelScores[model.id]) modelScores[model.id] = [];
            modelScores[model.id].push(avgScore);
            
            if (!promptScores[prompt.id]) promptScores[prompt.id] = [];
            promptScores[prompt.id].push(avgScore);

            const cell: MatrixCell = {
              promptId: prompt.id,
              modelId: model.id,
              testCaseId: testCase.id,
              output,
              latency,
              tokens,
              scores,
            };

            promptResults.push(cell);
            totalLatency += latency;
            successCount++;
          } catch (e) {
            const cell: MatrixCell = {
              promptId: prompt.id,
              modelId: model.id,
              testCaseId: testCase.id,
              output: '',
              latency: 0,
              tokens: { prompt: 0, completion: 0, total: 0 },
              scores: {},
              error: e.message,
            };
            promptResults.push(cell);
            failCount++;
          }
        }
      }
      
      results.push(promptResults);
    }

    // 生成摘要
    const modelRankings = Object.entries(modelScores)
      .map(([modelId, scores]) => ({
        modelId,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    const promptRankings = Object.entries(promptScores)
      .map(([promptId, scores]) => ({
        promptId,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    const summary: MatrixSummary = {
      totalCells: successCount + failCount,
      successCells: successCount,
      failedCells: failCount,
      avgLatency: successCount > 0 ? totalLatency / successCount : 0,
      totalCost: 0,
      bestPrompt: promptRankings[0]?.promptId || '',
      bestModel: modelRankings[0]?.modelId || '',
      modelRankings,
      promptRankings,
    };

    return {
      config,
      results,
      summary,
      createdAt: new Date(),
    };
  }

  // 渲染模板
  private renderTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  // 获取对应模型的客户端
  private getClientForModel(model: ModelConfig): OpenAI {
    if (model.baseURL && model.apiKey) {
      return new OpenAI({
        baseURL: model.baseURL,
        apiKey: model.apiKey,
      });
    }
    return this.openai;
  }

  // 计算分数
  private calculateScores(testCase: TestCase, output: string): Record<string, number> {
    const scores: Record<string, number> = {};

    // 如果有期望输出，计算相似度
    if (testCase.expectedOutput) {
      // 精确匹配
      scores['exact_match'] = output.trim() === testCase.expectedOutput.trim() ? 1 : 0;
      
      // 包含匹配
      scores['contains'] = output.includes(testCase.expectedOutput) ? 1 : 0.5;
      
      // 关键词覆盖率
      const keywords = testCase.expectedOutput.split(/\s+/);
      const matched = keywords.filter(k => output.includes(k));
      scores['keyword_coverage'] = keywords.length > 0 ? matched.length / keywords.length : 0;
    }

    // 输出长度合理性
    const len = output.length;
    scores['length_score'] = len > 10 && len < 5000 ? 1 : 0.5;

    // 格式完整性（是否有完整的句子结构）
    scores['format_score'] = output.includes('.') || output.includes('。') || output.includes('\n') ? 1 : 0.7;

    return scores;
  }

  // 导出为 CSV 格式
  exportToCSV(result: MatrixResult): string {
    const lines: string[] = [];
    
    // 表头
    const header = ['TestCase', 'Prompt', 'Model', 'Output', 'Latency(ms)', 'AvgScore'];
    lines.push(header.join(','));

    // 数据行
    for (const row of result.results) {
      for (const cell of row) {
        const testCase = result.config.testCases.find(t => t.id === cell.testCaseId);
        const prompt = result.config.prompts.find(p => p.id === cell.promptId);
        const model = result.config.models.find(m => m.id === cell.modelId);
        
        const avgScore = Object.values(cell.scores).reduce((a, b) => a + b, 0) / Object.values(cell.scores).length || 0;
        
        const line = [
          `"${(testCase?.input || '').replace(/"/g, '""')}"`,
          `"${prompt?.name || ''}"`,
          `"${model?.name || ''}"`,
          `"${cell.output.replace(/"/g, '""').slice(0, 200)}"`,
          cell.latency.toString(),
          avgScore.toFixed(3),
        ];
        lines.push(line.join(','));
      }
    }

    return lines.join('\n');
  }
}
