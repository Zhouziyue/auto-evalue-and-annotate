// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 流水线状态
export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// 流水线步骤类型
export enum PipelineStepType {
  DATASET_LOAD = 'dataset_load',       // 加载数据集
  PROMPT_APPLY = 'prompt_apply',       // 应用 Prompt
  MODEL_CALL = 'model_call',           // 调用模型
  EVALUATE = 'evaluate',               // 评测
  FILTER = 'filter',                   // 过滤
  AGGREGATE = 'aggregate',             // 聚合
  EXPORT = 'export',                   // 导出
  NOTIFY = 'notify',                   // 通知
}

// 流水线步骤
export interface PipelineStep {
  id: string;
  name: string;
  type: PipelineStepType;
  config: Record<string, any>;
  dependsOn?: string[];
  retryCount?: number;
  timeout?: number;
}

// 流水线定义
export interface PipelineDefinition {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep[];
  trigger?: 'manual' | 'scheduled' | 'webhook';
  schedule?: string;  // cron 表达式
  enabled: boolean;
  createdAt: Date;
}

// 流水线运行
export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: PipelineStatus;
  startedAt?: Date;
  completedAt?: Date;
  stepResults: Map<string, StepResult>;
  error?: string;
  triggeredBy?: string;
}

// 步骤结果
export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
  duration?: number;
}

@Injectable()
export class PipelineOrchestrationService {
  private pipelines: Map<string, PipelineDefinition> = new Map();
  private runs: Map<string, PipelineRun> = new Map();
  private activeRuns: Map<string, PipelineRun> = new Map();

  constructor() {}

  // 创建流水线
  async createPipeline(data: {
    name: string;
    description?: string;
    steps: PipelineStep[];
    trigger?: 'manual' | 'scheduled' | 'webhook';
    schedule?: string;
  }): Promise<PipelineDefinition> {
    const id = `pipeline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const pipeline: PipelineDefinition = {
      id,
      name: data.name,
      description: data.description,
      steps: data.steps,
      trigger: data.trigger || 'manual',
      schedule: data.schedule,
      enabled: true,
      createdAt: new Date(),
    };

    this.pipelines.set(id, pipeline);
    return pipeline;
  }

  // 运行流水线
  async runPipeline(pipelineId: string, triggeredBy?: string): Promise<PipelineRun> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');
    if (!pipeline.enabled) throw new Error('Pipeline is disabled');

    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const run: PipelineRun = {
      id: runId,
      pipelineId,
      status: PipelineStatus.RUNNING,
      startedAt: new Date(),
      stepResults: new Map(),
      triggeredBy,
    };

    // 初始化步骤结果
    for (const step of pipeline.steps) {
      run.stepResults.set(step.id, {
        stepId: step.id,
        status: 'pending',
      });
    }

    this.runs.set(runId, run);
    this.activeRuns.set(runId, run);

    // 执行流水线
    this.executePipeline(pipeline, run).catch(error => {
      run.status = PipelineStatus.FAILED;
      run.error = error.message;
      run.completedAt = new Date();
    });

    return run;
  }

  // 执行流水线
  private async executePipeline(pipeline: PipelineDefinition, run: PipelineRun): Promise<void> {
    const context: Record<string, any> = {};

    for (const step of pipeline.steps) {
      // 检查依赖
      if (step.dependsOn) {
        const depsReady = step.dependsOn.every(depId => {
          const depResult = run.stepResults.get(depId);
          return depResult?.status === 'completed';
        });
        if (!depsReady) {
          const stepResult = run.stepResults.get(step.id)!;
          stepResult.status = 'skipped';
          stepResult.error = '依赖步骤未完成';
          continue;
        }
      }

      // 执行步骤
      const stepResult = run.stepResults.get(step.id)!;
      stepResult.status = 'running';
      stepResult.startedAt = new Date();

      try {
        const output = await this.executeStep(step, context, step.retryCount || 0);
        stepResult.status = 'completed';
        stepResult.completedAt = new Date();
        stepResult.duration = stepResult.completedAt.getTime() - stepResult.startedAt.getTime();
        stepResult.output = output;
        context[step.id] = output;
      } catch (error) {
        stepResult.status = 'failed';
        stepResult.error = error.message;
        stepResult.completedAt = new Date();

        // 如果步骤失败，检查是否需要中止流水线
        run.status = PipelineStatus.FAILED;
        run.error = `步骤 "${step.name}" 失败: ${error.message}`;
        run.completedAt = new Date();
        return;
      }
    }

    // 所有步骤完成
    run.status = PipelineStatus.COMPLETED;
    run.completedAt = new Date();
    this.activeRuns.delete(run.id);
  }

  // 执行单个步骤
  private async executeStep(
    step: PipelineStep,
    context: Record<string, any>,
    retryCount: number,
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        switch (step.type) {
          case PipelineStepType.DATASET_LOAD:
            return await this.executeDatasetLoad(step.config, context);
          case PipelineStepType.PROMPT_APPLY:
            return await this.executePromptApply(step.config, context);
          case PipelineStepType.MODEL_CALL:
            return await this.executeModelCall(step.config, context);
          case PipelineStepType.EVALUATE:
            return await this.executeEvaluate(step.config, context);
          case PipelineStepType.FILTER:
            return await this.executeFilter(step.config, context);
          case PipelineStepType.AGGREGATE:
            return await this.executeAggregate(step.config, context);
          case PipelineStepType.EXPORT:
            return await this.executeExport(step.config, context);
          case PipelineStepType.NOTIFY:
            return await this.executeNotify(step.config, context);
          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt < retryCount) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Step failed');
  }

  // 步骤执行器
  private async executeDatasetLoad(config: any, context: any): Promise<any> {
    return {
      type: 'dataset',
      datasetId: config.datasetId,
      cases: config.mockCases || [],
      loadedAt: new Date(),
    };
  }

  private async executePromptApply(config: any, context: any): Promise<any> {
    const dataset = context[config.inputStep] || {};
    const prompt = config.prompt || '';
    
    return {
      type: 'prompted',
      prompt,
      cases: (dataset.cases || []).map((c: any) => ({
        ...c,
        promptedInput: prompt.replace('{{input}}', c.input || ''),
      })),
    };
  }

  private async executeModelCall(config: any, context: any): Promise<any> {
    const input = context[config.inputStep] || {};
    return {
      type: 'model_output',
      model: config.model || 'default',
      outputs: (input.cases || []).map((c: any) => ({
        ...c,
        modelOutput: `Mock output for: ${c.promptedInput || c.input}`,
      })),
    };
  }

  private async executeEvaluate(config: any, context: any): Promise<any> {
    const input = context[config.inputStep] || {};
    return {
      type: 'evaluated',
      results: (input.outputs || []).map((o: any) => ({
        ...o,
        scores: { relevance: 0.8, accuracy: 0.75 },
        passed: true,
      })),
    };
  }

  private async executeFilter(config: any, context: any): Promise<any> {
    const input = context[config.inputStep] || {};
    const results = input.results || [];
    
    const filtered = results.filter((r: any) => {
      if (config.minScore) {
        const avgScore = Object.values(r.scores || {}).reduce((a: any, b: any) => a + b, 0) / Object.values(r.scores || {}).length;
        return avgScore >= config.minScore;
      }
      return true;
    });

    return { type: 'filtered', results: filtered, removedCount: results.length - filtered.length };
  }

  private async executeAggregate(config: any, context: any): Promise<any> {
    const input = context[config.inputStep] || {};
    const results = input.results || [];

    const totalScores: Record<string, number[]> = {};
    for (const r of results) {
      for (const [key, value] of Object.entries(r.scores || {})) {
        if (!totalScores[key]) totalScores[key] = [];
        totalScores[key].push(value as number);
      }
    }

    const avgScores: Record<string, number> = {};
    for (const [key, values] of Object.entries(totalScores)) {
      avgScores[key] = (values as number[]).reduce((a, b) => a + b, 0) / (values as number[]).length;
    }

    return {
      type: 'aggregated',
      totalCount: results.length,
      avgScores,
      passedCount: results.filter((r: any) => r.passed).length,
    };
  }

  private async executeExport(config: any, context: any): Promise<any> {
    return {
      type: 'exported',
      format: config.format || 'json',
      exportedAt: new Date(),
    };
  }

  private async executeNotify(config: any, context: any): Promise<any> {
    return {
      type: 'notified',
      channel: config.channel || 'default',
      notifiedAt: new Date(),
    };
  }

  // 获取流水线列表
  async listPipelines(): Promise<PipelineDefinition[]> {
    return Array.from(this.pipelines.values());
  }

  // 获取流水线详情
  async getPipeline(id: string): Promise<PipelineDefinition | undefined> {
    return this.pipelines.get(id);
  }

  // 获取运行列表
  async listRuns(pipelineId?: string): Promise<PipelineRun[]> {
    const runs = Array.from(this.runs.values());
    if (pipelineId) {
      return runs.filter(r => r.pipelineId === pipelineId);
    }
    return runs.sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  // 获取运行详情
  async getRun(runId: string): Promise<PipelineRun | undefined> {
    return this.runs.get(runId);
  }

  // 启用/禁用流水线
  async togglePipeline(id: string, enabled: boolean): Promise<void> {
    const pipeline = this.pipelines.get(id);
    if (pipeline) {
      pipeline.enabled = enabled;
    }
  }

  // 创建预定义流水线模板
  async createFromTemplate(template: 'basic_eval' | 'rag_eval' | 'comparison'): Promise<PipelineDefinition> {
    const templates: Record<string, Partial<PipelineDefinition>> = {
      basic_eval: {
        name: '基础评测流水线',
        description: '加载数据集 → 调用模型 → 评测 → 导出报告',
        steps: [
          { id: 'step_1', name: '加载数据集', type: PipelineStepType.DATASET_LOAD, config: {} },
          { id: 'step_2', name: '调用模型', type: PipelineStepType.MODEL_CALL, config: { inputStep: 'step_1' }, dependsOn: ['step_1'] },
          { id: 'step_3', name: '评测', type: PipelineStepType.EVALUATE, config: { inputStep: 'step_2' }, dependsOn: ['step_2'] },
          { id: 'step_4', name: '导出报告', type: PipelineStepType.EXPORT, config: { format: 'json', inputStep: 'step_3' }, dependsOn: ['step_3'] },
        ],
      },
      rag_eval: {
        name: 'RAG 评测流水线',
        description: '加载数据集 → 应用Prompt → 调用模型 → 过滤 → 聚合 → 导出',
        steps: [
          { id: 'step_1', name: '加载数据集', type: PipelineStepType.DATASET_LOAD, config: {} },
          { id: 'step_2', name: '应用Prompt', type: PipelineStepType.PROMPT_APPLY, config: { inputStep: 'step_1' }, dependsOn: ['step_1'] },
          { id: 'step_3', name: '调用模型', type: PipelineStepType.MODEL_CALL, config: { inputStep: 'step_2' }, dependsOn: ['step_2'] },
          { id: 'step_4', name: '评测', type: PipelineStepType.EVALUATE, config: { inputStep: 'step_3' }, dependsOn: ['step_3'] },
          { id: 'step_5', name: '过滤低分', type: PipelineStepType.FILTER, config: { inputStep: 'step_4', minScore: 0.5 }, dependsOn: ['step_4'] },
          { id: 'step_6', name: '聚合统计', type: PipelineStepType.AGGREGATE, config: { inputStep: 'step_5' }, dependsOn: ['step_5'] },
          { id: 'step_7', name: '导出报告', type: PipelineStepType.EXPORT, config: { format: 'json', inputStep: 'step_6' }, dependsOn: ['step_6'] },
        ],
      },
      comparison: {
        name: '模型对比流水线',
        description: '加载数据集 → 多模型调用 → 对比评测 → 聚合',
        steps: [
          { id: 'step_1', name: '加载数据集', type: PipelineStepType.DATASET_LOAD, config: {} },
          { id: 'step_2', name: '评测', type: PipelineStepType.EVALUATE, config: { inputStep: 'step_1' }, dependsOn: ['step_1'] },
          { id: 'step_3', name: '聚合对比', type: PipelineStepType.AGGREGATE, config: { inputStep: 'step_2' }, dependsOn: ['step_2'] },
          { id: 'step_4', name: '导出报告', type: PipelineStepType.EXPORT, config: { format: 'json', inputStep: 'step_3' }, dependsOn: ['step_3'] },
        ],
      },
    };

    const templateData = templates[template];
    if (!templateData) throw new Error(`Unknown template: ${template}`);

    return this.createPipeline({
      name: templateData.name || template,
      description: templateData.description,
      steps: templateData.steps || [],
    });
  }
}
