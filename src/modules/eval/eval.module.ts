// @ts-nocheck
import { Module } from '@nestjs/common';
import { EvalController } from './eval.controller';

// ========== 独立服务导入 ==========
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
import { DataAugmentationService } from './data-augmentation.service';
import { MultilingualEvalService } from './multilingual-eval.service';
import { ReportGeneratorService } from './report-generator.service';
import { DataVersioningService } from './data-versioning.service';
import { MetricAttributionService } from './metric-attribution.service';
import { ScenarioManagementService } from './scenario-management.service';
import { DataQualityService } from './data-quality.service';
import { TaskOrchestrationService } from './task-orchestration.service';
import { ResultExplanationService } from './result-explanation.service';
import { AnnotationAssistanceService } from './annotation-assistance.service';
import { ModelDistillationService } from './model-distillation.service';
import { FederatedEvalService } from './federated-eval.service';
import { ModelRegistryService } from './model-registry.service';
import { ComparisonAnalysisService } from './comparison-analysis.service';
import { DataTransformService } from './data-transform.service';
import { EvalSandboxService } from './eval-sandbox.service';
import { FinetuneEvalService } from './finetune-eval.service';
import { KnowledgeBaseEvalService } from './knowledge-base-eval.service';
import { CustomMetricService } from './custom-metric.service';
import { ResultAggregationService } from './result-aggregation.service';
import { TaskTemplateService } from './task-template.service';

// ========== 批量服务数组导入 ==========
import { MODEL_PIPELINE_SERVICES } from './model-pipeline-services';
import { CORE_EXTENDED_SERVICES } from './core-extended-services';
import { STREAMING_SECURITY_SERVICES } from './streaming-security-services';
import { REPORT_STRATEGY_SERVICES } from './report-strategy-services';
import { DIAGNOSIS_ANALYSIS_SERVICES } from './diagnosis-analysis-services';
import { MONITOR_ALERT_SERVICES } from './monitor-alert-services';
import { COMPARE_CLEAN_SERVICES } from './compare-clean-services';
import { STRATEGY_CONFIG_SERVICES } from './strategy-config-services';
import { REPORT_MONITOR_SERVICES } from './report-monitor-services';
import { ALERT_EXTENDED_SERVICES } from './alert-extended-services';
import { OPTIMIZE_SERVICES } from './optimize-services';
import { REPORT_ADVANCED_SERVICES } from './report-advanced-services';
import { MONITOR_ADVANCED_SERVICES } from './monitor-advanced-services';
import { ALERT_ADVANCED_SERVICES } from './alert-advanced-services';

// ========== 独立服务集合 ==========
const CORE_SERVICES = [
  EvalService, MetricsService, MatrixEvalService, TraceService, RedTeamService, YamlImportService,
  RAGMetricsService, ConversationalMetricsService, LeaderboardService, ObservabilityService,
  CapabilityEvalService, ContaminationCheckService, ExperimentService, QualityGateService, FeedbackService,
  MultimodalEvalService, LLMJudgeService, GuardrailsService, ABTestService, PromptOptimizationService,
  CostTrackingService, BenchmarkService, EloRatingService, RegressionDetectionService, EvalSnapshotService,
  SemanticCacheService, EvalTemplateService, WebhookService, EvalSchedulerService, MetricsAggregationService,
  OnlineEvalService, SyntheticDataService, WorkflowEngineService, DataLineageService, ModelComparisonService,
  AlertRuleService, PermissionService, DatasetSamplingService, VisualizationService, EvalConfigService,
  ResultSearchService, MultiTenantService, EvalCacheService, PromptVersionService, EvalReplayService,
  ExperimentTrackingService, DataAnonymizationService, RateLimitingService, DataAugmentationService,
  MultilingualEvalService, ReportGeneratorService, DataVersioningService, MetricAttributionService,
  ScenarioManagementService, DataQualityService, TaskOrchestrationService, ResultExplanationService,
  AnnotationAssistanceService, ModelDistillationService, FederatedEvalService, ModelRegistryService,
  ComparisonAnalysisService, DataTransformService, EvalSandboxService, FinetuneEvalService,
  KnowledgeBaseEvalService, CustomMetricService, ResultAggregationService, TaskTemplateService,
];

// ========== 所有批量服务 ==========
const BATCH_SERVICES = [
  ...MODEL_PIPELINE_SERVICES,
  ...CORE_EXTENDED_SERVICES,
  ...STREAMING_SECURITY_SERVICES,
  ...REPORT_STRATEGY_SERVICES,
  ...DIAGNOSIS_ANALYSIS_SERVICES,
  ...MONITOR_ALERT_SERVICES,
  ...COMPARE_CLEAN_SERVICES,
  ...STRATEGY_CONFIG_SERVICES,
  ...REPORT_MONITOR_SERVICES,
  ...ALERT_EXTENDED_SERVICES,
  ...OPTIMIZE_SERVICES,
  ...REPORT_ADVANCED_SERVICES,
  ...MONITOR_ADVANCED_SERVICES,
  ...ALERT_ADVANCED_SERVICES,
];

// ========== 所有服务 ==========
const ALL_SERVICES = [...CORE_SERVICES, ...BATCH_SERVICES];

@Module({
  controllers: [EvalController],
  providers: [...ALL_SERVICES],
  exports: [...ALL_SERVICES],
})
export class EvalModule {}
