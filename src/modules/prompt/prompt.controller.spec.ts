// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { PromptController } from './prompt.controller';
import { PromptVersionService, PromptVersionStatus } from './prompt-version.service';

describe('PromptController', () => {
  let controller: PromptController;
  let service: Partial<Record<keyof PromptVersionService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      listPrompts: jest.fn(),
      getPrompt: jest.fn(),
      createPrompt: jest.fn(),
      createVersion: jest.fn(),
      getVersions: jest.fn(),
      updateVersionStatus: jest.fn(),
      diffVersions: jest.fn(),
      deletePrompt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromptController],
      providers: [{ provide: PromptVersionService, useValue: service }],
    }).compile();

    controller = module.get<PromptController>(PromptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('listPrompts - 获取 Prompt 列表（默认分页）', async () => {
    const result = [{ id: 'p-1', name: 'prompt1' }];
    service.listPrompts.mockResolvedValue(result);

    expect(await controller.listPrompts()).toEqual(result);
    expect(service.listPrompts).toHaveBeenCalledWith({ limit: 50, offset: 0, category: undefined });
  });

  it('listPrompts - 带分类和分页', async () => {
    const result = [{ id: 'p-1', name: 'prompt1', category: 'chat' }];
    service.listPrompts.mockResolvedValue(result);

    expect(await controller.listPrompts('chat', '10', '5')).toEqual(result);
    expect(service.listPrompts).toHaveBeenCalledWith({ limit: 10, offset: 5, category: 'chat' });
  });

  it('getPrompt - 获取 Prompt 详情', async () => {
    const result = { id: 'p-1', name: 'prompt1' };
    service.getPrompt.mockResolvedValue(result);

    expect(await controller.getPrompt('p-1')).toEqual(result);
  });

  it('createPrompt - 创建 Prompt', async () => {
    const dto = { name: 'new-prompt', content: 'Hello {{input}}', category: 'chat' };
    const result = { id: 'p-1', ...dto };
    service.createPrompt.mockResolvedValue(result);

    expect(await controller.createPrompt(dto)).toEqual(result);
  });

  it('createVersion - 创建新版本', async () => {
    const dto = { content: 'Updated content', commitMessage: 'v2' };
    const result = { id: 'v-2', version: 2, ...dto };
    service.createVersion.mockResolvedValue(result);

    expect(await controller.createVersion('p-1', dto)).toEqual(result);
  });

  it('getVersions - 获取版本列表', async () => {
    const result = [{ id: 'v-1', version: 1 }];
    service.getVersions.mockResolvedValue(result);

    expect(await controller.getVersions('p-1')).toEqual(result);
  });

  it('updateVersionStatus - 更新版本状态', async () => {
    const result = { id: 'v-1', status: PromptVersionStatus.PRODUCTION };
    service.updateVersionStatus.mockResolvedValue(result);

    expect(await controller.updateVersionStatus('p-1', 'v-1', { status: PromptVersionStatus.PRODUCTION })).toEqual(result);
  });

  it('diffVersions - 对比版本', async () => {
    const result = { version1: {}, version2: {}, diff: { added: [], removed: [], modified: [] } };
    service.diffVersions.mockResolvedValue(result);

    expect(await controller.diffVersions('v1', 'v2')).toEqual(result);
  });

  it('deletePrompt - 删除 Prompt', async () => {
    service.deletePrompt.mockResolvedValue(undefined);

    const result = await controller.deletePrompt('p-1');
    expect(result).toEqual({ success: true });
    expect(service.deletePrompt).toHaveBeenCalledWith('p-1');
  });
});
