// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { NarrativeReportService } from './narrative-report.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('NarrativeReportService', () => {
  let service: NarrativeReportService;

  const mockPrisma = {
    evalRun: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NarrativeReportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NarrativeReportService>(NarrativeReportService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateNarrativeReport', () => {
    it('should generate narrative report with sections', async () => {
      const mockEvalRun = {
        id: 'eval-1',
        skillName: '测试技能',
        endpointName: '测试端点',
        results: [
          {
            id: 'r1', status: 'passed', actualOutput: '正确答案',
            scores: { '准确性': 0.9, '完整性': 0.85 },
            testCase: { input: '测试问题' },
          },
          {
            id: 'r2', status: 'failed', actualOutput: '错误答案',
            scores: { '准确性': 0.3, '完整性': 0.4 },
            testCase: { input: '困难问题' },
          },
        ],
      };
      mockPrisma.evalRun.findUnique.mockResolvedValue(mockEvalRun);

      const result = await service.generateNarrativeReport('eval-1');

      expect(result).toBeDefined();
      expect(result.evalRunId).toBe('eval-1');
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.fullReport).toBeTruthy();
    });

    it('should throw NotFoundException for missing eval run', async () => {
      mockPrisma.evalRun.findUnique.mockResolvedValue(null);
      await expect(service.generateNarrativeReport('nonexistent')).rejects.toThrow();
    });
  });
});
