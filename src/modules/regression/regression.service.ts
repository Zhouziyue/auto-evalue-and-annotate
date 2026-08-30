import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RegressionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 版本对比
   */
  async compareVersions(evalRunId1: string, evalRunId2: string) {
    const [run1, run2] = await Promise.all([
      this.prisma.evalRun.findUnique({ where: { id: evalRunId1 }, include: { results: { include: { testCase: true } } } }),
      this.prisma.evalRun.findUnique({ where: { id: evalRunId2 }, include: { results: { include: { testCase: true } } } }),
    ]);

    if (!run1 || !run2) throw new Error('EvalRun not found');

    const results1Map = new Map(run1.results.map((r) => [r.testCaseId, r]));
    const results2Map = new Map(run2.results.map((r) => [r.testCaseId, r]));

    const comparisons: any[] = [];
    const allCaseIds = new Set([...results1Map.keys(), ...results2Map.keys()]);

    for (const caseId of allCaseIds) {
      const r1 = results1Map.get(caseId);
      const r2 = results2Map.get(caseId);

      comparisons.push({
        testCaseId: caseId,
        input: r1?.testCase?.input || r2?.testCase?.input,
        status1: r1?.status,
        status2: r2?.status,
        output1: r1?.actualOutput,
        output2: r2?.actualOutput,
        scores1: r1?.scores,
        scores2: r2?.scores,
        regression: r1?.status === 'passed' && r2?.status === 'failed',
        improvement: r1?.status === 'failed' && r2?.status === 'passed',
      });
    }

    const regressions = comparisons.filter((c) => c.regression);
    const improvements = comparisons.filter((c) => c.improvement);

    return {
      run1: { id: run1.id, skillVersion: run1.skill?.version, passRate: run1.totalCases > 0 ? run1.passedCases / run1.totalCases : 0 },
      run2: { id: run2.id, skillVersion: run2.skill?.version, passRate: run2.totalCases > 0 ? run2.passedCases / run2.totalCases : 0 },
      totalCases: allCaseIds.size,
      regressions: regressions.length,
      improvements: improvements.length,
      comparisons,
    };
  }

  /**
   * 创建版本快照
   */
  async createVersionSnapshot(skillId: string, version: string) {
    const evalRuns = await this.prisma.evalRun.findMany({
      where: { skillId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: { results: true },
    });

    const snapshot = evalRuns[0]
      ? { passRate: evalRuns[0].totalCases > 0 ? evalRuns[0].passedCases / evalRuns[0].totalCases : 0, totalCases: evalRuns[0].totalCases }
      : {};

    return this.prisma.skillVersion.create({
      data: { skillId, version, snapshot: snapshot as any },
    });
  }
}
