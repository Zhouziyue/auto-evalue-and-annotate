// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';

// 指标类型
export enum MetricType {
  ANSWER_RELEVANCY = 'answer_relevancy',
  FAITHFULNESS = 'faithfulness',
  HALLUCINATION = 'hallucination',
  COMPLETENESS = 'completeness',
  TOXICITY = 'toxicity',
  BIAS = 'bias',
  CONTEXT_RELEVANCY = 'context_relevancy',
  CONTEXT_PRECISION = 'context_precision',
  G_EVAL = 'g_eval',
  ACCURACY = 'accuracy',
  LATENCY = 'latency',
  COST = 'cost',
}

// 任务类型
export enum TaskType {
  QA = 'qa',
  CLASSIFICATION = 'classification',
  SUMMARIZATION = 'summarization',
  INTENT = 'intent',
  CHAT = 'chat',
  TRANSLATION = 'translation',
  CODE_GENERATION = 'code_generation',
  GENERAL = 'general',
}

// 指标定义
export interface MetricDefinition {
  id: string;
  type: MetricType;
  name: string;
  description: string;
  category: 'quality' | 'safety' | 'efficiency' | 'retrieval';
  applicableTaskTypes: TaskType[];
  scoreRange: { min: number; max: number };
  isBuiltIn: boolean;
  config?: Record<string, any>;
}

// 指标推荐配置
export interface MetricRecommendation {
  taskType: TaskType;
  recommendedMetrics: MetricDefinition[];
  reason: string;
}

// 自定义指标配置
export interface CustomMetricConfig {
  name: string;
  description: string;
  category: 'quality' | 'safety' | 'efficiency' | 'retrieval';
  applicableTaskTypes: TaskType[];
  promptTemplate?: string;
  scoreRange?: { min: number; max: number };
}

@Injectable()
export class MetricConfigService {
  private customMetrics: Map<string, MetricDefinition> = new Map();

  // 内置指标定义
  private readonly builtInMetrics: MetricDefinition[] = [
    {
      id: 'answer_relevancy',
      type: MetricType.ANSWER_RELEVANCY,
      name: '答案相关性',
      description: '评估回答与问题的相关程度，分数越高表示回答越切题',
      category: 'quality',
      applicableTaskTypes: [TaskType.QA, TaskType.CHAT, TaskType.SUMMARIZATION],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'faithfulness',
      type: MetricType.FAITHFULNESS,
      name: '忠实度',
      description: '评估回答是否基于提供的上下文信息，避免编造内容',
      category: 'quality',
      applicableTaskTypes: [TaskType.QA, TaskType.SUMMARIZATION, TaskType.RAG],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'hallucination',
      type: MetricType.HALLUCINATION,
      name: '幻觉检测',
      description: '检测回答中是否包含虚假信息或编造内容',
      category: 'safety',
      applicableTaskTypes: [TaskType.QA, TaskType.SUMMARIZATION, TaskType.CHAT],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'completeness',
      type: MetricType.COMPLETENESS,
      name: '完整性',
      description: '评估回答是否完整覆盖了问题的所有要点',
      category: 'quality',
      applicableTaskTypes: [TaskType.QA, TaskType.SUMMARIZATION, TaskType.INTENT],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'toxicity',
      type: MetricType.TOXICITY,
      name: '毒性检测',
      description: '检测回答中是否包含有害、歧视或不当内容',
      category: 'safety',
      applicableTaskTypes: [TaskType.QA, TaskType.CHAT, TaskType.CLASSIFICATION],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'bias',
      type: MetricType.BIAS,
      name: '偏见检测',
      description: '检测回答中是否存在性别、种族、地域等偏见',
      category: 'safety',
      applicableTaskTypes: [TaskType.QA, TaskType.CHAT, TaskType.CLASSIFICATION],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'context_relevancy',
      type: MetricType.CONTEXT_RELEVANCY,
      name: '上下文相关性',
      description: '评估检索到的上下文与问题的相关程度',
      category: 'retrieval',
      applicableTaskTypes: [TaskType.QA, TaskType.RAG],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'context_precision',
      type: MetricType.CONTEXT_PRECISION,
      name: '上下文精度',
      description: '评估检索到的上下文的精确程度',
      category: 'retrieval',
      applicableTaskTypes: [TaskType.QA, TaskType.RAG],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'accuracy',
      type: MetricType.ACCURACY,
      name: '准确性',
      description: '评估回答的正确性，适用于有标准答案的场景',
      category: 'quality',
      applicableTaskTypes: [TaskType.CLASSIFICATION, TaskType.INTENT, TaskType.QA],
      scoreRange: { min: 0, max: 1 },
      isBuiltIn: true,
    },
    {
      id: 'latency',
      type: MetricType.LATENCY,
      name: '响应延迟',
      description: '评估模型的响应时间（毫秒）',
      category: 'efficiency',
      applicableTaskTypes: [TaskType.QA, TaskType.CHAT, TaskType.CLASSIFICATION],
      scoreRange: { min: 0, max: 30000 },
      isBuiltIn: true,
    },
    {
      id: 'cost',
      type: MetricType.COST,
      name: '成本',
      description: '评估每次调用的成本（美元）',
      category: 'efficiency',
      applicableTaskTypes: [TaskType.QA, TaskType.CHAT, TaskType.CLASSIFICATION],
      scoreRange: { min: 0, max: 100 },
      isBuiltIn: true,
    },
  ];

  // 任务类型到推荐指标的映射
  private readonly taskTypeRecommendations: Record<TaskType, { metricIds: string[]; reason: string }> = {
    [TaskType.QA]: {
      metricIds: ['answer_relevancy', 'faithfulness', 'completeness', 'hallucination'],
      reason: '问答任务需要关注答案的相关性、忠实度、完整性和幻觉检测',
    },
    [TaskType.CLASSIFICATION]: {
      metricIds: ['accuracy', 'bias', 'toxicity'],
      reason: '分类任务需要关注准确性、偏见和毒性检测',
    },
    [TaskType.SUMMARIZATION]: {
      metricIds: ['completeness', 'faithfulness', 'answer_relevancy'],
      reason: '摘要任务需要关注内容完整性、忠实度和相关性',
    },
    [TaskType.INTENT]: {
      metricIds: ['accuracy', 'completeness'],
      reason: '意图识别任务需要关注准确性和完整性',
    },
    [TaskType.CHAT]: {
      metricIds: ['answer_relevancy', 'toxicity', 'bias'],
      reason: '对话任务需要关注回答相关性、毒性和偏见检测',
    },
    [TaskType.TRANSLATION]: {
      metricIds: ['answer_relevancy', 'completeness'],
      reason: '翻译任务需要关注翻译准确性和完整性',
    },
    [TaskType.CODE_GENERATION]: {
      metricIds: ['accuracy', 'completeness'],
      reason: '代码生成任务需要关注代码正确性和完整性',
    },
    [TaskType.GENERAL]: {
      metricIds: ['answer_relevancy', 'completeness', 'toxicity'],
      reason: '通用任务推荐关注相关性、完整性和安全性',
    },
  };

  /**
   * 获取所有指标类型
   */
  getAllMetrics(): MetricDefinition[] {
    const customMetricsList = Array.from(this.customMetrics.values());
    return [...this.builtInMetrics, ...customMetricsList];
  }

  /**
   * 获取指标详情
   */
  getMetricDetail(metricId: string): MetricDefinition {
    const builtIn = this.builtInMetrics.find(m => m.id === metricId);
    if (builtIn) return builtIn;

    const custom = this.customMetrics.get(metricId);
    if (custom) return custom;

    throw new NotFoundException(`指标 ${metricId} 不存在`);
  }

  /**
   * 根据任务类型推荐指标
   */
  getRecommendedMetrics(taskType: TaskType): MetricRecommendation {
    const recommendation = this.taskTypeRecommendations[taskType];
    if (!recommendation) {
      // 默认推荐
      return {
        taskType,
        recommendedMetrics: this.taskTypeRecommendations[TaskType.GENERAL].metricIds.map(
          id => this.getMetricDetail(id)
        ),
        reason: this.taskTypeRecommendations[TaskType.GENERAL].reason,
      };
    }

    return {
      taskType,
      recommendedMetrics: recommendation.metricIds.map(id => this.getMetricDetail(id)),
      reason: recommendation.reason,
    };
  }

  /**
   * 获取所有任务类型
   */
  getTaskTypes(): Array<{ id: TaskType; name: string; description: string }> {
    return [
      { id: TaskType.QA, name: '问答', description: '问答对生成和回答' },
      { id: TaskType.CLASSIFICATION, name: '分类', description: '文本分类任务' },
      { id: TaskType.SUMMARIZATION, name: '摘要', description: '文本摘要生成' },
      { id: TaskType.INTENT, name: '意图识别', description: '用户意图分类' },
      { id: TaskType.CHAT, name: '对话', description: '多轮对话' },
      { id: TaskType.TRANSLATION, name: '翻译', description: '文本翻译' },
      { id: TaskType.CODE_GENERATION, name: '代码生成', description: '代码生成任务' },
      { id: TaskType.GENERAL, name: '通用', description: '通用任务' },
    ];
  }

  /**
   * 创建自定义指标
   */
  createCustomMetric(config: CustomMetricConfig): MetricDefinition {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const metric: MetricDefinition = {
      id,
      type: `custom_${config.name.toLowerCase().replace(/\s+/g, '_')}` as MetricType,
      name: config.name,
      description: config.description,
      category: config.category,
      applicableTaskTypes: config.applicableTaskTypes,
      scoreRange: config.scoreRange || { min: 0, max: 1 },
      isBuiltIn: false,
      config: {
        promptTemplate: config.promptTemplate,
      },
    };

    this.customMetrics.set(id, metric);
    return metric;
  }

  /**
   * 删除自定义指标
   */
  deleteCustomMetric(metricId: string): { success: boolean; message: string } {
    if (!this.customMetrics.has(metricId)) {
      throw new NotFoundException(`自定义指标 ${metricId} 不存在`);
    }

    const metric = this.customMetrics.get(metricId);
    if (metric?.isBuiltIn) {
      throw new NotFoundException('不能删除内置指标');
    }

    this.customMetrics.delete(metricId);
    return { success: true, message: '指标已删除' };
  }

  /**
   * 获取指标分类
   */
  getMetricCategories(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'quality', name: '质量指标', description: '评估输出质量的指标' },
      { id: 'safety', name: '安全指标', description: '评估输出安全性的指标' },
      { id: 'efficiency', name: '效率指标', description: '评估性能和成本的指标' },
      { id: 'retrieval', name: '检索指标', description: '评估检索效果的指标' },
    ];
  }
}
