import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineOrchestrationService } from './pipeline-orchestration.service';
import { PipelineOrchestrationController } from './pipeline-orchestration.controller';

@Module({
  controllers: [PipelineOrchestrationController],
  providers: [PipelineService, PipelineOrchestrationService],
  exports: [PipelineService, PipelineOrchestrationService],
})
export class PipelineModule {}
