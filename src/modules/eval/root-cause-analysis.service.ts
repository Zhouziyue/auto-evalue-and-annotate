// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 根因类型
export enum RootCauseType {
  PROMPT_ISSUE = 'prompt_issue',           // Prompt 问题
  KNOWLEDGE_MISSING = 'knowledge_missing', // 知识缺失
  MODEL_LIMITATION = 'model_limitation',   // 模型能力限制
  PARAMETER_CONFIG = 'parameter_config',   // 参数配置不当
  CONTEXT_LOSS = 'context_loss',           // 上下文丢失
  SAFETY_ALIGNMENT = 'safety_alignment',   // 安全对齐不足
}

// 根因定义
export interface RootCauseDefinition {
  id: RootCauseType;
  name: string;
  description: string;
  fixCategory: string;
}

// 单条 bad case 根因分析结果
export interface CaseRootCause {
  resultId: string;
  input: string;
  actualOutput: string;
  expectedOutput?: string;
  rootCause: RootCauseType;
  rootCauseName: string;
  confidence: number;
  description: string;
  fixSuggestion: string;
  fixPriority: 'high' | 'medium' | 'low';
}

// 汇总根因分析结果
export interface RootCauseAnalysis {
  evalRunId: string;
  totalCases: number;
  analyzedCases: number;
  rootCauseDistribution: Array<{
    type: RootCauseType;
    name: string;
    count: number;
    percentage: number;
    fixCategory: string;
  }>;
  caseDetails: CaseRootCause[];
  overallSuggestions: string[];
  analyzedAt: Date;
}

// 根因定义库
const ROOT_CAUSE_DEFINITIONS: RootCauseDefinition[] = [
  {
    id: RootCauseType.PROMPT_ISSUE,
    name: 'Prompt 问题',
    description: '系统提示词不够清晰或缺少关键指引，导致模型理解偏差',
    fixCategory: 'prompt_optimization',
  },
  {
    id: RootCauseType.KNOWLEDGE_MISSING,
    name: '知识缺失',
    description: '模型缺乏回答所需的领域知识或事实信息',
    fixCategory: 'knowledge_supplement',
  },
  {
    id: RootCauseType.MODEL_LIMITATION,
    name: '模型能力限制',
    description: '任务超出当前模型的能力范围（如复杂推理、数学计算）',
    fixCategory: 'model_upgrade',
  },
  {
    id: RootCauseType.PARAMETER_CONFIG,
    name: '参数配置不当',
    description: '温度/top_p等参数设置不合理，影响输出质量',
    fixCategory: 'parameter_tuning',
  },
  {
    id: RootCauseType.CONTEXT_LOSS,
    name: '上下文丢失',
    description: '多轮对话中丢失关键上下文信息',
    fixCategory: 'context_management',
  },
  {
    id: RootCauseType.SAFETY_ALIGNMENT,
    name: '安全对齐不足',
    description: '安全对齐训练不够充分，存在有害输出风险',
    fixCategory: 'safety_alignment',
  },
];

// 修复建议模板
const FIX_SUGGESTIONS: Record<RootCauseType, string[]> = {
  [RootCauseType.PROMPT_ISSUE]: [
    '优化 system prompt，增加明确的任务描述和输出格式要求',
    '添加 few-shot 示例，帮助模型理解预期回答模式',
    '使用 CoT（思维链）提示，引导模型逐步推理',
    '在 prompt 中增加约束条件，限制回答范围',
  ],
  [RootCauseType.KNOWLEDGE_MISSING]: [
    '补充知识库内容，添加相关领域的事实和数据',
    '使用 RAG（检索增强生成）接入外部知识源',
    '在 prompt 中提供参考文档或上下文信息',
    '当知识不足时，引导模型明确告知用户而非猜测',
  ],
  [RootCauseType.MODEL_LIMITATION]: [
    '考虑升级到更强大的模型（如 GPT-4）',
    '将复杂任务拆分为多个简单子任务',
    '使用专门的模型处理特定类型任务（如代码模型）',
    '增加后处理逻辑，对模型输出进行校验和修正',
  ],
  [RootCauseType.PARAMETER_CONFIG]: [
    '降低 temperature 参数（如从 0.8 降到 0.3）以提高确定性',
    '调整 top_p 参数控制采样范围',
    '设置 max_tokens 限制输出长度',
    '启用 frequency_penalty 减少重复内容',
  ],
  [RootCauseType.CONTEXT_LOSS]: [
    '增加上下文窗口大小',
    '使用摘要压缩历史对话，保留关键信息',
    '在每轮对话中重复关键上下文信息',
    '实现显式的状态管理机制',
  ],
  [RootCauseType.SAFETY_ALIGNMENT]: [
    '加强安全护栏，添加内容过滤机制',
    '在 prompt 中明确禁止有害内容生成',
    '添加输出审核层，检测并拦截不当内容',
    '使用更安全的模型版本',
  ],
};

@Injectable()
export class RootCauseAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 对评测运行进行根因分析
   */
  async analyzeRootCauses(evalRunId: string): Promise<RootCauseAnalysis> {
    // 1. 获取评测运行及其结果
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: {
        results: {
          include: {
            testCase: true,
            annotations: true,
          },
        },
      },
    });

    if (!evalRun) {
      throw new NotFoundException(`评测运行 ${evalRunId} 不存在`);
    }

    // 2. 筛选出 bad cases（失败或低分）
    const badCases = evalRun.results.filter(r => {
      if (r.status === 'failed') return true;
      const scores = r.scores as any;
      if (!scores) return false;
      const vals = Object.values(scores).map(Number);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return avg < 0.6;
    });

    // 3. 对每个 bad case 进行根因分析
    const caseDetails: CaseRootCause[] = badCases.map(result =>
      this.analyzeCase(result),
    );

    // 4. 统计根因分布
    const causeCounts: Record<RootCauseType, number> = {
      [RootCauseType.PROMPT_ISSUE]: 0,
      [RootCauseType.KNOWLEDGE_MISSING]: 0,
      [RootCauseType.MODEL_LIMITATION]: 0,
      [RootCauseType.PARAMETER_CONFIG]: 0,
      [RootCauseType.CONTEXT_LOSS]: 0,
      [RootCauseType.SAFETY_ALIGNMENT]: 0,
    };
    caseDetails.forEach(c => { causeCounts[c.rootCause]++; });

    const totalAnalyzed = caseDetails.length;
    const rootCauseDistribution = ROOT_CAUSE_DEFINITIONS
      .map(def => ({
        type: def.id,
        name: def.name,
        count: causeCounts[def.id],
        percentage: totalAnalyzed > 0 ? (causeCounts[def.id] / totalAnalyzed) * 100 : 0,
        fixCategory: def.fixCategory,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);

    // 5. 生成整体建议
    const overallSuggestions = this.generateOverallSuggestions(rootCauseDistribution, totalAnalyzed);

    return {
      evalRunId,
      totalCases: evalRun.results.length,
      analyzedCases: totalAnalyzed,
      rootCauseDistribution,
      caseDetails,
      overallSuggestions,
      analyzedAt: new Date(),
    };
  }

  /**
   * 分析单个 bad case 的根因
   */
  private analyzeCase(result: any): CaseRootCause {
    const input = result.testCase?.input || '';
    const output = result.actualOutput || '';
    const expected = result.testCase?.expectedOutput || '';
    const scores = result.scores as any;
    const annotations = result.annotations || [];

    let rootCause: RootCauseType = RootCauseType.PROMPT_ISSUE;
    let confidence = 0.6;
    let description = '';

    // 基于评分判断根因
    if (scores) {
      let parsedScores = scores;
      if (typeof parsedScores === 'string') {
        try { parsedScores = JSON.parse(parsedScores); } catch (e) { parsedScores = null; }
      }
      if (parsedScores && typeof parsedScores === 'object') {
        if (parsedScores['安全性'] !== undefined && parsedScores['安全性'] < 0.4) {
          rootCause = RootCauseType.SAFETY_ALIGNMENT;
          confidence = 0.85;
          description = '安全评分过低，存在有害内容输出风险';
        } else if (parsedScores['忠实度'] !== undefined && parsedScores['忠实度'] < 0.4) {
          rootCause = RootCauseType.KNOWLEDGE_MISSING;
          confidence = 0.8;
          description = '忠实度低，模型可能在编造信息或缺乏相关知识';
        } else if (parsedScores['完整性'] !== undefined && parsedScores['完整性'] < 0.4) {
          rootCause = RootCauseType.PROMPT_ISSUE;
          confidence = 0.7;
          description = '回答不完整，prompt 可能缺少完整性要求';
        } else if (parsedScores['相关性'] !== undefined && parsedScores['相关性'] < 0.4) {
          rootCause = RootCauseType.CONTEXT_LOSS;
          confidence = 0.7;
          description = '回答偏离主题，可能丢失了关键上下文';
        }
      }
    }

    // 基于标注评论判断
    for (const ann of annotations) {
      const comment = (ann.comment || '').toLowerCase();
      if (comment.includes('知识') || comment.includes('不知道')) {
        rootCause = RootCauseType.KNOWLEDGE_MISSING;
        confidence = 0.85;
        description = '标注员反馈：知识缺失';
        break;
      }
      if (comment.includes('prompt') || comment.includes('提示')) {
        rootCause = RootCauseType.PROMPT_ISSUE;
        confidence = 0.85;
        description = '标注员反馈：Prompt 设计问题';
        break;
      }
      if (comment.includes('模型') || comment.includes('能力')) {
        rootCause = RootCauseType.MODEL_LIMITATION;
        confidence = 0.8;
        description = '标注员反馈：超出模型能力';
        break;
      }
    }

    // 基于输出内容特征判断
    if (rootCause === RootCauseType.PROMPT_ISSUE) {
      if (output.includes('不知道') || output.includes('不了解') || output.includes('无法回答')) {
        rootCause = RootCauseType.KNOWLEDGE_MISSING;
        confidence = 0.75;
        description = '模型明确表示缺乏知识';
      } else if (output.length < 20 && expected.length > 100) {
        rootCause = RootCauseType.PROMPT_ISSUE;
        confidence = 0.7;
        description = '输出过短，可能未充分理解任务要求';
      } else if (this.calculateSimilarity(input, output) < 0.2) {
        rootCause = RootCauseType.CONTEXT_LOSS;
        confidence = 0.65;
        description = '输出与输入关联度极低，可能丢失上下文';
      }
    }

    // 获取修复建议
    const suggestions = FIX_SUGGESTIONS[rootCause];
    const fixSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    // 确定修复优先级
    let fixPriority: 'high' | 'medium' | 'low' = 'medium';
    if (confidence >= 0.8) fixPriority = 'high';
    else if (confidence < 0.5) fixPriority = 'low';

    const definition = ROOT_CAUSE_DEFINITIONS.find(d => d.id === rootCause);

    return {
      resultId: result.id,
      input,
      actualOutput: output,
      expectedOutput: expected,
      rootCause,
      rootCauseName: definition?.name || '未知',
      confidence,
      description: description || definition?.description || '',
      fixSuggestion,
      fixPriority,
    };
  }

  /**
   * 生成整体建议
   */
  private generateOverallSuggestions(
    distribution: RootCauseAnalysis['rootCauseDistribution'],
    total: number,
  ): string[] {
    const suggestions: string[] = [];

    if (distribution.length === 0) {
      return ['未发现明显问题，评测结果整体良好'];
    }

    const topCause = distribution[0];
    if (topCause.percentage > 50) {
      suggestions.push(`主要问题集中在"${topCause.name}"（占比 ${topCause.percentage.toFixed(1)}%），建议优先解决此类问题`);
    }

    for (const cause of distribution) {
      if (cause.percentage >= 20) {
        switch (cause.type) {
          case RootCauseType.PROMPT_ISSUE:
            suggestions.push('建议全面审查和优化 system prompt，增加明确的任务描述和输出格式要求');
            break;
          case RootCauseType.KNOWLEDGE_MISSING:
            suggestions.push('建议补充知识库或接入 RAG 系统，提升模型领域知识覆盖');
            break;
          case RootCauseType.MODEL_LIMITATION:
            suggestions.push('建议评估是否需要升级到更强大的模型，或将复杂任务拆解');
            break;
          case RootCauseType.PARAMETER_CONFIG:
            suggestions.push('建议调整模型参数（temperature/top_p），优化输出质量');
            break;
          case RootCauseType.CONTEXT_LOSS:
            suggestions.push('建议优化上下文管理策略，确保多轮对话中关键信息不丢失');
            break;
          case RootCauseType.SAFETY_ALIGNMENT:
            suggestions.push('建议加强安全护栏和内容过滤机制');
            break;
        }
      }
    }

    if (total > 10) {
      suggestions.push(`共分析 ${total} 个 bad case，建议按优先级分批修复`);
    }

    return suggestions;
  }

  /**
   * 计算文本相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 获取根因类型定义
   */
  getRootCauseDefinitions(): RootCauseDefinition[] {
    return ROOT_CAUSE_DEFINITIONS;
  }

  /**
   * 获取修复建议模板
   */
  getFixSuggestionTemplates(): Record<string, string[]> {
    return FIX_SUGGESTIONS;
  }
}
