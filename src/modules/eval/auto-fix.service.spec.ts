// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AutoFixService, FixActionType } from './auto-fix.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AutoFixService', () => {
  let service: AutoFixService;

  const mockPrisma = {
    evalRun: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoFixService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AutoFixService>(AutoFixService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFixPlan', () => {
    it('should generate fix plans based on eval results', async () => {
      const mockEvalRun = {
        id: 'eval-1',
        results: [
          {
            id: 'r1', status: 'failed',
            scores: { '安全性': 0.3, '忠实度': 0.4, '完整性': 0.35 },
            testCase: { input: '测试问题' },
          },
        ],
      };
      mockPrisma.evalRun.findUnique.mockResolvedValue(mockEvalRun);

      const result = await service.generateFixPlan('eval-1');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].fixAction).toBeDefined();
      expect(result[0].status).toBe('pending');
    });

    it('should throw NotFoundException for missing eval run', async () => {
      mockPrisma.evalRun.findUnique.mockResolvedValue(null);
      await expect(service.generateFixPlan('nonexistent')).rejects.toThrow();
    });
  });

  describe('applyFix', () => {
    it('should apply fix and return result', async () => {
      const result = await service.applyFix('fix-1');
      expect(result).toBeDefined();
      expect(result.status).toBe('applied');
    });
  });

  describe('verifyFix', () => {
    it('should verify fix and return improvement', async () => {
      const mockEvalRun = {
        id: 'eval-1',
        results: [
          { id: 'r1', status: 'passed' },
          { id: 'r2', status: 'failed' },
        ],
      };
      mockPrisma.evalRun.findUnique.mockResolvedValue(mockEvalRun);

      const result = await service.verifyFix('eval-1', 'fix-1');
      expect(result).toBeDefined();
      expect(result.beforePassRate).toBeDefined();
      expect(result.afterPassRate).toBeDefined();
      expect(result.improvement).toBeDefined();
      expect(result.verdict).toBeTruthy();
    });
  });
});
