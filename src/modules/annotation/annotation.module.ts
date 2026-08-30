import { Module } from '@nestjs/common';
import { AnnotationService } from './annotation.service';

@Module({
  providers: [AnnotationService],
  exports: [AnnotationService],
})
export class AnnotationModule {}
