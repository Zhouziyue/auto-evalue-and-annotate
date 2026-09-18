// @ts-nocheck
import { Injectable } from '@nestjs/common';
export interface TaskTemplate { id: string; name: string; type: string; config: Record<string, any>; createdAt: Date; }
@Injectable()
export class TaskTemplateService {
  private templates: Map<string, TaskTemplate> = new Map();
  async create(data: Omit<TaskTemplate, 'id' | 'createdAt'>): Promise<TaskTemplate> {
    const id = `template_${Date.now()}`;
    const template = { ...data, id, createdAt: new Date() };
    this.templates.set(id, template);
    return template;
  }
  async list(): Promise<TaskTemplate[]> { return Array.from(this.templates.values()); }
  async get(id: string): Promise<TaskTemplate | undefined> { return this.templates.get(id); }
  async delete(id: string): Promise<boolean> { return this.templates.delete(id); }
  async instantiate(templateId: string, params: Record<string, any>): Promise<any> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');
    return { ...template.config, ...params, instantiatedAt: new Date() };
  }
}
