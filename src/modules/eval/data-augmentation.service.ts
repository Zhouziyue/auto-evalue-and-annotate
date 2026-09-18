// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 增强策略
export enum AugmentationStrategy {
  SYNONYM = 'synonym',           // 同义词替换
  BACK_TRANSLATION = 'back_translation', // 回译
  NOISE_INJECTION = 'noise_injection',   // 噪声注入
  PARAPHRASE = 'paraphrase',     // 改写
  MIXUP = 'mixup',               // 混合
  EDA = 'eda',                   // 易数据增强 (Easy Data Augmentation)
  TEMPLATE = 'template',         // 模板填充
  LLM_BASED = 'llm_based',       // LLM 生成
}

// 增强任务
export interface AugmentationTask {
  id: string;
  name: string;
  description?: string;
  sourceData: Array<{ input: string; expectedOutput?: string; context?: string }>;
  strategies: AugmentationStrategy[];
  config: {
    multiplier: number;        // 增强倍数
    synonymProbability?: number;
    noiseLevel?: number;
    language?: string;
    domain?: string;
    templates?: string[];
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  originalCount: number;
  augmentedCount: number;
  results: AugmentedDataItem[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// 增强数据项
export interface AugmentedDataItem {
  id: string;
  originalId: string;
  input: string;
  expectedOutput?: string;
  context?: string;
  strategy: AugmentationStrategy;
  confidence: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

@Injectable()
export class DataAugmentationService {
  private tasks: Map<string, AugmentationTask> = new Map();

  constructor() {}

  // 创建增强任务
  async createTask(data: {
    name: string;
    description?: string;
    sourceData: AugmentationTask['sourceData'];
    strategies: AugmentationStrategy[];
    config?: AugmentationTask['config'];
  }): Promise<AugmentationTask> {
    const id = `aug_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const task: AugmentationTask = {
      id,
      name: data.name,
      description: data.description,
      sourceData: data.sourceData,
      strategies: data.strategies,
      config: data.config || { multiplier: 2 },
      status: 'pending',
      progress: 0,
      originalCount: data.sourceData.length,
      augmentedCount: 0,
      results: [],
      createdAt: new Date(),
    };

    this.tasks.set(id, task);
    return task;
  }

  // 执行增强
  async execute(taskId: string): Promise<AugmentationTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'running';

    try {
      const targetCount = task.originalCount * task.config.multiplier;

      for (const strategy of task.strategies) {
        const itemsPerStrategy = Math.ceil(targetCount / task.strategies.length);

        for (const original of task.sourceData) {
          for (let i = 0; i < Math.ceil(itemsPerStrategy / task.sourceData.length); i++) {
            const augmented = await this.augmentItem(original, strategy, task.config);
            if (augmented) {
              task.results.push(augmented);
              task.augmentedCount++;
            }
            task.progress = task.augmentedCount / targetCount;
          }
        }
      }

      task.status = 'completed';
      task.completedAt = new Date();
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }

    return task;
  }

  // 增强单条数据
  private async augmentItem(
    original: { input: string; expectedOutput?: string; context?: string },
    strategy: AugmentationStrategy,
    config: AugmentationTask['config'],
  ): Promise<AugmentedDataItem | null> {
    const id = `aug_item_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    let augmentedInput: string;
    let confidence: number;

    switch (strategy) {
      case AugmentationStrategy.SYNONYM:
        augmentedInput = this.applySynonymReplacement(original.input, config.synonymProbability || 0.3);
        confidence = 0.85;
        break;

      case AugmentationStrategy.BACK_TRANSLATION:
        augmentedInput = this.applyBackTranslation(original.input, config.language || 'en');
        confidence = 0.8;
        break;

      case AugmentationStrategy.NOISE_INJECTION:
        augmentedInput = this.applyNoiseInjection(original.input, config.noiseLevel || 0.1);
        confidence = 0.75;
        break;

      case AugmentationStrategy.PARAPHRASE:
        augmentedInput = this.applyParaphrase(original.input);
        confidence = 0.85;
        break;

      case AugmentationStrategy.MIXUP:
        augmentedInput = this.applyMixup(original.input, config);
        confidence = 0.7;
        break;

      case AugmentationStrategy.EDA:
        augmentedInput = this.applyEDA(original.input);
        confidence = 0.8;
        break;

      case AugmentationStrategy.TEMPLATE:
        augmentedInput = this.applyTemplate(original.input, config.templates || []);
        confidence = 0.9;
        break;

      case AugmentationStrategy.LLM_BASED:
        augmentedInput = this.applyLLMBased(original.input, config.domain);
        confidence = 0.75;
        break;

      default:
        return null;
    }

    return {
      id,
      originalId: `original_${Date.now()}`,
      input: augmentedInput,
      expectedOutput: original.expectedOutput,
      context: original.context,
      strategy,
      confidence,
      metadata: {
        originalInput: original.input,
        augmentedAt: new Date(),
      },
      createdAt: new Date(),
    };
  }

  // 同义词替换
  private applySynonymReplacement(text: string, probability: number): string {
    const synonyms: Record<string, string[]> = {
      '好': ['优秀', '出色', '棒', '赞'],
      '坏': ['糟糕', '差劲', '不好', '劣'],
      '大': ['巨大', '庞大', '宏大'],
      '小': ['微小', '细小', '迷你'],
      '快': ['迅速', '快速', '飞快'],
      '慢': ['缓慢', '迟钝', '慢速'],
    };

    let result = text;
    for (const [word, syns] of Object.entries(synonyms)) {
      if (text.includes(word) && Math.random() < probability) {
        const synonym = syns[Math.floor(Math.random() * syns.length)];
        result = result.replace(word, synonym);
      }
    }
    return result;
  }

  // 回译（简化）
  private applyBackTranslation(text: string, language: string): string {
    const variations = [
      `请用${language}表达：${text}`,
      `翻译为${language}再回来：${text}`,
      `${text}（${language}风格）`,
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  // 噪声注入
  private applyNoiseInjection(text: string, level: number): string {
    const noiseChars = ['。', '，', '！', '？', '、', '；'];
    let result = text;
    
    if (Math.random() < level) {
      const pos = Math.floor(Math.random() * result.length);
      const noise = noiseChars[Math.floor(Math.random() * noiseChars.length)];
      result = result.slice(0, pos) + noise + result.slice(pos);
    }
    
    return result;
  }

  // 改写
  private applyParaphrase(text: string): string {
    const templates = [
      `换一种说法：${text}`,
      `请重新表述：${text}`,
      `用不同的方式表达：${text}`,
      `${text}（请详细解释）`,
      `关于"${text}"的理解`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // 混合
  private applyMixup(text: string, config: AugmentationTask['config']): string {
    const additions = [
      '另外，',
      '同时，',
      '此外，',
      '而且，',
    ];
    const addition = additions[Math.floor(Math.random() * additions.length)];
    return `${addition}${text}`;
  }

  // EDA (Easy Data Augmentation)
  private applyEDA(text: string): string {
    const operations = ['insert', 'swap', 'delete'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    
    const words = text.split('');
    if (words.length < 2) return text;

    switch (op) {
      case 'insert':
        const insertPos = Math.floor(Math.random() * words.length);
        words.splice(insertPos, 0, '的');
        break;
      case 'swap':
        const pos1 = Math.floor(Math.random() * (words.length - 1));
        [words[pos1], words[pos1 + 1]] = [words[pos1 + 1], words[pos1]];
        break;
      case 'delete':
        const deletePos = Math.floor(Math.random() * words.length);
        words.splice(deletePos, 1);
        break;
    }

    return words.join('');
  }

  // 模板填充
  private applyTemplate(text: string, templates: string[]): string {
    if (templates.length === 0) return text;
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace('{input}', text);
  }

  // LLM 生成
  private applyLLMBased(text: string, domain?: string): string {
    const domainPrefix = domain ? `在${domain}领域，` : '';
    const templates = [
      `${domainPrefix}请解释：${text}`,
      `${domainPrefix}关于${text}，请详细说明`,
      `${domainPrefix}针对"${text}"的问题`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // 获取任务列表
  async listTasks(): Promise<AugmentationTask[]> {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取任务详情
  async getTask(id: string): Promise<AugmentationTask | undefined> {
    return this.tasks.get(id);
  }

  // 获取增强结果
  async getResults(taskId: string, options?: {
    strategy?: AugmentationStrategy;
    limit?: number;
  }): Promise<AugmentedDataItem[]> {
    const task = this.tasks.get(taskId);
    if (!task) return [];

    let results = task.results;
    if (options?.strategy) results = results.filter(r => r.strategy === options.strategy);
    if (options?.limit) results = results.slice(0, options.limit);
    return results;
  }

  // 删除任务
  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // 导出为 JSON
  async exportAsJSON(taskId: string): Promise<string> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const exportData = task.results.map(r => ({
      input: r.input,
      expected_output: r.expectedOutput,
      context: r.context,
      strategy: r.strategy,
      confidence: r.confidence,
    }));

    return JSON.stringify(exportData, null, 2);
  }

  // 获取策略列表
  getStrategies(): Array<{ id: AugmentationStrategy; name: string; description: string }> {
    return [
      { id: AugmentationStrategy.SYNONYM, name: '同义词替换', description: '随机替换同义词' },
      { id: AugmentationStrategy.BACK_TRANSLATION, name: '回译', description: '翻译后再翻译回来' },
      { id: AugmentationStrategy.NOISE_INJECTION, name: '噪声注入', description: '添加随机噪声' },
      { id: AugmentationStrategy.PARAPHRASE, name: '改写', description: '用不同方式表达' },
      { id: AugmentationStrategy.MIXUP, name: '混合', description: '混合多个样本' },
      { id: AugmentationStrategy.EDA, name: 'EDA', description: '易数据增强方法' },
      { id: AugmentationStrategy.TEMPLATE, name: '模板填充', description: '使用模板生成' },
      { id: AugmentationStrategy.LLM_BASED, name: 'LLM 生成', description: '使用 LLM 生成变体' },
    ];
  }
}
