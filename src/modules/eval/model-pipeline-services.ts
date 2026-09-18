// @ts-nocheck
import { Injectable } from '@nestjs/common';

// v1.26 服务
export interface ModelVersion { id: string; modelId: string; version: string; metrics: Record<string, number>; createdAt: Date; }
@Injectable()
export class ModelVersionService {
  private versions: Map<string, ModelVersion[]> = new Map();
  async create(data: Omit<ModelVersion, 'id' | 'createdAt'>): Promise<ModelVersion> {
    const id = `ver_${Date.now()}`;
    const version = { ...data, id, createdAt: new Date() };
    const versions = this.versions.get(data.modelId) || [];
    versions.push(version);
    this.versions.set(data.modelId, versions);
    return version;
  }
  async list(modelId: string): Promise<ModelVersion[]> { return this.versions.get(modelId) || []; }
  async get(modelId: string, version: string): Promise<ModelVersion | undefined> { return (this.versions.get(modelId) || []).find(v => v.version === version); }
}

export interface DataPipeline { id: string; name: string; stages: string[]; status: string; createdAt: Date; }
@Injectable()
export class DataPipelineService {
  private pipelines: Map<string, DataPipeline> = new Map();
  async create(data: Omit<DataPipeline, 'id' | 'createdAt'>): Promise<DataPipeline> {
    const id = `pipeline_${Date.now()}`;
    const pipeline = { ...data, id, createdAt: new Date() };
    this.pipelines.set(id, pipeline);
    return pipeline;
  }
  async list(): Promise<DataPipeline[]> { return Array.from(this.pipelines.values()); }
  async execute(id: string): Promise<DataPipeline> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new Error('Pipeline not found');
    pipeline.status = 'completed';
    return pipeline;
  }
}

export interface ResultSubscription { id: string; name: string; filter: Record<string, any>; callbackUrl: string; createdAt: Date; }
@Injectable()
export class ResultSubscriptionService {
  private subscriptions: Map<string, ResultSubscription> = new Map();
  async create(data: Omit<ResultSubscription, 'id' | 'createdAt'>): Promise<ResultSubscription> {
    const id = `sub_${Date.now()}`;
    const sub = { ...data, id, createdAt: new Date() };
    this.subscriptions.set(id, sub);
    return sub;
  }
  async list(): Promise<ResultSubscription[]> { return Array.from(this.subscriptions.values()); }
  async notify(result: any): Promise<void> {
    for (const sub of this.subscriptions.values()) {
      // 模拟通知
      console.log(`Notifying ${sub.callbackUrl} with result`, result);
    }
  }
}

export const MODEL_PIPELINE_SERVICES = [ModelVersionService, DataPipelineService, ResultSubscriptionService];
