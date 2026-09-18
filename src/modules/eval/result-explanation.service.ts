// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 解释类型
export enum ExplanationType {
  FEATURE_IMPORTANCE = 'feature_importance',     // 特征重要性
  DECISION_PATH = 'decision_path',               // 决策路径
  COUNTERFACTUAL = 'counterfactual',             // 反事实解释
  EXAMPLE_BASED = 'example_based',               // 基于示例
  RULE_BASED = 'rule_based',                     // 基于规则
  NATURAL_LANGUAGE = 'natural_language',         // 自然语言解释
}

// 解释结果
export interface ExplanationResult {
  id: string;
  resultId: string;
  type: ExplanationType;
  summary: string;
  details: {
    keyFactors: Array<{
      factor: string;
      impact: number;
      direction: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
    decisionPath?: Array<{
      step: number;
      condition: string;
      result: string;
    }>;
    counterfactuals?: Array<{
      change: string;
      outcome: string;
      confidence: number;
    }>;
    examples?: Array<{
      input: string;
      output: string;
      similarity: number;
    }>;
    rules?: Array<{
      condition: string;
      conclusion: string;
      confidence: number;
    }>;
    naturalLanguage?: string;
  };
  confidence: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

// 解释请求
export interface ExplanationRequest {
  resultId: string;
  type: ExplanationType;
  config: {
    topK?: number;
    includeConfidence?: boolean;
    language?: string;
    depth?: number;
  };
  data?: any;
}

@Injectable()
export class ResultExplanationService {
  private explanations: ExplanationResult[] = [];

  constructor() {}

  // 生成解释
  async generateExplanation(request: ExplanationRequest): Promise<ExplanationResult> {
    const id = `expl_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    let summary: string;
    let details: ExplanationResult['details'];
    let confidence: number;

    switch (request.type) {
      case ExplanationType.FEATURE_IMPORTANCE:
        const featureResult = this.generateFeatureImportance(request);
        summary = featureResult.summary;
        details = featureResult.details;
        confidence = featureResult.confidence;
        break;

      case ExplanationType.DECISION_PATH:
        const pathResult = this.generateDecisionPath(request);
        summary = pathResult.summary;
        details = pathResult.details;
        confidence = pathResult.confidence;
        break;

      case ExplanationType.COUNTERFACTUAL:
        const cfResult = this.generateCounterfactual(request);
        summary = cfResult.summary;
        details = cfResult.details;
        confidence = cfResult.confidence;
        break;

      case ExplanationType.EXAMPLE_BASED:
        const exampleResult = this.generateExampleBased(request);
        summary = exampleResult.summary;
        details = exampleResult.details;
        confidence = exampleResult.confidence;
        break;

      case ExplanationType.RULE_BASED:
        const ruleResult = this.generateRuleBased(request);
        summary = ruleResult.summary;
        details = ruleResult.details;
        confidence = ruleResult.confidence;
        break;

      case ExplanationType.NATURAL_LANGUAGE:
        const nlResult = this.generateNaturalLanguage(request);
        summary = nlResult.summary;
        details = nlResult.details;
        confidence = nlResult.confidence;
        break;

      default:
        summary = '未知解释类型';
        details = { keyFactors: [] };
        confidence = 0;
    }

    const result: ExplanationResult = {
      id,
      resultId: request.resultId,
      type: request.type,
      summary,
      details,
      confidence,
      metadata: request.data || {},
      createdAt: new Date(),
    };

    this.explanations.push(result);
    return result;
  }

  // 生成特征重要性解释
  private generateFeatureImportance(request: ExplanationRequest): {
    summary: string;
    details: ExplanationResult['details'];
    confidence: number;
  } {
    const topK = request.config.topK || 5;
    const features = request.data?.features || ['输入长度', '词汇复杂度', '上下文相关性', '问题类型', '领域匹配'];

    const keyFactors = features.slice(0, topK).map((feature: string, index: number) => ({
      factor: feature,
      impact: 0.8 - index * 0.12,
      direction: index % 3 === 0 ? 'negative' as const : 'positive' as const,
      description: `特征 "${feature}" 对结果的影响程度为 ${((0.8 - index * 0.12) * 100).toFixed(1)}%`,
    }));

    return {
      summary: `主要影响因素包括：${features.slice(0, 3).join('、')}等`,
      details: { keyFactors },
      confidence: 0.85,
    };
  }

  // 生成决策路径解释
  private generateDecisionPath(request: ExplanationRequest): {
    summary: string;
    details: ExplanationResult['details'];
    confidence: number;
  } {
    const decisionPath = [
      { step: 1, condition: '输入长度 > 10', result: '进入详细分析分支' },
      { step: 2, condition: '包含关键词', result: '识别为技术问题' },
      { step: 3, condition: '上下文匹配度 > 0.7', result: '高置信度回答' },
      { step: 4, condition: '领域匹配', result: '选择专业模型' },
    ];

    return {
      summary: '决策经过4个关键步骤，最终得出高置信度结果',
      details: {
        keyFactors: [
          { factor: '输入长度', impact: 0.3, direction: 'positive', description: '输入足够长以提供上下文' },
          { factor: '关键词匹配', impact: 0.25, direction: 'positive', description: '成功识别问题类型' },
        ],
        decisionPath,
      },
      confidence: 0.8,
    };
  }

  // 生成反事实解释
  private generateCounterfactual(request: ExplanationRequest): {
    summary: string;
    details: ExplanationResult['details'];
    confidence: number;
  } {
    const counterfactuals = [
      { change: '如果输入长度减少50%', outcome: '结果置信度下降20%', confidence: 0.75 },
      { change: '如果移除上下文信息', outcome: '结果可能完全改变', confidence: 0.8 },
      { change: '如果使用不同领域的数据', outcome: '准确率下降15%', confidence: 0.7 },
    ];

    return {
      summary: '通过反事实分析，输入长度和上下文是影响结果的关键因素',
      details: {
        keyFactors: [
          { factor: '输入长度', impact: 0.35, direction: 'positive', description: '长度对结果有显著影响' },
        ],
        counterfactuals,
      },
      confidence: 0.75,
    };
  }

  // 生成基于示例的解释
  private generateExampleBased(request: ExplanationRequest): {
    summary: string;
    details: ExplanationResult['details'];
    confidence: number;
  } {
    const examples = [
      { input: '什么是机器学习？', output: '机器学习是...', similarity: 0.92 },
      { input: '解释深度学习', output: '深度学习是...', similarity: 0.88 },
      { input: 'AI的应用有哪些', output: 'AI应用于...', similarity: 0.85 },
    ];

    return {
      summary: '找到3个相似示例，平均相似度85%',
      details: {
        keyFactors: [
          { factor: '示例相似度', impact: 0.4, direction: 'positive', description: '与历史示例高度相似' },
        ],
        examples,
      },
      confidence: 0.82,
    };
  }

  // 生成基于规则的解释
  private generateRuleBased(request: ExplanationRequest): {
    summary: string;
    details: ExplanationResult['details'];
    confidence: number;
  } {
    const rules = [
      { condition: '输入长度 > 10 且包含技术术语', conclusion: '判定为技术问题', confidence: 0.9 },
      { condition: '上下文相关性 > 0.7', conclusion: '使用详细回答策略', confidence: 0.85 },
      { condition: '领域匹配度 > 0.8', conclusion: '选择专业模型处理', confidence: 0.88 },
    ];

    return {
      summary: '匹配3条规则，综合置信度87%',
      details: {
        keyFactors: [
          { factor: '规则匹配度', impact: 0.45, direction: 'positive', description: '多条规则同时匹配' },
        ],
        rules,
      },
      confidence: 0.87,
    };
  }

  // 生成自然语言解释
  private generateNaturalLanguage(request: ExplanationRequest): {
    summary: string;
    details: ExplanationResult['details'];
    confidence: number;
  } {
    const explanation = `本次评测结果显示模型表现良好。主要优点包括：输入处理能力强，能够准确理解问题意图；上下文利用率高，充分利用了提供的背景信息。需要改进的方面：在处理复杂技术问题时，可以进一步优化回答的结构性。总体而言，模型在该测试场景下的准确率达到85%，表现稳定。`;

    return {
      summary: explanation.substring(0, 50) + '...',
      details: {
        keyFactors: [
          { factor: '整体表现', impact: 0.85, direction: 'positive', description: '模型表现良好' },
          { factor: '输入处理', impact: 0.4, direction: 'positive', description: '输入处理能力强' },
          { factor: '上下文利用', impact: 0.35, direction: 'positive', description: '上下文利用率高' },
        ],
        naturalLanguage: explanation,
      },
      confidence: 0.9,
    };
  }

  // 获取解释结果列表
  async getExplanations(resultId?: string, type?: ExplanationType): Promise<ExplanationResult[]> {
    let filtered = [...this.explanations];
    if (resultId) filtered = filtered.filter(e => e.resultId === resultId);
    if (type) filtered = filtered.filter(e => e.type === type);
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取解释详情
  async getExplanation(id: string): Promise<ExplanationResult | undefined> {
    return this.explanations.find(e => e.id === id);
  }

  // 删除解释
  async deleteExplanation(id: string): Promise<boolean> {
    const index = this.explanations.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.explanations.splice(index, 1);
    return true;
  }

  // 获取解释类型
  getExplanationTypes(): Array<{ id: ExplanationType; name: string; description: string }> {
    return [
      { id: ExplanationType.FEATURE_IMPORTANCE, name: '特征重要性', description: '分析各特征对结果的影响' },
      { id: ExplanationType.DECISION_PATH, name: '决策路径', description: '展示决策的完整路径' },
      { id: ExplanationType.COUNTERFACTUAL, name: '反事实解释', description: '分析条件变化对结果的影响' },
      { id: ExplanationType.EXAMPLE_BASED, name: '基于示例', description: '通过相似示例解释' },
      { id: ExplanationType.RULE_BASED, name: '基于规则', description: '通过匹配规则解释' },
      { id: ExplanationType.NATURAL_LANGUAGE, name: '自然语言', description: '生成自然语言解释' },
    ];
  }

  // 比较解释
  async compareExplanations(explanationIds: string[]): Promise<{
    comparisons: Array<{
      id: string;
      type: ExplanationType;
      summary: string;
      confidence: number;
    }>;
    insights: string[];
  }> {
    const explanations = explanationIds
      .map(id => this.explanations.find(e => e.id === id))
      .filter(Boolean) as ExplanationResult[];

    const comparisons = explanations.map(e => ({
      id: e.id,
      type: e.type,
      summary: e.summary,
      confidence: e.confidence,
    }));

    const insights: string[] = [];
    if (explanations.length >= 2) {
      const avgConfidence = explanations.reduce((sum, e) => sum + e.confidence, 0) / explanations.length;
      insights.push(`比较了 ${explanations.length} 种解释方法`);
      insights.push(`平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
    }

    return { comparisons, insights };
  }
}
