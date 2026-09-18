// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 报告类型
export enum ReportType {
  EVAL_SUMMARY = 'eval_summary',           // 评测摘要
  MODEL_COMPARISON = 'model_comparison',   // 模型对比
  TREND_ANALYSIS = 'trend_analysis',       // 趋势分析
  QUALITY_REPORT = 'quality_report',       // 质量报告
  COST_ANALYSIS = 'cost_analysis',         // 成本分析
  REGRESSION_REPORT = 'regression_report', // 回归报告
  COMPREHENSIVE = 'comprehensive',         // 综合报告
}

// 报告格式
export enum ReportFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  JSON = 'json',
  EXCEL = 'excel',
}

// 报告配置
export interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  config: {
    timeRange?: { start: Date; end: Date };
    modelIds?: string[];
    datasetIds?: string[];
    metrics?: string[];
    includeCharts?: boolean;
    includeRawData?: boolean;
    language?: string;
    template?: string;
  };
  schedule?: {
    enabled: boolean;
    cronExpression?: string;
    recipients?: string[];
  };
  createdAt: Date;
  createdBy: string;
}

// 报告生成结果
export interface ReportGenerationResult {
  id: string;
  configId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  content: string;
  metadata: {
    generatedAt: Date;
    duration: number;
    dataSize: number;
    chartCount: number;
    sections: string[];
  };
  error?: string;
  createdAt: Date;
}

@Injectable()
export class ReportGeneratorService {
  constructor(private prisma: PrismaService) {}

  private configs: Map<string, ReportConfig> = new Map();
  private results: Map<string, ReportGenerationResult> = new Map();

  // 创建报告配置
  async createConfig(data: {
    name: string;
    type: ReportType;
    format: ReportFormat;
    config: ReportConfig['config'];
    schedule?: ReportConfig['schedule'];
    createdBy: string;
  }): Promise<ReportConfig> {
    const id = `report_cfg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const config: ReportConfig = {
      id,
      name: data.name,
      type: data.type,
      format: data.format,
      config: data.config,
      schedule: data.schedule,
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    this.configs.set(id, config);
    return config;
  }

  // 生成报告
  async generate(configId: string): Promise<ReportGenerationResult> {
    const config = this.configs.get(configId);
    if (!config) throw new Error('Config not found');

    const id = `report_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const startTime = Date.now();

    const result: ReportGenerationResult = {
      id,
      configId,
      status: 'generating',
      content: '',
      metadata: {
        generatedAt: new Date(),
        duration: 0,
        dataSize: 0,
        chartCount: 0,
        sections: [],
      },
      createdAt: new Date(),
    };

    try {
      // 根据类型生成报告
      let content: string;
      switch (config.type) {
        case ReportType.EVAL_SUMMARY:
          content = await this.generateEvalSummary(config);
          break;
        case ReportType.MODEL_COMPARISON:
          content = await this.generateModelComparison(config);
          break;
        case ReportType.TREND_ANALYSIS:
          content = await this.generateTrendAnalysis(config);
          break;
        case ReportType.QUALITY_REPORT:
          content = await this.generateQualityReport(config);
          break;
        case ReportType.COST_ANALYSIS:
          content = await this.generateCostAnalysis(config);
          break;
        case ReportType.REGRESSION_REPORT:
          content = await this.generateRegressionReport(config);
          break;
        case ReportType.COMPREHENSIVE:
          content = await this.generateComprehensiveReport(config);
          break;
        default:
          content = '# 报告生成失败\n未知报告类型';
      }

      result.content = content;
      result.status = 'completed';
      result.metadata.duration = Date.now() - startTime;
      result.metadata.dataSize = content.length;
      result.metadata.sections = this.extractSections(content);
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
    }

    this.results.set(id, result);
    return result;
  }

  // 生成评测摘要
  private async generateEvalSummary(config: ReportConfig): Promise<string> {
    const evalRuns = await this.prisma.evalRun.findMany({
      include: { results: true, skill: true },
      take: 100,
    });

    const lines: string[] = [];
    lines.push('# 评测摘要报告');
    lines.push('');
    lines.push(`生成时间: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## 概览');
    lines.push(`- 评测运行总数: ${evalRuns.length}`);
    lines.push(`- 涉及模型数: ${new Set(evalRuns.map(r => r.skillId)).size}`);
    lines.push('');

    // 按模型分组统计
    const modelStats = new Map<string, { count: number; avgScore: number }>();
    for (const run of evalRuns) {
      const modelName = run.skill?.name || 'unknown';
      if (!modelStats.has(modelName)) modelStats.set(modelName, { count: 0, avgScore: 0 });
      const stat = modelStats.get(modelName)!;
      stat.count++;
      
      const scores = run.results.reduce((sum, r) => {
        const s = (r.scores as Record<string, number>) || {};
        return sum + (s.accuracy || 0);
      }, 0);
      stat.avgScore = run.results.length > 0 ? scores / run.results.length : 0;
    }

    lines.push('## 模型统计');
    for (const [model, stat] of modelStats.entries()) {
      lines.push(`### ${model}`);
      lines.push(`- 评测次数: ${stat.count}`);
      lines.push(`- 平均准确率: ${(stat.avgScore * 100).toFixed(2)}%`);
      lines.push('');
    }

    return lines.join('\n');
  }

  // 生成模型对比报告
  private async generateModelComparison(config: ReportConfig): Promise<string> {
    const modelIds = config.config.modelIds || [];
    
    const lines: string[] = [];
    lines.push('# 模型对比报告');
    lines.push('');
    lines.push(`生成时间: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## 对比模型');
    for (const id of modelIds) {
      lines.push(`- ${id}`);
    }
    lines.push('');
    lines.push('## 对比结果');
    lines.push('（此处为模型对比详细数据）');

    return lines.join('\n');
  }

  // 生成趋势分析报告
  private async generateTrendAnalysis(config: ReportConfig): Promise<string> {
    const lines: string[] = [];
    lines.push('# 趋势分析报告');
    lines.push('');
    lines.push(`生成时间: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## 趋势概览');
    lines.push('（此处为趋势分析图表和数据）');

    return lines.join('\n');
  }

  // 生成质量报告
  private async generateQualityReport(config: ReportConfig): Promise<string> {
    const lines: string[] = [];
    lines.push('# 质量报告');
    lines.push('');
    lines.push(`生成时间: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## 质量指标');
    lines.push('（此处为质量指标详细数据）');

    return lines.join('\n');
  }

  // 生成成本分析报告
  private async generateCostAnalysis(config: ReportConfig): Promise<string> {
    const lines: string[] = [];
    lines.push('# 成本分析报告');
    lines.push('');
    lines.push(`生成时间: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## 成本概览');
    lines.push('（此处为成本分析数据）');

    return lines.join('\n');
  }

  // 生成回归报告
  private async generateRegressionReport(config: ReportConfig): Promise<string> {
    const lines: string[] = [];
    lines.push('# 回归检测报告');
    lines.push('');
    lines.push(`生成时间: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## 回归检测结果');
    lines.push('（此处为回归检测详细数据）');

    return lines.join('\n');
  }

  // 生成综合报告
  private async generateComprehensiveReport(config: ReportConfig): Promise<string> {
    const lines: string[] = [];
    lines.push('# 综合评测报告');
    lines.push('');
    lines.push(`生成时间: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## 目录');
    lines.push('1. 评测摘要');
    lines.push('2. 模型对比');
    lines.push('3. 趋势分析');
    lines.push('4. 质量指标');
    lines.push('5. 成本分析');
    lines.push('6. 回归检测');
    lines.push('7. 建议与总结');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 1. 评测摘要');
    lines.push('（评测摘要内容）');
    lines.push('');
    lines.push('## 2. 模型对比');
    lines.push('（模型对比内容）');
    lines.push('');
    lines.push('## 7. 建议与总结');
    lines.push('（基于数据分析的建议和总结）');

    return lines.join('\n');
  }

  // 提取章节
  private extractSections(content: string): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('## ')) {
        sections.push(line.substring(3));
      }
    }
    return sections;
  }

  // 获取配置列表
  async listConfigs(): Promise<ReportConfig[]> {
    return Array.from(this.configs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取配置详情
  async getConfig(id: string): Promise<ReportConfig | undefined> {
    return this.configs.get(id);
  }

  // 删除配置
  async deleteConfig(id: string): Promise<boolean> {
    return this.configs.delete(id);
  }

  // 获取报告结果
  async getResult(id: string): Promise<ReportGenerationResult | undefined> {
    return this.results.get(id);
  }

  // 获取报告列表
  async listResults(configId?: string): Promise<ReportGenerationResult[]> {
    let results = Array.from(this.results.values());
    if (configId) results = results.filter(r => r.configId === configId);
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 删除报告
  async deleteResult(id: string): Promise<boolean> {
    return this.results.delete(id);
  }

  // 获取报告类型
  getReportTypes(): Array<{ id: ReportType; name: string; description: string }> {
    return [
      { id: ReportType.EVAL_SUMMARY, name: '评测摘要', description: '评测运行的总体摘要' },
      { id: ReportType.MODEL_COMPARISON, name: '模型对比', description: '多模型性能对比分析' },
      { id: ReportType.TREND_ANALYSIS, name: '趋势分析', description: '性能趋势变化分析' },
      { id: ReportType.QUALITY_REPORT, name: '质量报告', description: '质量指标详细报告' },
      { id: ReportType.COST_ANALYSIS, name: '成本分析', description: '成本使用和效率分析' },
      { id: ReportType.REGRESSION_REPORT, name: '回归报告', description: '性能回归检测报告' },
      { id: ReportType.COMPREHENSIVE, name: '综合报告', description: '包含所有内容的综合报告' },
    ];
  }

  // 获取报告格式
  getReportFormats(): Array<{ id: ReportFormat; name: string; description: string }> {
    return [
      { id: ReportFormat.MARKDOWN, name: 'Markdown', description: 'Markdown 格式报告' },
      { id: ReportFormat.HTML, name: 'HTML', description: 'HTML 网页格式' },
      { id: ReportFormat.PDF, name: 'PDF', description: 'PDF 文档格式' },
      { id: ReportFormat.JSON, name: 'JSON', description: 'JSON 数据格式' },
      { id: ReportFormat.EXCEL, name: 'Excel', description: 'Excel 表格格式' },
    ];
  }
}
