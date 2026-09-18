// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';
import { AiGenerationService } from './ai-generation.service';
import { DatasetVersionService } from './dataset-version.service';
import { DatasetCurationService } from './dataset-curation.service';

describe('DatasetController', () => {
  let controller: DatasetController;
  let datasetService: Partial<Record<keyof DatasetService, jest.Mock>>;
  let aiGenService: Partial<Record<keyof AiGenerationService, jest.Mock>>;
  let versionService: Partial<Record<keyof DatasetVersionService, jest.Mock>>;
  let curationService: Partial<Record<keyof DatasetCurationService, jest.Mock>>;

  beforeEach(async () => {
    datasetService = {
      createDataset: jest.fn(),
      findAllDatasets: jest.fn(),
      findDataset: jest.fn(),
      updateDataset: jest.fn(),
      removeDataset: jest.fn(),
      findTestCases: jest.fn(),
      createTestCase: jest.fn(),
      importCases: jest.fn(),
      exportCases: jest.fn(),
      createSnapshot: jest.fn(),
    };
    aiGenService = { generateCases: jest.fn() };
    versionService = { createVersion: jest.fn(), listVersions: jest.fn() };
    curationService = { curateDataset: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatasetController],
      providers: [
        { provide: DatasetService, useValue: datasetService },
        { provide: AiGenerationService, useValue: aiGenService },
        { provide: DatasetVersionService, useValue: versionService },
        { provide: DatasetCurationService, useValue: curationService },
      ],
    }).compile();

    controller = module.get<DatasetController>(DatasetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createDataset - 创建数据集', async () => {
    const dto = { name: 'test-ds', description: 'test', category: '客服' };
    const result = { id: 'ds-1', ...dto };
    datasetService.createDataset.mockResolvedValue(result);

    expect(await controller.createDataset(dto)).toEqual(result);
    expect(datasetService.createDataset).toHaveBeenCalledWith(dto);
  });

  it('findAllDatasets - 获取数据集列表（无分类筛选）', async () => {
    const result = [{ id: 'ds-1', name: 'ds1' }];
    datasetService.findAllDatasets.mockResolvedValue(result);

    expect(await controller.findAllDatasets()).toEqual(result);
    expect(datasetService.findAllDatasets).toHaveBeenCalledWith(undefined);
  });

  it('findAllDatasets - 获取数据集列表（带分类筛选）', async () => {
    const result = [{ id: 'ds-1', name: 'ds1', category: '客服' }];
    datasetService.findAllDatasets.mockResolvedValue(result);

    expect(await controller.findAllDatasets('客服')).toEqual(result);
    expect(datasetService.findAllDatasets).toHaveBeenCalledWith('客服');
  });

  it('findDataset - 获取数据集详情', async () => {
    const result = { id: 'ds-1', name: 'ds1' };
    datasetService.findDataset.mockResolvedValue(result);

    expect(await controller.findDataset('ds-1')).toEqual(result);
  });

  it('updateDataset - 更新数据集', async () => {
    const dto = { name: 'updated-ds' };
    const result = { id: 'ds-1', ...dto };
    datasetService.updateDataset.mockResolvedValue(result);

    expect(await controller.updateDataset('ds-1', dto)).toEqual(result);
  });

  it('removeDataset - 删除数据集', async () => {
    datasetService.removeDataset.mockResolvedValue(undefined);
    await controller.removeDataset('ds-1');
    expect(datasetService.removeDataset).toHaveBeenCalledWith('ds-1');
  });

  it('findTestCases - 获取用例列表（无难度筛选）', async () => {
    const result = [{ id: 'tc-1', input: 'q1' }];
    datasetService.findTestCases.mockResolvedValue(result);

    expect(await controller.findTestCases('ds-1')).toEqual(result);
  });

  it('findTestCases - 获取用例列表（带难度筛选）', async () => {
    const result = [{ id: 'tc-1', input: 'q1', difficulty: 'hard' }];
    datasetService.findTestCases.mockResolvedValue(result);

    expect(await controller.findTestCases('ds-1', 'hard')).toEqual(result);
  });

  it('createTestCase - 添加用例', async () => {
    const dto = { input: 'q1', expectedOutput: 'a1', difficulty: 'easy' };
    const result = { id: 'tc-1', ...dto };
    datasetService.createTestCase.mockResolvedValue(result);

    expect(await controller.createTestCase('ds-1', dto)).toEqual(result);
  });

  it('importCases - 批量导入用例', async () => {
    const cases = [{ input: 'q1' }, { input: 'q2' }];
    const result = { imported: 2 };
    datasetService.importCases.mockResolvedValue(result);

    expect(await controller.importCases('ds-1', { cases })).toEqual(result);
  });

  it('exportCases - 导出用例', async () => {
    const result = { format: 'json', cases: [] };
    datasetService.exportCases.mockResolvedValue(result);

    expect(await controller.exportCases('ds-1', 'json')).toEqual(result);
  });

  it('createSnapshot - 创建数据集快照', async () => {
    const result = { id: 'snap-1', version: 'v1.0' };
    datasetService.createSnapshot.mockResolvedValue(result);

    expect(await controller.createSnapshot('ds-1', { version: 'v1.0' })).toEqual(result);
  });
});
