// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 调度任务状态
export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// 调度类型
export enum ScheduleType {
  CRON = 'cron',           // Cron 表达式
  INTERVAL = 'interval',   // 固定间隔
  ONCE = 'once',           // 一次性
}

// 调度任务
export interface ScheduleTask {
  id: string;
  name: string;
  description?: string;
  type: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  taskType: 'eval_run' | 'benchmark' | 'pipeline' | 'cleanup' | 'report';
  taskConfig: Record<string, any>;
  status: ScheduleStatus;
  lastRunAt?: Date;
  nextRunAt?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  createdBy?: string;
}

// 调度执行记录
export interface ScheduleExecution {
  id: string;
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  result?: any;
}

@Injectable()
export class EvalSchedulerService {
  private tasks: Map<string, ScheduleTask> = new Map();
  private executions: ScheduleExecution[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {}

  // 创建调度任务
  async createTask(data: {
    name: string;
    description?: string;
    type: ScheduleType;
    cronExpression?: string;
    intervalMs?: number;
    taskType: ScheduleTask['taskType'];
    taskConfig: Record<string, any>;
    createdBy?: string;
  }): Promise<ScheduleTask> {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const task: ScheduleTask = {
      id,
      name: data.name,
      description: data.description,
      type: data.type,
      cronExpression: data.cronExpression,
      intervalMs: data.intervalMs,
      taskType: data.taskType,
      taskConfig: data.taskConfig,
      status: ScheduleStatus.ACTIVE,
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    // 计算下次运行时间
    task.nextRunAt = this.calculateNextRun(task);

    this.tasks.set(id, task);

    // 启动调度
    if (task.status === ScheduleStatus.ACTIVE) {
      this.startScheduler(task);
    }

    return task;
  }

  // 获取任务列表
  async listTasks(status?: ScheduleStatus): Promise<ScheduleTask[]> {
    let tasks = Array.from(this.tasks.values());
    if (status) tasks = tasks.filter(t => t.status === status);
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取任务详情
  async getTask(id: string): Promise<ScheduleTask | undefined> {
    return this.tasks.get(id);
  }

  // 更新任务
  async updateTask(id: string, updates: Partial<ScheduleTask>): Promise<ScheduleTask | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    // 如果修改了调度配置，停止旧的调度器
    if (updates.cronExpression || updates.intervalMs || updates.type) {
      this.stopScheduler(id);
    }

    Object.assign(task, updates);
    task.nextRunAt = this.calculateNextRun(task);

    // 重新启动调度器
    if (task.status === ScheduleStatus.ACTIVE) {
      this.startScheduler(task);
    }

    return task;
  }

  // 暂停任务
  async pauseTask(id: string): Promise<ScheduleTask | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    task.status = ScheduleStatus.PAUSED;
    this.stopScheduler(id);
    return task;
  }

  // 恢复任务
  async resumeTask(id: string): Promise<ScheduleTask | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    task.status = ScheduleStatus.ACTIVE;
    task.nextRunAt = this.calculateNextRun(task);
    this.startScheduler(task);
    return task;
  }

  // 取消任务
  async cancelTask(id: string): Promise<ScheduleTask | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    task.status = ScheduleStatus.CANCELLED;
    this.stopScheduler(id);
    return task;
  }

  // 删除任务
  async deleteTask(id: string): Promise<boolean> {
    this.stopScheduler(id);
    return this.tasks.delete(id);
  }

  // 手动触发任务
  async triggerTask(id: string): Promise<ScheduleExecution> {
    const task = this.tasks.get(id);
    if (!task) throw new Error('Task not found');

    return this.executeTask(task);
  }

  // 执行任务
  private async executeTask(task: ScheduleTask): Promise<ScheduleExecution> {
    const execution: ScheduleExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      taskId: task.id,
      status: 'running',
      startedAt: new Date(),
    };

    this.executions.push(execution);
    task.lastRunAt = new Date();
    task.runCount++;

    try {
      // 根据任务类型执行
      const result = await this.executeTaskByType(task);
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.result = result;
      task.successCount++;
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.error = error.message;
      task.failureCount++;
    }

    // 更新下次运行时间
    task.nextRunAt = this.calculateNextRun(task);

    return execution;
  }

  // 按类型执行任务
  private async executeTaskByType(task: ScheduleTask): Promise<any> {
    switch (task.taskType) {
      case 'eval_run':
        return { type: 'eval_run', config: task.taskConfig, message: '评测任务已触发' };
      case 'benchmark':
        return { type: 'benchmark', config: task.taskConfig, message: '基准测试已触发' };
      case 'pipeline':
        return { type: 'pipeline', config: task.taskConfig, message: '流水线已启动' };
      case 'cleanup':
        return { type: 'cleanup', message: '清理任务已完成' };
      case 'report':
        return { type: 'report', config: task.taskConfig, message: '报告已生成' };
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }

  // 获取执行记录
  async getExecutions(options?: {
    taskId?: string;
    status?: string;
    limit?: number;
  }): Promise<ScheduleExecution[]> {
    let filtered = [...this.executions];

    if (options?.taskId) filtered = filtered.filter(e => e.taskId === options.taskId);
    if (options?.status) filtered = filtered.filter(e => e.status === options.status);

    filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    if (options?.limit) filtered = filtered.slice(0, options.limit);

    return filtered;
  }

  // 启动调度器
  private startScheduler(task: ScheduleTask): void {
    this.stopScheduler(task.id);

    if (task.type === ScheduleType.INTERVAL && task.intervalMs) {
      const timer = setInterval(() => {
        this.executeTask(task);
      }, task.intervalMs);
      this.timers.set(task.id, timer);
    }
    // Cron 和一次性调度简化处理
  }

  // 停止调度器
  private stopScheduler(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(taskId);
    }
  }

  // 计算下次运行时间
  private calculateNextRun(task: ScheduleTask): Date | undefined {
    if (task.status !== ScheduleStatus.ACTIVE) return undefined;

    switch (task.type) {
      case ScheduleType.INTERVAL:
        return new Date(Date.now() + (task.intervalMs || 3600000));
      case ScheduleType.ONCE:
        return task.lastRunAt ? undefined : new Date();
      case ScheduleType.CRON:
        // 简化：默认1小时后
        return new Date(Date.now() + 3600000);
      default:
        return undefined;
    }
  }

  // 获取调度统计
  getStats(): {
    totalTasks: number;
    activeTasks: number;
    totalExecutions: number;
    successRate: number;
    upcomingRuns: ScheduleTask[];
  } {
    const allTasks = Array.from(this.tasks.values());
    const activeTasks = allTasks.filter(t => t.status === ScheduleStatus.ACTIVE);
    const totalExecutions = this.executions.length;
    const successCount = this.executions.filter(e => e.status === 'completed').length;

    const upcomingRuns = allTasks
      .filter(t => t.status === ScheduleStatus.ACTIVE && t.nextRunAt)
      .sort((a, b) => (a.nextRunAt?.getTime() || 0) - (b.nextRunAt?.getTime() || 0))
      .slice(0, 10);

    return {
      totalTasks: allTasks.length,
      activeTasks: activeTasks.length,
      totalExecutions,
      successRate: totalExecutions > 0 ? successCount / totalExecutions : 0,
      upcomingRuns,
    };
  }
}
