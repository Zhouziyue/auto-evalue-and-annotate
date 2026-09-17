import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import * as Redis from 'ioredis-mock';

import { PrismaModule } from './common/prisma/prisma.module';
import { SkillModule } from './modules/skill/skill.module';
import { AgentModule } from './modules/agent/agent.module';
import { DatasetModule } from './modules/dataset/dataset.module';
import { ExecutorModule } from './modules/executor/executor.module';
import { EvalModule } from './modules/eval/eval.module';
import { AnnotationModule } from './modules/annotation/annotation.module';
import { FixerModule } from './modules/fixer/fixer.module';
import { ReportModule } from './modules/report/report.module';
import { RegressionModule } from './modules/regression/regression.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 定时任务
    ScheduleModule.forRoot(),

    // 任务队列（使用内存 Redis mock，无需外部 Redis 服务）
    BullModule.forRoot({
      createClient: () => new (Redis as any)(),
    }),

    // 公共模块
    PrismaModule,

    // 业务模块
    SkillModule,
    AgentModule,
    DatasetModule,
    ExecutorModule,
    EvalModule,
    AnnotationModule,
    FixerModule,
    ReportModule,
    RegressionModule,
    PipelineModule,
  ],
})
export class AppModule {}
