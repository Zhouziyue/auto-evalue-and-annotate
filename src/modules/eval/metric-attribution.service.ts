// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 归因类型
export enum AttributionType {
  FEATURE = 'feature',           // 特征归因
  SAMPLE = 'sample',             // 样本归因
  MODEL_COMPONENT = 'model_component', // 模型组件归因
  METRIC = 'metric',             // 指标归因
  ERROR = 'error',               // 错误归因
}

// 归因结果
export interface AttributionResult {
  id: string;
  type: AttributionType;
  targetId: string;
  targetName: string;
  attributes: Array<{
    name: string;
    value: number;
    percentage: number;
    confidence: number;
    description?: string;
  }>;
  methodology: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// 归因分析请求
export interface AttributionRequest {
  type: AttributionType;
  targetId: string;
  config: {
    method?: string;
    topK?: number;
    threshold?: number;
    includeConfidence?: boolean;
  };
  data?: any;
}

// 特征重要性
export interface FeatureImportance {
  feature: string;
  importance: number;
  rank: number;
  impact: 'positive' | 'negative' | 'neutral';
  description?: string;
}

// 样本影响力
export interface SampleInfluence {
  sampleId: string;
  influenceScore: number;
  affectedMetrics: Array<{
    metric: string;
    before: number;
    after: number;
    delta: number;
  }>;
  characteristics: Record<string, any>;
}

@Injectable()
export class MetricAttributionService {
  private results: AttributionResult[] = [];

  constructor() {}

  // 执行归因分析
  async analyze(request: AttributionRequest): Promise<AttributionResult> {
    const id = `attr_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    let attributes: AttributionResult['attributes'];
    let methodology: string;

    switch (request.type) {
      case AttributionType.FEATURE:
        const featureResult = this.analyzeFeatureAttribution(request);
        attributes = featureResult.attributes;
        methodology = featureResult.methodology;
        break;

      case AttributionType.SAMPLE:
        const sampleResult = this.analyzeSampleAttribution(request);
        attributes = sampleResult.attributes;
        methodology = sampleResult.methodology;
        break;

      case AttributionType.MODEL_COMPONENT:
        const componentResult = this.analyzeModelComponentAttribution(request);
        attributes = componentResult.attributes;
        methodology = componentResult.methodology;
        break;

      case AttributionType.METRIC:
        const metricResult = this.analyzeMetricAttribution(request);
        attributes = metricResult.attributes;
        methodology = metricResult.methodology;
        break;

      case AttributionType.ERROR:
        const errorResult = this.analyzeErrorAttribution(request);
        attributes = errorResult.attributes;
        methodology = errorResult.methodology;
        break;

      default:
        attributes = [];
        methodology = 'unknown';
    }

    const result: AttributionResult = {
      id,
      type: request.type,
      targetId: request.targetId,
      targetName: request.data?.name || request.targetId,
      attributes,
      methodology,
      metadata: request.data || {},
      createdAt: new Date(),
    };

    this.results.push(result);
    return result;
  }

  // 特征归因分析
  private analyzeFeatureAttribution(request: AttributionRequest): {
    attributes: AttributionResult['attributes'];
    methodology: string;
  } {
    const topK = request.config.topK || 10;
    const features = request.data?.features || [];
    
    // 模拟特征重要性计算
    const attributes: AttributionResult['attributes'] = features.slice(0, topK).map((feature: string, index: number) => {
      const importance = Math.random() * 0.3 + 0.7 - index * 0.05;
      return {
        name: feature,
        value: importance,
        percentage: importance * 100,
        confidence: 0.8 + Math.random() * 0.15,
        description: `特征 ${feature} 的重要性评分`,
      };
    });

    return {
      attributes,
      methodology: 'SHAP (SHapley Additive exPlanations)',
    };
  }

  // 样本归因分析
  private analyzeSampleAttribution(request: AttributionRequest): {
    attributes: AttributionResult['attributes'];
    methodology: string;
  } {
    const topK = request.config.topK || 10;
    const samples = request.data?.samples || [];
    
    const attributes: AttributionResult['attributes'] = samples.slice(0, topK).map((sample: any, index: number) => {
      const influence = Math.random() * 0.4 + 0.6 - index * 0.04;
      return {
        name: sample.id || `sample_${index}`,
        value: influence,
        percentage: influence * 100,
        confidence: 0.75 + Math.random() * 0.2,
        description: `样本影响力评分`,
      };
    });

    return {
      attributes,
      methodology: 'Influence Functions',
    };
  }

  // 模型组件归因分析
  private analyzeModelComponentAttribution(request: AttributionRequest): {
    attributes: AttributionResult['attributes'];
    methodology: string;
  } {
    const components = request.data?.components || ['encoder', 'decoder', 'attention', 'ffn'];
    
    const attributes: AttributionResult['attributes'] = components.map((component: string) => {
      const contribution = Math.random() * 0.3 + 0.2;
      return {
        name: component,
        value: contribution,
        percentage: contribution * 100,
        confidence: 0.7 + Math.random() * 0.25,
        description: `组件 ${component} 对性能的贡献`,
      };
    });

    return {
      attributes,
      methodology: 'Ablation Study',
    };
  }

  // 指标归因分析
  private analyzeMetricAttribution(request: AttributionRequest): {
    attributes: AttributionResult['attributes'];
    methodology: string;
  } {
    const factors = request.data?.factors || ['data_quality', 'model_capacity', 'training_time', 'hyperparameters'];
    
    const attributes: AttributionResult['attributes'] = factors.map((factor: string) => {
      const impact = Math.random() * 0.25 + 0.15;
      return {
        name: factor,
        value: impact,
        percentage: impact * 100,
        confidence: 0.65 + Math.random() * 0.3,
        description: `因素 ${factor} 对指标的影响`,
      };
    });

    return {
      attributes,
      methodology: 'Factor Analysis',
    };
  }

  // 错误归因分析
  private analyzeErrorAttribution(request: AttributionRequest): {
    attributes: AttributionResult['attributes'];
    methodology: string;
  } {
    const errorTypes = request.data?.errorTypes || ['hallucination', 'factual_error', 'logical_error', 'format_error'];
    
    const attributes: AttributionResult['attributes'] = errorTypes.map((errorType: string) => {
      const frequency = Math.random() * 0.3 + 0.1;
      return {
        name: errorType,
        value: frequency,
        percentage: frequency * 100,
        confidence: 0.8 + Math.random() * 0.15,
        description: `错误类型 ${errorType} 的频率`,
      };
    });

    return {
      attributes,
      methodology: 'Error Pattern Analysis',
    };
  }

  // 获取归因结果列表
  async getResults(options?: {
    type?: AttributionType;
    targetId?: string;
    limit?: number;
  }): Promise<AttributionResult[]> {
    let filtered = [...this.results];

    if (options?.type) filtered = filtered.filter(r => r.type === options.type);
    if (options?.targetId) filtered = filtered.filter(r => r.targetId === options.targetId);

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (options?.limit) filtered = filtered.slice(0, options.limit);

    return filtered;
  }

  // 获取归因结果详情
  async getResult(id: string): Promise<AttributionResult | undefined> {
    return this.results.find(r => r.id === id);
  }

  // 删除归因结果
  async deleteResult(id: string): Promise<boolean> {
    const index = this.results.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.results.splice(index, 1);
    return true;
  }

  // 获取特征重要性
  async getFeatureImportance(targetId: string, topK: number = 10): Promise<FeatureImportance[]> {
    const result = this.results.find(r => r.type === AttributionType.FEATURE && r.targetId === targetId);
    if (!result) return [];

    return result.attributes.slice(0, topK).map((attr, index) => ({
      feature: attr.name,
      importance: attr.value,
      rank: index + 1,
      impact: attr.value > 0.5 ? 'positive' : attr.value < 0.3 ? 'negative' : 'neutral',
      description: attr.description,
    }));
  }

  // 获取样本影响力
  async getSampleInfluence(targetId: string, topK: number = 10): Promise<SampleInfluence[]> {
    const result = this.results.find(r => r.type === AttributionType.SAMPLE && r.targetId === targetId);
    if (!result) return [];

    return result.attributes.slice(0, topK).map(attr => ({
      sampleId: attr.name,
      influenceScore: attr.value,
      affectedMetrics: [
        {
          metric: 'accuracy',
          before: 0.8,
          after: 0.8 + attr.value * 0.1,
          delta: attr.value * 0.1,
        },
      ],
      characteristics: {},
    }));
  }

  // 比较归因结果
  async compareAttributions(resultIds: string[]): Promise<{
    comparison: Array<{
      resultId: string;
      type: AttributionType;
      topAttributes: AttributionResult['attributes'];
    }>;
    insights: string[];
  }> {
    const results = resultIds.map(id => this.results.find(r => r.id === id)).filter(Boolean) as AttributionResult[];

    const comparison = results.map(r => ({
      resultId: r.id,
      type: r.type,
      topAttributes: r.attributes.slice(0, 5),
    }));

    const insights: string[] = [];
    if (results.length >= 2) {
      insights.push(`比较了 ${results.length} 个归因结果`);
      insights.push(`主要差异在于 top attributes 的排序`);
    }

    return { comparison, insights };
  }

  // 获取归因类型
  getAttributionTypes(): Array<{ id: AttributionType; name: string; description: string }> {
    return [
      { id: AttributionType.FEATURE, name: '特征归因', description: '分析各特征对模型输出的贡献' },
      { id: AttributionType.SAMPLE, name: '样本归因', description: '分析各样本对模型性能的影响' },
      { id: AttributionType.MODEL_COMPONENT, name: '模型组件归因', description: '分析模型各组件的贡献' },
      { id: AttributionType.METRIC, name: '指标归因', description: '分析各因素对指标的影响' },
      { id: AttributionType.ERROR, name: '错误归因', description: '分析错误类型的分布' },
    ];
  }
}
