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
import { LLMJudgeService } from './llm-judge.service';
import { GuardrailsService } from './guardrails.service';
import { ABTestService } from './ab-test.service';
import { PromptOptimizationService } from './prompt-optimization.service';
import { CostTrackingService } from './cost-tracking.service';
import { BenchmarkService } from './benchmark.service';
import { EloRatingService } from './elo-rating.service';
import { RegressionDetectionService } from './regression-detection.service';
import { EvalSnapshotService } from './eval-snapshot.service';
import { SemanticCacheService } from './semantic-cache.service';
import { EvalTemplateService } from './eval-template.service';
import { WebhookService } from './webhook.service';
import { EvalSchedulerService } from './eval-scheduler.service';
import { MetricsAggregationService } from './metrics-aggregation.service';
import { OnlineEvalService } from './online-eval.service';
import { SyntheticDataService } from './synthetic-data.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { DataLineageService } from './data-lineage.service';
import { ModelComparisonService } from './model-comparison.service';
import { AlertRuleService } from './alert-rule.service';
import { PermissionService } from './permission.service';
import { DatasetSamplingService } from './dataset-sampling.service';
import { VisualizationService } from './visualization.service';
import { EvalConfigService } from './config.service';
import { ResultSearchService } from './result-search.service';
import { MultiTenantService } from './multi-tenant.service';
import { EvalCacheService } from './eval-cache.service';
import { PromptVersionService } from './prompt-version.service';
import { EvalReplayService } from './eval-replay.service';
import { ExperimentTrackingService } from './experiment-tracking.service';
import { DataAnonymizationService } from './data-anonymization.service';
import { RateLimitingService } from './rate-limiting.service';
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
    LLMJudgeService,
    GuardrailsService,
    ABTestService,
    PromptOptimizationService,
    CostTrackingService,
    BenchmarkService,
    EloRatingService,
    RegressionDetectionService,
    EvalSnapshotService,
    SemanticCacheService,
    EvalTemplateService,
    WebhookService,
    EvalSchedulerService,
    MetricsAggregationService,
    OnlineEvalService,
    SyntheticDataService,
    WorkflowEngineService,
    DataLineageService,
    ModelComparisonService,
    AlertRuleService,
    PermissionService,
    DatasetSamplingService,
    VisualizationService,
    EvalConfigService,
    ResultSearchService,
    MultiTenantService,
    EvalCacheService,
    PromptVersionService,
    EvalReplayService,
    ExperimentTrackingService,
    DataAnonymizationService,
    RateLimitingService,
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
    LLMJudgeService,
    GuardrailsService,
    ABTestService,
    PromptOptimizationService,
    CostTrackingService,
    BenchmarkService,
    EloRatingService,
    RegressionDetectionService,
    EvalSnapshotService,
    SemanticCacheService,
    EvalTemplateService,
    WebhookService,
    EvalSchedulerService,
    MetricsAggregationService,
    OnlineEvalService,
    SyntheticDataService,
    WorkflowEngineService,
    DataLineageService,
    ModelComparisonService,
    AlertRuleService,
    PermissionService,
    DatasetSamplingService,
    VisualizationService,
    EvalConfigService,
    ResultSearchService,
    MultiTenantService,
    EvalCacheService,
    PromptVersionService,
    EvalReplayService,
    ExperimentTrackingService,
    DataAnonymizationService,
    RateLimitingService,
  ],
})
export class EvalModule {}
