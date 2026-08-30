import { Module } from '@nestjs/common';
import { FixerService } from './fixer.service';

@Module({
  providers: [FixerService],
  exports: [FixerService],
})
export class FixerModule {}
