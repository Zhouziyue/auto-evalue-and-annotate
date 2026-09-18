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
}
