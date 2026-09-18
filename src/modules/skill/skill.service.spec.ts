// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SkillService } from './skill.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('SkillService', () => {
  let service: SkillService;
  let prisma: any;

  const mockPrisma = {
    skill: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SkillService>(SkillService);
    prisma = module.get<PrismaService>(PrismaService);

    // 清除所有 mock 调用记录
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建技能', async () => {
      const dto = { name: '测试技能', description: '测试描述', version: '1.0.0' };
      const expectedResult = { id: 'test-id', ...dto, createdAt: new Date(), updatedAt: new Date() };
      
      mockPrisma.skill.create.mockResolvedValue(expectedResult);

      const result = await service.create(dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrisma.skill.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          version: dto.version,
          category: undefined,
          tags: null,
        },
      });
    });

    it('应该在未提供版本时使用默认版本 1.0.0', async () => {
      const dto = { name: '测试技能', description: '测试描述' };
      mockPrisma.skill.create.mockResolvedValue({ id: 'test-id', ...dto, version: '1.0.0' });

      await service.create(dto);

      expect(mockPrisma.skill.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          version: '1.0.0',
          category: undefined,
          tags: null,
        },
      });
    });
  });

  describe('findAll', () => {
    it('应该返回所有技能及其统计信息', async () => {
      const mockSkills = [
        {
          id: '1',
          name: '技能1',
          _count: { endpoints: 2, evalRuns: 5, skillVersions: 3 },
        },
        {
          id: '2',
          name: '技能2',
          _count: { endpoints: 1, evalRuns: 3, skillVersions: 1 },
        },
      ];

      mockPrisma.skill.findMany.mockResolvedValue(mockSkills);

      const result = await service.findAll();

      expect(result).toEqual(mockSkills);
      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              endpoints: true,
              evalRuns: true,
              skillVersions: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('应该在无数据时返回空数组', async () => {
      mockPrisma.skill.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('应该返回指定 ID 的技能详情', async () => {
      const mockSkill = {
        id: 'test-id',
        name: '测试技能',
        endpoints: [],
        evalRuns: [],
        skillVersions: [],
      };

      mockPrisma.skill.findUnique.mockResolvedValue(mockSkill);

      const result = await service.findOne('test-id');

      expect(result).toEqual(mockSkill);
      expect(mockPrisma.skill.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: {
          endpoints: true,
          evalRuns: { orderBy: { createdAt: 'desc' }, take: 10 },
          skillVersions: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    it('应该在技能不存在时抛出 NotFoundException', async () => {
      mockPrisma.skill.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('应该成功更新技能', async () => {
      const dto = { name: '更新后的名称' };
      const mockUpdated = { id: 'test-id', ...dto };

      mockPrisma.skill.findUnique.mockResolvedValue({ id: 'test-id', name: '原名称' });
      mockPrisma.skill.update.mockResolvedValue(mockUpdated);

      const result = await service.update('test-id', dto);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.skill.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: dto,
      });
    });

    it('应该在技能不存在时抛出 NotFoundException', async () => {
      mockPrisma.skill.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('应该成功删除技能', async () => {
      const mockDeleted = { id: 'test-id', name: '测试技能' };

      mockPrisma.skill.findUnique.mockResolvedValue({ id: 'test-id' });
      mockPrisma.skill.delete.mockResolvedValue(mockDeleted);

      const result = await service.remove('test-id');

      expect(result).toEqual(mockDeleted);
      expect(mockPrisma.skill.delete).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });

    it('应该在技能不存在时抛出 NotFoundException', async () => {
      mockPrisma.skill.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('应该返回技能统计信息', async () => {
      const mockSkill = {
        id: 'test-id',
        name: '测试技能',
        version: '1.0.0',
        endpoints: [{ id: 'ep1' }, { id: 'ep2' }],
        evalRuns: [
          { status: 'completed', totalCases: 10, passedCases: 8 },
          { status: 'completed', totalCases: 10, passedCases: 6 },
          { status: 'running', totalCases: 10, passedCases: 0 },
        ],
        skillVersions: [{ id: 'v1' }, { id: 'v2' }],
      };

      mockPrisma.skill.findUnique.mockResolvedValue(mockSkill);

      const result = await service.getStats('test-id');

      expect(result).toEqual({
        skillId: 'test-id',
        skillName: '测试技能',
        totalEndpoints: 2,
        totalRuns: 3,
        completedRuns: 2,
        avgPassRate: 0.7, // (0.8 + 0.6) / 2
        latestVersion: '1.0.0',
        versionCount: 2,
      });
    });
  });
});
