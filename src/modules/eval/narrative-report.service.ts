// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 自然语言报告结构
export interface NarrativeReport {
  evalRunId: string;
  skillName?: string;
  generatedAt: Date;
  sections: {
    title: string;
    content: string;
  }[];
  fullReport: string;
}

@Injectable()
export class NarrativeReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成自然语言评测报告
   */
  async generateNarrativeReport(evalRunId: string): Promise<NarrativeReport> {
    // 1. 获取评测运行数据（包含关联的技能和端点信息）
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: {
        skill: true,
        endpoint: true,
        results: {
          include: {
            testCase: true,
          },
        },
      },
    });

    if (!evalRun) {
      throw new NotFoundException(`评测运行 ${evalRunId} 不存在`);
    }

    // 添加技能名称和端点名称到 evalRun 对象
    (evalRun as any).skillName = evalRun.skill?.name || '未知技能';
    (evalRun as any).endpointName = evalRun.endpoint?.name || '未知端点';

    const sections: { title: string; content: string }[] = [];

    // 2. 生成评测概览
    sections.push(this.generateOverviewSection(evalRun));

    // 3. 生成质量分析
    sections.push(this.generateQualitySection(evalRun));

    // 4. 生成问题诊断
    sections.push(this.generateDiagnosisSection(evalRun));

    // 5. 生成改进建议
    sections.push(this.generateSuggestionSection(evalRun));

    // 6. 生成总结
    sections.push(this.generateConclusionSection(evalRun));

    // 7. 拼接完整报告
    const fullReport = sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');

    return {
      evalRunId,
      skillName: evalRun.skillName || evalRun.endpointName,
      generatedAt: new Date(),
      sections,
      fullReport,
    };
  }

  /**
   * 生成评测概览章节
   */
  private generateOverviewSection(evalRun: any): { title: string; content: string } {
    const total = evalRun.results.length;
    const passed = evalRun.results.filter(r => r.status === 'passed').length;
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    const skillName = evalRun.skillName || evalRun.endpointName || '未知技能';

    let level = '优秀';
    const rate = parseFloat(passRate);
    if (rate < 60) level = '待改进';
    else if (rate < 75) level = '良好';
    else if (rate < 85) level = '较好';

    const content = `本次对"${skillName}"进行了自动化评测，共执行 ${total} 个测试用例。` +
      `其中通过 ${passed} 个，失败 ${failed} 个，整体通过率 ${passRate}%。` +
      `综合评估等级为"${level}"。`;

    return { title: '评测概览', content };
  }

  /**
   * 生成质量分析章节
   */
  private generateQualitySection(evalRun: any): { title: string; content: string } {
    const results = evalRun.results;
    const scoredResults = results.filter(r => {
      let s = r.scores;
      if (typeof s === 'string') { try { s = JSON.parse(s); } catch (e) { return false; } }
      return s && typeof s === 'object' && Object.keys(s).length > 0;
    });

    if (scoredResults.length === 0) {
      return { title: '质量分析', content: '本次评测未采集到量化评分数据。' };
    }

    // 计算各维度平均分
    const dimensionAverages: Record<string, { total: number; count: number }> = {};
    for (const result of scoredResults) {
      let scores = result.scores;
      // scores 可能是 JSON 字符串，需要解析
      if (typeof scores === 'string') {
        try {
          scores = JSON.parse(scores);
        } catch (e) {
          continue;
        }
      }
      if (!scores || typeof scores !== 'object') continue;
      
      for (const [dim, val] of Object.entries(scores)) {
        if (!dimensionAverages[dim]) dimensionAverages[dim] = { total: 0, count: 0 };
        dimensionAverages[dim].total += Number(val);
        dimensionAverages[dim].count++;
      }
    }

    const dimStats = Object.entries(dimensionAverages).map(([dim, data]) => ({
      dimension: dim,
      average: data.total / data.count,
      percentage: ((data.total / data.count) * 100).toFixed(1),
    }));

    dimStats.sort((a, b) => b.average - a.average);

    const bestDim = dimStats[0];
    const worstDim = dimStats[dimStats.length - 1];

    let content = `本次评测从 ${Object.keys(dimensionAverages).length} 个维度进行了质量评估。`;

    if (bestDim && worstDim) {
      content += `\n\n表现最好的维度是"${bestDim.dimension}"，平均得分 ${bestDim.percentage}%；` +
        `表现最弱的维度是"${worstDim.dimension}"，平均得分 ${worstDim.percentage}%。`;
    }

    content += '\n\n各维度得分情况：';
    for (const stat of dimStats) {
      content += `\n- ${stat.dimension}：${stat.percentage}%`;
    }

    return { title: '质量分析', content };
  }

  /**
   * 生成问题诊断章节
   */
  private generateDiagnosisSection(evalRun: any): { title: string; content: string } {
    const failedResults = evalRun.results.filter(r => r.status === 'failed');
    const total = evalRun.results.length;

    if (failedResults.length === 0) {
      return { title: '问题诊断', content: '本次评测所有用例均通过，未发现明显问题。' };
    }

    const failRate = ((failedResults.length / total) * 100).toFixed(1);

    // 分析失败用例的特征
    const lowScoreDims: Record<string, number> = {};
    for (const result of failedResults) {
      let scores = result.scores;
      if (typeof scores === 'string') {
        try { scores = JSON.parse(scores); } catch (e) { continue; }
      }
      if (!scores || typeof scores !== 'object') continue;
      for (const [dim, val] of Object.entries(scores)) {
        if (Number(val) < 0.5) {
          lowScoreDims[dim] = (lowScoreDims[dim] || 0) + 1;
        }
      }
    }

    let content = `本次评测共有 ${failedResults.length} 个用例未通过，失败率 ${failRate}%。`;

    if (Object.keys(lowScoreDims).length > 0) {
      const sortedDims = Object.entries(lowScoreDims).sort((a, b) => b[1] - a[1]);
      content += `\n\n主要失分维度：`;
      for (const [dim, count] of sortedDims) {
        content += `\n- ${dim}：${count} 个用例低于及格线`;
      }
    }

    // 提取典型 bad case
    const badCases = failedResults.slice(0, 3);
    if (badCases.length > 0) {
      content += `\n\n典型问题用例：`;
      for (const bc of badCases) {
        const input = bc.testCase?.input || '未知输入';
        const output = bc.actualOutput || '无输出';
        content += `\n- 输入："${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`;
        content += `\n  输出："${output.substring(0, 50)}${output.length > 50 ? '...' : ''}"`;
      }
    }

    return { title: '问题诊断', content };
  }

  /**
   * 生成改进建议章节
   */
  private generateSuggestionSection(evalRun: any): { title: string; content: string } {
    const results = evalRun.results;
    const scoredResults = results.filter(r => {
      let s = r.scores;
      if (typeof s === 'string') { try { s = JSON.parse(s); } catch (e) { return false; } }
      return s && typeof s === 'object' && Object.keys(s).length > 0;
    });
    const passed = results.filter(r => r.status === 'passed').length;
    const total = results.length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    const suggestions: string[] = [];

    if (passRate < 60) {
      suggestions.push('通过率较低，建议全面审查系统提示词和知识库，优先解决高频失败场景');
    } else if (passRate < 80) {
      suggestions.push('通过率有提升空间，建议针对失败用例进行根因分析，定向优化');
    } else {
      suggestions.push('整体表现良好，建议关注边界场景和长尾用例的覆盖');
    }

    // 基于维度分析给出建议
    const dimAverages: Record<string, number[]> = {};
    for (const r of scoredResults) {
      let scores = r.scores;
      if (typeof scores === 'string') {
        try { scores = JSON.parse(scores); } catch (e) { continue; }
      }
      if (!scores || typeof scores !== 'object') continue;
      for (const [dim, val] of Object.entries(scores)) {
        if (!dimAverages[dim]) dimAverages[dim] = [];
        dimAverages[dim].push(Number(val));
      }
    }

    for (const [dim, vals] of Object.entries(dimAverages)) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg < 0.5) {
        suggestions.push(`"${dim}"维度得分偏低（${(avg * 100).toFixed(1)}%），建议重点优化`);
      }
    }

    suggestions.push('建议定期执行回归评测，跟踪版本迭代的质量变化趋势');
    suggestions.push('建议持续扩充评测用例集，提升场景覆盖度');

    let content = '基于本次评测结果，给出以下改进建议：\n';
    suggestions.forEach((s, i) => {
      content += `\n${i + 1}. ${s}`;
    });

    return { title: '改进建议', content };
  }

  /**
   * 生成总结章节
   */
  private generateConclusionSection(evalRun: any): { title: string; content: string } {
    const total = evalRun.results.length;
    const passed = evalRun.results.filter(r => r.status === 'passed').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    const skillName = evalRun.skillName || evalRun.endpointName || '未知技能';

    const rate = parseFloat(passRate);
    let verdict = '';
    if (rate >= 85) {
      verdict = `"${skillName}"本次评测表现优秀，通过率 ${passRate}%，各项指标达到预期水平，建议按计划推进上线。`;
    } else if (rate >= 70) {
      verdict = `"${skillName}"本次评测表现良好，通过率 ${passRate}%，但仍有部分场景需要优化，建议针对失败用例进行定向改进后重新评测。`;
    } else if (rate >= 50) {
      verdict = `"${skillName}"本次评测通过率 ${passRate}%，存在较多问题，建议全面排查并优化后再进行评测。`;
    } else {
      verdict = `"${skillName}"本次评测通过率仅 ${passRate}%，问题较为严重，建议暂停上线计划，进行全面诊断和修复。`;
    }

    return { title: '总结', content: verdict };
  }
}
