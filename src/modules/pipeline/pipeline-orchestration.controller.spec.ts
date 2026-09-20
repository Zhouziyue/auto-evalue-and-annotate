// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { PipelineOrchestrationController } from './pipeline-orchestration.controller';
import { PipelineOrchestrationService, PipelineStepType } from './pipeline-orchestration.service';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('PipelineOrchestrationController', () => {
  let controller: PipelineOrchestrationController;
  let service: Partial<Record<keyof PipelineOrchestrationService, jest.Mock>>;
  let prismaService: any;

  beforeEach(async () => {
    service = {
      createPipeline: jest.fn(),
      createFromTemplate: jest.fn(),
      listPipelines: jest.fn(),
      getPipeline: jest.fn(),
      runPipeline: jest.fn(),
      listRuns: jest.fn(),
      getRun: jest.fn(),
      togglePipeline: jest.fn(),
    };

    const schedulerService = {
      updateSchedule: jest.fn(),
    };

    prismaService = {
      pipeline: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      pipelineInstance: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PipelineOrchestrationController],
      providers: [
        { provide: PipelineOrchestrationService, useValue: service },
        { provide: SchedulerService, useValue: schedulerService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    controller = module.get<PipelineOrchestrationController>(PipelineOrchestrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createPipeline - 创建流水线', async () => {
    const dto = {
      name: 'test-pipeline',
      steps: [{ id: 's1', name: 'load', type: PipelineStepType.DATASET_LOAD, config: {} }],
    };
    const result = { id: 'p-1', name: dto.name, description: '', template: JSON.stringify(dto.steps), isPreset: false };
    prismaService.pipeline.create.mockResolvedValue(result);

    const created = await controller.createPipeline(dto);
    expect(created).toEqual(result);
    expect(prismaService.pipeline.create).toHaveBeenCalled();
  });

  it('createFromTemplate - 从模板创建', async () => {
    const result = { id: 'p-tpl', name: '基础评测流水线' };
    service.createFromTemplate.mockResolvedValue(result);

    expect(await controller.createFromTemplate('basic_eval')).toEqual(result);
    expect(service.createFromTemplate).toHaveBeenCalledWith('basic_eval');
  });

  it('listPipelines - 获取流水线列表', async () => {
    const mockPipelines = [{ id: 'p-1', name: 'pipeline1', description: '', template: '[]', isPreset: false, createdAt: new Date(), updatedAt: new Date() }];
    prismaService.pipeline.findMany.mockResolvedValue(mockPipelines);

    const result = await controller.listPipelines();
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('pipeline1');
  });

  it('getPipeline - 获取流水线详情', async () => {
    const result = { id: 'p-1', name: 'pipeline1' };
    service.getPipeline.mockResolvedValue(result);

    expect(await controller.getPipeline('p-1')).toEqual(result);
  });

  it('runPipeline - 运行流水线', async () => {
    const mockInstance = { id: 'run-1', status: 'completed', pipeline: { name: 'test' }, startTime: new Date(), endTime: new Date() };
    prismaService.pipelineInstance.create.mockResolvedValue(mockInstance);

    const result = await controller.runPipeline('p-1', { triggeredBy: 'user' });
    expect(result.id).toEqual('run-1');
    expect(prismaService.pipelineInstance.create).toHaveBeenCalled();
  });

  it('listRuns - 获取运行列表', async () => {
    const result = [{ id: 'run-1' }];
    service.listRuns.mockResolvedValue(result);

    expect(await controller.listRuns('p-1')).toEqual(result);
  });

  it('getRun - 获取运行详情', async () => {
    const result = { id: 'run-1', status: 'completed' };
    service.getRun.mockResolvedValue(result);

    expect(await controller.getRun('run-1')).toEqual(result);
  });

  it('togglePipeline - 启用/禁用流水线', async () => {
    service.togglePipeline.mockResolvedValue(undefined);

    await controller.togglePipeline('p-1', { enabled: false });
    expect(service.togglePipeline).toHaveBeenCalledWith('p-1', false);
  });

  it('getStepTypes - 获取步骤类型', () => {
    const result = controller.getStepTypes();
    expect(result.types).toBeDefined();
    expect(result.types.length).toBeGreaterThan(0);
    expect(result.types[0]).toHaveProperty('id');
    expect(result.types[0]).toHaveProperty('name');
  });
});
