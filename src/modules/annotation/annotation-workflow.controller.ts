// @ts-nocheck
import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnnotationService } from './annotation.service';

/**
 * 标注工作流 API：审核队列 / 人工修正 / 审核 / 冲突 / 任务分配 / 看板
 */
@ApiTags('标注工作流')
@Controller('annotation')
export class AnnotationWorkflowController {
  constructor(private readonly annotationService: AnnotationService) {}

  // 工作台总览指标
  @Get('dashboard')
  @ApiOperation({ summary: '标注工作台总览指标' })
  async getDashboard() {
    return this.annotationService.getDashboard();
  }

  // 标注任务列表（评测审核任务，含进度统计）
  @Get('tasks')
  @ApiOperation({ summary: '标注任务列表' })
  async listTasks() {
    return this.annotationService.listTasks();
  }

  // 分配标注任务
  @Post('tasks/:id/assign')
  @ApiOperation({ summary: '分配标注任务' })
  async assignTask(@Param('id') id: string, @Body() body: { assignees: string[] }) {
    return this.annotationService.assignTask(id, body.assignees || []);
  }

  // 审核队列（默认低置信度优先）
  @Get('queue')
  @ApiOperation({ summary: '人工审核队列' })
  async getQueue(
    @Query('evalRunId') evalRunId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.annotationService.getQueue({
      evalRunId,
      status,
      limit: limit ? +limit : 50,
      sortBy,
    });
  }

  // 冲突列表（AI 与人工评分差异超阈值）
  @Get('conflicts')
  @ApiOperation({ summary: '标注冲突列表' })
  async getConflicts() {
    return this.annotationService.getConflicts();
  }

  // 人工修正 AI 标注评分/批注
  @Put(':id')
  @ApiOperation({ summary: '人工修正标注评分' })
  async updateAnnotation(
    @Param('id') id: string,
    @Body() body: { scores: Record<string, number>; comment?: string },
  ) {
    return this.annotationService.updateAnnotationScores(id, body.scores, body.comment);
  }

  // 审核 AI 标注：通过 / 拒绝 / 修改后通过
  @Post(':id/review')
  @ApiOperation({ summary: '审核 AI 标注' })
  async reviewAnnotation(
    @Param('id') id: string,
    @Body() body: { approved: boolean; reviewerId?: string; comment?: string; modifiedScores?: Record<string, number> },
  ) {
    return this.annotationService.reviewAnnotation(id, body);
  }

  // 重新标注（覆盖旧 AI 标注）
  @Post('re-annotate/:evalResultId')
  @ApiOperation({ summary: '重新 AI 标注' })
  async reAnnotate(@Param('evalResultId') evalResultId: string) {
    return this.annotationService.reAnnotate(evalResultId);
  }
}
