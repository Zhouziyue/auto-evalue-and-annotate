import { Module } from '@nestjs/common';
import { RegressionService } from './regression.service';

@Module({
  providers: [RegressionService],
  exports: [RegressionService],
})
export class RegressionModule {}
