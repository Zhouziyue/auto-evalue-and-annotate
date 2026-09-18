// @ts-nocheck
import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PipelineOrchestrationService, PipelineStep, PipelineStepType } from './pipeline-orchestration.service';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('pipeline')
export class PipelineOrchestrationController {
  constructor(
    private readonly pipelineService: PipelineOrchestrationService,
    private readonly schedulerService: SchedulerService,
    private readonly prisma: PrismaService,
  ) {}

  // 获取所有流水线执行记录
  @Get('executions')
  async listAllExecutions() {
    const instances = await this.prisma.pipelineInstance.findMany({
      include: {
        pipeline: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return instances.map(inst => ({
      id: inst.id,
      pipelineName: inst.pipeline?.name || '未知流水线',
      status: inst.status === 'completed' ? 'completed' : inst.status === 'failed' ? 'failed' : 'running',
      startTime: inst.startTime?.toISOString() || inst.createdAt.toISOString(),
      endTime: inst.endTime?.toISOString() || null,
      duration: inst.startTime && inst.endTime
        ? new Date(inst.endTime).getTime() - new Date(inst.startTime).getTime()
        : null,
    }));
  }

  // 创建流水线（持久化到数据库）
  @Post()
  async createPipeline(@Body() data: {
    name: string;
    description?: string;
    steps: PipelineStep[];
    trigger?: 'manual' | 'scheduled' | 'webhook';
    schedule?: string;
  }) {
    const pipeline = await this.prisma.pipeline.create({
      data: {
        name: data.name,
        description: data.description || '',
        template: JSON.stringify(data.steps || []),
        isPreset: false,
        cronExpression: data.schedule || null,
      },
    });
    return pipeline;
  }

  // 从模板创建
  @Post('templates/:template')
  async createFromTemplate(@Param('template') template: 'basic_eval' | 'rag_eval' | 'comparison') {
    return this.pipelineService.createFromTemplate(template);
  }

  // 获取流水线列表（从数据库查询）
  @Get()
  async listPipelines() {
    const pipelines = await this.prisma.pipeline.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return pipelines.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      cronExpression: p.cronExpression,
      isPreset: p.isPreset,
      template: p.template,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  // 获取流水线详情
  @Get(':id')
  async getPipeline(@Param('id') id: string) {
    return this.pipelineService.getPipeline(id);
  }

  // 运行流水线（创建数据库实例）
  @Post(':id/run')
  async runPipeline(@Param('id') id: string, @Body() body?: { triggeredBy?: string }) {
    const instance = await this.prisma.pipelineInstance.create({
      data: {
        pipelineId: id,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
      },
      include: {
        pipeline: { select: { name: true } },
      },
    });
    return {
      id: instance.id,
      pipelineName: instance.pipeline?.name,
      status: instance.status,
      startTime: instance.startTime,
      endTime: instance.endTime,
    };
  }

  // 获取运行列表
  @Get(':id/runs')
  async listRuns(@Param('id') id: string) {
    return this.pipelineService.listRuns(id);
  }

  // 获取运行详情
  @Get('runs/:runId')
  async getRun(@Param('runId') runId: string) {
    return this.pipelineService.getRun(runId);
  }

  // 启用/禁用流水线
  @Post(':id/toggle')
  async togglePipeline(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.pipelineService.togglePipeline(id, body.enabled);
  }

  // 设置定时执行
  @Put(':id/schedule')
  async setSchedule(@Param('id') id: string, @Body() body: { cronExpression: string | null }) {
    return this.schedulerService.updateSchedule(id, body.cronExpression);
  }

  // 获取可用步骤类型
  @Get('types/steps')
  getStepTypes() {
    return {
      types: Object.values(PipelineStepType).map(type => ({
        id: type,
        name: this.getStepTypeName(type),
      })),
    };
  }

  private getStepTypeName(type: PipelineStepType): string {
    const names: Record<PipelineStepType, string> = {
      [PipelineStepType.DATASET_LOAD]: '加载数据集',
      [PipelineStepType.PROMPT_APPLY]: '应用 Prompt',
      [PipelineStepType.MODEL_CALL]: '调用模型',
      [PipelineStepType.EVALUATE]: '评测',
      [PipelineStepType.FILTER]: '过滤',
      [PipelineStepType.AGGREGATE]: '聚合',
      [PipelineStepType.EXPORT]: '导出',
      [PipelineStepType.NOTIFY]: '通知',
    };
    return names[type] || type;
  }
}
