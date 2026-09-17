import { Module } from '@nestjs/common';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';
import { AiGenerationService } from './ai-generation.service';
import { SyntheticDatasetService } from './synthetic-dataset.service';

@Module({
  controllers: [DatasetController],
  providers: [
    DatasetService,
    AiGenerationService,
    SyntheticDatasetService,
  ],
  exports: [
    DatasetService,
    AiGenerationService,
    SyntheticDatasetService,
  ],
})
export class DatasetModule {}
