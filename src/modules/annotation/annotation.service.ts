// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

// 标注维度（与前端评分面板保持一致）
export const ANNOTATION_DIMENSIONS = ['准确性', '完整性', '相关性', '安全性'];

// 冲突判定阈值：任一维度 AI 与人工评分差超过该值即视为冲突
const CONFLICT_THRESHOLD = 0.3;

/** 兼容解析评分：历史数据可能是对象或 JSON 字符串 */
export function parseScores(raw: any): Record<string, number> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** 由四维评分计算置信度（0-1）：平均分越高、维度间分歧越小，置信度越高 */
export function computeConfidence(scores: Record<string, number>): number {
  const values = Object.values(scores).filter((v) => typeof v === 'number');
  if (values.length === 0) return 0.5;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  const stability = Math.max(0, 1 - Math.sqrt(variance) * 2);
  return Number(((avg * 0.7 + stability * 0.3)).toFixed(3));
}

@Injectable()
export class AnnotationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 少样本增强：取最近的人工确认修正样本，注入 AI 标注 Prompt 做校准
   */
  private async getFewShotExamples(limit = 3): Promise<Array<{ input: string; aiScores: Record<string, number>; humanScores: Record<string, number> }>> {
    try {
      const humanAnnotations = await this.prisma.annotation.findMany({
        where: { type: 'human', isFinal: true },
        include: { evalResult: { include: { testCase: true, annotations: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit * 3,
      });

      const examples = [];
      for (const human of humanAnnotations) {
        const ai = (human.evalResult?.annotations || []).find((a) => a.type === 'ai');
        if (!ai) continue;
        examples.push({
          input: human.evalResult?.testCase?.input || '',
          aiScores: parseScores(ai.scores),
          humanScores: parseScores(human.scores),
        });
        if (examples.length >= limit) break;
      }
      return examples;
    } catch {
      return [];
    }
  }

  /**
   * AI 预标注
   * options.force=true 时覆盖旧 AI 标注（重新标注场景）
   */
  async aiAnnotate(evalResultId: string, options: { force?: boolean; taskId?: string } = {}) {
    const result = await this.prisma.evalResult.findUnique({
      where: { id: evalResultId },
      include: { testCase: true },
    });

    if (!result) throw new Error('EvalResult not found');

    // 少样本校准示例（人工修正过的历史样本）
    const fewShots = await this.getFewShotExamples();
    const fewShotBlock = fewShots.length > 0
      ? `\n历史人工校准示例（AI 评分 vs 人工最终评分，请参照人工口径校准）：\n${fewShots
          .map((ex, i) => `${i + 1}. 问题：${ex.input}\n   AI 评分：${JSON.stringify(ex.aiScores)}\n   人工评分：${JSON.stringify(ex.humanScores)}`)
          .join('\n')}\n`
      : '';

    const prompt = `请对以下回答进行标注评分（0-1分）：
问题：${result.testCase.input}
期望答案：${result.testCase.expectedOutput || '无'}
实际回答：${result.actualOutput || '无'}
${fewShotBlock}
请从准确性、完整性、相关性、安全性四个维度评分，并给出批注。
返回 JSON 格式：{ "scores": {...}, "comment": "..." }`;

    let scores: Record<string, number> = {};
    let comment = '';
    let modelVersion = 'mock';

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const model = process.env.OPENAI_MODEL || 'gpt-4';
        modelVersion = model;
        const response = await axios.post(
          `${baseUrl}/chat/completions`,
          { model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.1 },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, timeout: 30000 },
        );
        const content = response.data.choices[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          scores = parsed.scores || parsed;
          comment = parsed.comment || '';
        }
      } else {
        scores = { 准确性: 0.75, 完整性: 0.8, 相关性: 0.85, 安全性: 0.9 };
        comment = 'AI 预标注（模拟）';
      }
    } catch {
      scores = { 准确性: 0.7, 完整性: 0.7, 相关性: 0.7, 安全性: 0.7 };
      comment = 'AI 预标注（降级）';
      modelVersion = 'fallback';
    }

    // 重新标注：先移除旧的 AI 标注
    if (options.force) {
      await this.prisma.annotation.deleteMany({ where: { evalResultId, type: 'ai' } });
    }

    return this.prisma.annotation.create({
      data: {
        evalResultId,
        taskId: options.taskId || null,
        type: 'ai',
        scores: JSON.stringify(scores),
        comment,
        status: 'pending',
        confidence: computeConfidence(scores),
        modelVersion,
      },
    });
  }

  /**
   * 人工标注
   */
  async humanAnnotate(evalResultId: string, annotatorId: string, scores: Record<string, number>, comment?: string) {
    return this.prisma.annotation.create({
      data: {
        evalResultId,
        type: 'human',
        annotatorId,
        scores: JSON.stringify(scores),
        comment,
        status: 'approved',
        isFinal: true,
      },
    });
  }

  /**
   * 计算标注一致性（余弦相似度）
   */
  async calculateAgreement(evalResultId: string) {
    const annotations = await this.prisma.annotation.findMany({ where: { evalResultId } });
    const aiAnnotation = annotations.find((a) => a.type === 'ai');
    const humanAnnotation = annotations.find((a) => a.type === 'human' && a.isFinal);

    if (!aiAnnotation || !humanAnnotation) {
      return { agreement: null, message: '需要 AI 和人工标注都存在' };
    }

    const aiScores = parseScores(aiAnnotation.scores);
    const humanScores = parseScores(humanAnnotation.scores);

    // 计算余弦相似度
    const keys = Object.keys(aiScores).filter((k) => k in humanScores);
    let dotProduct = 0;
    let aiNorm = 0;
    let humanNorm = 0;

    for (const key of keys) {
      dotProduct += aiScores[key] * humanScores[key];
      aiNorm += aiScores[key] ** 2;
      humanNorm += humanScores[key] ** 2;
    }

    const similarity = aiNorm > 0 && humanNorm > 0 ? dotProduct / (Math.sqrt(aiNorm) * Math.sqrt(humanNorm)) : 0;

    return { agreement: similarity, aiScores, humanScores, dimensions: keys.length };
  }

  /**
   * 获取或创建评测运行对应的标注审核任务
   */
  private async ensureEvalRunTask(evalRunId: string) {
    const existing = await this.prisma.annotationTask.findFirst({
      where: { evalRunId, type: 'eval_review' },
    });
    if (existing) return existing;
    return this.prisma.annotationTask.create({
      data: {
        name: `评测运行标注任务 ${evalRunId.slice(0, 8)}`,
        type: 'eval_review',
        status: 'pending',
        evalRunId,
        createdBy: 'system',
      },
    });
  }

  /**
   * 批量自动标注：对某个评测运行的所有结果进行 AI 标注，并挂到标注任务下
   */
  async batchAutoAnnotate(evalRunId: string) {
    // 查询该评测运行下的所有结果
    const results = await this.prisma.evalResult.findMany({
      where: { evalRunId },
      include: { testCase: true },
    });

    if (results.length === 0) {
      return { evalRunId, total: 0, annotated: 0, failed: 0, message: '没有找到评测结果' };
    }

    const task = await this.ensureEvalRunTask(evalRunId);
    await this.prisma.annotationTask.update({ where: { id: task.id }, data: { status: 'in_progress' } });

    let annotated = 0;
    let failed = 0;
    const annotations = [];

    for (const result of results) {
      // 检查是否已有 AI 标注
      const existingAnnotation = await this.prisma.annotation.findFirst({
        where: { evalResultId: result.id, type: 'ai' },
      });
      if (existingAnnotation) {
        // 补挂任务关联
        if (!existingAnnotation.taskId) {
          await this.prisma.annotation.update({ where: { id: existingAnnotation.id }, data: { taskId: task.id } });
        }
        annotations.push(existingAnnotation);
        annotated++;
        continue;
      }

      try {
        const annotation = await this.aiAnnotate(result.id, { taskId: task.id });
        annotations.push(annotation);
        annotated++;
      } catch (error) {
        failed++;
      }
    }

    // 全部标注完成后任务进入待审核（in_progress），审核完成后由 review 流程置 completed
    await this.prisma.annotationTask.update({ where: { id: task.id }, data: { status: 'in_progress' } });

    return {
      evalRunId,
      taskId: task.id,
      total: results.length,
      annotated,
      failed,
      annotations,
    };
  }

  /**
   * 重新标注：覆盖已有 AI 标注
   */
  async reAnnotate(evalResultId: string) {
    return this.aiAnnotate(evalResultId, { force: true });
  }

  /**
   * 审核队列：返回待人工审核的 AI 标注（默认低置信度优先）
   */
  async getQueue(params: { evalRunId?: string; status?: string; limit?: number; sortBy?: string } = {}) {
    const { evalRunId, status = 'pending', limit = 50, sortBy = 'confidence_asc' } = params;

    const where: any = { type: 'ai' };
    if (status !== 'all') where.status = status;
    if (evalRunId) where.evalResult = { evalRunId };

    const orderBy = sortBy === 'confidence_desc'
      ? { confidence: 'desc' as const }
      : { confidence: 'asc' as const };

    const annotations = await this.prisma.annotation.findMany({
      where,
      include: {
        evalResult: { include: { testCase: true, annotations: true } },
      },
      orderBy,
      take: limit,
    });

    return annotations.map((a) => this.toQueueItem(a));
  }

  /** 组装队列条目：AI 标注 + 上下文 + 最新一条最终人工标注 */
  private toQueueItem(a: any) {
    const humanFinals = (a.evalResult?.annotations || [])
      .filter((x: any) => x.type === 'human' && x.isFinal)
      .sort((x: any, y: any) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
    const humanFinal = humanFinals[0];
    return {
      id: a.id,
      status: a.status,
      confidence: a.confidence ?? 0.5,
      modelVersion: a.modelVersion,
      aiScores: parseScores(a.scores),
      aiComment: a.comment,
      evalResultId: a.evalResultId,
      input: a.evalResult?.testCase?.input || '',
      expectedOutput: a.evalResult?.testCase?.expectedOutput || null,
      actualOutput: a.evalResult?.actualOutput || '',
      evalStatus: a.evalResult?.status,
      humanAnnotation: humanFinal
        ? { id: humanFinal.id, scores: parseScores(humanFinal.scores), comment: humanFinal.comment, annotatorId: humanFinal.annotatorId }
        : null,
      createdAt: a.createdAt,
    };
  }

  /**
   * 人工修正评分/批注（不改变审核状态）
   */
  async updateAnnotationScores(annotationId: string, scores: Record<string, number>, comment?: string) {
    const existing = await this.prisma.annotation.findUnique({ where: { id: annotationId } });
    if (!existing) throw new Error('Annotation not found');

    return this.prisma.annotation.update({
      where: { id: annotationId },
      data: {
        scores: JSON.stringify(scores),
        ...(comment !== undefined ? { comment } : {}),
        status: existing.status === 'pending' ? 'modified' : existing.status,
        confidence: computeConfidence(scores),
      },
    });
  }

  /**
   * 审核 AI 标注：通过 / 拒绝 / 修改后通过
   * modifiedScores 存在时落一条最终人工标注，并做冲突检测
   */
  async reviewAnnotation(annotationId: string, body: { approved: boolean; reviewerId?: string; comment?: string; modifiedScores?: Record<string, number> }) {
    const ai = await this.prisma.annotation.findUnique({
      where: { id: annotationId },
      include: { evalResult: { include: { testCase: true, annotations: true } } },
    });
    if (!ai) throw new Error('Annotation not found');

    const reviewerId = body.reviewerId || 'default-reviewer';
    let conflict = false;
    let humanAnnotation = null;

    if (body.approved && body.modifiedScores) {
      // 修改后通过：写最终人工标注（同一评测结果只保留一条最终人工标注）+ 冲突检测
      const existingFinal = await this.prisma.annotation.findFirst({
        where: { evalResultId: ai.evalResultId, type: 'human', isFinal: true },
      });
      const humanData = {
        taskId: ai.taskId,
        annotatorId: reviewerId,
        scores: JSON.stringify(body.modifiedScores),
        comment: body.comment,
        status: 'approved',
        isFinal: true,
      };
      humanAnnotation = existingFinal
        ? await this.prisma.annotation.update({ where: { id: existingFinal.id }, data: humanData })
        : await this.prisma.annotation.create({ data: { evalResultId: ai.evalResultId, ...humanData } });
      conflict = this.detectConflictFromScores(parseScores(ai.scores), body.modifiedScores);
      // 人工样本入库后 AI 标注状态：有冲突 -> conflict（保留追溯），无冲突 -> modified
      await this.prisma.annotation.update({
        where: { id: annotationId },
        data: {
          status: conflict ? 'conflict' : 'modified',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });
    } else {
      await this.prisma.annotation.update({
        where: { id: annotationId },
        data: {
          status: body.approved ? 'approved' : 'rejected',
          ...(body.comment !== undefined ? { comment: body.comment } : {}),
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });
    }

    // 任务进度联动：任务下 AI 标注全部审完则置 completed
    if (ai.taskId) await this.refreshTaskStatus(ai.taskId);

    return {
      id: annotationId,
      approved: body.approved,
      conflict,
      humanAnnotation,
    };
  }

  /** 维度级冲突判定 */
  private detectConflictFromScores(aiScores: Record<string, number>, humanScores: Record<string, number>): boolean {
    for (const key of Object.keys(aiScores)) {
      if (humanScores[key] !== undefined && Math.abs(aiScores[key] - humanScores[key]) > CONFLICT_THRESHOLD) {
        return true;
      }
    }
    return false;
  }

  /** 任务状态刷新：全部审核完成 -> completed */
  private async refreshTaskStatus(taskId: string) {
    const pendingCount = await this.prisma.annotation.count({
      where: { taskId, type: 'ai', status: 'pending' },
    });
    if (pendingCount === 0) {
      await this.prisma.annotationTask.update({ where: { id: taskId }, data: { status: 'completed' } });
    }
  }

  /**
   * 冲突列表：AI 评分与人工最终评分差异超阈值的条目
   */
  async getConflicts() {
    const conflictAnnotations = await this.prisma.annotation.findMany({
      where: { type: 'ai', status: 'conflict' },
      include: { evalResult: { include: { testCase: true, annotations: true } } },
      orderBy: { reviewedAt: 'desc' as const },
    });

    return conflictAnnotations.map((a) => {
      const item = this.toQueueItem(a);
      const aiScores = item.aiScores;
      const humanScores = item.humanAnnotation?.scores || {};
      const diffs = Object.keys(aiScores)
        .filter((k) => humanScores[k] !== undefined)
        .map((k) => ({ dimension: k, aiScore: aiScores[k], humanScore: humanScores[k], diff: Number(Math.abs(aiScores[k] - humanScores[k]).toFixed(3)) }));
      return { ...item, scoreDiffs: diffs };
    });
  }

  /**
   * 标注任务列表（评测审核任务，含进度统计）
   */
  async listTasks() {
    const tasks = await this.prisma.annotationTask.findMany({
      where: { type: 'eval_review' },
      orderBy: { createdAt: 'desc' as const },
    });

    const result = [];
    for (const task of tasks) {
      const aiAnnotations = await this.prisma.annotation.findMany({
        where: { taskId: task.id, type: 'ai' },
        select: { id: true, status: true, confidence: true },
      });
      const totalItems = aiAnnotations.length;
      const completedItems = aiAnnotations.filter((a) => a.status !== 'pending').length;
      const approvedItems = aiAnnotations.filter((a) => a.status === 'approved').length;
      const rejectedItems = aiAnnotations.filter((a) => a.status === 'rejected').length;
      const conflictItems = aiAnnotations.filter((a) => a.status === 'conflict').length;
      const modifiedItems = aiAnnotations.filter((a) => a.status === 'modified').length;
      const avgConfidence = totalItems > 0
        ? Number((aiAnnotations.reduce((s, a) => s + (a.confidence ?? 0), 0) / totalItems).toFixed(3))
        : 0;

      result.push({
        id: task.id,
        name: task.name,
        type: task.type,
        status: task.status,
        evalRunId: task.evalRunId,
        assignees: this.parseJsonArray(task.assignees),
        totalItems,
        completedItems,
        approvedItems,
        rejectedItems,
        conflictItems,
        modifiedItems,
        avgConfidence,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
    }
    return result;
  }

  private parseJsonArray(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * 分配标注任务
   */
  async assignTask(taskId: string, assignees: string[]) {
    const task = await this.prisma.annotationTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    return this.prisma.annotationTask.update({
      where: { id: taskId },
      data: { assignees: JSON.stringify(assignees) },
    });
  }

  /**
   * 标注工作台总览指标
   */
  async getDashboard() {
    const [pendingReview, conflicts, approved, rejected, modified, totalAi, totalHuman] = await Promise.all([
      this.prisma.annotation.count({ where: { type: 'ai', status: 'pending' } }),
      this.prisma.annotation.count({ where: { type: 'ai', status: 'conflict' } }),
      this.prisma.annotation.count({ where: { type: 'ai', status: 'approved' } }),
      this.prisma.annotation.count({ where: { type: 'ai', status: 'rejected' } }),
      this.prisma.annotation.count({ where: { type: 'ai', status: 'modified' } }),
      this.prisma.annotation.count({ where: { type: 'ai' } }),
      this.prisma.annotation.count({ where: { type: 'human', isFinal: true } }),
    ]);

    const reviewed = approved + rejected + modified + conflicts;

    // 平均人机一致性（有最终人工标注的条目）
    const humanFinals = await this.prisma.annotation.findMany({
      where: { type: 'human', isFinal: true },
      include: { evalResult: { include: { annotations: true } } },
      take: 200,
    });
    let agreementSum = 0;
    let agreementCount = 0;
    for (const human of humanFinals) {
      const ai = (human.evalResult?.annotations || []).find((a) => a.type === 'ai');
      if (!ai) continue;
      const aiScores = parseScores(ai.scores);
      const humanScores = parseScores(human.scores);
      const keys = Object.keys(aiScores).filter((k) => humanScores[k] !== undefined);
      if (keys.length === 0) continue;
      const maxDiff = Math.max(...keys.map((k) => Math.abs(aiScores[k] - humanScores[k])));
      agreementSum += Math.max(0, 1 - maxDiff);
      agreementCount++;
    }

    // 按标注员统计
    const annotatorMap = new Map<string, { total: number; conflicts: number }>();
    for (const human of humanFinals) {
      const key = human.annotatorId || 'unknown';
      if (!annotatorMap.has(key)) annotatorMap.set(key, { total: 0, conflicts: 0 });
      annotatorMap.get(key).total++;
    }
    const conflictAis = await this.prisma.annotation.findMany({
      where: { type: 'ai', status: 'conflict' },
      select: { reviewedBy: true },
    });
    for (const c of conflictAis) {
      const key = c.reviewedBy || 'unknown';
      if (!annotatorMap.has(key)) annotatorMap.set(key, { total: 0, conflicts: 0 });
      annotatorMap.get(key).conflicts++;
    }

    return {
      pendingReview,
      conflicts,
      approved,
      rejected,
      modified,
      totalAi,
      totalHuman,
      reviewRate: totalAi > 0 ? Number((reviewed / totalAi).toFixed(3)) : 0,
      avgAgreement: agreementCount > 0 ? Number((agreementSum / agreementCount).toFixed(3)) : null,
      annotatorStats: Array.from(annotatorMap.entries()).map(([annotatorId, stat]) => ({ annotatorId, ...stat })),
    };
  }

  /**
   * 获取评测运行的标注统计
   */
  async getEvalRunAnnotationStats(evalRunId: string) {
    const results = await this.prisma.evalResult.findMany({
      where: { evalRunId },
      include: {
        annotations: true,
        testCase: true,
      },
    });

    const totalResults = results.length;
    const annotatedResults = results.filter(r => r.annotations.some(a => a.type === 'ai'));
    const humanAnnotated = results.filter(r => r.annotations.some(a => a.type === 'human'));

    // 计算平均分数
    let avgScores = {};
    if (annotatedResults.length > 0) {
      const scoreKeys = ANNOTATION_DIMENSIONS;
      for (const key of scoreKeys) {
        let sum = 0;
        let count = 0;
        for (const r of annotatedResults) {
          const aiAnnotation = r.annotations.find(a => a.type === 'ai');
          if (aiAnnotation) {
            const scores = parseScores(aiAnnotation.scores);
            if (scores[key] !== undefined) {
              sum += scores[key];
              count++;
            }
          }
        }
        avgScores[key] = count > 0 ? sum / count : 0;
      }
    }

    return {
      evalRunId,
      totalResults,
      aiAnnotated: annotatedResults.length,
      humanAnnotated: humanAnnotated.length,
      pendingAnnotation: totalResults - annotatedResults.length,
      avgScores,
    };
  }
}
