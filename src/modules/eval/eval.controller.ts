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
}
