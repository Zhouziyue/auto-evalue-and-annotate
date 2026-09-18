// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { RegressionService } from './regression.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('RegressionService', () => {
  let service: RegressionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      evalRun: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      skillVersion: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegressionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RegressionService>(RegressionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compareVersions', () => {
    it('EvalRun 不存在时抛出异常', async () => {
      prisma.evalRun.findUnique.mockResolvedValue(null);

      await expect(service.compareVersions('run-1', 'run-2')).rejects.toThrow('EvalRun not found');
    });

    it('对比两个版本 - 检测回归和改进', async () => {
      const run1 = {
        id: 'run-1',
        totalCases: 3,
        passedCases: 2,
        skill: { version: '1.0' },
        results: [
          { testCaseId: 'tc-1', status: 'passed', actualOutput: 'a1', scores: { accuracy: 0.9 }, testCase: { input: 'q1' } },
          { testCaseId: 'tc-2', status: 'passed', actualOutput: 'a2', scores: { accuracy: 0.8 }, testCase: { input: 'q2' } },
          { testCaseId: 'tc-3', status: 'failed', actualOutput: 'a3', scores: { accuracy: 0.3 }, testCase: { input: 'q3' } },
        ],
      };
      const run2 = {
        id: 'run-2',
        totalCases: 3,
        passedCases: 2,
        skill: { version: '2.0' },
        results: [
          { testCaseId: 'tc-1', status: 'failed', actualOutput: 'wrong', scores: { accuracy: 0.4 }, testCase: { input: 'q1' } },
          { testCaseId: 'tc-2', status: 'passed', actualOutput: 'a2', scores: { accuracy: 0.85 }, testCase: { input: 'q2' } },
          { testCaseId: 'tc-3', status: 'passed', actualOutput: 'correct', scores: { accuracy: 0.9 }, testCase: { input: 'q3' } },
        ],
      };

      prisma.evalRun.findUnique
        .mockResolvedValueOnce(run1)
        .mockResolvedValueOnce(run2);

      const result = await service.compareVersions('run-1', 'run-2');

      expect(result.run1.id).toBe('run-1');
      expect(result.run2.id).toBe('run-2');
      expect(result.totalCases).toBe(3);
      expect(result.regressions).toBe(1); // tc-1: passed -> failed
      expect(result.improvements).toBe(1); // tc-3: failed -> passed
      expect(result.comparisons).toHaveLength(3);
    });

    it('对比两个版本 - 无回归无改进', async () => {
      const run1 = {
        id: 'run-1',
        totalCases: 2,
        passedCases: 2,
        skill: { version: '1.0' },
        results: [
          { testCaseId: 'tc-1', status: 'passed', actualOutput: 'a1', scores: {}, testCase: { input: 'q1' } },
          { testCaseId: 'tc-2', status: 'passed', actualOutput: 'a2', scores: {}, testCase: { input: 'q2' } },
        ],
      };
      const run2 = {
        id: 'run-2',
        totalCases: 2,
        passedCases: 2,
        skill: { version: '2.0' },
        results: [
          { testCaseId: 'tc-1', status: 'passed', actualOutput: 'a1', scores: {}, testCase: { input: 'q1' } },
          { testCaseId: 'tc-2', status: 'passed', actualOutput: 'a2', scores: {}, testCase: { input: 'q2' } },
        ],
      };

      prisma.evalRun.findUnique
        .mockResolvedValueOnce(run1)
        .mockResolvedValueOnce(run2);

      const result = await service.compareVersions('run-1', 'run-2');

      expect(result.regressions).toBe(0);
      expect(result.improvements).toBe(0);
    });
  });

  describe('createVersionSnapshot', () => {
    it('创建版本快照 - 有已完成的评测', async () => {
      const evalRuns = [{
        id: 'run-1',
        totalCases: 10,
        passedCases: 8,
        results: [],
      }];
      prisma.evalRun.findMany.mockResolvedValue(evalRuns);

      const snapshot = { id: 'sv-1', skillId: 's-1', version: '1.0' };
      prisma.skillVersion.create.mockResolvedValue(snapshot);

      const result = await service.createVersionSnapshot('s-1', '1.0');

      expect(result).toEqual(snapshot);
      expect(prisma.skillVersion.create).toHaveBeenCalledWith({
        data: {
          skillId: 's-1',
          version: '1.0',
          snapshot: { passRate: 0.8, totalCases: 10 },
        },
      });
    });

    it('创建版本快照 - 无已完成的评测', async () => {
      prisma.evalRun.findMany.mockResolvedValue([]);

      const snapshot = { id: 'sv-1', skillId: 's-1', version: '1.0' };
      prisma.skillVersion.create.mockResolvedValue(snapshot);

      const result = await service.createVersionSnapshot('s-1', '1.0');

      expect(result).toEqual(snapshot);
      expect(prisma.skillVersion.create).toHaveBeenCalledWith({
        data: {
          skillId: 's-1',
          version: '1.0',
          snapshot: {},
        },
      });
    });
  });
});
