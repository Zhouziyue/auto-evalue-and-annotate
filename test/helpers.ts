// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/common/prisma/prisma.service';

/**
 * 创建 mock 的 PrismaService
 */
export function mockPrismaService() {
  return {
    skill: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    agent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dataset: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    testCase: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    evalRun: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    evalResult: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    annotation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pipeline: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService())),
  };
}

/**
 * 创建带 Prisma mock 的测试模块
 */
export async function createTestingModule(
  providers: any[],
  controllers: any[] = [],
): Promise<{ module: TestingModule; prisma: ReturnType<typeof mockPrismaService> }> {
  const prisma = mockPrismaService();

  const module = await Test.createTestingModule({
    controllers,
    providers: [
      ...providers,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();

  return { module, prisma };
}

/**
 * 创建 mock 的执行上下文
 */
export function createMockContext() {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: 'Bearer test-token' },
        user: { id: 'test-user-id' },
      }),
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }),
    }),
    getArgs: () => [],
    getArgByIndex: () => ({}),
  };
}
