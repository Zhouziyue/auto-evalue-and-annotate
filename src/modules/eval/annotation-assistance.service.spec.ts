// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationAssistanceService, AnnotationType } from './annotation-assistance.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AnnotationAssistanceService（数据库持久化版）', () => {
  let service: AnnotationAssistanceService;

  const mockPrisma = {
    annotationTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    annotationItem: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnotationAssistanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnnotationAssistanceService>(AnnotationAssistanceService);
    jest.clearAllMocks();
    mockPrisma.annotationItem.findMany.mockResolvedValue([]);
  });

  const mockTaskRow = (overrides: any = {}) => ({
    id: 'task-1',
    name: '情感标注任务',
    description: null,
    type: 'sentiment',
    status: 'draft',
    createdBy: 'u1',
    assignees: '[]',
    config: JSON.stringify({ labels: ['正面', '负面'] }),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it('createTask - 任务与条目落库', async () => {
    mockPrisma.annotationTask.create.mockResolvedValue(mockTaskRow());
    mockPrisma.annotationTask.findUnique.mockResolvedValue(mockTaskRow());
    mockPrisma.annotationItem.createMany.mockResolvedValue({ count: 2 });

    const task = await service.createTask({
      name: '情感标注任务',
      type: AnnotationType.SENTIMENT,
      data: [
        { id: 'x1', input: '这个产品很好' },
        { id: 'x2', input: '太差了' },
      ],
      createdBy: 'u1',
    });

    expect(mockPrisma.annotationTask.create).toHaveBeenCalled();
    expect(mockPrisma.annotationItem.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ input: '这个产品很好', status: 'pending' }),
      ]),
    });
    expect(task.id).toBe('task-1');
    expect(task.stats.total).toBe(0); // items 查询默认空
  });

  it('listTasks - 返回任务视图与统计', async () => {
    mockPrisma.annotationTask.findMany.mockResolvedValue([
      mockTaskRow({
        items: [
          { id: 'i1', input: 'a', context: null, preAnnotation: null, annotation: null, status: 'pending' },
          { id: 'i2', input: 'b', context: null, preAnnotation: null, annotation: '{"label":"正面"}', status: 'annotated' },
          { id: 'i3', input: 'c', context: null, preAnnotation: null, annotation: '{"label":"负面"}', status: 'reviewed' },
        ],
      }),
    ]);

    const tasks = await service.listTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].stats).toEqual({ total: 3, annotated: 1, reviewed: 1, rejected: 0, pending: 1 });
    expect(tasks[0].config).toEqual({ labels: ['正面', '负面'] });
    expect(tasks[0].assignees).toEqual([]);
  });

  it('getTask - 任务不存在返回 undefined', async () => {
    mockPrisma.annotationTask.findUnique.mockResolvedValue(null);
    expect(await service.getTask('nope')).toBeUndefined();
  });

  it('generatePreAnnotations - 高置信度自动生成 autoAnnotation', async () => {
    mockPrisma.annotationTask.findUnique.mockResolvedValue(mockTaskRow());
    mockPrisma.annotationItem.findMany.mockResolvedValue([
      { id: 'i1', input: '很好优秀满意' },
    ]);
    mockPrisma.annotationItem.update.mockResolvedValue({});

    const suggestions = await service.generatePreAnnotations('task-1');

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestions[0].label).toBe('正面');
    expect(suggestions[0].autoAnnotation).toBe('正面');
    expect(mockPrisma.annotationItem.update).toHaveBeenCalled();
  });

  it('generatePreAnnotations - 任务不存在抛错', async () => {
    mockPrisma.annotationTask.findUnique.mockResolvedValue(null);
    await expect(service.generatePreAnnotations('nope')).rejects.toThrow('Task not found');
  });

  it('submitAnnotation - 更新条目标注与状态', async () => {
    mockPrisma.annotationItem.findFirst.mockResolvedValue({ id: 'i1', status: 'pending' });
    mockPrisma.annotationItem.update.mockResolvedValue({});

    await service.submitAnnotation('task-1', 'i1', { label: '正面' });

    expect(mockPrisma.annotationItem.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { annotation: JSON.stringify({ label: '正面' }), status: 'annotated' },
    });
  });

  it('submitAnnotation - 条目不存在抛错', async () => {
    mockPrisma.annotationItem.findFirst.mockResolvedValue(null);
    await expect(service.submitAnnotation('task-1', 'nope', {})).rejects.toThrow('Item not found');
  });

  it('reviewAnnotation - 通过/拒绝状态流转', async () => {
    mockPrisma.annotationItem.findFirst.mockResolvedValue({ id: 'i1', status: 'annotated' });
    mockPrisma.annotationItem.update.mockResolvedValue({});

    await service.reviewAnnotation('task-1', 'i1', true);
    expect(mockPrisma.annotationItem.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { status: 'reviewed' },
    });

    await service.reviewAnnotation('task-1', 'i1', false);
    expect(mockPrisma.annotationItem.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { status: 'rejected' },
    });
  });

  it('getPendingItems / getAnnotatedItems - 过滤条件正确', async () => {
    mockPrisma.annotationItem.findMany.mockResolvedValue([]);

    await service.getPendingItems('task-1', 5);
    expect(mockPrisma.annotationItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { taskId: 'task-1', status: 'pending' }, take: 5 }),
    );

    await service.getAnnotatedItems('task-1');
    expect(mockPrisma.annotationItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { taskId: 'task-1', status: { in: ['annotated', 'reviewed'] } } }),
    );
  });

  it('activateTask / completeTask - 状态更新', async () => {
    mockPrisma.annotationTask.findUnique.mockResolvedValue(mockTaskRow());
    mockPrisma.annotationTask.update.mockResolvedValue(mockTaskRow({ status: 'active' }));

    const activated = await service.activateTask('task-1');
    expect(mockPrisma.annotationTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'active' },
    });
    expect(activated.status).toBe('active');

    await service.completeTask('task-1');
    expect(mockPrisma.annotationTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'completed' },
    });
  });

  it('activateTask - 任务不存在抛错', async () => {
    mockPrisma.annotationTask.findUnique.mockResolvedValue(null);
    await expect(service.activateTask('nope')).rejects.toThrow('Task not found');
  });

  it('assignTask - 序列化分配人', async () => {
    mockPrisma.annotationTask.findUnique.mockResolvedValue(mockTaskRow());
    mockPrisma.annotationTask.update.mockResolvedValue(mockTaskRow({ assignees: '["u1"]' }));

    const task = await service.assignTask('task-1', ['u1']);

    expect(mockPrisma.annotationTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { assignees: JSON.stringify(['u1']) },
    });
    expect(task.assignees).toEqual(['u1']);
  });

  it('getQualityMetrics - 计算平均置信度与通过率', async () => {
    mockPrisma.annotationItem.findMany.mockResolvedValue([
      { id: 'i1', status: 'reviewed', preAnnotation: JSON.stringify({ suggestions: [{ confidence: 0.9 }] }) },
      { id: 'i2', status: 'annotated', preAnnotation: null },
    ]);

    const quality = await service.getQualityMetrics('task-1');

    expect(quality.taskId).toBe('task-1');
    expect(quality.avgConfidence).toBeCloseTo(0.7, 2); // (0.9 + 0.5) / 2
    expect(quality.reviewPassRate).toBeCloseTo(0.5, 2);
  });

  it('exportAnnotations - 仅导出已标注/已审核条目', async () => {
    mockPrisma.annotationItem.findMany.mockResolvedValue([
      { id: 'i1', input: 'a', annotation: '{"label":"正面"}', preAnnotation: null },
    ]);

    const exported = await service.exportAnnotations('task-1');

    expect(exported).toEqual([{ id: 'i1', input: 'a', annotation: { label: '正面' }, preAnnotation: null }]);
  });

  it('getAnnotationTypes - 返回 8 种标注类型', () => {
    expect(service.getAnnotationTypes()).toHaveLength(8);
  });
});
