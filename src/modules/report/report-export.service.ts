// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 报告格式
export enum ReportFormat {
  JSON = 'json',
  HTML = 'html',
  MARKDOWN = 'markdown',
  CSV = 'csv',
}

// 报告数据
export interface ReportData {
  title: string;
  description?: string;
  modelName?: string;
  datasetName?: string;
  runId?: string;
  summary: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
    avgScore: number;
    avgLatency: number;
    totalCost?: number;
  };
  metrics: Record<string, number>;
  results: Array<{
    input: string;
    expectedOutput?: string;
    actualOutput: string;
    scores: Record<string, number>;
    latency: number;
    passed: boolean;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// 导出结果
export interface ExportResult {
  format: ReportFormat;
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ReportExportService {
  constructor() {}

  // 导出报告
  async exportReport(data: ReportData, format: ReportFormat): Promise<ExportResult> {
    switch (format) {
      case ReportFormat.JSON:
        return this.exportJSON(data);
      case ReportFormat.HTML:
        return this.exportHTML(data);
      case ReportFormat.MARKDOWN:
        return this.exportMarkdown(data);
      case ReportFormat.CSV:
        return this.exportCSV(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // 导出 JSON
  private exportJSON(data: ReportData): ExportResult {
    const content = JSON.stringify(data, null, 2);
    return {
      format: ReportFormat.JSON,
      filename: `report_${data.runId || Date.now()}.json`,
      content,
      mimeType: 'application/json',
      size: Buffer.byteLength(content, 'utf-8'),
    };
  }

  // 导出 HTML
  private exportHTML(data: ReportData): ExportResult {
    const passRate = data.summary.totalCases > 0
      ? ((data.summary.passedCases / data.summary.totalCases) * 100).toFixed(1)
      : '0';

    const metricsRows = Object.entries(data.metrics)
      .map(([key, value]) => `<tr><td>${key}</td><td>${(value * 100).toFixed(1)}%</td></tr>`)
      .join('\n');

    const resultRows = data.results
      .map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${this.escapeHtml(r.input.substring(0, 100))}</td>
          <td>${this.escapeHtml(r.actualOutput.substring(0, 100))}</td>
          <td>${r.latency}ms</td>
          <td>${r.passed ? '✅' : '❌'}</td>
        </tr>`)
      .join('\n');

    const content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(data.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 20px 0; }
    .card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .card .value { font-size: 24px; font-weight: bold; color: #2563eb; }
    .card .label { font-size: 13px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    .meta { color: #666; font-size: 14px; }
    .pass { color: #16a34a; }
    .fail { color: #dc2626; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(data.title)}</h1>
  ${data.description ? `<p>${this.escapeHtml(data.description)}</p>` : ''}
  
  <div class="meta">
    ${data.modelName ? `<span>模型: ${this.escapeHtml(data.modelName)}</span>` : ''}
    ${data.datasetName ? `<span> | 数据集: ${this.escapeHtml(data.datasetName)}</span>` : ''}
    <span> | 生成时间: ${data.createdAt.toLocaleString('zh-CN')}</span>
  </div>

  <h2>概览</h2>
  <div class="summary">
    <div class="card">
      <div class="value">${data.summary.totalCases}</div>
      <div class="label">总用例数</div>
    </div>
    <div class="card">
      <div class="value pass">${data.summary.passedCases}</div>
      <div class="label">通过</div>
    </div>
    <div class="card">
      <div class="value fail">${data.summary.failedCases}</div>
      <div class="label">失败</div>
    </div>
    <div class="card">
      <div class="value">${passRate}%</div>
      <div class="label">通过率</div>
    </div>
    <div class="card">
      <div class="value">${(data.summary.avgScore * 100).toFixed(1)}%</div>
      <div class="label">平均分</div>
    </div>
    <div class="card">
      <div class="value">${data.summary.avgLatency}ms</div>
      <div class="label">平均延迟</div>
    </div>
  </div>

  <h2>指标详情</h2>
  <table>
    <thead><tr><th>指标</th><th>得分</th></tr></thead>
    <tbody>${metricsRows}</tbody>
  </table>

  <h2>评测结果</h2>
  <table>
    <thead><tr><th>#</th><th>输入</th><th>输出</th><th>延迟</th><th>结果</th></tr></thead>
    <tbody>${resultRows}</tbody>
  </table>
</body>
</html>`;

    return {
      format: ReportFormat.HTML,
      filename: `report_${data.runId || Date.now()}.html`,
      content,
      mimeType: 'text/html',
      size: Buffer.byteLength(content, 'utf-8'),
    };
  }

  // 导出 Markdown
  private exportMarkdown(data: ReportData): ExportResult {
    const passRate = data.summary.totalCases > 0
      ? ((data.summary.passedCases / data.summary.totalCases) * 100).toFixed(1)
      : '0';

    let content = `# ${data.title}\n\n`;
    if (data.description) content += `${data.description}\n\n`;
    
    content += `**模型**: ${data.modelName || 'N/A'}  \n`;
    content += `**数据集**: ${data.datasetName || 'N/A'}  \n`;
    content += `**生成时间**: ${data.createdAt.toLocaleString('zh-CN')}  \n\n`;

    content += `## 概览\n\n`;
    content += `| 指标 | 值 |\n|------|----|\n`;
    content += `| 总用例数 | ${data.summary.totalCases} |\n`;
    content += `| 通过 | ${data.summary.passedCases} |\n`;
    content += `| 失败 | ${data.summary.failedCases} |\n`;
    content += `| 通过率 | ${passRate}% |\n`;
    content += `| 平均分 | ${(data.summary.avgScore * 100).toFixed(1)}% |\n`;
    content += `| 平均延迟 | ${data.summary.avgLatency}ms |\n\n`;

    content += `## 指标详情\n\n`;
    content += `| 指标 | 得分 |\n|------|------|\n`;
    for (const [key, value] of Object.entries(data.metrics)) {
      content += `| ${key} | ${(value * 100).toFixed(1)}% |\n`;
    }
    content += '\n';

    content += `## 评测结果\n\n`;
    content += `| # | 输入 | 输出 | 延迟 | 结果 |\n|---|------|------|------|------|\n`;
    data.results.forEach((r, i) => {
      const input = r.input.substring(0, 60).replace(/\|/g, '\\|');
      const output = r.actualOutput.substring(0, 60).replace(/\|/g, '\\|');
      content += `| ${i + 1} | ${input} | ${output} | ${r.latency}ms | ${r.passed ? '✅' : '❌'} |\n`;
    });

    return {
      format: ReportFormat.MARKDOWN,
      filename: `report_${data.runId || Date.now()}.md`,
      content,
      mimeType: 'text/markdown',
      size: Buffer.byteLength(content, 'utf-8'),
    };
  }

  // 导出 CSV
  private exportCSV(data: ReportData): ExportResult {
    const headers = ['#', '输入', '期望输出', '实际输出', '延迟(ms)', '通过', ...Object.keys(data.metrics)];
    const rows = data.results.map((r, i) => {
      const scores = Object.values(data.metrics).map(v => (v * 100).toFixed(1));
      return [
        i + 1,
        this.csvEscape(r.input),
        this.csvEscape(r.expectedOutput || ''),
        this.csvEscape(r.actualOutput),
        r.latency,
        r.passed ? '是' : '否',
        ...scores,
      ].join(',');
    });

    const content = [headers.join(','), ...rows].join('\n');
    return {
      format: ReportFormat.CSV,
      filename: `report_${data.runId || Date.now()}.csv`,
      content,
      mimeType: 'text/csv',
      size: Buffer.byteLength(content, 'utf-8'),
    };
  }

  // HTML 转义
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // CSV 转义
  private csvEscape(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // 生成报告摘要（用于 API 响应）
  generateSummary(data: ReportData): {
    title: string;
    passRate: number;
    avgScore: number;
    avgLatency: number;
    totalCases: number;
    formats: ReportFormat[];
  } {
    return {
      title: data.title,
      passRate: data.summary.totalCases > 0
        ? data.summary.passedCases / data.summary.totalCases
        : 0,
      avgScore: data.summary.avgScore,
      avgLatency: data.summary.avgLatency,
      totalCases: data.summary.totalCases,
      formats: Object.values(ReportFormat),
    };
  }
}
