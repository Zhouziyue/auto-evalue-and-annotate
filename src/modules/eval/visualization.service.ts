// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 图表类型
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap',
  RADAR = 'radar',
  BOX = 'box',
  HISTOGRAM = 'histogram',
  FUNNEL = 'funnel',
  SANKEY = 'sankey',
  GAUGE = 'gauge',
  TREEMAP = 'treemap',
}

// 图表数据系列
export interface ChartSeries {
  name: string;
  data: number[] | Array<{ x: any; y: number }>;
  color?: string;
  type?: ChartType;
}

// 图表配置
export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis?: { label: string; categories?: string[] };
  yAxis?: { label: string; min?: number; max?: number };
  series: ChartSeries[];
  legend?: boolean;
  tooltip?: boolean;
  annotations?: Array<{ type: string; value: any; label: string }>;
}

// 仪表盘数据
export interface DashboardData {
  id: string;
  name: string;
  charts: ChartConfig[];
  filters: DashboardFilter[];
  layout: Array<{ chartIndex: number; x: number; y: number; w: number; h: number }>;
  updatedAt: Date;
}

// 仪表盘过滤器
export interface DashboardFilter {
  id: string;
  type: 'date_range' | 'model' | 'dataset' | 'metric' | 'custom';
  label: string;
  defaultValue?: any;
  options?: any[];
}

@Injectable()
export class VisualizationService {
  constructor(private prisma: PrismaService) {}

  private dashboards: Map<string, DashboardData> = new Map();

  // 获取评测概览数据
  async getOverviewData(timeRange?: { start: Date; end: Date }): Promise<{
    totalRuns: number;
    totalModels: number;
    avgAccuracy: number;
    avgLatency: number;
    trendData: Array<{ date: string; runs: number; accuracy: number }>;
    modelDistribution: Array<{ model: string; count: number }>;
    recentRuns: Array<{ id: string; status: string; createdAt: Date; metrics: Record<string, number> }>;
  }> {
    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const filtered = timeRange
      ? evalRuns.filter(r => r.createdAt >= timeRange.start && r.createdAt <= timeRange.end)
      : evalRuns;

    // 趋势数据
    const dateMap = new Map<string, { runs: number; accuracySum: number; count: number }>();
    for (const run of filtered) {
      const date = run.createdAt.toISOString().split('T')[0];
      if (!dateMap.has(date)) dateMap.set(date, { runs: 0, accuracySum: 0, count: 0 });
      const entry = dateMap.get(date)!;
      entry.runs++;
      for (const result of run.results) {
        const scores = (result.scores as Record<string, number>) || {};
        if (scores.accuracy !== undefined) {
          entry.accuracySum += scores.accuracy;
          entry.count++;
        }
      }
    }

    const trendData = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        runs: data.runs,
        accuracy: data.count > 0 ? data.accuracySum / data.count : 0,
      }));

    // 模型分布
    const modelCounts = new Map<string, number>();
    for (const run of filtered) {
      const name = run.skill?.name || 'unknown';
      modelCounts.set(name, (modelCounts.get(name) || 0) + 1);
    }
    const modelDistribution = Array.from(modelCounts.entries()).map(([model, count]) => ({ model, count }));

    // 平均指标
    let totalAccuracy = 0, accuracyCount = 0, totalLatency = 0, latencyCount = 0;
    for (const run of filtered) {
      for (const result of run.results) {
        const scores = (result.scores as Record<string, number>) || {};
        if (scores.accuracy !== undefined) { totalAccuracy += scores.accuracy; accuracyCount++; }
        if (scores.latency !== undefined) { totalLatency += scores.latency; latencyCount++; }
      }
    }

    return {
      totalRuns: filtered.length,
      totalModels: modelCounts.size,
      avgAccuracy: accuracyCount > 0 ? totalAccuracy / accuracyCount : 0,
      avgLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      trendData,
      modelDistribution,
      recentRuns: filtered.slice(0, 10).map(r => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        metrics: r.results.reduce((acc, res) => ({ ...acc, ...((res.scores as Record<string, number>) || {}) }), {}),
      })),
    };
  }

  // 生成折线图数据
  generateLineChart(title: string, labels: string[], series: ChartSeries[]): ChartConfig {
    return {
      type: ChartType.LINE,
      title,
      xAxis: { label: 'X', categories: labels },
      yAxis: { label: 'Value' },
      series,
      legend: true,
      tooltip: true,
    };
  }

  // 生成柱状图数据
  generateBarChart(title: string, categories: string[], values: number[], color?: string): ChartConfig {
    return {
      type: ChartType.BAR,
      title,
      xAxis: { label: 'Category', categories },
      yAxis: { label: 'Value' },
      series: [{ name: title, data: values, color }],
      legend: false,
      tooltip: true,
    };
  }

  // 生成饼图数据
  generatePieChart(title: string, data: Array<{ name: string; value: number }>): ChartConfig {
    return {
      type: ChartType.PIE,
      title,
      series: [{ name: title, data: data.map(d => d.value) }],
      xAxis: { label: '', categories: data.map(d => d.name) },
      legend: true,
      tooltip: true,
    };
  }

  // 生成雷达图数据
  generateRadarChart(title: string, dimensions: string[], series: ChartSeries[]): ChartConfig {
    return {
      type: ChartType.RADAR,
      title,
      xAxis: { label: '', categories: dimensions },
      series,
      legend: true,
      tooltip: true,
    };
  }

  // 生成热力图数据
  generateHeatmap(title: string, xLabels: string[], yLabels: string[], values: number[][]): ChartConfig {
    const flatData = [];
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        flatData.push({ x: xLabels[j], y: yLabels[i], value: values[i][j] });
      }
    }
    return {
      type: ChartType.HEATMAP,
      title,
      series: [{ name: title, data: flatData as any }],
      tooltip: true,
    };
  }

  // 生成散点图数据
  generateScatterChart(title: string, points: Array<{ x: number; y: number; label?: string }>): ChartConfig {
    return {
      type: ChartType.SCATTER,
      title,
      xAxis: { label: 'X' },
      yAxis: { label: 'Y' },
      series: [{ name: title, data: points.map(p => ({ x: p.x, y: p.y })) }],
      tooltip: true,
    };
  }

  // 生成漏斗图数据
  generateFunnelChart(title: string, stages: Array<{ name: string; value: number }>): ChartConfig {
    return {
      type: ChartType.FUNNEL,
      title,
      series: [{ name: title, data: stages.map(s => s.value) }],
      xAxis: { label: '', categories: stages.map(s => s.name) },
      legend: false,
      tooltip: true,
    };
  }

  // 生成仪表盘
  async generateDashboard(name: string, options?: {
    timeRange?: { start: Date; end: Date };
    models?: string[];
  }): Promise<DashboardData> {
    const overview = await this.getOverviewData(options?.timeRange);

    const charts: ChartConfig[] = [
      // 评测趋势
      this.generateLineChart(
        '评测趋势',
        overview.trendData.map(t => t.date),
        [
          { name: '评测次数', data: overview.trendData.map(t => t.runs) },
          { name: '平均准确率', data: overview.trendData.map(t => t.accuracy * 100) },
        ],
      ),
      // 模型分布
      this.generatePieChart(
        '模型使用分布',
        overview.modelDistribution.map(m => ({ name: m.model, value: m.count })),
      ),
      // 指标概览柱状图
      this.generateBarChart(
        '核心指标',
        ['准确率', '延迟(ms)'],
        [overview.avgAccuracy * 100, overview.avgLatency],
      ),
    ];

    const dashboard: DashboardData = {
      id: `dash_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      charts,
      filters: [
        { id: 'date', type: 'date_range', label: '时间范围' },
        { id: 'model', type: 'model', label: '模型', options: overview.modelDistribution.map(m => m.model) },
      ],
      layout: charts.map((_, i) => ({
        chartIndex: i,
        x: (i % 2) * 6,
        y: Math.floor(i / 2) * 4,
        w: 6,
        h: 4,
      })),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  // 获取仪表盘
  async getDashboard(id: string): Promise<DashboardData | undefined> {
    return this.dashboards.get(id);
  }

  // 获取仪表盘列表
  async listDashboards(): Promise<DashboardData[]> {
    return Array.from(this.dashboards.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // 删除仪表盘
  async deleteDashboard(id: string): Promise<boolean> {
    return this.dashboards.delete(id);
  }

  // 获取评测对比图表数据
  async getComparisonChartData(modelIds: string[], metrics: string[]): Promise<ChartConfig> {
    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      take: 200,
    });

    const series: ChartSeries[] = [];
    for (const metric of metrics) {
      const data: number[] = [];
      for (const modelId of modelIds) {
        const modelRuns = evalRuns.filter(r => r.skill?.id === modelId || r.skill?.name === modelId);
        let sum = 0, count = 0;
        for (const run of modelRuns) {
          for (const result of run.results) {
            const scores = (result.scores as Record<string, number>) || {};
            if (scores[metric] !== undefined) { sum += scores[metric]; count++; }
          }
        }
        data.push(count > 0 ? sum / count : 0);
      }
      series.push({ name: metric, data });
    }

    return this.generateBarChart('模型对比', modelIds, series[0]?.data as number[] || []);
  }

  // 获取指标分布图
  async getDistributionChartData(metric: string, model?: string): Promise<ChartConfig> {
    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      take: 200,
    });

    const values: number[] = [];
    for (const run of evalRuns) {
      if (model && run.skill?.name !== model) continue;
      for (const result of run.results) {
        const scores = (result.scores as Record<string, number>) || {};
        if (scores[metric] !== undefined) values.push(scores[metric]);
      }
    }

    // 直方图
    const bucketCount = 10;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 1;
    const bucketSize = (max - min) / bucketCount || 0.1;
    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const low = min + i * bucketSize;
      return values.filter(v => v >= low && v < low + bucketSize).length;
    });

    const labels = Array.from({ length: bucketCount }, (_, i) =>
      (min + i * bucketSize).toFixed(2),
    );

    return this.generateBarChart(`${metric} 分布`, labels, buckets);
  }
}
