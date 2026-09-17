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
import { ObservabilityService } from './observability.service';
import { CapabilityEvalService } from './capability-eval.service';
import { ContaminationCheckService } from './contamination-check.service';
import { ExperimentService } from './experiment.service';
import { QualityGateService } from './quality-gate.service';
import { FeedbackService } from './feedback.service';
import { MultimodalEvalService } from './multimodal-eval.service';
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
    ObservabilityService,
    CapabilityEvalService,
    ContaminationCheckService,
    ExperimentService,
    QualityGateService,
    FeedbackService,
    MultimodalEvalService,
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
    ObservabilityService,
    CapabilityEvalService,
    ContaminationCheckService,
    ExperimentService,
    QualityGateService,
    FeedbackService,
    MultimodalEvalService,
  ],
})
export class EvalModule {}
