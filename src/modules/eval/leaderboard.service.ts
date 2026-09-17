// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 排行榜条目
export interface LeaderboardEntry {
  rank: number;
  modelId: string;
  modelName: string;
  overallScore: number;
  metrics: Record<string, number>;
  totalEvaluations: number;
  avgLatency: number;
  lastEvaluatedAt: Date;
}

// 排行榜配置
export interface LeaderboardConfig {
  name: string;
  description?: string;
  metricWeights?: Record<string, number>;  // 指标权重
  filters?: {
    skillId?: string;
    datasetId?: string;
    dateRange?: { start: Date; end: Date };
  };
}

// 排行榜结果
export interface Leaderboard {
  config: LeaderboardConfig;
  entries: LeaderboardEntry[];
  generatedAt: Date;
}

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  // 生成排行榜
  async generateLeaderboard(config: LeaderboardConfig): Promise<Leaderboard> {
    // 获取所有评测运行
    const evalRuns = await this.prisma.evalRun.findMany({
      where: {
        status: 'completed',
        ...(config.filters?.dateRange && {
          createdAt: {
            gte: config.filters.dateRange.start,
            lte: config.filters.dateRange.end,
          },
        }),
      },
      include: {
        skill: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 按模型分组统计
    const modelStats = new Map<string, {
      modelName: string;
      scores: number[];
      metrics: Record<string, number[]>;
      latencies: number[];
      count: number;
      lastEvaluatedAt: Date;
    }>();

    for (const run of evalRuns) {
      const metadata = JSON.parse(run.metadata || '{}');
      const modelName = metadata.model || run.skill?.name || 'Unknown';
      const modelId = metadata.modelId || run.skillId || 'unknown';

      if (!modelStats.has(modelId)) {
        modelStats.set(modelId, {
          modelName,
          scores: [],
          metrics: {},
          latencies: [],
          count: 0,
          lastEvaluatedAt: run.createdAt,
        });
      }

      const stats = modelStats.get(modelId)!;
      stats.count++;
      
      // 计算通过率作为基础分数
      const passRate = run.totalCases > 0 ? run.passedCases / run.totalCases : 0;
      stats.scores.push(passRate);

      // 收集详细指标
      if (metadata.metrics) {
        for (const [key, value] of Object.entries(metadata.metrics)) {
          if (!stats.metrics[key]) stats.metrics[key] = [];
          stats.metrics[key].push(value as number);
        }
      }

      // 收集延迟
      if (metadata.latency) {
        stats.latencies.push(metadata.latency);
      }

      // 更新最后评测时间
      if (run.createdAt > stats.lastEvaluatedAt) {
        stats.lastEvaluatedAt = run.createdAt;
      }
    }

    // 计算平均分数
    const entries: LeaderboardEntry[] = [];
    const weights = config.metricWeights || { passRate: 1 };

    for (const [modelId, stats] of modelStats.entries()) {
      const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length || 0;
      const avgLatency = stats.latencies.length > 0
        ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
        : 0;

      // 计算各指标平均分
      const metrics: Record<string, number> = {};
      for (const [key, values] of Object.entries(stats.metrics)) {
        metrics[key] = values.reduce((a, b) => a + b, 0) / values.length || 0;
      }

      // 计算加权总分
      let overallScore = avgScore * (weights.passRate || 1);
      for (const [key, weight] of Object.entries(weights)) {
        if (metrics[key] !== undefined) {
          overallScore += metrics[key] * weight;
        }
      }
      overallScore /= Object.values(weights).reduce((a, b) => a + b, 0);

      entries.push({
        rank: 0, // 稍后排序后设置
        modelId,
        modelName: stats.modelName,
        overallScore,
        metrics,
        totalEvaluations: stats.count,
        avgLatency,
        lastEvaluatedAt: stats.lastEvaluatedAt,
      });
    }

    // 排序并设置排名
    entries.sort((a, b) => b.overallScore - a.overallScore);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return {
      config,
      entries,
      generatedAt: new Date(),
    };
  }

  // 获取模型对比
  async compareModels(modelIds: string[]): Promise<{
    models: { id: string; name: string }[];
    comparison: Record<string, {
      modelId: string;
      modelName: string;
      avgScore: number;
      metrics: Record<string, number>;
      trend: 'up' | 'down' | 'stable';
    }>;
  }> {
    const comparison: Record<string, any> = {};
    const models: { id: string; name: string }[] = [];

    for (const modelId of modelIds) {
      // 获取该模型的最近评测
      const recentRuns = await this.prisma.evalRun.findMany({
        where: {
          status: 'completed',
          skillId: modelId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (recentRuns.length === 0) continue;

      const scores = recentRuns.map(r => r.totalCases > 0 ? r.passedCases / r.totalCases : 0);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      // 计算趋势
      const recentAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const olderAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const trend = recentAvg > olderAvg + 0.05 ? 'up' : recentAvg < olderAvg - 0.05 ? 'down' : 'stable';

      const metadata = JSON.parse(recentRuns[0].metadata || '{}');
      models.push({ id: modelId, name: metadata.model || recentRuns[0].skill?.name || modelId });

      comparison[modelId] = {
        modelId,
        modelName: metadata.model || recentRuns[0].skill?.name || modelId,
        avgScore,
        metrics: metadata.metrics || {},
        trend,
      };
    }

    return { models, comparison };
  }

  // 获取历史趋势
  async getTrend(modelId: string, days: number = 30): Promise<{
    modelId: string;
    dataPoints: {
      date: string;
      score: number;
      evaluations: number;
    }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const evalRuns = await this.prisma.evalRun.findMany({
      where: {
        status: 'completed',
        skillId: modelId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 按日期分组
    const dailyData = new Map<string, { scores: number[]; count: number }>();

    for (const run of evalRuns) {
      const date = run.createdAt.toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { scores: [], count: 0 });
      }
      const data = dailyData.get(date)!;
      data.count++;
      data.scores.push(run.totalCases > 0 ? run.passedCases / run.totalCases : 0);
    }

    // 转换为数组
    const dataPoints = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      score: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      evaluations: data.count,
    }));

    return {
      modelId,
      dataPoints,
    };
  }

  // 获取排行榜摘要
  async getLeaderboardSummary(): Promise<{
    totalModels: number;
    totalEvaluations: number;
    topModel: { id: string; name: string; score: number } | null;
    recentActivity: {
      date: string;
      evaluations: number;
      avgScore: number;
    }[];
  }> {
    const evalRuns = await this.prisma.evalRun.findMany({
      where: { status: 'completed' },
      include: { skill: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // 统计模型数
    const modelIds = new Set(evalRuns.map(r => r.skillId).filter(Boolean));
    
    // 找最佳模型
    const modelScores = new Map<string, { name: string; scores: number[] }>();
    for (const run of evalRuns) {
      if (!run.skillId) continue;
      if (!modelScores.has(run.skillId)) {
        modelScores.set(run.skillId, {
          name: run.skill?.name || 'Unknown',
          scores: [],
        });
      }
      const score = run.totalCases > 0 ? run.passedCases / run.totalCases : 0;
      modelScores.get(run.skillId)!.scores.push(score);
    }

    let topModel = null;
    let topScore = 0;
    for (const [id, data] of modelScores.entries()) {
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      if (avg > topScore) {
        topScore = avg;
        topModel = { id, name: data.name, score: avg };
      }
    }

    // 最近活动
    const recentActivity = new Map<string, { scores: number[]; count: number }>();
    for (const run of evalRuns.slice(0, 30)) {
      const date = run.createdAt.toISOString().split('T')[0];
      if (!recentActivity.has(date)) {
        recentActivity.set(date, { scores: [], count: 0 });
      }
      const data = recentActivity.get(date)!;
      data.count++;
      data.scores.push(run.totalCases > 0 ? run.passedCases / run.totalCases : 0);
    }

    const activity = Array.from(recentActivity.entries())
      .map(([date, data]) => ({
        date,
        evaluations: data.count,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    return {
      totalModels: modelIds.size,
      totalEvaluations: evalRuns.length,
      topModel,
      recentActivity: activity,
    };
  }
}
