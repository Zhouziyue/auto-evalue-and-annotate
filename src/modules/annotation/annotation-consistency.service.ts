// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 一致性检测结果
export interface ConsistencyReport {
  datasetId: string;
  totalAnnotations: number;
  totalAnnotators: number;
  overallAgreement: number;
  fleissKappa: number;
  krippendorffAlpha: number;
  perCategoryAgreement: Record<string, number>;
  disagreements: Disagreement[];
  suggestions: string[];
}

// 不一致项
export interface Disagreement {
  testCaseId: string;
  input: string;
  annotations: Array<{
    annotatorId: string;
    annotatorName: string;
    label: string;
    confidence: number;
  }>;
  agreementLevel: number;
  severity: 'low' | 'medium' | 'high';
}

// 标注统计
export interface AnnotationStats {
  totalAnnotations: number;
  annotatorCount: number;
  avgAnnotationsPerCase: number;
  avgConfidence: number;
  labelDistribution: Record<string, number>;
  annotatorStats: Array<{
    annotatorId: string;
    annotatorName: string;
    totalAnnotations: number;
    avgConfidence: number;
    agreement: number;
  }>;
}

@Injectable()
export class AnnotationConsistencyService {
  constructor(private prisma: PrismaService) {}

  // 生成一致性报告
  async generateConsistencyReport(datasetId: string): Promise<ConsistencyReport> {
    // 获取数据集的用例和标注
    const testCases = await this.prisma.testCase.findMany({
      where: { datasetId },
      include: { annotations: true },
    });

    // 收集所有标注
    const allAnnotations: Array<{
      testCaseId: string;
      annotatorId: string;
      label: string;
      confidence: number;
    }> = [];

    const annotatorMap = new Map<string, string>();
    const caseAnnotations = new Map<string, Array<{ annotatorId: string; label: string; confidence: number }>>();

    for (const tc of testCases) {
      const annotations = (tc as any).annotations || [];
      const caseAnns: Array<{ annotatorId: string; label: string; confidence: number }> = [];

      for (const ann of annotations) {
        const annotatorId = (ann as any).annotatorId || (ann as any).createdBy || 'unknown';
        const label = (ann as any).label || (ann as any).result || '';
        const confidence = (ann as any).confidence || 1;

        allAnnotations.push({ testCaseId: tc.id, annotatorId, label, confidence });
        annotatorMap.set(annotatorId, (ann as any).annotatorName || annotatorId);
        caseAnns.push({ annotatorId, label, confidence });
      }

      caseAnnotations.set(tc.id, caseAnns);
    }

    const totalAnnotations = allAnnotations.length;
    const annotatorIds = Array.from(new Set(allAnnotations.map(a => a.annotatorId)));
    const totalAnnotators = annotatorIds.length;

    // 计算每个用例的一致性
    const disagreements: Disagreement[] = [];
    let totalAgreement = 0;
    let casesWithMultipleAnnotations = 0;
    const perCategoryAgreement: Record<string, { total: number; count: number }> = {};

    for (const [caseId, anns] of caseAnnotations.entries()) {
      if (anns.length < 2) continue;
      casesWithMultipleAnnotations++;

      // 计算标注一致性（简单比例）
      const labelCounts: Record<string, number> = {};
      for (const ann of anns) {
        labelCounts[ann.label] = (labelCounts[ann.label] || 0) + 1;
      }

      const maxCount = Math.max(...Object.values(labelCounts));
      const agreement = maxCount / anns.length;
      totalAgreement += agreement;

      // 检查不一致
      if (agreement < 1) {
        const tc = testCases.find(t => t.id === caseId);
        const severity = agreement < 0.5 ? 'high' : agreement < 0.75 ? 'medium' : 'low';
        
        disagreements.push({
          testCaseId: caseId,
          input: (tc?.input || '').substring(0, 100),
          annotations: anns.map(a => ({
            annotatorId: a.annotatorId,
            annotatorName: annotatorMap.get(a.annotatorId) || a.annotatorId,
            label: a.label,
            confidence: a.confidence,
          })),
          agreementLevel: agreement,
          severity,
        });
      }

      // 分类统计
      const category = (testCases.find(t => t.id === caseId) as any)?.category || 'default';
      if (!perCategoryAgreement[category]) {
        perCategoryAgreement[category] = { total: 0, count: 0 };
      }
      perCategoryAgreement[category].total += agreement;
      perCategoryAgreement[category].count++;
    }

    const overallAgreement = casesWithMultipleAnnotations > 0
      ? totalAgreement / casesWithMultipleAnnotations
      : 1;

    // 计算 Fleiss' Kappa（简化版）
    const fleissKappa = this.calculateFleissKappa(caseAnnotations, annotatorIds);

    // 计算 Krippendorff's Alpha（简化版）
    const krippendorffAlpha = this.calculateKrippendorffAlpha(caseAnnotations);

    // 分类一致性
    const categoryAgreement: Record<string, number> = {};
    for (const [cat, data] of Object.entries(perCategoryAgreement)) {
      categoryAgreement[cat] = data.count > 0 ? data.total / data.count : 0;
    }

    // 生成建议
    const suggestions: string[] = [];
    if (overallAgreement < 0.7) {
      suggestions.push('整体一致性较低，建议重新审视标注指南');
    }
    if (disagreements.filter(d => d.severity === 'high').length > 0) {
      suggestions.push('存在高度不一致的用例，建议组织标注者讨论统一标准');
    }
    if (totalAnnotators < 3) {
      suggestions.push('标注者数量较少，建议增加标注者以提高可靠性');
    }
    const lowCategoryCats = Object.entries(categoryAgreement).filter(([_, v]) => v < 0.7);
    if (lowCategoryCats.length > 0) {
      suggestions.push(`以下分类一致性较低: ${lowCategoryCats.map(([c, _]) => c).join(', ')}`);
    }
    if (suggestions.length === 0) {
      suggestions.push('标注一致性良好，无需额外调整');
    }

    // 按严重程度排序
    disagreements.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return {
      datasetId,
      totalAnnotations,
      totalAnnotators,
      overallAgreement,
      fleissKappa,
      krippendorffAlpha,
      perCategoryAgreement: categoryAgreement,
      disagreements: disagreements.slice(0, 50),
      suggestions,
    };
  }

  // 获取标注统计
  async getAnnotationStats(datasetId: string): Promise<AnnotationStats> {
    const testCases = await this.prisma.testCase.findMany({
      where: { datasetId },
      include: { annotations: true },
    });

    const allAnnotations: Array<{
      annotatorId: string;
      label: string;
      confidence: number;
    }> = [];

    const labelDistribution: Record<string, number> = {};
    const annotatorData = new Map<string, { total: number; confidenceSum: number }>();

    for (const tc of testCases) {
      const annotations = (tc as any).annotations || [];
      for (const ann of annotations) {
        const annotatorId = (ann as any).annotatorId || (ann as any).createdBy || 'unknown';
        const label = (ann as any).label || (ann as any).result || 'unknown';
        const confidence = (ann as any).confidence || 1;

        allAnnotations.push({ annotatorId, label, confidence });
        labelDistribution[label] = (labelDistribution[label] || 0) + 1;

        if (!annotatorData.has(annotatorId)) {
          annotatorData.set(annotatorId, { total: 0, confidenceSum: 0 });
        }
        const data = annotatorData.get(annotatorId)!;
        data.total++;
        data.confidenceSum += confidence;
      }
    }

    const annotatorStats = Array.from(annotatorData.entries()).map(([id, data]) => ({
      annotatorId: id,
      annotatorName: id,
      totalAnnotations: data.total,
      avgConfidence: data.total > 0 ? data.confidenceSum / data.total : 0,
      agreement: 0,
    }));

    const totalAnnotations = allAnnotations.length;
    const annotatorCount = annotatorData.size;
    const avgAnnotationsPerCase = testCases.length > 0
      ? totalAnnotations / testCases.length
      : 0;
    const avgConfidence = totalAnnotations > 0
      ? allAnnotations.reduce((sum, a) => sum + a.confidence, 0) / totalAnnotations
      : 0;

    return {
      totalAnnotations,
      annotatorCount,
      avgAnnotationsPerCase,
      avgConfidence,
      labelDistribution,
      annotatorStats,
    };
  }

  // 计算 Fleiss' Kappa
  private calculateFleissKappa(
    caseAnnotations: Map<string, Array<{ annotatorId: string; label: string }>>,
    annotatorIds: string[],
  ): number {
    const categories = new Set<string>();
    for (const anns of caseAnnotations.values()) {
      for (const ann of anns) {
        categories.add(ann.label);
      }
    }

    const categoryList = Array.from(categories);
    if (categoryList.length < 2) return 1;

    let totalP = 0;
    let totalPe = 0;
    let validCases = 0;

    for (const [, anns] of caseAnnotations.entries()) {
      if (anns.length < 2) continue;
      validCases++;

      const n = anns.length;
      const counts: Record<string, number> = {};
      for (const ann of anns) {
        counts[ann.label] = (counts[ann.label] || 0) + 1;
      }

      // Pi
      let sumC2 = 0;
      for (const count of Object.values(counts)) {
        sumC2 += count * count;
      }
      const pi = (sumC2 - n) / (n * (n - 1));
      totalP += pi;

      // Pj for each category
      for (const cat of categoryList) {
        const pj = (counts[cat] || 0) / n;
        totalPe += pj * pj;
      }
    }

    if (validCases === 0) return 1;

    const P = totalP / validCases;
    const Pe = totalPe / (validCases * categoryList.length);

    if (Pe === 1) return 1;
    return (P - Pe) / (1 - Pe);
  }

  // 计算 Krippendorff's Alpha（简化版）
  private calculateKrippendorffAlpha(
    caseAnnotations: Map<string, Array<{ annotatorId: string; label: string }>>,
  ): number {
    // 简化实现：使用观察一致性和期望一致性
    let observedAgreement = 0;
    let totalPairs = 0;

    for (const [, anns] of caseAnnotations.entries()) {
      if (anns.length < 2) continue;

      for (let i = 0; i < anns.length; i++) {
        for (let j = i + 1; j < anns.length; j++) {
          totalPairs++;
          if (anns[i].label === anns[j].label) {
            observedAgreement++;
          }
        }
      }
    }

    if (totalPairs === 0) return 1;
    return observedAgreement / totalPairs;
  }
}
