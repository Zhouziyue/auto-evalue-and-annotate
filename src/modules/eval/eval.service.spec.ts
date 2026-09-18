// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { EvalService } from './eval.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('EvalService', () => {
  let service: EvalService;
  let prisma: any;

  const mockPrisma = {
    evalResult: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EvalService>(EvalService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();

    // Mock axios.post for aiEval (LLM calls)
    (mockedAxios as any).post = jest.fn().mockResolvedValue({
      data: {
        choices: [{ message: { content: '{"准确性": 0.8, "完整性": 0.7, "相关性": 0.9, "安全性": 0.95}' } }],
      },
    });
  });

  describe('ruleEval', () => {
    it('应该执行规则评测并返回结果数量', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          actualOutput: '正确答案',
          testCase: {
            input: '问题',
            expectedOutput: '正确答案',
            metadata: null,
          },
        },
        {
          id: '2',
          evalRunId: 'run-1',
          actualOutput: '错误答案',
          testCase: {
            input: '问题2',
            expectedOutput: '正确答案2',
            metadata: null,
          },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      const result = await service.ruleEval('run-1');

      expect(result).toEqual({ evalRunId: 'run-1', type: 'rule', results: 2 });
      expect(mockPrisma.evalResult.findMany).toHaveBeenCalledWith({
        where: { evalRunId: 'run-1' },
        include: { testCase: true },
      });
      // 应该为每个结果更新分数
      expect(mockPrisma.evalResult.update).toHaveBeenCalledTimes(2);
    });

    it('应该正确计算精确匹配分数', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          actualOutput: '完全匹配的答案',
          testCase: {
            input: '问题',
            expectedOutput: '完全匹配的答案',
            metadata: null,
          },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      await service.ruleEval('run-1');

      expect(mockPrisma.evalResult.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { scores: { exactMatch: 1 } },
      });
    });

    it('应该正确计算关键词匹配分数', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          actualOutput: '这个答案包含关键词A和关键词B',
          testCase: {
            input: '问题',
            expectedOutput: null,
            metadata: { keywords: ['关键词A', '关键词B', '关键词C'] },
          },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      await service.ruleEval('run-1');

      expect(mockPrisma.evalResult.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { scores: { keywordMatch: 2 / 3 } }, // 匹配了2/3个关键词
      });
    });

    it('应该正确进行 JSON 格式校验', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          actualOutput: '{"key": "value"}',
          testCase: {
            input: '问题',
            expectedOutput: null,
            metadata: { format: 'json' },
          },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      await service.ruleEval('run-1');

      expect(mockPrisma.evalResult.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { scores: { formatCheck: 1 } },
      });
    });

    it('应该在 JSON 格式错误时返回 0 分', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          actualOutput: '这不是 JSON',
          testCase: {
            input: '问题',
            expectedOutput: null,
            metadata: { format: 'json' },
          },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      await service.ruleEval('run-1');

      expect(mockPrisma.evalResult.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { scores: { formatCheck: 0 } },
      });
    });
  });

  describe('metricsEval', () => {
    it('应该计算延迟相关评分', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          scores: null,
          metrics: { totalLatency: 1000, ttft: 200 },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      const result = await service.metricsEval('run-1');

      expect(result).toEqual({ evalRunId: 'run-1', type: 'metrics', results: 1 });
      expect(mockPrisma.evalResult.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          scores: expect.objectContaining({
            metrics: expect.objectContaining({
              latencyScore: 1, // 1000ms 应该满分
              ttftScore: 1,    // 200ms 应该满分
            }),
          }),
        }),
      });
    });

    it('应该正确处理无指标数据的情况', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          scores: null,
          metrics: null,
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      const result = await service.metricsEval('run-1');

      expect(result).toEqual({ evalRunId: 'run-1', type: 'metrics', results: 1 });
    });
  });

  describe('aiEval', () => {
    it('应该使用默认维度进行 AI 评测', async () => {
      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          actualOutput: 'AI 输出',
          scores: null,
          testCase: {
            input: '问题',
            expectedOutput: '期望',
          },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      const result = await service.aiEval('run-1');

      expect(result.evalRunId).toBe('run-1');
      expect(result.type).toBe('ai');
      expect(result.dimensions).toHaveLength(4); // 默认4个维度
      expect(result.results).toBe(1);
    });

    it('应该支持自定义评测维度', async () => {
      const customDims = [
        { name: '创意性', weight: 0.5 },
        { name: '准确性', weight: 0.5 },
      ];

      const mockResults = [
        {
          id: '1',
          evalRunId: 'run-1',
          actualOutput: 'AI 输出',
          scores: null,
          testCase: {
            input: '问题',
            expectedOutput: '期望',
          },
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.evalResult.update.mockResolvedValue({});

      const result = await service.aiEval('run-1', customDims);

      expect(result.dimensions).toEqual(customDims);
    });
  });
});
