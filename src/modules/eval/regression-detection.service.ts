// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 回归类型
export enum RegressionType {
  PERFORMANCE = 'performance',     // 性能回归（延迟增加）
  QUALITY = 'quality',             // 质量回归（分数下降）
  COST = 'cost',                   // 成本回归（成本增加）
  THROUGHPUT = 'throughput',       // 吞吐量回归
}

// 回归检测结果
export interface RegressionDetection {
  id: string;
  type: RegressionType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  baselineValue: number;
  change: number;         // 变化百分比
  changeAbsolute: number; // 绝对变化
  threshold: number;      // 触发阈值
  message: string;
  detectedAt: Date;
  context?: Record<string, any>;
}

// 基线配置
export interface BaselineConfig {
  id: string;
  name: string;
  metric: string;
  value: number;
  threshold: number;       // 回归阈值（百分比）
  type: RegressionType;
  createdAt: Date;
  updatedAt: Date;
}

// 回归趋势
export interface RegressionTrend {
  metric: string;
  dataPoints: Array<{
    timestamp: Date;
    value: number;
    isRegression: boolean;
  }>;
  trend: 'improving' | 'stable' | 'degrading';
  regressionCount: number;
}

@Injectable()
export class RegressionDetectionService {
  private baselines: Map<string, BaselineConfig> = new Map();
  private detections: RegressionDetection[] = [];
  private history: Map<string, Array<{ timestamp: Date; value: number }>> = new Map();

  constructor(private prisma: PrismaService) {
    // 初始化默认基线
    this.initDefaultBaselines();
  }

  private initDefaultBaselines() {
    const defaults: BaselineConfig[] = [
      {
        id: 'baseline_latency_p50',
        name: 'P50 延迟基线',
        metric: 'latency_p50',
        value: 1000,
        threshold: 20,
        type: RegressionType.PERFORMANCE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'baseline_latency_p95',
        name: 'P95 延迟基线',
        metric: 'latency_p95',
        value: 3000,
        threshold: 30,
        type: RegressionType.PERFORMANCE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'baseline_accuracy',
        name: '准确率基线',
        metric: 'accuracy',
        value: 0.85,
        threshold: 5,
        type: RegressionType.QUALITY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'baseline_cost_per_request',
        name: '单次请求成本基线',
        metric: 'cost_per_request',
        value: 0.01,
        threshold: 50,
        type: RegressionType.COST,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const baseline of defaults) {
      this.baselines.set(baseline.id, baseline);
    }
  }

  // 检测回归
  detectRegression(
    metric: string,
    currentValue: number,
    context?: Record<string, any>,
  ): RegressionDetection | null {
    // 记录历史
    if (!this.history.has(metric)) {
      this.history.set(metric, []);
    }
    this.history.get(metric)!.push({ timestamp: new Date(), value: currentValue });

    // 查找对应基线
    const baseline = Array.from(this.baselines.values()).find(b => b.metric === metric);
    if (!baseline) return null;

    // 计算变化
    const changeAbsolute = currentValue - baseline.value;
    const change = baseline.value !== 0
      ? (changeAbsolute / baseline.value) * 100
      : 0;

    // 判断是否回归（根据类型不同，方向不同）
    let isRegression = false;
    switch (baseline.type) {
      case RegressionType.PERFORMANCE:
      case RegressionType.COST:
        // 延迟/成本增加是回归
        isRegression = change > baseline.threshold;
        break;
      case RegressionType.QUALITY:
      case RegressionType.THROUGHPUT:
        // 质量/吞吐量下降是回归
        isRegression = change < -baseline.threshold;
        break;
    }

    if (!isRegression) return null;

    // 确定严重程度
    const absChange = Math.abs(change);
    let severity: RegressionDetection['severity'];
    if (absChange > baseline.threshold * 3) {
      severity = 'critical';
    } else if (absChange > baseline.threshold * 2) {
      severity = 'high';
    } else if (absChange > baseline.threshold * 1.5) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // 生成消息
    const direction = change > 0 ? '增加' : '下降';
    const message = `${baseline.name}检测到回归: 当前值 ${currentValue.toFixed(2)}, ` +
      `基线值 ${baseline.value.toFixed(2)}, ${direction} ${Math.abs(change).toFixed(1)}%`;

    const detection: RegressionDetection = {
      id: `regression_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: baseline.type,
      severity,
      metric,
      currentValue,
      baselineValue: baseline.value,
      change,
      changeAbsolute,
      threshold: baseline.threshold,
      message,
      detectedAt: new Date(),
      context,
    };

    this.detections.push(detection);
    return detection;
  }

  // 批量检测
  detectBatch(
    metrics: Record<string, number>,
    context?: Record<string, any>,
  ): RegressionDetection[] {
    const results: RegressionDetection[] = [];

    for (const [metric, value] of Object.entries(metrics)) {
      const detection = this.detectRegression(metric, value, context);
      if (detection) {
        results.push(detection);
      }
    }

    return results;
  }

  // 设置基线
  setBaseline(config: Omit<BaselineConfig, 'id' | 'createdAt' | 'updatedAt'>): BaselineConfig {
    const id = `baseline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const baseline: BaselineConfig = {
      ...config,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.baselines.set(id, baseline);
    return baseline;
  }

  // 从评测运行结果自动设置基线
  setBaselineFromEvalRun(evalRunId: string): BaselineConfig[] {
    // 这里简化处理，实际应从数据库查询
    const baselines: BaselineConfig[] = [];
    return baselines;
  }

  // 获取所有基线
  getBaselines(): BaselineConfig[] {
    return Array.from(this.baselines.values());
  }

  // 获取单个基线
  getBaseline(id: string): BaselineConfig | undefined {
    return this.baselines.get(id);
  }

  // 更新基线
  updateBaseline(id: string, updates: Partial<BaselineConfig>): BaselineConfig | undefined {
    const baseline = this.baselines.get(id);
    if (!baseline) return undefined;

    Object.assign(baseline, updates, { updatedAt: new Date() });
    return baseline;
  }

  // 删除基线
  deleteBaseline(id: string): boolean {
    return this.baselines.delete(id);
  }

  // 获取回归检测历史
  getDetections(options?: {
    type?: RegressionType;
    severity?: string;
    since?: Date;
    limit?: number;
  }): RegressionDetection[] {
    let filtered = [...this.detections];

    if (options?.type) {
      filtered = filtered.filter(d => d.type === options.type);
    }
    if (options?.severity) {
      filtered = filtered.filter(d => d.severity === options.severity);
    }
    if (options?.since) {
      filtered = filtered.filter(d => d.detectedAt >= options.since);
    }

    // 按时间倒序
    filtered.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // 获取指标趋势
  getTrend(metric: string, limit?: number): RegressionTrend | null {
    const history = this.history.get(metric);
    if (!history || history.length === 0) return null;

    const baseline = Array.from(this.baselines.values()).find(b => b.metric === metric);
    const dataPoints = history.map(point => ({
      timestamp: point.timestamp,
      value: point.value,
      isRegression: baseline ? this.isRegressionPoint(baseline, point.value) : false,
    }));

    // 计算趋势
    const recent = dataPoints.slice(-10);
    const trend = this.calculateTrend(recent);

    const regressionCount = dataPoints.filter(p => p.isRegression).length;

    return {
      metric,
      dataPoints: limit ? dataPoints.slice(-limit) : dataPoints,
      trend,
      regressionCount,
    };
  }

  // 判断是否为回归点
  private isRegressionPoint(baseline: BaselineConfig, value: number): boolean {
    const change = ((value - baseline.value) / baseline.value) * 100;
    switch (baseline.type) {
      case RegressionType.PERFORMANCE:
      case RegressionType.COST:
        return change > baseline.threshold;
      case RegressionType.QUALITY:
      case RegressionType.THROUGHPUT:
        return change < -baseline.threshold;
      default:
        return false;
    }
  }

  // 计算趋势
  private calculateTrend(points: RegressionTrend['dataPoints']): RegressionTrend['trend'] {
    if (points.length < 2) return 'stable';

    const values = points.map(p => p.value);
    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.ceil(values.length / 2));

    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (change > 5) return 'degrading';
    if (change < -5) return 'improving';
    return 'stable';
  }

  // 获取回归统计
  getStats(): {
    totalDetections: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    recentCount: number;
  } {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const d of this.detections) {
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
      byType[d.type] = (byType[d.type] || 0) + 1;
    }

    // 最近24小时的检测数
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = this.detections.filter(d => d.detectedAt >= oneDayAgo).length;

    return {
      totalDetections: this.detections.length,
      bySeverity,
      byType,
      recentCount,
    };
  }
}
