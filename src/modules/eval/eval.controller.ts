// @ts-nocheck
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MetricsService, MetricType, EvalInput } from './metrics.service';
import { MatrixEvalService, MatrixEvalConfig } from './matrix-eval.service';
import { TraceService } from './trace.service';
import { RedTeamService, RedTeamConfig, RedTeamPlugin } from './redteam.service';
import { YamlImportService } from './yaml-import.service';
import { RAGMetricsService, RAGEvalInput } from './rag-metrics.service';
import { ConversationalMetricsService, ConversationEvalInput } from './conversational-metrics.service';
import { LeaderboardService, LeaderboardConfig } from './leaderboard.service';
import { ObservabilityService } from './observability.service';
import { CapabilityEvalService } from './capability-eval.service';
import { ContaminationCheckService, ContaminationCheckConfig } from './contamination-check.service';
import { ExperimentService, CreateExperimentInput } from './experiment.service';
import { QualityGateService, EvalReport } from './quality-gate.service';
import { FeedbackService, SubmitFeedbackInput, FeedbackType } from './feedback.service';
import { MultimodalEvalService, MultimodalEvalInput, MultimodalEvalType } from './multimodal-eval.service';
import { LLMJudgeService, JudgeInput, JudgeType, JudgeRubric } from './llm-judge.service';
import { GuardrailsService, GuardType, ValidatorConfig, ValidatorType } from './guardrails.service';
import { ABTestService, ABTestConfig, ABTestStatus } from './ab-test.service';
import { PromptOptimizationService, OptimizationConfig, OptimizationStrategy } from './prompt-optimization.service';
import { CostTrackingService } from './cost-tracking.service';
import { BenchmarkService, BenchmarkType } from './benchmark.service';
import { EloRatingService } from './elo-rating.service';
import { RegressionDetectionService, RegressionType } from './regression-detection.service';
import { EvalSnapshotService } from './eval-snapshot.service';
import { SemanticCacheService } from './semantic-cache.service';
import { EvalTemplateService, EvalTemplateCategory } from './eval-template.service';
import { WebhookService, WebhookEvent } from './webhook.service';
import { EvalSchedulerService, ScheduleType, ScheduleStatus } from './eval-scheduler.service';
import { MetricsAggregationService, AggregationDimension, AggregationFunction } from './metrics-aggregation.service';
import { OnlineEvalService, OnlineEvalStatus, SamplingStrategy } from './online-eval.service';
import { SyntheticDataService, GenerationStrategy, DataQuality } from './synthetic-data.service';
import { WorkflowEngineService, WorkflowNodeType } from './workflow-engine.service';
import { DataLineageService, LineageNodeType } from './data-lineage.service';
import { ModelComparisonService, ComparisonMode, ComparisonDimension } from './model-comparison.service';
import { AlertRuleService, AlertSeverity, AlertStatus, AlertOperator } from './alert-rule.service';
import { PermissionService, Role, ResourceType, Permission } from './permission.service';
import { DatasetSamplingService, SamplingStrategy } from './dataset-sampling.service';
import { VisualizationService, ChartType } from './visualization.service';
import { EvalConfigService, ConfigType } from './config.service';
import { ResultSearchService } from './result-search.service';
import { MultiTenantService, TenantPlan, TenantStatus } from './multi-tenant.service';
import { EvalCacheService } from './eval-cache.service';
import { PromptVersionService } from './prompt-version.service';
import { EvalReplayService } from './eval-replay.service';
import { ExperimentTrackingService } from './experiment-tracking.service';
import { DataAnonymizationService } from './data-anonymization.service';
import { RateLimitingService } from './rate-limiting.service';
import { DataAugmentationService, AugmentationStrategy } from './data-augmentation.service';
import { MultilingualEvalService, MultilingualEvalType, Language } from './multilingual-eval.service';
import { ReportGeneratorService, ReportType, ReportFormat } from './report-generator.service';
import { DataVersioningService } from './data-versioning.service';
import { MetricAttributionService, AttributionType } from './metric-attribution.service';
import { ScenarioManagementService, ScenarioType } from './scenario-management.service';
import { DataQualityService, QualityDimension, QualityCheckType } from './data-quality.service';
import { TaskOrchestrationService, TaskStatus, TaskType } from './task-orchestration.service';
import { ResultExplanationService, ExplanationType } from './result-explanation.service';
import { AnnotationAssistanceService, AnnotationType } from './annotation-assistance.service';
import { ModelDistillationService, DistillationStrategy } from './model-distillation.service';
import { FederatedEvalService, FederatedType, AggregationStrategy } from './federated-eval.service';
import { ModelRegistryService, ModelProvider } from './model-registry.service';
import { ComparisonAnalysisService } from './comparison-analysis.service';
import { DataTransformService, TransformType } from './data-transform.service';
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
import {
  ModelVersionCompareService, DatasetCleaningService, EvalCacheStrategyService,
  TaskSchedulingStrategyService, ResultSearchOptimizationService, ModelPerformanceBenchmarkService,
  DatasetVersionCompareService, TaskDependencyAnalysisService, ResultVisualizationConfigService,
  ModelDeploymentMonitorService, DataQualityReportService, EvalTaskPriorityService,
  ResultSubscriptionNotifyService, ModelComparisonReportService, DatasetTransformService
} from './batch-v6';
import {
  ModelRoutingStrategyService, DataAnnotationQualityService, EvalReplayConfigService,
  TaskTrackingReportService, ResultExportConfigService, ModelEvalReportService,
  DataSyncStrategyService, EvalSnapshotCompareService, TaskOrchestrationConfigService,
  ResultAggregationStrategyService, ModelDeploymentConfigService, DatasetAnalysisService,
  TaskDistributionStrategyService, ResultCacheConfigService, ModelEvalConfigService
} from './batch-v7';
import {
  ModelDeploymentReportService, DatasetQualityMonitorService, EvalTaskReportService,
  ResultAggregationReportService, ModelEvalCompareService, DatasetReportService,
  TaskDistributionReportService, ResultCacheMonitorService, ModelDeploymentAlertService,
  DatasetQualityAlertService, EvalTaskAlertService, ResultAggregationAlertService,
  ModelEvalAlertService, DatasetSyncAlertService, EvalSnapshotAlertService
} from './batch-v8';
import {
  TaskOrchestrationAlertService, ResultExportAlertService, ModelRoutingAlertService,
  DataAnnotationAlertService, EvalReplayAlertService, TaskTrackingAlertService,
  ResultSearchAlertService, ModelPerformanceAlertService, DatasetCleaningAlertService,
  EvalCacheAlertService, TaskSchedulingAlertService, ResultVisualizationAlertService,
  ModelVersionAlertService, DatasetVersionAlertService, EvalSnapshotAlertAdvService
} from './batch-v9';
import {
  SmartRoutingOptimizeService, DataAugmentationStrategyService, EvalTemplateManagementService,
  TaskDistributionOptimizeService, ResultCacheOptimizeService, ModelEvalOptimizeService,
  DatasetQualityOptimizeService, EvalSnapshotOptimizeService, TaskOrchestrationOptimizeService,
  ResultAggregationOptimizeService, ModelDeploymentOptimizeService, DatasetAnalysisOptimizeService,
  SmartRoutingReportService, DataAugmentationReportService, EvalTemplateReportService
} from './batch-v10';
import {
  TaskDistributionReportAdvService, ResultCacheReportService, ModelEvalReportAdvService,
  DatasetQualityReportAdvService, EvalSnapshotReportService, TaskOrchestrationReportService,
  SmartRoutingMonitorService, DataAugmentationMonitorService, EvalTemplateMonitorService,
  TaskDistributionMonitorAdvService, ResultCacheMonitorAdvService, ModelEvalMonitorAdvService,
  DatasetQualityMonitorAdvService, EvalSnapshotMonitorAdvService, TaskOrchestrationMonitorAdvService
} from './batch-v11';
import {
  ResultAggregationMonitorAdvService, ModelDeploymentMonitorAdvService, DatasetAnalysisMonitorAdvService,
  SmartRoutingAlertAdvService, DataAugmentationAlertAdvService, EvalTemplateAlertAdvService,
  TaskDistributionAlertAdvService, ResultCacheAlertAdvService, ModelEvalAlertAdvService,
  DatasetQualityAlertAdvService, EvalSnapshotAlertAdvAdvService, TaskOrchestrationAlertAdvService,
  ResultAggregationAlertAdvService, ModelDeploymentAlertAdvAdvService, DatasetAnalysisAlertAdvService
} from './batch-v12';
import {
  SmartRoutingReportAdvAdvService, DataAugmentationReportAdvService, EvalTemplateReportAdvService,
  TaskDistributionReportAdvAdvService, ResultCacheReportAdvService, ModelEvalReportAdvAdvService,
  DatasetQualityReportAdvAdvService, EvalSnapshotReportAdvService, TaskOrchestrationReportAdvService
} from './batch-v13';

@Controller('api/eval')
export class EvalController {
  constructor(
    private metricsService: MetricsService,
    private matrixEvalService: MatrixEvalService,
    private traceService: TraceService,
    private redTeamService: RedTeamService,
    private yamlImportService: YamlImportService,
    private ragMetricsService: RAGMetricsService,
    private conversationalMetricsService: ConversationalMetricsService,
    private leaderboardService: LeaderboardService,
    private observabilityService: ObservabilityService,
    private capabilityEvalService: CapabilityEvalService,
    private contaminationCheckService: ContaminationCheckService,
    private experimentService: ExperimentService,
    private qualityGateService: QualityGateService,
    private feedbackService: FeedbackService,
    private multimodalEvalService: MultimodalEvalService,
    private llmJudgeService: LLMJudgeService,
    private guardrailsService: GuardrailsService,
    private abTestService: ABTestService,
    private promptOptimizationService: PromptOptimizationService,
    private costTrackingService: CostTrackingService,
    private benchmarkService: BenchmarkService,
    private eloRatingService: EloRatingService,
    private regressionDetectionService: RegressionDetectionService,
    private evalSnapshotService: EvalSnapshotService,
    private semanticCacheService: SemanticCacheService,
    private evalTemplateService: EvalTemplateService,
    private webhookService: WebhookService,
    private evalSchedulerService: EvalSchedulerService,
    private metricsAggregationService: MetricsAggregationService,
    private onlineEvalService: OnlineEvalService,
    private syntheticDataService: SyntheticDataService,
    private workflowEngineService: WorkflowEngineService,
    private dataLineageService: DataLineageService,
    private modelComparisonService: ModelComparisonService,
    private alertRuleService: AlertRuleService,
    private permissionService: PermissionService,
    private datasetSamplingService: DatasetSamplingService,
    private visualizationService: VisualizationService,
    private evalConfigService: EvalConfigService,
    private resultSearchService: ResultSearchService,
    private multiTenantService: MultiTenantService,
    private evalCacheService: EvalCacheService,
    private promptVersionService: PromptVersionService,
    private evalReplayService: EvalReplayService,
    private experimentTrackingService: ExperimentTrackingService,
    private dataAnonymizationService: DataAnonymizationService,
    private rateLimitingService: RateLimitingService,
    private dataAugmentationService: DataAugmentationService,
    private multilingualEvalService: MultilingualEvalService,
    private reportGeneratorService: ReportGeneratorService,
    private dataVersioningService: DataVersioningService,
    private metricAttributionService: MetricAttributionService,
    private scenarioManagementService: ScenarioManagementService,
    private dataQualityService: DataQualityService,
    private taskOrchestrationService: TaskOrchestrationService,
    private resultExplanationService: ResultExplanationService,
    private annotationAssistanceService: AnnotationAssistanceService,
    private modelDistillationService: ModelDistillationService,
    private federatedEvalService: FederatedEvalService,
    private modelRegistryService: ModelRegistryService,
    private comparisonAnalysisService: ComparisonAnalysisService,
    private dataTransformService: DataTransformService,
    private evalSandboxService: EvalSandboxService,
    private finetuneEvalService: FinetuneEvalService,
    private knowledgeBaseEvalService: KnowledgeBaseEvalService,
    private customMetricService: CustomMetricService,
    private resultAggregationService: ResultAggregationService,
    private taskTemplateService: TaskTemplateService,
    private modelVersionService: ModelVersionService,
    private dataPipelineService: DataPipelineService,
    private resultSubscriptionService: ResultSubscriptionService,
    private metricRegressionService: MetricRegressionService,
    private dataValidationService: DataValidationService,
    private resultShardingService: ResultShardingService,
    private performanceAnalysisService: PerformanceAnalysisService,
    private taskDependencyService: TaskDependencyService,
    private resultIndexService: ResultIndexService,
    private dataDeduplicationService: DataDeduplicationService,
    private inferenceOptimizationService: InferenceOptimizationService,
    private resultArchivalService: ResultArchivalService,
    private taskRetryService: TaskRetryService,
    private validationRuleService: ValidationRuleService,
    private resultMergeService: ResultMergeService,
    private taskBatchService: TaskBatchService,
    private dataMigrationService: DataMigrationService,
    private canaryReleaseService: CanaryReleaseService,
    private resultVisualizationService: ResultVisualizationService,
    private taskSchedulerService: TaskSchedulerService,
    private dataSyncService: DataSyncService,
    private evalBenchmarkService: EvalBenchmarkService,
    private resultComparisonService: ResultComparisonService,
    private dataBackupService: DataBackupService,
    private advancedOrchestrationService: AdvancedOrchestrationService,
    private advancedTransformService: AdvancedTransformService,
    private modelRoutingService: ModelRoutingService,
    private advancedAggregationService: AdvancedAggregationService,
    private taskMonitoringService: TaskMonitoringService,
    private advancedCleaningService: AdvancedCleaningService,
    private advancedModelEvalService: AdvancedModelEvalService,
    private advancedExportService: AdvancedExportService,
    private advancedQueueService: AdvancedQueueService,
    private advancedAnnotationService: AdvancedAnnotationService,
    private advancedReportService: AdvancedReportService,
    private advancedComparisonService: AdvancedComparisonService,
    private advancedSubscriptionService: AdvancedSubscriptionService,
    private advancedPriorityService: AdvancedPriorityService,
    private advancedShardingService: AdvancedShardingService,
    private advancedCacheService: AdvancedCacheService,
    private advancedRetryService: AdvancedRetryService,
    private advancedRegistryService: AdvancedRegistryService,
    private advancedIndexService: AdvancedIndexService,
    private advancedValidationService: AdvancedValidationService,
    private advancedTemplateService: AdvancedTemplateService,
    private advancedPipelineService: AdvancedPipelineService,
    private advancedDependencyService: AdvancedDependencyService,
    private advancedArchiveService: AdvancedArchiveService,
    // v1.43-v1.47
    private streamingEvalService: StreamingEvalService,
    private securityScanService: SecurityScanService,
    private evalGatewayService: EvalGatewayService,
    private evalPluginService: EvalPluginService,
    private visualizationEngineService: VisualizationEngineService,
    private stressTestService: StressTestService,
    private canaryDeploymentService: CanaryDeploymentService,
    private disasterRecoveryService: DisasterRecoveryService,
    private tenantIsolationService: TenantIsolationService,
    private auditLogService: AuditLogService,
    private traceAnalysisService: TraceAnalysisService,
    private dataProfilingService: DataProfilingService,
    private dataMigrationEvalService: DataMigrationEvalService,
    private replayEvalService: ReplayEvalService,
    private smartDiagnosisService: SmartDiagnosisService,
    // v1.48-v1.52
    private stressReportService: StressReportService,
    private canaryStrategyService: CanaryStrategyService,
    private disasterDrillService: DisasterDrillService,
    private tenantQuotaService: TenantQuotaService,
    private auditReportService: AuditReportService,
    private linkAnalysisService: LinkAnalysisService,
    private profileAnalysisService: ProfileAnalysisService,
    private migrationToolService: MigrationToolService,
    private replayEngineService: ReplayEngineService,
    private diagnosisAdviceService: DiagnosisAdviceService,
    private stressMonitorService: StressMonitorService,
    private canaryMonitorService: CanaryMonitorService,
    private disasterReportService: DisasterReportService,
    private tenantBillingService: TenantBillingService,
    private auditTrailService: AuditTrailService,
    // v1.53-v1.57
    private linkDiagnosisService: LinkDiagnosisService,
    private profileReportService: ProfileReportService,
    private migrationMonitorService: MigrationMonitorService,
    private replayAnalysisService: ReplayAnalysisService,
    private diagnosisReportService: DiagnosisReportService,
    private stressAlertService: StressAlertService,
    private canaryReportService: CanaryReportService,
    private disasterStrategyService: DisasterStrategyService,
    private tenantManagementService: TenantManagementService,
    private auditAnalysisService: AuditAnalysisService,
    private linkReportService: LinkReportService,
    private profileMonitorService: ProfileMonitorService,
    private migrationVerifyService: MigrationVerifyService,
    private replayDiagnosisService: ReplayDiagnosisService,
    private stressAnalysisService: StressAnalysisService,
    // v1.58-v1.62
    private canaryAnalysisService: CanaryAnalysisService,
    private disasterMonitorService: DisasterMonitorService,
    private tenantReportService: TenantReportService,
    private auditMonitorService: AuditMonitorService,
    private linkMonitorService: LinkMonitorService,
    private profileAlertService: ProfileAlertService,
    private migrationReportService: MigrationReportService,
    private replayReportService: ReplayReportService,
    private diagnosisAlertService: DiagnosisAlertService,
    private stressReportAdvService: StressReportAdvService,
    private canaryAlertService: CanaryAlertService,
    private disasterReportAdvService: DisasterReportAdvService,
    private tenantAlertService: TenantAlertService,
    private auditAlertService: AuditAlertService,
    private linkAlertService: LinkAlertService,
    // v1.63-v1.67
    private modelVersionCompareService: ModelVersionCompareService,
    private datasetCleaningService: DatasetCleaningService,
    private evalCacheStrategyService: EvalCacheStrategyService,
    private taskSchedulingStrategyService: TaskSchedulingStrategyService,
    private resultSearchOptimizationService: ResultSearchOptimizationService,
    private modelPerformanceBenchmarkService: ModelPerformanceBenchmarkService,
    private datasetVersionCompareService: DatasetVersionCompareService,
    private taskDependencyAnalysisService: TaskDependencyAnalysisService,
    private resultVisualizationConfigService: ResultVisualizationConfigService,
    private modelDeploymentMonitorService: ModelDeploymentMonitorService,
    private dataQualityReportService: DataQualityReportService,
    private evalTaskPriorityService: EvalTaskPriorityService,
    private resultSubscriptionNotifyService: ResultSubscriptionNotifyService,
    private modelComparisonReportService: ModelComparisonReportService,
    private datasetTransformService: DatasetTransformService,
    // v1.68-v1.72
    private modelRoutingStrategyService: ModelRoutingStrategyService,
    private dataAnnotationQualityService: DataAnnotationQualityService,
    private evalReplayConfigService: EvalReplayConfigService,
    private taskTrackingReportService: TaskTrackingReportService,
    private resultExportConfigService: ResultExportConfigService,
    private modelEvalReportService: ModelEvalReportService,
    private dataSyncStrategyService: DataSyncStrategyService,
    private evalSnapshotCompareService: EvalSnapshotCompareService,
    private taskOrchestrationConfigService: TaskOrchestrationConfigService,
    private resultAggregationStrategyService: ResultAggregationStrategyService,
    private modelDeploymentConfigService: ModelDeploymentConfigService,
    private datasetAnalysisService: DatasetAnalysisService,
    private taskDistributionStrategyService: TaskDistributionStrategyService,
    private resultCacheConfigService: ResultCacheConfigService,
    private modelEvalConfigService: ModelEvalConfigService,
    // v1.73-v1.77
    private modelDeploymentReportService: ModelDeploymentReportService,
    private datasetQualityMonitorService: DatasetQualityMonitorService,
    private evalTaskReportService: EvalTaskReportService,
    private resultAggregationReportService: ResultAggregationReportService,
    private modelEvalCompareService: ModelEvalCompareService,
    private datasetReportService: DatasetReportService,
    private taskDistributionReportService: TaskDistributionReportService,
    private resultCacheMonitorService: ResultCacheMonitorService,
    private modelDeploymentAlertService: ModelDeploymentAlertService,
    private datasetQualityAlertService: DatasetQualityAlertService,
    private evalTaskAlertService: EvalTaskAlertService,
    private resultAggregationAlertService: ResultAggregationAlertService,
    private modelEvalAlertService: ModelEvalAlertService,
    private datasetSyncAlertService: DatasetSyncAlertService,
    private evalSnapshotAlertService: EvalSnapshotAlertService,
    // v1.78-v1.82
    private taskOrchestrationAlertService: TaskOrchestrationAlertService,
    private resultExportAlertService: ResultExportAlertService,
    private modelRoutingAlertService: ModelRoutingAlertService,
    private dataAnnotationAlertService: DataAnnotationAlertService,
    private evalReplayAlertService: EvalReplayAlertService,
    private taskTrackingAlertService: TaskTrackingAlertService,
    private resultSearchAlertService: ResultSearchAlertService,
    private modelPerformanceAlertService: ModelPerformanceAlertService,
    private datasetCleaningAlertService: DatasetCleaningAlertService,
    private evalCacheAlertService: EvalCacheAlertService,
    private taskSchedulingAlertService: TaskSchedulingAlertService,
    private resultVisualizationAlertService: ResultVisualizationAlertService,
    private modelVersionAlertService: ModelVersionAlertService,
    private datasetVersionAlertService: DatasetVersionAlertService,
    private evalSnapshotAlertAdvService: EvalSnapshotAlertAdvService,
    // v1.83-v1.87
    private smartRoutingOptimizeService: SmartRoutingOptimizeService,
    private dataAugmentationStrategyService: DataAugmentationStrategyService,
    private evalTemplateManagementService: EvalTemplateManagementService,
    private taskDistributionOptimizeService: TaskDistributionOptimizeService,
    private resultCacheOptimizeService: ResultCacheOptimizeService,
    private modelEvalOptimizeService: ModelEvalOptimizeService,
    private datasetQualityOptimizeService: DatasetQualityOptimizeService,
    private evalSnapshotOptimizeService: EvalSnapshotOptimizeService,
    private taskOrchestrationOptimizeService: TaskOrchestrationOptimizeService,
    private resultAggregationOptimizeService: ResultAggregationOptimizeService,
    private modelDeploymentOptimizeService: ModelDeploymentOptimizeService,
    private datasetAnalysisOptimizeService: DatasetAnalysisOptimizeService,
    private smartRoutingReportService: SmartRoutingReportService,
    private dataAugmentationReportService: DataAugmentationReportService,
    private evalTemplateReportService: EvalTemplateReportService,
    // v1.88-v1.92
    private taskDistributionReportAdvService: TaskDistributionReportAdvService,
    private resultCacheReportService: ResultCacheReportService,
    private modelEvalReportAdvService: ModelEvalReportAdvService,
    private datasetQualityReportAdvService: DatasetQualityReportAdvService,
    private evalSnapshotReportService: EvalSnapshotReportService,
    private taskOrchestrationReportService: TaskOrchestrationReportService,
    private smartRoutingMonitorService: SmartRoutingMonitorService,
    private dataAugmentationMonitorService: DataAugmentationMonitorService,
    private evalTemplateMonitorService: EvalTemplateMonitorService,
    private taskDistributionMonitorAdvService: TaskDistributionMonitorAdvService,
    private resultCacheMonitorAdvService: ResultCacheMonitorAdvService,
    private modelEvalMonitorAdvService: ModelEvalMonitorAdvService,
    private datasetQualityMonitorAdvService: DatasetQualityMonitorAdvService,
    private evalSnapshotMonitorAdvService: EvalSnapshotMonitorAdvService,
    private taskOrchestrationMonitorAdvService: TaskOrchestrationMonitorAdvService,
    // v1.93-v1.97
    private resultAggregationMonitorAdvService: ResultAggregationMonitorAdvService,
    private modelDeploymentMonitorAdvService: ModelDeploymentMonitorAdvService,
    private datasetAnalysisMonitorAdvService: DatasetAnalysisMonitorAdvService,
    private smartRoutingAlertAdvService: SmartRoutingAlertAdvService,
    private dataAugmentationAlertAdvService: DataAugmentationAlertAdvService,
    private evalTemplateAlertAdvService: EvalTemplateAlertAdvService,
    private taskDistributionAlertAdvService: TaskDistributionAlertAdvService,
    private resultCacheAlertAdvService: ResultCacheAlertAdvService,
    private modelEvalAlertAdvService: ModelEvalAlertAdvService,
    private datasetQualityAlertAdvService: DatasetQualityAlertAdvService,
    private evalSnapshotAlertAdvAdvService: EvalSnapshotAlertAdvAdvService,
    private taskOrchestrationAlertAdvService: TaskOrchestrationAlertAdvService,
    private resultAggregationAlertAdvService: ResultAggregationAlertAdvService,
    private modelDeploymentAlertAdvAdvService: ModelDeploymentAlertAdvAdvService,
    private datasetAnalysisAlertAdvService: DatasetAnalysisAlertAdvService,
    // v1.98-v1.100
    private smartRoutingReportAdvAdvService: SmartRoutingReportAdvAdvService,
    private dataAugmentationReportAdvService: DataAugmentationReportAdvService,
    private evalTemplateReportAdvService: EvalTemplateReportAdvService,
    private taskDistributionReportAdvAdvService: TaskDistributionReportAdvAdvService,
    private resultCacheReportAdvService: ResultCacheReportAdvService,
    private modelEvalReportAdvAdvService: ModelEvalReportAdvAdvService,
    private datasetQualityReportAdvAdvService: DatasetQualityReportAdvAdvService,
    private evalSnapshotReportAdvService: EvalSnapshotReportAdvService,
    private taskOrchestrationReportAdvService: TaskOrchestrationReportAdvService,
  ) {}

  // ========== 评测指标 API ==========

  // 运行所有指标评测
  @Post('metrics/run')
  async runAllMetrics(@Body() input: EvalInput) {
    return this.metricsService.runAllMetrics(input);
  }

  // 运行单个指标
  @Post('metrics/:type')
  async runSingleMetric(@Param('type') type: MetricType, @Body() input: EvalInput) {
    switch (type) {
      case MetricType.ANSWER_RELEVANCY:
        return this.metricsService.evaluateAnswerRelevancy(input);
      case MetricType.FAITHFULNESS:
        return this.metricsService.evaluateFaithfulness(input);
      case MetricType.HALLUCINATION:
        return this.metricsService.evaluateHallucination(input);
      case MetricType.COMPLETENESS:
        return this.metricsService.evaluateCompleteness(input);
      case MetricType.TOXICITY:
        return this.metricsService.evaluateToxicity(input);
      case MetricType.BIAS:
        return this.metricsService.evaluateBias(input);
      case MetricType.CONTEXT_RELEVANCY:
        return this.metricsService.evaluateContextRelevancy(input);
      default:
        throw new Error(`Unknown metric type: ${type}`);
    }
  }

  // G-Eval 自定义评测
  @Post('metrics/g-eval/custom')
  async runGEval(@Body() body: { input: EvalInput; criteria: string }) {
    return this.metricsService.evaluateGEval(body.input, body.criteria);
  }

  // ========== 矩阵对比评测 API ==========

  // 运行矩阵评测
  @Post('matrix')
  async runMatrixEval(@Body() config: MatrixEvalConfig) {
    return this.matrixEvalService.runMatrixEval(config);
  }

  // 导出矩阵结果为 CSV
  @Post('matrix/export')
  async exportMatrixCSV(@Body() config: MatrixEvalConfig) {
    const result = await this.matrixEvalService.runMatrixEval(config);
    return this.matrixEvalService.exportToCSV(result);
  }

  // ========== 追踪系统 API ==========

  // 创建追踪
  @Post('traces')
  async createTrace(@Body() body: {
    name: string;
    sessionId?: string;
    userId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    input?: any;
  }) {
    return this.traceService.createTrace(body);
  }

  // 获取追踪列表
  @Get('traces')
  async listTraces(
    @Query('sessionId') sessionId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.traceService.listTraces({
      sessionId,
      userId,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  // 获取追踪详情
  @Get('traces/:id')
  async getTrace(@Param('id') id: string) {
    return this.traceService.getTrace(id);
  }

  // 完成追踪
  @Post('traces/:id/complete')
  async completeTrace(@Param('id') id: string, @Body() body: { output: any }) {
    return this.traceService.completeTrace(id, body.output);
  }

  // 获取 Session 统计
  @Get('sessions/:sessionId/stats')
  async getSessionStats(@Param('sessionId') sessionId: string) {
    return this.traceService.getSessionStats(sessionId);
  }

  // ========== 红队安全扫描 API ==========

  // 运行红队测试
  @Post('redteam')
  async runRedTeam(@Body() config: RedTeamConfig) {
    return this.redTeamService.runRedTeam(config);
  }

  // 生成攻击样本
  @Post('redteam/generate')
  async generateAttacks(@Body() body: { plugin: RedTeamPlugin; count: number }) {
    return this.redTeamService.generateAttacks(body.plugin, body.count);
  }

  // 获取可用插件列表
  @Get('redteam/plugins')
  getRedTeamPlugins() {
    return {
      plugins: Object.values(RedTeamPlugin).map(plugin => ({
        id: plugin,
        name: this.getPluginName(plugin),
        description: this.getPluginDescription(plugin),
      })),
    };
  }

  private getPluginName(plugin: RedTeamPlugin): string {
    const names: Record<RedTeamPlugin, string> = {
      [RedTeamPlugin.JAILBREAK]: '越狱攻击',
      [RedTeamPlugin.PROMPT_INJECTION]: '提示注入',
      [RedTeamPlugin.HALLUCINATION]: '幻觉诱导',
      [RedTeamPlugin.DATA_LEAK]: '数据泄露',
      [RedTeamPlugin.COMPETITOR]: '竞品引导',
      [RedTeamPlugin.OVERRELIANCE]: '过度依赖',
      [RedTeamPlugin.EXCESSIVE_AGENCY]: '过度授权',
    };
    return names[plugin] || plugin;
  }

  private getPluginDescription(plugin: RedTeamPlugin): string {
    const descriptions: Record<RedTeamPlugin, string> = {
      [RedTeamPlugin.JAILBREAK]: '测试 AI 是否会被绕过安全限制执行有害操作',
      [RedTeamPlugin.PROMPT_INJECTION]: '测试 AI 是否会泄露系统提示词和内部配置',
      [RedTeamPlugin.HALLUCINATION]: '测试 AI 是否会编造虚假信息',
      [RedTeamPlugin.DATA_LEAK]: '测试 AI 是否会泄露训练数据或用户隐私',
      [RedTeamPlugin.COMPETITOR]: '测试 AI 是否会不当贬低自己或推荐竞品',
      [RedTeamPlugin.OVERRELIANCE]: '测试 AI 是否会鼓励用户过度依赖其建议',
      [RedTeamPlugin.EXCESSIVE_AGENCY]: '测试 AI 是否会执行超出权限的操作',
    };
    return descriptions[plugin] || '';
  }

  // ========== YAML 导入 API ==========

  // 验证 YAML 格式
  @Post('yaml/validate')
  async validateYaml(@Body() body: { content: string }) {
    return this.yamlImportService.validateYaml(body.content);
  }

  // 解析 YAML 预览
  @Post('yaml/parse')
  async parseYaml(@Body() body: { content: string }) {
    const suite = this.yamlImportService.parseYaml(body.content);
    const testCases = this.yamlImportService.convertToTestCases(suite);
    return {
      description: suite.description,
      promptCount: suite.prompts.length,
      testCaseCount: testCases.length,
      testCases: testCases.slice(0, 10), // 只返回前10个预览
    };
  }

  // 导入 YAML 到数据集
  @Post('yaml/import')
  async importYaml(@Body() body: {
    content: string;
    datasetName: string;
    datasetDescription?: string;
  }) {
    const suite = this.yamlImportService.parseYaml(body.content);
    return this.yamlImportService.importToDataset(
      suite,
      body.datasetName,
      body.datasetDescription,
    );
  }

  // 获取示例 YAML 模板
  @Get('yaml/template')
  getYamlTemplate() {
    return {
      template: this.yamlImportService.generateSampleTemplate(),
    };
  }

  // ========== RAG 评测 API ==========

  // 运行所有 RAG 指标
  @Post('rag/run')
  async runRAGMetrics(@Body() input: RAGEvalInput) {
    return this.ragMetricsService.runAllMetrics(input);
  }

  // 上下文精度
  @Post('rag/context-precision')
  async evaluateContextPrecision(@Body() input: RAGEvalInput) {
    return this.ragMetricsService.evaluateContextPrecision(input);
  }

  // 上下文召回
  @Post('rag/context-recall')
  async evaluateContextRecall(@Body() input: RAGEvalInput) {
    return this.ragMetricsService.evaluateContextRecall(input);
  }

  // ========== 对话评测 API ==========

  // 运行所有对话评测指标
  @Post('conversation/run')
  async runConversationMetrics(@Body() input: ConversationEvalInput) {
    return this.conversationalMetricsService.runAllMetrics(input);
  }

  // 对话连贯性
  @Post('conversation/coherence')
  async evaluateCoherence(@Body() input: ConversationEvalInput) {
    return this.conversationalMetricsService.evaluateCoherence(input);
  }

  // 对话完整性
  @Post('conversation/completeness')
  async evaluateCompleteness(@Body() input: ConversationEvalInput) {
    return this.conversationalMetricsService.evaluateCompleteness(input);
  }

  // ========== 排行榜 API ==========

  // 生成排行榜
  @Post('leaderboard')
  async generateLeaderboard(@Body() config: LeaderboardConfig) {
    return this.leaderboardService.generateLeaderboard(config);
  }

  // 获取排行榜摘要
  @Get('leaderboard/summary')
  async getLeaderboardSummary() {
    return this.leaderboardService.getLeaderboardSummary();
  }

  // 模型对比
  @Post('leaderboard/compare')
  async compareModels(@Body() body: { modelIds: string[] }) {
    return this.leaderboardService.compareModels(body.modelIds);
  }

  // 获取趋势
  @Get('leaderboard/trend/:modelId')
  async getTrend(@Param('modelId') modelId: string, @Query('days') days?: string) {
    return this.leaderboardService.getTrend(modelId, days ? parseInt(days) : 30);
  }

  // ========== 可观测性 API ==========

  // 记录 LLM 调用
  @Post('observability/record')
  async recordLLMCall(@Body() data: {
    model: string;
    provider?: string;
    latency: number;
    promptTokens: number;
    completionTokens: number;
    temperature?: number;
    maxTokens?: number;
    status: 'success' | 'error';
    errorMessage?: string;
    traceId?: string;
    sessionId?: string;
    userId?: string;
    tags?: string[];
  }) {
    return this.observabilityService.recordLLMCall(data);
  }

  // 获取可观测性统计
  @Get('observability/stats')
  async getObservabilityStats(
    @Query('hours') hours?: string,
    @Query('model') model?: string,
  ) {
    return this.observabilityService.getStats({
      hours: hours ? parseInt(hours) : 24,
      model,
    });
  }

  // 获取调用记录
  @Get('observability/records')
  async getLLMRecords(
    @Query('hours') hours?: string,
    @Query('model') model?: string,
    @Query('limit') limit?: string,
  ) {
    return this.observabilityService.getRecords({
      since: hours ? new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000) : undefined,
      model,
      limit: limit ? parseInt(limit) : 100,
    });
  }

  // ========== 多维度能力评估 API ==========

  // 运行能力评测
  @Post('capability/run')
  async runCapabilityEval(@Body() body: { modelName?: string }) {
    return this.capabilityEvalService.runCapabilityEval(body.modelName);
  }

  // ========== 数据污染检测 API ==========

  // 运行污染检测
  @Post('contamination/check')
  async checkContamination(@Body() config: ContaminationCheckConfig) {
    return this.contaminationCheckService.checkContamination(config);
  }

  // ========== 实验追踪 API ==========

  // 创建实验
  @Post('experiments')
  async createExperiment(@Body() input: CreateExperimentInput) {
    return this.experimentService.createExperiment(input);
  }

  // 获取实验列表
  @Get('experiments')
  async listExperiments(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.experimentService.listExperiments({
      status,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  // 获取实验详情
  @Get('experiments/:id')
  async getExperiment(@Param('id') id: string) {
    return this.experimentService.getExperiment(id);
  }

  // 记录实验运行
  @Post('experiments/:id/runs')
  async recordExperimentRun(
    @Param('id') id: string,
    @Body() data: { input: any; output: any; metrics: Record<string, number>; duration: number; status: 'completed' | 'failed' },
  ) {
    return this.experimentService.recordRun(id, data);
  }

  // 对比实验
  @Post('experiments/compare')
  async compareExperiments(@Body() body: { experimentIds: string[] }) {
    return this.experimentService.compareExperiments(body.experimentIds);
  }

  // ========== 质量门禁 API ==========

  // 检查质量门禁
  @Post('quality-gate/check')
  async checkQualityGate(
    @Body() body: { report: EvalReport; gateName?: string },
  ) {
    return this.qualityGateService.checkQualityGate(body.report, body.gateName);
  }

  // 获取质量门禁配置
  @Get('quality-gate/config')
  async getQualityGateConfig() {
    return this.qualityGateService.getQualityGates();
  }

  // ========== 用户反馈 API ==========

  // 提交反馈
  @Post('feedback')
  async submitFeedback(@Body() input: SubmitFeedbackInput) {
    return this.feedbackService.submitFeedback(input);
  }

  // 获取反馈列表
  @Get('feedback')
  async listFeedback(
    @Query('traceId') traceId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('type') type?: FeedbackType,
  ) {
    return this.feedbackService.listFeedback({ traceId, sessionId, type });
  }

  // 获取反馈统计
  @Get('feedback/stats')
  async getFeedbackStats(@Query('sessionId') sessionId?: string) {
    return this.feedbackService.getFeedbackStats({ sessionId });
  }

  // 点赞
  @Post('feedback/thumbs-up')
  async thumbsUp(@Body() body: { traceId: string; userId?: string }) {
    return this.feedbackService.thumbsUp(body.traceId, body.userId);
  }

  // 点踩
  @Post('feedback/thumbs-down')
  async thumbsDown(@Body() body: { traceId: string; userId?: string; reason?: string }) {
    return this.feedbackService.thumbsDown(body.traceId, body.userId, body.reason);
  }

  // 评分
  @Post('feedback/rate')
  async rate(@Body() body: { traceId: string; rating: number; userId?: string }) {
    return this.feedbackService.rate(body.traceId, body.rating, body.userId);
  }

  // ========== 多模态评测 API ==========

  // 运行多模态评测
  @Post('multimodal/run')
  async runMultimodalEval(@Body() input: MultimodalEvalInput) {
    return this.multimodalEvalService.runMultimodalEval(input);
  }

  // 获取支持的多模态评测类型
  @Get('multimodal/types')
  getMultimodalTypes() {
    return {
      types: Object.values(MultimodalEvalType).map(type => ({
        id: type,
        name: this.getMultimodalTypeName(type),
      })),
    };
  }

  private getMultimodalTypeName(type: MultimodalEvalType): string {
    const names: Record<MultimodalEvalType, string> = {
      [MultimodalEvalType.IMAGE_CAPTION]: '图像描述',
      [MultimodalEvalType.IMAGE_QA]: '图像问答',
      [MultimodalEvalType.IMAGE_CLASSIFICATION]: '图像分类',
      [MultimodalEvalType.VISUAL_GROUNDING]: '视觉定位',
      [MultimodalEvalType.AUDIO_TRANSCRIPTION]: '音频转写',
      [MultimodalEvalType.AUDIO_QA]: '音频问答',
    };
    return names[type] || type;
  }

  // ========== LLM-as-Judge API ==========

  // 运行 LLM 评判
  @Post('judge/run')
  async runJudge(@Body() input: JudgeInput) {
    return this.llmJudgeService.runJudge(input);
  }

  // 批量评判
  @Post('judge/batch')
  async runBatchJudge(@Body() body: { inputs: JudgeInput[] }) {
    return this.llmJudgeService.runBatchJudge(body.inputs);
  }

  // 获取所有 Rubrics
  @Get('judge/rubrics')
  getRubrics() {
    return this.llmJudgeService.getRubrics();
  }

  // 获取单个 Rubric
  @Get('judge/rubrics/:id')
  getRubric(@Param('id') id: string) {
    return this.llmJudgeService.getRubric(id);
  }

  // 创建自定义 Rubric
  @Post('judge/rubrics')
  createRubric(@Body() rubric: Omit<JudgeRubric, 'id'>) {
    return this.llmJudgeService.createRubric(rubric);
  }

  // ========== 输出护栏 API ==========

  // 检查输入
  @Post('guardrails/check-input')
  async checkInput(@Body() body: { input: string }) {
    return this.guardrailsService.checkInput(body.input);
  }

  // 检查输出
  @Post('guardrails/check-output')
  async checkOutput(@Body() body: { output: string }) {
    return this.guardrailsService.checkOutput(body.output);
  }

  // 同时检查输入输出
  @Post('guardrails/check-both')
  async checkBoth(@Body() body: { input: string; output: string }) {
    return this.guardrailsService.checkBoth(body.input, body.output);
  }

  // 获取所有验证器
  @Get('guardrails/validators')
  getValidators() {
    return this.guardrailsService.getValidators();
  }

  // 创建自定义验证器
  @Post('guardrails/validators')
  createValidator(@Body() config: Omit<ValidatorConfig, 'id'>) {
    return this.guardrailsService.createValidator(config);
  }

  // 切换验证器状态
  @Post('guardrails/validators/:id/toggle')
  toggleValidator(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.guardrailsService.toggleValidator(id, body.enabled);
  }

  // ========== A/B 测试 API ==========

  // 创建 A/B 测试
  @Post('ab-tests')
  async createABTest(@Body() config: ABTestConfig) {
    return this.abTestService.createTest(config);
  }

  // 获取测试列表
  @Get('ab-tests')
  async listABTests(@Query('status') status?: ABTestStatus) {
    return this.abTestService.listTests(status);
  }

  // 获取测试详情
  @Get('ab-tests/:id')
  async getABTest(@Param('id') id: string) {
    return this.abTestService.getTest(id);
  }

  // 启动测试
  @Post('ab-tests/:id/start')
  async startABTest(@Param('id') id: string) {
    return this.abTestService.startTest(id);
  }

  // 暂停测试
  @Post('ab-tests/:id/pause')
  async pauseABTest(@Param('id') id: string) {
    return this.abTestService.pauseTest(id);
  }

  // 完成测试
  @Post('ab-tests/:id/complete')
  async completeABTest(@Param('id') id: string) {
    return this.abTestService.completeTest(id);
  }

  // 记录运行结果
  @Post('ab-tests/:id/runs')
  async recordABTestRun(
    @Param('id') id: string,
    @Body() data: { variantId: string; input: string; output: string; scores: Record<string, number>; latency: number },
  ) {
    return this.abTestService.recordRun(id, data);
  }

  // 选择变体
  @Get('ab-tests/:id/select-variant')
  async selectVariant(@Param('id') id: string) {
    return this.abTestService.selectVariant(id);
  }

  // 获取测试结果
  @Get('ab-tests/:id/results')
  async getABTestResults(@Param('id') id: string) {
    return this.abTestService.calculateResults(id);
  }

  // 对比变体
  @Post('ab-tests/:id/compare')
  async compareVariants(
    @Param('id') id: string,
    @Body() body: { variantId1: string; variantId2: string },
  ) {
    return this.abTestService.compareVariants(id, body.variantId1, body.variantId2);
  }

  // ========== Prompt 优化 API ==========

  // 优化 Prompt
  @Post('prompt-optimize')
  async optimizePrompt(
    @Body() body: { prompt: string; config: OptimizationConfig },
  ) {
    return this.promptOptimizationService.optimizePrompt(body.prompt, body.config);
  }

  // 获取优化策略列表
  @Get('prompt-optimize/strategies')
  getOptimizationStrategies() {
    return {
      strategies: Object.values(OptimizationStrategy).map(s => ({
        id: s,
        name: this.getStrategyName(s),
      })),
    };
  }

  private getStrategyName(strategy: OptimizationStrategy): string {
    const names: Record<OptimizationStrategy, string> = {
      [OptimizationStrategy.ITERATIVE]: '迭代优化',
      [OptimizationStrategy.GENETIC]: '遗传算法',
      [OptimizationStrategy.GRADIENT]: '梯度优化',
      [OptimizationStrategy.META_PROMPT]: '元提示优化',
    };
    return names[strategy] || strategy;
  }

  // ========== 成本追踪 API ==========

  // 记录使用量
  @Post('cost/record')
  async recordUsage(@Body() data: {
    model: string;
    provider?: string;
    promptTokens: number;
    completionTokens: number;
    latency?: number;
    userId?: string;
    sessionId?: string;
    traceId?: string;
    tags?: string[];
  }) {
    return this.costTrackingService.recordUsage(data);
  }

  // 获取成本统计
  @Get('cost/stats')
  async getCostStats(
    @Query('model') model?: string,
    @Query('userId') userId?: string,
    @Query('days') days?: string,
  ) {
    const since = days ? new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) : undefined;
    return this.costTrackingService.getStats({ since, model, userId });
  }

  // 获取使用记录
  @Get('cost/records')
  async getCostRecords(
    @Query('model') model?: string,
    @Query('limit') limit?: string,
  ) {
    return this.costTrackingService.getRecords({ model, limit: limit ? parseInt(limit) : 100 });
  }

  // 获取模型定价
  @Get('cost/pricing')
  getPricing() {
    return this.costTrackingService.getPricing();
  }

  // 成本预测
  @Post('cost/predict')
  async predictCost(@Body() body: {
    model: string;
    provider: string;
    estimatedMonthlyTokens: number;
  }) {
    return this.costTrackingService.getCostPrediction(
      body.model, body.provider, body.estimatedMonthlyTokens,
    );
  }

  // 创建预算告警
  @Post('cost/budget-alert')
  async createBudgetAlert(@Body() body: {
    name: string;
    threshold: number;
    period: 'daily' | 'weekly' | 'monthly';
  }) {
    return this.costTrackingService.createBudgetAlert(body);
  }

  // 获取预算告警
  @Get('cost/budget-alerts')
  getBudgetAlerts() {
    return this.costTrackingService.getBudgetAlerts();
  }

  // ========== 基准测试 API ==========

  // 运行基准测试
  @Post('benchmark/run')
  async runBenchmark(
    @Body() body: { type: BenchmarkType; modelName?: string; categories?: string[] },
  ) {
    return this.benchmarkService.runBenchmark(body.type, body.modelName, body.categories);
  }

  // 运行所有基准测试
  @Post('benchmark/run-all')
  async runAllBenchmarks(@Body() body: { modelName?: string }) {
    return this.benchmarkService.runAllBenchmarks(body.modelName);
  }

  // 获取基准测试结果
  @Get('benchmark/results')
  async getBenchmarkResults(
    @Query('model') model?: string,
    @Query('type') type?: BenchmarkType,
  ) {
    return this.benchmarkService.getResults(model, type);
  }

  // 对比模型
  @Post('benchmark/compare')
  async compareBenchmarkModels(@Body() body: {
    models: string[];
    type?: BenchmarkType;
  }) {
    return this.benchmarkService.compareModels(body.models, body.type);
  }

  // 获取可用基准测试
  @Get('benchmark/types')
  getBenchmarkTypes() {
    return this.benchmarkService.getAvailableBenchmarks();
  }

  // 添加自定义基准题目
  @Post('benchmark/custom')
  async addCustomBenchmark(@Body() body: { questions: any[] }) {
    return this.benchmarkService.addCustomBenchmark(body.questions);
  }

  // ========== Elo 评分排名 API ==========

  // 记录对战
  @Post('elo/battles')
  async recordBattle(@Body() battle: { modelA: string; modelB: string; winner: 'A' | 'B' | 'tie'; category?: string }) {
    return this.eloRatingService.recordBattle(battle);
  }

  // 批量记录对战
  @Post('elo/battles/batch')
  async recordBattles(@Body() body: { battles: Array<{ modelA: string; modelB: string; winner: 'A' | 'B' | 'tie'; category?: string }> }) {
    return this.eloRatingService.recordBattles(body.battles);
  }

  // 生成排行榜
  @Get('elo/leaderboard')
  async getEloLeaderboard(@Query('category') category?: string) {
    return this.eloRatingService.generateLeaderboard(category);
  }

  // 获取模型评分
  @Get('elo/models/:model/rating')
  async getModelRating(@Param('model') model: string) {
    return { model, rating: this.eloRatingService.getModelRating(model) };
  }

  // 获取对战记录
  @Get('elo/battles')
  async getBattles(@Query('model') model?: string, @Query('category') category?: string) {
    return this.eloRatingService.getBattles(model, category);
  }

  // 预期对战结果
  @Get('elo/expected')
  async getExpectedOutcome(@Query('modelA') modelA: string, @Query('modelB') modelB: string) {
    return this.eloRatingService.getExpectedOutcome(modelA, modelB);
  }

  // 模拟对战
  @Post('elo/simulate')
  async simulateBattles(@Body() body: { models: string[]; count: number }) {
    return this.eloRatingService.simulateBattles(body.models, body.count);
  }

  // ========== 回归检测 API ==========

  // 检测回归
  @Post('regression/detect')
  async detectRegression(@Body() body: { metric: string; value: number; context?: Record<string, any> }) {
    return this.regressionDetectionService.detectRegression(body.metric, body.value, body.context);
  }

  // 批量检测
  @Post('regression/detect-batch')
  async detectBatch(@Body() body: { metrics: Record<string, number>; context?: Record<string, any> }) {
    return this.regressionDetectionService.detectBatch(body.metrics, body.context);
  }

  // 设置基线
  @Post('regression/baselines')
  async setBaseline(@Body() config: { name: string; metric: string; value: number; threshold: number; type: RegressionType }) {
    return this.regressionDetectionService.setBaseline(config);
  }

  // 获取所有基线
  @Get('regression/baselines')
  async getBaselines() {
    return this.regressionDetectionService.getBaselines();
  }

  // 获取回归检测历史
  @Get('regression/detections')
  async getDetections(
    @Query('type') type?: RegressionType,
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
  ) {
    return this.regressionDetectionService.getDetections({
      type,
      severity,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // 获取指标趋势
  @Get('regression/trend/:metric')
  async getTrend(@Param('metric') metric: string, @Query('limit') limit?: string) {
    return this.regressionDetectionService.getTrend(metric, limit ? parseInt(limit) : undefined);
  }

  // 获取回归统计
  @Get('regression/stats')
  async getRegressionStats() {
    return this.regressionDetectionService.getStats();
  }

  // ========== 评测快照 API ==========

  // 创建快照
  @Post('snapshots')
  async createSnapshot(@Body() data: {
    name: string;
    description?: string;
    evalRunId: string;
    modelName: string;
    datasetId?: string;
    metrics: Record<string, number>;
    summary: any;
    tags?: string[];
  }) {
    return this.evalSnapshotService.createSnapshot(data);
  }

  // 从评测运行创建快照
  @Post('snapshots/from-run/:evalRunId')
  async createFromEvalRun(
    @Param('evalRunId') evalRunId: string,
    @Body() body?: { name?: string; tags?: string[] },
  ) {
    return this.evalSnapshotService.createFromEvalRun(evalRunId, body?.name, body?.tags);
  }

  // 获取快照列表
  @Get('snapshots')
  async listSnapshots(
    @Query('model') model?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string,
  ) {
    return this.evalSnapshotService.listSnapshots({
      modelName: model,
      tags: tags ? tags.split(',') : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // 获取快照详情
  @Get('snapshots/:id')
  async getSnapshot(@Param('id') id: string) {
    return this.evalSnapshotService.getSnapshot(id);
  }

  // 删除快照
  @Post('snapshots/:id/delete')
  async deleteSnapshot(@Param('id') id: string) {
    return this.evalSnapshotService.deleteSnapshot(id);
  }

  // 对比两个快照
  @Post('snapshots/compare')
  async compareSnapshots(@Body() body: { snapshotId1: string; snapshotId2: string }) {
    return this.evalSnapshotService.compareSnapshots(body.snapshotId1, body.snapshotId2);
  }

  // 获取模型趋势
  @Get('snapshots/trend/:model/:metric')
  async getSnapshotTrend(
    @Param('model') model: string,
    @Param('metric') metric: string,
    @Query('limit') limit?: string,
  ) {
    return this.evalSnapshotService.getTrend(model, metric, limit ? parseInt(limit) : undefined);
  }

  // 添加标签
  @Post('snapshots/:id/tags')
  async addTag(@Param('id') id: string, @Body() body: { tag: string }) {
    return this.evalSnapshotService.addTag(id, body.tag);
  }

  // 获取所有标签
  @Get('snapshots/tags')
  async getAllTags() {
    return this.evalSnapshotService.getAllTags();
  }

  // ========== 语义缓存 API ==========

  // 查询缓存
  @Get('cache/lookup')
  async cacheLookup(@Query('query') query: string, @Query('model') model?: string) {
    return this.semanticCacheService.lookup(query, model);
  }

  // 存储到缓存
  @Post('cache/store')
  async cacheStore(@Body() body: {
    query: string;
    response: string;
    model?: string;
    parameters?: Record<string, any>;
    tags?: string[];
    metadata?: Record<string, any>;
    ttlSeconds?: number;
  }) {
    return this.semanticCacheService.store(body.query, body.response, {
      model: body.model,
      parameters: body.parameters,
      tags: body.tags,
      metadata: body.metadata,
      ttlSeconds: body.ttlSeconds,
    });
  }

  // 删除缓存条目
  @Post('cache/:id/delete')
  async cacheDelete(@Param('id') id: string) {
    return this.semanticCacheService.delete(id);
  }

  // 按标签删除
  @Post('cache/delete-by-tag')
  async cacheDeleteByTag(@Body() body: { tag: string }) {
    return this.semanticCacheService.deleteByTag(body.tag);
  }

  // 清空缓存
  @Post('cache/clear')
  async cacheClear() {
    return this.semanticCacheService.clear();
  }

  // 获取缓存统计
  @Get('cache/stats')
  async cacheStats() {
    return this.semanticCacheService.getStats();
  }

  // 获取缓存列表
  @Get('cache/entries')
  async cacheList(
    @Query('model') model?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string,
  ) {
    return this.semanticCacheService.list({
      model,
      tags: tags ? tags.split(',') : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // 更新缓存配置
  @Post('cache/config')
  async cacheUpdateConfig(@Body() config: { maxEntries?: number; ttlSeconds?: number; similarityThreshold?: number; enabled?: boolean }) {
    return this.semanticCacheService.updateConfig(config);
  }

  // 获取缓存配置
  @Get('cache/config')
  async cacheGetConfig() {
    return this.semanticCacheService.getConfig();
  }

  // 预热缓存
  @Post('cache/warmup')
  async cacheWarmup(@Body() body: { entries: Array<{ query: string; response: string; model?: string; tags?: string[] }> }) {
    return this.semanticCacheService.warmup(body.entries);
  }

  // 获取命中率趋势
  @Get('cache/hit-rate-trend')
  async cacheHitRateTrend(@Query('buckets') buckets?: string) {
    return this.semanticCacheService.getHitRateTrend(buckets ? parseInt(buckets) : 24);
  }

  // ========== 评测模板 API ==========

  // 获取模板列表
  @Get('templates')
  async listTemplates(
    @Query('category') category?: EvalTemplateCategory,
    @Query('tags') tags?: string,
    @Query('includeBuiltIn') includeBuiltIn?: string,
  ) {
    return this.evalTemplateService.listTemplates({
      category,
      tags: tags ? tags.split(',') : undefined,
      includeBuiltIn: includeBuiltIn !== 'false',
    });
  }

  // 获取模板详情
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.evalTemplateService.getTemplate(id);
  }

  // 创建自定义模板
  @Post('templates')
  async createTemplate(@Body() data: {
    name: string;
    description?: string;
    category: EvalTemplateCategory;
    config: any;
    variables?: any[];
    tags?: string[];
  }) {
    return this.evalTemplateService.createTemplate(data);
  }

  // 更新模板
  @Post('templates/:id/update')
  async updateTemplate(@Param('id') id: string, @Body() updates: any) {
    return this.evalTemplateService.updateTemplate(id, updates);
  }

  // 删除模板
  @Post('templates/:id/delete')
  async deleteTemplate(@Param('id') id: string) {
    return this.evalTemplateService.deleteTemplate(id);
  }

  // 实例化模板
  @Post('templates/:id/instantiate')
  async instantiateTemplate(
    @Param('id') id: string,
    @Body() body: { variables: Record<string, any> },
  ) {
    return this.evalTemplateService.instantiateTemplate(id, body.variables);
  }

  // 获取模板分类
  @Get('templates/categories/list')
  async getTemplateCategories() {
    return this.evalTemplateService.getCategories();
  }

  // 复制模板
  @Post('templates/:id/duplicate')
  async duplicateTemplate(
    @Param('id') id: string,
    @Body() body?: { newName?: string },
  ) {
    return this.evalTemplateService.duplicateTemplate(id, body?.newName);
  }

  // 导出模板
  @Get('templates/:id/export')
  async exportTemplate(@Param('id') id: string) {
    return this.evalTemplateService.exportTemplate(id);
  }

  // 导入模板
  @Post('templates/import')
  async importTemplate(@Body() template: any) {
    return this.evalTemplateService.importTemplate(template);
  }

  // ==================== Webhook 管理 ====================

  // 创建 Webhook
  @Post('webhooks')
  async createWebhook(@Body() body: {
    name: string;
    url: string;
    events: WebhookEvent[];
    secret?: string;
    headers?: Record<string, string>;
    retryCount?: number;
    timeout?: number;
  }) {
    return this.webhookService.createWebhook(body);
  }

  // 获取 Webhook 列表
  @Get('webhooks')
  async listWebhooks() {
    return this.webhookService.listWebhooks();
  }

  // 获取 Webhook 详情
  @Get('webhooks/:id')
  async getWebhook(@Param('id') id: string) {
    return this.webhookService.getWebhook(id);
  }

  // 更新 Webhook
  @Post('webhooks/:id')
  async updateWebhook(@Param('id') id: string, @Body() body: any) {
    return this.webhookService.updateWebhook(id, body);
  }

  // 删除 Webhook
  @Post('webhooks/:id/delete')
  async deleteWebhook(@Param('id') id: string) {
    return this.webhookService.deleteWebhook(id);
  }

  // 触发 Webhook 事件
  @Post('webhooks/trigger')
  async triggerWebhook(@Body() body: { event: WebhookEvent; payload: Record<string, any> }) {
    return this.webhookService.triggerEvent(body.event, body.payload);
  }

  // 获取投递记录
  @Get('webhooks/deliveries')
  async getDeliveries(
    @Query('webhookId') webhookId?: string,
    @Query('event') event?: WebhookEvent,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.webhookService.getDeliveries({ webhookId, event, status, limit: limit ? +limit : undefined });
  }

  // 重新投递
  @Post('webhooks/deliveries/:id/redeliver')
  async redeliver(@Param('id') id: string) {
    return this.webhookService.redeliver(id);
  }

  // 获取事件类型
  @Get('webhooks/events/types')
  async getWebhookEventTypes() {
    return this.webhookService.getEventTypes();
  }

  // ==================== 评测调度 ====================

  // 创建调度任务
  @Post('scheduler/tasks')
  async createScheduleTask(@Body() body: {
    name: string;
    description?: string;
    type: ScheduleType;
    cronExpression?: string;
    intervalMs?: number;
    taskType: 'eval_run' | 'benchmark' | 'pipeline' | 'cleanup' | 'report';
    taskConfig: Record<string, any>;
    createdBy?: string;
  }) {
    return this.evalSchedulerService.createTask(body);
  }

  // 获取任务列表
  @Get('scheduler/tasks')
  async listScheduleTasks(@Query('status') status?: ScheduleStatus) {
    return this.evalSchedulerService.listTasks(status);
  }

  // 获取任务详情
  @Get('scheduler/tasks/:id')
  async getScheduleTask(@Param('id') id: string) {
    return this.evalSchedulerService.getTask(id);
  }

  // 更新任务
  @Post('scheduler/tasks/:id')
  async updateScheduleTask(@Param('id') id: string, @Body() body: any) {
    return this.evalSchedulerService.updateTask(id, body);
  }

  // 暂停任务
  @Post('scheduler/tasks/:id/pause')
  async pauseScheduleTask(@Param('id') id: string) {
    return this.evalSchedulerService.pauseTask(id);
  }

  // 恢复任务
  @Post('scheduler/tasks/:id/resume')
  async resumeScheduleTask(@Param('id') id: string) {
    return this.evalSchedulerService.resumeTask(id);
  }

  // 取消任务
  @Post('scheduler/tasks/:id/cancel')
  async cancelScheduleTask(@Param('id') id: string) {
    return this.evalSchedulerService.cancelTask(id);
  }

  // 删除任务
  @Post('scheduler/tasks/:id/delete')
  async deleteScheduleTask(@Param('id') id: string) {
    return this.evalSchedulerService.deleteTask(id);
  }

  // 手动触发任务
  @Post('scheduler/tasks/:id/trigger')
  async triggerScheduleTask(@Param('id') id: string) {
    return this.evalSchedulerService.triggerTask(id);
  }

  // 获取执行记录
  @Get('scheduler/executions')
  async getScheduleExecutions(
    @Query('taskId') taskId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.evalSchedulerService.getExecutions({ taskId, status, limit: limit ? +limit : undefined });
  }

  // 获取调度统计
  @Get('scheduler/stats')
  async getSchedulerStats() {
    return this.evalSchedulerService.getStats();
  }

  // ==================== 指标聚合 ====================

  // 执行聚合查询
  @Post('aggregation/query')
  async aggregateMetrics(@Body() body: {
    dimensions: AggregationDimension[];
    metrics: string[];
    functions: AggregationFunction[];
    filters?: Record<string, any>;
    timeRange?: { start: Date; end: Date };
    groupBy?: string;
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
  }) {
    return this.metricsAggregationService.aggregate(body);
  }

  // 获取趋势数据
  @Get('aggregation/trend/:metric')
  async getMetricTrend(
    @Param('metric') metric: string,
    @Query('dimension') dimension: AggregationDimension,
    @Query('value') value: string,
    @Query('buckets') buckets?: number,
  ) {
    return this.metricsAggregationService.getTrend(
      metric, dimension, value,
      { buckets: buckets ? +buckets : undefined },
    );
  }

  // 对比数据
  @Post('aggregation/compare')
  async compareMetrics(@Body() body: {
    dimension: AggregationDimension;
    values: string[];
    metrics: string[];
  }) {
    return this.metricsAggregationService.compare(body.dimension, body.values, body.metrics);
  }

  // 获取分布数据
  @Get('aggregation/distribution/:metric')
  async getMetricDistribution(
    @Param('metric') metric: string,
    @Query('buckets') buckets?: number,
    @Query('model') model?: string,
  ) {
    return this.metricsAggregationService.getDistribution(metric, {
      buckets: buckets ? +buckets : undefined,
      model,
    });
  }

  // ==================== 在线评测 ====================

  // 创建在线评测配置
  @Post('online/configs')
  async createOnlineConfig(@Body() body: any) {
    return this.onlineEvalService.createConfig(body);
  }

  // 获取配置列表
  @Get('online/configs')
  async listOnlineConfigs(@Query('status') status?: OnlineEvalStatus) {
    return this.onlineEvalService.listConfigs(status);
  }

  // 获取配置详情
  @Get('online/configs/:id')
  async getOnlineConfig(@Param('id') id: string) {
    return this.onlineEvalService.getConfig(id);
  }

  // 更新配置
  @Post('online/configs/:id')
  async updateOnlineConfig(@Param('id') id: string, @Body() body: any) {
    return this.onlineEvalService.updateConfig(id, body);
  }

  // 删除配置
  @Post('online/configs/:id/delete')
  async deleteOnlineConfig(@Param('id') id: string) {
    return this.onlineEvalService.deleteConfig(id);
  }

  // 接收在线数据
  @Post('online/:id/ingest')
  async ingestOnlineData(@Param('id') id: string, @Body() body: any) {
    return this.onlineEvalService.ingest(id, body);
  }

  // 获取评测结果
  @Get('online/:id/results')
  async getOnlineResults(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('flagged') flagged?: string,
  ) {
    return this.onlineEvalService.getResults(id, {
      limit: limit ? +limit : undefined,
      flagged: flagged !== undefined ? flagged === 'true' : undefined,
    });
  }

  // 获取实时指标
  @Get('online/:id/metrics/realtime')
  async getOnlineRealtimeMetrics(
    @Param('id') id: string,
    @Query('window') window?: '1m' | '5m' | '15m' | '1h' | '24h',
  ) {
    return this.onlineEvalService.getRealtimeMetrics(id, window || '5m');
  }

  // ==================== 合成数据生成 ====================

  // 创建生成任务
  @Post('synthetic/tasks')
  async createSyntheticTask(@Body() body: any) {
    return this.syntheticDataService.createTask(body);
  }

  // 启动生成
  @Post('synthetic/tasks/:id/start')
  async startSyntheticGeneration(@Param('id') id: string) {
    return this.syntheticDataService.startGeneration(id);
  }

  // 获取任务列表
  @Get('synthetic/tasks')
  async listSyntheticTasks() {
    return this.syntheticDataService.listTasks();
  }

  // 获取任务详情
  @Get('synthetic/tasks/:id')
  async getSyntheticTask(@Param('id') id: string) {
    return this.syntheticDataService.getTask(id);
  }

  // 获取生成结果
  @Get('synthetic/tasks/:id/results')
  async getSyntheticResults(
    @Param('id') id: string,
    @Query('strategy') strategy?: GenerationStrategy,
    @Query('quality') quality?: DataQuality,
    @Query('limit') limit?: number,
  ) {
    return this.syntheticDataService.getResults(id, {
      strategy, quality, limit: limit ? +limit : undefined,
    });
  }

  // 导出 JSON
  @Get('synthetic/tasks/:id/export/json')
  async exportSyntheticJSON(@Param('id') id: string) {
    return this.syntheticDataService.exportAsJSON(id);
  }

  // 导出 CSV
  @Get('synthetic/tasks/:id/export/csv')
  async exportSyntheticCSV(@Param('id') id: string) {
    return this.syntheticDataService.exportAsCSV(id);
  }

  // 质量报告
  @Get('synthetic/tasks/:id/quality')
  async getSyntheticQualityReport(@Param('id') id: string) {
    return this.syntheticDataService.getQualityReport(id);
  }

  // 删除任务
  @Post('synthetic/tasks/:id/delete')
  async deleteSyntheticTask(@Param('id') id: string) {
    return this.syntheticDataService.deleteTask(id);
  }

  // ==================== 工作流引擎 ====================

  // 创建工作流
  @Post('workflows')
  async createWorkflow(@Body() body: any) {
    return this.workflowEngineService.createWorkflow(body);
  }

  // 获取工作流列表
  @Get('workflows')
  async listWorkflows() {
    return this.workflowEngineService.listWorkflows();
  }

  // 获取工作流详情
  @Get('workflows/:id')
  async getWorkflow(@Param('id') id: string) {
    return this.workflowEngineService.getWorkflow(id);
  }

  // 更新工作流
  @Post('workflows/:id')
  async updateWorkflow(@Param('id') id: string, @Body() body: any) {
    return this.workflowEngineService.updateWorkflow(id, body);
  }

  // 删除工作流
  @Post('workflows/:id/delete')
  async deleteWorkflow(@Param('id') id: string) {
    return this.workflowEngineService.deleteWorkflow(id);
  }

  // 执行工作流
  @Post('workflows/:id/execute')
  async executeWorkflow(@Param('id') id: string, @Body() body?: any) {
    return this.workflowEngineService.execute(id, body);
  }

  // 获取执行列表
  @Get('workflows/executions')
  async listWorkflowExecutions(@Query('workflowId') workflowId?: string) {
    return this.workflowEngineService.listExecutions(workflowId);
  }

  // 获取执行详情
  @Get('workflows/executions/:id')
  async getWorkflowExecution(@Param('id') id: string) {
    return this.workflowEngineService.getExecution(id);
  }

  // 取消执行
  @Post('workflows/executions/:id/cancel')
  async cancelWorkflowExecution(@Param('id') id: string) {
    return this.workflowEngineService.cancelExecution(id);
  }

  // 获取内置模板
  @Get('workflows/templates')
  async getWorkflowTemplates() {
    return this.workflowEngineService.getBuiltinTemplates();
  }

  // ==================== 数据血缘 ====================

  // 注册节点
  @Post('lineage/nodes')
  async registerLineageNode(@Body() body: any) {
    return this.dataLineageService.registerNode(body);
  }

  // 获取节点列表
  @Get('lineage/nodes')
  async listLineageNodes(@Query('type') type?: LineageNodeType) {
    return this.dataLineageService.listNodes(type);
  }

  // 创建边
  @Post('lineage/edges')
  async createLineageEdge(@Body() body: any) {
    return this.dataLineageService.createEdge(body);
  }

  // 获取上游
  @Get('lineage/:id/upstream')
  async getUpstream(@Param('id') id: string, @Query('depth') depth?: number) {
    return this.dataLineageService.getUpstream(id, depth ? +depth : 3);
  }

  // 获取下游
  @Get('lineage/:id/downstream')
  async getDownstream(@Param('id') id: string, @Query('depth') depth?: number) {
    return this.dataLineageService.getDownstream(id, depth ? +depth : 3);
  }

  // 获取完整血缘图
  @Get('lineage/:id/full')
  async getFullLineage(
    @Param('id') id: string,
    @Query('upstream') upstream?: number,
    @Query('downstream') downstream?: number,
  ) {
    return this.dataLineageService.getFullLineage(id, upstream ? +upstream : 2, downstream ? +downstream : 2);
  }

  // 影响分析
  @Get('lineage/:id/impact')
  async getImpactAnalysis(@Param('id') id: string) {
    return this.dataLineageService.impactAnalysis(id);
  }

  // 追踪评测运行血缘
  @Get('lineage/eval-run/:id/trace')
  async traceEvalRun(@Param('id') id: string) {
    return this.dataLineageService.traceEvalRun(id);
  }

  // 获取事件历史
  @Get('lineage/events')
  async getLineageEvents(@Query('nodeId') nodeId?: string, @Query('limit') limit?: number) {
    return this.dataLineageService.getAllEvents({ nodeId, limit: limit ? +limit : undefined });
  }

  // ==================== 多模型对比 ====================

  // 创建对比任务
  @Post('comparison')
  async createComparison(@Body() body: any) {
    return this.modelComparisonService.createTask(body);
  }

  // 执行对比
  @Post('comparison/:id/execute')
  async executeComparison(@Param('id') id: string) {
    return this.modelComparisonService.execute(id);
  }

  // 获取对比任务列表
  @Get('comparison')
  async listComparisons() {
    return this.modelComparisonService.listTasks();
  }

  // 获取对比详情
  @Get('comparison/:id')
  async getComparison(@Param('id') id: string) {
    return this.modelComparisonService.getTask(id);
  }

  // 导出对比报告
  @Get('comparison/:id/report')
  async exportComparisonReport(@Param('id') id: string) {
    return this.modelComparisonService.exportReport(id);
  }

  // 删除对比任务
  @Post('comparison/:id/delete')
  async deleteComparison(@Param('id') id: string) {
    return this.modelComparisonService.deleteTask(id);
  }

  // ==================== 告警规则 ====================

  // 创建告警规则
  @Post('alerts/rules')
  async createAlertRule(@Body() body: any) {
    return this.alertRuleService.createRule(body);
  }

  // 获取规则列表
  @Get('alerts/rules')
  async listAlertRules(@Query('enabled') enabled?: string) {
    return this.alertRuleService.listRules(enabled !== undefined ? enabled === 'true' : undefined);
  }

  // 获取规则详情
  @Get('alerts/rules/:id')
  async getAlertRule(@Param('id') id: string) {
    return this.alertRuleService.getRule(id);
  }

  // 更新规则
  @Post('alerts/rules/:id')
  async updateAlertRule(@Param('id') id: string, @Body() body: any) {
    return this.alertRuleService.updateRule(id, body);
  }

  // 删除规则
  @Post('alerts/rules/:id/delete')
  async deleteAlertRule(@Param('id') id: string) {
    return this.alertRuleService.deleteRule(id);
  }

  // 评估规则
  @Post('alerts/evaluate/:id')
  async evaluateAlertRule(@Param('id') id: string, @Body() body: Record<string, number>) {
    return this.alertRuleService.evaluateRule(id, body);
  }

  // 获取告警事件
  @Get('alerts/events')
  async listAlertEvents(
    @Query('ruleId') ruleId?: string,
    @Query('severity') severity?: AlertSeverity,
    @Query('status') status?: AlertStatus,
    @Query('limit') limit?: number,
  ) {
    return this.alertRuleService.listEvents({ ruleId, severity, status, limit: limit ? +limit : undefined });
  }

  // 确认告警
  @Post('alerts/events/:id/acknowledge')
  async acknowledgeAlert(@Param('id') id: string, @Body() body?: { userId?: string }) {
    return this.alertRuleService.acknowledgeEvent(id, body?.userId);
  }

  // 解决告警
  @Post('alerts/events/:id/resolve')
  async resolveAlert(@Param('id') id: string, @Body() body?: { userId?: string }) {
    return this.alertRuleService.resolveEvent(id, body?.userId);
  }

  // 告警统计
  @Get('alerts/stats')
  async getAlertStats() {
    return this.alertRuleService.getStats();
  }

  // 内置规则模板
  @Get('alerts/templates')
  async getAlertTemplates() {
    return this.alertRuleService.getBuiltinTemplates();
  }

  // ==================== 权限控制 ====================

  // 创建用户
  @Post('permissions/users')
  async createUser(@Body() body: any) {
    return this.permissionService.createUser(body);
  }

  // 获取用户列表
  @Get('permissions/users')
  async listUsers(@Query('role') role?: Role) {
    return this.permissionService.listUsers(role);
  }

  // 更新角色
  @Post('permissions/users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.permissionService.updateRole(id, body.role);
  }

  // 检查权限
  @Post('permissions/check')
  async checkPermission(@Body() body: { userId: string; resource: ResourceType; permission: Permission }) {
    return this.permissionService.checkPermission(body.userId, body.resource, body.permission);
  }

  // 创建 API Key
  @Post('permissions/api-keys')
  async createApiKey(@Body() body: any) {
    return this.permissionService.createApiKey(body);
  }

  // 获取 API Key 列表
  @Get('permissions/api-keys')
  async listApiKeys(@Query('userId') userId: string) {
    return this.permissionService.listApiKeys(userId);
  }

  // 撤销 API Key
  @Post('permissions/api-keys/:id/revoke')
  async revokeApiKey(@Param('id') id: string) {
    return this.permissionService.revokeApiKey(id);
  }

  // 获取角色权限
  @Get('permissions/roles/:role')
  async getRolePermissions(@Param('role') role: Role) {
    return this.permissionService.getRolePermissions(role);
  }

  // 获取所有角色
  @Get('permissions/roles')
  async getRoles() {
    return this.permissionService.getRoles();
  }

  // 审计日志
  @Get('permissions/audit-logs')
  async getAuditLogs(@Query('userId') userId?: string, @Query('limit') limit?: number) {
    return this.permissionService.getAuditLogs({ userId, limit: limit ? +limit : undefined });
  }

  // ==================== 数据集采样 ====================

  // 执行采样
  @Post('sampling/sample')
  async sampleDataset(@Body() body: any) {
    return this.datasetSamplingService.sample(body);
  }

  // 获取采样结果
  @Get('sampling/results/:id')
  async getSamplingResult(@Param('id') id: string) {
    return this.datasetSamplingService.getResult(id);
  }

  // 获取采样记录
  @Get('sampling/results')
  async listSamplingResults() {
    return this.datasetSamplingService.listResults();
  }

  // 获取可用策略
  @Get('sampling/strategies')
  async getSamplingStrategies() {
    return this.datasetSamplingService.getStrategies();
  }

  // ==================== 可视化数据 ====================

  // 获取评测概览
  @Get('visualization/overview')
  async getOverviewData() {
    return this.visualizationService.getOverviewData();
  }

  // 生成仪表盘
  @Post('visualization/dashboards')
  async generateDashboard(@Body() body: { name: string; timeRange?: any }) {
    return this.visualizationService.generateDashboard(body.name, body);
  }

  // 获取仪表盘
  @Get('visualization/dashboards/:id')
  async getDashboard(@Param('id') id: string) {
    return this.visualizationService.getDashboard(id);
  }

  // 获取仪表盘列表
  @Get('visualization/dashboards')
  async listDashboards() {
    return this.visualizationService.listDashboards();
  }

  // 删除仪表盘
  @Post('visualization/dashboards/:id/delete')
  async deleteDashboard(@Param('id') id: string) {
    return this.visualizationService.deleteDashboard(id);
  }

  // 模型对比图表
  @Post('visualization/comparison-chart')
  async getComparisonChart(@Body() body: { modelIds: string[]; metrics: string[] }) {
    return this.visualizationService.getComparisonChartData(body.modelIds, body.metrics);
  }

  // 指标分布图
  @Get('visualization/distribution/:metric')
  async getDistributionChart(@Param('metric') metric: string, @Query('model') model?: string) {
    return this.visualizationService.getDistributionChartData(metric, model);
  }

  // ==================== 配置管理 ====================

  // 获取配置
  @Get('config/:key')
  async getConfig(@Param('key') key: string, @Query('scopeId') scopeId?: string) {
    return this.evalConfigService.get(key, scopeId);
  }

  // 设置配置
  @Post('config')
  async setConfig(@Body() body: any) {
    return this.evalConfigService.set(body);
  }

  // 批量获取
  @Post('config/batch-get')
  async getManyConfigs(@Body() body: { keys: string[]; scopeId?: string }) {
    return this.evalConfigService.getMany(body.keys, body.scopeId);
  }

  // 获取配置列表
  @Get('config')
  async listConfigs(@Query('type') type?: ConfigType) {
    return this.evalConfigService.list(type);
  }

  // 删除配置
  @Post('config/:id/delete')
  async deleteConfig(@Param('id') id: string) {
    return this.evalConfigService.delete(id);
  }

  // 变更历史
  @Get('config/changes')
  async getConfigChanges(@Query('configId') configId?: string) {
    return this.evalConfigService.getChangeHistory(configId);
  }

  // 回滚
  @Post('config/:id/rollback')
  async rollbackConfig(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.evalConfigService.rollback(id, body.userId);
  }

  // 默认配置
  @Get('config/defaults/list')
  async getDefaultConfigs() {
    return this.evalConfigService.getDefaults();
  }

  // 导出配置
  @Get('config/export')
  async exportConfigs(@Query('scopeId') scopeId?: string) {
    return this.evalConfigService.exportConfig(scopeId);
  }

  // 导入配置
  @Post('config/import')
  async importConfigs(@Body() body: { json: string; userId: string }) {
    return this.evalConfigService.importConfig(body.json, body.userId);
  }

  // ==================== 结果搜索 ====================

  // 搜索
  @Get('search')
  async searchResults(
    @Query('q') q: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('sortBy') sortBy?: 'relevance' | 'date' | 'score',
  ) {
    return this.resultSearchService.search(q || '', {
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
      sortBy,
    });
  }

  // 高级搜索
  @Post('search/advanced')
  async advancedSearch(@Body() body: { query: string }) {
    return this.resultSearchService.advancedSearch(body.query);
  }

  // 重建索引
  @Post('search/reindex')
  async reindex() {
    return this.resultSearchService.reindex();
  }

  // 搜索统计
  @Get('search/stats')
  async getSearchStats() {
    return this.resultSearchService.getSearchStats();
  }

  // ==================== 多租户 ====================

  // 创建租户
  @Post('tenants')
  async createTenant(@Body() body: any) {
    return this.multiTenantService.createTenant(body);
  }

  // 获取租户
  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.multiTenantService.getTenant(id);
  }

  // 获取租户列表
  @Get('tenants')
  async listTenants(@Query('status') status?: TenantStatus) {
    return this.multiTenantService.listTenants(status);
  }

  // 更新设置
  @Post('tenants/:id/settings')
  async updateTenantSettings(@Param('id') id: string, @Body() body: any) {
    return this.multiTenantService.updateSettings(id, body);
  }

  // 升级计划
  @Post('tenants/:id/upgrade')
  async upgradeTenantPlan(@Param('id') id: string, @Body() body: { plan: TenantPlan }) {
    return this.multiTenantService.upgradePlan(id, body.plan);
  }

  // 检查配额
  @Get('tenants/:id/quota/:resource')
  async checkQuota(@Param('id') id: string, @Param('resource') resource: string) {
    return this.multiTenantService.checkQuota(id, resource as any);
  }

  // 使用统计
  @Get('tenants/:id/usage')
  async getUsageStats(@Param('id') id: string) {
    return this.multiTenantService.getUsageStats(id);
  }

  // 添加成员
  @Post('tenants/:id/members')
  async addMember(@Param('id') id: string, @Body() body: any) {
    return this.multiTenantService.addMember(id, body);
  }

  // 获取成员
  @Get('tenants/:id/members')
  async listMembers(@Param('id') id: string) {
    return this.multiTenantService.listMembers(id);
  }

  // 移除成员
  @Post('tenants/:id/members/:userId/remove')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.multiTenantService.removeMember(id, userId);
  }

  // 获取计划列表
  @Get('tenants/plans/list')
  async getPlans() {
    return this.multiTenantService.getPlans();
  }

  // ==================== 评测缓存 ====================

  @Get('eval-cache/:key')
  async getCacheEntry(@Param('key') key: string) {
    return this.evalCacheService.get(key);
  }

  @Post('eval-cache')
  async setCacheEntry(@Body() body: any) {
    return this.evalCacheService.set(body.key, body);
  }

  @Get('eval-cache/stats')
  async getCacheStats() {
    return this.evalCacheService.getStats();
  }

  @Post('eval-cache/clear')
  async clearCache() {
    return this.evalCacheService.clearAll();
  }

  @Post('eval-cache/clear-expired')
  async clearExpiredCache() {
    return this.evalCacheService.clearExpired();
  }

  @Post('eval-cache/warmup')
  async warmupCache(@Body() body: any[]) {
    return this.evalCacheService.warmup(body);
  }

  @Get('eval-cache/config')
  async getCacheConfig() {
    return this.evalCacheService.getConfig();
  }

  @Post('eval-cache/config')
  async updateCacheConfig(@Body() body: any) {
    return this.evalCacheService.updateConfig(body);
  }

  // ==================== Prompt 版本 ====================

  @Post('prompts')
  async createPrompt(@Body() body: any) {
    return this.promptVersionService.createPrompt(body);
  }

  @Get('prompts')
  async listPrompts(@Query('category') category?: string) {
    return this.promptVersionService.listPrompts(category);
  }

  @Get('prompts/:id')
  async getPrompt(@Param('id') id: string) {
    return this.promptVersionService.getPrompt(id);
  }

  @Post('prompts/:id/versions')
  async createPromptVersion(@Param('id') id: string, @Body() body: any) {
    return this.promptVersionService.createVersion(id, body);
  }

  @Get('prompts/:id/versions')
  async getPromptVersions(@Param('id') id: string) {
    return this.promptVersionService.getVersionHistory(id);
  }

  @Post('prompts/:id/versions/:versionId/activate')
  async activatePromptVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.promptVersionService.activateVersion(id, versionId);
  }

  @Post('prompts/:id/rollback')
  async rollbackPrompt(@Param('id') id: string) {
    return this.promptVersionService.rollbackVersion(id);
  }

  @Post('prompts/:id/render')
  async renderPrompt(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.promptVersionService.renderPrompt(id, body);
  }

  @Post('prompts/:id/versions/:versionId/test')
  async testPromptVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.promptVersionService.runTests(id, versionId);
  }

  @Post('prompts/:id/test-cases')
  async addTestCase(@Param('id') id: string, @Body() body: any) {
    return this.promptVersionService.addTestCase(id, body);
  }

  @Post('prompts/:id/delete')
  async deletePrompt(@Param('id') id: string) {
    return this.promptVersionService.deletePrompt(id);
  }

  // ==================== 评测回放 ====================

  @Post('replay')
  async createReplay(@Body() body: any) {
    return this.evalReplayService.createTask(body);
  }

  @Post('replay/:id/execute')
  async executeReplay(@Param('id') id: string) {
    return this.evalReplayService.execute(id);
  }

  @Get('replay')
  async listReplays(@Query('sourceEvalRunId') sourceEvalRunId?: string) {
    return this.evalReplayService.listTasks(sourceEvalRunId);
  }

  @Get('replay/:id')
  async getReplay(@Param('id') id: string) {
    return this.evalReplayService.getTask(id);
  }

  @Get('replay/:id/results')
  async getReplayResults(@Param('id') id: string) {
    return this.evalReplayService.getResults(id);
  }

  @Get('replay/:id/comparison')
  async getReplayComparison(@Param('id') id: string) {
    return this.evalReplayService.getComparisonSummary(id);
  }

  @Get('replay/:id/report')
  async getReplayReport(@Param('id') id: string) {
    return this.evalReplayService.exportReport(id);
  }

  @Post('replay/:id/cancel')
  async cancelReplay(@Param('id') id: string) {
    return this.evalReplayService.cancelTask(id);
  }

  @Post('replay/:id/delete')
  async deleteReplay(@Param('id') id: string) {
    return this.evalReplayService.deleteTask(id);
  }

  // ==================== 实验追踪 ====================

  @Post('experiments')
  async createExperiment(@Body() body: any) {
    return this.experimentTrackingService.createExperiment(body);
  }

  @Get('experiments')
  async listExperiments() {
    return this.experimentTrackingService.listExperiments();
  }

  @Get('experiments/:id')
  async getExperiment(@Param('id') id: string) {
    return this.experimentTrackingService.getExperiment(id);
  }

  @Post('experiments/:id/runs')
  async startRun(@Param('id') id: string, @Body() body: any) {
    return this.experimentTrackingService.startRun(id, body);
  }

  @Get('experiments/:id/runs')
  async listRuns(@Param('id') id: string) {
    return this.experimentTrackingService.listRuns(id);
  }

  @Get('experiments/runs/:runId')
  async getRun(@Param('runId') runId: string) {
    return this.experimentTrackingService.getRun(runId);
  }

  @Post('experiments/runs/:runId/metrics')
  async logMetrics(@Param('runId') runId: string, @Body() body: Record<string, number>) {
    return this.experimentTrackingService.logMetrics(runId, body);
  }

  @Post('experiments/runs/:runId/params')
  async logParams(@Param('runId') runId: string, @Body() body: Record<string, any>) {
    return this.experimentTrackingService.logParams(runId, body);
  }

  @Post('experiments/runs/:runId/end')
  async endRun(@Param('runId') runId: string, @Body() body: any) {
    return this.experimentTrackingService.endRun(runId, body.status);
  }

  @Post('experiments/compare')
  async compareRuns(@Body() body: { runIds: string[] }) {
    return this.experimentTrackingService.compareRuns(body.runIds);
  }

  @Post('experiments/search')
  async searchRuns(@Body() body: any) {
    return this.experimentTrackingService.searchRuns(body);
  }

  @Get('experiments/:id/best')
  async getBestRun(@Param('id') id: string, @Query('metric') metric: string) {
    return this.experimentTrackingService.getBestRun(id, metric);
  }

  @Post('experiments/:id/delete')
  async deleteExperiment(@Param('id') id: string) {
    return this.experimentTrackingService.deleteExperiment(id);
  }

  // ==================== 数据脱敏 ====================

  @Post('anonymization/anonymize')
  async anonymizeText(@Body() body: { text: string }) {
    return this.dataAnonymizationService.anonymize(body.text);
  }

  @Post('anonymization/anonymize-batch')
  async anonymizeBatch(@Body() body: { texts: string[] }) {
    return this.dataAnonymizationService.anonymizeBatch(body.texts);
  }

  @Post('anonymization/anonymize-json')
  async anonymizeJson(@Body() body: { data: any; fields?: string[] }) {
    return this.dataAnonymizationService.anonymizeJson(body.data, body.fields);
  }

  @Post('anonymization/detect')
  async detectSensitiveData(@Body() body: { text: string }) {
    return this.dataAnonymizationService.detectSensitiveData(body.text);
  }

  @Get('anonymization/rules')
  async getAnonymizationRules() {
    return this.dataAnonymizationService.getRules();
  }

  @Post('anonymization/rules')
  async addAnonymizationRule(@Body() body: any) {
    return this.dataAnonymizationService.addRule(body);
  }

  @Post('anonymization/rules/:id/toggle')
  async toggleAnonymizationRule(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.dataAnonymizationService.toggleRule(id, body.enabled);
  }

  @Post('anonymization/rules/:id/delete')
  async deleteAnonymizationRule(@Param('id') id: string) {
    return this.dataAnonymizationService.deleteRule(id);
  }

  // ==================== API 限流 ====================

  @Post('rate-limiting/check')
  async checkRateLimit(@Body() body: { configId: string; key: string }) {
    return this.rateLimitingService.check(body.configId, body.key);
  }

  @Get('rate-limiting/configs')
  async listRateLimitConfigs() {
    return this.rateLimitingService.listConfigs();
  }

  @Post('rate-limiting/configs')
  async createRateLimitConfig(@Body() body: any) {
    return this.rateLimitingService.createConfig(body);
  }

  @Post('rate-limiting/configs/:id')
  async updateRateLimitConfig(@Param('id') id: string, @Body() body: any) {
    return this.rateLimitingService.updateConfig(id, body);
  }

  @Post('rate-limiting/configs/:id/delete')
  async deleteRateLimitConfig(@Param('id') id: string) {
    return this.rateLimitingService.deleteConfig(id);
  }

  @Get('rate-limiting/stats')
  async getRateLimitStats() {
    return this.rateLimitingService.getStats();
  }

  @Get('rate-limiting/blocklist')
  async getRateLimitBlocklist() {
    return this.rateLimitingService.getBlocklist();
  }

  @Post('rate-limiting/reset')
  async resetRateLimitCounters(@Body() body: { configId?: string }) {
    return this.rateLimitingService.resetCounters(body.configId);
  }

  // ==================== 数据增强 API ====================

  @Post('data-augmentation/tasks')
  async createAugmentationTask(@Body() body: {
    name: string;
    description?: string;
    sourceData: any[];
    strategies: AugmentationStrategy[];
    config?: any;
  }) {
    return this.dataAugmentationService.createTask(body);
  }

  @Get('data-augmentation/tasks')
  async listAugmentationTasks() {
    return this.dataAugmentationService.listTasks();
  }

  @Get('data-augmentation/tasks/:id')
  async getAugmentationTask(@Param('id') id: string) {
    return this.dataAugmentationService.getTask(id);
  }

  @Post('data-augmentation/tasks/:id/execute')
  async executeAugmentationTask(@Param('id') id: string) {
    return this.dataAugmentationService.execute(id);
  }

  @Get('data-augmentation/tasks/:id/results')
  async getAugmentationResults(
    @Param('id') id: string,
    @Query('strategy') strategy?: AugmentationStrategy,
    @Query('limit') limit?: number,
  ) {
    return this.dataAugmentationService.getResults(id, { strategy, limit: limit ? +limit : undefined });
  }

  @Get('data-augmentation/tasks/:id/export')
  async exportAugmentationResults(@Param('id') id: string) {
    return this.dataAugmentationService.exportAsJSON(id);
  }

  @Post('data-augmentation/tasks/:id/delete')
  async deleteAugmentationTask(@Param('id') id: string) {
    return this.dataAugmentationService.deleteTask(id);
  }

  @Get('data-augmentation/strategies')
  async getAugmentationStrategies() {
    return this.dataAugmentationService.getStrategies();
  }

  // ==================== 多语言评测 API ====================

  @Post('multilingual/evaluate')
  async evaluateMultilingual(@Body() body: any) {
    return this.multilingualEvalService.evaluate(body);
  }

  @Get('multilingual/results')
  async getMultilingualResults(
    @Query('type') type?: MultilingualEvalType,
    @Query('language') language?: Language,
    @Query('limit') limit?: number,
  ) {
    return this.multilingualEvalService.getResults({ type, language, limit: limit ? +limit : undefined });
  }

  @Get('multilingual/languages')
  async getMultilingualLanguages(@Query('language') language?: Language) {
    return this.multilingualEvalService.getLanguageConfig(language);
  }

  @Get('multilingual/eval-types')
  async getMultilingualEvalTypes() {
    return this.multilingualEvalService.getEvalTypes();
  }

  // ==================== 报告生成 API ====================

  @Post('reports/configs')
  async createReportConfig(@Body() body: {
    name: string;
    type: ReportType;
    format: ReportFormat;
    config: any;
    schedule?: any;
    createdBy: string;
  }) {
    return this.reportGeneratorService.createConfig(body);
  }

  @Get('reports/configs')
  async listReportConfigs() {
    return this.reportGeneratorService.listConfigs();
  }

  @Get('reports/configs/:id')
  async getReportConfig(@Param('id') id: string) {
    return this.reportGeneratorService.getConfig(id);
  }

  @Post('reports/configs/:id/delete')
  async deleteReportConfig(@Param('id') id: string) {
    return this.reportGeneratorService.deleteConfig(id);
  }

  @Post('reports/generate/:configId')
  async generateReport(@Param('configId') configId: string) {
    return this.reportGeneratorService.generate(configId);
  }

  @Get('reports/results')
  async listReportResults(@Query('configId') configId?: string) {
    return this.reportGeneratorService.listResults(configId);
  }

  @Get('reports/results/:id')
  async getReportResult(@Param('id') id: string) {
    return this.reportGeneratorService.getResult(id);
  }

  @Post('reports/results/:id/delete')
  async deleteReportResult(@Param('id') id: string) {
    return this.reportGeneratorService.deleteResult(id);
  }

  @Get('reports/types')
  async getReportTypes() {
    return this.reportGeneratorService.getReportTypes();
  }

  @Get('reports/formats')
  async getReportFormats() {
    return this.reportGeneratorService.getReportFormats();
  }

  // ==================== 数据版本控制 API ====================

  @Post('data-versioning/versions')
  async createDataVersion(@Body() body: {
    datasetId: string;
    name: string;
    description?: string;
    data: any[];
    tags?: string[];
    createdBy: string;
  }) {
    return this.dataVersioningService.createVersion(body);
  }

  @Get('data-versioning/versions/:datasetId')
  async getDataVersions(
    @Param('datasetId') datasetId: string,
    @Query('status') status?: 'draft' | 'published' | 'archived',
    @Query('tag') tag?: string,
  ) {
    return this.dataVersioningService.getVersions(datasetId, { status, tag });
  }

  @Get('data-versioning/versions/:datasetId/:version')
  async getDataVersion(
    @Param('datasetId') datasetId: string,
    @Param('version') version: number,
  ) {
    return this.dataVersioningService.getVersion(datasetId, +version);
  }

  @Post('data-versioning/versions/:datasetId/:version/publish')
  async publishDataVersion(
    @Param('datasetId') datasetId: string,
    @Param('version') version: number,
  ) {
    return this.dataVersioningService.publishVersion(datasetId, +version);
  }

  @Post('data-versioning/versions/:datasetId/:version/archive')
  async archiveDataVersion(
    @Param('datasetId') datasetId: string,
    @Param('version') version: number,
  ) {
    return this.dataVersioningService.archiveVersion(datasetId, +version);
  }

  @Post('data-versioning/diff')
  async diffDataVersions(@Body() body: {
    datasetId: string;
    versionA: number;
    versionB: number;
  }) {
    return this.dataVersioningService.diffVersions(body.datasetId, body.versionA, body.versionB);
  }

  @Post('data-versioning/rollback/:datasetId/:version')
  async rollbackDataVersion(
    @Param('datasetId') datasetId: string,
    @Param('version') version: number,
  ) {
    return this.dataVersioningService.rollbackVersion(datasetId, +version);
  }

  @Get('data-versioning/stats/:datasetId')
  async getDataVersionStats(@Param('datasetId') datasetId: string) {
    return this.dataVersioningService.getVersionStats(datasetId);
  }

  // ==================== 指标归因分析 API ====================

  @Post('metric-attribution/analyze')
  async analyzeMetricAttribution(@Body() body: any) {
    return this.metricAttributionService.analyze(body);
  }

  @Get('metric-attribution/results')
  async getAttributionResults(
    @Query('type') type?: AttributionType,
    @Query('targetId') targetId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.metricAttributionService.getResults({ type, targetId, limit: limit ? +limit : undefined });
  }

  @Get('metric-attribution/results/:id')
  async getAttributionResult(@Param('id') id: string) {
    return this.metricAttributionService.getResult(id);
  }

  @Post('metric-attribution/results/:id/delete')
  async deleteAttributionResult(@Param('id') id: string) {
    return this.metricAttributionService.deleteResult(id);
  }

  @Get('metric-attribution/feature-importance/:targetId')
  async getFeatureImportance(
    @Param('targetId') targetId: string,
    @Query('topK') topK?: number,
  ) {
    return this.metricAttributionService.getFeatureImportance(targetId, topK ? +topK : 10);
  }

  @Get('metric-attribution/sample-influence/:targetId')
  async getSampleInfluence(
    @Param('targetId') targetId: string,
    @Query('topK') topK?: number,
  ) {
    return this.metricAttributionService.getSampleInfluence(targetId, topK ? +topK : 10);
  }

  @Post('metric-attribution/compare')
  async compareAttributions(@Body() body: { resultIds: string[] }) {
    return this.metricAttributionService.compareAttributions(body.resultIds);
  }

  @Get('metric-attribution/types')
  async getAttributionTypes() {
    return this.metricAttributionService.getAttributionTypes();
  }

  // ==================== 场景管理 API ====================

  @Post('scenarios')
  async createScenario(@Body() body: {
    name: string;
    description?: string;
    type: ScenarioType;
    config: any;
    constraints?: any;
    tags?: string[];
    createdBy: string;
  }) {
    return this.scenarioManagementService.createScenario(body);
  }

  @Post('scenarios/from-template/:templateId')
  async createScenarioFromTemplate(@Param('templateId') templateId: string, @Body() body: {
    name: string;
    description?: string;
    models: string[];
    datasets: string[];
    createdBy: string;
  }) {
    return this.scenarioManagementService.createFromTemplate(templateId, body);
  }

  @Get('scenarios')
  async listScenarios(
    @Query('type') type?: ScenarioType,
    @Query('status') status?: 'draft' | 'active' | 'archived',
    @Query('tag') tag?: string,
  ) {
    return this.scenarioManagementService.listScenarios({ type, status, tag });
  }

  @Get('scenarios/:id')
  async getScenario(@Param('id') id: string) {
    return this.scenarioManagementService.getScenario(id);
  }

  @Post('scenarios/:id/activate')
  async activateScenario(@Param('id') id: string) {
    return this.scenarioManagementService.activateScenario(id);
  }

  @Post('scenarios/:id/archive')
  async archiveScenario(@Param('id') id: string) {
    return this.scenarioManagementService.archiveScenario(id);
  }

  @Post('scenarios/:id/execute')
  async executeScenario(@Param('id') id: string) {
    return this.scenarioManagementService.executeScenario(id);
  }

  @Get('scenarios/executions')
  async getScenarioExecutions(
    @Query('scenarioId') scenarioId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.scenarioManagementService.getExecutions(scenarioId, limit ? +limit : 20);
  }

  @Get('scenarios/executions/:id')
  async getScenarioExecution(@Param('id') id: string) {
    return this.scenarioManagementService.getExecution(id);
  }

  @Get('scenarios/templates')
  async getScenarioTemplates(@Query('type') type?: ScenarioType) {
    return this.scenarioManagementService.getTemplates(type);
  }

  @Get('scenarios/templates/:id')
  async getScenarioTemplate(@Param('id') id: string) {
    return this.scenarioManagementService.getTemplate(id);
  }

  @Get('scenarios/types')
  async getScenarioTypes() {
    return this.scenarioManagementService.getScenarioTypes();
  }

  @Get('scenarios/stats')
  async getScenarioStats() {
    return this.scenarioManagementService.getScenarioStats();
  }

  // ==================== 数据质量评估 API ====================

  @Post('data-quality/check')
  async checkDataQuality(@Body() body: {
    datasetId: string;
    datasetName: string;
    data: any[];
  }) {
    return this.dataQualityService.checkQuality(body.datasetId, body.datasetName, body.data);
  }

  @Get('data-quality/results')
  async getDataQualityResults(
    @Query('datasetId') datasetId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.dataQualityService.getResults(datasetId, limit ? +limit : 20);
  }

  @Get('data-quality/results/:id')
  async getDataQualityResult(@Param('id') id: string) {
    return this.dataQualityService.getResult(id);
  }

  @Post('data-quality/results/:id/delete')
  async deleteDataQualityResult(@Param('id') id: string) {
    return this.dataQualityService.deleteResult(id);
  }

  @Get('data-quality/rules')
  async getDataQualityRules(@Query('type') type?: QualityCheckType) {
    return this.dataQualityService.getRules(type);
  }

  @Post('data-quality/rules')
  async addDataQualityRule(@Body() body: any) {
    return this.dataQualityService.addRule(body);
  }

  @Post('data-quality/rules/:id/update')
  async updateDataQualityRule(@Param('id') id: string, @Body() body: any) {
    return this.dataQualityService.updateRule(id, body);
  }

  @Post('data-quality/rules/:id/delete')
  async deleteDataQualityRule(@Param('id') id: string) {
    return this.dataQualityService.deleteRule(id);
  }

  @Get('data-quality/dimensions')
  async getDataQualityDimensions() {
    return this.dataQualityService.getDimensions();
  }

  @Get('data-quality/check-types')
  async getDataQualityCheckTypes() {
    return this.dataQualityService.getCheckTypes();
  }

  // ==================== 任务编排 API ====================

  @Post('task-orchestration/orchestrations')
  async createOrchestration(@Body() body: any) {
    return this.taskOrchestrationService.createOrchestration(body);
  }

  @Get('task-orchestration/orchestrations')
  async listOrchestrations(@Query('status') status?: TaskStatus) {
    return this.taskOrchestrationService.listOrchestrations(status);
  }

  @Get('task-orchestration/orchestrations/:id')
  async getOrchestration(@Param('id') id: string) {
    return this.taskOrchestrationService.getOrchestration(id);
  }

  @Post('task-orchestration/orchestrations/:id/execute')
  async executeOrchestration(@Param('id') id: string) {
    return this.taskOrchestrationService.execute(id);
  }

  @Post('task-orchestration/orchestrations/:id/cancel')
  async cancelOrchestration(@Param('id') id: string) {
    return this.taskOrchestrationService.cancelOrchestration(id);
  }

  @Post('task-orchestration/orchestrations/:id/retry')
  async retryFailedNodes(@Param('id') id: string) {
    return this.taskOrchestrationService.retryFailedNodes(id);
  }

  @Get('task-orchestration/orchestrations/:id/logs')
  async getOrchestrationLogs(
    @Param('id') id: string,
    @Query('nodeId') nodeId?: string,
  ) {
    return this.taskOrchestrationService.getLogs(id, nodeId);
  }

  @Get('task-orchestration/task-types')
  async getTaskTypes() {
    return this.taskOrchestrationService.getTaskTypes();
  }

  @Get('task-orchestration/stats')
  async getOrchestrationStats() {
    return this.taskOrchestrationService.getOrchestrationStats();
  }

  // ==================== 结果可解释性 API ====================

  @Post('result-explanation/explain')
  async generateExplanation(@Body() body: any) {
    return this.resultExplanationService.generateExplanation(body);
  }

  @Get('result-explanation/explanations')
  async getExplanations(
    @Query('resultId') resultId?: string,
    @Query('type') type?: ExplanationType,
  ) {
    return this.resultExplanationService.getExplanations(resultId, type);
  }

  @Get('result-explanation/explanations/:id')
  async getExplanation(@Param('id') id: string) {
    return this.resultExplanationService.getExplanation(id);
  }

  @Post('result-explanation/explanations/:id/delete')
  async deleteExplanation(@Param('id') id: string) {
    return this.resultExplanationService.deleteExplanation(id);
  }

  @Get('result-explanation/types')
  async getExplanationTypes() {
    return this.resultExplanationService.getExplanationTypes();
  }

  @Post('result-explanation/compare')
  async compareExplanations(@Body() body: { explanationIds: string[] }) {
    return this.resultExplanationService.compareExplanations(body.explanationIds);
  }

  // ==================== 标注辅助 API ====================

  @Post('annotation/tasks')
  async createAnnotationTask(@Body() body: any) {
    return this.annotationAssistanceService.createTask(body);
  }

  @Get('annotation/tasks')
  async listAnnotationTasks(
    @Query('type') type?: AnnotationType,
    @Query('status') status?: string,
  ) {
    return this.annotationAssistanceService.listTasks(type, status);
  }

  @Get('annotation/tasks/:id')
  async getAnnotationTask(@Param('id') id: string) {
    return this.annotationAssistanceService.getTask(id);
  }

  @Post('annotation/tasks/:id/pre-annotate')
  async generatePreAnnotations(@Param('id') id: string) {
    return this.annotationAssistanceService.generatePreAnnotations(id);
  }

  @Post('annotation/tasks/:id/submit')
  async submitAnnotation(
    @Param('id') id: string,
    @Body() body: { itemId: string; annotation: any },
  ) {
    return this.annotationAssistanceService.submitAnnotation(id, body.itemId, body.annotation);
  }

  @Post('annotation/tasks/:id/review')
  async reviewAnnotation(
    @Param('id') id: string,
    @Body() body: { itemId: string; approved: boolean },
  ) {
    return this.annotationAssistanceService.reviewAnnotation(id, body.itemId, body.approved);
  }

  @Get('annotation/tasks/:id/pending')
  async getPendingItems(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.annotationAssistanceService.getPendingItems(id, limit ? +limit : 10);
  }

  @Get('annotation/tasks/:id/annotated')
  async getAnnotatedItems(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.annotationAssistanceService.getAnnotatedItems(id, limit ? +limit : 10);
  }

  @Post('annotation/tasks/:id/activate')
  async activateAnnotationTask(@Param('id') id: string) {
    return this.annotationAssistanceService.activateTask(id);
  }

  @Post('annotation/tasks/:id/complete')
  async completeAnnotationTask(@Param('id') id: string) {
    return this.annotationAssistanceService.completeTask(id);
  }

  @Get('annotation/tasks/:id/quality')
  async getAnnotationQuality(@Param('id') id: string) {
    return this.annotationAssistanceService.getQualityMetrics(id);
  }

  @Get('annotation/tasks/:id/export')
  async exportAnnotations(@Param('id') id: string) {
    return this.annotationAssistanceService.exportAnnotations(id);
  }

  @Get('annotation/types')
  async getAnnotationTypes() {
    return this.annotationAssistanceService.getAnnotationTypes();
  }

  // ==================== 模型蒸馏 API ====================

  @Post('distillation/tasks')
  async createDistillationTask(@Body() body: any) {
    return this.modelDistillationService.createTask(body);
  }

  @Get('distillation/tasks')
  async listDistillationTasks(@Query('status') status?: string) {
    return this.modelDistillationService.listTasks(status);
  }

  @Get('distillation/tasks/:id')
  async getDistillationTask(@Param('id') id: string) {
    return this.modelDistillationService.getTask(id);
  }

  @Post('distillation/tasks/:id/execute')
  async executeDistillation(@Param('id') id: string) {
    return this.modelDistillationService.execute(id);
  }

  @Post('distillation/tasks/:id/generate-data')
  async generateDistillationData(
    @Param('id') id: string,
    @Body() body: { count?: number },
  ) {
    return this.modelDistillationService.generateDistillationData(id, body.count || 100);
  }

  @Get('distillation/tasks/:id/data')
  async getDistillationData(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.modelDistillationService.getDistillationData(id, limit ? +limit : 50);
  }

  @Get('distillation/tasks/:id/metrics')
  async getDistillationMetrics(@Param('id') id: string) {
    return this.modelDistillationService.getTaskMetrics(id);
  }

  @Get('distillation/tasks/:id/compare')
  async compareDistillationModels(@Param('id') id: string) {
    return this.modelDistillationService.compareModels(id);
  }

  @Get('distillation/templates')
  async getDistillationTemplates(@Query('strategy') strategy?: DistillationStrategy) {
    return this.modelDistillationService.getTemplates(strategy);
  }

  @Get('distillation/templates/:id')
  async getDistillationTemplate(@Param('id') id: string) {
    return this.modelDistillationService.getTemplate(id);
  }

  @Get('distillation/strategies')
  async getDistillationStrategies() {
    return this.modelDistillationService.getStrategies();
  }

  @Get('distillation/stats')
  async getDistillationStats() {
    return this.modelDistillationService.getDistillationStats();
  }

  // ==================== 联邦学习评测 API ====================

  @Post('federated/tasks')
  async createFederatedTask(@Body() body: any) {
    return this.federatedEvalService.createTask(body);
  }

  @Get('federated/tasks')
  async listFederatedTasks(@Query('status') status?: string) {
    return this.federatedEvalService.listTasks(status);
  }

  @Get('federated/tasks/:id')
  async getFederatedTask(@Param('id') id: string) {
    return this.federatedEvalService.getTask(id);
  }

  @Post('federated/tasks/:id/execute')
  async executeFederated(@Param('id') id: string) {
    return this.federatedEvalService.execute(id);
  }

  @Get('federated/tasks/:id/history')
  async getFederatedRoundHistory(@Param('id') id: string) {
    return this.federatedEvalService.getRoundHistory(id);
  }

  @Get('federated/tasks/:id/participants')
  async getFederatedParticipants(@Param('id') id: string) {
    return this.federatedEvalService.getParticipantStatus(id);
  }

  @Post('federated/tasks/:id/participants/:participantId/status')
  async updateParticipantStatus(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body() body: { status: string },
  ) {
    return this.federatedEvalService.updateParticipantStatus(id, participantId, body.status as any);
  }

  @Get('federated/tasks/:id/metrics')
  async getFederatedMetrics(@Param('id') id: string) {
    return this.federatedEvalService.getFederatedMetrics(id);
  }

  @Post('federated/tasks/:id/privacy')
  async setFederatedPrivacyConfig(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.federatedEvalService.setPrivacyConfig(id, body);
  }

  @Get('federated/tasks/:id/privacy')
  async getFederatedPrivacyConfig(@Param('id') id: string) {
    return this.federatedEvalService.getPrivacyConfig(id);
  }

  @Get('federated/types')
  async getFederatedTypes() {
    return this.federatedEvalService.getFederatedTypes();
  }

  @Get('federated/strategies')
  async getAggregationStrategies() {
    return this.federatedEvalService.getAggregationStrategies();
  }

  @Get('federated/stats')
  async getFederatedStats() {
    return this.federatedEvalService.getFederatedStats();
  }

  // ==================== v1.23 API ====================

  @Post('model-registry/register')
  async registerModel(@Body() body: any) { return this.modelRegistryService.register(body); }

  @Get('model-registry/models')
  async listModels(@Query('provider') provider?: ModelProvider) { return this.modelRegistryService.list(provider); }

  @Get('model-registry/models/:id')
  async getModel(@Param('id') id: string) { return this.modelRegistryService.get(id); }

  @Post('model-registry/models/:id/update')
  async updateModel(@Param('id') id: string, @Body() body: any) { return this.modelRegistryService.update(id, body); }

  @Post('model-registry/models/:id/deactivate')
  async deactivateModel(@Param('id') id: string) { return this.modelRegistryService.deactivate(id); }

  @Post('model-registry/models/:id/delete')
  async deleteModel(@Param('id') id: string) { return this.modelRegistryService.delete(id); }

  @Post('model-registry/compare')
  async compareModels(@Body() body: { modelIds: string[] }) { return this.modelRegistryService.compare(body.modelIds); }

  @Get('model-registry/providers')
  async getProviders() { return this.modelRegistryService.getProviders(); }

  @Post('comparison/create')
  async createComparison(@Body() body: any) { return this.comparisonAnalysisService.create(body); }

  @Get('comparison/list')
  async listComparisons() { return this.comparisonAnalysisService.list(); }

  @Get('comparison/:id')
  async getComparison(@Param('id') id: string) { return this.comparisonAnalysisService.get(id); }

  @Post('comparison/:id/delete')
  async deleteComparison(@Param('id') id: string) { return this.comparisonAnalysisService.delete(id); }

  @Get('comparison/:id/ranking')
  async getComparisonRanking(@Param('id') id: string) { return this.comparisonAnalysisService.getRanking(id); }

  @Post('transform/create')
  async createTransformTask(@Body() body: any) { return this.dataTransformService.createTask(body); }

  @Post('transform/:id/execute')
  async executeTransform(@Param('id') id: string, @Body() body: { inputData: any[] }) { return this.dataTransformService.execute(id, body.inputData); }

  @Get('transform/list')
  async listTransformTasks() { return this.dataTransformService.list(); }

  @Get('transform/:id')
  async getTransformTask(@Param('id') id: string) { return this.dataTransformService.get(id); }

  @Post('transform/:id/delete')
  async deleteTransformTask(@Param('id') id: string) { return this.dataTransformService.delete(id); }

  @Get('transform/types')
  async getTransformTypes() { return this.dataTransformService.getTransformTypes(); }

  // ==================== v1.24-v1.42 API ====================

  // Sandbox
  @Post('sandbox/create') async createSandbox(@Body() body: any) { return this.evalSandboxService.createSandbox(body); }
  @Post('sandbox/:id/execute') async executeSandbox(@Param('id') id: string, @Body() body: any) { return this.evalSandboxService.execute(id, body); }
  @Get('sandbox/list') async listSandboxes() { return this.evalSandboxService.listSandboxes(); }

  // Finetune
  @Post('finetune/evaluate') async evaluateFinetune(@Body() body: any) { return this.finetuneEvalService.evaluate(body); }
  @Get('finetune/list') async listFinetune(@Query('modelId') modelId?: string) { return this.finetuneEvalService.list(modelId); }

  // Knowledge Base
  @Post('kb/evaluate') async evaluateKB(@Body() body: any) { return this.knowledgeBaseEvalService.evaluate(body); }
  @Get('kb/list') async listKB(@Query('kbId') kbId?: string) { return this.knowledgeBaseEvalService.list(kbId); }

  // Custom Metric
  @Post('custom-metric/create') async createCustomMetric(@Body() body: any) { return this.customMetricService.create(body); }
  @Get('custom-metric/list') async listCustomMetrics() { return this.customMetricService.list(); }
  @Post('custom-metric/:id/calculate') async calculateCustomMetric(@Param('id') id: string, @Body() body: any) { return this.customMetricService.calculate(id, body); }

  // Result Aggregation
  @Post('result-agg/create') async createResultAgg(@Body() body: any) { return this.resultAggregationService.create(body); }
  @Get('result-agg/list') async listResultAgg() { return this.resultAggregationService.list(); }

  // Task Template
  @Post('task-template/create') async createTaskTemplate(@Body() body: any) { return this.taskTemplateService.create(body); }
  @Get('task-template/list') async listTaskTemplates() { return this.taskTemplateService.list(); }
  @Post('task-template/:id/instantiate') async instantiateTemplate(@Param('id') id: string, @Body() body: any) { return this.taskTemplateService.instantiate(id, body); }

  // Model Version
  @Post('model-version/create') async createModelVersion(@Body() body: any) { return this.modelVersionService.create(body); }
  @Get('model-version/list/:modelId') async listModelVersions(@Param('modelId') modelId: string) { return this.modelVersionService.list(modelId); }

  // Data Pipeline
  @Post('data-pipeline/create') async createDataPipeline(@Body() body: any) { return this.dataPipelineService.create(body); }
  @Post('data-pipeline/:id/execute') async executeDataPipeline(@Param('id') id: string) { return this.dataPipelineService.execute(id); }

  // Result Subscription
  @Post('result-sub/create') async createResultSub(@Body() body: any) { return this.resultSubscriptionService.create(body); }
  @Get('result-sub/list') async listResultSubs() { return this.resultSubscriptionService.list(); }

  // Batch Services (v1.27-v1.42)
  @Post('metric-regression/detect') async detectMetricRegression(@Body() body: any) { return this.metricRegressionService.detect(body); }
  @Post('data-validation/validate') async validateData(@Body() body: any) { return this.dataValidationService.validate(body.data, body.rules); }
  @Post('result-sharding/shard') async shardResults(@Body() body: any) { return this.resultShardingService.shard(body.data, body.shardCount); }
  @Post('performance/analyze') async analyzePerformance(@Body() body: any) { return this.performanceAnalysisService.analyze(body); }
  @Post('task-dependency/add') async addTaskDependency(@Body() body: any) { return this.taskDependencyService.addDependency(body.taskId, body.dependsOn); }
  @Post('result-index/index') async indexResult(@Body() body: any) { return this.resultIndexService.indexResult(body); }
  @Post('data-dedup/deduplicate') async deduplicateData(@Body() body: any) { return this.dataDeduplicationService.deduplicate(body); }
  @Post('inference-opt/optimize') async optimizeInference(@Body() body: any) { return this.inferenceOptimizationService.optimize(body.modelId, body.config); }
  @Post('result-archive/archive') async archiveResult(@Body() body: any) { return this.resultArchivalService.archive(body); }
  @Post('task-retry/should-retry') async shouldRetryTask(@Body() body: any) { return this.taskRetryService.shouldRetry(body.taskId, body.maxRetries); }
  @Post('validation-rule/create') async createValidationRule(@Body() body: any) { return this.validationRuleService.create(body); }
  @Post('result-merge/merge') async mergeResults(@Body() body: any) { return this.resultMergeService.merge(body); }
  @Post('task-batch/create') async createTaskBatch(@Body() body: any) { return this.taskBatchService.createBatch(body); }
  @Post('data-migration/migrate') async migrateData(@Body() body: any) { return this.dataMigrationService.migrate(body.source, body.target); }
  @Post('canary-release/create') async createCanaryRelease(@Body() body: any) { return this.canaryReleaseService.createRelease(body); }
  @Post('result-viz/chart') async generateChart(@Body() body: any) { return this.resultVisualizationService.generateChart(body.data, body.type); }
  @Post('task-scheduler/schedule') async scheduleTask(@Body() body: any) { return this.taskSchedulerService.schedule(body.task, body.cron); }
  @Post('data-sync/sync') async syncData(@Body() body: any) { return this.dataSyncService.sync(body.source, body.target); }
  @Post('eval-benchmark/create') async createBenchmark(@Body() body: any) { return this.evalBenchmarkService.create(body); }
  @Post('result-compare/compare') async compareResults(@Body() body: any) { return this.resultComparisonService.compare(body.resultA, body.resultB); }
  @Post('data-backup/create') async createBackup(@Body() body: any) { return this.dataBackupService.createBackup(body); }
  @Post('advanced-orchestration/create') async createAdvancedWorkflow(@Body() body: any) { return this.advancedOrchestrationService.createWorkflow(body); }
  @Post('advanced-transform/transform') async advancedTransform(@Body() body: any) { return this.advancedTransformService.transform(body.data, body.rules); }
  @Post('model-routing/add') async addModelRoute(@Body() body: any) { return this.modelRoutingService.addRoute(body.pattern, body.modelId); }
  @Post('advanced-agg/aggregate') async advancedAggregate(@Body() body: any) { return this.advancedAggregationService.aggregate(body.data, body.strategy); }
  @Post('task-monitor/monitor') async monitorTask(@Body() body: any) { return this.taskMonitoringService.monitor(body.taskId, body.config); }
  @Post('advanced-clean/clean') async advancedClean(@Body() body: any) { return this.advancedCleaningService.clean(body.data, body.options); }
  @Post('advanced-model-eval/evaluate') async advancedModelEval(@Body() body: any) { return this.advancedModelEvalService.evaluate(body.modelId, body.dataset); }
  @Post('advanced-export/export') async advancedExport(@Body() body: any) { return this.advancedExportService.export(body.data, body.format); }
  @Post('advanced-queue/enqueue') async advancedEnqueue(@Body() body: any) { return this.advancedQueueService.enqueue(body); }
  @Post('advanced-annotation/annotate') async advancedAnnotate(@Body() body: any) { return this.advancedAnnotationService.annotate(body.data, body.labels); }
  @Post('advanced-report/generate') async advancedGenerateReport(@Body() body: any) { return this.advancedReportService.generate(body); }
  @Post('advanced-compare/compare') async advancedCompare(@Body() body: any) { return this.advancedComparisonService.compare(body); }
  @Post('advanced-sub/subscribe') async advancedSubscribe(@Body() body: any) { return this.advancedSubscriptionService.subscribe(body.topic, body.callback); }
  @Post('advanced-priority/enqueue') async advancedPriorityEnqueue(@Body() body: any) { return this.advancedPriorityService.enqueue(body.task, body.priority); }
  @Post('advanced-shard/shard') async advancedShard(@Body() body: any) { return this.advancedShardingService.shard(body.data, body.count); }
  @Post('advanced-cache/set') async advancedCacheSet(@Body() body: any) { return this.advancedCacheService.set(body.key, body.value, body.ttl); }
  @Post('advanced-retry/should-retry') async advancedShouldRetry(@Body() body: any) { return this.advancedRetryService.shouldRetry(body.id, body.max); }
  @Post('advanced-registry/register') async advancedRegister(@Body() body: any) { return this.advancedRegistryService.register(body); }
  @Post('advanced-index/index') async advancedIndex(@Body() body: any) { return this.advancedIndexService.index(body); }
  @Post('advanced-validation/validate') async advancedValidate(@Body() body: any) { return this.advancedValidationService.validate(body.data, body.schema); }
  @Post('advanced-template/create') async advancedCreateTemplate(@Body() body: any) { return this.advancedTemplateService.create(body); }
  @Post('advanced-pipeline/create') async advancedCreatePipeline(@Body() body: any) { return this.advancedPipelineService.create(body); }
  @Post('advanced-dependency/add') async advancedAddDependency(@Body() body: any) { return this.advancedDependencyService.add(body.taskId, body.deps); }
  @Post('advanced-archive/archive') async advancedArchive(@Body() body: any) { return this.advancedArchiveService.archive(body); }

  // ========== v1.43-v1.47 API ==========
  @Post('streaming/create') async createStreamSession(@Body() body: any) { return this.streamingEvalService.createSession(body); }
  @Post('streaming/push') async pushStreamChunk(@Body() body: any) { return this.streamingEvalService.pushChunk(body.sessionId, body.chunk); }
  @Get('streaming/list') async listStreamSessions() { return this.streamingEvalService.listSessions(); }
  @Post('security-scan/scan') async runSecurityScan(@Body() body: any) { return this.securityScanService.scan(body); }
  @Get('security-scan/list') async listSecurityScans() { return this.securityScanService.list(); }
  @Post('eval-gateway/route') async addGatewayRoute(@Body() body: any) { return this.evalGatewayService.addRoute(body.path, body.config); }
  @Get('eval-gateway/routes') async listGatewayRoutes() { return this.evalGatewayService.listRoutes(); }
  @Post('eval-plugin/register') async registerPlugin(@Body() body: any) { return this.evalPluginService.register(body); }
  @Get('eval-plugin/list') async listPlugins() { return this.evalPluginService.list(); }
  @Post('viz-engine/chart') async generateVizChart(@Body() body: any) { return this.visualizationEngineService.generateChart(body.data, body.type); }
  @Post('viz-engine/dashboard') async generateVizDashboard(@Body() body: any) { return this.visualizationEngineService.generateDashboard(body); }
  @Post('stress-test/create') async createStressTest(@Body() body: any) { return this.stressTestService.create(body); }
  @Post('stress-test/run') async runStressTest(@Body() body: any) { return this.stressTestService.run(body.id); }
  @Post('canary-deploy/deploy') async deployCanary(@Body() body: any) { return this.canaryDeploymentService.deploy(body); }
  @Post('canary-deploy/adjust') async adjustCanaryTraffic(@Body() body: any) { return this.canaryDeploymentService.adjustTraffic(body.id, body.percent); }
  @Post('disaster-recovery/create') async createDRPlan(@Body() body: any) { return this.disasterRecoveryService.createPlan(body); }
  @Post('disaster-recovery/test') async testDRPlan(@Body() body: any) { return this.disasterRecoveryService.testPlan(body.id); }
  @Post('tenant-isolation/configure') async configureTenantIsolation(@Body() body: any) { return this.tenantIsolationService.configure(body.tenantId, body.config); }
  @Post('audit-log/log') async logAuditEvent(@Body() body: any) { return this.auditLogService.log(body); }
  @Get('audit-log/list') async listAuditLogs() { return this.auditLogService.list(); }
  @Post('trace-analysis/record') async recordTrace(@Body() body: any) { return this.traceAnalysisService.record(body); }
  @Post('trace-analysis/analyze') async analyzeTrace(@Body() body: any) { return this.traceAnalysisService.analyze(body.traceId); }
  @Post('data-profiling/profile') async profileData(@Body() body: any) { return this.dataProfilingService.profile(body.datasetId, body.data); }
  @Post('data-migration-eval/validate') async validateMigration(@Body() body: any) { return this.dataMigrationEvalService.validate(body.source, body.target); }
  @Post('data-migration-eval/migrate') async executeMigration(@Body() body: any) { return this.dataMigrationEvalService.migrate(body.source, body.target); }
  @Post('replay-eval/create') async createReplayEval(@Body() body: any) { return this.replayEvalService.create(body); }
  @Post('replay-eval/execute') async executeReplayEval(@Body() body: any) { return this.replayEvalService.execute(body.id); }
  @Post('smart-diagnosis/diagnose') async smartDiagnose(@Body() body: any) { return this.smartDiagnosisService.diagnose(body); }

  // ========== v1.48-v1.52 API ==========
  @Post('stress-report/create') async createStressReport(@Body() body: any) { return this.stressReportService.create(body.testId); }
  @Post('canary-strategy/create') async createCanaryStrategy(@Body() body: any) { return this.canaryStrategyService.create(body); }
  @Post('disaster-drill/create') async createDisasterDrill(@Body() body: any) { return this.disasterDrillService.create(body); }
  @Post('disaster-drill/run') async runDisasterDrill(@Body() body: any) { return this.disasterDrillService.run(body.id); }
  @Post('tenant-quota/set') async setTenantQuota(@Body() body: any) { return this.tenantQuotaService.setQuota(body.tenantId, body.config); }
  @Post('audit-report/generate') async generateAuditReport(@Body() body: any) { return this.auditReportService.generate(body); }
  @Post('link-analysis/analyze') async analyzeLinks(@Body() body: any) { return this.linkAnalysisService.analyze(body); }
  @Post('profile-analysis/analyze') async analyzeProfile(@Body() body: any) { return this.profileAnalysisService.analyze(body.datasetId); }
  @Post('migration-tool/create') async createMigrationPlan(@Body() body: any) { return this.migrationToolService.createPlan(body.source, body.target); }
  @Post('replay-engine/record') async recordReplay(@Body() body: any) { return this.replayEngineService.record(body.sessionId, body.data); }
  @Post('replay-engine/replay') async executeReplay(@Body() body: any) { return this.replayEngineService.replay(body.sessionId); }
  @Post('diagnosis-advice/generate') async generateDiagnosisAdvice(@Body() body: any) { return this.diagnosisAdviceService.generate(body); }
  @Post('stress-monitor/start') async startStressMonitor(@Body() body: any) { return this.stressMonitorService.start(body); }
  @Get('stress-monitor/metrics/:id') async getStressMetrics(@Param('id') id: string) { return this.stressMonitorService.getMetrics(id); }
  @Post('canary-monitor/start') async startCanaryMonitor(@Body() body: any) { return this.canaryMonitorService.start(body.deploymentId); }
  @Post('disaster-report/generate') async generateDisasterReport(@Body() body: any) { return this.disasterReportService.generate(body.planId); }
  @Post('tenant-billing/generate') async generateTenantBill(@Body() body: any) { return this.tenantBillingService.generate(body.tenantId, body.period); }
  @Post('audit-trail/record') async recordAuditTrail(@Body() body: any) { return this.auditTrailService.record(body); }

  // ========== v1.53-v1.57 API ==========
  @Post('link-diagnosis/diagnose') async diagnoseLink(@Body() body: any) { return this.linkDiagnosisService.diagnose(body.linkId); }
  @Post('profile-report/generate') async generateProfileReport(@Body() body: any) { return this.profileReportService.generate(body.datasetId); }
  @Post('migration-monitor/start') async startMigrationMonitor(@Body() body: any) { return this.migrationMonitorService.start(body.migrationId); }
  @Post('replay-analysis/analyze') async analyzeReplay(@Body() body: any) { return this.replayAnalysisService.analyze(body.replayId); }
  @Post('diagnosis-report/generate') async generateDiagnosisReport(@Body() body: any) { return this.diagnosisReportService.generate(body.diagnosisId); }
  @Post('stress-alert/create') async createStressAlert(@Body() body: any) { return this.stressAlertService.create(body); }
  @Post('stress-alert/check') async checkStressAlert(@Body() body: any) { return this.stressAlertService.check(body.metric, body.value); }
  @Post('canary-report/generate') async generateCanaryReport(@Body() body: any) { return this.canaryReportService.generate(body.deploymentId); }
  @Post('disaster-strategy/create') async createDisasterStrategy(@Body() body: any) { return this.disasterStrategyService.create(body); }
  @Post('tenant-mgmt/create') async createTenant(@Body() body: any) { return this.tenantManagementService.create(body); }
  @Post('tenant-mgmt/deactivate') async deactivateTenant(@Body() body: any) { return this.tenantManagementService.deactivate(body.id); }
  @Post('audit-analysis/analyze') async analyzeAudit(@Body() body: any) { return this.auditAnalysisService.analyze(body.period); }
  @Post('link-report/generate') async generateLinkReport(@Body() body: any) { return this.linkReportService.generate(body.traceId); }
  @Post('profile-monitor/start') async startProfileMonitor(@Body() body: any) { return this.profileMonitorService.start(body.datasetId); }
  @Post('migration-verify/verify') async verifyMigration(@Body() body: any) { return this.migrationVerifyService.verify(body.migrationId); }
  @Post('replay-diagnosis/diagnose') async diagnoseReplay(@Body() body: any) { return this.replayDiagnosisService.diagnose(body.replayId); }
  @Post('stress-analysis/analyze') async analyzeStress(@Body() body: any) { return this.stressAnalysisService.analyze(body.testId); }

  // ========== v1.58-v1.62 API ==========
  @Post('canary-analysis/analyze') async analyzeCanary(@Body() body: any) { return this.canaryAnalysisService.analyze(body.deploymentId); }
  @Post('disaster-monitor/start') async startDisasterMonitor(@Body() body: any) { return this.disasterMonitorService.start(body.planId); }
  @Post('disaster-monitor/check') async checkDisasterMonitor(@Body() body: any) { return this.disasterMonitorService.check(body.planId); }
  @Post('tenant-report/generate') async generateTenantReport(@Body() body: any) { return this.tenantReportService.generate(body.tenantId, body.period); }
  @Post('audit-monitor/start') async startAuditMonitor(@Body() body: any) { return this.auditMonitorService.start(body); }
  @Post('link-monitor/start') async startLinkMonitor(@Body() body: any) { return this.linkMonitorService.start(body.traceId); }
  @Post('link-monitor/check') async checkLinkMonitor(@Body() body: any) { return this.linkMonitorService.check(body.traceId); }
  @Post('profile-alert/create') async createProfileAlert(@Body() body: any) { return this.profileAlertService.create(body); }
  @Post('profile-alert/check') async checkProfileAlert(@Body() body: any) { return this.profileAlertService.check(body.datasetId, body.metric, body.value); }
  @Post('migration-report/generate') async generateMigrationReport(@Body() body: any) { return this.migrationReportService.generate(body.migrationId); }
  @Post('replay-report/generate') async generateReplayReport(@Body() body: any) { return this.replayReportService.generate(body.replayId); }
  @Post('diagnosis-alert/create') async createDiagnosisAlert(@Body() body: any) { return this.diagnosisAlertService.create(body); }
  @Post('diagnosis-alert/check') async checkDiagnosisAlert(@Body() body: any) { return this.diagnosisAlertService.check(body.issueId, body.severity); }
  @Post('stress-report-adv/generate') async generateStressReportAdv(@Body() body: any) { return this.stressReportAdvService.generate(body.testId); }
  @Post('canary-alert/create') async createCanaryAlert(@Body() body: any) { return this.canaryAlertService.create(body); }
  @Post('canary-alert/check') async checkCanaryAlert(@Body() body: any) { return this.canaryAlertService.check(body.deploymentId, body.errorRate); }
  @Post('disaster-report-adv/generate') async generateDisasterReportAdv(@Body() body: any) { return this.disasterReportAdvService.generate(body.planId); }
  @Post('tenant-alert/create') async createTenantAlert(@Body() body: any) { return this.tenantAlertService.create(body); }
  @Post('tenant-alert/check') async checkTenantAlert(@Body() body: any) { return this.tenantAlertService.check(body.tenantId, body.usage, body.limit); }
  @Post('audit-alert/create') async createAuditAlert(@Body() body: any) { return this.auditAlertService.create(body); }
  @Post('audit-alert/check') async checkAuditAlert(@Body() body: any) { return this.auditAlertService.check(body.eventType, body.count); }
  @Post('link-alert/create') async createLinkAlert(@Body() body: any) { return this.linkAlertService.create(body); }
  @Post('link-alert/check') async checkLinkAlert(@Body() body: any) { return this.linkAlertService.check(body.traceId, body.latency); }

  // ========== v1.63-v1.67 API ==========
  @Post('model-ver-compare/compare') async compareModelVersions(@Body() body: any) { return this.modelVersionCompareService.compare(body.versionA, body.versionB); }
  @Post('dataset-cleaning/create') async createDatasetCleaning(@Body() body: any) { return this.datasetCleaningService.create(body); }
  @Post('dataset-cleaning/execute') async executeDatasetCleaning(@Body() body: any) { return this.datasetCleaningService.execute(body.id); }
  @Post('eval-cache-strategy/create') async createEvalCacheStrategy(@Body() body: any) { return this.evalCacheStrategyService.create(body); }
  @Post('task-sched-strategy/create') async createTaskSchedulingStrategy(@Body() body: any) { return this.taskSchedulingStrategyService.create(body); }
  @Post('result-search-opt/create') async createResultSearchOpt(@Body() body: any) { return this.resultSearchOptimizationService.create(body); }
  @Post('model-perf-bench/create') async createModelPerfBenchmark(@Body() body: any) { return this.modelPerformanceBenchmarkService.create(body); }
  @Post('model-perf-bench/run') async runModelPerfBenchmark(@Body() body: any) { return this.modelPerformanceBenchmarkService.run(body.id); }
  @Post('dataset-ver-compare/compare') async compareDatasetVersions(@Body() body: any) { return this.datasetVersionCompareService.compare(body.versionA, body.versionB); }
  @Post('task-dep-analysis/analyze') async analyzeTaskDependency(@Body() body: any) { return this.taskDependencyAnalysisService.analyze(body.taskId); }
  @Post('result-viz-config/create') async createResultVizConfig(@Body() body: any) { return this.resultVisualizationConfigService.create(body); }
  @Post('model-deploy-monitor/start') async startModelDeployMonitor(@Body() body: any) { return this.modelDeploymentMonitorService.start(body.deploymentId); }
  @Post('data-quality-report/generate') async generateDataQualityReport(@Body() body: any) { return this.dataQualityReportService.generate(body.datasetId); }
  @Post('eval-task-priority/set') async setEvalTaskPriority(@Body() body: any) { return this.evalTaskPriorityService.set(body.taskId, body.priority); }
  @Post('result-sub-notify/notify') async notifyResultSubscription(@Body() body: any) { return this.resultSubscriptionNotifyService.notify(body.subscriptionId, body.result); }
  @Post('model-compare-report/generate') async generateModelComparisonReport(@Body() body: any) { return this.modelComparisonReportService.generate(body.modelIds); }
  @Post('dataset-transform/create') async createDatasetTransform(@Body() body: any) { return this.datasetTransformService.create(body); }
  @Post('dataset-transform/execute') async executeDatasetTransform(@Body() body: any) { return this.datasetTransformService.execute(body.id); }

  // ========== v1.68-v1.72 API ==========
  @Post('model-routing-strategy/create') async createModelRoutingStrategy(@Body() body: any) { return this.modelRoutingStrategyService.create(body); }
  @Post('data-annotation-quality/measure') async measureDataAnnotationQuality(@Body() body: any) { return this.dataAnnotationQualityService.measure(body.annotationId); }
  @Post('eval-replay-config/create') async createEvalReplayConfig(@Body() body: any) { return this.evalReplayConfigService.create(body); }
  @Post('task-tracking-report/generate') async generateTaskTrackingReport(@Body() body: any) { return this.taskTrackingReportService.generate(body.taskId); }
  @Post('result-export-config/create') async createResultExportConfig(@Body() body: any) { return this.resultExportConfigService.create(body); }
  @Post('model-eval-report/generate') async generateModelEvalReport(@Body() body: any) { return this.modelEvalReportService.generate(body.modelId); }
  @Post('data-sync-strategy/create') async createDataSyncStrategy(@Body() body: any) { return this.dataSyncStrategyService.create(body); }
  @Post('eval-snapshot-compare/compare') async compareEvalSnapshots(@Body() body: any) { return this.evalSnapshotCompareService.compare(body.snapshotA, body.snapshotB); }
  @Post('task-orchestration-config/create') async createTaskOrchestrationConfig(@Body() body: any) { return this.taskOrchestrationConfigService.create(body); }
  @Post('result-agg-strategy/create') async createResultAggregationStrategy(@Body() body: any) { return this.resultAggregationStrategyService.create(body); }
  @Post('model-deploy-config/create') async createModelDeploymentConfig(@Body() body: any) { return this.modelDeploymentConfigService.create(body); }
  @Post('dataset-analysis/analyze') async analyzeDataset(@Body() body: any) { return this.datasetAnalysisService.analyze(body.datasetId); }
  @Post('task-dist-strategy/create') async createTaskDistributionStrategy(@Body() body: any) { return this.taskDistributionStrategyService.create(body); }
  @Post('result-cache-config/create') async createResultCacheConfig(@Body() body: any) { return this.resultCacheConfigService.create(body); }
  @Post('model-eval-config/create') async createModelEvalConfig(@Body() body: any) { return this.modelEvalConfigService.create(body); }

  // ========== v1.73-v1.77 API ==========
  @Post('model-deploy-report/generate') async generateModelDeploymentReport(@Body() body: any) { return this.modelDeploymentReportService.generate(body.deploymentId); }
  @Post('dataset-quality-monitor/start') async startDatasetQualityMonitor(@Body() body: any) { return this.datasetQualityMonitorService.start(body.datasetId); }
  @Post('dataset-quality-monitor/check') async checkDatasetQualityMonitor(@Body() body: any) { return this.datasetQualityMonitorService.check(body.datasetId); }
  @Post('eval-task-report/generate') async generateEvalTaskReport(@Body() body: any) { return this.evalTaskReportService.generate(body.taskId); }
  @Post('result-agg-report/generate') async generateResultAggregationReport(@Body() body: any) { return this.resultAggregationReportService.generate(body.aggId); }
  @Post('model-eval-compare/compare') async compareModelEvals(@Body() body: any) { return this.modelEvalCompareService.compare(body.modelA, body.modelB); }
  @Post('dataset-report/generate') async generateDatasetReport(@Body() body: any) { return this.datasetReportService.generate(body.datasetId); }
  @Post('task-dist-report/generate') async generateTaskDistributionReport(@Body() body: any) { return this.taskDistributionReportService.generate(body.strategyId); }
  @Post('result-cache-monitor/start') async startResultCacheMonitor(@Body() body: any) { return this.resultCacheMonitorService.start(body.configId); }
  @Post('result-cache-monitor/check') async checkResultCacheMonitor(@Body() body: any) { return this.resultCacheMonitorService.check(body.configId); }
  @Post('model-deploy-alert/create') async createModelDeploymentAlert(@Body() body: any) { return this.modelDeploymentAlertService.create(body); }
  @Post('model-deploy-alert/check') async checkModelDeploymentAlert(@Body() body: any) { return this.modelDeploymentAlertService.check(body.deploymentId, body.metric, body.value); }
  @Post('dataset-quality-alert/create') async createDatasetQualityAlert(@Body() body: any) { return this.datasetQualityAlertService.create(body); }
  @Post('dataset-quality-alert/check') async checkDatasetQualityAlert(@Body() body: any) { return this.datasetQualityAlertService.check(body.datasetId, body.quality); }
  @Post('eval-task-alert/create') async createEvalTaskAlert(@Body() body: any) { return this.evalTaskAlertService.create(body); }
  @Post('eval-task-alert/check') async checkEvalTaskAlert(@Body() body: any) { return this.evalTaskAlertService.check(body.taskId, body.status); }
  @Post('result-agg-alert/create') async createResultAggregationAlert(@Body() body: any) { return this.resultAggregationAlertService.create(body); }
  @Post('result-agg-alert/check') async checkResultAggregationAlert(@Body() body: any) { return this.resultAggregationAlertService.check(body.aggId, body.count); }
  @Post('model-eval-alert/create') async createModelEvalAlert(@Body() body: any) { return this.modelEvalAlertService.create(body); }
  @Post('model-eval-alert/check') async checkModelEvalAlert(@Body() body: any) { return this.modelEvalAlertService.check(body.modelId, body.metric, body.value); }
  @Post('dataset-sync-alert/create') async createDatasetSyncAlert(@Body() body: any) { return this.datasetSyncAlertService.create(body); }
  @Post('dataset-sync-alert/check') async checkDatasetSyncAlert(@Body() body: any) { return this.datasetSyncAlertService.check(body.datasetId, body.syncStatus); }
  @Post('eval-snapshot-alert/create') async createEvalSnapshotAlert(@Body() body: any) { return this.evalSnapshotAlertService.create(body); }
  @Post('eval-snapshot-alert/check') async checkEvalSnapshotAlert(@Body() body: any) { return this.evalSnapshotAlertService.check(body.snapshotId, body.consistency); }

  // ========== v1.78-v1.82 API ==========
  @Post('task-orchestration-alert/create') async createTaskOrchestrationAlert(@Body() body: any) { return this.taskOrchestrationAlertService.create(body); }
  @Post('task-orchestration-alert/check') async checkTaskOrchestrationAlert(@Body() body: any) { return this.taskOrchestrationAlertService.check(body.workflowId, body.status); }
  @Post('result-export-alert/create') async createResultExportAlert(@Body() body: any) { return this.resultExportAlertService.create(body); }
  @Post('result-export-alert/check') async checkResultExportAlert(@Body() body: any) { return this.resultExportAlertService.check(body.exportId, body.status); }
  @Post('model-routing-alert/create') async createModelRoutingAlert(@Body() body: any) { return this.modelRoutingAlertService.create(body); }
  @Post('model-routing-alert/check') async checkModelRoutingAlert(@Body() body: any) { return this.modelRoutingAlertService.check(body.routeId, body.errorRate); }
  @Post('data-annotation-alert/create') async createDataAnnotationAlert(@Body() body: any) { return this.dataAnnotationAlertService.create(body); }
  @Post('data-annotation-alert/check') async checkDataAnnotationAlert(@Body() body: any) { return this.dataAnnotationAlertService.check(body.annotationId, body.quality); }
  @Post('eval-replay-alert/create') async createEvalReplayAlert(@Body() body: any) { return this.evalReplayAlertService.create(body); }
  @Post('eval-replay-alert/check') async checkEvalReplayAlert(@Body() body: any) { return this.evalReplayAlertService.check(body.replayId, body.consistency); }
  @Post('task-tracking-alert/create') async createTaskTrackingAlert(@Body() body: any) { return this.taskTrackingAlertService.create(body); }
  @Post('task-tracking-alert/check') async checkTaskTrackingAlert(@Body() body: any) { return this.taskTrackingAlertService.check(body.taskId, body.duration); }
  @Post('result-search-alert/create') async createResultSearchAlert(@Body() body: any) { return this.resultSearchAlertService.create(body); }
  @Post('result-search-alert/check') async checkResultSearchAlert(@Body() body: any) { return this.resultSearchAlertService.check(body.queryId, body.latency); }
  @Post('model-perf-alert/create') async createModelPerformanceAlert(@Body() body: any) { return this.modelPerformanceAlertService.create(body); }
  @Post('model-perf-alert/check') async checkModelPerformanceAlert(@Body() body: any) { return this.modelPerformanceAlertService.check(body.modelId, body.latency); }
  @Post('dataset-cleaning-alert/create') async createDatasetCleaningAlert(@Body() body: any) { return this.datasetCleaningAlertService.create(body); }
  @Post('dataset-cleaning-alert/check') async checkDatasetCleaningAlert(@Body() body: any) { return this.datasetCleaningAlertService.check(body.cleaningId, body.removedRatio); }
  @Post('eval-cache-alert/create') async createEvalCacheAlert(@Body() body: any) { return this.evalCacheAlertService.create(body); }
  @Post('eval-cache-alert/check') async checkEvalCacheAlert(@Body() body: any) { return this.evalCacheAlertService.check(body.cacheId, body.hitRate); }
  @Post('task-scheduling-alert/create') async createTaskSchedulingAlert(@Body() body: any) { return this.taskSchedulingAlertService.create(body); }
  @Post('task-scheduling-alert/check') async checkTaskSchedulingAlert(@Body() body: any) { return this.taskSchedulingAlertService.check(body.scheduleId, body.missedCount); }
  @Post('result-viz-alert/create') async createResultVisualizationAlert(@Body() body: any) { return this.resultVisualizationAlertService.create(body); }
  @Post('result-viz-alert/check') async checkResultVisualizationAlert(@Body() body: any) { return this.resultVisualizationAlertService.check(body.chartId, body.renderTime); }
  @Post('model-ver-alert/create') async createModelVersionAlert(@Body() body: any) { return this.modelVersionAlertService.create(body); }
  @Post('model-ver-alert/check') async checkModelVersionAlert(@Body() body: any) { return this.modelVersionAlertService.check(body.versionId, body.metric, body.value); }
  @Post('dataset-ver-alert/create') async createDatasetVersionAlert(@Body() body: any) { return this.datasetVersionAlertService.create(body); }
  @Post('dataset-ver-alert/check') async checkDatasetVersionAlert(@Body() body: any) { return this.datasetVersionAlertService.check(body.versionId, body.size); }
  @Post('eval-snapshot-alert-adv/create') async createEvalSnapshotAlertAdv(@Body() body: any) { return this.evalSnapshotAlertAdvService.create(body); }
  @Post('eval-snapshot-alert-adv/check') async checkEvalSnapshotAlertAdv(@Body() body: any) { return this.evalSnapshotAlertAdvService.check(body.snapshotId, body.diff); }

  // ========== v1.83-v1.87 API ==========
  @Post('smart-routing-opt/optimize') async optimizeSmartRouting(@Body() body: any) { return this.smartRoutingOptimizeService.optimize(body.routeId); }
  @Post('data-aug-strategy/create') async createDataAugStrategy(@Body() body: any) { return this.dataAugmentationStrategyService.create(body); }
  @Post('data-aug-strategy/execute') async executeDataAugStrategy(@Body() body: any) { return this.dataAugmentationStrategyService.execute(body.id, body.data); }
  @Post('eval-tmpl-mgmt/create') async createEvalTemplate(@Body() body: any) { return this.evalTemplateManagementService.create(body); }
  @Post('task-dist-opt/optimize') async optimizeTaskDistribution(@Body() body: any) { return this.taskDistributionOptimizeService.optimize(body.strategyId); }
  @Post('result-cache-opt/optimize') async optimizeResultCache(@Body() body: any) { return this.resultCacheOptimizeService.optimize(body.configId); }
  @Post('model-eval-opt/optimize') async optimizeModelEval(@Body() body: any) { return this.modelEvalOptimizeService.optimize(body.configId); }
  @Post('dataset-quality-opt/optimize') async optimizeDatasetQuality(@Body() body: any) { return this.datasetQualityOptimizeService.optimize(body.datasetId); }
  @Post('eval-snapshot-opt/optimize') async optimizeEvalSnapshot(@Body() body: any) { return this.evalSnapshotOptimizeService.optimize(body.snapshotId); }
  @Post('task-orch-opt/optimize') async optimizeTaskOrchestration(@Body() body: any) { return this.taskOrchestrationOptimizeService.optimize(body.workflowId); }
  @Post('result-agg-opt/optimize') async optimizeResultAggregation(@Body() body: any) { return this.resultAggregationOptimizeService.optimize(body.strategyId); }
  @Post('model-deploy-opt/optimize') async optimizeModelDeployment(@Body() body: any) { return this.modelDeploymentOptimizeService.optimize(body.deploymentId); }
  @Post('dataset-analysis-opt/optimize') async optimizeDatasetAnalysis(@Body() body: any) { return this.datasetAnalysisOptimizeService.optimize(body.datasetId); }
  @Post('smart-routing-report/generate') async generateSmartRoutingReport(@Body() body: any) { return this.smartRoutingReportService.generate(body.routeId); }
  @Post('data-aug-report/generate') async generateDataAugReport(@Body() body: any) { return this.dataAugmentationReportService.generate(body.strategyId); }
  @Post('eval-tmpl-report/generate') async generateEvalTemplateReport(@Body() body: any) { return this.evalTemplateReportService.generate(body.templateId); }

  // ========== v1.88-v1.92 API ==========
  @Post('task-dist-report-adv/generate') async generateTaskDistReportAdv(@Body() body: any) { return this.taskDistributionReportAdvService.generate(body.strategyId); }
  @Post('result-cache-report/generate') async generateResultCacheReport(@Body() body: any) { return this.resultCacheReportService.generate(body.configId); }
  @Post('model-eval-report-adv/generate') async generateModelEvalReportAdv(@Body() body: any) { return this.modelEvalReportAdvService.generate(body.configId); }
  @Post('dataset-quality-report-adv/generate') async generateDatasetQualityReportAdv(@Body() body: any) { return this.datasetQualityReportAdvService.generate(body.datasetId); }
  @Post('eval-snapshot-report/generate') async generateEvalSnapshotReport(@Body() body: any) { return this.evalSnapshotReportService.generate(body.snapshotId); }
  @Post('task-orch-report/generate') async generateTaskOrchReport(@Body() body: any) { return this.taskOrchestrationReportService.generate(body.workflowId); }
  @Post('smart-routing-monitor/start') async startSmartRoutingMonitor(@Body() body: any) { return this.smartRoutingMonitorService.start(body.routeId); }
  @Post('smart-routing-monitor/check') async checkSmartRoutingMonitor(@Body() body: any) { return this.smartRoutingMonitorService.check(body.routeId); }
  @Post('data-aug-monitor/start') async startDataAugMonitor(@Body() body: any) { return this.dataAugmentationMonitorService.start(body.strategyId); }
  @Post('data-aug-monitor/check') async checkDataAugMonitor(@Body() body: any) { return this.dataAugmentationMonitorService.check(body.strategyId); }
  @Post('eval-tmpl-monitor/start') async startEvalTemplateMonitor(@Body() body: any) { return this.evalTemplateMonitorService.start(body.templateId); }
  @Post('eval-tmpl-monitor/check') async checkEvalTemplateMonitor(@Body() body: any) { return this.evalTemplateMonitorService.check(body.templateId); }
  @Post('task-dist-monitor-adv/start') async startTaskDistMonitorAdv(@Body() body: any) { return this.taskDistributionMonitorAdvService.start(body.strategyId); }
  @Post('task-dist-monitor-adv/check') async checkTaskDistMonitorAdv(@Body() body: any) { return this.taskDistributionMonitorAdvService.check(body.strategyId); }
  @Post('result-cache-monitor-adv/start') async startResultCacheMonitorAdv(@Body() body: any) { return this.resultCacheMonitorAdvService.start(body.configId); }
  @Post('result-cache-monitor-adv/check') async checkResultCacheMonitorAdv(@Body() body: any) { return this.resultCacheMonitorAdvService.check(body.configId); }
  @Post('model-eval-monitor-adv/start') async startModelEvalMonitorAdv(@Body() body: any) { return this.modelEvalMonitorAdvService.start(body.configId); }
  @Post('model-eval-monitor-adv/check') async checkModelEvalMonitorAdv(@Body() body: any) { return this.modelEvalMonitorAdvService.check(body.configId); }
  @Post('dataset-quality-monitor-adv/start') async startDatasetQualityMonitorAdv(@Body() body: any) { return this.datasetQualityMonitorAdvService.start(body.datasetId); }
  @Post('dataset-quality-monitor-adv/check') async checkDatasetQualityMonitorAdv(@Body() body: any) { return this.datasetQualityMonitorAdvService.check(body.datasetId); }
  @Post('eval-snapshot-monitor-adv/start') async startEvalSnapshotMonitorAdv(@Body() body: any) { return this.evalSnapshotMonitorAdvService.start(body.snapshotId); }
  @Post('eval-snapshot-monitor-adv/check') async checkEvalSnapshotMonitorAdv(@Body() body: any) { return this.evalSnapshotMonitorAdvService.check(body.snapshotId); }
  @Post('task-orch-monitor-adv/start') async startTaskOrchMonitorAdv(@Body() body: any) { return this.taskOrchestrationMonitorAdvService.start(body.workflowId); }
  @Post('task-orch-monitor-adv/check') async checkTaskOrchMonitorAdv(@Body() body: any) { return this.taskOrchestrationMonitorAdvService.check(body.workflowId); }

  // ========== v1.93-v1.97 API ==========
  @Post('result-agg-monitor-adv/start') async startResultAggMonitorAdv(@Body() body: any) { return this.resultAggregationMonitorAdvService.start(body.strategyId); }
  @Post('result-agg-monitor-adv/check') async checkResultAggMonitorAdv(@Body() body: any) { return this.resultAggregationMonitorAdvService.check(body.strategyId); }
  @Post('model-deploy-monitor-adv/start') async startModelDeployMonitorAdv(@Body() body: any) { return this.modelDeploymentMonitorAdvService.start(body.deploymentId); }
  @Post('model-deploy-monitor-adv/check') async checkModelDeployMonitorAdv(@Body() body: any) { return this.modelDeploymentMonitorAdvService.check(body.deploymentId); }
  @Post('dataset-analysis-monitor-adv/start') async startDatasetAnalysisMonitorAdv(@Body() body: any) { return this.datasetAnalysisMonitorAdvService.start(body.datasetId); }
  @Post('dataset-analysis-monitor-adv/check') async checkDatasetAnalysisMonitorAdv(@Body() body: any) { return this.datasetAnalysisMonitorAdvService.check(body.datasetId); }
  @Post('smart-routing-alert-adv/create') async createSmartRoutingAlertAdv(@Body() body: any) { return this.smartRoutingAlertAdvService.create(body); }
  @Post('smart-routing-alert-adv/check') async checkSmartRoutingAlertAdv(@Body() body: any) { return this.smartRoutingAlertAdvService.check(body.routeId, body.latency); }
  @Post('data-aug-alert-adv/create') async createDataAugAlertAdv(@Body() body: any) { return this.dataAugmentationAlertAdvService.create(body); }
  @Post('data-aug-alert-adv/check') async checkDataAugAlertAdv(@Body() body: any) { return this.dataAugmentationAlertAdvService.check(body.strategyId, body.quality); }
  @Post('eval-tmpl-alert-adv/create') async createEvalTemplateAlertAdv(@Body() body: any) { return this.evalTemplateAlertAdvService.create(body); }
  @Post('eval-tmpl-alert-adv/check') async checkEvalTemplateAlertAdv(@Body() body: any) { return this.evalTemplateAlertAdvService.check(body.templateId, body.usage); }
  @Post('task-dist-alert-adv/create') async createTaskDistAlertAdv(@Body() body: any) { return this.taskDistributionAlertAdvService.create(body); }
  @Post('task-dist-alert-adv/check') async checkTaskDistAlertAdv(@Body() body: any) { return this.taskDistributionAlertAdvService.check(body.strategyId, body.successRate); }
  @Post('result-cache-alert-adv/create') async createResultCacheAlertAdv(@Body() body: any) { return this.resultCacheAlertAdvService.create(body); }
  @Post('result-cache-alert-adv/check') async checkResultCacheAlertAdv(@Body() body: any) { return this.resultCacheAlertAdvService.check(body.configId, body.hitRate); }
  @Post('model-eval-alert-adv/create') async createModelEvalAlertAdv(@Body() body: any) { return this.modelEvalAlertAdvService.create(body); }
  @Post('model-eval-alert-adv/check') async checkModelEvalAlertAdv(@Body() body: any) { return this.modelEvalAlertAdvService.check(body.configId, body.accuracy); }
  @Post('dataset-quality-alert-adv/create') async createDatasetQualityAlertAdv(@Body() body: any) { return this.datasetQualityAlertAdvService.create(body); }
  @Post('dataset-quality-alert-adv/check') async checkDatasetQualityAlertAdv(@Body() body: any) { return this.datasetQualityAlertAdvService.check(body.datasetId, body.drift); }
  @Post('eval-snapshot-alert-adv-adv/create') async createEvalSnapshotAlertAdvAdv(@Body() body: any) { return this.evalSnapshotAlertAdvAdvService.create(body); }
  @Post('eval-snapshot-alert-adv-adv/check') async checkEvalSnapshotAlertAdvAdv(@Body() body: any) { return this.evalSnapshotAlertAdvAdvService.check(body.snapshotId, body.deviations); }
  @Post('task-orch-alert-adv/create') async createTaskOrchAlertAdv(@Body() body: any) { return this.taskOrchestrationAlertAdvService.create(body); }
  @Post('task-orch-alert-adv/check') async checkTaskOrchAlertAdv(@Body() body: any) { return this.taskOrchestrationAlertAdvService.check(body.workflowId, body.failedTasks); }
  @Post('result-agg-alert-adv/create') async createResultAggAlertAdv(@Body() body: any) { return this.resultAggregationAlertAdvService.create(body); }
  @Post('result-agg-alert-adv/check') async checkResultAggAlertAdv(@Body() body: any) { return this.resultAggregationAlertAdvService.check(body.strategyId, body.accuracy); }
  @Post('model-deploy-alert-adv-adv/create') async createModelDeployAlertAdvAdv(@Body() body: any) { return this.modelDeploymentAlertAdvAdvService.create(body); }
  @Post('model-deploy-alert-adv-adv/check') async checkModelDeployAlertAdvAdv(@Body() body: any) { return this.modelDeploymentAlertAdvAdvService.check(body.deploymentId, body.errorRate); }
  @Post('dataset-analysis-alert-adv/create') async createDatasetAnalysisAlertAdv(@Body() body: any) { return this.datasetAnalysisAlertAdvService.create(body); }
  @Post('dataset-analysis-alert-adv/check') async checkDatasetAnalysisAlertAdv(@Body() body: any) { return this.datasetAnalysisAlertAdvService.check(body.datasetId, body.freshness); }

  // ========== v1.98-v1.100 API ==========
  @Post('smart-routing-report-adv-adv/generate') async generateSmartRoutingReportAdvAdv(@Body() body: any) { return this.smartRoutingReportAdvAdvService.generate(body.routeId); }
  @Post('data-aug-report-adv/generate') async generateDataAugReportAdv(@Body() body: any) { return this.dataAugmentationReportAdvService.generate(body.strategyId); }
  @Post('eval-tmpl-report-adv/generate') async generateEvalTemplateReportAdv(@Body() body: any) { return this.evalTemplateReportAdvService.generate(body.templateId); }
  @Post('task-dist-report-adv-adv/generate') async generateTaskDistReportAdvAdv(@Body() body: any) { return this.taskDistributionReportAdvAdvService.generate(body.strategyId); }
  @Post('result-cache-report-adv/generate') async generateResultCacheReportAdv(@Body() body: any) { return this.resultCacheReportAdvService.generate(body.configId); }
  @Post('model-eval-report-adv-adv/generate') async generateModelEvalReportAdvAdv(@Body() body: any) { return this.modelEvalReportAdvAdvService.generate(body.configId); }
  @Post('dataset-quality-report-adv-adv/generate') async generateDatasetQualityReportAdvAdv(@Body() body: any) { return this.datasetQualityReportAdvAdvService.generate(body.datasetId); }
  @Post('eval-snapshot-report-adv/generate') async generateEvalSnapshotReportAdv(@Body() body: any) { return this.evalSnapshotReportAdvService.generate(body.snapshotId); }
  @Post('task-orch-report-adv/generate') async generateTaskOrchReportAdv(@Body() body: any) { return this.taskOrchestrationReportAdvService.generate(body.workflowId); }
}
