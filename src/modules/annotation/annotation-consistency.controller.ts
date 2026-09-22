// @ts-nocheck
import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnnotationConsistencyService } from './annotation-consistency.service';
import { AnnotationService } from './annotation.service';

@ApiTags('标注管理')
@Controller('annotation')
export class AnnotationConsistencyController {
  constructor(
    private readonly consistencyService: AnnotationConsistencyService,
    private readonly annotationService: AnnotationService,
  ) {}

  // 生成一致性报告
  @Get('consistency/:datasetId')
  @ApiOperation({ summary: '生成标注一致性报告' })
  async getConsistencyReport(@Param('datasetId') datasetId: string) {
    return this.consistencyService.generateConsistencyReport(datasetId);
  }

  // 获取标注统计
  @Get('stats/:datasetId')
  @ApiOperation({ summary: '获取标注统计' })
  async getAnnotationStats(@Param('datasetId') datasetId: string) {
    return this.consistencyService.getAnnotationStats(datasetId);
  }

  // 批量自动标注
  @Post('auto-annotate/:evalRunId')
  @ApiOperation({ summary: '批量自动标注评测结果' })
  async batchAutoAnnotate(@Param('evalRunId') evalRunId: string) {
    return this.annotationService.batchAutoAnnotate(evalRunId);
  }

  // 获取评测运行标注统计
  @Get('eval-stats/:evalRunId')
  @ApiOperation({ summary: '获取评测运行标注统计' })
  async getEvalRunAnnotationStats(@Param('evalRunId') evalRunId: string) {
    return this.annotationService.getEvalRunAnnotationStats(evalRunId);
  }

  // 单条 AI 标注
  @Post('ai-annotate/:evalResultId')
  @ApiOperation({ summary: '单条 AI 标注' })
  async aiAnnotate(@Param('evalResultId') evalResultId: string) {
    return this.annotationService.aiAnnotate(evalResultId);
  }

  // 人工标注
  @Post('human-annotate')
  @ApiOperation({ summary: '人工标注' })
  async humanAnnotate(@Body() body: { evalResultId: string; annotatorId: string; scores: Record<string, number>; comment?: string }) {
    return this.annotationService.humanAnnotate(body.evalResultId, body.annotatorId, body.scores, body.comment);
  }

  // 标注一致性
  @Get('agreement/:evalResultId')
  @ApiOperation({ summary: '计算标注一致性' })
  async calculateAgreement(@Param('evalResultId') evalResultId: string) {
    return this.annotationService.calculateAgreement(evalResultId);
  }
}
