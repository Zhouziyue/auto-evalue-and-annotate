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
}
