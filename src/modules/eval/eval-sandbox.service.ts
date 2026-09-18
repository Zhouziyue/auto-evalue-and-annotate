// @ts-nocheck
import { Injectable } from '@nestjs/common';
export interface SandboxConfig { id: string; name: string; timeout: number; memoryLimit: number; cpuLimit: number; networkAccess: boolean; }
export interface SandboxResult { id: string; sandboxId: string; output: any; executionTime: number; status: 'success' | 'error' | 'timeout'; createdAt: Date; }
@Injectable()
export class EvalSandboxService {
  private sandboxes: Map<string, SandboxConfig> = new Map();
  private results: Map<string, SandboxResult[]> = new Map();
  async createSandbox(config: Omit<SandboxConfig, 'id'>): Promise<SandboxConfig> {
    const id = `sandbox_${Date.now()}`;
    const sandbox = { ...config, id };
    this.sandboxes.set(id, sandbox);
    return sandbox;
  }
  async execute(sandboxId: string, task: any): Promise<SandboxResult> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) throw new Error('Sandbox not found');
    const result: SandboxResult = { id: `result_${Date.now()}`, sandboxId, output: { executed: true, task }, executionTime: Math.random() * 1000, status: 'success', createdAt: new Date() };
    const results = this.results.get(sandboxId) || [];
    results.push(result);
    this.results.set(sandboxId, results);
    return result;
  }
  async listSandboxes(): Promise<SandboxConfig[]> { return Array.from(this.sandboxes.values()); }
  async getResults(sandboxId: string): Promise<SandboxResult[]> { return this.results.get(sandboxId) || []; }
  async deleteSandbox(id: string): Promise<boolean> { return this.sandboxes.delete(id); }
}
