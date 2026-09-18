// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 搜索过滤器
export interface SearchFilter {
  keyword?: string;
  modelIds?: string[];
  datasetIds?: string[];
  status?: string[];
  metricRange?: Record<string, { min?: number; max?: number }>;
  timeRange?: { start: Date; end: Date };
  tags?: string[];
  scoreRange?: { min?: number; max?: number };
}

// 搜索结果
export interface SearchResult {
  id: string;
  type: 'eval_run' | 'result' | 'trace';
  title: string;
  subtitle?: string;
  scores: Record<string, number>;
  metadata: Record<string, any>;
  timestamp: Date;
  highlight?: string;
  relevanceScore: number;
}

// 搜索结果页
export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  pageSize: number;
  results: SearchResult[];
  facets: SearchFacets;
  suggestions: string[];
  queryTime: number;
}

// 搜索 facets（聚合统计）
export interface SearchFacets {
  models: Array<{ name: string; count: number }>;
  statuses: Array<{ name: string; count: number }>;
  metrics: Record<string, { min: number; max: number; avg: number }>;
  dateHistogram: Array<{ date: string; count: number }>;
}

// 搜索建议
export interface SearchSuggestion {
  text: string;
  type: 'model' | 'metric' | 'dataset' | 'keyword';
  score: number;
}

@Injectable()
export class ResultSearchService {
  constructor(private prisma: PrismaService) {}

  private searchIndex: SearchResult[] = [];
  private indexBuilt = false;

  // 构建搜索索引
  async buildIndex(): Promise<{ indexed: number; time: number }> {
    const startTime = Date.now();
    this.searchIndex = [];

    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      take: 2000,
    });

    for (const run of evalRuns) {
      // 索引运行级别
      this.searchIndex.push({
        id: run.id,
        type: 'eval_run',
        title: `Eval Run ${run.id.substring(0, 8)}`,
        subtitle: run.skill?.name || 'unknown',
        scores: run.results.reduce((acc, r) => ({ ...acc, ...((r.scores as Record<string, number>) || {}) }), {}),
        metadata: {
          status: run.status,
          modelId: run.skillId,
          modelName: run.skill?.name,
          resultCount: run.results.length,
        },
        timestamp: run.createdAt,
        relevanceScore: 1,
      });

      // 索引结果级别
      for (const result of run.results) {
        const scores = (result.scores as Record<string, number>) || {};
        this.searchIndex.push({
          id: result.id,
          type: 'result',
          title: `Result ${result.id.substring(0, 8)}`,
          subtitle: `Run: ${run.id.substring(0, 8)} | Model: ${run.skill?.name || 'unknown'}`,
          scores,
          metadata: {
            runId: run.id,
            modelId: run.skillId,
            modelName: run.skill?.name,
            input: result.input ? String(result.input).substring(0, 200) : '',
            output: result.output ? String(result.output).substring(0, 200) : '',
          },
          timestamp: run.createdAt,
          relevanceScore: 1,
        });
      }
    }

    this.indexBuilt = true;
    return { indexed: this.searchIndex.length, time: Date.now() - startTime };
  }

  // 执行搜索
  async search(query: string, options?: {
    filters?: SearchFilter;
    page?: number;
    pageSize?: number;
    sortBy?: 'relevance' | 'date' | 'score';
  }): Promise<SearchResponse> {
    const startTime = Date.now();

    if (!this.indexBuilt) await this.buildIndex();

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const sortBy = options?.sortBy || 'relevance';

    let results = [...this.searchIndex];

    // 关键词搜索
    if (query && query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(r => {
        const searchable = [
          r.title, r.subtitle, r.type,
          ...Object.keys(r.scores),
          r.metadata.modelName,
          r.metadata.input,
          r.metadata.output,
          r.metadata.status,
        ].filter(Boolean).join(' ').toLowerCase();

        return searchable.includes(q);
      });

      // 计算相关性分数
      for (const r of results) {
        r.relevanceScore = this.calculateRelevance(r, q);
      }
    }

    // 应用过滤器
    if (options?.filters) {
      results = this.applyFilters(results, options.filters);
    }

    // 排序
    switch (sortBy) {
      case 'date':
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
      case 'score':
        results.sort((a, b) => {
          const aAvg = Object.values(a.scores).reduce((s, v) => s + v, 0) / (Object.keys(a.scores).length || 1);
          const bAvg = Object.values(b.scores).reduce((s, v) => s + v, 0) / (Object.keys(b.scores).length || 1);
          return bAvg - aAvg;
        });
        break;
      default:
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // 计算 facets
    const facets = this.calculateFacets(results);

    // 分页
    const total = results.length;
    const paginatedResults = results.slice((page - 1) * pageSize, page * pageSize);

    // 搜索建议
    const suggestions = this.generateSuggestions(query);

    return {
      query,
      total,
      page,
      pageSize,
      results: paginatedResults,
      facets,
      suggestions,
      queryTime: Date.now() - startTime,
    };
  }

  // 计算相关性
  private calculateRelevance(result: SearchResult, query: string): number {
    let score = 0;
    if (result.title.toLowerCase().includes(query)) score += 3;
    if (result.subtitle?.toLowerCase().includes(query)) score += 2;
    if (result.metadata.input?.toLowerCase().includes(query)) score += 1;
    if (result.metadata.output?.toLowerCase().includes(query)) score += 1;
    if (result.metadata.modelName?.toLowerCase().includes(query)) score += 2;
    return score;
  }

  // 应用过滤器
  private applyFilters(results: SearchResult[], filters: SearchFilter): SearchResult[] {
    let filtered = results;

    if (filters.modelIds?.length) {
      filtered = filtered.filter(r => filters.modelIds!.includes(r.metadata.modelId));
    }

    if (filters.status?.length) {
      filtered = filtered.filter(r => filters.status!.includes(r.metadata.status));
    }

    if (filters.timeRange) {
      filtered = filtered.filter(r =>
        r.timestamp >= filters.timeRange!.start && r.timestamp <= filters.timeRange!.end,
      );
    }

    if (filters.scoreRange) {
      filtered = filtered.filter(r => {
        const avgScore = Object.values(r.scores).reduce((s, v) => s + v, 0) / (Object.keys(r.scores).length || 1);
        if (filters.scoreRange!.min !== undefined && avgScore < filters.scoreRange!.min) return false;
        if (filters.scoreRange!.max !== undefined && avgScore > filters.scoreRange!.max) return false;
        return true;
      });
    }

    if (filters.metricRange) {
      for (const [metric, range] of Object.entries(filters.metricRange)) {
        filtered = filtered.filter(r => {
          const value = r.scores[metric];
          if (value === undefined) return false;
          if (range.min !== undefined && value < range.min) return false;
          if (range.max !== undefined && value > range.max) return false;
          return true;
        });
      }
    }

    return filtered;
  }

  // 计算 facets
  private calculateFacets(results: SearchResult[]): SearchFacets {
    const modelCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();
    const metricValues: Record<string, number[]> = {};
    const dateCounts = new Map<string, number>();

    for (const r of results) {
      if (r.metadata.modelName) {
        modelCounts.set(r.metadata.modelName, (modelCounts.get(r.metadata.modelName) || 0) + 1);
      }
      if (r.metadata.status) {
        statusCounts.set(r.metadata.status, (statusCounts.get(r.metadata.status) || 0) + 1);
      }
      for (const [metric, value] of Object.entries(r.scores)) {
        if (!metricValues[metric]) metricValues[metric] = [];
        metricValues[metric].push(value);
      }
      const date = r.timestamp.toISOString().split('T')[0];
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    }

    const metrics: Record<string, { min: number; max: number; avg: number }> = {};
    for (const [metric, values] of Object.entries(metricValues)) {
      metrics[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
      };
    }

    return {
      models: Array.from(modelCounts.entries()).map(([name, count]) => ({ name, count })),
      statuses: Array.from(statusCounts.entries()).map(([name, count]) => ({ name, count })),
      metrics,
      dateHistogram: Array.from(dateCounts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    };
  }

  // 生成搜索建议
  private generateSuggestions(query: string): string[] {
    if (!query || query.length < 2) return [];

    const suggestions = new Set<string>();
    const q = query.toLowerCase();

    // 从索引中找匹配
    for (const item of this.searchIndex.slice(0, 100)) {
      if (item.metadata.modelName?.toLowerCase().includes(q)) {
        suggestions.add(item.metadata.modelName);
      }
    }

    // 添加常见搜索词
    const commonTerms = ['accuracy', 'latency', 'safety', 'relevance', 'coherence'];
    for (const term of commonTerms) {
      if (term.includes(q)) suggestions.add(term);
    }

    return Array.from(suggestions).slice(0, 5);
  }

  // 高级搜索（支持查询语法）
  async advancedSearch(queryString: string): Promise<SearchResponse> {
    // 解析查询语法: "model:gpt-4 accuracy:>0.8 status:completed"
    const filters: SearchFilter = {};
    let keyword = '';

    const parts = queryString.split(/\s+/);
    for (const part of parts) {
      if (part.startsWith('model:')) {
        filters.modelIds = [part.substring(6)];
      } else if (part.startsWith('status:')) {
        filters.status = [part.substring(7)];
      } else if (part.includes(':>') || part.includes(':<')) {
        const match = part.match(/(\w+):([<>])([\d.]+)/);
        if (match) {
          const [, metric, op, val] = match;
          if (!filters.metricRange) filters.metricRange = {};
          if (!filters.metricRange[metric]) filters.metricRange[metric] = {};
          if (op === '>') filters.metricRange[metric].min = parseFloat(val);
          else filters.metricRange[metric].max = parseFloat(val);
        }
      } else {
        keyword += part + ' ';
      }
    }

    return this.search(keyword.trim(), { filters });
  }

  // 获取搜索统计
  getSearchStats(): {
    indexSize: number;
    indexBuilt: boolean;
    types: Record<string, number>;
  } {
    const types: Record<string, number> = {};
    for (const item of this.searchIndex) {
      types[item.type] = (types[item.type] || 0) + 1;
    }

    return {
      indexSize: this.searchIndex.length,
      indexBuilt: this.indexBuilt,
      types,
    };
  }

  // 重建索引
  async reindex(): Promise<{ indexed: number; time: number }> {
    this.indexBuilt = false;
    return this.buildIndex();
  }
}
