import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineOrchestrationService } from './pipeline-orchestration.service';
import { PipelineOrchestrationController } from './pipeline-orchestration.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  controllers: [PipelineOrchestrationController],
  providers: [PipelineService, PipelineOrchestrationService, SchedulerService],
  exports: [PipelineService, PipelineOrchestrationService, SchedulerService],
})
export class PipelineModule {}
