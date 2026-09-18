// @ts-nocheck
import { Injectable } from '@nestjs/common';

export interface ComparisonResult {
  id: string; name: string; modelIds: string[]; metrics: Record<string, Record<string, number>>;
  rankings: Array<{ modelId: string; rank: number; scores: Record<string, number> }>;
  insights: string[]; createdAt: Date;
}

@Injectable()
export class ComparisonAnalysisService {
  private results: Map<string, ComparisonResult> = new Map();

  async create(data: { name: string; modelIds: string[]; metrics: Record<string, Record<string, number>> }): Promise<ComparisonResult> {
    const id = `cmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const rankings = Object.entries(data.metrics)
      .map(([modelId, scores]) => ({ modelId, rank: 0, scores }))
      .sort((a, b) => {
        const avgA = Object.values(a.scores).reduce((s, v) => s + v, 0) / Object.values(a.scores).length;
        const avgB = Object.values(b.scores).reduce((s, v) => s + v, 0) / Object.values(b.scores).length;
        return avgB - avgA;
      })
      .map((r, i) => ({ ...r, rank: i + 1 }));
    const insights = [`共比较 ${data.modelIds.length} 个模型`, `最佳模型: ${rankings[0]?.modelId}`];
    const result: ComparisonResult = { id, name: data.name, modelIds: data.modelIds, metrics: data.metrics, rankings, insights, createdAt: new Date() };
    this.results.set(id, result);
    return result;
  }

  async list(): Promise<ComparisonResult[]> { return Array.from(this.results.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); }
  async get(id: string): Promise<ComparisonResult | undefined> { return this.results.get(id); }
  async delete(id: string): Promise<boolean> { return this.results.delete(id); }

  async getRanking(id: string): Promise<ComparisonResult['rankings']> { return this.results.get(id)?.rankings || []; }
  async getInsights(id: string): Promise<string[]> { return this.results.get(id)?.insights || []; }
}
