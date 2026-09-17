import { Module } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [AgentModule],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
