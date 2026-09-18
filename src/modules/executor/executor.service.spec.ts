// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutorService } from './executor.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentService } from '../agent/agent.service';

describe('ExecutorService', () => {
  let service: ExecutorService;
  let prisma: any;
  let agentService: Partial<Record<keyof AgentService, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      evalRun: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      testCase: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      evalResult: {
        create: jest.fn(),
      },
    };

    agentService = {
      invoke: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutorService,
        { provide: PrismaService, useValue: prisma },
        { provide: AgentService, useValue: agentService },
      ],
    }).compile();

    service = module.get<ExecutorService>(ExecutorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('executeEvalRun - EvalRun 不存在时抛出异常', async () => {
    prisma.evalRun.findUnique.mockResolvedValue(null);

    await expect(service.executeEvalRun('nonexistent')).rejects.toThrow('EvalRun nonexistent not found');
  });

  it('executeEvalRun - 无测试用例时正常完成', async () => {
    const evalRun = {
      id: 'run-1',
      datasetId: 'ds-1',
      endpointId: 'ep-1',
      endpoint: { id: 'ep-1', name: 'test-endpoint' },
    };
    prisma.evalRun.findUnique.mockResolvedValue(evalRun);
    prisma.evalRun.update.mockResolvedValue({});
    prisma.testCase.findMany.mockResolvedValue([]);

    const result = await service.executeEvalRun('run-1');

    expect(result).toEqual({ evalRunId: 'run-1', total: 0, passed: 0, failed: 0, results: [] });
    expect(prisma.evalRun.update).toHaveBeenCalledTimes(2);
  });

  it('executeEvalRun - 有用例且全部通过', async () => {
    const evalRun = {
      id: 'run-1',
      datasetId: 'ds-1',
      endpointId: 'ep-1',
      endpoint: { id: 'ep-1', name: 'test-endpoint' },
    };
    const testCases = [
      { id: 'tc-1', input: 'question 1' },
      { id: 'tc-2', input: 'question 2' },
    ];

    prisma.evalRun.findUnique.mockResolvedValue(evalRun);
    prisma.evalRun.update.mockResolvedValue({});
    prisma.testCase.findMany.mockResolvedValue(testCases);
    prisma.testCase.findUnique.mockImplementation(({ where: { id } }) =>
      Promise.resolve(testCases.find(tc => tc.id === id)),
    );
    prisma.evalResult.create.mockResolvedValue({});

    agentService.invoke.mockResolvedValue({
      success: true,
      output: 'answer',
      rawStream: '',
      metrics: { latency: 100 },
    });

    const result = await service.executeEvalRun('run-1');

    expect(result.total).toBe(2);
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(0);
    expect(prisma.evalResult.create).toHaveBeenCalledTimes(2);
  });

  it('executeEvalRun - 用例执行失败', async () => {
    const evalRun = {
      id: 'run-1',
      datasetId: 'ds-1',
      endpointId: 'ep-1',
      endpoint: { id: 'ep-1', name: 'test-endpoint' },
    };
    const testCases = [{ id: 'tc-1', input: 'question 1' }];

    prisma.evalRun.findUnique.mockResolvedValue(evalRun);
    prisma.evalRun.update.mockResolvedValue({});
    prisma.testCase.findMany.mockResolvedValue(testCases);
    prisma.testCase.findUnique.mockResolvedValue(testCases[0]);
    prisma.evalResult.create.mockResolvedValue({});

    agentService.invoke.mockResolvedValue({
      success: false,
      output: null,
      error: 'Model timeout',
    });

    const result = await service.executeEvalRun('run-1');

    expect(result.passed).toBe(0);
    expect(result.failed).toBe(1);
  });

  it('executeEvalRun - agent 抛出异常', async () => {
    const evalRun = {
      id: 'run-1',
      datasetId: 'ds-1',
      endpointId: 'ep-1',
      endpoint: { id: 'ep-1', name: 'test-endpoint' },
    };
    const testCases = [{ id: 'tc-1', input: 'question 1' }];

    prisma.evalRun.findUnique.mockResolvedValue(evalRun);
    prisma.evalRun.update.mockResolvedValue({});
    prisma.testCase.findMany.mockResolvedValue(testCases);
    prisma.testCase.findUnique.mockResolvedValue(testCases[0]);
    prisma.evalResult.create.mockResolvedValue({});

    agentService.invoke.mockRejectedValue(new Error('Network error'));

    const result = await service.executeEvalRun('run-1');

    expect(result.passed).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.results[0].error).toBe('Network error');
  });
});
