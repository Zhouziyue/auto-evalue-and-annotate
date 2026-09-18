// @ts-nocheck
import { Injectable } from '@nestjs/common';

export enum ModelProvider { OPENAI = 'openai', ANTHROPIC = 'anthropic', LOCAL = 'local', CUSTOM = 'custom' }
export enum ModelStatus { ACTIVE = 'active', INACTIVE = 'inactive', DEPRECATED = 'deprecated' }

export interface RegisteredModel {
  id: string; name: string; provider: ModelProvider; version: string;
  config: { endpoint: string; apiKey?: string; maxTokens: number; temperature: number; topP: number; };
  capabilities: string[]; status: ModelStatus; metadata: Record<string, any>;
  createdAt: Date; updatedAt: Date;
}

@Injectable()
export class ModelRegistryService {
  private models: Map<string, RegisteredModel> = new Map();

  async register(data: Omit<RegisteredModel, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<RegisteredModel> {
    const id = `model_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const model: RegisteredModel = { ...data, id, status: ModelStatus.ACTIVE, createdAt: new Date(), updatedAt: new Date() };
    this.models.set(id, model);
    return model;
  }

  async list(provider?: ModelProvider, status?: ModelStatus): Promise<RegisteredModel[]> {
    let result = Array.from(this.models.values());
    if (provider) result = result.filter(m => m.provider === provider);
    if (status) result = result.filter(m => m.status === status);
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async get(id: string): Promise<RegisteredModel | undefined> { return this.models.get(id); }

  async update(id: string, data: Partial<RegisteredModel>): Promise<RegisteredModel> {
    const model = this.models.get(id);
    if (!model) throw new Error('Model not found');
    Object.assign(model, data, { updatedAt: new Date() });
    return model;
  }

  async deactivate(id: string): Promise<RegisteredModel> {
    return this.update(id, { status: ModelStatus.INACTIVE });
  }

  async delete(id: string): Promise<boolean> { return this.models.delete(id); }

  async compare(modelIds: string[]): Promise<{ models: RegisteredModel[]; comparison: Record<string, any> }> {
    const models = modelIds.map(id => this.models.get(id)).filter(Boolean) as RegisteredModel[];
    return { models, comparison: { count: models.length, providers: [...new Set(models.map(m => m.provider))] } };
  }

  getProviders(): Array<{ id: ModelProvider; name: string }> {
    return [
      { id: ModelProvider.OPENAI, name: 'OpenAI' },
      { id: ModelProvider.ANTHROPIC, name: 'Anthropic' },
      { id: ModelProvider.LOCAL, name: '本地部署' },
      { id: ModelProvider.CUSTOM, name: '自定义' },
    ];
  }
}
