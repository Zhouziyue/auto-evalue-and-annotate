import { Module } from '@nestjs/common';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';
import { AiGenerationService } from './ai-generation.service';
import { SyntheticDatasetService } from './synthetic-dataset.service';
import { DatasetVersionService } from './dataset-version.service';

@Module({
  controllers: [DatasetController],
  providers: [
    DatasetService,
    AiGenerationService,
    SyntheticDatasetService,
    DatasetVersionService,
  ],
  exports: [
    DatasetService,
    AiGenerationService,
    SyntheticDatasetService,
    DatasetVersionService,
  ],
})
export class DatasetModule {}
