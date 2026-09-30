import { Module } from '@nestjs/common';
import { AnnotationService } from './annotation.service';
import { AnnotationConsistencyService } from './annotation-consistency.service';
import { AnnotationConsistencyController } from './annotation-consistency.controller';
import { AnnotationWorkflowController } from './annotation-workflow.controller';

@Module({
  controllers: [AnnotationConsistencyController, AnnotationWorkflowController],
  providers: [AnnotationService, AnnotationConsistencyService],
  exports: [AnnotationService, AnnotationConsistencyService],
})
export class AnnotationModule {}
