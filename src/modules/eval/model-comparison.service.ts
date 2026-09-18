// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 对比维度
export enum ComparisonDimension {
  ACCURACY = 'accuracy',
  SPEED = 'speed',
  COST = 'cost',
  SAFETY = 'safety',
  ROBUSTNESS = 'robustness',
  CONSISTENCY = 'consistency',
  CUSTOM = 'custom',
}

// 对比模式
export enum ComparisonMode {
  HEAD_TO_HEAD = 'head_to_head',   // 两两对比
  ROUND_ROBIN = 'round_robin',     // 循环赛
  BENCHMARK = 'benchmark',         // 基准对比
  CUSTOM = 'custom',               // 自定义
}

// 模型对比项
export interface ModelComparisonItem {
  modelId: string;
  modelName: string;
  scores: Record<string, number>;
  metadata: {
    version?: string;
    provider?: string;
    tags?: string[];
  };
}

// 对比任务
export interface ComparisonTask {
  id: string;
  name: string;
  description?: string;
  mode: ComparisonMode;
  dimensions: ComparisonDimension[];
  models: ModelComparisonItem[];
  weights: Record<string, number>; // 维度权重
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: ComparisonResults;
  createdAt: Date;
  completedAt?: Date;
}

// 对比结果
export interface ComparisonResults {
  rankings: ModelRanking[];
  pairwiseMatrix: PairwiseResult[][];
  radarData: RadarDataPoint[];
  summary: ComparisonSummary;
  recommendations: string[];
}

// 模型排名
export interface ModelRanking {
  rank: number;
  modelId: string;
  modelName: string;
  overallScore: number;
  dimensionScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

// 两两对比结果
export interface PairwiseResult {
  modelA: string;
  modelB: string;
  dimensionResults: Record<string, { modelAScore: number; modelBScore: number; winner: string }>;
  overallWinner: string;
  margin: number;
}

// 雷达图数据
export interface RadarDataPoint {
  dimension: string;
  values: Record<string, number>; // modelId -> score
}

// 对比摘要
export interface ComparisonSummary {
  bestOverall: string;
  bestPerDimension: Record<string, string>;
  mostConsistent: string;
  bestValueScore: string; // 性价比
  totalModels: number;
  totalDimensions: number;
}

@Injectable()
export class ModelComparisonService {
  constructor(private prisma: PrismaService) {}

  private tasks: Map<string, ComparisonTask> = new Map();

  // 创建对比任务
  async createTask(data: {
    name: string;
    description?: string;
    mode: ComparisonMode;
    dimensions: ComparisonDimension[];
    models: Array<{ modelId: string; modelName: string; scores: Record<string, number>; metadata?: any }>;
    weights?: Record<string, number>;
  }): Promise<ComparisonTask> {
    const id = `cmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const task: ComparisonTask = {
      id,
      name: data.name,
      description: data.description,
      mode: data.mode,
      dimensions: data.dimensions,
      models: data.models.map(m => ({
        ...m,
        metadata: m.metadata || {},
      })),
      weights: data.weights || this.getDefaultWeights(data.dimensions),
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(id, task);
    return task;
  }

  // 执行对比
  async execute(taskId: string): Promise<ComparisonResults> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');
    if (task.models.length < 2) throw new Error('Need at least 2 models');

    task.status = 'running';

    try {
      // 计算排名
      const rankings = this.calculateRankings(task);

      // 两两对比矩阵
      const pairwiseMatrix = this.calculatePairwiseMatrix(task);

      // 雷达图数据
      const radarData = this.calculateRadarData(task);

      // 摘要
      const summary = this.calculateSummary(task, rankings);

      // 建议
      const recommendations = this.generateRecommendations(task, rankings, summary);

      const results: ComparisonResults = {
        rankings,
        pairwiseMatrix,
        radarData,
        summary,
        recommendations,
      };

      task.results = results;
      task.status = 'completed';
      task.completedAt = new Date();

      return results;
    } catch (error) {
      task.status = 'failed';
      throw error;
    }
  }

  // 计算排名
  private calculateRankings(task: ComparisonTask): ModelRanking[] {
    const scored = task.models.map(model => {
      let overallScore = 0;
      let totalWeight = 0;

      for (const dim of task.dimensions) {
        const weight = task.weights[dim] || 1;
        const score = model.scores[dim] || 0;
        overallScore += score * weight;
        totalWeight += weight;
      }

      overallScore = totalWeight > 0 ? overallScore / totalWeight : 0;

      // 找强项和弱项
      const dimScores = Object.entries(model.scores).filter(([k]) =>
        task.dimensions.includes(k as ComparisonDimension),
      );
      const sorted = dimScores.sort((a, b) => b[1] - a[1]);
      const strengths = sorted.slice(0, 2).map(([k]) => k);
      const weaknesses = sorted.slice(-2).map(([k]) => k);

      return {
        modelId: model.modelId,
        modelName: model.modelName,
        overallScore,
        dimensionScores: Object.fromEntries(dimScores),
        strengths,
        weaknesses,
      };
    });

    scored.sort((a, b) => b.overallScore - a.overallScore);
    return scored.map((s, i) => ({ rank: i + 1, ...s }));
  }

  // 两两对比矩阵
  private calculatePairwiseMatrix(task: ComparisonTask): PairwiseResult[][] {
    const matrix: PairwiseResult[][] = [];

    for (let i = 0; i < task.models.length; i++) {
      const row: PairwiseResult[] = [];
      for (let j = 0; j < task.models.length; j++) {
        if (i === j) {
          row.push({
            modelA: task.models[i].modelId,
            modelB: task.models[j].modelId,
            dimensionResults: {},
            overallWinner: 'tie',
            margin: 0,
          });
          continue;
        }

        const modelA = task.models[i];
        const modelB = task.models[j];
        const dimResults: Record<string, any> = {};
        let aWins = 0, bWins = 0;

        for (const dim of task.dimensions) {
          const aScore = modelA.scores[dim] || 0;
          const bScore = modelB.scores[dim] || 0;
          const winner = aScore > bScore ? modelA.modelId : bScore > aScore ? modelB.modelId : 'tie';
          dimResults[dim] = { modelAScore: aScore, modelBScore: bScore, winner };
          if (winner === modelA.modelId) aWins++;
          else if (winner === modelB.modelId) bWins++;
        }

        const overallWinner = aWins > bWins ? modelA.modelId : bWins > aWins ? modelB.modelId : 'tie';
        const margin = Math.abs(aWins - bWins) / task.dimensions.length;

        row.push({ modelA: modelA.modelId, modelB: modelB.modelId, dimensionResults: dimResults, overallWinner, margin });
      }
      matrix.push(row);
    }

    return matrix;
  }

  // 雷达图数据
  private calculateRadarData(task: ComparisonTask): RadarDataPoint[] {
    return task.dimensions.map(dim => {
      const values: Record<string, number> = {};
      for (const model of task.models) {
        values[model.modelId] = model.scores[dim] || 0;
      }
      return { dimension: dim, values };
    });
  }

  // 摘要
  private calculateSummary(task: ComparisonTask, rankings: ModelRanking[]): ComparisonSummary {
    const bestOverall = rankings[0]?.modelName || 'N/A';

    const bestPerDimension: Record<string, string> = {};
    for (const dim of task.dimensions) {
      let best = task.models[0];
      for (const model of task.models) {
        if ((model.scores[dim] || 0) > (best.scores[dim] || 0)) best = model;
      }
      bestPerDimension[dim] = best.modelName;
    }

    // 最稳定：方差最小
    let mostConsistent = task.models[0];
    let minVariance = Infinity;
    for (const model of task.models) {
      const scores = task.dimensions.map(d => model.scores[d] || 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
      if (variance < minVariance) {
        minVariance = variance;
        mostConsistent = model;
      }
    }

    // 性价比（简化：综合分/cost）
    let bestValue = task.models[0];
    let bestValueScore = 0;
    for (const model of task.models) {
      const cost = model.scores['cost'] || 1;
      const overall = rankings.find(r => r.modelId === model.modelId)?.overallScore || 0;
      const valueScore = cost > 0 ? overall / cost : overall;
      if (valueScore > bestValueScore) {
        bestValueScore = valueScore;
        bestValue = model;
      }
    }

    return {
      bestOverall,
      bestPerDimension,
      mostConsistent: mostConsistent.modelName,
      bestValueScore: bestValue.modelName,
      totalModels: task.models.length,
      totalDimensions: task.dimensions.length,
    };
  }

  // 生成建议
  private generateRecommendations(
    task: ComparisonTask,
    rankings: ModelRanking[],
    summary: ComparisonSummary,
  ): string[] {
    const recs: string[] = [];

    if (rankings.length >= 2) {
      const top = rankings[0];
      const second = rankings[1];
      const gap = top.overallScore - second.overallScore;

      if (gap < 0.05) {
        recs.push(`前两名非常接近（差距 ${gap.toFixed(3)}），建议根据具体场景选择`);
      } else if (gap > 0.2) {
        recs.push(`${top.modelName} 显著领先，推荐作为首选模型`);
      }
    }

    recs.push(`${summary.mostConsistent} 表现最稳定，适合对一致性要求高的场景`);
    recs.push(`${summary.bestValueScore} 性价比最优`);

    for (const [dim, model] of Object.entries(summary.bestPerDimension)) {
      recs.push(`${dim} 维度推荐 ${model}`);
    }

    return recs;
  }

  // 默认权重
  private getDefaultWeights(dimensions: ComparisonDimension[]): Record<string, number> {
    const weights: Record<string, number> = {};
    for (const dim of dimensions) {
      weights[dim] = dim === ComparisonDimension.ACCURACY ? 2 : 1;
    }
    return weights;
  }

  // 获取任务列表
  async listTasks(): Promise<ComparisonTask[]> {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取任务详情
  async getTask(id: string): Promise<ComparisonTask | undefined> {
    return this.tasks.get(id);
  }

  // 删除任务
  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // 导出对比报告
  async exportReport(taskId: string): Promise<{
    task: ComparisonTask;
    markdown: string;
  }> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');
    if (!task.results) throw new Error('Task not executed yet');

    const lines: string[] = [];
    lines.push(`# 模型对比报告: ${task.name}`);
    lines.push('');
    lines.push(`## 概览`);
    lines.push(`- 对比模式: ${task.mode}`);
    lines.push(`- 模型数量: ${task.results.summary.totalModels}`);
    lines.push(`- 评测维度: ${task.results.summary.totalDimensions}`);
    lines.push(`- 综合最优: ${task.results.summary.bestOverall}`);
    lines.push('');
    lines.push('## 排名');
    for (const r of task.results.rankings) {
      lines.push(`${r.rank}. **${r.modelName}** - ${r.overallScore.toFixed(3)}`);
    }
    lines.push('');
    lines.push('## 建议');
    for (const rec of task.results.recommendations) {
      lines.push(`- ${rec}`);
    }

    return { task, markdown: lines.join('\n') };
  }
}
