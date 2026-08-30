import { Module } from '@nestjs/common';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';
import { AiGenerationService } from './ai-generation.service';

@Module({
  controllers: [DatasetController],
  providers: [DatasetService, AiGenerationService],
  exports: [DatasetService, AiGenerationService],
})
export class DatasetModule {}
