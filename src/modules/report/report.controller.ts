// @ts-nocheck
import { Controller, Get, Post, Body, Param, Query, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { ReportExportService, ReportFormat, ReportData } from './report-export.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportExportService: ReportExportService,
    private readonly prisma: PrismaService,
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
    const reportData = await this.buildReportData(evalRunId);
    return this.reportExportService.exportReport(reportData, body.format);
  }

  // 导出 CSV
  @Get(':id/export/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Param('id') id: string, @Res() res: Response) {
    const reportData = await this.buildReportData(id);
    const result = await this.reportExportService.exportReport(reportData, ReportFormat.CSV);
    // 添加 BOM 以支持 Excel 打开中文
    const bom = '\uFEFF';
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(bom + result.content);
  }

  // 导出 Excel
  @Get(':id/export/excel')
  async exportExcel(@Param('id') id: string, @Res() res: Response) {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '技能评测系统';
    workbook.created = new Date();

    // Sheet 1: 概览
    const summarySheet = workbook.addWorksheet('概览');
    const reportData = await this.buildReportData(id);

    summarySheet.columns = [
      { header: '指标', key: 'metric', width: 20 },
      { header: '值', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: '报告名称', value: reportData.title },
      { metric: '总用例数', value: reportData.summary.totalCases },
      { metric: '通过', value: reportData.summary.passedCases },
      { metric: '失败', value: reportData.summary.failedCases },
      { metric: '通过率', value: `${(reportData.summary.passedCases / reportData.summary.totalCases * 100 || 0).toFixed(1)}%` },
      { metric: '平均分', value: `${(reportData.summary.avgScore * 100).toFixed(1)}%` },
      { metric: '平均延迟', value: `${reportData.summary.avgLatency}ms` },
    ]);

    // 样式
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' },
    };

    // Sheet 2: 指标明细
    const metricsSheet = workbook.addWorksheet('指标明细');
    metricsSheet.columns = [
      { header: '指标', key: 'name', width: 25 },
      { header: '得分', key: 'score', width: 15 },
    ];

    for (const [name, score] of Object.entries(reportData.metrics)) {
      metricsSheet.addRow({ name, score: `${(score * 100).toFixed(1)}%` });
    }
    metricsSheet.getRow(1).font = { bold: true };

    // Sheet 3: 评测明细
    const detailSheet = workbook.addWorksheet('评测明细');
    detailSheet.columns = [
      { header: '#', key: 'index', width: 6 },
      { header: '输入', key: 'input', width: 40 },
      { header: '实际输出', key: 'output', width: 40 },
      { header: '延迟(ms)', key: 'latency', width: 12 },
      { header: '结果', key: 'result', width: 10 },
    ];

    reportData.results.forEach((r, i) => {
      detailSheet.addRow({
        index: i + 1,
        input: r.input.substring(0, 200),
        output: r.actualOutput.substring(0, 200),
        latency: r.latency,
        result: r.passed ? '通过' : '失败',
      });
    });
    detailSheet.getRow(1).font = { bold: true };

    // 导出
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `report_${id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // 构建报告数据
  private async buildReportData(evalRunId: string): Promise<ReportData> {
    const report = await this.reportService.generateReport(evalRunId);
    return {
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
