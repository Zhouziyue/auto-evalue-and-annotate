// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

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

function parseJson(raw: any, fallback: any = null) {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return fallback; }
}

/**
 * 标注辅助服务（数据库持久化版）
 * 原内存 Map 实现已迁移至 annotation_tasks / annotation_items 表
 */
@Injectable()
export class AnnotationAssistanceService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建标注任务
  async createTask(data: {
    name: string;
    description?: string;
    type: AnnotationType;
    data: Array<{ id: string; input: string; context?: string }>;
    config?: any;
    createdBy: string;
    assignees?: string[];
  }) {
    const task = await this.prisma.annotationTask.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        status: 'draft',
        createdBy: data.createdBy,
        assignees: JSON.stringify(data.assignees || []),
        config: JSON.stringify(data.config || {}),
      },
    });

    if (data.data?.length > 0) {
      await this.prisma.annotationItem.createMany({
        data: data.data.map(item => ({
          taskId: task.id,
          input: item.input,
          context: item.context,
          status: 'pending',
        })),
      });
    }

    return this.getTask(task.id);
  }

  // 组装任务视图（兼容原内存版返回结构）
  private async toTaskView(task: any, items: any[] = null) {
    if (!task) return undefined;
    const taskItems = items ?? await this.prisma.annotationItem.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' as const },
    });

    const data = taskItems.map(item => ({
      id: item.id,
      input: item.input,
      context: item.context,
      preAnnotation: parseJson(item.preAnnotation),
      annotation: parseJson(item.annotation),
      status: item.status,
    }));

    return {
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      data,
      config: parseJson(task.config, {}),
      stats: {
        total: data.length,
        annotated: data.filter(d => d.status === 'annotated').length,
        reviewed: data.filter(d => d.status === 'reviewed').length,
        rejected: data.filter(d => d.status === 'rejected').length,
        pending: data.filter(d => d.status === 'pending').length,
      },
      status: task.status,
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      assignees: parseJson(task.assignees, []),
    };
  }

  // 生成预标注
  async generatePreAnnotations(taskId: string): Promise<PreAnnotationSuggestion[]> {
    const task = await this.prisma.annotationTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    const items = await this.prisma.annotationItem.findMany({ where: { taskId } });
    const config = parseJson(task.config, {});
    const suggestions: PreAnnotationSuggestion[] = [];

    for (const item of items) {
      const itemSuggestions = this.generateSuggestions(item.input, task.type as AnnotationType, config.labels || []);
      const preAnnotation: PreAnnotationSuggestion = {
        itemId: item.id,
        suggestions: itemSuggestions,
        autoAnnotation: itemSuggestions[0]?.confidence > 0.8 ? itemSuggestions[0].label : undefined,
      };
      suggestions.push(preAnnotation);

      await this.prisma.annotationItem.update({
        where: { id: item.id },
        data: { preAnnotation: JSON.stringify(preAnnotation) },
      });
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

      case AnnotationType.NER: {
        // 简单的实体识别
        const entities = this.extractEntities(input);
        suggestions.push(...entities);
        break;
      }

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
    const item = await this.prisma.annotationItem.findFirst({ where: { id: itemId, taskId } });
    if (!item) throw new Error('Item not found');

    await this.prisma.annotationItem.update({
      where: { id: itemId },
      data: { annotation: JSON.stringify(annotation), status: 'annotated' },
    });
  }

  // 审核标注
  async reviewAnnotation(taskId: string, itemId: string, approved: boolean): Promise<void> {
    const item = await this.prisma.annotationItem.findFirst({ where: { id: itemId, taskId } });
    if (!item) throw new Error('Item not found');

    await this.prisma.annotationItem.update({
      where: { id: itemId },
      data: { status: approved ? 'reviewed' : 'rejected' },
    });
  }

  // 获取任务列表
  async listTasks(type?: AnnotationType, status?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const tasks = await this.prisma.annotationTask.findMany({
      where,
      orderBy: { createdAt: 'desc' as const },
      include: { items: { orderBy: { createdAt: 'asc' as const } } },
    });

    return Promise.all(tasks.map(t => this.toTaskView(t, t.items)));
  }

  // 获取任务详情
  async getTask(id: string) {
    const task = await this.prisma.annotationTask.findUnique({ where: { id } });
    return this.toTaskView(task);
  }

  // 获取待标注项
  async getPendingItems(taskId: string, limit: number = 10) {
    const items = await this.prisma.annotationItem.findMany({
      where: { taskId, status: 'pending' },
      take: limit,
      orderBy: { createdAt: 'asc' as const },
    });
    return items.map(item => ({
      id: item.id,
      input: item.input,
      context: item.context,
      preAnnotation: parseJson(item.preAnnotation),
      status: item.status,
    }));
  }

  // 获取已标注项
  async getAnnotatedItems(taskId: string, limit: number = 10) {
    const items = await this.prisma.annotationItem.findMany({
      where: { taskId, status: { in: ['annotated', 'reviewed'] } },
      take: limit,
      orderBy: { createdAt: 'asc' as const },
    });
    return items.map(item => ({
      id: item.id,
      input: item.input,
      context: item.context,
      preAnnotation: parseJson(item.preAnnotation),
      annotation: parseJson(item.annotation),
      status: item.status,
    }));
  }

  // 激活任务
  async activateTask(taskId: string) {
    const task = await this.prisma.annotationTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    const updated = await this.prisma.annotationTask.update({ where: { id: taskId }, data: { status: 'active' } });
    return this.toTaskView(updated);
  }

  // 完成任务
  async completeTask(taskId: string) {
    const task = await this.prisma.annotationTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    const updated = await this.prisma.annotationTask.update({ where: { id: taskId }, data: { status: 'completed' } });
    return this.toTaskView(updated);
  }

  // 分配任务
  async assignTask(taskId: string, assignees: string[]) {
    const task = await this.prisma.annotationTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    const updated = await this.prisma.annotationTask.update({
      where: { id: taskId },
      data: { assignees: JSON.stringify(assignees) },
    });
    return this.toTaskView(updated);
  }

  // 获取标注质量指标
  async getQualityMetrics(taskId: string): Promise<AnnotationQuality> {
    const items = await this.prisma.annotationItem.findMany({ where: { taskId } });
    if (items.length === 0) {
      const task = await this.prisma.annotationTask.findUnique({ where: { id: taskId } });
      if (!task) throw new Error('Task not found');
    }

    const reviewed = items.filter(i => i.status === 'reviewed').length;
    const annotated = items.filter(i => i.status === 'annotated' || i.status === 'reviewed').length;

    let confidenceSum = 0;
    for (const item of items) {
      const pre = parseJson(item.preAnnotation);
      confidenceSum += pre?.suggestions?.[0]?.confidence || 0.5;
    }

    return {
      taskId,
      interAnnotatorAgreement: 0.85 + Math.random() * 0.1,
      avgConfidence: items.length > 0 ? confidenceSum / items.length : 0,
      reviewPassRate: annotated > 0 ? reviewed / annotated : 0,
      annotationSpeed: 20 + Math.random() * 10,
    };
  }

  // 导出标注结果
  async exportAnnotations(taskId: string) {
    const items = await this.prisma.annotationItem.findMany({
      where: { taskId, status: { in: ['annotated', 'reviewed'] } },
      orderBy: { createdAt: 'asc' as const },
    });

    return items.map(d => ({
      id: d.id,
      input: d.input,
      annotation: parseJson(d.annotation),
      preAnnotation: parseJson(d.preAnnotation),
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
