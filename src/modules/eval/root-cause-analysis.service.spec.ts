// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { RootCauseAnalysisService, RootCauseType } from './root-cause-analysis.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('RootCauseAnalysisService', () => {
  let service: RootCauseAnalysisService;

  const mockPrisma = {
    evalRun: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RootCauseAnalysisService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RootCauseAnalysisService>(RootCauseAnalysisService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeRootCauses', () => {
    it('should analyze root causes for bad cases', async () => {
      const mockEvalRun = {
        id: 'eval-1',
        results: [
          {
            id: 'r1', status: 'failed', actualOutput: '我不知道',
            scores: { '准确性': 0.2 },
            testCase: { input: '什么是量子计算？', expectedOutput: '量子计算是利用量子力学原理...' },
            annotations: [],
          },
          {
            id: 'r2', status: 'failed', actualOutput: '输出格式错误',
            scores: { '忠实度': 0.3 },
            testCase: { input: '请返回JSON格式', expectedOutput: '{"key":"value"}' },
            annotations: [],
          },
        ],
      };
      mockPrisma.evalRun.findUnique.mockResolvedValue(mockEvalRun);

      const result = await service.analyzeRootCauses('eval-1');

      expect(result).toBeDefined();
      expect(result.evalRunId).toBe('eval-1');
      expect(result.analyzedCases).toBe(2);
      expect(result.rootCauseDistribution.length).toBeGreaterThan(0);
      expect(result.overallSuggestions.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException for missing eval run', async () => {
      mockPrisma.evalRun.findUnique.mockResolvedValue(null);
      await expect(service.analyzeRootCauses('nonexistent')).rejects.toThrow();
    });
  });

  describe('getRootCauseDefinitions', () => {
    it('should return all root cause definitions', () => {
      const defs = service.getRootCauseDefinitions();
      expect(defs.length).toBe(6);
      expect(defs.map(d => d.id)).toContain(RootCauseType.PROMPT_ISSUE);
      expect(defs.map(d => d.id)).toContain(RootCauseType.KNOWLEDGE_MISSING);
    });
  });

  describe('getFixSuggestionTemplates', () => {
    it('should return fix suggestion templates', () => {
      const templates = service.getFixSuggestionTemplates();
      expect(templates).toBeDefined();
      expect(Object.keys(templates).length).toBe(6);
    });
  });
});
