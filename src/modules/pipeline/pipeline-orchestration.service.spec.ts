// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { PipelineOrchestrationService, PipelineStepType, PipelineStatus } from './pipeline-orchestration.service';

describe('PipelineOrchestrationService', () => {
  let service: PipelineOrchestrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PipelineOrchestrationService],
    }).compile();

    service = module.get<PipelineOrchestrationService>(PipelineOrchestrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPipeline', () => {
    it('创建流水线', async () => {
      const data = {
        name: 'test-pipeline',
        description: 'Test description',
        steps: [
          { id: 's1', name: 'Load', type: PipelineStepType.DATASET_LOAD, config: {} },
        ],
        trigger: 'manual' as const,
      };

      const result = await service.createPipeline(data);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('test-pipeline');
      expect(result.description).toBe('Test description');
      expect(result.steps).toHaveLength(1);
      expect(result.enabled).toBe(true);
      expect(result.trigger).toBe('manual');
    });

    it('默认 trigger 为 manual', async () => {
      const data = {
        name: 'test',
        steps: [],
      };

      const result = await service.createPipeline(data);

      expect(result.trigger).toBe('manual');
    });
  });

  describe('createFromTemplate', () => {
    it('从 basic_eval 模板创建', async () => {
      const result = await service.createFromTemplate('basic_eval');

      expect(result.name).toBe('基础评测流水线');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('从 rag_eval 模板创建', async () => {
      const result = await service.createFromTemplate('rag_eval');

      expect(result.name).toBe('RAG 评测流水线');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('从 comparison 模板创建', async () => {
      const result = await service.createFromTemplate('comparison');

      expect(result.name).toBe('模型对比流水线');
    });

    it('未知模板抛出异常', async () => {
      await expect(service.createFromTemplate('unknown' as any)).rejects.toThrow('Unknown template');
    });
  });

  describe('listPipelines & getPipeline', () => {
    it('获取流水线列表', async () => {
      await service.createPipeline({ name: 'p1', steps: [] });
      await service.createPipeline({ name: 'p2', steps: [] });

      const list = await service.listPipelines();

      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it('获取流水线详情', async () => {
      const created = await service.createPipeline({ name: 'detail-test', steps: [] });
      const detail = await service.getPipeline(created.id);

      expect(detail).toBeDefined();
      expect(detail?.name).toBe('detail-test');
    });

    it('获取不存在的流水线', async () => {
      const result = await service.getPipeline('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('runPipeline', () => {
    it('运行流水线', async () => {
      const pipeline = await service.createPipeline({
        name: 'run-test',
        steps: [
          { id: 's1', name: 'Load', type: PipelineStepType.DATASET_LOAD, config: {} },
        ],
      });

      const run = await service.runPipeline(pipeline.id, 'test-user');

      expect(run.id).toBeDefined();
      expect(run.pipelineId).toBe(pipeline.id);
      expect(run.status).toBe(PipelineStatus.RUNNING);
      expect(run.triggeredBy).toBe('test-user');
    });

    it('运行不存在的流水线抛出异常', async () => {
      await expect(service.runPipeline('nonexistent')).rejects.toThrow('Pipeline not found');
    });

    it('运行已禁用的流水线抛出异常', async () => {
      const pipeline = await service.createPipeline({ name: 'disabled', steps: [] });
      await service.togglePipeline(pipeline.id, false);

      await expect(service.runPipeline(pipeline.id)).rejects.toThrow('Pipeline is disabled');
    });
  });

  describe('listRuns & getRun', () => {
    it('获取运行列表', async () => {
      const pipeline = await service.createPipeline({
        name: 'runs-test',
        steps: [{ id: 's1', name: 'Load', type: PipelineStepType.DATASET_LOAD, config: {} }],
      });
      await service.runPipeline(pipeline.id);

      const runs = await service.listRuns(pipeline.id);

      expect(runs.length).toBeGreaterThan(0);
    });

    it('获取运行详情', async () => {
      const pipeline = await service.createPipeline({
        name: 'run-detail',
        steps: [{ id: 's1', name: 'Load', type: PipelineStepType.DATASET_LOAD, config: {} }],
      });
      const run = await service.runPipeline(pipeline.id);
      const detail = await service.getRun(run.id);

      expect(detail).toBeDefined();
      expect(detail?.pipelineId).toBe(pipeline.id);
    });
  });

  describe('togglePipeline', () => {
    it('禁用流水线', async () => {
      const pipeline = await service.createPipeline({ name: 'toggle-test', steps: [] });

      await service.togglePipeline(pipeline.id, false);
      const detail = await service.getPipeline(pipeline.id);

      expect(detail?.enabled).toBe(false);
    });

    it('启用流水线', async () => {
      const pipeline = await service.createPipeline({ name: 'toggle-test', steps: [] });
      await service.togglePipeline(pipeline.id, false);
      await service.togglePipeline(pipeline.id, true);

      const detail = await service.getPipeline(pipeline.id);
      expect(detail?.enabled).toBe(true);
    });
  });
});
