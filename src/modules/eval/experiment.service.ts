// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 实验定义
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  config: ExperimentConfig;
  results?: ExperimentResults;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// 实验配置
export interface ExperimentConfig {
  model?: string;
  prompt?: string;
  datasetId?: string;
  metrics?: string[];
  parameters?: Record<string, any>;
}

// 实验结果
export interface ExperimentResults {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  avgScore: number;
  metrics: Record<string, number>;
  duration: number;  // 毫秒
}

// 实验运行记录
export interface ExperimentRun {
  id: string;
  experimentId: string;
  runNumber: number;
  status: 'running' | 'completed' | 'failed';
  input: any;
  output: any;
  metrics: Record<string, number>;
  duration: number;
  createdAt: Date;
}

// 创建实验输入
export interface CreateExperimentInput {
  name: string;
  description?: string;
  tags?: string[];
  config: ExperimentConfig;
}

@Injectable()
export class ExperimentService {
  constructor(private prisma: PrismaService) {}

  // 创建实验
  async createExperiment(input: CreateExperimentInput): Promise<Experiment> {
    const experiment: Experiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: input.name,
      description: input.description,
      tags: input.tags || [],
      status: 'running',
      config: input.config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 存储到数据库
    await this.prisma.evalRun.create({
      data: {
        id: experiment.id,
        status: 'running',
        totalCases: 0,
        passedCases: 0,
        failedCases: 0,
        metadata: JSON.stringify(experiment),
      },
    });

    return experiment;
  }

  // 获取实验列表
  async listExperiments(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Experiment[]> {
    const evalRuns = await this.prisma.evalRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    const experiments: Experiment[] = [];
    for (const run of evalRuns) {
      const metadata = JSON.parse(run.metadata || '{}');
      if (!metadata.config) continue;
      
      if (options?.status && metadata.status !== options.status) continue;

      experiments.push({
        ...metadata,
        createdAt: run.createdAt,
        updatedAt: run.endTime || run.createdAt,
      });
    }

    return experiments;
  }

  // 获取实验详情
  async getExperiment(id: string): Promise<Experiment | null> {
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id },
    });

    if (!evalRun) return null;

    const metadata = JSON.parse(evalRun.metadata || '{}');
    return {
      ...metadata,
      createdAt: evalRun.createdAt,
      updatedAt: evalRun.endTime || evalRun.createdAt,
    };
  }

  // 记录实验运行
  async recordRun(experimentId: string, data: {
    input: any;
    output: any;
    metrics: Record<string, number>;
    duration: number;
    status: 'completed' | 'failed';
  }): Promise<ExperimentRun> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    // 获取当前运行数
    const runs = await this.getRuns(experimentId);
    const runNumber = runs.length + 1;

    const run: ExperimentRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      experimentId,
      runNumber,
      status: data.status,
      input: data.input,
      output: data.output,
      metrics: data.metrics,
      duration: data.duration,
      createdAt: new Date(),
    };

    // 更新实验的 runs 列表
    const metadata = JSON.parse((await this.prisma.evalRun.findUnique({
      where: { id: experimentId },
    }))?.metadata || '{}');
    
    if (!metadata.runs) metadata.runs = [];
    metadata.runs.push(run);

    // 更新统计
    metadata.results = {
      totalRuns: metadata.runs.length,
      passedRuns: metadata.runs.filter((r: ExperimentRun) => r.status === 'completed').length,
      failedRuns: metadata.runs.filter((r: ExperimentRun) => r.status === 'failed').length,
      avgScore: this.calculateAvgScore(metadata.runs),
      metrics: this.aggregateMetrics(metadata.runs),
      duration: metadata.runs.reduce((sum: number, r: ExperimentRun) => sum + r.duration, 0),
    };

    await this.prisma.evalRun.update({
      where: { id: experimentId },
      data: {
        metadata: JSON.stringify(metadata),
        status: 'completed',
        totalCases: metadata.results.totalRuns,
        passedCases: metadata.results.passedRuns,
        failedCases: metadata.results.failedRuns,
        endTime: new Date(),
      },
    });

    return run;
  }

  // 获取实验运行记录
  async getRuns(experimentId: string): Promise<ExperimentRun[]> {
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: experimentId },
    });

    if (!evalRun) return [];

    const metadata = JSON.parse(evalRun.metadata || '{}');
    return metadata.runs || [];
  }

  // 完成实验
  async completeExperiment(id: string, status: 'completed' | 'failed' | 'cancelled'): Promise<Experiment> {
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id },
    });

    if (!evalRun) throw new Error('Experiment not found');

    const metadata = JSON.parse(evalRun.metadata || '{}');
    metadata.status = status;
    metadata.updatedAt = new Date();

    await this.prisma.evalRun.update({
      where: { id },
      data: {
        metadata: JSON.stringify(metadata),
        status: status === 'completed' ? 'completed' : 'failed',
        endTime: new Date(),
      },
    });

    return {
      ...metadata,
      createdAt: evalRun.createdAt,
      updatedAt: new Date(),
    };
  }

  // 对比实验
  async compareExperiments(experimentIds: string[]): Promise<{
    experiments: Experiment[];
    comparison: {
      metric: string;
      values: { experimentId: string; value: number }[];
    }[];
  }> {
    const experiments: Experiment[] = [];
    
    for (const id of experimentIds) {
      const exp = await this.getExperiment(id);
      if (exp) experiments.push(exp);
    }

    // 收集所有指标
    const metricNames = new Set<string>();
    for (const exp of experiments) {
      if (exp.results?.metrics) {
        Object.keys(exp.results.metrics).forEach(m => metricNames.add(m));
      }
    }

    // 构建对比数据
    const comparison = Array.from(metricNames).map(metric => ({
      metric,
      values: experiments.map(exp => ({
        experimentId: exp.id,
        value: exp.results?.metrics?.[metric] || 0,
      })),
    }));

    return { experiments, comparison };
  }

  // 计算平均分
  private calculateAvgScore(runs: ExperimentRun[]): number {
    if (runs.length === 0) return 0;
    const scores = runs.map(r => {
      const values = Object.values(r.metrics);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // 聚合指标
  private aggregateMetrics(runs: ExperimentRun[]): Record<string, number> {
    const metrics: Record<string, number[]> = {};
    
    for (const run of runs) {
      for (const [key, value] of Object.entries(run.metrics)) {
        if (!metrics[key]) metrics[key] = [];
        metrics[key].push(value);
      }
    }

    const result: Record<string, number> = {};
    for (const [key, values] of Object.entries(metrics)) {
      result[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    return result;
  }
}
