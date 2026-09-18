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
import { ModelVersionService, DataPipelineService, ResultSubscriptionService } from './v1.26-services';
import {
  MetricRegressionService, DataValidationService, ResultShardingService,
  PerformanceAnalysisService, TaskDependencyService, ResultIndexService,
  DataDeduplicationService, InferenceOptimizationService, ResultArchivalService,
  TaskRetryService, ValidationRuleService, ResultMergeService,
  TaskBatchService, DataMigrationService, CanaryReleaseService,
  ResultVisualizationService, TaskSchedulerService, DataSyncService,
  EvalBenchmarkService, ResultComparisonService, DataBackupService,
  AdvancedOrchestrationService, AdvancedTransformService, ModelRoutingService,
  AdvancedAggregationService, TaskMonitoringService, AdvancedCleaningService,
  AdvancedModelEvalService, AdvancedExportService, AdvancedQueueService,
  AdvancedAnnotationService, AdvancedReportService, AdvancedComparisonService,
  AdvancedSubscriptionService, AdvancedPriorityService, AdvancedShardingService,
  AdvancedCacheService, AdvancedRetryService, AdvancedRegistryService,
  AdvancedIndexService, AdvancedValidationService, AdvancedTemplateService,
  AdvancedPipelineService, AdvancedDependencyService, AdvancedArchiveService
} from './batch-services';
import {
  StreamingEvalService, SecurityScanService, EvalGatewayService,
  EvalPluginService, VisualizationEngineService, StressTestService,
  CanaryDeploymentService, DisasterRecoveryService, TenantIsolationService,
  AuditLogService, TraceAnalysisService, DataProfilingService,
  DataMigrationEvalService, ReplayEvalService, SmartDiagnosisService
} from './batch-v2';
import {
  StressReportService, CanaryStrategyService, DisasterDrillService,
  TenantQuotaService, AuditReportService, LinkAnalysisService,
  ProfileAnalysisService, MigrationToolService, ReplayEngineService,
  DiagnosisAdviceService, StressMonitorService, CanaryMonitorService,
  DisasterReportService, TenantBillingService, AuditTrailService
} from './batch-v3';
import {
  LinkDiagnosisService, ProfileReportService, MigrationMonitorService,
  ReplayAnalysisService, DiagnosisReportService, StressAlertService,
  CanaryReportService, DisasterStrategyService, TenantManagementService,
  AuditAnalysisService, LinkReportService, ProfileMonitorService,
  MigrationVerifyService, ReplayDiagnosisService, StressAnalysisService
} from './batch-v4';
import {
  CanaryAnalysisService, DisasterMonitorService, TenantReportService,
  AuditMonitorService, LinkMonitorService, ProfileAlertService,
  MigrationReportService, ReplayReportService, DiagnosisAlertService,
  StressReportAdvService, CanaryAlertService, DisasterReportAdvService,
  TenantAlertService, AuditAlertService, LinkAlertService
} from './batch-v5';
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
    DataAugmentationService,
    MultilingualEvalService,
    ReportGeneratorService,
    DataVersioningService,
    MetricAttributionService,
    ScenarioManagementService,
    DataQualityService,
    TaskOrchestrationService,
    ResultExplanationService,
    AnnotationAssistanceService,
    ModelDistillationService,
    FederatedEvalService,
    ModelRegistryService,
    ComparisonAnalysisService,
    DataTransformService,
    EvalSandboxService,
    FinetuneEvalService,
    KnowledgeBaseEvalService,
    CustomMetricService,
    ResultAggregationService,
    TaskTemplateService,
    ModelVersionService,
    DataPipelineService,
    ResultSubscriptionService,
    MetricRegressionService,
    DataValidationService,
    ResultShardingService,
    PerformanceAnalysisService,
    TaskDependencyService,
    ResultIndexService,
    DataDeduplicationService,
    InferenceOptimizationService,
    ResultArchivalService,
    TaskRetryService,
    ValidationRuleService,
    ResultMergeService,
    TaskBatchService,
    DataMigrationService,
    CanaryReleaseService,
    ResultVisualizationService,
    TaskSchedulerService,
    DataSyncService,
    EvalBenchmarkService,
    ResultComparisonService,
    DataBackupService,
    AdvancedOrchestrationService,
    AdvancedTransformService,
    ModelRoutingService,
    AdvancedAggregationService,
    TaskMonitoringService,
    AdvancedCleaningService,
    AdvancedModelEvalService,
    AdvancedExportService,
    AdvancedQueueService,
    AdvancedAnnotationService,
    AdvancedReportService,
    AdvancedComparisonService,
    AdvancedSubscriptionService,
    AdvancedPriorityService,
    AdvancedShardingService,
    AdvancedCacheService,
    AdvancedRetryService,
    AdvancedRegistryService,
    AdvancedIndexService,
    AdvancedValidationService,
    AdvancedTemplateService,
    AdvancedPipelineService,
    AdvancedDependencyService,
    AdvancedArchiveService,
    // v1.43-v1.47
    StreamingEvalService, SecurityScanService, EvalGatewayService,
    EvalPluginService, VisualizationEngineService, StressTestService,
    CanaryDeploymentService, DisasterRecoveryService, TenantIsolationService,
    AuditLogService, TraceAnalysisService, DataProfilingService,
    DataMigrationEvalService, ReplayEvalService, SmartDiagnosisService,
    // v1.48-v1.52
    StressReportService, CanaryStrategyService, DisasterDrillService,
    TenantQuotaService, AuditReportService, LinkAnalysisService,
    ProfileAnalysisService, MigrationToolService, ReplayEngineService,
    DiagnosisAdviceService, StressMonitorService, CanaryMonitorService,
    DisasterReportService, TenantBillingService, AuditTrailService,
    // v1.53-v1.57
    LinkDiagnosisService, ProfileReportService, MigrationMonitorService,
    ReplayAnalysisService, DiagnosisReportService, StressAlertService,
    CanaryReportService, DisasterStrategyService, TenantManagementService,
    AuditAnalysisService, LinkReportService, ProfileMonitorService,
    MigrationVerifyService, ReplayDiagnosisService, StressAnalysisService,
    // v1.58-v1.62
    CanaryAnalysisService, DisasterMonitorService, TenantReportService,
    AuditMonitorService, LinkMonitorService, ProfileAlertService,
    MigrationReportService, ReplayReportService, DiagnosisAlertService,
    StressReportAdvService, CanaryAlertService, DisasterReportAdvService,
    TenantAlertService, AuditAlertService, LinkAlertService,
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
    DataAugmentationService,
    MultilingualEvalService,
    ReportGeneratorService,
    DataVersioningService,
    MetricAttributionService,
    ScenarioManagementService,
    DataQualityService,
    TaskOrchestrationService,
    ResultExplanationService,
    AnnotationAssistanceService,
    ModelDistillationService,
    FederatedEvalService,
    ModelRegistryService,
    ComparisonAnalysisService,
    DataTransformService,
    EvalSandboxService,
    FinetuneEvalService,
    KnowledgeBaseEvalService,
    CustomMetricService,
    ResultAggregationService,
    TaskTemplateService,
    ModelVersionService,
    DataPipelineService,
    ResultSubscriptionService,
    MetricRegressionService,
    DataValidationService,
    ResultShardingService,
    PerformanceAnalysisService,
    TaskDependencyService,
    ResultIndexService,
    DataDeduplicationService,
    InferenceOptimizationService,
    ResultArchivalService,
    TaskRetryService,
    ValidationRuleService,
    ResultMergeService,
    TaskBatchService,
    DataMigrationService,
    CanaryReleaseService,
    ResultVisualizationService,
    TaskSchedulerService,
    DataSyncService,
    EvalBenchmarkService,
    ResultComparisonService,
    DataBackupService,
    AdvancedOrchestrationService,
    AdvancedTransformService,
    ModelRoutingService,
    AdvancedAggregationService,
    TaskMonitoringService,
    AdvancedCleaningService,
    AdvancedModelEvalService,
    AdvancedExportService,
    AdvancedQueueService,
    AdvancedAnnotationService,
    AdvancedReportService,
    AdvancedComparisonService,
    AdvancedSubscriptionService,
    AdvancedPriorityService,
    AdvancedShardingService,
    AdvancedCacheService,
    AdvancedRetryService,
    AdvancedRegistryService,
    AdvancedIndexService,
    AdvancedValidationService,
    AdvancedTemplateService,
    AdvancedPipelineService,
    AdvancedDependencyService,
    AdvancedArchiveService,
    // v1.43-v1.47
    StreamingEvalService, SecurityScanService, EvalGatewayService,
    EvalPluginService, VisualizationEngineService, StressTestService,
    CanaryDeploymentService, DisasterRecoveryService, TenantIsolationService,
    AuditLogService, TraceAnalysisService, DataProfilingService,
    DataMigrationEvalService, ReplayEvalService, SmartDiagnosisService,
    // v1.48-v1.52
    StressReportService, CanaryStrategyService, DisasterDrillService,
    TenantQuotaService, AuditReportService, LinkAnalysisService,
    ProfileAnalysisService, MigrationToolService, ReplayEngineService,
    DiagnosisAdviceService, StressMonitorService, CanaryMonitorService,
    DisasterReportService, TenantBillingService, AuditTrailService,
    // v1.53-v1.57
    LinkDiagnosisService, ProfileReportService, MigrationMonitorService,
    ReplayAnalysisService, DiagnosisReportService, StressAlertService,
    CanaryReportService, DisasterStrategyService, TenantManagementService,
    AuditAnalysisService, LinkReportService, ProfileMonitorService,
    MigrationVerifyService, ReplayDiagnosisService, StressAnalysisService,
    // v1.58-v1.62
    CanaryAnalysisService, DisasterMonitorService, TenantReportService,
    AuditMonitorService, LinkMonitorService, ProfileAlertService,
    MigrationReportService, ReplayReportService, DiagnosisAlertService,
    StressReportAdvService, CanaryAlertService, DisasterReportAdvService,
    TenantAlertService, AuditAlertService, LinkAlertService,
  ],
})
export class EvalModule {}
