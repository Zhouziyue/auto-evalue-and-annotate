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
    },
    annotation: {
      create: jest.fn(),
      findMany: jest.fn(),
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
});
