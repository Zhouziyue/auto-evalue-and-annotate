// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DatasetService } from './dataset.service';
import { AiGenerationService } from './ai-generation.service';
import { DatasetVersionService } from './dataset-version.service';
import { DatasetCurationService } from './dataset-curation.service';
import { CreateDatasetDto, UpdateDatasetDto, CreateTestCaseDto, GenerateDto, SelectAnswerDto } from './dataset.dto';

@ApiTags('评测数据集')
@ApiBearerAuth()
@Controller('datasets')
export class DatasetController {
  constructor(
    private readonly datasetService: DatasetService,
    private readonly aiGenerationService: AiGenerationService,
    private readonly datasetVersionService: DatasetVersionService,
    private readonly datasetCurationService: DatasetCurationService,
  ) {}

  // 数据集 CRUD
  @Post()
  @ApiOperation({ summary: '创建数据集' })
  createDataset(@Body() dto: CreateDatasetDto) {
    return this.datasetService.createDataset(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取数据集列表' })
  findAllDatasets(@Query('category') category?: string) {
    return this.datasetService.findAllDatasets(category);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据集详情' })
  findDataset(@Param('id') id: string) {
    return this.datasetService.findDataset(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据集' })
  updateDataset(@Param('id') id: string, @Body() dto: UpdateDatasetDto) {
    return this.datasetService.updateDataset(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据集' })
  removeDataset(@Param('id') id: string) {
    return this.datasetService.removeDataset(id);
  }

  // 用例管理
  @Get(':id/cases')
  @ApiOperation({ summary: '获取用例列表' })
  findTestCases(@Param('id') id: string, @Query('difficulty') difficulty?: string) {
    return this.datasetService.findTestCases(id, difficulty);
  }

  @Post(':id/cases')
  @ApiOperation({ summary: '添加用例' })
  createTestCase(@Param('id') id: string, @Body() dto: CreateTestCaseDto) {
    return this.datasetService.createTestCase(id, dto);
  }

  @Put(':id/cases/:caseId')
  @ApiOperation({ summary: '更新用例' })
  updateTestCase(@Param('id') id: string, @Param('caseId') caseId: string, @Body() dto: Partial<CreateTestCaseDto>) {
    return this.datasetService.updateTestCase(caseId, dto);
  }

  @Delete(':id/cases/:caseId')
  @ApiOperation({ summary: '删除用例' })
  removeTestCase(@Param('id') id: string, @Param('caseId') caseId: string) {
    return this.datasetService.removeTestCase(caseId);
  }

  // AI 生成
  @Post('generate')
  @ApiOperation({ summary: 'AI 生成评测用例（3个候选答案）' })
  generate(@Body() dto: GenerateDto) {
    return this.aiGenerationService.generateCandidates(dto.input, dto.context);
  }

  @Post('generate/batch')
  @ApiOperation({ summary: '批量 AI 生成评测用例' })
  batchGenerate(@Body() dto: { inputs: string[] }) {
    return this.aiGenerationService.batchGenerate(dto.inputs);
  }

  @Post('generate/select')
  @ApiOperation({ summary: '选择/修正 AI 生成的答案' })
  selectAnswer(@Body() dto: SelectAnswerDto) {
    return this.aiGenerationService.selectAnswer(dto);
  }

  // 快照
  @Post(':id/snapshot')
  @ApiOperation({ summary: '创建数据集快照' })
  createSnapshot(@Param('id') id: string, @Body() dto: { version: string }) {
    return this.datasetService.createSnapshot(id, dto.version);
  }

  // 导入导出
  @Post(':id/import')
  @ApiOperation({ summary: '导入用例' })
  importCases(@Param('id') id: string, @Body() dto: { cases: CreateTestCaseDto[] }) {
    return this.datasetService.importCases(id, dto.cases);
  }

  @Get(':id/export')
  @ApiOperation({ summary: '导出用例' })
  exportCases(@Param('id') id: string) {
    return this.datasetService.exportCases(id);
  }

  // ========== 版本管理 ==========

  @Post(':id/versions')
  @ApiOperation({ summary: '创建数据集版本' })
  createVersion(@Param('id') id: string, @Body() body: { name: string; description?: string; metadata?: Record<string, any> }) {
    return this.datasetVersionService.createVersion(id, body);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '获取数据集版本列表' })
  getVersions(@Param('id') id: string) {
    return this.datasetVersionService.getVersions(id);
  }

  @Post(':id/versions/:versionId/publish')
  @ApiOperation({ summary: '发布版本' })
  publishVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.datasetVersionService.publishVersion(id, versionId);
  }

  @Post(':id/versions/:versionId/archive')
  @ApiOperation({ summary: '归档版本' })
  archiveVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.datasetVersionService.archiveVersion(id, versionId);
  }

  @Post(':id/versions/diff')
  @ApiOperation({ summary: '对比两个版本' })
  diffVersions(@Param('id') id: string, @Body() body: { versionId1: string; versionId2: string }) {
    return this.datasetVersionService.diffVersions(body.versionId1, body.versionId2);
  }

  @Post(':id/versions/:versionId/rollback')
  @ApiOperation({ summary: '回滚到指定版本' })
  rollbackVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.datasetVersionService.rollbackToVersion(id, versionId);
  }

  // ========== 数据清洗 ==========

  @Post(':id/clean')
  @ApiOperation({ summary: '清洗数据集（去重/过滤/质量检查）' })
  cleanDataset(@Param('id') id: string) {
    return this.datasetCurationService.cleanDataset(id);
  }

  @Get(':id/quality-report')
  @ApiOperation({ summary: '生成数据集质量报告' })
  getQualityReport(@Param('id') id: string) {
    return this.datasetCurationService.generateQualityReport(id);
  }

  @Get('curation/rules')
  @ApiOperation({ summary: '获取筛选规则列表' })
  getFilterRules() {
    return this.datasetCurationService.getRules();
  }

  @Post('curation/rules')
  @ApiOperation({ summary: '创建筛选规则' })
  createFilterRule(@Body() rule: any) {
    return this.datasetCurationService.createRule(rule);
  }

  @Post('curation/rules/:id/toggle')
  @ApiOperation({ summary: '启用/禁用筛选规则' })
  toggleFilterRule(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.datasetCurationService.toggleRule(id, body.enabled);
  }
}
