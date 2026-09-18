// @ts-nocheck
import { Injectable } from '@nestjs/common';
export interface CustomMetric { id: string; name: string; type: string; config: Record<string, any>; createdAt: Date; }
@Injectable()
export class CustomMetricService {
  private metrics: Map<string, CustomMetric> = new Map();
  async create(data: Omit<CustomMetric, 'id' | 'createdAt'>): Promise<CustomMetric> {
    const id = `metric_${Date.now()}`;
    const metric = { ...data, id, createdAt: new Date() };
    this.metrics.set(id, metric);
    return metric;
  }
  async list(): Promise<CustomMetric[]> { return Array.from(this.metrics.values()); }
  async get(id: string): Promise<CustomMetric | undefined> { return this.metrics.get(id); }
  async delete(id: string): Promise<boolean> { return this.metrics.delete(id); }
  async calculate(metricId: string, input: any): Promise<number> { return Math.random(); }
}
