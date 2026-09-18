// @ts-nocheck
import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportExportService, ReportFormat, ReportData } from './report-export.service';

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportExportService: ReportExportService,
  ) {}

  // 生成评测报告
  @Post('generate/:evalRunId')
  async generateReport(@Param('evalRunId') evalRunId: string) {
    return this.reportService.generateReport(evalRunId);
  }

  // AI 智能分析
  @Post('ai-analysis/:evalRunId')
  async aiAnalysis(@Param('evalRunId') evalRunId: string) {
    return this.reportService.aiAnalysis(evalRunId);
  }

  // 看板数据
  @Get('dashboard')
  async getDashboard() {
    return this.reportService.getDashboard();
  }

  // 导出报告
  @Post('export/:evalRunId')
  async exportReport(
    @Param('evalRunId') evalRunId: string,
    @Body() body: { format: ReportFormat },
  ) {
    // 先生成报告数据
    const report = await this.reportService.generateReport(evalRunId);
    
    // 转换为导出格式
    const reportData: ReportData = {
      title: `评测报告 - ${report.skillName}`,
      description: `评测运行 ${evalRunId} 的报告`,
      modelName: report.endpointName,
      runId: evalRunId,
      summary: {
        totalCases: report.totalCases,
        passedCases: report.passedCases,
        failedCases: report.failedCases,
        avgScore: Object.values(report.avgScores).reduce((a, b) => a + b, 0) / Object.values(report.avgScores).length || 0,
        avgLatency: report.avgLatency,
      },
      metrics: report.avgScores,
      results: report.badCases.map(bc => ({
        input: bc.input,
        expectedOutput: bc.expectedOutput,
        actualOutput: bc.actualOutput || '',
        scores: bc.scores || {},
        latency: 0,
        passed: false,
      })),
      createdAt: new Date(),
    };

    return this.reportExportService.exportReport(reportData, body.format);
  }

  // 获取支持的导出格式
  @Get('export/formats')
  getExportFormats() {
    return {
      formats: Object.values(ReportFormat).map(format => ({
        id: format,
        name: this.getFormatName(format),
        mimeType: this.getMimeType(format),
      })),
    };
  }

  private getFormatName(format: ReportFormat): string {
    const names: Record<ReportFormat, string> = {
      [ReportFormat.JSON]: 'JSON',
      [ReportFormat.HTML]: 'HTML 报告',
      [ReportFormat.MARKDOWN]: 'Markdown',
      [ReportFormat.CSV]: 'CSV 表格',
    };
    return names[format] || format;
  }

  private getMimeType(format: ReportFormat): string {
    const types: Record<ReportFormat, string> = {
      [ReportFormat.JSON]: 'application/json',
      [ReportFormat.HTML]: 'text/html',
      [ReportFormat.MARKDOWN]: 'text/markdown',
      [ReportFormat.CSV]: 'text/csv',
    };
    return types[format] || 'application/octet-stream';
  }
}
