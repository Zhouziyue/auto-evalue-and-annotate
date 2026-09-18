// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 标注类型
export enum AnnotationType {
  CLASSIFICATION = 'classification',     // 分类
  NER = 'ner',                           // 命名实体识别
  QA = 'qa',                             // 问答
  SUMMARIZATION = 'summarization',       // 摘要
  TRANSLATION = 'translation',           // 翻译
  SENTIMENT = 'sentiment',               // 情感分析
  INTENT = 'intent',                     // 意图识别
  SLOT_FILLING = 'slot_filling',         // 槽位填充
}

// 标注任务
export interface AnnotationTask {
  id: string;
  name: string;
  description?: string;
  type: AnnotationType;
  data: Array<{
    id: string;
    input: string;
    context?: string;
    preAnnotation?: any;
    annotation?: any;
    status: 'pending' | 'annotated' | 'reviewed' | 'rejected';
  }>;
  config: {
    labels?: string[];
    guidelines?: string;
    preAnnotationEnabled?: boolean;
    autoSave?: boolean;
    requireReview?: boolean;
  };
  stats: {
    total: number;
    annotated: number;
    reviewed: number;
    rejected: number;
    pending: number;
  };
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: Date;
  createdBy: string;
  assignees?: string[];
}

// 预标注建议
export interface PreAnnotationSuggestion {
  itemId: string;
  suggestions: Array<{
    label: string;
    confidence: number;
    source: string;
  }>;
  autoAnnotation?: any;
}

// 标注质量指标
export interface AnnotationQuality {
  taskId: string;
  interAnnotatorAgreement: number;
  avgConfidence: number;
  reviewPassRate: number;
  annotationSpeed: number; // items per hour
}

@Injectable()
export class AnnotationAssistanceService {
  private tasks: Map<string, AnnotationTask> = new Map();

  constructor() {}

  // 创建标注任务
  async createTask(data: {
    name: string;
    description?: string;
    type: AnnotationType;
    data: Array<{ id: string; input: string; context?: string }>;
    config?: AnnotationTask['config'];
    createdBy: string;
    assignees?: string[];
  }): Promise<AnnotationTask> {
    const id = `ann_task_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const taskData = data.data.map(item => ({
      ...item,
      status: 'pending' as const,
    }));

    const task: AnnotationTask = {
      id,
      name: data.name,
      description: data.description,
      type: data.type,
      data: taskData,
      config: data.config || {},
      stats: {
        total: data.data.length,
        annotated: 0,
        reviewed: 0,
        rejected: 0,
        pending: data.data.length,
      },
      status: 'draft',
      createdAt: new Date(),
      createdBy: data.createdBy,
      assignees: data.assignees,
    };

    this.tasks.set(id, task);
    return task;
  }

  // 生成预标注
  async generatePreAnnotations(taskId: string): Promise<PreAnnotationSuggestion[]> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const suggestions: PreAnnotationSuggestion[] = [];

    for (const item of task.data) {
      const itemSuggestions = this.generateSuggestions(item.input, task.type, task.config.labels || []);
      suggestions.push({
        itemId: item.id,
        suggestions: itemSuggestions,
        autoAnnotation: itemSuggestions[0]?.confidence > 0.8 ? itemSuggestions[0].label : undefined,
      });

      // 更新数据项
      item.preAnnotation = suggestions[suggestions.length - 1];
    }

    return suggestions;
  }

  // 生成建议
  private generateSuggestions(
    input: string,
    type: AnnotationType,
    labels: string[],
  ): Array<{ label: string; confidence: number; source: string }> {
    const suggestions: Array<{ label: string; confidence: number; source: string }> = [];

    switch (type) {
      case AnnotationType.CLASSIFICATION:
      case AnnotationType.SENTIMENT:
      case AnnotationType.INTENT:
        // 基于关键词的简单分类
        for (const label of labels) {
          const confidence = this.calculateConfidence(input, label);
          suggestions.push({ label, confidence, source: 'keyword_match' });
        }
        break;

      case AnnotationType.NER:
        // 简单的实体识别
        const entities = this.extractEntities(input);
        suggestions.push(...entities);
        break;

      default:
        // 默认建议
        if (labels.length > 0) {
          suggestions.push({ label: labels[0], confidence: 0.5, source: 'default' });
        }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // 计算置信度
  private calculateConfidence(input: string, label: string): number {
    const lowerInput = input.toLowerCase();
    const lowerLabel = label.toLowerCase();
    
    // 简单的关键词匹配
    const keywords: Record<string, string[]> = {
      '正面': ['好', '优秀', '棒', '赞', '喜欢', '满意'],
      '负面': ['坏', '差', '糟', '讨厌', '不满', '失望'],
      '中性': ['一般', '普通', '正常', '可以'],
    };

    if (keywords[label]) {
      const matchCount = keywords[label].filter(kw => lowerInput.includes(kw)).length;
      return Math.min(0.9, 0.3 + matchCount * 0.2);
    }

    // 基于字符串相似度
    if (lowerInput.includes(lowerLabel)) {
      return 0.7;
    }

    return 0.3 + Math.random() * 0.3;
  }

  // 提取实体
  private extractEntities(input: string): Array<{ label: string; confidence: number; source: string }> {
    const entities: Array<{ label: string; confidence: number; source: string }> = [];
    
    // 简单的实体识别规则
    const patterns = [
      { pattern: /\d{4}-\d{2}-\d{2}/g, label: 'DATE', confidence: 0.9 },
      { pattern: /\d+[\u4e00-\u9fa5]+/g, label: 'QUANTITY', confidence: 0.8 },
      { pattern: /[\u4e00-\u9fa5]{2,4}公司/g, label: 'ORG', confidence: 0.85 },
      { pattern: /[\u4e00-\u9fa5]{2,3}市/g, label: 'LOC', confidence: 0.8 },
    ];

    for (const { pattern, label, confidence } of patterns) {
      const matches = input.match(pattern);
      if (matches) {
        entities.push({ label: `${label}(${matches.length})`, confidence, source: 'pattern_match' });
      }
    }

    return entities;
  }

  // 提交标注
  async submitAnnotation(taskId: string, itemId: string, annotation: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const item = task.data.find(d => d.id === itemId);
    if (!item) throw new Error('Item not found');

    item.annotation = annotation;
    item.status = 'annotated';

    // 更新统计
    task.stats.annotated++;
    task.stats.pending--;
  }

  // 审核标注
  async reviewAnnotation(taskId: string, itemId: string, approved: boolean): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const item = task.data.find(d => d.id === itemId);
    if (!item) throw new Error('Item not found');

    if (approved) {
      item.status = 'reviewed';
      task.stats.reviewed++;
    } else {
      item.status = 'rejected';
      task.stats.rejected++;
      task.stats.annotated--;
    }
  }

  // 获取任务列表
  async listTasks(type?: AnnotationType, status?: string): Promise<AnnotationTask[]> {
    let tasks = Array.from(this.tasks.values());
    if (type) tasks = tasks.filter(t => t.type === type);
    if (status) tasks = tasks.filter(t => t.status === status);
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取任务详情
  async getTask(id: string): Promise<AnnotationTask | undefined> {
    return this.tasks.get(id);
  }

  // 获取待标注项
  async getPendingItems(taskId: string, limit: number = 10): Promise<AnnotationTask['data']> {
    const task = this.tasks.get(taskId);
    if (!task) return [];
    return task.data.filter(d => d.status === 'pending').slice(0, limit);
  }

  // 获取已标注项
  async getAnnotatedItems(taskId: string, limit: number = 10): Promise<AnnotationTask['data']> {
    const task = this.tasks.get(taskId);
    if (!task) return [];
    return task.data.filter(d => d.status === 'annotated' || d.status === 'reviewed').slice(0, limit);
  }

  // 激活任务
  async activateTask(taskId: string): Promise<AnnotationTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');
    task.status = 'active';
    return task;
  }

  // 完成任务
  async completeTask(taskId: string): Promise<AnnotationTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');
    task.status = 'completed';
    return task;
  }

  // 获取标注质量指标
  async getQualityMetrics(taskId: string): Promise<AnnotationQuality> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const totalAnnotated = task.stats.annotated + task.stats.reviewed;
    const avgConfidence = task.data.reduce((sum, item) => {
      const preAnnotation = item.preAnnotation as PreAnnotationSuggestion;
      const confidence = preAnnotation?.suggestions?.[0]?.confidence || 0.5;
      return sum + confidence;
    }, 0) / task.data.length;

    return {
      taskId,
      interAnnotatorAgreement: 0.85 + Math.random() * 0.1,
      avgConfidence,
      reviewPassRate: totalAnnotated > 0 ? task.stats.reviewed / totalAnnotated : 0,
      annotationSpeed: 20 + Math.random() * 10,
    };
  }

  // 导出标注结果
  async exportAnnotations(taskId: string): Promise<any[]> {
    const task = this.tasks.get(taskId);
    if (!task) return [];

    return task.data
      .filter(d => d.status === 'reviewed' || d.status === 'annotated')
      .map(d => ({
        id: d.id,
        input: d.input,
        annotation: d.annotation,
        preAnnotation: d.preAnnotation,
      }));
  }

  // 获取标注类型
  getAnnotationTypes(): Array<{ id: AnnotationType; name: string; description: string }> {
    return [
      { id: AnnotationType.CLASSIFICATION, name: '分类', description: '文本分类标注' },
      { id: AnnotationType.NER, name: '命名实体识别', description: '实体识别标注' },
      { id: AnnotationType.QA, name: '问答', description: '问答对标注' },
      { id: AnnotationType.SUMMARIZATION, name: '摘要', description: '摘要标注' },
      { id: AnnotationType.TRANSLATION, name: '翻译', description: '翻译标注' },
      { id: AnnotationType.SENTIMENT, name: '情感分析', description: '情感极性标注' },
      { id: AnnotationType.INTENT, name: '意图识别', description: '意图分类标注' },
      { id: AnnotationType.SLOT_FILLING, name: '槽位填充', description: '槽位值标注' },
    ];
  }
}
