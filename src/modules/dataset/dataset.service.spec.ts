// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DatasetService } from './dataset.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('DatasetService', () => {
  let service: DatasetService;
  let prisma: any;

  const mockPrisma = {
    dataset: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    testCase: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    datasetSnapshot: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatasetService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DatasetService>(DatasetService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createDataset', () => {
    it('应该成功创建数据集', async () => {
      const dto = { name: '测试数据集', description: '测试描述', category: '测试' };
      const expectedResult = { id: 'dataset-id', ...dto, createdAt: new Date() };

      mockPrisma.dataset.create.mockResolvedValue(expectedResult);

      const result = await service.createDataset(dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrisma.dataset.create).toHaveBeenCalledWith({
        data: { name: dto.name, description: dto.description, category: dto.category },
      });
    });
  });

  describe('findAllDatasets', () => {
    it('应该返回所有数据集及用例计数', async () => {
      const mockDatasets = [
        { id: '1', name: '数据集1', _count: { testCases: 10 } },
        { id: '2', name: '数据集2', _count: { testCases: 5 } },
      ];

      mockPrisma.dataset.findMany.mockResolvedValue(mockDatasets);

      const result = await service.findAllDatasets();

      expect(result).toEqual(mockDatasets);
      expect(mockPrisma.dataset.findMany).toHaveBeenCalledWith({
        where: {},
        include: { _count: { select: { testCases: true } } },
      });
    });

    it('应该支持按分类筛选', async () => {
      mockPrisma.dataset.findMany.mockResolvedValue([]);

      await service.findAllDatasets('客服');

      expect(mockPrisma.dataset.findMany).toHaveBeenCalledWith({
        where: { category: '客服' },
        include: { _count: { select: { testCases: true } } },
      });
    });
  });

  describe('findDataset', () => {
    it('应该返回指定 ID 的数据集详情', async () => {
      const mockDataset = {
        id: 'dataset-id',
        name: '测试数据集',
        testCases: [],
        snapshots: [],
      };

      mockPrisma.dataset.findUnique.mockResolvedValue(mockDataset);

      const result = await service.findDataset('dataset-id');

      expect(result).toEqual(mockDataset);
      expect(mockPrisma.dataset.findUnique).toHaveBeenCalledWith({
        where: { id: 'dataset-id' },
        include: { testCases: true, snapshots: true },
      });
    });

    it('应该在数据集不存在时抛出 NotFoundException', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValue(null);

      await expect(service.findDataset('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDataset', () => {
    it('应该成功更新数据集', async () => {
      const dto = { name: '更新后的名称' };
      const mockUpdated = { id: 'dataset-id', ...dto };

      mockPrisma.dataset.findUnique.mockResolvedValue({ id: 'dataset-id' });
      mockPrisma.dataset.update.mockResolvedValue(mockUpdated);

      const result = await service.updateDataset('dataset-id', dto);

      expect(result).toEqual(mockUpdated);
    });

    it('应该在数据集不存在时抛出 NotFoundException', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValue(null);

      await expect(service.updateDataset('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeDataset', () => {
    it('应该成功删除数据集', async () => {
      const mockDeleted = { id: 'dataset-id', name: '测试数据集' };

      mockPrisma.dataset.findUnique.mockResolvedValue({ id: 'dataset-id' });
      mockPrisma.dataset.delete.mockResolvedValue(mockDeleted);

      const result = await service.removeDataset('dataset-id');

      expect(result).toEqual(mockDeleted);
    });

    it('应该在数据集不存在时抛出 NotFoundException', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValue(null);

      await expect(service.removeDataset('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTestCase', () => {
    it('应该成功创建测试用例', async () => {
      const dto = {
        input: '测试输入',
        expectedOutput: '期望输出',
        difficulty: 'easy',
        tags: ['tag1', 'tag2'],
      };
      const expectedResult = { id: 'case-id', datasetId: 'dataset-id', ...dto };

      mockPrisma.dataset.findUnique.mockResolvedValue({ id: 'dataset-id' });
      mockPrisma.testCase.create.mockResolvedValue(expectedResult);

      const result = await service.createTestCase('dataset-id', dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: {
          datasetId: 'dataset-id',
          input: dto.input,
          expectedOutput: dto.expectedOutput,
          difficulty: 'easy',
          tags: ['tag1', 'tag2'],
        },
      });
    });

    it('应该在未提供难度时使用默认值 medium', async () => {
      const dto = { input: '测试输入', expectedOutput: '期望输出' };

      mockPrisma.dataset.findUnique.mockResolvedValue({ id: 'dataset-id' });
      mockPrisma.testCase.create.mockResolvedValue({ id: 'case-id' });

      await service.createTestCase('dataset-id', dto);

      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ difficulty: 'medium' }),
      });
    });

    it('应该在数据集不存在时抛出 NotFoundException', async () => {
      mockPrisma.dataset.findUnique.mockResolvedValue(null);

      await expect(
        service.createTestCase('non-existent', { input: 'test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTestCases', () => {
    it('应该返回数据集的所有测试用例', async () => {
      const mockCases = [
        { id: '1', input: '输入1' },
        { id: '2', input: '输入2' },
      ];

      mockPrisma.testCase.findMany.mockResolvedValue(mockCases);

      const result = await service.findTestCases('dataset-id');

      expect(result).toEqual(mockCases);
    });

    it('应该支持按难度筛选', async () => {
      mockPrisma.testCase.findMany.mockResolvedValue([]);

      await service.findTestCases('dataset-id', 'hard');

      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith({
        where: { datasetId: 'dataset-id', difficulty: 'hard' },
      });
    });
  });

  describe('importCases', () => {
    it('应该批量导入测试用例', async () => {
      const cases = [
        { input: '输入1', expectedOutput: '输出1' },
        { input: '输入2', expectedOutput: '输出2' },
      ];

      mockPrisma.dataset.findUnique.mockResolvedValue({ id: 'dataset-id' });
      mockPrisma.testCase.create
        .mockResolvedValueOnce({ id: '1', ...cases[0] })
        .mockResolvedValueOnce({ id: '2', ...cases[1] });

      const result = await service.importCases('dataset-id', cases);

      expect(result.imported).toBe(2);
      expect(result.cases).toHaveLength(2);
    });
  });

  describe('exportCases', () => {
    it('应该导出数据集的所有用例', async () => {
      const mockCases = [
        { id: '1', input: '输入1' },
        { id: '2', input: '输入2' },
      ];

      mockPrisma.testCase.findMany.mockResolvedValue(mockCases);

      const result = await service.exportCases('dataset-id');

      expect(result).toEqual(mockCases);
      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith({
        where: { datasetId: 'dataset-id' },
      });
    });
  });

  describe('createSnapshot', () => {
    it('应该创建数据集快照', async () => {
      const mockCases = [{ id: '1', input: '输入1' }];
      const mockSnapshot = { id: 'snapshot-id', datasetId: 'dataset-id', version: 'v1.0' };

      mockPrisma.testCase.findMany.mockResolvedValue(mockCases);
      mockPrisma.datasetSnapshot.create.mockResolvedValue(mockSnapshot);

      const result = await service.createSnapshot('dataset-id', 'v1.0');

      expect(result).toEqual(mockSnapshot);
      expect(mockPrisma.datasetSnapshot.create).toHaveBeenCalledWith({
        data: {
          datasetId: 'dataset-id',
          version: 'v1.0',
          data: mockCases,
        },
      });
    });
  });
});
