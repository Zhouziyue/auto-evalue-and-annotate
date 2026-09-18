// @ts-nocheck
/**
 * 批量服务文件抽样测试
 * 从各批量服务文件中抽取代表性服务进行基本验证
 */

// 从 model-pipeline-services 导入
import { ModelVersionService } from './model-pipeline-services';
// 从 core-extended-services 导入
import { MetricRegressionService } from './core-extended-services';
// 从 optimize-services 导入
import { SmartRoutingOptimizeService } from './optimize-services';

describe('批量服务文件抽样测试', () => {
  describe('ModelVersionService (model-pipeline-services)', () => {
    it('应该能正确实例化', () => {
      const service = new ModelVersionService();
      expect(service).toBeDefined();
    });

    it('应该有 create 方法', () => {
      const service = new ModelVersionService();
      expect(typeof service.create).toBe('function');
    });

    it('应该有 list 方法', () => {
      const service = new ModelVersionService();
      expect(typeof service.list).toBe('function');
    });
  });

  describe('MetricRegressionService (core-extended-services)', () => {
    it('应该能正确实例化', () => {
      const service = new MetricRegressionService();
      expect(service).toBeDefined();
    });

    it('应该有 detect 方法', () => {
      const service = new MetricRegressionService();
      expect(typeof service.detect).toBe('function');
    });
  });

  describe('SmartRoutingOptimizeService (optimize-services)', () => {
    it('应该能正确实例化', () => {
      const service = new SmartRoutingOptimizeService();
      expect(service).toBeDefined();
    });

    it('应该有 optimize 方法', () => {
      const service = new SmartRoutingOptimizeService();
      expect(typeof service.optimize).toBe('function');
    });

    it('应该有 list 方法', () => {
      const service = new SmartRoutingOptimizeService();
      expect(typeof service.list).toBe('function');
    });
  });

  describe('数组导出验证', () => {
    it('model-pipeline-services 应该导出 MODEL_PIPELINE_SERVICES 数组', async () => {
      const mod = await import('./model-pipeline-services');
      expect(mod.MODEL_PIPELINE_SERVICES).toBeDefined();
      expect(Array.isArray(mod.MODEL_PIPELINE_SERVICES)).toBe(true);
      expect(mod.MODEL_PIPELINE_SERVICES.length).toBeGreaterThan(0);
    });

    it('core-extended-services 应该导出 CORE_EXTENDED_SERVICES 数组', async () => {
      const mod = await import('./core-extended-services');
      expect(mod.CORE_EXTENDED_SERVICES).toBeDefined();
      expect(Array.isArray(mod.CORE_EXTENDED_SERVICES)).toBe(true);
      expect(mod.CORE_EXTENDED_SERVICES.length).toBeGreaterThan(0);
    });

    it('optimize-services 应该导出 OPTIMIZE_SERVICES 数组', async () => {
      const mod = await import('./optimize-services');
      expect(mod.OPTIMIZE_SERVICES).toBeDefined();
      expect(Array.isArray(mod.OPTIMIZE_SERVICES)).toBe(true);
      expect(mod.OPTIMIZE_SERVICES.length).toBeGreaterThan(0);
    });
  });
});
