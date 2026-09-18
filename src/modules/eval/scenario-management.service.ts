// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 场景类型
export enum ScenarioType {
  QA = 'qa',                           // 问答
  CHAT = 'chat',                       // 对话
  SUMMARIZATION = 'summarization',     // 摘要
  TRANSLATION = 'translation',         // 翻译
  CODE_GENERATION = 'code_generation', // 代码生成
  CREATIVE_WRITING = 'creative_writing', // 创意写作
  REASONING = 'reasoning',             // 推理
  MATH = 'math',                       // 数学
  CLASSIFICATION = 'classification',   // 分类
  EXTRACTION = 'extraction',           // 信息抽取
}

// 评测场景
export interface EvalScenario {
  id: string;
  name: string;
  description?: string;
  type: ScenarioType;
  config: {
    metrics: string[];
    datasets: string[];
    models: string[];
    prompts: string[];
    evaluators: string[];
    environment?: Record<string, any>;
  };
  constraints: {
    timeLimit?: number;
    tokenLimit?: number;
    costLimit?: number;
    retryCount?: number;
    timeout?: number;
  };
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 场景执行记录
export interface ScenarioExecution {
  id: string;
  scenarioId: string;
  scenarioName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Array<{
    modelId: string;
    modelName: string;
    metrics: Record<string, number>;
    duration: number;
    cost: number;
    tokenUsage: { prompt: number; completion: number; total: number };
  }>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

// 场景模板
export interface ScenarioTemplate {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  defaultConfig: EvalScenario['config'];
  defaultConstraints: EvalScenario['constraints'];
  recommendedMetrics: string[];
  tags: string[];
}

@Injectable()
export class ScenarioManagementService {
  private scenarios: Map<string, EvalScenario> = new Map();
  private executions: ScenarioExecution[] = [];
  private templates: ScenarioTemplate[] = [];

  constructor() {
    this.initTemplates();
  }

  // 初始化场景模板
  private initTemplates(): void {
    this.templates = [
      {
        id: 'template_qa',
        name: '问答评测',
        type: ScenarioType.QA,
        description: '评测模型问答能力，包括准确性、完整性、相关性',
        defaultConfig: {
          metrics: ['accuracy', 'completeness', 'relevance', 'fluency'],
          datasets: [],
          models: [],
          prompts: [],
          evaluators: ['llm_judge'],
        },
        defaultConstraints: { timeLimit: 3600, tokenLimit: 100000, costLimit: 10 },
        recommendedMetrics: ['accuracy', 'completeness', 'relevance'],
        tags: ['qa', 'general'],
      },
      {
        id: 'template_chat',
        name: '对话评测',
        type: ScenarioType.CHAT,
        description: '评测模型多轮对话能力，包括连贯性、上下文理解',
        defaultConfig: {
          metrics: ['coherence', 'context_understanding', 'engagement', 'safety'],
          datasets: [],
          models: [],
          prompts: [],
          evaluators: ['llm_judge', 'human'],
        },
        defaultConstraints: { timeLimit: 7200, tokenLimit: 200000, costLimit: 20 },
        recommendedMetrics: ['coherence', 'context_understanding'],
        tags: ['chat', 'conversation'],
      },
      {
        id: 'template_code',
        name: '代码生成评测',
        type: ScenarioType.CODE_GENERATION,
        description: '评测模型代码生成能力，包括正确性、效率、可读性',
        defaultConfig: {
          metrics: ['correctness', 'efficiency', 'readability', 'security'],
          datasets: [],
          models: [],
          prompts: [],
          evaluators: ['code_executor', 'llm_judge'],
        },
        defaultConstraints: { timeLimit: 1800, tokenLimit: 50000, costLimit: 5 },
        recommendedMetrics: ['correctness', 'efficiency'],
        tags: ['code', 'programming'],
      },
      {
        id: 'template_translation',
        name: '翻译评测',
        type: ScenarioType.TRANSLATION,
        description: '评测模型翻译能力，包括流畅度、准确性、文化适配',
        defaultConfig: {
          metrics: ['fluency', 'adequacy', 'cultural_appropriateness', 'bleu'],
          datasets: [],
          models: [],
          prompts: [],
          evaluators: ['llm_judge', 'reference_based'],
        },
        defaultConstraints: { timeLimit: 3600, tokenLimit: 100000, costLimit: 10 },
        recommendedMetrics: ['fluency', 'adequacy'],
        tags: ['translation', 'multilingual'],
      },
      {
        id: 'template_reasoning',
        name: '推理评测',
        type: ScenarioType.REASONING,
        description: '评测模型推理能力，包括逻辑推理、数学推理',
        defaultConfig: {
          metrics: ['logical_accuracy', 'step_correctness', 'conclusion_validity'],
          datasets: [],
          models: [],
          prompts: [],
          evaluators: ['llm_judge', 'rule_based'],
        },
        defaultConstraints: { timeLimit: 7200, tokenLimit: 150000, costLimit: 15 },
        recommendedMetrics: ['logical_accuracy', 'step_correctness'],
        tags: ['reasoning', 'logic'],
      },
    ];
  }

  // 创建场景
  async createScenario(data: {
    name: string;
    description?: string;
    type: ScenarioType;
    config: EvalScenario['config'];
    constraints?: EvalScenario['constraints'];
    tags?: string[];
    createdBy: string;
  }): Promise<EvalScenario> {
    const id = `scenario_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const scenario: EvalScenario = {
      id,
      name: data.name,
      description: data.description,
      type: data.type,
      config: data.config,
      constraints: data.constraints || {},
      tags: data.tags || [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy,
    };

    this.scenarios.set(id, scenario);
    return scenario;
  }

  // 从模板创建场景
  async createFromTemplate(templateId: string, data: {
    name: string;
    description?: string;
    models: string[];
    datasets: string[];
    createdBy: string;
  }): Promise<EvalScenario> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    return this.createScenario({
      name: data.name,
      description: data.description,
      type: template.type,
      config: {
        ...template.defaultConfig,
        models: data.models,
        datasets: data.datasets,
      },
      constraints: template.defaultConstraints,
      tags: template.tags,
      createdBy: data.createdBy,
    });
  }

  // 更新场景
  async updateScenario(id: string, data: Partial<EvalScenario>): Promise<EvalScenario> {
    const scenario = this.scenarios.get(id);
    if (!scenario) throw new Error('Scenario not found');

    Object.assign(scenario, data, { updatedAt: new Date() });
    return scenario;
  }

  // 激活场景
  async activateScenario(id: string): Promise<EvalScenario> {
    const scenario = this.scenarios.get(id);
    if (!scenario) throw new Error('Scenario not found');

    scenario.status = 'active';
    scenario.updatedAt = new Date();
    return scenario;
  }

  // 归档场景
  async archiveScenario(id: string): Promise<EvalScenario> {
    const scenario = this.scenarios.get(id);
    if (!scenario) throw new Error('Scenario not found');

    scenario.status = 'archived';
    scenario.updatedAt = new Date();
    return scenario;
  }

  // 获取场景列表
  async listScenarios(options?: {
    type?: ScenarioType;
    status?: 'draft' | 'active' | 'archived';
    tag?: string;
  }): Promise<EvalScenario[]> {
    let scenarios = Array.from(this.scenarios.values());

    if (options?.type) scenarios = scenarios.filter(s => s.type === options.type);
    if (options?.status) scenarios = scenarios.filter(s => s.status === options.status);
    if (options?.tag) scenarios = scenarios.filter(s => s.tags.includes(options.tag!));

    return scenarios.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // 获取场景详情
  async getScenario(id: string): Promise<EvalScenario | undefined> {
    return this.scenarios.get(id);
  }

  // 删除场景
  async deleteScenario(id: string): Promise<boolean> {
    return this.scenarios.delete(id);
  }

  // 执行场景
  async executeScenario(id: string): Promise<ScenarioExecution> {
    const scenario = this.scenarios.get(id);
    if (!scenario) throw new Error('Scenario not found');

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const execution: ScenarioExecution = {
      id: executionId,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      status: 'running',
      results: [],
      startedAt: new Date(),
    };

    // 模拟执行
    for (const modelId of scenario.config.models) {
      const result = {
        modelId,
        modelName: modelId,
        metrics: {} as Record<string, number>,
        duration: Math.random() * 1000 + 500,
        cost: Math.random() * 5 + 1,
        tokenUsage: {
          prompt: Math.floor(Math.random() * 10000) + 1000,
          completion: Math.floor(Math.random() * 5000) + 500,
          total: 0,
        },
      };

      // 计算指标
      for (const metric of scenario.config.metrics) {
        result.metrics[metric] = Math.random() * 0.3 + 0.6;
      }

      result.tokenUsage.total = result.tokenUsage.prompt + result.tokenUsage.completion;
      execution.results.push(result);
    }

    execution.status = 'completed';
    execution.completedAt = new Date();
    this.executions.push(execution);

    return execution;
  }

  // 获取执行记录
  async getExecutions(scenarioId?: string, limit: number = 20): Promise<ScenarioExecution[]> {
    let filtered = [...this.executions];
    if (scenarioId) filtered = filtered.filter(e => e.scenarioId === scenarioId);
    return filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, limit);
  }

  // 获取执行详情
  async getExecution(executionId: string): Promise<ScenarioExecution | undefined> {
    return this.executions.find(e => e.id === executionId);
  }

  // 获取场景模板
  async getTemplates(type?: ScenarioType): Promise<ScenarioTemplate[]> {
    if (type) return this.templates.filter(t => t.type === type);
    return this.templates;
  }

  // 获取模板详情
  async getTemplate(templateId: string): Promise<ScenarioTemplate | undefined> {
    return this.templates.find(t => t.id === templateId);
  }

  // 获取场景类型
  getScenarioTypes(): Array<{ id: ScenarioType; name: string; description: string }> {
    return [
      { id: ScenarioType.QA, name: '问答', description: '问答能力评测' },
      { id: ScenarioType.CHAT, name: '对话', description: '多轮对话能力评测' },
      { id: ScenarioType.SUMMARIZATION, name: '摘要', description: '文本摘要能力评测' },
      { id: ScenarioType.TRANSLATION, name: '翻译', description: '翻译能力评测' },
      { id: ScenarioType.CODE_GENERATION, name: '代码生成', description: '代码生成能力评测' },
      { id: ScenarioType.CREATIVE_WRITING, name: '创意写作', description: '创意写作能力评测' },
      { id: ScenarioType.REASONING, name: '推理', description: '推理能力评测' },
      { id: ScenarioType.MATH, name: '数学', description: '数学能力评测' },
      { id: ScenarioType.CLASSIFICATION, name: '分类', description: '文本分类能力评测' },
      { id: ScenarioType.EXTRACTION, name: '信息抽取', description: '信息抽取能力评测' },
    ];
  }

  // 获取场景统计
  async getScenarioStats(): Promise<{
    totalScenarios: number;
    activeScenarios: number;
    totalExecutions: number;
    avgDuration: number;
  }> {
    const scenarios = Array.from(this.scenarios.values());
    const activeScenarios = scenarios.filter(s => s.status === 'active');
    
    return {
      totalScenarios: scenarios.length,
      activeScenarios: activeScenarios.length,
      totalExecutions: this.executions.length,
      avgDuration: this.executions.length > 0
        ? this.executions.reduce((sum, e) => {
            const duration = e.completedAt ? e.completedAt.getTime() - e.startedAt.getTime() : 0;
            return sum + duration;
          }, 0) / this.executions.length
        : 0,
    };
  }
}
