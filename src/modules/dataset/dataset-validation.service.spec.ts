// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { DatasetValidationService } from './dataset-validation.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentService } from '../agent/agent.service';

describe('DatasetValidationService', () => {
  let service: DatasetValidationService;

  const mockPrisma = {
    dataset: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    testCase: {
      findMany: jest.fn(),
    },
  };

  const mockAgentService = {
    invoke: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatasetValidationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AgentService, useValue: mockAgentService },
      ],
    }).compile();

    service = module.get<DatasetValidationService>(DatasetValidationService);
    jest.clearAllMocks();
  });

  describe('validateDataset', () => {
    it('应该成功验证数据集', async () => {
      const mockDataset = {
        id: 'ds-1',
        name: '测试数据集',
        testCases: [
          { id: 'tc-1', input: '问题1', expectedOutput: '答案1', difficulty: 'easy' },
          { id: 'tc-2', input: '问题2', expectedOutput: '答案2', difficulty: 'medium' },
        ],
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);
      mockPrisma.dataset.update.mockResolvedValue({});

      const result = await service.validateDataset('ds-1');

      expect(result).toBeDefined();
      expect(result.datasetId).toBe('ds-1');
      expect(result.totalCases).toBe(2);
      expect(result.difficultyDistribution).toBeDefined();
      expect(result.coverageScore).toBeDefined();
      expect(result.discriminationScore).toBeDefined();
      expect(result.overallQuality).toBeDefined();
    });

    it('应该在数据集不存在时抛出异常', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValue(null);

      await expect(service.validateDataset('non-existent')).rejects.toThrow('不存在');
    });

    it('应该在数据集为空时抛出异常', async () => {
      const mockDataset = {
        id: 'ds-1',
        name: '空数据集',
        testCases: [],
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);

      await expect(service.validateDataset('ds-1')).rejects.toThrow('数据集为空');
    });
  });

  describe('approveDataset', () => {
    it('应该成功审批通过数据集', async () => {
      const mockDataset = {
        id: 'ds-1',
        validationReport: JSON.stringify({ overallQuality: 0.8 }),
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);
      mockPrisma.dataset.update.mockResolvedValue({});

      const result = await service.approveDataset('ds-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.dataset.update).toHaveBeenCalledWith({
        where: { id: 'ds-1' },
        data: { validationStatus: 'validated' },
      });
    });

    it('应该在未验证时抛出异常', async () => {
      const mockDataset = {
        id: 'ds-1',
        validationReport: null,
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);

      await expect(service.approveDataset('ds-1')).rejects.toThrow('请先执行验证');
    });
  });

  describe('rejectDataset', () => {
    it('应该成功拒绝数据集', async () => {
      const mockDataset = {
        id: 'ds-1',
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);
      mockPrisma.dataset.update.mockResolvedValue({});

      const result = await service.rejectDataset('ds-1', '质量不达标');

      expect(result.success).toBe(true);
      expect(mockPrisma.dataset.update).toHaveBeenCalledWith({
        where: { id: 'ds-1' },
        data: { validationStatus: 'rejected' },
      });
    });
  });

  describe('getValidationReport', () => {
    it('应该返回验证报告', async () => {
      const mockReport = {
        datasetId: 'ds-1',
        overallQuality: 0.85,
        coverageScore: 0.9,
        discriminationScore: 0.7,
      };

      const mockDataset = {
        id: 'ds-1',
        validationReport: JSON.stringify(mockReport),
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);

      const result = await service.getValidationReport('ds-1');

      expect(result).toEqual(mockReport);
    });

    it('应该在无报告时返回 null', async () => {
      const mockDataset = {
        id: 'ds-1',
        validationReport: null,
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);

      const result = await service.getValidationReport('ds-1');

      expect(result).toBeNull();
    });
  });
});
