// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationWorkflowController } from './annotation-workflow.controller';
import { AnnotationService } from './annotation.service';

describe('AnnotationWorkflowController', () => {
  let controller: AnnotationWorkflowController;
  const service = {
    getDashboard: jest.fn(),
    listTasks: jest.fn(),
    assignTask: jest.fn(),
    getQueue: jest.fn(),
    getConflicts: jest.fn(),
    updateAnnotationScores: jest.fn(),
    reviewAnnotation: jest.fn(),
    reAnnotate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnotationWorkflowController],
      providers: [{ provide: AnnotationService, useValue: service }],
    }).compile();

    controller = module.get<AnnotationWorkflowController>(AnnotationWorkflowController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getDashboard - 返回总览指标', async () => {
    const result = { pendingReview: 3, conflicts: 1 };
    service.getDashboard.mockResolvedValue(result);
    expect(await controller.getDashboard()).toEqual(result);
  });

  it('listTasks - 返回任务列表', async () => {
    service.listTasks.mockResolvedValue([{ id: 'task-1' }]);
    expect(await controller.listTasks()).toEqual([{ id: 'task-1' }]);
  });

  it('assignTask - 分配任务，缺省空数组', async () => {
    service.assignTask.mockResolvedValue({ id: 'task-1' });
    await controller.assignTask('task-1', {});
    expect(service.assignTask).toHaveBeenCalledWith('task-1', []);
  });

  it('getQueue - 查询参数透传并转换 limit', async () => {
    service.getQueue.mockResolvedValue([]);
    await controller.getQueue('run-1', 'pending', '20', 'confidence_desc');
    expect(service.getQueue).toHaveBeenCalledWith({
      evalRunId: 'run-1',
      status: 'pending',
      limit: 20,
      sortBy: 'confidence_desc',
    });
  });

  it('getQueue - limit 缺省为 50', async () => {
    service.getQueue.mockResolvedValue([]);
    await controller.getQueue();
    expect(service.getQueue).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
  });

  it('getConflicts - 返回冲突列表', async () => {
    service.getConflicts.mockResolvedValue([{ id: 'ann-1' }]);
    expect(await controller.getConflicts()).toEqual([{ id: 'ann-1' }]);
  });

  it('updateAnnotation - 人工修正评分', async () => {
    service.updateAnnotationScores.mockResolvedValue({ id: 'ann-1' });
    await controller.updateAnnotation('ann-1', { scores: { 准确性: 0.5 }, comment: '修正' });
    expect(service.updateAnnotationScores).toHaveBeenCalledWith('ann-1', { 准确性: 0.5 }, '修正');
  });

  it('reviewAnnotation - 审核透传', async () => {
    service.reviewAnnotation.mockResolvedValue({ id: 'ann-1', approved: true });
    const body = { approved: true, reviewerId: 'u1', modifiedScores: { 准确性: 0.9 } };
    await controller.reviewAnnotation('ann-1', body);
    expect(service.reviewAnnotation).toHaveBeenCalledWith('ann-1', body);
  });

  it('reAnnotate - 重新标注', async () => {
    service.reAnnotate.mockResolvedValue({ id: 'ann-new' });
    expect(await controller.reAnnotate('result-1')).toEqual({ id: 'ann-new' });
    expect(service.reAnnotate).toHaveBeenCalledWith('result-1');
  });
});
