// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationService } from './annotation.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('AnnotationService', () => {
  let service: AnnotationService;

  const mockPrisma = {
    evalResult: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    annotation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    annotationTask: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnotationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnnotationService>(AnnotationService);
    jest.clearAllMocks();

    // 默认：无已有任务，创建任务返回 mock 对象；各 mock 默认空返回
    mockPrisma.annotation.findMany.mockResolvedValue([]);
    mockPrisma.annotation.count.mockResolvedValue(0);
    mockPrisma.annotationTask.findFirst.mockResolvedValue(null);
    mockPrisma.annotationTask.create.mockResolvedValue({ id: 'task-1', status: 'pending' });
    mockPrisma.annotationTask.update.mockResolvedValue({ id: 'task-1' });
    mockPrisma.annotationTask.findMany.mockResolvedValue([]);

    // 清除 API key 以使用模拟模式
    delete process.env.OPENAI_API_KEY;
  });

  describe('aiAnnotate', () => {
    it('应该创建 AI 预标注', async () => {
      const mockResult = {
        id: 'result-1',
        actualOutput: '测试输出',
        testCase: {
          input: '测试输入',
          expectedOutput: '期望输出',
        },
      };

      mockPrisma.evalResult.findUnique.mockResolvedValue(mockResult);
      mockPrisma.annotation.create.mockResolvedValue({
        id: 'ann-1',
        evalResultId: 'result-1',
        type: 'ai',
        scores: { 准确性: 0.75, 完整性: 0.8, 相关性: 0.85, 安全性: 0.9 },
        comment: 'AI 预标注（模拟）',
      });

      const result = await service.aiAnnotate('result-1');

      expect(result.type).toBe('ai');
      expect(result.scores).toBeDefined();
      expect(mockPrisma.annotation.create).toHaveBeenCalled();
    });

    it('应该在 EvalResult 不存在时抛出错误', async () => {
      mockPrisma.evalResult.findUnique.mockResolvedValue(null);

      await expect(service.aiAnnotate('non-existent')).rejects.toThrow('EvalResult not found');
    });
  });

  describe('humanAnnotate', () => {
    it('应该创建人工标注', async () => {
      const scores = { 准确性: 0.9, 完整性: 0.85 };
      mockPrisma.annotation.create.mockResolvedValue({
        id: 'ann-2',
        evalResultId: 'result-1',
        type: 'human',
        annotatorId: 'user-1',
        scores,
        isFinal: true,
      });

      const result = await service.humanAnnotate('result-1', 'user-1', scores, '好的回答');

      expect(result.type).toBe('human');
      expect(result.isFinal).toBe(true);
    });
  });

  describe('calculateAgreement', () => {
    it('应该计算 AI 和人工标注的一致性', async () => {
      mockPrisma.annotation.findMany.mockResolvedValue([
        { id: '1', type: 'ai', scores: { 准确性: 0.8, 完整性: 0.7 } },
        { id: '2', type: 'human', isFinal: true, scores: { 准确性: 0.9, 完整性: 0.8 } },
      ]);

      const result = await service.calculateAgreement('result-1');

      expect(result.agreement).toBeDefined();
      expect(result.agreement).toBeGreaterThan(0);
      expect(result.agreement).toBeLessThanOrEqual(1);
      expect(result.dimensions).toBe(2);
    });

    it('应该在缺少标注时返回 null', async () => {
      mockPrisma.annotation.findMany.mockResolvedValue([
        { id: '1', type: 'ai', scores: { 准确性: 0.8 } },
      ]);

      const result = await service.calculateAgreement('result-1');

      expect(result.agreement).toBeNull();
      expect(result.message).toBeDefined();
    });
  });

  describe('batchAutoAnnotate', () => {
    it('应该批量自动标注评测结果', async () => {
      const mockResults = [
        { id: 'r1', evalRunId: 'run-1', testCase: { input: '问题1', expectedOutput: '答案1' }, actualOutput: '输出1' },
        { id: 'r2', evalRunId: 'run-1', testCase: { input: '问题2', expectedOutput: '答案2' }, actualOutput: '输出2' },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.annotation.findFirst.mockResolvedValue(null); // 无已有标注
      // aiAnnotate 内部调用 findUnique 和 create
      mockPrisma.evalResult.findUnique.mockResolvedValue(mockResults[0]);
      mockPrisma.annotation.create.mockResolvedValue({
        id: 'ann-1',
        type: 'ai',
        scores: { 准确性: 0.8, 完整性: 0.75, 相关性: 0.85, 安全性: 0.9 },
      });

      const result = await service.batchAutoAnnotate('run-1');

      expect(result.total).toBe(2);
      expect(result.annotated).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('应该在无评测结果时返回提示', async () => {
      mockPrisma.evalResult.findMany.mockResolvedValue([]);

      const result = await service.batchAutoAnnotate('run-empty');

      expect(result.total).toBe(0);
      expect(result.message).toBeDefined();
    });

    it('应该跳过已标注的结果', async () => {
      const mockResults = [
        { id: 'r1', evalRunId: 'run-1', testCase: { input: '问题1' }, actualOutput: '输出1' },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);
      mockPrisma.annotation.findFirst.mockResolvedValue({ id: 'existing-ann', type: 'ai' }); // 已有标注

      const result = await service.batchAutoAnnotate('run-1');

      expect(result.total).toBe(1);
      expect(result.annotated).toBe(1);
      expect(mockPrisma.annotation.create).not.toHaveBeenCalled();
    });
  });

  describe('getEvalRunAnnotationStats', () => {
    it('应该返回评测运行的标注统计', async () => {
      const mockResults = [
        {
          id: 'r1',
          testCase: { input: '问题1' },
          annotations: [
            { type: 'ai', scores: { 准确性: 0.8, 完整性: 0.75, 相关性: 0.85, 安全性: 0.9 } },
          ],
        },
        {
          id: 'r2',
          testCase: { input: '问题2' },
          annotations: [],
        },
      ];

      mockPrisma.evalResult.findMany.mockResolvedValue(mockResults);

      const result = await service.getEvalRunAnnotationStats('run-1');

      expect(result.totalResults).toBe(2);
      expect(result.aiAnnotated).toBe(1);
      expect(result.pendingAnnotation).toBe(1);
      expect(result.avgScores).toBeDefined();
    });
  });

  describe('aiAnnotate 置信度与模型版本', () => {
    it('应该写入 confidence/modelVersion 并序列化评分', async () => {
      mockPrisma.evalResult.findUnique.mockResolvedValue({
        id: 'result-1',
        actualOutput: '输出',
        testCase: { input: '输入', expectedOutput: '期望' },
      });
      mockPrisma.annotation.create.mockImplementation((args: any) => Promise.resolve({ id: 'ann-1', type: 'ai', ...args.data }));

      await service.aiAnnotate('result-1');

      const data = mockPrisma.annotation.create.mock.calls[0][0].data;
      expect(typeof data.scores).toBe('string');
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
      expect(data.modelVersion).toBe('mock');
      expect(data.status).toBe('pending');
    });
  });

  describe('reAnnotate', () => {
    it('应该先删除旧 AI 标注再重新标注', async () => {
      mockPrisma.evalResult.findUnique.mockResolvedValue({
        id: 'result-1',
        actualOutput: '输出',
        testCase: { input: '输入' },
      });
      mockPrisma.annotation.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.annotation.create.mockResolvedValue({ id: 'ann-new', type: 'ai' });

      const result = await service.reAnnotate('result-1');

      expect(mockPrisma.annotation.deleteMany).toHaveBeenCalledWith({ where: { evalResultId: 'result-1', type: 'ai' } });
      expect(result.id).toBe('ann-new');
    });
  });

  describe('getQueue', () => {
    it('应该返回组装后的审核队列条目', async () => {
      mockPrisma.annotation.findMany.mockResolvedValue([
        {
          id: 'ann-1',
          status: 'pending',
          confidence: 0.6,
          modelVersion: 'mock',
          scores: JSON.stringify({ 准确性: 0.6 }),
          comment: 'AI 预标注',
          evalResultId: 'r1',
          createdAt: new Date(),
          evalResult: {
            status: 'passed',
            actualOutput: '实际输出',
            testCase: { input: '输入', expectedOutput: '期望' },
            annotations: [{ type: 'human', isFinal: true, scores: '{"准确性":0.9}', comment: '人工', annotatorId: 'u1' }],
          },
        },
      ]);

      const queue = await service.getQueue({ evalRunId: 'run-1' });

      expect(queue).toHaveLength(1);
      expect(queue[0].aiScores).toEqual({ 准确性: 0.6 });
      expect(queue[0].input).toBe('输入');
      expect(queue[0].actualOutput).toBe('实际输出');
      expect(queue[0].humanAnnotation.scores).toEqual({ 准确性: 0.9 });
    });
  });

  describe('reviewAnnotation', () => {
    const mockAi = {
      id: 'ann-1',
      evalResultId: 'r1',
      taskId: 'task-1',
      type: 'ai',
      status: 'pending',
      scores: JSON.stringify({ 准确性: 0.8, 完整性: 0.8 }),
      evalResult: { testCase: { input: '输入' }, annotations: [] },
    };

    it('通过：状态置 approved', async () => {
      mockPrisma.annotation.findUnique.mockResolvedValue(mockAi);
      mockPrisma.annotation.update.mockResolvedValue({ ...mockAi, status: 'approved' });

      const result = await service.reviewAnnotation('ann-1', { approved: true, reviewerId: 'u1' });

      expect(result.approved).toBe(true);
      expect(result.conflict).toBe(false);
      expect(mockPrisma.annotation.update).toHaveBeenCalledWith({
        where: { id: 'ann-1' },
        data: expect.objectContaining({ status: 'approved', reviewedBy: 'u1' }),
      });
    });

    it('拒绝：状态置 rejected', async () => {
      mockPrisma.annotation.findUnique.mockResolvedValue(mockAi);
      mockPrisma.annotation.update.mockResolvedValue({ ...mockAi, status: 'rejected' });

      const result = await service.reviewAnnotation('ann-1', { approved: false });

      expect(result.approved).toBe(false);
      expect(mockPrisma.annotation.update).toHaveBeenCalledWith({
        where: { id: 'ann-1' },
        data: expect.objectContaining({ status: 'rejected' }),
      });
    });

    it('修改后通过且差异超阈值：检测为冲突', async () => {
      mockPrisma.annotation.findUnique.mockResolvedValue(mockAi);
      mockPrisma.annotation.create.mockResolvedValue({ id: 'human-1', type: 'human', isFinal: true });
      mockPrisma.annotation.update.mockResolvedValue(mockAi);

      const result = await service.reviewAnnotation('ann-1', {
        approved: true,
        reviewerId: 'u1',
        modifiedScores: { 准确性: 0.2, 完整性: 0.8 },
      });

      expect(result.conflict).toBe(true);
      expect(result.humanAnnotation).toBeDefined();
      expect(mockPrisma.annotation.update).toHaveBeenCalledWith({
        where: { id: 'ann-1' },
        data: expect.objectContaining({ status: 'conflict' }),
      });
    });

    it('修改后通过且差异在阈值内：状态置 modified', async () => {
      mockPrisma.annotation.findUnique.mockResolvedValue(mockAi);
      mockPrisma.annotation.create.mockResolvedValue({ id: 'human-1', type: 'human', isFinal: true });
      mockPrisma.annotation.update.mockResolvedValue(mockAi);

      const result = await service.reviewAnnotation('ann-1', {
        approved: true,
        modifiedScores: { 准确性: 0.7, 完整性: 0.9 },
      });

      expect(result.conflict).toBe(false);
      expect(mockPrisma.annotation.update).toHaveBeenCalledWith({
        where: { id: 'ann-1' },
        data: expect.objectContaining({ status: 'modified' }),
      });
    });

    it('标注不存在时抛错', async () => {
      mockPrisma.annotation.findUnique.mockResolvedValue(null);
      await expect(service.reviewAnnotation('nope', { approved: true })).rejects.toThrow('Annotation not found');
    });
  });

  describe('updateAnnotationScores', () => {
    it('应该更新评分并置为 modified', async () => {
      mockPrisma.annotation.findUnique.mockResolvedValue({ id: 'ann-1', status: 'pending' });
      mockPrisma.annotation.update.mockResolvedValue({ id: 'ann-1', status: 'modified' });

      await service.updateAnnotationScores('ann-1', { 准确性: 0.5 }, '修正');

      const arg = mockPrisma.annotation.update.mock.calls[0][0];
      expect(arg.data.status).toBe('modified');
      expect(JSON.parse(arg.data.scores)).toEqual({ 准确性: 0.5 });
    });

    it('标注不存在时抛错', async () => {
      mockPrisma.annotation.findUnique.mockResolvedValue(null);
      await expect(service.updateAnnotationScores('nope', {})).rejects.toThrow('Annotation not found');
    });
  });

  describe('getConflicts', () => {
    it('应该返回冲突条目及维度差异', async () => {
      mockPrisma.annotation.findMany.mockResolvedValue([
        {
          id: 'ann-1',
          status: 'conflict',
          confidence: 0.8,
          scores: JSON.stringify({ 准确性: 0.9 }),
          comment: '',
          evalResultId: 'r1',
          reviewedAt: new Date(),
          createdAt: new Date(),
          evalResult: {
            testCase: { input: '输入' },
            actualOutput: '输出',
            annotations: [{ type: 'human', isFinal: true, scores: '{"准确性":0.4}', annotatorId: 'u1' }],
          },
        },
      ]);

      const conflicts = await service.getConflicts();

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].scoreDiffs[0]).toEqual({ dimension: '准确性', aiScore: 0.9, humanScore: 0.4, diff: 0.5 });
    });
  });

  describe('listTasks', () => {
    it('应该返回任务及进度统计', async () => {
      mockPrisma.annotationTask.findMany.mockResolvedValue([
        { id: 'task-1', name: '任务1', type: 'eval_review', status: 'in_progress', evalRunId: 'run-1', assignees: '["u1"]', createdAt: new Date(), updatedAt: new Date() },
      ]);
      mockPrisma.annotation.findMany.mockResolvedValue([
        { id: 'a1', status: 'approved', confidence: 0.9 },
        { id: 'a2', status: 'pending', confidence: 0.5 },
        { id: 'a3', status: 'conflict', confidence: 0.7 },
      ]);

      const tasks = await service.listTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].totalItems).toBe(3);
      expect(tasks[0].completedItems).toBe(2);
      expect(tasks[0].approvedItems).toBe(1);
      expect(tasks[0].conflictItems).toBe(1);
      expect(tasks[0].assignees).toEqual(['u1']);
      expect(tasks[0].avgConfidence).toBeCloseTo(0.7, 2);
    });
  });

  describe('assignTask', () => {
    it('应该序列化分配人列表', async () => {
      mockPrisma.annotationTask.findUnique.mockResolvedValue({ id: 'task-1' });
      mockPrisma.annotationTask.update.mockResolvedValue({ id: 'task-1', assignees: '["u1","u2"]' });

      await service.assignTask('task-1', ['u1', 'u2']);

      expect(mockPrisma.annotationTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { assignees: JSON.stringify(['u1', 'u2']) },
      });
    });

    it('任务不存在时抛错', async () => {
      mockPrisma.annotationTask.findUnique.mockResolvedValue(null);
      await expect(service.assignTask('nope', [])).rejects.toThrow('Task not found');
    });
  });

  describe('getDashboard', () => {
    it('应该返回总览指标', async () => {
      mockPrisma.annotation.count
        .mockResolvedValueOnce(5)   // pendingReview
        .mockResolvedValueOnce(2)   // conflicts
        .mockResolvedValueOnce(10)  // approved
        .mockResolvedValueOnce(1)   // rejected
        .mockResolvedValueOnce(3)   // modified
        .mockResolvedValueOnce(21)  // totalAi
        .mockResolvedValueOnce(8);  // totalHuman
      mockPrisma.annotation.findMany.mockResolvedValue([]);

      const dashboard = await service.getDashboard();

      expect(dashboard.pendingReview).toBe(5);
      expect(dashboard.conflicts).toBe(2);
      expect(dashboard.totalAi).toBe(21);
      expect(dashboard.reviewRate).toBeCloseTo(0.762, 2);
      expect(dashboard.avgAgreement).toBeNull();
    });

    it('有人工标注时应该计算平均一致性', async () => {
      mockPrisma.annotation.count.mockResolvedValue(0);
      // getDashboard 内部两次 findMany：人工最终标注 / 冲突标注
      mockPrisma.annotation.findMany
        .mockResolvedValueOnce([
          {
            annotatorId: 'u1',
            scores: JSON.stringify({ 准确性: 0.8 }),
            evalResult: { annotations: [{ type: 'ai', scores: JSON.stringify({ 准确性: 0.6 }) }] },
          },
        ])
        .mockResolvedValueOnce([]);

      const dashboard = await service.getDashboard();

      expect(dashboard.avgAgreement).toBeCloseTo(0.8, 2);
      expect(dashboard.annotatorStats).toEqual([{ annotatorId: 'u1', total: 1, conflicts: 0 }]);
    });
  });
});
