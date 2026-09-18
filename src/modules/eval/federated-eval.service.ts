// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 联邦学习类型
export enum FederatedType {
  HORIZONTAL = 'horizontal',     // 横向联邦（样本不同，特征相同）
  VERTICAL = 'vertical',         // 纵向联邦（特征不同，样本相同）
  TRANSFER = 'transfer',         // 迁移联邦
}

// 聚合策略
export enum AggregationStrategy {
  FEDAVG = 'fedavg',             // FedAvg
  FEDPROX = 'fedprox',           // FedProx
  SCAFFOLD = 'scaffold',         // SCAFFOLD
  FEDSGD = 'fedsgd',             // FedSGD
}

// 联邦评测任务
export interface FederatedEvalTask {
  id: string;
  name: string;
  description?: string;
  type: FederatedType;
  aggregationStrategy: AggregationStrategy;
  participants: Array<{
    id: string;
    name: string;
    dataSize: number;
    dataDistribution: Record<string, number>;
    status: 'online' | 'offline' | 'training' | 'idle';
    localMetrics?: Record<string, number>;
  }>;
  config: {
    rounds: number;
    localEpochs: number;
    batchSize: number;
    learningRate: number;
    fractionFit: number;
    minAvailableClients: number;
  };
  globalModel: {
    id: string;
    version: number;
    metrics: Record<string, number>;
    parameters?: any;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentRound: number;
  roundHistory: Array<{
    round: number;
    globalMetrics: Record<string, number>;
    participantUpdates: number;
    duration: number;
  }>;
  createdAt: Date;
  createdBy: string;
}

// 联邦评测指标
export interface FederatedMetrics {
  globalAccuracy: number;
  globalLoss: number;
  fairnessIndex: number;
  communicationCost: number;
  privacyLeakage: number;
  convergenceSpeed: number;
}

// 隐私保护配置
export interface PrivacyConfig {
  differentialPrivacy: {
    enabled: boolean;
    epsilon: number;
    delta: number;
  };
  secureAggregation: {
    enabled: boolean;
    threshold: number;
  };
  homomorphicEncryption: {
    enabled: boolean;
    keySize: number;
  };
}

@Injectable()
export class FederatedEvalService {
  private tasks: Map<string, FederatedEvalTask> = new Map();
  private privacyConfigs: Map<string, PrivacyConfig> = new Map();

  constructor() {}

  // 创建联邦评测任务
  async createTask(data: {
    name: string;
    description?: string;
    type: FederatedType;
    aggregationStrategy: AggregationStrategy;
    participants: Array<{
      id: string;
      name: string;
      dataSize: number;
      dataDistribution: Record<string, number>;
    }>;
    config: FederatedEvalTask['config'];
    createdBy: string;
  }): Promise<FederatedEvalTask> {
    const id = `fed_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const participants = data.participants.map(p => ({
      ...p,
      status: 'idle' as const,
    }));

    const task: FederatedEvalTask = {
      id,
      name: data.name,
      description: data.description,
      type: data.type,
      aggregationStrategy: data.aggregationStrategy,
      participants,
      config: data.config,
      globalModel: {
        id: `model_${id}_v0`,
        version: 0,
        metrics: {},
      },
      status: 'pending',
      currentRound: 0,
      roundHistory: [],
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    this.tasks.set(id, task);

    // 初始化默认隐私配置
    this.privacyConfigs.set(id, {
      differentialPrivacy: { enabled: false, epsilon: 1.0, delta: 1e-5 },
      secureAggregation: { enabled: true, threshold: 3 },
      homomorphicEncryption: { enabled: false, keySize: 2048 },
    });

    return task;
  }

  // 执行联邦评测
  async execute(taskId: string): Promise<FederatedEvalTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'running';

    try {
      for (let round = 1; round <= task.config.rounds; round++) {
        task.currentRound = round;
        const startTime = Date.now();

        // 选择参与方
        const selectedCount = Math.ceil(task.participants.length * task.config.fractionFit);
        const selectedParticipants = task.participants.slice(0, selectedCount);

        // 模拟本地训练
        for (const participant of selectedParticipants) {
          participant.status = 'training';
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // 生成本地指标
          participant.localMetrics = {
            accuracy: 0.7 + Math.random() * 0.2 + round * 0.01,
            loss: Math.max(0.1, 0.8 - round * 0.05 + Math.random() * 0.1),
          };
          participant.status = 'idle';
        }

        // 聚合模型
        const globalMetrics = this.aggregateModels(task.aggregationStrategy, selectedParticipants);
        
        // 记录轮次历史
        const duration = Date.now() - startTime;
        task.roundHistory.push({
          round,
          globalMetrics,
          participantUpdates: selectedParticipants.length,
          duration,
        });

        // 更新全局模型
        task.globalModel.version = round;
        task.globalModel.metrics = globalMetrics;
      }

      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
    }

    return task;
  }

  // 聚合模型
  private aggregateModels(
    strategy: AggregationStrategy,
    participants: FederatedEvalTask['participants'],
  ): Record<string, number> {
    const metrics: Record<string, number> = { accuracy: 0, loss: 0 };
    const totalSize = participants.reduce((sum, p) => sum + p.dataSize, 0);

    switch (strategy) {
      case AggregationStrategy.FEDAVG:
        // 加权平均
        for (const p of participants) {
          const weight = p.dataSize / totalSize;
          metrics.accuracy += (p.localMetrics?.accuracy || 0) * weight;
          metrics.loss += (p.localMetrics?.loss || 0) * weight;
        }
        break;

      case AggregationStrategy.FEDPROX:
        // FedProx（简化）
        for (const p of participants) {
          const weight = p.dataSize / totalSize;
          metrics.accuracy += (p.localMetrics?.accuracy || 0) * weight;
          metrics.loss += (p.localMetrics?.loss || 0) * weight;
        }
        // 添加近端项
        metrics.loss *= 1.05;
        break;

      case AggregationStrategy.SCAFFOLD:
        // SCAFFOLD（简化）
        for (const p of participants) {
          const weight = p.dataSize / totalSize;
          metrics.accuracy += (p.localMetrics?.accuracy || 0) * weight;
          metrics.loss += (p.localMetrics?.loss || 0) * weight;
        }
        break;

      case AggregationStrategy.FEDSGD:
        // FedSGD
        for (const p of participants) {
          const weight = p.dataSize / totalSize;
          metrics.accuracy += (p.localMetrics?.accuracy || 0) * weight;
          metrics.loss += (p.localMetrics?.loss || 0) * weight;
        }
        break;
    }

    return metrics;
  }

  // 获取任务列表
  async listTasks(status?: string): Promise<FederatedEvalTask[]> {
    let tasks = Array.from(this.tasks.values());
    if (status) tasks = tasks.filter(t => t.status === status);
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取任务详情
  async getTask(id: string): Promise<FederatedEvalTask | undefined> {
    return this.tasks.get(id);
  }

  // 获取轮次历史
  async getRoundHistory(taskId: string): Promise<FederatedEvalTask['roundHistory']> {
    const task = this.tasks.get(taskId);
    return task?.roundHistory || [];
  }

  // 获取参与方状态
  async getParticipantStatus(taskId: string): Promise<FederatedEvalTask['participants']> {
    const task = this.tasks.get(taskId);
    return task?.participants || [];
  }

  // 更新参与方状态
  async updateParticipantStatus(
    taskId: string,
    participantId: string,
    status: FederatedEvalTask['participants'][0]['status'],
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const participant = task.participants.find(p => p.id === participantId);
    if (!participant) throw new Error('Participant not found');

    participant.status = status;
  }

  // 获取联邦评测指标
  async getFederatedMetrics(taskId: string): Promise<FederatedMetrics> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const globalMetrics = task.globalModel.metrics;
    
    // 计算公平性指数（参与方准确率标准差）
    const accuracies = task.participants
      .map(p => p.localMetrics?.accuracy || 0)
      .filter(a => a > 0);
    const meanAccuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - meanAccuracy, 2), 0) / accuracies.length;
    const fairnessIndex = 1 / (1 + Math.sqrt(variance));

    return {
      globalAccuracy: globalMetrics.accuracy || 0,
      globalLoss: globalMetrics.loss || 0,
      fairnessIndex,
      communicationCost: task.roundHistory.reduce((sum, r) => sum + r.participantUpdates * 100, 0),
      privacyLeakage: this.calculatePrivacyLeakage(taskId),
      convergenceSpeed: task.roundHistory.length > 0
        ? task.roundHistory.length / task.roundHistory.reduce((sum, r) => sum + r.duration, 0) * 1000
        : 0,
    };
  }

  // 计算隐私泄露风险
  private calculatePrivacyLeakage(taskId: string): number {
    const config = this.privacyConfigs.get(taskId);
    if (!config) return 0.5;

    let leakage = 0.5;
    if (config.differentialPrivacy.enabled) leakage *= 0.5;
    if (config.secureAggregation.enabled) leakage *= 0.7;
    if (config.homomorphicEncryption.enabled) leakage *= 0.6;

    return leakage;
  }

  // 设置隐私配置
  async setPrivacyConfig(taskId: string, config: PrivacyConfig): Promise<void> {
    this.privacyConfigs.set(taskId, config);
  }

  // 获取隐私配置
  async getPrivacyConfig(taskId: string): Promise<PrivacyConfig | undefined> {
    return this.privacyConfigs.get(taskId);
  }

  // 获取联邦类型
  getFederatedTypes(): Array<{ id: FederatedType; name: string; description: string }> {
    return [
      { id: FederatedType.HORIZONTAL, name: '横向联邦', description: '样本不同，特征相同' },
      { id: FederatedType.VERTICAL, name: '纵向联邦', description: '特征不同，样本相同' },
      { id: FederatedType.TRANSFER, name: '迁移联邦', description: '跨域迁移学习' },
    ];
  }

  // 获取聚合策略
  getAggregationStrategies(): Array<{ id: AggregationStrategy; name: string; description: string }> {
    return [
      { id: AggregationStrategy.FEDAVG, name: 'FedAvg', description: '联邦平均，最常用的聚合策略' },
      { id: AggregationStrategy.FEDPROX, name: 'FedProx', description: '带近端项的联邦学习' },
      { id: AggregationStrategy.SCAFFOLD, name: 'SCAFFOLD', description: '使用控制变量减少异构性' },
      { id: AggregationStrategy.FEDSGD, name: 'FedSGD', description: '联邦随机梯度下降' },
    ];
  }

  // 获取联邦评测统计
  async getFederatedStats(): Promise<{
    totalTasks: number;
    activeTasks: number;
    totalParticipants: number;
    avgRounds: number;
  }> {
    const tasks = Array.from(this.tasks.values());
    return {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.status === 'running').length,
      totalParticipants: tasks.reduce((sum, t) => sum + t.participants.length, 0),
      avgRounds: tasks.length > 0
        ? tasks.reduce((sum, t) => sum + t.config.rounds, 0) / tasks.length
        : 0,
    };
  }
}
