// @ts-nocheck
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PipelineOrchestrationService, PipelineStep, PipelineStepType } from './pipeline-orchestration.service';

@Controller('api/pipeline')
export class PipelineOrchestrationController {
  constructor(
    private readonly pipelineService: PipelineOrchestrationService,
  ) {}

  // 创建流水线
  @Post()
  async createPipeline(@Body() data: {
    name: string;
    description?: string;
    steps: PipelineStep[];
    trigger?: 'manual' | 'scheduled' | 'webhook';
    schedule?: string;
  }) {
    return this.pipelineService.createPipeline(data);
  }

  // 从模板创建
  @Post('templates/:template')
  async createFromTemplate(@Param('template') template: 'basic_eval' | 'rag_eval' | 'comparison') {
    return this.pipelineService.createFromTemplate(template);
  }

  // 获取流水线列表
  @Get()
  async listPipelines() {
    return this.pipelineService.listPipelines();
  }

  // 获取流水线详情
  @Get(':id')
  async getPipeline(@Param('id') id: string) {
    return this.pipelineService.getPipeline(id);
  }

  // 运行流水线
  @Post(':id/run')
  async runPipeline(@Param('id') id: string, @Body() body?: { triggeredBy?: string }) {
    return this.pipelineService.runPipeline(id, body?.triggeredBy);
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
