// @ts-nocheck
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PipelineOrchestrationService } from './pipeline-orchestration.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: PipelineOrchestrationService,
  ) {}

  async onModuleInit() {
    await this.loadScheduledPipelines();
  }

  onModuleDestroy() {
    // 清理所有定时器
    for (const [id, timer] of this.timers) {
      clearInterval(timer);
      this.logger.log(`清理定时任务: ${id}`);
    }
    this.timers.clear();
  }

  // 加载所有已配置定时的流水线
  private async loadScheduledPipelines() {
    try {
      const pipelines = await this.prisma.pipeline.findMany({
        where: {
          cronExpression: { not: null },
        },
      });

      for (const pipeline of pipelines) {
        if (pipeline.cronExpression) {
          this.registerCronJob(pipeline.id, pipeline.cronExpression, pipeline.name);
        }
      }

      this.logger.log(`已加载 ${this.timers.size} 个定时评测任务`);
    } catch (e) {
      this.logger.error('加载定时任务失败', e);
    }
  }

  // 注册 cron 任务（简化实现：使用 setInterval 模拟）
  registerCronJob(pipelineId: string, cronExpression: string, pipelineName: string) {
    // 清理已有任务
    this.unregisterCronJob(pipelineId);

    // 解析 cron 间隔（简化：支持 "*/N * * * *" 格式，N分钟执行一次）
    const intervalMs = this.parseCronToMs(cronExpression);
    if (!intervalMs) {
      this.logger.warn(`无法解析 cron 表达式: ${cronExpression}`);
      return;
    }

    const timer = setInterval(async () => {
      try {
        this.logger.log(`定时触发流水线: ${pipelineName}`);
        await this.pipelineService.runPipeline(pipelineId, 'scheduler');
      } catch (e) {
        this.logger.error(`定时执行失败: ${e.message}`);
      }
    }, intervalMs);

    this.timers.set(pipelineId, timer);
    this.logger.log(`注册定时任务: ${pipelineName}, 间隔 ${intervalMs / 60000} 分钟`);
  }

  // 取消定时任务
  unregisterCronJob(pipelineId: string) {
    const timer = this.timers.get(pipelineId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(pipelineId);
    }
  }

  // 更新定时配置
  async updateSchedule(pipelineId: string, cronExpression: string | null) {
    await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: { cronExpression },
    });

    if (cronExpression) {
      const pipeline = await this.prisma.pipeline.findUnique({ where: { id: pipelineId } });
      this.registerCronJob(pipelineId, cronExpression, pipeline?.name || pipelineId);
    } else {
      this.unregisterCronJob(pipelineId);
    }

    return { success: true };
  }

  // 简化 cron 解析：支持 "*/N * * * *" 格式
  private parseCronToMs(cron: string): number | null {
    const match = cron.match(/^\*\/(\d+)\s/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      return minutes * 60 * 1000;
    }
    // 默认 60 分钟
    return 60 * 60 * 1000;
  }
}
