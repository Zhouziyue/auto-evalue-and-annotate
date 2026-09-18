// @ts-nocheck
import { Injectable } from '@nestjs/common';
export interface ResultAggregation { id: string; name: string; resultIds: string[]; aggregatedMetrics: Record<string, number>; createdAt: Date; }
@Injectable()
export class ResultAggregationService {
  private aggregations: Map<string, ResultAggregation> = new Map();
  async create(data: { name: string; resultIds: string[]; metrics: Record<string, Record<string, number>> }): Promise<ResultAggregation> {
    const id = `agg_${Date.now()}`;
    const aggregatedMetrics: Record<string, number> = {};
    const allMetrics = Object.values(data.metrics);
    const keys = new Set(allMetrics.flatMap(m => Object.keys(m)));
    for (const key of keys) {
      const values = allMetrics.map(m => m[key] || 0);
      aggregatedMetrics[key] = values.reduce((s, v) => s + v, 0) / values.length;
    }
    const agg = { id, name: data.name, resultIds: data.resultIds, aggregatedMetrics, createdAt: new Date() };
    this.aggregations.set(id, agg);
    return agg;
  }
  async list(): Promise<ResultAggregation[]> { return Array.from(this.aggregations.values()); }
  async get(id: string): Promise<ResultAggregation | undefined> { return this.aggregations.get(id); }
  async delete(id: string): Promise<boolean> { return this.aggregations.delete(id); }
}
