import { Module } from '@nestjs/common';
import { EvalService } from './eval.service';
import { MetricsService } from './metrics.service';
import { MatrixEvalService } from './matrix-eval.service';
import { TraceService } from './trace.service';
import { RedTeamService } from './redteam.service';
import { YamlImportService } from './yaml-import.service';
import { RAGMetricsService } from './rag-metrics.service';
import { ConversationalMetricsService } from './conversational-metrics.service';
import { LeaderboardService } from './leaderboard.service';
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
    RAGMetricsService,
    ConversationalMetricsService,
    LeaderboardService,
  ],
  exports: [
    EvalService,
    MetricsService,
    MatrixEvalService,
    TraceService,
    RedTeamService,
    YamlImportService,
    RAGMetricsService,
    ConversationalMetricsService,
    LeaderboardService,
  ],
})
export class EvalModule {}
