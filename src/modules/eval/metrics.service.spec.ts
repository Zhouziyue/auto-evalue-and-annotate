// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService, MetricType } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    process.env.OPENAI_BASE_URL = 'https://api.test.com/v1';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'gpt-4';

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);

    // Mock the private callLLM method
    (service as any).callLLM = jest.fn().mockResolvedValue({
      score: 0.85,
      reason: '测试评分理由',
    });
  });

  const mockInput = {
    input: '什么是机器学习？',
    actualOutput: '机器学习是人工智能的一个分支，通过数据和算法训练模型。',
    expectedOutput: '机器学习是人工智能的子领域，专注于通过数据训练来改进算法性能。',
    context: ['机器学习是AI的子领域', '它通过数据训练来改进算法'],
  };

  describe('runAllMetrics', () => {
    it('应该运行所有指标并返回结果数组', async () => {
      const results = await service.runAllMetrics(mockInput);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result).toHaveProperty('metric');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('reason');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });

    it('应该包含 6 种指标', async () => {
      const results = await service.runAllMetrics(mockInput);
      const metrics = results.map((r) => r.metric);

      expect(metrics).toContain(MetricType.ANSWER_RELEVANCY);
      expect(metrics).toContain(MetricType.FAITHFULNESS);
      expect(metrics).toContain(MetricType.HALLUCINATION);
      expect(metrics).toContain(MetricType.COMPLETENESS);
      expect(metrics).toContain(MetricType.TOXICITY);
      expect(metrics).toContain(MetricType.BIAS);
    });
  });

  describe('evaluateAnswerRelevancy', () => {
    it('应该评估答案相关性', async () => {
      const result = await service.evaluateAnswerRelevancy(mockInput);

      expect(result.metric).toBe(MetricType.ANSWER_RELEVANCY);
      expect(result.score).toBe(0.85);
      expect(result.reason).toBe('测试评分理由');
    });
  });

  describe('evaluateFaithfulness', () => {
    it('应该评估忠实度', async () => {
      const result = await service.evaluateFaithfulness(mockInput);

      expect(result.metric).toBe(MetricType.FAITHFULNESS);
      expect(result.score).toBe(0.85);
    });

    it('应该在没有上下文时也能评测', async () => {
      const inputWithoutContext = { ...mockInput, context: undefined };
      const result = await service.evaluateFaithfulness(inputWithoutContext);

      expect(result.metric).toBe(MetricType.FAITHFULNESS);
    });
  });

  describe('evaluateHallucination', () => {
    it('应该检测幻觉', async () => {
      const result = await service.evaluateHallucination(mockInput);

      expect(result.metric).toBe(MetricType.HALLUCINATION);
      expect(result.score).toBe(0.85);
    });
  });

  describe('evaluateCompleteness', () => {
    it('应该评估完整性', async () => {
      const result = await service.evaluateCompleteness(mockInput);

      expect(result.metric).toBe(MetricType.COMPLETENESS);
      expect(result.score).toBe(0.85);
    });
  });

  describe('evaluateToxicity', () => {
    it('应该检测毒性', async () => {
      const result = await service.evaluateToxicity(mockInput);

      expect(result.metric).toBe(MetricType.TOXICITY);
      expect(result.score).toBe(0.85);
    });
  });

  describe('evaluateBias', () => {
    it('应该检测偏见', async () => {
      const result = await service.evaluateBias(mockInput);

      expect(result.metric).toBe(MetricType.BIAS);
      expect(result.score).toBe(0.85);
    });
  });

  describe('evaluateGEval', () => {
    it('应该根据自定义标准评测', async () => {
      const criteria = '评测回答的创意性和原创性';
      const result = await service.evaluateGEval(mockInput, criteria);

      expect(result.metric).toBe(MetricType.G_EVAL);
      expect(result.score).toBe(0.85);
      expect(result.details).toEqual({ criteria });
    });
  });

  describe('evaluateContextRelevancy', () => {
    it('应该评估上下文相关性', async () => {
      const result = await service.evaluateContextRelevancy(mockInput);

      expect(result.metric).toBe(MetricType.CONTEXT_RELEVANCY);
      expect(result.score).toBe(0.85);
    });

    it('应该在没有上下文时返回 0 分', async () => {
      const inputWithoutContext = { ...mockInput, context: undefined };
      const result = await service.evaluateContextRelevancy(inputWithoutContext);

      expect(result.metric).toBe(MetricType.CONTEXT_RELEVANCY);
      expect(result.score).toBe(0);
      expect(result.reason).toBe('未提供上下文');
    });

    it('应该在上下文为空数组时返回 0 分', async () => {
      const inputWithEmptyContext = { ...mockInput, context: [] };
      const result = await service.evaluateContextRelevancy(inputWithEmptyContext);

      expect(result.score).toBe(0);
    });
  });
});
