// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// A/B 测试状态
export enum ABTestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// A/B 测试配置
export interface ABTestConfig {
  name: string;
  description?: string;
  variants: ABTestVariant[];
  trafficSplit?: number[];  // 流量分配比例
  sampleSize?: number;      // 目标样本量
  duration?: number;        // 持续时间（小时）
  metrics: string[];        // 评测指标
}

// 变体配置
export interface ABTestVariant {
  id: string;
  name: string;
  modelName: string;
  promptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
}

// A/B 测试
export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: ABTestStatus;
  variants: ABTestVariant[];
  trafficSplit: number[];
  sampleSize: number;
  currentSamples: number;
  duration?: number;
  metrics: string[];
  results?: ABTestResult[];
  winner?: string;
  statisticalSignificance?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// A/B 测试结果
export interface ABTestResult {
  variantId: string;
  variantName: string;
  totalRuns: number;
  avgScore: number;
  avgLatency: number;
  scores: Record<string, number>;
  passRate: number;
}

// 运行记录
export interface ABTestRun {
  id: string;
  testId: string;
  variantId: string;
  input: string;
  output: string;
  scores: Record<string, number>;
  latency: number;
  timestamp: Date;
}

@Injectable()
export class ABTestService {
  private tests: Map<string, ABTest> = new Map();
  private runs: Map<string, ABTestRun[]> = new Map();

  constructor(private prisma: PrismaService) {}

  // 创建 A/B 测试
  async createTest(config: ABTestConfig): Promise<ABTest> {
    const id = `abtest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // 默认流量均分
    const trafficSplit = config.trafficSplit || 
      config.variants.map(() => 1 / config.variants.length);

    const test: ABTest = {
      id,
      name: config.name,
      description: config.description,
      status: ABTestStatus.DRAFT,
      variants: config.variants,
      trafficSplit,
      sampleSize: config.sampleSize || 100,
      currentSamples: 0,
      duration: config.duration,
      metrics: config.metrics,
      createdAt: new Date(),
    };

    this.tests.set(id, test);
    this.runs.set(id, []);

    return test;
  }

  // 启动测试
  async startTest(testId: string): Promise<ABTest> {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');
    if (test.status !== ABTestStatus.DRAFT && test.status !== ABTestStatus.PAUSED) {
      throw new Error('Test cannot be started from current status');
    }

    test.status = ABTestStatus.RUNNING;
    test.startedAt = new Date();
    this.tests.set(testId, test);

    return test;
  }

  // 暂停测试
  async pauseTest(testId: string): Promise<ABTest> {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');

    test.status = ABTestStatus.PAUSED;
    this.tests.set(testId, test);

    return test;
  }

  // 完成测试
  async completeTest(testId: string): Promise<ABTest> {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');

    test.status = ABTestStatus.COMPLETED;
    test.completedAt = new Date();

    // 计算结果
    const results = await this.calculateResults(testId);
    test.results = results;

    // 确定获胜者
    if (results.length > 0) {
      const sorted = [...results].sort((a, b) => b.avgScore - a.avgScore);
      test.winner = sorted[0].variantId;
      test.statisticalSignificance = this.calculateSignificance(results);
    }

    this.tests.set(testId, test);
    return test;
  }

  // 记录运行结果
  async recordRun(testId: string, data: {
    variantId: string;
    input: string;
    output: string;
    scores: Record<string, number>;
    latency: number;
  }): Promise<ABTestRun> {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');
    if (test.status !== ABTestStatus.RUNNING) {
      throw new Error('Test is not running');
    }

    const run: ABTestRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      testId,
      variantId: data.variantId,
      input: data.input,
      output: data.output,
      scores: data.scores,
      latency: data.latency,
      timestamp: new Date(),
    };

    const runs = this.runs.get(testId) || [];
    runs.push(run);
    this.runs.set(testId, runs);

    test.currentSamples = runs.length;

    // 检查是否达到样本量
    if (test.currentSamples >= test.sampleSize) {
      await this.completeTest(testId);
    }

    return run;
  }

  // 选择变体（根据流量分配）
  selectVariant(testId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== ABTestStatus.RUNNING) return null;

    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < test.variants.length; i++) {
      cumulative += test.trafficSplit[i];
      if (random <= cumulative) {
        return test.variants[i];
      }
    }

    return test.variants[test.variants.length - 1];
  }

  // 获取测试列表
  async listTests(status?: ABTestStatus): Promise<ABTest[]> {
    const tests = Array.from(this.tests.values());
    if (status) {
      return tests.filter(t => t.status === status);
    }
    return tests;
  }

  // 获取测试详情
  async getTest(testId: string): Promise<ABTest | undefined> {
    return this.tests.get(testId);
  }

  // 获取测试结果
  async calculateResults(testId: string): Promise<ABTestResult[]> {
    const test = this.tests.get(testId);
    const runs = this.runs.get(testId) || [];
    if (!test) return [];

    const results: ABTestResult[] = [];

    for (const variant of test.variants) {
      const variantRuns = runs.filter(r => r.variantId === variant.id);
      if (variantRuns.length === 0) continue;

      const totalRuns = variantRuns.length;
      const avgLatency = variantRuns.reduce((sum, r) => sum + r.latency, 0) / totalRuns;

      // 计算各指标平均分
      const scores: Record<string, number[]> = {};
      for (const run of variantRuns) {
        for (const [key, value] of Object.entries(run.scores)) {
          if (!scores[key]) scores[key] = [];
          scores[key].push(value);
        }
      }

      const avgScores: Record<string, number> = {};
      for (const [key, values] of Object.entries(scores)) {
        avgScores[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }

      const avgScore = Object.values(avgScores).reduce((a, b) => a + b, 0) / Object.values(avgScores).length || 0;

      // 计算通过率（假设分数 > 0.5 为通过）
      const passedRuns = variantRuns.filter(r => {
        const runAvg = Object.values(r.scores).reduce((a, b) => a + b, 0) / Object.values(r.scores).length;
        return runAvg > 0.5;
      });
      const passRate = passedRuns.length / totalRuns;

      results.push({
        variantId: variant.id,
        variantName: variant.name,
        totalRuns,
        avgScore,
        avgLatency,
        scores: avgScores,
        passRate,
      });
    }

    return results;
  }

  // 计算统计显著性（简化版 Z-test）
  private calculateSignificance(results: ABTestResult[]): number {
    if (results.length < 2) return 0;

    // 简化版：使用效应量作为显著性指标
    const sorted = [...results].sort((a, b) => b.avgScore - a.avgScore);
    const best = sorted[0];
    const second = sorted[1];

    const diff = best.avgScore - second.avgScore;
    const pooledStd = Math.sqrt(
      (Math.pow(best.avgScore * (1 - best.avgScore), 2) + 
       Math.pow(second.avgScore * (1 - second.avgScore), 2)) / 2
    );

    if (pooledStd === 0) return 1;
    
    // Z-score 简化
    const z = diff / pooledStd;
    // 转换为 p-value 近似（简化）
    const pValue = Math.exp(-0.5 * z * z);
    
    return Math.max(0, Math.min(1, 1 - pValue));
  }

  // 对比两个变体
  async compareVariants(testId: string, variantId1: string, variantId2: string): Promise<{
    variant1: ABTestResult | undefined;
    variant2: ABTestResult | undefined;
    improvement: number;
    significant: boolean;
  }> {
    const results = await this.calculateResults(testId);
    const variant1 = results.find(r => r.variantId === variantId1);
    const variant2 = results.find(r => r.variantId === variantId2);

    if (!variant1 || !variant2) {
      throw new Error('Variant not found');
    }

    const improvement = ((variant1.avgScore - variant2.avgScore) / variant2.avgScore) * 100;
    const significant = this.calculateSignificance([variant1, variant2]) > 0.95;

    return {
      variant1,
      variant2,
      improvement,
      significant,
    };
  }

  // 获取运行记录
  async getRuns(testId: string, variantId?: string): Promise<ABTestRun[]> {
    const runs = this.runs.get(testId) || [];
    if (variantId) {
      return runs.filter(r => r.variantId === variantId);
    }
    return runs;
  }
}
