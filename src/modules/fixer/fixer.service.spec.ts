// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { FixerService } from './fixer.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// Mock axios
jest.mock('axios', () => ({
  default: { post: jest.fn() },
  post: jest.fn(),
}));

import axios from 'axios';

describe('FixerService', () => {
  let service: FixerService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      evalResult: {
        findUnique: jest.fn(),
      },
      fixRecord: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FixerService>(FixerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('diagnose', () => {
    it('EvalResult 不存在时抛出异常', async () => {
      prisma.evalResult.findUnique.mockResolvedValue(null);

      await expect(service.diagnose('nonexistent')).rejects.toThrow('EvalResult not found');
    });

    it('无 API Key 时使用模拟诊断', async () => {
      const evalResult = {
        id: 'er-1',
        actualOutput: 'wrong answer',
        errorMessage: 'Low score',
        scores: { accuracy: 0.3 },
        testCase: {
          input: 'What is 2+2?',
          expectedOutput: '4',
        },
      };
      prisma.evalResult.findUnique.mockResolvedValue(evalResult);

      const fixRecord = { id: 'fix-1', diagnosis: 'AI 诊断（模拟）', fixType: 'prompt' };
      prisma.fixRecord.create.mockResolvedValue(fixRecord);

      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const result = await service.diagnose('er-1');

      expect(result).toEqual(fixRecord);
      expect(prisma.fixRecord.create).toHaveBeenCalled();

      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    });

    it('有 API Key 时调用 OpenAI', async () => {
      const evalResult = {
        id: 'er-1',
        actualOutput: 'wrong answer',
        errorMessage: null,
        scores: { accuracy: 0.3 },
        testCase: {
          input: 'What is 2+2?',
          expectedOutput: '4',
        },
      };
      prisma.evalResult.findUnique.mockResolvedValue(evalResult);

      const aiResponse = {
        data: {
          choices: [{
            message: {
              content: '{"diagnosis":"计算错误","suggestion":"改进数学推理","fixType":"prompt","fixContent":{}}',
            },
          }],
        },
      };
      (axios.post as jest.Mock).mockResolvedValue(aiResponse);

      const fixRecord = { id: 'fix-1', diagnosis: '计算错误', fixType: 'prompt' };
      prisma.fixRecord.create.mockResolvedValue(fixRecord);

      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'test-key';

      const result = await service.diagnose('er-1');

      expect(result).toEqual(fixRecord);
      expect(axios.post).toHaveBeenCalled();

      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('API 调用失败时降级处理', async () => {
      const evalResult = {
        id: 'er-1',
        actualOutput: 'wrong',
        errorMessage: null,
        scores: {},
        testCase: { input: 'q', expectedOutput: 'a' },
      };
      prisma.evalResult.findUnique.mockResolvedValue(evalResult);
      (axios.post as jest.Mock).mockRejectedValue(new Error('API Error'));

      const fixRecord = { id: 'fix-1', diagnosis: '诊断失败', suggestion: '请人工检查' };
      prisma.fixRecord.create.mockResolvedValue(fixRecord);

      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'test-key';

      const result = await service.diagnose('er-1');

      expect(result.diagnosis).toBe('诊断失败');

      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });
  });

  describe('applyFix', () => {
    it('FixRecord 不存在时抛出异常', async () => {
      prisma.fixRecord.findUnique.mockResolvedValue(null);

      await expect(service.applyFix('nonexistent')).rejects.toThrow('FixRecord not found');
    });

    it('应用修复', async () => {
      const record = { id: 'fix-1', appliedAt: new Date() };
      prisma.fixRecord.findUnique.mockResolvedValue({ id: 'fix-1' });
      prisma.fixRecord.update.mockResolvedValue(record);

      const result = await service.applyFix('fix-1');

      expect(result).toEqual(record);
      expect(prisma.fixRecord.update).toHaveBeenCalled();
    });
  });

  describe('verifyFix', () => {
    it('FixRecord 不存在时抛出异常', async () => {
      prisma.fixRecord.findUnique.mockResolvedValue(null);

      await expect(service.verifyFix('nonexistent', 'er-1')).rejects.toThrow('FixRecord not found');
    });

    it('新 EvalResult 不存在时抛出异常', async () => {
      prisma.fixRecord.findUnique.mockResolvedValue({ id: 'fix-1' });
      prisma.evalResult.findUnique.mockResolvedValue(null);

      await expect(service.verifyFix('fix-1', 'nonexistent')).rejects.toThrow('New EvalResult not found');
    });

    it('验证修复效果 - 有改进', async () => {
      const record = { id: 'fix-1', scores: { accuracy: 0.5 } };
      const newResult = { id: 'er-2', scores: { accuracy: 0.8 } };

      prisma.fixRecord.findUnique.mockResolvedValue(record);
      prisma.evalResult.findUnique.mockResolvedValue(newResult);
      prisma.fixRecord.update.mockResolvedValue({ ...record, verified: true });

      const result = await service.verifyFix('fix-1', 'er-2');

      expect(result.verified).toBe(true);
    });
  });
});
