// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 任务状态
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// 任务类型
export enum TaskType {
  EVALUATION = 'evaluation',       // 评测任务
  DATA_PREP = 'data_prep',         // 数据准备
  MODEL_LOAD = 'model_load',       // 模型加载
  RESULT_AGG = 'result_agg',       // 结果聚合
  REPORT_GEN = 'report_gen',       // 报告生成
  NOTIFICATION = 'notification',   // 通知
  CLEANUP = 'cleanup',             // 清理
}

// 任务节点
export interface TaskNode {
  id: string;
  name: string;
  type: TaskType;
  config: Record<string, any>;
  dependencies: string[];
  status: TaskStatus;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

// 任务编排
export interface TaskOrchestration {
  id: string;
  name: string;
  description?: string;
  nodes: TaskNode[];
  status: TaskStatus;
  config: {
    parallelism?: number;
    retryCount?: number;
    timeout?: number;
    onFailure?: 'stop' | 'continue' | 'retry';
  };
  context: Record<string, any>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
}

// 任务执行日志
export interface TaskLog {
  id: string;
  orchestrationId: string;
  nodeId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class TaskOrchestrationService {
  private orchestrations: Map<string, TaskOrchestration> = new Map();
  private logs: TaskLog[] = [];

  constructor() {}

  // 创建任务编排
  async createOrchestration(data: {
    name: string;
    description?: string;
    nodes: Array<{
      name: string;
      type: TaskType;
      config?: Record<string, any>;
      dependencies?: string[];
    }>;
    config?: TaskOrchestration['config'];
    createdBy: string;
  }): Promise<TaskOrchestration> {
    const id = `orch_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const nodes: TaskNode[] = data.nodes.map((n, index) => ({
      id: `node_${index}_${Math.random().toString(36).slice(2)}`,
      name: n.name,
      type: n.type,
      config: n.config || {},
      dependencies: n.dependencies || [],
      status: TaskStatus.PENDING,
    }));

    const orchestration: TaskOrchestration = {
      id,
      name: data.name,
      description: data.description,
      nodes,
      status: TaskStatus.PENDING,
      config: data.config || {},
      context: {},
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    this.orchestrations.set(id, orchestration);
    return orchestration;
  }

  // 执行任务编排
  async execute(orchestrationId: string): Promise<TaskOrchestration> {
    const orchestration = this.orchestrations.get(orchestrationId);
    if (!orchestration) throw new Error('Orchestration not found');

    orchestration.status = TaskStatus.RUNNING;
    orchestration.startedAt = new Date();

    this.addLog(orchestrationId, '', 'info', '开始执行任务编排');

    try {
      // 按依赖关系执行
      const executed = new Set<string>();
      const maxIterations = orchestration.nodes.length * 2;
      let iterations = 0;

      while (executed.size < orchestration.nodes.length && iterations < maxIterations) {
        iterations++;
        const readyNodes = orchestration.nodes.filter(
          n => !executed.has(n.id) &&
            n.status === TaskStatus.PENDING &&
            n.dependencies.every(depId => {
              const dep = orchestration.nodes.find(n => n.id === depId);
              return dep && dep.status === TaskStatus.COMPLETED;
            }),
        );

        if (readyNodes.length === 0) break;

        // 并行执行就绪节点
        const parallelism = orchestration.config.parallelism || 3;
        const batch = readyNodes.slice(0, parallelism);

        await Promise.all(batch.map(node => this.executeNode(orchestration, node)));

        batch.forEach(n => executed.add(n.id));
      }

      // 检查是否所有节点完成
      const allCompleted = orchestration.nodes.every(n => n.status === TaskStatus.COMPLETED);
      orchestration.status = allCompleted ? TaskStatus.COMPLETED : TaskStatus.FAILED;
    } catch (error) {
      orchestration.status = TaskStatus.FAILED;
      this.addLog(orchestrationId, '', 'error', `执行失败: ${error.message}`);
    }

    orchestration.completedAt = new Date();
    return orchestration;
  }

  // 执行单个节点
  private async executeNode(orchestration: TaskOrchestration, node: TaskNode): Promise<void> {
    node.status = TaskStatus.RUNNING;
    node.startedAt = new Date();

    this.addLog(orchestration.id, node.id, 'info', `开始执行节点: ${node.name}`);

    try {
      // 模拟执行
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      // 根据类型执行不同逻辑
      switch (node.type) {
        case TaskType.EVALUATION:
          node.result = { metrics: { accuracy: Math.random() * 0.3 + 0.6 } };
          break;
        case TaskType.DATA_PREP:
          node.result = { preparedCount: Math.floor(Math.random() * 1000) + 100 };
          break;
        case TaskType.MODEL_LOAD:
          node.result = { modelLoaded: true };
          break;
        case TaskType.RESULT_AGG:
          node.result = { aggregated: true };
          break;
        case TaskType.REPORT_GEN:
          node.result = { reportGenerated: true };
          break;
        case TaskType.NOTIFICATION:
          node.result = { notified: true };
          break;
        case TaskType.CLEANUP:
          node.result = { cleaned: true };
          break;
      }

      node.status = TaskStatus.COMPLETED;
      node.completedAt = new Date();
      node.duration = node.completedAt.getTime() - node.startedAt.getTime();

      this.addLog(orchestration.id, node.id, 'info', `节点执行成功: ${node.name}`);
    } catch (error) {
      node.status = TaskStatus.FAILED;
      node.error = error.message;
      node.completedAt = new Date();
      node.duration = node.completedAt.getTime() - node.startedAt.getTime();

      this.addLog(orchestration.id, node.id, 'error', `节点执行失败: ${node.name} - ${error.message}`);

      // 根据策略处理失败
      if (orchestration.config.onFailure === 'stop') {
        throw error;
      }
    }
  }

  // 添加日志
  private addLog(
    orchestrationId: string,
    nodeId: string,
    level: TaskLog['level'],
    message: string,
    metadata?: Record<string, any>,
  ): void {
    const log: TaskLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      orchestrationId,
      nodeId,
      level,
      message,
      metadata,
      timestamp: new Date(),
    };
    this.logs.push(log);
  }

  // 获取编排列表
  async listOrchestrations(status?: TaskStatus): Promise<TaskOrchestration[]> {
    let orchestrations = Array.from(this.orchestrations.values());
    if (status) orchestrations = orchestrations.filter(o => o.status === status);
    return orchestrations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取编排详情
  async getOrchestration(id: string): Promise<TaskOrchestration | undefined> {
    return this.orchestrations.get(id);
  }

  // 取消编排
  async cancelOrchestration(id: string): Promise<TaskOrchestration> {
    const orchestration = this.orchestrations.get(id);
    if (!orchestration) throw new Error('Orchestration not found');

    orchestration.status = TaskStatus.CANCELLED;
    orchestration.nodes.forEach(n => {
      if (n.status === TaskStatus.PENDING || n.status === TaskStatus.RUNNING) {
        n.status = TaskStatus.CANCELLED;
      }
    });

    this.addLog(id, '', 'info', '任务编排已取消');
    return orchestration;
  }

  // 重试失败节点
  async retryFailedNodes(orchestrationId: string): Promise<TaskOrchestration> {
    const orchestration = this.orchestrations.get(orchestrationId);
    if (!orchestration) throw new Error('Orchestration not found');

    const failedNodes = orchestration.nodes.filter(n => n.status === TaskStatus.FAILED);
    for (const node of failedNodes) {
      node.status = TaskStatus.PENDING;
      node.error = undefined;
      node.result = undefined;
    }

    orchestration.status = TaskStatus.PENDING;
    return this.execute(orchestrationId);
  }

  // 获取执行日志
  async getLogs(orchestrationId: string, nodeId?: string): Promise<TaskLog[]> {
    let filtered = this.logs.filter(l => l.orchestrationId === orchestrationId);
    if (nodeId) filtered = filtered.filter(l => l.nodeId === nodeId);
    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // 获取任务类型
  getTaskTypes(): Array<{ id: TaskType; name: string; description: string }> {
    return [
      { id: TaskType.EVALUATION, name: '评测任务', description: '执行模型评测' },
      { id: TaskType.DATA_PREP, name: '数据准备', description: '准备评测数据' },
      { id: TaskType.MODEL_LOAD, name: '模型加载', description: '加载评测模型' },
      { id: TaskType.RESULT_AGG, name: '结果聚合', description: '聚合评测结果' },
      { id: TaskType.REPORT_GEN, name: '报告生成', description: '生成评测报告' },
      { id: TaskType.NOTIFICATION, name: '通知', description: '发送通知' },
      { id: TaskType.CLEANUP, name: '清理', description: '清理资源' },
    ];
  }

  // 获取编排统计
  async getOrchestrationStats(): Promise<{
    totalOrchestrations: number;
    runningCount: number;
    completedCount: number;
    failedCount: number;
    avgDuration: number;
  }> {
    const orchestrations = Array.from(this.orchestrations.values());
    const completed = orchestrations.filter(o => o.status === TaskStatus.COMPLETED);

    return {
      totalOrchestrations: orchestrations.length,
      runningCount: orchestrations.filter(o => o.status === TaskStatus.RUNNING).length,
      completedCount: completed.length,
      failedCount: orchestrations.filter(o => o.status === TaskStatus.FAILED).length,
      avgDuration: completed.length > 0
        ? completed.reduce((sum, o) => {
            const duration = o.completedAt && o.startedAt
              ? o.completedAt.getTime() - o.startedAt.getTime()
              : 0;
            return sum + duration;
          }, 0) / completed.length
        : 0,
    };
  }
}
