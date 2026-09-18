// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// Mock axios
jest.mock('axios', () => ({
  default: { post: jest.fn() },
  post: jest.fn(),
}));

describe('ReportService', () => {
  let service: ReportService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      evalRun: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      skill: {
        count: jest.fn(),
      },
      dataset: {
        count: jest.fn(),
      },
      testCase: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('EvalRun 不存在时抛出异常', async () => {
      prisma.evalRun.findUnique.mockResolvedValue(null);

      await expect(service.generateReport('nonexistent')).rejects.toThrow('EvalRun not found');
    });

    it('生成评测报告', async () => {
      const evalRun = {
        id: 'run-1',
        startTime: new Date(),
        endTime: new Date(),
        skill: { id: 's-1', name: 'skill1' },
        endpoint: { id: 'ep-1', name: 'endpoint1' },
        results: [
          {
            id: 'er-1',
            status: 'passed',
            actualOutput: 'answer1',
            scores: { accuracy: 0.9, relevance: 0.85 },
            metrics: { totalLatency: 200 },
            testCase: { input: 'q1', expectedOutput: 'a1' },
            annotations: [],
          },
          {
            id: 'er-2',
            status: 'failed',
            actualOutput: 'wrong',
            scores: { accuracy: 0.3, relevance: 0.4 },
            metrics: { totalLatency: 150 },
            testCase: { input: 'q2', expectedOutput: 'a2' },
            annotations: [],
          },
        ],
      };
      prisma.evalRun.findUnique.mockResolvedValue(evalRun);

      const result = await service.generateReport('run-1');

      expect(result.evalRunId).toBe('run-1');
      expect(result.skillName).toBe('skill1');
      expect(result.endpointName).toBe('endpoint1');
      expect(result.totalCases).toBe(2);
      expect(result.passedCases).toBe(1);
      expect(result.failedCases).toBe(1);
      expect(result.passRate).toBe(0.5);
      expect(result.avgScores.accuracy).toBe(0.6);
      expect(result.avgScores.relevance).toBe(0.625);
      expect(result.avgLatency).toBe(175);
      expect(result.badCases).toHaveLength(1);
      expect(result.badCases[0].input).toBe('q2');
    });

    it('生成报告 - 无结果', async () => {
      const evalRun = {
        id: 'run-1',
        startTime: null,
        endTime: null,
        skill: { name: 'skill1' },
        endpoint: { name: 'endpoint1' },
        results: [],
      };
      prisma.evalRun.findUnique.mockResolvedValue(evalRun);

      const result = await service.generateReport('run-1');

      expect(result.totalCases).toBe(0);
      expect(result.passRate).toBe(0);
      expect(result.badCases).toHaveLength(0);
    });
  });

  describe('aiAnalysis', () => {
    it('无 API Key 时返回降级分析', async () => {
      const evalRun = {
        id: 'run-1',
        startTime: null,
        endTime: null,
        skill: { name: 'skill1' },
        endpoint: { name: 'endpoint1' },
        results: [
          {
            id: 'er-1',
            status: 'passed',
            actualOutput: 'a1',
            scores: { accuracy: 0.9 },
            metrics: { totalLatency: 100 },
            testCase: { input: 'q1', expectedOutput: 'a1' },
            annotations: [],
          },
        ],
      };
      prisma.evalRun.findUnique.mockResolvedValue(evalRun);

      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const result = await service.aiAnalysis('run-1');

      expect(result.analysis).toContain('100.0%');
      expect(result.report).toBeDefined();

      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('getDashboard', () => {
    it('获取看板数据', async () => {
      const recentRuns = [
        { id: 'run-1', status: 'completed', totalCases: 10, passedCases: 8, createdAt: new Date(), skill: { name: 'skill1' } },
        { id: 'run-2', status: 'running', totalCases: 5, passedCases: 0, createdAt: new Date(), skill: { name: 'skill2' } },
      ];
      prisma.evalRun.findMany.mockResolvedValue(recentRuns);
      prisma.skill.count.mockResolvedValue(5);
      prisma.dataset.count.mockResolvedValue(3);
      prisma.testCase.count.mockResolvedValue(100);

      const result = await service.getDashboard();

      expect(result.overview.totalSkills).toBe(5);
      expect(result.overview.totalDatasets).toBe(3);
      expect(result.overview.totalTestCases).toBe(100);
      expect(result.overview.recentRuns).toBe(2);
      expect(result.recentRuns).toHaveLength(2);
      expect(result.recentRuns[0].skillName).toBe('skill1');
      expect(result.recentRuns[0].passRate).toBe(0.8);
    });
  });
});
