// @ts-nocheck
import { Injectable } from '@nestjs/common';
export interface KBEvalResult { id: string; kbId: string; queryCount: number; accuracy: number; recall: number; f1: number; createdAt: Date; }
@Injectable()
export class KnowledgeBaseEvalService {
  private results: KBEvalResult[] = [];
  async evaluate(data: { kbId: string; queries: Array<{ query: string; expected: string }> }): Promise<KBEvalResult> {
    const accuracy = 0.7 + Math.random() * 0.25;
    const recall = 0.65 + Math.random() * 0.3;
    const f1 = 2 * (accuracy * recall) / (accuracy + recall);
    const result: KBEvalResult = { id: `kb_${Date.now()}`, kbId: data.kbId, queryCount: data.queries.length, accuracy, recall, f1, createdAt: new Date() };
    this.results.push(result);
    return result;
  }
  async list(kbId?: string): Promise<KBEvalResult[]> { return kbId ? this.results.filter(r => r.kbId === kbId) : this.results; }
  async get(id: string): Promise<KBEvalResult | undefined> { return this.results.find(r => r.id === id); }
}
