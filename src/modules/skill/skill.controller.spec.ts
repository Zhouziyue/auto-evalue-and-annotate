// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';

describe('SkillController', () => {
  let controller: SkillController;
  let service: SkillService;

  const mockSkillService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillController],
      providers: [
        { provide: SkillService, useValue: mockSkillService },
      ],
    }).compile();

    controller = module.get<SkillController>(SkillController);
    service = module.get<SkillService>(SkillService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该调用 service.create 并返回结果', async () => {
      const dto = { name: '测试技能', description: '描述', version: '1.0.0' };
      const expectedResult = { id: 'test-id', ...dto };
      mockSkillService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(result).toEqual(expectedResult);
      expect(mockSkillService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('应该调用 service.findAll 并返回技能列表', async () => {
      const mockSkills = [{ id: '1', name: '技能1' }, { id: '2', name: '技能2' }];
      mockSkillService.findAll.mockResolvedValue(mockSkills);

      const result = await controller.findAll();

      expect(result).toEqual(mockSkills);
      expect(mockSkillService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('应该调用 service.findOne 并返回技能详情', async () => {
      const mockSkill = { id: 'test-id', name: '测试技能' };
      mockSkillService.findOne.mockResolvedValue(mockSkill);

      const result = await controller.findOne('test-id');

      expect(result).toEqual(mockSkill);
      expect(mockSkillService.findOne).toHaveBeenCalledWith('test-id');
    });
  });

  describe('update', () => {
    it('应该调用 service.update 并返回更新结果', async () => {
      const dto = { name: '更新后的名称' };
      const expectedResult = { id: 'test-id', ...dto };
      mockSkillService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('test-id', dto);

      expect(result).toEqual(expectedResult);
      expect(mockSkillService.update).toHaveBeenCalledWith('test-id', dto);
    });
  });

  describe('remove', () => {
    it('应该调用 service.remove 并返回删除结果', async () => {
      const expectedResult = { id: 'test-id' };
      mockSkillService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('test-id');

      expect(result).toEqual(expectedResult);
      expect(mockSkillService.remove).toHaveBeenCalledWith('test-id');
    });
  });

  describe('getStats', () => {
    it('应该调用 service.getStats 并返回统计信息', async () => {
      const mockStats = {
        skillId: 'test-id',
        skillName: '测试技能',
        totalEndpoints: 2,
        totalRuns: 5,
      };
      mockSkillService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats('test-id');

      expect(result).toEqual(mockStats);
      expect(mockSkillService.getStats).toHaveBeenCalledWith('test-id');
    });
  });
});
