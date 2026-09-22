// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { CapabilityProfileService, CapabilityDimension } from './capability-profile.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CapabilityProfileService', () => {
  let service: CapabilityProfileService;

  const mockPrisma = {
    evalRun: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CapabilityProfileService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CapabilityProfileService>(CapabilityProfileService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateProfile', () => {
    it('should generate capability profile from eval results', async () => {
      const mockEvalRun = {
        id: 'eval-1',
        skillName: '测试技能',
        endpointName: '测试端点',
        results: [
          {
            id: 'r1', status: 'passed', scores: { '准确性': 0.9, '完整性': 0.85, '相关性': 0.8, '忠实度': 0.75, '安全性': 0.95 },
            testCase: { input: '测试问题', tags: ['language'] },
          },
          {
            id: 'r2', status: 'failed', scores: { '准确性': 0.3, '完整性': 0.4, '相关性': 0.5, '忠实度': 0.35, '安全性': 0.9 },
            testCase: { input: '困难问题', tags: ['reasoning'] },
          },
        ],
      };
      mockPrisma.evalRun.findUnique.mockResolvedValue(mockEvalRun);

      const result = await service.generateProfile('eval-1');

      expect(result).toBeDefined();
      expect(result.evalRunId).toBe('eval-1');
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.dimensions.length).toBeGreaterThan(0);
      expect(result.radarChartData).toBeDefined();
      expect(result.radarChartData.labels.length).toBeGreaterThan(0);
      expect(result.summary).toBeTruthy();
    });

    it('should throw NotFoundException for missing eval run', async () => {
      mockPrisma.evalRun.findUnique.mockResolvedValue(null);
      await expect(service.generateProfile('nonexistent')).rejects.toThrow();
    });
  });

  describe('getCapabilityDefinitions', () => {
    it('should return all capability definitions', () => {
      const defs = service.getCapabilityDefinitions();
      expect(defs.length).toBe(12);
      expect(defs[0]).toHaveProperty('id');
      expect(defs[0]).toHaveProperty('name');
      expect(defs[0]).toHaveProperty('color');
    });
  });
});
