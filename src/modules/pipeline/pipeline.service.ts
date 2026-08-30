import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建流水线
   */
  async create(name: string, description: string, template: Record<string, any>, cronExpression?: string) {
    return this.prisma.pipeline.create({
      data: { name, description, template: template as any, cronExpression },
    });
  }

  /**
   * 获取流水线列表
   */
  async findAll() {
    return this.prisma.pipeline.findMany({ include: { _count: { select: { instances: true } } } });
  }

  /**
   * 执行流水线
   */
  async execute(pipelineId: string, evalRunId?: string) {
    const pipeline = await this.prisma.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new Error('Pipeline not found');

    const instance = await this.prisma.pipelineInstance.create({
      data: {
        pipelineId,
        evalRunId,
        status: 'running',
        startTime: new Date(),
        currentNode: 'start',
      },
    });

    // 异步执行流水线节点
    this.runPipeline(instance.id, pipeline.template as Record<string, any>).catch(console.error);

    return instance;
  }

  /**
   * 执行流水线节点
   */
  private async runPipeline(instanceId: string, template: Record<string, any>) {
    const nodes = template.nodes || [];

    for (const node of nodes) {
      await this.prisma.pipelineInstance.update({
        where: { id: instanceId },
        data: { currentNode: node.id, progress: { currentNode: node.id, status: 'running' } as any },
      });

      // 模拟节点执行
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await this.prisma.pipelineInstance.update({
      where: { id: instanceId },
      data: { status: 'completed', endTime: new Date(), currentNode: 'end' },
    });
  }

  /**
   * 获取流水线实例列表
   */
  async findInstances(pipelineId: string) {
    return this.prisma.pipelineInstance.findMany({
      where: { pipelineId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * 创建预置模板
   */
  async createPresetTemplates() {
    const templates = [
      {
        name: '快速评测',
        description: '执行 -> 规则评测 -> 出报告',
        template: { nodes: [{ id: 'execute', type: 'execute' }, { id: 'eval', type: 'rule_eval' }, { id: 'report', type: 'report' }] },
      },
      {
        name: '完整评测',
        description: '执行 -> 规则评测 -> AI评测 -> 标注 -> 修复 -> 再验证',
        template: {
          nodes: [
            { id: 'execute', type: 'execute' },
            { id: 'rule_eval', type: 'rule_eval' },
            { id: 'ai_eval', type: 'ai_eval' },
            { id: 'annotation', type: 'annotation' },
            { id: 'fix', type: 'fix' },
            { id: 'verify', type: 'verify' },
          ],
        },
      },
      {
        name: '回归评测',
        description: '执行 -> 对比上一版本 -> 告警',
        template: { nodes: [{ id: 'execute', type: 'execute' }, { id: 'compare', type: 'compare' }, { id: 'alert', type: 'alert' }] },
      },
    ];

    for (const t of templates) {
      await this.prisma.pipeline.upsert({
        where: { id: t.name },
        update: {},
        create: { id: t.name, name: t.name, description: t.description, template: t.template as any, isPreset: true },
      });
    }

    return { created: templates.length };
  }
}
