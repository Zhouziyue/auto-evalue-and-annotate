// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 评测快照
export interface EvalSnapshot {
  id: string;
  name: string;
  description?: string;
  evalRunId: string;
  modelName: string;
  datasetId?: string;
  metrics: Record<string, number>;
  summary: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
    passRate: number;
    avgScore: number;
    avgLatency: number;
  };
  tags: string[];
  createdAt: Date;
  createdBy?: string;
}

// 快照对比结果
export interface SnapshotComparison {
  snapshot1: EvalSnapshot;
  snapshot2: EvalSnapshot;
  metricChanges: Array<{
    metric: string;
    value1: number;
    value2: number;
    change: number;
    changePercent: number;
    improved: boolean;
  }>;
  summaryChanges: {
    totalCases: { v1: number; v2: number; change: number };
    passRate: { v1: number; v2: number; change: number };
    avgScore: { v1: number; v2: number; change: number };
    avgLatency: { v1: number; v2: number; change: number };
  };
  overallImproved: boolean;
  overallChanged: boolean;
}

@Injectable()
export class EvalSnapshotService {
  private snapshots: Map<string, EvalSnapshot> = new Map();

  constructor(private prisma: PrismaService) {}

  // 创建快照
  async createSnapshot(data: {
    name: string;
    description?: string;
    evalRunId: string;
    modelName: string;
    datasetId?: string;
    metrics: Record<string, number>;
    summary: EvalSnapshot['summary'];
    tags?: string[];
    createdBy?: string;
  }): Promise<EvalSnapshot> {
    const id = `snapshot_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const snapshot: EvalSnapshot = {
      id,
      name: data.name,
      description: data.description,
      evalRunId: data.evalRunId,
      modelName: data.modelName,
      datasetId: data.datasetId,
      metrics: data.metrics,
      summary: data.summary,
      tags: data.tags || [],
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  // 从评测运行创建快照
  async createFromEvalRun(evalRunId: string, name?: string, tags?: string[]): Promise<EvalSnapshot> {
    // 从数据库获取评测运行数据
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: {
        results: true,
        skill: true,
      },
    });

    if (!evalRun) {
      throw new Error('EvalRun not found');
    }

    // 计算指标
    const totalCases = evalRun.results.length;
    const passedCases = evalRun.results.filter(r => r.status === 'passed').length;
    const failedCases = totalCases - passedCases;
    const passRate = totalCases > 0 ? passedCases / totalCases : 0;

    // 聚合评分
    const allScores: Record<string, number[]> = {};
    for (const result of evalRun.results) {
      const scores = (result.scores as Record<string, number>) || {};
      for (const [key, value] of Object.entries(scores)) {
        if (typeof value === 'number') {
          if (!allScores[key]) allScores[key] = [];
          allScores[key].push(value);
        }
      }
    }

    const metrics: Record<string, number> = {};
    for (const [key, values] of Object.entries(allScores)) {
      metrics[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    const avgScore = Object.values(metrics).reduce((a, b) => a + b, 0) / (Object.values(metrics).length || 1);

    // 计算平均延迟
    const latencies = evalRun.results
      .map(r => ((r.metrics as Record<string, any>)?.totalLatency || 0))
      .filter(l => l > 0);
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    return this.createSnapshot({
      name: name || `快照 - ${evalRun.skill.name} - ${new Date().toLocaleDateString()}`,
      evalRunId,
      modelName: evalRun.skill.name,
      metrics,
      summary: {
        totalCases,
        passedCases,
        failedCases,
        passRate,
        avgScore,
        avgLatency,
      },
      tags,
    });
  }

  // 获取快照列表
  async listSnapshots(options?: {
    modelName?: string;
    tags?: string[];
    limit?: number;
  }): Promise<EvalSnapshot[]> {
    let snapshots = Array.from(this.snapshots.values());

    if (options?.modelName) {
      snapshots = snapshots.filter(s => s.modelName === options.modelName);
    }
    if (options?.tags && options.tags.length > 0) {
      snapshots = snapshots.filter(s =>
        options.tags!.some(tag => s.tags.includes(tag)),
      );
    }

    // 按时间倒序
    snapshots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      snapshots = snapshots.slice(0, options.limit);
    }

    return snapshots;
  }

  // 获取快照详情
  async getSnapshot(id: string): Promise<EvalSnapshot | undefined> {
    return this.snapshots.get(id);
  }

  // 删除快照
  async deleteSnapshot(id: string): Promise<boolean> {
    return this.snapshots.delete(id);
  }

  // 对比两个快照
  async compareSnapshots(snapshotId1: string, snapshotId2: string): Promise<SnapshotComparison> {
    const snapshot1 = this.snapshots.get(snapshotId1);
    const snapshot2 = this.snapshots.get(snapshotId2);

    if (!snapshot1 || !snapshot2) {
      throw new Error('Snapshot not found');
    }

    // 对比指标
    const allMetrics = new Set([
      ...Object.keys(snapshot1.metrics),
      ...Object.keys(snapshot2.metrics),
    ]);

    const metricChanges: SnapshotComparison['metricChanges'] = [];
    let improvedCount = 0;
    let degradedCount = 0;

    for (const metric of allMetrics) {
      const value1 = snapshot1.metrics[metric] || 0;
      const value2 = snapshot2.metrics[metric] || 0;
      const change = value2 - value1;
      const changePercent = value1 !== 0 ? (change / value1) * 100 : 0;

      // 判断是否改善（假设分数越高越好）
      const improved = change > 0.001; // 0.1% 阈值
      const degraded = change < -0.001;

      if (improved) improvedCount++;
      if (degraded) degradedCount++;

      metricChanges.push({
        metric,
        value1,
        value2,
        change,
        changePercent,
        improved,
      });
    }

    // 对比摘要
    const summaryChanges: SnapshotComparison['summaryChanges'] = {
      totalCases: {
        v1: snapshot1.summary.totalCases,
        v2: snapshot2.summary.totalCases,
        change: snapshot2.summary.totalCases - snapshot1.summary.totalCases,
      },
      passRate: {
        v1: snapshot1.summary.passRate,
        v2: snapshot2.summary.passRate,
        change: snapshot2.summary.passRate - snapshot1.summary.passRate,
      },
      avgScore: {
        v1: snapshot1.summary.avgScore,
        v2: snapshot2.summary.avgScore,
        change: snapshot2.summary.avgScore - snapshot1.summary.avgScore,
      },
      avgLatency: {
        v1: snapshot1.summary.avgLatency,
        v2: snapshot2.summary.avgLatency,
        change: snapshot2.summary.avgLatency - snapshot1.summary.avgLatency,
      },
    };

    const overallImproved = improvedCount > degradedCount;
    const overallChanged = metricChanges.some(m => Math.abs(m.changePercent) > 1);

    return {
      snapshot1,
      snapshot2,
      metricChanges,
      summaryChanges,
      overallImproved,
      overallChanged,
    };
  }

  // 获取模型的快照历史趋势
  async getTrend(modelName: string, metric: string, limit?: number): Promise<{
    modelName: string;
    metric: string;
    dataPoints: Array<{
      snapshotId: string;
      snapshotName: string;
      value: number;
      timestamp: Date;
    }>;
    trend: 'improving' | 'stable' | 'degrading';
  }> {
    const snapshots = await this.listSnapshots({ modelName, limit });
    
    const dataPoints = snapshots
      .filter(s => s.metrics[metric] !== undefined)
      .map(s => ({
        snapshotId: s.id,
        snapshotName: s.name,
        value: s.metrics[metric],
        timestamp: s.createdAt,
      }))
      .reverse(); // 按时间正序

    // 计算趋势
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (dataPoints.length >= 3) {
      const recent = dataPoints.slice(-3);
      const first = recent[0].value;
      const last = recent[recent.length - 1].value;
      const change = ((last - first) / first) * 100;

      if (change > 2) trend = 'improving';
      else if (change < -2) trend = 'degrading';
    }

    return {
      modelName,
      metric,
      dataPoints,
      trend,
    };
  }

  // 添加标签
  async addTag(snapshotId: string, tag: string): Promise<EvalSnapshot | undefined> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return undefined;

    if (!snapshot.tags.includes(tag)) {
      snapshot.tags.push(tag);
    }
    return snapshot;
  }

  // 移除标签
  async removeTag(snapshotId: string, tag: string): Promise<EvalSnapshot | undefined> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return undefined;

    snapshot.tags = snapshot.tags.filter(t => t !== tag);
    return snapshot;
  }

  // 获取所有标签
  async getAllTags(): Promise<string[]> {
    const tags = new Set<string>();
    for (const snapshot of this.snapshots.values()) {
      for (const tag of snapshot.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags);
  }
}
