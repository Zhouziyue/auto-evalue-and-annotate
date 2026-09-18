// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportExportService, ReportFormat } from './report-export.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('ReportController', () => {
  let controller: ReportController;
  let reportService: Partial<Record<keyof ReportService, jest.Mock>>;
  let exportService: Partial<Record<keyof ReportExportService, jest.Mock>>;

  beforeEach(async () => {
    reportService = {
      generateReport: jest.fn(),
      aiAnalysis: jest.fn(),
      getDashboard: jest.fn(),
    };
    exportService = {
      exportReport: jest.fn(),
    };

    const prismaService = {
      report: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      evalResult: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: ReportExportService, useValue: exportService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('generateReport - 生成评测报告', async () => {
    const result = { evalRunId: 'run-1', skillName: 'skill1', totalCases: 10 };
    reportService.generateReport.mockResolvedValue(result);

    expect(await controller.generateReport('run-1')).toEqual(result);
    expect(reportService.generateReport).toHaveBeenCalledWith('run-1');
  });

  it('aiAnalysis - AI 智能分析', async () => {
    const result = { analysis: '分析报告', report: {} };
    reportService.aiAnalysis.mockResolvedValue(result);

    expect(await controller.aiAnalysis('run-1')).toEqual(result);
  });

  it('getDashboard - 看板数据', async () => {
    const result = { overview: { totalSkills: 5 }, recentRuns: [] };
    reportService.getDashboard.mockResolvedValue(result);

    expect(await controller.getDashboard()).toEqual(result);
  });

  it('exportReport - 导出报告', async () => {
    const reportData = {
      skillName: 'skill1',
      endpointName: 'ep1',
      totalCases: 10,
      passedCases: 8,
      failedCases: 2,
      avgScores: { accuracy: 0.85 },
      avgLatency: 200,
      badCases: [{ input: 'q1', expectedOutput: 'a1', actualOutput: 'a2', scores: {} }],
    };
    reportService.generateReport.mockResolvedValue(reportData);

    const exportResult = { format: 'json', content: '{}' };
    exportService.exportReport.mockResolvedValue(exportResult);

    const result = await controller.exportReport('run-1', { format: ReportFormat.JSON });
    expect(result).toEqual(exportResult);
    expect(exportService.exportReport).toHaveBeenCalled();
  });

  it('getExportFormats - 获取导出格式', () => {
    const result = controller.getExportFormats();
    expect(result.formats).toBeDefined();
    expect(result.formats.length).toBe(4);
    expect(result.formats[0]).toHaveProperty('id');
    expect(result.formats[0]).toHaveProperty('name');
    expect(result.formats[0]).toHaveProperty('mimeType');
  });
});
