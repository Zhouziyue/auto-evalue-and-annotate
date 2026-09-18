import { Module } from '@nestjs/common';
import { AnnotationService } from './annotation.service';
import { AnnotationConsistencyService } from './annotation-consistency.service';
import { AnnotationConsistencyController } from './annotation-consistency.controller';

@Module({
  controllers: [AnnotationConsistencyController],
  providers: [AnnotationService, AnnotationConsistencyService],
  exports: [AnnotationService, AnnotationConsistencyService],
})
export class AnnotationModule {}
