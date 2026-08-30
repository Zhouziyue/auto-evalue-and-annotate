import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentService } from '../agent/agent.service';

interface ExecutionResult {
  testCaseId: string;
  success: boolean;
  output?: string;
  rawStream?: string;
  metrics?: Record<string, any>;
  error?: string;
}

@Injectable()
export class ExecutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
  ) {}

  /**
   * 执行评测任务
   */
  async executeEvalRun(evalRunId: string) {
    const evalRun = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: { endpoint: true },
    });

    if (!evalRun) throw new Error(`EvalRun ${evalRunId} not found`);

    // 更新状态为运行中
    await this.prisma.evalRun.update({
      where: { id: evalRunId },
      data: { status: 'running', startTime: new Date() },
    });

    // 获取测试用例
    const testCases = evalRun.datasetId
      ? await this.prisma.testCase.findMany({ where: { datasetId: evalRun.datasetId } })
      : [];

    let passed = 0;
    let failed = 0;
    const results: ExecutionResult[] = [];

    // 并发执行（可配置并发数）
    const concurrency = 5;
    for (let i = 0; i < testCases.length; i += concurrency) {
      const batch = testCases.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((tc) => this.executeSingle(evalRun.endpointId, tc.id)),
      );

      for (const result of batchResults) {
        results.push(result);
        if (result.success) passed++;
        else failed++;

        // 保存结果
        await this.prisma.evalResult.create({
          data: {
            evalRunId,
            testCaseId: result.testCaseId,
            status: result.success ? 'passed' : 'failed',
            actualOutput: result.output,
            rawSseStream: result.rawStream,
            metrics: result.metrics as any,
            errorMessage: result.error,
          },
        });
      }
    }

    // 更新完成状态
    await this.prisma.evalRun.update({
      where: { id: evalRunId },
      data: {
        status: 'completed',
        endTime: new Date(),
        totalCases: testCases.length,
        passedCases: passed,
        failedCases: failed,
      },
    });

    return { evalRunId, total: testCases.length, passed, failed, results };
  }

  /**
   * 执行单个用例
   */
  private async executeSingle(endpointId: string, testCaseId: string): Promise<ExecutionResult> {
    const testCase = await this.prisma.testCase.findUnique({ where: { id: testCaseId } });
    if (!testCase) {
      return { testCaseId, success: false, error: 'Test case not found' };
    }

    try {
      const result = await this.agentService.invoke(endpointId, testCase.input);

      return {
        testCaseId,
        success: result.success,
        output: result.output,
        rawStream: result.rawStream,
        metrics: result.metrics,
        error: result.error,
      };
    } catch (error: any) {
      return {
        testCaseId,
        success: false,
        error: error.message,
      };
    }
  }
}
