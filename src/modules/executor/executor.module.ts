import { Module } from '@nestjs/common';
import { ExecutorService } from './executor.service';

@Module({
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
