// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { MetricConfigService, TaskType, MetricType } from './metric-config.service';

describe('MetricConfigService', () => {
  let service: MetricConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricConfigService],
    }).compile();

    service = module.get<MetricConfigService>(MetricConfigService);
  });

  describe('getAllMetrics', () => {
    it('应该返回所有内置指标', () => {
      const metrics = service.getAllMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.every(m => m.isBuiltIn)).toBe(true);
    });
  });

  describe('getMetricDetail', () => {
    it('应该返回指标详情', () => {
      const metric = service.getMetricDetail('answer_relevancy');

      expect(metric).toBeDefined();
      expect(metric.id).toBe('answer_relevancy');
      expect(metric.name).toBe('答案相关性');
    });

    it('应该在指标不存在时抛出异常', () => {
      expect(() => service.getMetricDetail('non-existent')).toThrow('不存在');
    });
  });

  describe('getRecommendedMetrics', () => {
    it('应该为 QA 任务推荐指标', () => {
      const recommendation = service.getRecommendedMetrics(TaskType.QA);

      expect(recommendation).toBeDefined();
      expect(recommendation.taskType).toBe(TaskType.QA);
      expect(recommendation.recommendedMetrics.length).toBeGreaterThan(0);
      expect(recommendation.reason).toBeDefined();
    });

    it('应该为分类任务推荐指标', () => {
      const recommendation = service.getRecommendedMetrics(TaskType.CLASSIFICATION);

      expect(recommendation).toBeDefined();
      expect(recommendation.taskType).toBe(TaskType.CLASSIFICATION);
    });

    it('应该为未知任务类型返回默认推荐', () => {
      const recommendation = service.getRecommendedMetrics('unknown' as TaskType);

      expect(recommendation).toBeDefined();
      expect(recommendation.recommendedMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('getTaskTypes', () => {
    it('应该返回所有任务类型', () => {
      const taskTypes = service.getTaskTypes();

      expect(taskTypes).toBeDefined();
      expect(taskTypes.length).toBeGreaterThan(0);
      expect(taskTypes.some(t => t.id === TaskType.QA)).toBe(true);
    });
  });

  describe('createCustomMetric', () => {
    it('应该成功创建自定义指标', () => {
      const config = {
        name: '自定义指标',
        description: '这是一个自定义指标',
        category: 'quality' as const,
        applicableTaskTypes: [TaskType.QA],
        scoreRange: { min: 0, max: 10 },
      };

      const metric = service.createCustomMetric(config);

      expect(metric).toBeDefined();
      expect(metric.id).toContain('custom_');
      expect(metric.name).toBe('自定义指标');
      expect(metric.isBuiltIn).toBe(false);
    });
  });

  describe('deleteCustomMetric', () => {
    it('应该成功删除自定义指标', () => {
      const config = {
        name: '待删除指标',
        description: '这是一个待删除的指标',
        category: 'quality' as const,
        applicableTaskTypes: [TaskType.QA],
      };

      const metric = service.createCustomMetric(config);
      const result = service.deleteCustomMetric(metric.id);

      expect(result.success).toBe(true);
    });

    it('应该在删除内置指标时抛出异常', () => {
      // 内置指标不在 customMetrics 中，所以会抛出"不存在"异常
      expect(() => service.deleteCustomMetric('answer_relevancy')).toThrow('不存在');
    });

    it('应该在指标不存在时抛出异常', () => {
      expect(() => service.deleteCustomMetric('non-existent')).toThrow('不存在');
    });
  });

  describe('getMetricCategories', () => {
    it('应该返回所有指标分类', () => {
      const categories = service.getMetricCategories();

      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some(c => c.id === 'quality')).toBe(true);
      expect(categories.some(c => c.id === 'safety')).toBe(true);
    });
  });
});
