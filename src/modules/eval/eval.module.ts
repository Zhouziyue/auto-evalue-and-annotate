import { Module } from '@nestjs/common';
import { EvalService } from './eval.service';
import { MetricsService } from './metrics.service';
import { MatrixEvalService } from './matrix-eval.service';
import { TraceService } from './trace.service';
import { RedTeamService } from './redteam.service';
import { YamlImportService } from './yaml-import.service';
import { EvalController } from './eval.controller';

@Module({
  controllers: [EvalController],
  providers: [
    EvalService,
    MetricsService,
    MatrixEvalService,
    TraceService,
    RedTeamService,
    YamlImportService,
  ],
  exports: [
    EvalService,
    MetricsService,
    MatrixEvalService,
    TraceService,
    RedTeamService,
    YamlImportService,
  ],
})
export class EvalModule {}
