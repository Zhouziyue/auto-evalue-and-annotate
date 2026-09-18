// @ts-nocheck
import { Injectable } from '@nestjs/common';
export interface FineTuneEvalResult { id: string; modelId: string; datasetId: string; metrics: Record<string, number>; improvement: number; createdAt: Date; }
@Injectable()
export class FinetuneEvalService {
  private results: FineTuneEvalResult[] = [];
  async evaluate(data: { modelId: string; datasetId: string; baselineMetrics: Record<string, number> }): Promise<FineTuneEvalResult> {
    const metrics = { accuracy: 0.7 + Math.random() * 0.25, loss: Math.random() * 0.5, f1: 0.6 + Math.random() * 0.3 };
    const baselineAvg = Object.values(data.baselineMetrics).reduce((s, v) => s + v, 0) / Object.values(data.baselineMetrics).length;
    const metricsAvg = Object.values(metrics).reduce((s, v) => s + v, 0) / Object.values(metrics).length;
    const result: FineTuneEvalResult = { id: `ft_${Date.now()}`, modelId: data.modelId, datasetId: data.datasetId, metrics, improvement: metricsAvg - baselineAvg, createdAt: new Date() };
    this.results.push(result);
    return result;
  }
  async list(modelId?: string): Promise<FineTuneEvalResult[]> { return modelId ? this.results.filter(r => r.modelId === modelId) : this.results; }
  async get(id: string): Promise<FineTuneEvalResult | undefined> { return this.results.find(r => r.id === id); }
}
