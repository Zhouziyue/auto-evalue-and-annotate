// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 聚合维度
export enum AggregationDimension {
  MODEL = 'model',
  DATASET = 'dataset',
  SKILL = 'skill',
  TIME = 'time',
  METRIC = 'metric',
  USER = 'user',
  TAG = 'tag',
}

// 聚合函数
export enum AggregationFunction {
  AVG = 'avg',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  MEDIAN = 'median',
  P95 = 'p95',
  STDDEV = 'stddev',
}

// 聚合查询
export interface AggregationQuery {
  dimensions: AggregationDimension[];
  metrics: string[];
  functions: AggregationFunction[];
  filters?: Record<string, any>;
  timeRange?: { start: Date; end: Date };
  groupBy?: string;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

// 聚合结果
export interface AggregationResult {
  groups: AggregationGroup[];
  summary: Record<string, number>;
  totalRecords: number;
  queryTime: number;
}

// 聚合分组
export interface AggregationGroup {
  key: string;
  dimensions: Record<string, string>;
  values: Record<string, number>;
  count: number;
}

// 趋势数据点
export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  count: number;
}

// 趋势数据
export interface TrendData {
  metric: string;
  dimension: string;
  dimensionValue: string;
  dataPoints: TrendDataPoint[];
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
}

@Injectable()
export class MetricsAggregationService {
  constructor(private prisma: PrismaService) {}

  // 执行聚合查询
  async aggregate(query: AggregationQuery): Promise<AggregationResult> {
    const startTime = Date.now();

    // 获取评测运行数据
    const evalRuns = await this.prisma.evalRun.findMany({
      include: {
        results: true,
        skill: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // 提取指标数据
    const records: Array<Record<string, any>> = [];
    for (const run of evalRuns) {
      for (const result of run.results) {
        const scores = (result.scores as Record<string, number>) || {};
        const record: Record<string, any> = {
          model: run.skill?.name || 'unknown',
          dataset: 'default',
          skill: run.skill?.name || 'unknown',
          timestamp: run.createdAt,
          ...scores,
        };
        records.push(record);
      }
    }

    // 应用过滤
    let filtered = records;
    if (query.filters) {
      filtered = records.filter(r => {
        for (const [key, value] of Object.entries(query.filters!)) {
          if (r[key] !== value) return false;
        }
        return true;
      });
    }

    // 应用时间范围
    if (query.timeRange) {
      filtered = filtered.filter(r =>
        r.timestamp >= query.timeRange!.start && r.timestamp <= query.timeRange!.end,
      );
    }

    // 分组聚合
    const groups = this.groupAndAggregate(filtered, query);

    // 计算汇总
    const summary: Record<string, number> = {};
    for (const metric of query.metrics) {
      const values = filtered.map(r => r[metric]).filter(v => typeof v === 'number');
      for (const fn of query.functions) {
        const key = `${fn}_${metric}`;
        summary[key] = this.applyFunction(values, fn);
      }
    }

    return {
      groups,
      summary,
      totalRecords: filtered.length,
      queryTime: Date.now() - startTime,
    };
  }

  // 获取趋势数据
  async getTrend(
    metric: string,
    dimension: AggregationDimension,
    dimensionValue: string,
    options?: { buckets?: number; timeRange?: { start: Date; end: Date } },
  ): Promise<TrendData> {
    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    // 提取数据点
    const allPoints: TrendDataPoint[] = [];
    for (const run of evalRuns) {
      const matchesDimension = this.matchesDimension(run, dimension, dimensionValue);
      if (!matchesDimension) continue;

      for (const result of run.results) {
        const scores = (result.scores as Record<string, number>) || {};
        if (metric in scores) {
          allPoints.push({
            timestamp: run.createdAt,
            value: scores[metric],
            count: 1,
          });
        }
      }
    }

    // 按时间桶聚合
    const buckets = options?.buckets || 20;
    const dataPoints = this.bucketize(allPoints, buckets);

    // 计算趋势
    const trend = this.calculateTrend(dataPoints);
    const changePercent = this.calculateChange(dataPoints);

    return {
      metric,
      dimension,
      dimensionValue,
      dataPoints,
      trend,
      changePercent,
    };
  }

  // 获取对比数据
  async compare(
    dimension: AggregationDimension,
    values: string[],
    metrics: string[],
  ): Promise<{
    dimension: AggregationDimension;
    metrics: string[];
    comparison: Array<{
      value: string;
      scores: Record<string, { avg: number; min: number; max: number; count: number }>;
    }>;
  }> {
    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      take: 500,
    });

    const comparison = [];
    for (const val of values) {
      const scores: Record<string, number[]> = {};
      for (const metric of metrics) scores[metric] = [];

      for (const run of evalRuns) {
        if (!this.matchesDimension(run, dimension, val)) continue;
        for (const result of run.results) {
          const resultScores = (result.scores as Record<string, number>) || {};
          for (const metric of metrics) {
            if (metric in resultScores) {
              scores[metric].push(resultScores[metric]);
            }
          }
        }
      }

      const metricStats: Record<string, { avg: number; min: number; max: number; count: number }> = {};
      for (const [metric, vals] of Object.entries(scores)) {
        metricStats[metric] = {
          avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
          min: vals.length > 0 ? Math.min(...vals) : 0,
          max: vals.length > 0 ? Math.max(...vals) : 0,
          count: vals.length,
        };
      }

      comparison.push({ value: val, scores: metricStats });
    }

    return { dimension, metrics, comparison };
  }

  // 获取分布数据
  async getDistribution(
    metric: string,
    options?: { buckets?: number; model?: string },
  ): Promise<{
    metric: string;
    distribution: Array<{ range: string; count: number; percentage: number }>;
    statistics: { mean: number; median: number; stddev: number; p25: number; p75: number };
  }> {
    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      take: 500,
    });

    const values: number[] = [];
    for (const run of evalRuns) {
      if (options?.model && run.skill?.name !== options.model) continue;
      for (const result of run.results) {
        const scores = (result.scores as Record<string, number>) || {};
        if (metric in scores) values.push(scores[metric]);
      }
    }

    // 计算分布
    const bucketCount = options?.buckets || 10;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 1;
    const bucketSize = (max - min) / bucketCount || 0.1;

    const distribution = [];
    for (let i = 0; i < bucketCount; i++) {
      const low = min + i * bucketSize;
      const high = low + bucketSize;
      const count = values.filter(v => v >= low && (i === bucketCount - 1 ? v <= high : v < high)).length;
      distribution.push({
        range: `${low.toFixed(2)}-${high.toFixed(2)}`,
        count,
        percentage: values.length > 0 ? count / values.length : 0,
      });
    }

    // 计算统计量
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
    const p25 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.25)] : 0;
    const p75 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.75)] : 0;
    const variance = values.length > 0
      ? values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      : 0;
    const stddev = Math.sqrt(variance);

    return {
      metric,
      distribution,
      statistics: { mean, median, stddev, p25, p75 },
    };
  }

  // 分组聚合
  private groupAndAggregate(
    records: Array<Record<string, any>>,
    query: AggregationQuery,
  ): AggregationGroup[] {
    const groups = new Map<string, Array<Record<string, any>>>();

    for (const record of records) {
      const key = query.dimensions.map(d => record[d] || 'unknown').join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(record);
    }

    const result: AggregationGroup[] = [];
    for (const [key, groupRecords] of groups.entries()) {
      const dimensions: Record<string, string> = {};
      query.dimensions.forEach((d, i) => {
        dimensions[d] = key.split('|')[i] || 'unknown';
      });

      const values: Record<string, number> = {};
      for (const metric of query.metrics) {
        const metricValues = groupRecords
          .map(r => r[metric])
          .filter(v => typeof v === 'number');

        for (const fn of query.functions) {
          values[`${fn}_${metric}`] = this.applyFunction(metricValues, fn);
        }
      }

      result.push({
        key,
        dimensions,
        values,
        count: groupRecords.length,
      });
    }

    // 排序
    if (query.orderBy) {
      result.sort((a, b) => {
        const aVal = a.values[query.orderBy!.field] || 0;
        const bVal = b.values[query.orderBy!.field] || 0;
        return query.orderBy!.direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    if (query.limit) return result.slice(0, query.limit);
    return result;
  }

  // 应用聚合函数
  private applyFunction(values: number[], fn: AggregationFunction): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);

    switch (fn) {
      case AggregationFunction.AVG:
        return values.reduce((a, b) => a + b, 0) / values.length;
      case AggregationFunction.SUM:
        return values.reduce((a, b) => a + b, 0);
      case AggregationFunction.MIN:
        return Math.min(...values);
      case AggregationFunction.MAX:
        return Math.max(...values);
      case AggregationFunction.COUNT:
        return values.length;
      case AggregationFunction.MEDIAN:
        return sorted[Math.floor(sorted.length / 2)];
      case AggregationFunction.P95:
        return sorted[Math.floor(sorted.length * 0.95)];
      case AggregationFunction.STDDEV: {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      }
      default:
        return 0;
    }
  }

  // 匹配维度
  private matchesDimension(run: any, dimension: AggregationDimension, value: string): boolean {
    switch (dimension) {
      case AggregationDimension.MODEL:
      case AggregationDimension.SKILL:
        return run.skill?.name === value;
      default:
        return true;
    }
  }

  // 分桶
  private bucketize(points: TrendDataPoint[], bucketCount: number): TrendDataPoint[] {
    if (points.length <= bucketCount) return points;

    const sorted = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const bucketSize = Math.ceil(sorted.length / bucketCount);
    const result: TrendDataPoint[] = [];

    for (let i = 0; i < sorted.length; i += bucketSize) {
      const bucket = sorted.slice(i, i + bucketSize);
      const avgValue = bucket.reduce((sum, p) => sum + p.value, 0) / bucket.length;
      result.push({
        timestamp: bucket[Math.floor(bucket.length / 2)].timestamp,
        value: avgValue,
        count: bucket.length,
      });
    }

    return result;
  }

  // 计算趋势
  private calculateTrend(points: TrendDataPoint[]): TrendData['trend'] {
    if (points.length < 2) return 'stable';
    const first = points.slice(0, Math.ceil(points.length / 2));
    const second = points.slice(Math.ceil(points.length / 2));
    const avgFirst = first.reduce((s, p) => s + p.value, 0) / first.length;
    const avgSecond = second.reduce((s, p) => s + p.value, 0) / second.length;
    const change = ((avgSecond - avgFirst) / avgFirst) * 100;
    if (change > 2) return 'improving';
    if (change < -2) return 'degrading';
    return 'stable';
  }

  // 计算变化百分比
  private calculateChange(points: TrendDataPoint[]): number {
    if (points.length < 2) return 0;
    const first = points[0].value;
    const last = points[points.length - 1].value;
    return first !== 0 ? ((last - first) / first) * 100 : 0;
  }
}
