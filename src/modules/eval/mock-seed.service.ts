// @ts-nocheck
import { Injectable, OnModuleInit } from '@nestjs/common';
import { WebhookService, WebhookEvent } from './webhook.service';
import { ExperimentService } from './experiment.service';
import { ScenarioManagementService, ScenarioType } from './scenario-management.service';
import { MultiTenantService, TenantPlan, TenantStatus } from './multi-tenant.service';
import { EvalConfigService, ConfigType } from './config.service';
import { EvalReplayService } from './eval-replay.service';
import { TraceService } from './trace.service';
import { ABTestService, ABTestStatus } from './ab-test.service';
import { BenchmarkService, BenchmarkType } from './benchmark.service';
import { EvalSnapshotService } from './eval-snapshot.service';
import { WorkflowEngineService, WorkflowNodeType } from './workflow-engine.service';
import { PromptVersionService } from './prompt-version.service';
import { DataAugmentationService, AugmentationStrategy } from './data-augmentation.service';
import { MultilingualEvalService, MultilingualEvalType, Language } from './multilingual-eval.service';
import { DataVersioningService } from './data-versioning.service';
import { MetricAttributionService, AttributionType } from './metric-attribution.service';
import { ModelDistillationService, DistillationStrategy } from './model-distillation.service';
import { FederatedEvalService } from './federated-eval.service';
import { ModelRegistryService } from './model-registry.service';
import { EvalCacheService, EvalCacheStrategy } from './eval-cache.service';
import { SemanticCacheService } from './semantic-cache.service';
import { ModelComparisonService, ComparisonMode } from './model-comparison.service';
import { AlertRuleService, AlertSeverity, AlertStatus, AlertOperator } from './alert-rule.service';
import { PermissionService, Role, ResourceType, Permission } from './permission.service';
import { DatasetSamplingService, SamplingStrategy } from './dataset-sampling.service';
import { DataQualityService, QualityDimension, QualityCheckType } from './data-quality.service';
import { TaskOrchestrationService, TaskStatus, TaskType } from './task-orchestration.service';
import { DataLineageService, LineageNodeType } from './data-lineage.service';
import { OnlineEvalService, OnlineEvalStatus, SamplingStrategy as OnlineSamplingStrategy } from './online-eval.service';
import { SyntheticDataService, GenerationStrategy, DataQuality } from './synthetic-data.service';
import { EvalSchedulerService, ScheduleType, ScheduleStatus } from './eval-scheduler.service';
import { CostTrackingService } from './cost-tracking.service';
import { EloRatingService } from './elo-rating.service';
import { RegressionDetectionService, RegressionType } from './regression-detection.service';
import { PromptOptimizationService, OptimizationStrategy } from './prompt-optimization.service';
import { ReportGeneratorService, ReportType, ReportFormat } from './report-generator.service';
import { LLMJudgeService, JudgeType } from './llm-judge.service';
import { MultimodalEvalService, MultimodalEvalType } from './multimodal-eval.service';
import { ConversationalMetricsService } from './conversational-metrics.service';
import { ResultExplanationService, ExplanationType } from './result-explanation.service';

@Injectable()
export class MockSeedService implements OnModuleInit {
  constructor(
    private webhookService: WebhookService,
    private experimentService: ExperimentService,
    private scenarioService: ScenarioManagementService,
    private tenantService: MultiTenantService,
    private configService: EvalConfigService,
    private replayService: EvalReplayService,
    private traceService: TraceService,
    private abTestService: ABTestService,
    private benchmarkService: BenchmarkService,
    private snapshotService: EvalSnapshotService,
    private workflowService: WorkflowEngineService,
    private promptVersionService: PromptVersionService,
    private dataAugService: DataAugmentationService,
    private multilingualService: MultilingualEvalService,
    private dataVersionService: DataVersioningService,
    private metricAttrService: MetricAttributionService,
    private distillService: ModelDistillationService,
    private federatedService: FederatedEvalService,
    private modelRegService: ModelRegistryService,
    private evalCacheService: EvalCacheService,
    private semanticCacheService: SemanticCacheService,
    private modelCompService: ModelComparisonService,
    private alertRuleService: AlertRuleService,
    private permissionService: PermissionService,
    private samplingService: DatasetSamplingService,
    private dataQualityService: DataQualityService,
    private taskOrchService: TaskOrchestrationService,
    private dataLineageService: DataLineageService,
    private onlineEvalService: OnlineEvalService,
    private syntheticDataService: SyntheticDataService,
    private schedulerService: EvalSchedulerService,
    private costService: CostTrackingService,
    private eloService: EloRatingService,
    private regressionService: RegressionDetectionService,
    private promptOptService: PromptOptimizationService,
    private reportGenService: ReportGeneratorService,
    private llmJudgeService: LLMJudgeService,
    private multimodalService: MultimodalEvalService,
    private convService: ConversationalMetricsService,
    private resultExplService: ResultExplanationService,
  ) {}

  async onModuleInit() {
    console.log('🌱 [MockSeed] 填充后端演示数据...');
    const seeds = [
      ['Webhooks', () => this.seedWebhooks()],
      ['Experiments', () => this.seedExperiments()],
      ['Scenarios', () => this.seedScenarios()],
      ['Tenants', () => this.seedTenants()],
      ['Configs', () => this.seedConfigs()],
      ['Replays', () => this.seedReplays()],
      ['Traces', () => this.seedTraces()],
      ['ABTests', () => this.seedABTests()],
      ['Benchmarks', () => this.seedBenchmarks()],
      ['Snapshots', () => this.seedSnapshots()],
      ['Workflows', () => this.seedWorkflows()],
      ['PromptVersions', () => this.seedPromptVersions()],
      ['DataAugmentation', () => this.seedDataAugmentation()],
      ['Multilingual', () => this.seedMultilingual()],
      ['DataVersioning', () => this.seedDataVersioning()],
      ['MetricAttribution', () => this.seedMetricAttribution()],
      ['Distillation', () => this.seedDistillation()],
      ['Federated', () => this.seedFederated()],
      ['ModelRegistry', () => this.seedModelRegistry()],
      ['EvalCache', () => this.seedEvalCache()],
      ['SemanticCache', () => this.seedSemanticCache()],
      ['ModelComparison', () => this.seedModelComparison()],
      ['AlertRules', () => this.seedAlertRules()],
      ['Permissions', () => this.seedPermissions()],
      ['DataSampling', () => this.seedDataSampling()],
      ['DataQuality', () => this.seedDataQuality()],
      ['TaskOrchestration', () => this.seedTaskOrchestration()],
      ['DataLineage', () => this.seedDataLineage()],
      ['OnlineEval', () => this.seedOnlineEval()],
      ['SyntheticData', () => this.seedSyntheticData()],
      ['Scheduler', () => this.seedScheduler()],
      ['CostTracking', () => this.seedCostTracking()],
      ['EloRating', () => this.seedEloRating()],
      ['Regression', () => this.seedRegression()],
      ['PromptOptimize', () => this.seedPromptOptimize()],
      ['ReportConfig', () => this.seedReportConfig()],
      ['LLMJudge', () => this.seedLLMJudge()],
      ['Multimodal', () => this.seedMultimodal()],
      ['Conversation', () => this.seedConversation()],
      ['ResultExplanation', () => this.seedResultExplanation()],
    ];
    for (const [name, fn] of seeds) {
      try { fn(); } catch (e) { console.warn(`⚠️ [MockSeed] ${name} skipped: ${e.message}`); }
    }
    console.log('✅ [MockSeed] 后端演示数据填充完成！');
  }

  seedWebhooks() {
    const now = new Date();
    const ws = this.webhookService as any;
    ws.webhooks.set('webhook_1', { id: 'webhook_1', name: '评测完成通知', url: 'https://hooks.slack.com/services/xxx', events: [WebhookEvent.EVAL_COMPLETED], enabled: true, retryCount: 3, timeout: 5000, createdAt: new Date(now.getTime() - 86400000*5), lastTriggeredAt: new Date(now.getTime() - 3600000), successCount: 42, failureCount: 1 });
    ws.webhooks.set('webhook_2', { id: 'webhook_2', name: '异常告警', url: 'https://hooks.slack.com/services/yyy', events: [WebhookEvent.EVAL_FAILED, WebhookEvent.REGRESSION_DETECTED], enabled: true, retryCount: 5, timeout: 10000, createdAt: new Date(now.getTime() - 86400000*10), lastTriggeredAt: new Date(now.getTime() - 86400000), successCount: 18, failureCount: 0 });
    ws.webhooks.set('webhook_3', { id: 'webhook_3', name: 'CI/CD回调', url: 'https://ci.example.com/webhook/eval', events: [WebhookEvent.PIPELINE_COMPLETED], enabled: false, retryCount: 2, timeout: 3000, createdAt: new Date(now.getTime() - 86400000*20), lastTriggeredAt: new Date(now.getTime() - 86400000*2), successCount: 8, failureCount: 2 });
  }

  seedExperiments() {
    const exp = this.experimentService as any;
    const now = new Date();
    exp.experiments.set('exp_1', { id: 'exp_1', name: 'Prompt迭代实验-v3→v4', description: '验证增加few-shot示例对准确率的影响', hypothesis: '增加few-shot示例可提升准确率', status: 'completed', metricWeights: { accuracy: 0.5, f1: 0.3, latency: 0.2 }, runs: [], createdAt: new Date(now.getTime() - 86400000*2), updatedAt: new Date(now.getTime() - 86400000) });
    exp.experiments.set('exp_2', { id: 'exp_2', name: '温度参数搜索', description: '寻找分类任务最优温度', hypothesis: '低温度更适合分类任务', status: 'completed', metricWeights: { accuracy: 0.6, f1: 0.4 }, runs: [], createdAt: new Date(now.getTime() - 86400000*3), updatedAt: new Date(now.getTime() - 86400000*2) });
    exp.experiments.set('exp_3', { id: 'exp_3', name: '模型微调对比', description: '对比微调前后效果', hypothesis: '微调后推理能力提升', status: 'running', metricWeights: { accuracy: 0.4, reasoning: 0.6 }, runs: [], createdAt: new Date(now.getTime() - 86400000), updatedAt: now });
  }

  seedScenarios() {
    const sm = this.scenarioService as any;
    sm.scenarios.set('scn_1', { id: 'scn_1', name: '客服咨询场景', description: '覆盖退款、物流、产品咨询等', type: ScenarioType.QA, status: 'active', config: { difficulty: 'easy', caseCount: 200 }, createdAt: new Date() });
    sm.scenarios.set('scn_2', { id: 'scn_2', name: '投诉处理场景', description: '情绪化输入的投诉场景', type: ScenarioType.QA, status: 'active', config: { difficulty: 'hard', caseCount: 80 }, createdAt: new Date() });
    sm.scenarios.set('scn_3', { id: 'scn_3', name: '商品推荐场景', description: '个性化推荐对话', type: ScenarioType.DIALOGUE, status: 'active', config: { difficulty: 'medium', caseCount: 150 }, createdAt: new Date() });
    sm.scenarios.set('scn_4', { id: 'scn_4', name: '多轮对话场景', description: '复杂多轮任务型对话', type: ScenarioType.DIALOGUE, status: 'paused', config: { difficulty: 'hard', caseCount: 100 }, createdAt: new Date() });
  }

  seedTenants() {
    const ts = this.tenantService as any;
    ts.tenants.set('tenant_1', { id: 'tenant_1', name: '默认租户', plan: TenantPlan.ENTERPRISE, status: TenantStatus.ACTIVE, description: '系统默认租户', createdAt: new Date() });
    ts.tenants.set('tenant_2', { id: 'tenant_2', name: '测试环境', plan: TenantPlan.PROFESSIONAL, status: TenantStatus.ACTIVE, description: '测试用租户', createdAt: new Date() });
    ts.tenants.set('tenant_3', { id: 'tenant_3', name: '合作方A', plan: TenantPlan.BASIC, status: TenantStatus.SUSPENDED, description: '外部合作方', createdAt: new Date() });
  }

  seedConfigs() {
    const cs = this.configService as any;
    cs.configs.set('max_concurrent_evals', { key: 'max_concurrent_evals', value: '10', type: ConfigType.SYSTEM, description: '最大并发评测数', updatedAt: new Date() });
    cs.configs.set('default_model', { key: 'default_model', value: 'GPT-4o', type: ConfigType.MODEL, description: '默认评测模型', updatedAt: new Date() });
    cs.configs.set('timeout_seconds', { key: 'timeout_seconds', value: '300', type: ConfigType.SYSTEM, description: '评测超时时间', updatedAt: new Date() });
    cs.configs.set('enable_cache', { key: 'enable_cache', value: 'true', type: ConfigType.PERFORMANCE, description: '是否启用缓存', updatedAt: new Date() });
    cs.configs.set('log_level', { key: 'log_level', value: 'info', type: ConfigType.SYSTEM, description: '日志级别', updatedAt: new Date() });
  }

  seedReplays() {
    const rs = this.replayService as any;
    rs.tasks.set('replay_1', { id: 'replay_1', name: '回归验证-v3模型', status: 'completed', sourceRunId: 'run-abc123def456', consistency: 0.95, createdAt: new Date() });
    rs.tasks.set('replay_2', { id: 'replay_2', name: '一致性检查-批量A', status: 'completed', sourceRunId: 'run-xyz789ghi012', consistency: 0.88, createdAt: new Date() });
    rs.tasks.set('replay_3', { id: 'replay_3', name: '稳定性测试-周末', status: 'running', sourceRunId: 'run-mno345pqr678', consistency: 0, createdAt: new Date() });
  }

  seedTraces() {
    const ts = this.traceService as any;
    const now = new Date();
    if (!ts.traces) ts.traces = new Map();
    ts.traces.set('trace_1', { id: 'trace_1', name: '评测执行-全流程', status: 'completed', duration: 3420, spanCount: 12, startTime: new Date(now.getTime() - 3600000) });
    ts.traces.set('trace_2', { id: 'trace_2', name: '数据集加载', status: 'completed', duration: 890, spanCount: 5, startTime: new Date(now.getTime() - 7200000) });
    ts.traces.set('trace_3', { id: 'trace_3', name: '模型推理-GPT4o', status: 'completed', duration: 2100, spanCount: 8, startTime: new Date(now.getTime() - 10800000) });
    ts.traces.set('trace_4', { id: 'trace_4', name: '评分计算', status: 'completed', duration: 560, spanCount: 4, startTime: new Date(now.getTime() - 14400000) });
    ts.traces.set('trace_5', { id: 'trace_5', name: '报告生成', status: 'running', duration: 1200, spanCount: 6, startTime: new Date(now.getTime() - 1800000) });
  }

  seedABTests() {
    const abs = this.abTestService as any;
    abs.tests.set('ab_1', { id: 'ab_1', name: 'Prompt版本对比-v3 vs v4', status: ABTestStatus.COMPLETED, variants: [{ name: 'prompt-v3' }, { name: 'prompt-v4' }], runs: [], createdAt: new Date() });
    abs.tests.set('ab_2', { id: 'ab_2', name: '模型对比-GPT4o vs Claude', status: ABTestStatus.RUNNING, variants: [{ name: 'GPT-4o' }, { name: 'Claude-3.5' }], runs: [], createdAt: new Date() });
    abs.tests.set('ab_3', { id: 'ab_3', name: '温度参数对比-0.3 vs 0.7', status: ABTestStatus.COMPLETED, variants: [{ name: 'temp-0.3' }, { name: 'temp-0.7' }], runs: [], createdAt: new Date() });
  }

  seedBenchmarks() {
    const bs = this.benchmarkService as any;
    if (!bs.results) bs.results = [];
    bs.results.push({ id: 'bm_1', type: BenchmarkType.MMLU, model: 'GPT-4o', score: 0.88, rank: 1, samples: 14042, updatedAt: new Date() });
    bs.results.push({ id: 'bm_2', type: BenchmarkType.MMLU, model: 'Claude-3.5', score: 0.86, rank: 2, samples: 14042, updatedAt: new Date() });
    bs.results.push({ id: 'bm_3', type: BenchmarkType.HUMAN_EVAL, model: 'GPT-4o', score: 0.92, rank: 1, samples: 164, updatedAt: new Date() });
    bs.results.push({ id: 'bm_4', type: BenchmarkType.HUMAN_EVAL, model: 'Claude-3.5', score: 0.90, rank: 2, samples: 164, updatedAt: new Date() });
  }

  seedSnapshots() {
    const ss = this.snapshotService as any;
    ss.snapshots.set('snap_1', { id: 'snap_1', name: '2026-09-周评测快照', model: 'GPT-4o', metrics: { accuracy: 0.91 }, createdAt: new Date() });
    ss.snapshots.set('snap_2', { id: 'snap_2', name: '2026-09-第3周快照', model: 'Claude-3.5', metrics: { accuracy: 0.88 }, createdAt: new Date() });
    ss.snapshots.set('snap_3', { id: 'snap_3', name: '月度基准快照-8月', model: 'GPT-4o', metrics: { accuracy: 0.89 }, createdAt: new Date() });
  }

  seedWorkflows() {
    const ws = this.workflowService as any;
    ws.workflows.set('wf_1', { id: 'wf_1', name: '数据准备→评测→报告', description: '标准评测流程', status: 'active', nodes: [{ id: 'n1', type: WorkflowNodeType.TRIGGER }, { id: 'n2', type: WorkflowNodeType.PROCESS }, { id: 'n3', type: WorkflowNodeType.OUTPUT }], edges: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }], createdAt: new Date() });
    ws.workflows.set('wf_2', { id: 'wf_2', name: '模型部署→冒烟测试→上线', description: '部署验证流程', status: 'active', nodes: [{ id: 'n1', type: WorkflowNodeType.TRIGGER }, { id: 'n2', type: WorkflowNodeType.PROCESS }], edges: [{ from: 'n1', to: 'n2' }], createdAt: new Date() });
    ws.workflows.set('wf_3', { id: 'wf_3', name: '回归检测→告警→修复', description: '回归修复流程', status: 'paused', nodes: [{ id: 'n1', type: WorkflowNodeType.TRIGGER }], edges: [], createdAt: new Date() });
  }

  seedPromptVersions() {
    const pvs = this.promptVersionService as any;
    pvs.prompts.set('prompt_1', { id: 'prompt_1', name: '客服问答Prompt', category: 'qa', content: '你是一个专业的客服助手...', version: 'v3', createdAt: new Date() });
    pvs.prompts.set('prompt_2', { id: 'prompt_2', name: '文本分类Prompt', category: 'classification', content: '请对以下文本进行分类...', version: 'v2', createdAt: new Date() });
    pvs.prompts.set('prompt_3', { id: 'prompt_3', name: '摘要生成Prompt', category: 'summarization', content: '请提取以下文档的核心内容...', version: 'v4', createdAt: new Date() });
    pvs.prompts.set('prompt_4', { id: 'prompt_4', name: '安全检测Prompt', category: 'safety', content: '请检测以下内容是否安全...', version: 'v1', createdAt: new Date() });
  }

  seedDataAugmentation() {
    const das = this.dataAugService as any;
    if (!das.tasks) das.tasks = new Map();
    das.tasks.set('da_1', { id: 'da_1', name: '同义词替换增强', strategy: AugmentationStrategy.SYNONYM, status: 'completed', sourceSize: 500, outputSize: 1500, qualityScore: 0.91, createdAt: new Date() });
    das.tasks.set('da_2', { id: 'da_2', name: '回译增强-中英', strategy: AugmentationStrategy.BACK_TRANSLATION, status: 'completed', sourceSize: 300, outputSize: 900, qualityScore: 0.88, createdAt: new Date() });
    das.tasks.set('da_3', { id: 'da_3', name: 'LLM生成增强', strategy: AugmentationStrategy.LLM_GENERATION, status: 'running', sourceSize: 200, outputSize: 0, qualityScore: 0, createdAt: new Date() });
  }

  seedMultilingual() {
    const mls = this.multilingualService as any;
    if (!mls.results) mls.results = [];
    mls.results.push({ id: 'ml_1', language: Language.EN, locale: 'en-US', status: 'completed', totalCases: 200, avgScore: 0.92, lastRunAt: new Date() });
    mls.results.push({ id: 'ml_2', language: Language.ZH, locale: 'zh-CN', status: 'completed', totalCases: 200, avgScore: 0.94, lastRunAt: new Date() });
    mls.results.push({ id: 'ml_3', language: Language.JA, locale: 'ja-JP', status: 'completed', totalCases: 150, avgScore: 0.85, lastRunAt: new Date() });
    mls.results.push({ id: 'ml_4', language: Language.FR, locale: 'fr-FR', status: 'pending', totalCases: 100, avgScore: 0, lastRunAt: null });
  }

  seedDataVersioning() {
    const dvs = this.dataVersionService as any;
    if (!dvs.versions) dvs.versions = new Map();
    dvs.versions.set('ds-customer-service', [{ version: '3', commitHash: 'a1b2c3d4', recordCount: 1500, sizeBytes: 5242880, createdAt: new Date(), createdBy: 'admin' }, { version: '2', commitHash: 'e5f6a7b8', recordCount: 1200, sizeBytes: 4194304, createdAt: new Date(Date.now() - 86400000*5), createdBy: 'admin' }]);
    dvs.versions.set('ds-classification', [{ version: '2', commitHash: 'c9d0e1f2', recordCount: 800, sizeBytes: 2097152, createdAt: new Date(Date.now() - 86400000*2), createdBy: 'evaluator' }]);
  }

  seedMetricAttribution() {
    const mas = this.metricAttrService as any;
    if (!mas.results) mas.results = [];
    mas.results.push({ id: 'ma_1', metricName: '准确率', category: 'core', weight: 0.35, contribution: 0.12, trend: '↑', updatedAt: new Date() });
    mas.results.push({ id: 'ma_2', metricName: '响应速度', category: 'performance', weight: 0.20, contribution: 0.05, trend: '→', updatedAt: new Date() });
    mas.results.push({ id: 'ma_3', metricName: '安全评分', category: 'safety', weight: 0.25, contribution: 0.08, trend: '↑', updatedAt: new Date() });
    mas.results.push({ id: 'ma_4', metricName: '用户满意度', category: 'ux', weight: 0.20, contribution: -0.02, trend: '↓', updatedAt: new Date() });
  }

  seedDistillation() {
    const ds = this.distillService as any;
    if (!ds.tasks) ds.tasks = new Map();
    ds.tasks.set('dist_1', { id: 'dist_1', name: 'GPT4o→Mini蒸馏', strategy: DistillationStrategy.KD, teacherModel: 'GPT-4o', studentModel: 'GPT-4o-mini', status: 'completed', compressionRatio: 5.2, accuracyRetention: 0.94, createdAt: new Date() });
    ds.tasks.set('dist_2', { id: 'dist_2', name: 'Claude→Tiny蒸馏', strategy: DistillationStrategy.KD, teacherModel: 'Claude-3.5', studentModel: 'Claude-tiny', status: 'completed', compressionRatio: 8.0, accuracyRetention: 0.89, createdAt: new Date() });
    ds.tasks.set('dist_3', { id: 'dist_3', name: '大模型→专用蒸馏', strategy: DistillationStrategy.KD, teacherModel: 'GPT-4o', studentModel: 'custom-cls', status: 'running', compressionRatio: 0, accuracyRetention: 0, createdAt: new Date() });
  }

  seedFederated() {
    const fs = this.federatedService as any;
    if (!fs.tasks) fs.tasks = new Map();
    fs.tasks.set('fed_1', { id: 'fed_1', name: '跨机构联合评测', status: 'active', participants: [{ id: 'p1', name: '总部节点', status: 'active', dataPoints: 50000 }, { id: 'p2', name: '华东节点', status: 'active', dataPoints: 15000 }, { id: 'p3', name: '华南节点', status: 'paused', dataPoints: 8000 }], createdAt: new Date() });
    fs.tasks.set('fed_2', { id: 'fed_2', name: '跨区域模型评估', status: 'running', participants: [{ id: 'p1', name: '北京节点', status: 'active', dataPoints: 20000 }], createdAt: new Date() });
  }

  seedModelRegistry() {
    const mrs = this.modelRegService as any;
    if (!mrs.models) mrs.models = new Map();
    mrs.models.set('model_1', { id: 'model_1', name: 'GPT-4o', provider: 'OpenAI', version: '2024-08', status: 'active', taskType: 'chat', accuracy: 0.92, registeredAt: new Date() });
    mrs.models.set('model_2', { id: 'model_2', name: 'Claude-3.5-Sonnet', provider: 'Anthropic', version: '2024-10', status: 'active', taskType: 'chat', accuracy: 0.89, registeredAt: new Date() });
    mrs.models.set('model_3', { id: 'model_3', name: 'Gemini-Pro', provider: 'Google', version: '1.5', status: 'active', taskType: 'chat', accuracy: 0.86, registeredAt: new Date() });
    mrs.models.set('model_4', { id: 'model_4', name: 'text-embedding-3', provider: 'OpenAI', version: '2024-01', status: 'active', taskType: 'embedding', accuracy: 0.95, registeredAt: new Date() });
    mrs.models.set('model_5', { id: 'model_5', name: 'Llama-3.1-70B', provider: 'Meta', version: '3.1', status: 'paused', taskType: 'chat', accuracy: 0.83, registeredAt: new Date() });
  }

  seedEvalCache() {
    const ecs = this.evalCacheService as any;
    ecs.stats = { hits: 8900, misses: 3460, evictions: 120, sets: 1250 };
  }

  seedSemanticCache() {
    const scs = this.semanticCacheService as any;
    if (scs.stats) scs.stats = { hits: 5600, misses: 2100, evictions: 80, sets: 800 };
  }

  seedModelComparison() {
    const mcs = this.modelCompService as any;
    if (!mcs.comparisons) mcs.comparisons = [];
    mcs.comparisons.push({ id: 'mc_1', modelA: 'GPT-4o', modelB: 'Claude-3.5', metric: '准确率', scoreA: 0.92, scoreB: 0.89, winner: 'GPT-4o' });
    mcs.comparisons.push({ id: 'mc_2', modelA: 'GPT-4o', modelB: 'Claude-3.5', metric: '安全性', scoreA: 0.95, scoreB: 0.97, winner: 'Claude-3.5' });
    mcs.comparisons.push({ id: 'mc_3', modelA: 'GPT-4o', modelB: 'Gemini-Pro', metric: '响应速度', scoreA: 0.85, scoreB: 0.91, winner: 'Gemini-Pro' });
    mcs.comparisons.push({ id: 'mc_4', modelA: 'Claude-3.5', modelB: 'Gemini-Pro', metric: '推理能力', scoreA: 0.91, scoreB: 0.84, winner: 'Claude-3.5' });
  }

  seedAlertRules() {
    const ars = this.alertRuleService as any;
    if (!ars.rules) ars.rules = new Map();
    ars.rules.set('alert_1', { id: 'alert_1', name: '准确率下降告警', metric: 'accuracy', threshold: '< 0.85', status: 'active', triggered: 3, updatedAt: new Date() });
    ars.rules.set('alert_2', { id: 'alert_2', name: '延迟超标告警', metric: 'latency', threshold: '> 3000ms', status: 'active', triggered: 7, updatedAt: new Date() });
    ars.rules.set('alert_3', { id: 'alert_3', name: '安全评分告警', metric: 'safety', threshold: '< 0.90', status: 'active', triggered: 1, updatedAt: new Date() });
    ars.rules.set('alert_4', { id: 'alert_4', name: '成本超预算', metric: 'cost', threshold: '> $50/day', status: 'paused', triggered: 2, updatedAt: new Date() });
  }

  seedPermissions() {
    const ps = this.permissionService as any;
    if (!ps.users) ps.users = new Map();
    ps.users.set('perm_1', { id: 'perm_1', name: '管理员', role: 'admin', permissions: '全部权限', members: 3, status: 'active' });
    ps.users.set('perm_2', { id: 'perm_2', name: '评测工程师', role: 'evaluator', permissions: '评测/数据集/报告', members: 8, status: 'active' });
    ps.users.set('perm_3', { id: 'perm_3', name: '只读用户', role: 'viewer', permissions: '查看权限', members: 15, status: 'active' });
    ps.users.set('perm_4', { id: 'perm_4', name: '外部审计', role: 'auditor', permissions: '报告/日志', members: 2, status: 'paused' });
  }

  seedDataSampling() {
    const ss = this.samplingService as any;
    if (!ss.results) ss.results = [];
    ss.results.push({ id: 'ds_1', name: '随机采样-10%', dataset: '客服对话集', strategy: 'random', sampleSize: 150, totalSize: 1500, createdAt: new Date() });
    ss.results.push({ id: 'ds_2', name: '分层采样-困难样本', dataset: '分类数据集', strategy: 'stratified', sampleSize: 200, totalSize: 800, createdAt: new Date() });
    ss.results.push({ id: 'ds_3', name: '均匀采样', dataset: '摘要数据集', strategy: 'uniform', sampleSize: 100, totalSize: 2000, createdAt: new Date() });
  }

  seedDataQuality() {
    const dqs = this.dataQualityService as any;
    if (!dqs.results) dqs.results = [];
    dqs.results.push({ id: 'dq_1', dataset: '客服对话集', checkType: '完整性', score: 0.96, issues: 12, checkedAt: new Date() });
    dqs.results.push({ id: 'dq_2', dataset: '客服对话集', checkType: '一致性', score: 0.92, issues: 28, checkedAt: new Date() });
    dqs.results.push({ id: 'dq_3', dataset: '分类数据集', checkType: '标签平衡', score: 0.85, issues: 45, checkedAt: new Date() });
    dqs.results.push({ id: 'dq_4', dataset: '摘要数据集', checkType: '重复检测', score: 0.98, issues: 5, checkedAt: new Date() });
    dqs.results.push({ id: 'dq_5', dataset: '摘要数据集', checkType: '格式合规', score: 0.94, issues: 18, checkedAt: new Date() });
  }

  seedTaskOrchestration() {
    const tos = this.taskOrchService as any;
    if (!tos.orchestrations) tos.orchestrations = new Map();
    tos.orchestrations.set('to_1', { id: 'to_1', name: '数据集预处理', type: 'preprocessing', status: 'completed', priority: 1, dependencies: '-', createdAt: new Date() });
    tos.orchestrations.set('to_2', { id: 'to_2', name: '模型推理-批次A', type: 'inference', status: 'running', priority: 2, dependencies: '数据集预处理', createdAt: new Date() });
    tos.orchestrations.set('to_3', { id: 'to_3', name: '模型推理-批次B', type: 'inference', status: 'pending', priority: 2, dependencies: '数据集预处理', createdAt: new Date() });
    tos.orchestrations.set('to_4', { id: 'to_4', name: '结果汇总', type: 'aggregation', status: 'pending', priority: 3, dependencies: '模型推理-批次A, 模型推理-批次B', createdAt: new Date() });
  }

  seedDataLineage() {
    const dls = this.dataLineageService as any;
    if (!dls.nodes) dls.nodes = new Map();
    dls.nodes.set('ln_1', { id: 'ln_1', source: '评测数据集', target: '评测执行', type: 'dataset→eval', records: 150, lastSync: new Date() });
    dls.nodes.set('ln_2', { id: 'ln_2', source: '评测执行', target: '评测报告', type: 'eval→report', records: 12, lastSync: new Date() });
    dls.nodes.set('ln_3', { id: 'ln_3', source: '标注管理', target: '评测数据集', type: 'annotation→dataset', records: 80, lastSync: new Date() });
    dls.nodes.set('ln_4', { id: 'ln_4', source: '模型注册', target: '评测执行', type: 'model→eval', records: 5, lastSync: new Date() });
  }

  seedOnlineEval() {
    const oes = this.onlineEvalService as any;
    if (!oes.configs) oes.configs = new Map();
    oes.configs.set('oe_1', { id: 'oe_1', endpoint: '/v1/chat/completions', model: 'GPT-4o', status: 'active', avgLatency: 1200, score: 0.91, requests: 5680 });
    oes.configs.set('oe_2', { id: 'oe_2', endpoint: '/v1/chat/completions', model: 'Claude-3.5', status: 'active', avgLatency: 980, score: 0.89, requests: 3420 });
    oes.configs.set('oe_3', { id: 'oe_3', endpoint: '/v1/embeddings', model: 'text-embedding-3', status: 'active', avgLatency: 350, score: 0.95, requests: 12500 });
  }

  seedSyntheticData() {
    const sds = this.syntheticDataService as any;
    if (!sds.tasks) sds.tasks = new Map();
    sds.tasks.set('sd_1', { id: 'sd_1', name: '客服对话增强集', type: 'paraphrase', status: 'completed', count: 500, quality: 0.92, createdAt: new Date() });
    sds.tasks.set('sd_2', { id: 'sd_2', name: '分类样本扩展', type: 'back-translation', status: 'completed', count: 300, quality: 0.88, createdAt: new Date() });
    sds.tasks.set('sd_3', { id: 'sd_3', name: '边界案例生成', type: 'llm-generation', status: 'running', count: 0, quality: 0, createdAt: new Date() });
  }

  seedScheduler() {
    const ss = this.schedulerService as any;
    if (!ss.tasks) ss.tasks = new Map();
    ss.tasks.set('sch_1', { id: 'sch_1', name: '每日定时回归', cron: '0 2 * * *', status: 'active', lastRun: new Date(Date.now() - 86400000), nextRun: new Date(Date.now() + 86400000) });
    ss.tasks.set('sch_2', { id: 'sch_2', name: '每周全量评测', cron: '0 3 * * 1', status: 'active', lastRun: new Date(Date.now() - 86400000*4), nextRun: new Date(Date.now() + 86400000*3) });
    ss.tasks.set('sch_3', { id: 'sch_3', name: '月度基准对比', cron: '0 4 1 * *', status: 'paused', lastRun: new Date(Date.now() - 86400000*20), nextRun: new Date(Date.now() + 86400000*10) });
  }

  seedCostTracking() {
    const cts = this.costService as any;
    if (!cts.records) cts.records = [];
    cts.records.push({ id: 'cost_1', model: 'GPT-4o', inputTokens: 125000, outputTokens: 45000, cost: 2.35, date: '2026-09-20' });
    cts.records.push({ id: 'cost_2', model: 'Claude-3.5', inputTokens: 98000, outputTokens: 32000, cost: 1.82, date: '2026-09-20' });
    cts.records.push({ id: 'cost_3', model: 'Gemini-Pro', inputTokens: 150000, outputTokens: 55000, cost: 0.95, date: '2026-09-19' });
    cts.records.push({ id: 'cost_4', model: 'GPT-4o-mini', inputTokens: 200000, outputTokens: 80000, cost: 0.45, date: '2026-09-19' });
  }

  seedEloRating() {
    const ers = this.eloService as any;
    if (!ers.entries) ers.entries = new Map();
    ers.entries.set('elo_1', { id: 'elo_1', model: 'GPT-4o', rating: 1285, wins: 45, losses: 8, draws: 7, trend: 'up' });
    ers.entries.set('elo_2', { id: 'elo_2', model: 'Claude-3.5', rating: 1262, wins: 42, losses: 10, draws: 8, trend: 'up' });
    ers.entries.set('elo_3', { id: 'elo_3', model: 'Gemini-Pro', rating: 1198, wins: 30, losses: 18, draws: 12, trend: 'down' });
    ers.entries.set('elo_4', { id: 'elo_4', model: 'Llama-3.1-70B', rating: 1150, wins: 25, losses: 22, draws: 13, trend: 'stable' });
    ers.entries.set('elo_5', { id: 'elo_5', model: 'Qwen-2.5-72B', rating: 1120, wins: 20, losses: 25, draws: 15, trend: 'down' });
  }

  seedRegression() {
    const rds = this.regressionService as any;
    if (!rds.detections) rds.detections = [];
    rds.detections.push({ id: 'reg_1', metric: '准确率', baseline: 0.92, current: 0.88, change: -0.04, status: 'warning', detectedAt: new Date() });
    rds.detections.push({ id: 'reg_2', metric: '响应时间', baseline: 1200, current: 1350, change: 150, status: 'warning', detectedAt: new Date() });
    rds.detections.push({ id: 'reg_3', metric: '安全评分', baseline: 0.95, current: 0.96, change: 0.01, status: 'stable', detectedAt: new Date() });
    rds.detections.push({ id: 'reg_4', metric: '幻觉率', baseline: 0.05, current: 0.08, change: 0.03, status: 'critical', detectedAt: new Date() });
  }

  seedPromptOptimize() {
    const pos = this.promptOptService as any;
    if (!pos.strategies) pos.strategies = [];
    pos.strategies.push({ id: 'po_1', promptName: '客服问答Prompt', version: 'v3-optimized', score: 0.94, tokens: 280, improvement: 0.12, optimizedAt: new Date() });
    pos.strategies.push({ id: 'po_2', promptName: '摘要生成Prompt', version: 'v2-optimized', score: 0.89, tokens: 350, improvement: 0.08, optimizedAt: new Date() });
    pos.strategies.push({ id: 'po_3', promptName: '分类Prompt', version: 'v5-optimized', score: 0.97, tokens: 150, improvement: 0.15, optimizedAt: new Date() });
  }

  seedReportConfig() {
    const rgs = this.reportGenService as any;
    if (!rgs.configs) rgs.configs = [];
    rgs.configs.push({ id: 'rc_1', name: '标准评测报告', type: 'evaluation', status: 'active', format: 'PDF', sections: 5, lastGenerated: new Date() });
    rgs.configs.push({ id: 'rc_2', name: '模型对比报告', type: 'comparison', status: 'active', format: 'HTML', sections: 8, lastGenerated: new Date() });
    rgs.configs.push({ id: 'rc_3', name: '回归检测报告', type: 'regression', status: 'active', format: 'PDF', sections: 4, lastGenerated: new Date() });
  }

  seedLLMJudge() {
    const ljs = this.llmJudgeService as any;
    if (!ljs.results) ljs.results = [];
    ljs.results.push({ id: 'lj_1', modelName: 'GPT-4o', metric: '准确性', score: 0.92, reasoning: '回答准确，信息完整', timestamp: new Date() });
    ljs.results.push({ id: 'lj_2', modelName: 'Claude-3.5', metric: '准确性', score: 0.89, reasoning: '回答基本准确，略有遗漏', timestamp: new Date() });
    ljs.results.push({ id: 'lj_3', modelName: 'GPT-4o', metric: '安全性', score: 0.95, reasoning: '无有害内容输出', timestamp: new Date() });
    ljs.results.push({ id: 'lj_4', modelName: 'Gemini-Pro', metric: '流畅度', score: 0.87, reasoning: '语言流畅自然', timestamp: new Date() });
    ljs.results.push({ id: 'lj_5', modelName: 'Claude-3.5', metric: '推理能力', score: 0.91, reasoning: '逻辑推理正确', timestamp: new Date() });
  }

  seedMultimodal() {
    const mms = this.multimodalService as any;
    if (!mms.results) mms.results = [];
    mms.results.push({ id: 'mm_1', type: 'image-to-text', model: 'GPT-4o', accuracy: 0.91, latency: 2300, createdAt: new Date() });
    mms.results.push({ id: 'mm_2', type: 'image-to-text', model: 'Claude-3.5', accuracy: 0.88, latency: 1900, createdAt: new Date() });
    mms.results.push({ id: 'mm_3', type: 'visual-qa', model: 'GPT-4o', accuracy: 0.85, latency: 3100, createdAt: new Date() });
    mms.results.push({ id: 'mm_4', type: 'visual-qa', model: 'Gemini-Pro', accuracy: 0.82, latency: 2700, createdAt: new Date() });
    mms.results.push({ id: 'mm_5', type: 'ocr', model: 'GPT-4o', accuracy: 0.96, latency: 800, createdAt: new Date() });
  }

  seedConversation() {
    const cvs = this.convService as any;
    if (!cvs.results) cvs.results = [];
    cvs.results.push({ id: 'cv_1', sessionId: 'sess-001', turnCount: 8, coherence: 0.91, completeness: 0.87, engagement: 0.83, resolution: '已解决' });
    cvs.results.push({ id: 'cv_2', sessionId: 'sess-002', turnCount: 5, coherence: 0.78, completeness: 0.72, engagement: 0.69, resolution: '部分解决' });
    cvs.results.push({ id: 'cv_3', sessionId: 'sess-003', turnCount: 12, coherence: 0.95, completeness: 0.93, engagement: 0.88, resolution: '已解决' });
    cvs.results.push({ id: 'cv_4', sessionId: 'sess-004', turnCount: 3, coherence: 0.65, completeness: 0.58, engagement: 0.71, resolution: '未解决' });
    cvs.results.push({ id: 'cv_5', sessionId: 'sess-005', turnCount: 6, coherence: 0.82, completeness: 0.80, engagement: 0.76, resolution: '已解决' });
  }

  seedResultExplanation() {
    const res = this.resultExplService as any;
    if (!res.explanations) res.explanations = [];
    res.explanations.push({ id: 're_1', evalRunId: 'run-abc123def456', modelName: 'GPT-4o', score: 0.92, topFactors: ['上下文理解', '回答完整性'], confidence: 0.88, generatedAt: new Date() });
    res.explanations.push({ id: 're_2', evalRunId: 'run-xyz789ghi012', modelName: 'Claude-3.5', score: 0.89, topFactors: ['逻辑推理', '语言表达'], confidence: 0.85, generatedAt: new Date() });
    res.explanations.push({ id: 're_3', evalRunId: 'run-mno345pqr678', modelName: 'Gemini-Pro', score: 0.85, topFactors: ['知识广度', '格式规范'], confidence: 0.82, generatedAt: new Date() });
  }
}
