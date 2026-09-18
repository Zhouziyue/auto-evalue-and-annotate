// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 实验状态
export enum ExperimentTrackingStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  KILLED = 'killed',
}

// 实验运行
export interface ExperimentRun {
  id: string;
  experimentId: string;
  name?: string;
  status: ExperimentTrackingStatus;
  params: Record<string, any>;
  metrics: Record<string, number>;
  tags: Record<string, string>;
  artifacts: Artifact[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  notes?: string;
  parentRunId?: string;
}

// 实验
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  artifactLocation?: string;
  tags: Record<string, string>;
  runs: ExperimentRun[];
  createdAt: Date;
  updatedAt: Date;
}

// 产物
export interface Artifact {
  id: string;
  path: string;
  type: 'model' | 'data' | 'plot' | 'config' | 'log' | 'other';
  sizeBytes: number;
  createdAt: Date;
}

// 参数对比
export interface ParamComparison {
  runIds: string[];
  params: Record<string, Record<string, any>>; // param -> runId -> value
  metrics: Record<string, Record<string, number>>; // metric -> runId -> value
}

@Injectable()
export class ExperimentTrackingService {
  constructor(private prisma: PrismaService) {}

  private experiments: Map<string, Experiment> = new Map();
  private runs: Map<string, ExperimentRun> = new Map();

  // 创建实验
  async createExperiment(data: {
    name: string;
    description?: string;
    tags?: Record<string, string>;
  }): Promise<Experiment> {
    const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const experiment: Experiment = {
      id,
      name: data.name,
      description: data.description,
      tags: data.tags || {},
      runs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.experiments.set(id, experiment);
    return experiment;
  }

  // 开始运行
  async startRun(experimentId: string, data?: {
    name?: string;
    params?: Record<string, any>;
    tags?: Record<string, string>;
    parentRunId?: string;
  }): Promise<ExperimentRun> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    const id = `run_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const run: ExperimentRun = {
      id,
      experimentId,
      name: data?.name || `Run ${experiment.runs.length + 1}`,
      status: ExperimentTrackingStatus.RUNNING,
      params: data?.params || {},
      metrics: {},
      tags: data?.tags || {},
      artifacts: [],
      startTime: new Date(),
      parentRunId: data?.parentRunId,
    };

    this.runs.set(id, run);
    experiment.runs.push(run);
    experiment.updatedAt = new Date();
    return run;
  }

  // 记录指标
  async logMetric(runId: string, key: string, value: number): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    run.metrics[key] = value;
  }

  // 批量记录指标
  async logMetrics(runId: string, metrics: Record<string, number>): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    Object.assign(run.metrics, metrics);
  }

  // 记录参数
  async logParam(runId: string, key: string, value: any): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    run.params[key] = value;
  }

  // 批量记录参数
  async logParams(runId: string, params: Record<string, any>): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    Object.assign(run.params, params);
  }

  // 添加标签
  async setTag(runId: string, key: string, value: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    run.tags[key] = value;
  }

  // 添加产物
  async logArtifact(runId: string, data: {
    path: string;
    type: Artifact['type'];
    sizeBytes: number;
  }): Promise<Artifact> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');

    const artifact: Artifact = {
      id: `art_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      path: data.path,
      type: data.type,
      sizeBytes: data.sizeBytes,
      createdAt: new Date(),
    };

    run.artifacts.push(artifact);
    return artifact;
  }

  // 结束运行
  async endRun(runId: string, status: ExperimentTrackingStatus = ExperimentTrackingStatus.COMPLETED): Promise<ExperimentRun> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    run.status = status;
    run.endTime = new Date();
    run.duration = run.endTime.getTime() - run.startTime.getTime();
    return run;
  }

  // 添加备注
  async addNote(runId: string, note: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    run.notes = note;
  }

  // 获取实验列表
  async listExperiments(): Promise<Experiment[]> {
    return Array.from(this.experiments.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // 获取实验详情
  async getExperiment(id: string): Promise<Experiment | undefined> {
    return this.experiments.get(id);
  }

  // 获取运行列表
  async listRuns(experimentId: string, options?: {
    status?: ExperimentTrackingStatus;
    limit?: number;
  }): Promise<ExperimentRun[]> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return [];

    let runs = [...experiment.runs];
    if (options?.status) runs = runs.filter(r => r.status === options.status);
    runs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    if (options?.limit) runs = runs.slice(0, options.limit);
    return runs;
  }

  // 获取运行详情
  async getRun(runId: string): Promise<ExperimentRun | undefined> {
    return this.runs.get(runId);
  }

  // 对比运行
  async compareRuns(runIds: string[]): Promise<ParamComparison> {
    const params: Record<string, Record<string, any>> = {};
    const metrics: Record<string, Record<string, number>> = {};

    for (const runId of runIds) {
      const run = this.runs.get(runId);
      if (!run) continue;

      for (const [key, value] of Object.entries(run.params)) {
        if (!params[key]) params[key] = {};
        params[key][runId] = value;
      }

      for (const [key, value] of Object.entries(run.metrics)) {
        if (!metrics[key]) metrics[key] = {};
        metrics[key][runId] = value;
      }
    }

    return { runIds, params, metrics };
  }

  // 搜索运行
  async searchRuns(filter: {
    experimentId?: string;
    paramFilter?: Record<string, any>;
    metricFilter?: Record<string, { op: string; value: number }>;
    tagFilter?: Record<string, string>;
  }): Promise<ExperimentRun[]> {
    let runs = Array.from(this.runs.values());

    if (filter.experimentId) {
      runs = runs.filter(r => r.experimentId === filter.experimentId);
    }

    if (filter.paramFilter) {
      for (const [key, value] of Object.entries(filter.paramFilter)) {
        runs = runs.filter(r => r.params[key] === value);
      }
    }

    if (filter.metricFilter) {
      for (const [key, { op, value }] of Object.entries(filter.metricFilter)) {
        runs = runs.filter(r => {
          const metricVal = r.metrics[key];
          if (metricVal === undefined) return false;
          switch (op) {
            case 'gt': return metricVal > value;
            case 'gte': return metricVal >= value;
            case 'lt': return metricVal < value;
            case 'lte': return metricVal <= value;
            case 'eq': return metricVal === value;
            default: return true;
          }
        });
      }
    }

    if (filter.tagFilter) {
      for (const [key, value] of Object.entries(filter.tagFilter)) {
        runs = runs.filter(r => r.tags[key] === value);
      }
    }

    return runs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // 删除实验
  async deleteExperiment(id: string): Promise<boolean> {
    const experiment = this.experiments.get(id);
    if (experiment) {
      for (const run of experiment.runs) {
        this.runs.delete(run.id);
      }
    }
    return this.experiments.delete(id);
  }

  // 获取最佳运行
  async getBestRun(experimentId: string, metric: string, maximize: boolean = true): Promise<ExperimentRun | null> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.runs.length === 0) return null;

    const completedRuns = experiment.runs.filter(r => r.status === ExperimentTrackingStatus.COMPLETED && r.metrics[metric] !== undefined);
    if (completedRuns.length === 0) return null;

    completedRuns.sort((a, b) => maximize ? b.metrics[metric] - a.metrics[metric] : a.metrics[metric] - b.metrics[metric]);
    return completedRuns[0];
  }
}
