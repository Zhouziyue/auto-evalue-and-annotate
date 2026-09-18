// @ts-nocheck
import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnnotationConsistencyService } from './annotation-consistency.service';

@Controller('annotation')
export class AnnotationConsistencyController {
  constructor(
    private readonly consistencyService: AnnotationConsistencyService,
  ) {}

  // 生成一致性报告
  @Get('consistency/:datasetId')
  async getConsistencyReport(@Param('datasetId') datasetId: string) {
    return this.consistencyService.generateConsistencyReport(datasetId);
  }

  // 获取标注统计
  @Get('stats/:datasetId')
  async getAnnotationStats(@Param('datasetId') datasetId: string) {
    return this.consistencyService.getAnnotationStats(datasetId);
  }
}
