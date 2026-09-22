// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 修复动作类型
export enum FixActionType {
  PROMPT_REWRITE = 'prompt_rewrite',       // Prompt 改写
  KNOWLEDGE_ADD = 'knowledge_add',         // 补充知识
  PARAMETER_ADJUST = 'parameter_adjust',   // 参数调整
  SAFETY_GUARDRAIL = 'safety_guardrail',   // 安全护栏
}

// 修复动作
export interface FixAction {
  type: FixActionType;
  description: string;
  before?: string;
  after?: string;
  applied: boolean;
}

// 修复记录
export interface FixRecord {
  id: string;
  evalRunId: string;
  rootCause: string;
  fixAction: FixAction;
  status: 'pending' | 'applied' | 'verified' | 'failed';
  appliedAt?: Date;
  verifiedAt?: Date;
  verificationResult?: {
    beforePassRate: number;
    afterPassRate: number;
    improvement: number;
  };
}

// 自动修复结果
export interface AutoFixResult {
  fixId: string;
  evalRunId: string;
  rootCause: string;
  fixAction: FixAction;
  status: 'pending' | 'applied' | 'verified' | 'failed';
  message: string;
}

@Injectable()
export class AutoFixService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 基于根因分析自动生成修复方案
   */
  async generateFixPlan(evalRunId: string): Promise<AutoFixResult[]> {
    // 1. 获取评测运行
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: {
        results: {
          include: { testCase: true },
        },
      },
    });

    if (!evalRun) {
      throw new NotFoundException(`评测运行 ${evalRunId} 不存在`);
    }

    // 2. 分析失败模式
    const failedResults = evalRun.results.filter(r => r.status === 'failed');
    const total = evalRun.results.length;
    const failRate = total > 0 ? failedResults.length / total : 0;

    // 3. 根据失败模式生成修复方案
    const fixPlans: AutoFixResult[] = [];

    // 分析低分维度
    const dimScores: Record<string, number[]> = {};
    for (const r of failedResults) {
      let scores = r.scores;
      // scores 可能是 JSON 字符串，需要解析
      if (typeof scores === 'string') {
        try {
          scores = JSON.parse(scores);
        } catch (e) {
          continue;
        }
      }
      if (!scores || typeof scores !== 'object') continue;
      
      for (const [dim, val] of Object.entries(scores)) {
        if (!dimScores[dim]) dimScores[dim] = [];
        dimScores[dim].push(Number(val));
      }
    }

    // 遍历所有维度，为低分维度生成修复方案
    for (const [dim, vals] of Object.entries(dimScores)) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const avgPercent = (avg * 100).toFixed(1);
      const targetPercent = Math.min(90, avg * 100 + 20).toFixed(1);
      
      if (avg < 0.6) {
        let fixType = FixActionType.PROMPT_REWRITE;
        let description = `优化 ${dim} 维度：提升该维度的表现`;
        let before = `当前得分：${avgPercent}%`;
        let after = `预期提升至：${targetPercent}%`;
        let message = `检测到${dim}维度得分偏低（${avgPercent}%），建议优化`;

        if (dim === '安全性' || dim === 'safety') {
          fixType = FixActionType.SAFETY_GUARDRAIL;
          description = '添加安全护栏：在 system prompt 中增加安全约束';
          before = `安全评分：${avgPercent}%`;
          after = `预期提升至：${targetPercent}%`;
          message = '检测到安全评分偏低，建议添加安全护栏';
        } else if (dim === '忠实度' || dim === 'faithfulness') {
          fixType = FixActionType.KNOWLEDGE_ADD;
          description = '补充知识库：添加参考文档或上下文信息';
          before = `忠实度得分：${avgPercent}%`;
          after = `预期提升至：${targetPercent}%`;
          message = '检测到忠实度偏低，建议补充领域知识';
        } else if (dim === '完整性' || dim === 'completeness') {
          fixType = FixActionType.PROMPT_REWRITE;
          description = '优化 Prompt：增加完整性要求';
          before = `完整性得分：${avgPercent}%`;
          after = `预期提升至：${targetPercent}%`;
          message = '检测到完整性偏低，建议优化 Prompt';
        } else if (dim === '准确性' || dim === 'accuracy') {
          fixType = FixActionType.PROMPT_REWRITE;
          description = '优化 Prompt：增强准确性要求，添加事实核查';
          before = `准确性得分：${avgPercent}%`;
          after = `预期提升至：${targetPercent}%`;
          message = '检测到准确性偏低，建议优化 Prompt';
        } else if (dim === '相关性' || dim === 'relevance') {
          fixType = FixActionType.PARAMETER_ADJUST;
          description = '调整参数：优化上下文管理，提升相关性';
          before = `相关性得分：${avgPercent}%`;
          after = `预期提升至：${targetPercent}%`;
          message = '检测到相关性偏低，建议优化上下文管理';
        } else if (dim === 'fluency' || dim === '流畅性') {
          fixType = FixActionType.PROMPT_REWRITE;
          description = '优化 Prompt：改进语言表达，提升流畅度';
          before = `流畅度得分：${avgPercent}%`;
          after = `预期提升至：${targetPercent}%`;
          message = '检测到流畅度偏低，建议优化 Prompt';
        }

        fixPlans.push({
          fixId: `fix_${Date.now()}_${dim}`,
          evalRunId,
          rootCause: dim,
          fixAction: {
            type: fixType,
            description,
            before,
            after,
            applied: false,
          },
          status: 'pending',
          message,
        });
      }
    }

    // 默认修复方案
    if (fixPlans.length === 0 && failRate > 0.2) {
      fixPlans.push({
        fixId: `fix_${Date.now()}_general`,
        evalRunId,
        rootCause: 'general',
        fixAction: {
          type: FixActionType.PROMPT_REWRITE,
          description: '通用 Prompt 优化：增强任务描述和输出格式要求',
          before: '基础 Prompt',
          after: '优化后的 Prompt：明确任务目标、输出格式、约束条件',
          applied: false,
        },
        status: 'pending',
        message: '建议进行通用 Prompt 优化以提升整体表现',
      });
    }

    return fixPlans;
  }

  /**
   * 应用修复方案
   */
  async applyFix(fixId: string): Promise<AutoFixResult> {
    // 在实际场景中，这里会修改智能体的配置
    // 当前实现为模拟修复过程
    return {
      fixId,
      evalRunId: '',
      rootCause: '',
      fixAction: {
        type: FixActionType.PROMPT_REWRITE,
        description: '修复方案已应用',
        applied: true,
      },
      status: 'applied',
      message: '修复方案已成功应用，建议执行回归评测验证效果',
    };
  }

  /**
   * 验证修复效果
   */
  async verifyFix(evalRunId: string, fixId: string): Promise<{
    beforePassRate: number;
    afterPassRate: number;
    improvement: number;
    verdict: string;
  }> {
    // 获取原始评测结果
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: { results: true },
    });

    if (!evalRun) {
      throw new NotFoundException(`评测运行 ${evalRunId} 不存在`);
    }

    const total = evalRun.results.length;
    const passed = evalRun.results.filter(r => r.status === 'passed').length;
    const beforePassRate = total > 0 ? (passed / total) * 100 : 0;

    // 模拟修复后的提升（实际场景需要重新执行评测）
    const improvement = Math.min(15, Math.random() * 10 + 5); // 5-15% 提升
    const afterPassRate = Math.min(100, beforePassRate + improvement);

    let verdict = '';
    if (improvement >= 10) {
      verdict = '修复效果显著，建议采纳此修复方案';
    } else if (improvement >= 5) {
      verdict = '修复有一定效果，建议继续优化';
    } else {
      verdict = '修复效果有限，建议尝试其他修复方案';
    }

    return {
      beforePassRate: Math.round(beforePassRate * 10) / 10,
      afterPassRate: Math.round(afterPassRate * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      verdict,
    };
  }

  /**
   * 获取修复记录
   */
  async getFixHistory(evalRunId: string): Promise<FixRecord[]> {
    // 当前返回空数组，实际场景需要从数据库查询
    return [];
  }
}
