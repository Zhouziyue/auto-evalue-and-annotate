import { Module } from '@nestjs/common';
import { EvalService } from './eval.service';

@Module({
  providers: [EvalService],
  exports: [EvalService],
})
export class EvalModule {}
