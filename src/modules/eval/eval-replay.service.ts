// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 回放状态
export enum ReplayStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// 回放任务
export interface ReplayTask {
  id: string;
  name: string;
  description?: string;
  sourceEvalRunId: string;
  targetConfig: {
    modelId?: string;
    promptVersionId?: string;
    datasetId?: string;
    metrics?: string[];
  };
  status: ReplayStatus;
  totalCases: number;
  completedCases: number;
  failedCases: number;
  results: ReplayResult[];
  comparison?: ReplayComparison;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
}

// 回放结果
export interface ReplayResult {
  id: string;
  taskId: string;
  caseIndex: number;
  input: any;
  originalOutput: any;
  replayOutput: any;
  originalScores: Record<string, number>;
  replayScores: Record<string, number>;
  scoreDelta: Record<string, number>;
  status: 'success' | 'failed';
  error?: string;
  latency: number;
}

// 回放对比
export interface ReplayComparison {
  overallScoreDelta: Record<string, number>;
  improvedCases: number;
  degradedCases: number;
  unchangedCases: number;
  consistencyScore: number;
  summary: string;
}

@Injectable()
export class EvalReplayService {
  constructor(private prisma: PrismaService) {}

  private tasks: Map<string, ReplayTask> = new Map();

  // 创建回放任务
  async createTask(data: {
    name: string;
    description?: string;
    sourceEvalRunId: string;
    targetConfig: ReplayTask['targetConfig'];
    createdBy: string;
  }): Promise<ReplayTask> {
    // 获取原始评测数据
    const sourceRun = await this.prisma.evalRun.findUnique({
      where: { id: data.sourceEvalRunId },
      include: { results: true },
    });

    if (!sourceRun) throw new Error('Source eval run not found');

    const id = `replay_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const task: ReplayTask = {
      id,
      name: data.name,
      description: data.description,
      sourceEvalRunId: data.sourceEvalRunId,
      targetConfig: data.targetConfig,
      status: ReplayStatus.PENDING,
      totalCases: sourceRun.results.length,
      completedCases: 0,
      failedCases: 0,
      results: [],
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    this.tasks.set(id, task);
    return task;
  }

  // 执行回放
  async execute(taskId: string): Promise<ReplayTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    task.status = ReplayStatus.RUNNING;
    task.startedAt = new Date();

    try {
      // 获取原始评测数据
      const sourceRun = await this.prisma.evalRun.findUnique({
        where: { id: task.sourceEvalRunId },
        include: { results: true },
      });

      if (!sourceRun) throw new Error('Source eval run not found');

      // 逐条回放
      for (let i = 0; i < sourceRun.results.length; i++) {
        const originalResult = sourceRun.results[i];
        const originalScores = (originalResult.scores as Record<string, number>) || {};

        // 模拟回放（实际应对目标模型重新执行）
        const replayScores = this.simulateReplay(originalScores, task.targetConfig);
        const replayOutput = originalResult.output; // 简化：使用原始输出

        // 计算分数差异
        const scoreDelta: Record<string, number> = {};
        for (const metric of Object.keys(originalScores)) {
          scoreDelta[metric] = (replayScores[metric] || 0) - (originalScores[metric] || 0);
        }

        const result: ReplayResult = {
          id: `replay_r_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          taskId,
          caseIndex: i,
          input: originalResult.input,
          originalOutput: originalResult.output,
          replayOutput,
          originalScores,
          replayScores,
          scoreDelta,
          status: 'success',
          latency: Math.random() * 500 + 100,
        };

        task.results.push(result);
        task.completedCases++;
      }

      // 生成对比报告
      task.comparison = this.generateComparison(task);
      task.status = ReplayStatus.COMPLETED;
    } catch (error) {
      task.status = ReplayStatus.FAILED;
    }

    task.completedAt = new Date();
    return task;
  }

  // 模拟回放
  private simulateReplay(
    originalScores: Record<string, number>,
    targetConfig: ReplayTask['targetConfig'],
  ): Record<string, number> {
    const replayScores: Record<string, number> = {};

    for (const [metric, value] of Object.entries(originalScores)) {
      // 模拟：加入随机波动
      const noise = (Math.random() - 0.5) * 0.1;
      replayScores[metric] = Math.max(0, Math.min(1, value + noise));
    }

    return replayScores;
  }

  // 生成对比报告
  private generateComparison(task: ReplayTask): ReplayComparison {
    const overallDelta: Record<string, number> = {};
    let improved = 0, degraded = 0, unchanged = 0;
    const threshold = 0.02;

    for (const result of task.results) {
      let anyImproved = false, anyDegraded = false;

      for (const [metric, delta] of Object.entries(result.scoreDelta)) {
        if (!overallDelta[metric]) overallDelta[metric] = 0;
        overallDelta[metric] += delta;

        if (delta > threshold) anyImproved = true;
        if (delta < -threshold) anyDegraded = true;
      }

      if (anyImproved && !anyDegraded) improved++;
      else if (anyDegraded && !anyImproved) degraded++;
      else unchanged++;
    }

    // 平均差异
    const resultCount = task.results.length || 1;
    for (const key of Object.keys(overallDelta)) {
      overallDelta[key] /= resultCount;
    }

    // 一致性分数
    const consistencyScore = unchanged / resultCount;

    // 生成摘要
    let summary = '';
    if (consistencyScore > 0.9) {
      summary = '回放结果与原始高度一致，系统稳定';
    } else if (improved > degraded) {
      summary = `回放显示 ${improved} 个用例改善，${degraded} 个退化，整体向好`;
    } else if (degraded > improved) {
      summary = `回放显示 ${degraded} 个用例退化，需要关注`;
    } else {
      summary = `回放结果混合，${improved} 改善 / ${degraded} 退化 / ${unchanged} 不变`;
    }

    return {
      overallScoreDelta: overallDelta,
      improvedCases: improved,
      degradedCases: degraded,
      unchangedCases: unchanged,
      consistencyScore,
      summary,
    };
  }

  // 获取任务列表
  async listTasks(sourceEvalRunId?: string): Promise<ReplayTask[]> {
    let tasks = Array.from(this.tasks.values());
    if (sourceEvalRunId) tasks = tasks.filter(t => t.sourceEvalRunId === sourceEvalRunId);
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取任务详情
  async getTask(id: string): Promise<ReplayTask | undefined> {
    return this.tasks.get(id);
  }

  // 取消任务
  async cancelTask(id: string): Promise<ReplayTask | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    if (task.status === ReplayStatus.RUNNING) {
      task.status = ReplayStatus.CANCELLED;
    }
    return task;
  }

  // 删除任务
  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // 获取回放结果
  async getResults(taskId: string, options?: {
    status?: string;
    limit?: number;
  }): Promise<ReplayResult[]> {
    const task = this.tasks.get(taskId);
    if (!task) return [];

    let results = task.results;
    if (options?.status) results = results.filter(r => r.status === options.status);
    if (options?.limit) results = results.slice(0, options.limit);
    return results;
  }

  // 批量回放（多个评测运行）
  async createBatchReplay(data: {
    name: string;
    sourceEvalRunIds: string[];
    targetConfig: ReplayTask['targetConfig'];
    createdBy: string;
  }): Promise<ReplayTask[]> {
    const tasks: ReplayTask[] = [];
    for (const runId of data.sourceEvalRunIds) {
      const task = await this.createTask({
        name: `${data.name} - Run ${runId.substring(0, 8)}`,
        sourceEvalRunId: runId,
        targetConfig: data.targetConfig,
        createdBy: data.createdBy,
      });
      tasks.push(task);
    }
    return tasks;
  }

  // 获取回放对比摘要
  async getComparisonSummary(taskId: string): Promise<ReplayComparison | null> {
    const task = this.tasks.get(taskId);
    if (!task || !task.comparison) return null;
    return task.comparison;
  }

  // 导出回放报告
  async exportReport(taskId: string): Promise<string> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const lines: string[] = [];
    lines.push(`# 评测回放报告: ${task.name}`);
    lines.push('');
    lines.push(`## 概览`);
    lines.push(`- 源评测运行: ${task.sourceEvalRunId}`);
    lines.push(`- 总用例数: ${task.totalCases}`);
    lines.push(`- 状态: ${task.status}`);
    lines.push('');

    if (task.comparison) {
      lines.push('## 对比结果');
      lines.push(`- 一致性: ${(task.comparison.consistencyScore * 100).toFixed(1)}%`);
      lines.push(`- 改善: ${task.comparison.improvedCases}`);
      lines.push(`- 退化: ${task.comparison.degradedCases}`);
      lines.push(`- 不变: ${task.comparison.unchangedCases}`);
      lines.push(`- 总结: ${task.comparison.summary}`);
    }

    return lines.join('\n');
  }
}
