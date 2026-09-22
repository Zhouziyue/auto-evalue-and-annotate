// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { FailureClusteringService, FailureMode } from './failure-clustering.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('FailureClusteringService', () => {
  let service: FailureClusteringService;
  let prisma: PrismaService;

  const mockPrisma = {
    evalResult: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FailureClusteringService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FailureClusteringService>(FailureClusteringService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeFailures', () => {
    it('should analyze failures and return clustering result', async () => {
      const mockEvalRunId = 'test-eval-run-id';
      const mockFailedResults = [
        {
          id: 'result-1',
          status: 'failed',
          actualOutput: '对不起，我无法理解您的问题',
          scores: { '准确性': 0.3, '完整性': 0.4 },
          testCase: { input: '请帮我查询订单状态' },
          annotations: [],
        },
        {
          id: 'result-2',
          status: 'failed',
          actualOutput: '我不知道这个问题的答案',
          scores: { '准确性': 0.2, '完整性': 0.3 },
          testCase: { input: '什么是量子计算？' },
          annotations: [],
        },
        {
          id: 'result-3',
          status: 'failed',
          actualOutput: '输出格式错误',
          scores: { '准确性': 0.5 },
          testCase: { input: '请返回 JSON 格式' },
          annotations: [{ comment: '格式错误，不是有效的 JSON' }],
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockFailedResults);

      const result = await service.analyzeFailures(mockEvalRunId);

      expect(result).toBeDefined();
      expect(result.evalRunId).toBe(mockEvalRunId);
      expect(result.totalFailures).toBe(3);
      expect(result.modeDistribution).toBeDefined();
      expect(result.topIssues).toBeDefined();
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('should return empty result when no failures', async () => {
      const mockEvalRunId = 'test-eval-run-id';
      mockPrisma.evalResult.findMany.mockResolvedValue([]);

      const result = await service.analyzeFailures(mockEvalRunId);

      expect(result).toBeDefined();
      expect(result.totalFailures).toBe(0);
      expect(result.modeDistribution).toEqual([]);
    });
  });

  describe('getFailureModeDefinitions', () => {
    it('should return all failure mode definitions', () => {
      const definitions = service.getFailureModeDefinitions();

      expect(definitions).toBeDefined();
      expect(definitions.length).toBeGreaterThan(0);
      expect(definitions[0]).toHaveProperty('id');
      expect(definitions[0]).toHaveProperty('name');
      expect(definitions[0]).toHaveProperty('description');
      expect(definitions[0]).toHaveProperty('keywords');
      expect(definitions[0]).toHaveProperty('color');
    });

    it('should include all expected failure modes', () => {
      const definitions = service.getFailureModeDefinitions();
      const modeIds = definitions.map(d => d.id);

      expect(modeIds).toContain(FailureMode.UNDERSTANDING_ERROR);
      expect(modeIds).toContain(FailureMode.KNOWLEDGE_GAP);
      expect(modeIds).toContain(FailureMode.FORMAT_ERROR);
      expect(modeIds).toContain(FailureMode.LOGIC_ERROR);
      expect(modeIds).toContain(FailureMode.SAFETY_ISSUE);
      expect(modeIds).toContain(FailureMode.COMPLETENESS_ISSUE);
      expect(modeIds).toContain(FailureMode.RELEVANCE_ISSUE);
      expect(modeIds).toContain(FailureMode.HALLUCINATION);
      expect(modeIds).toContain(FailureMode.TONE_ISSUE);
      expect(modeIds).toContain(FailureMode.OTHER);
    });
  });
});
