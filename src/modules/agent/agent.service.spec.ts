// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AgentService } from './agent.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SseParserService } from './sse-parser.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('AgentService', () => {
  let service: AgentService;
  let prisma: any;
  let sseParser: any;

  const mockPrisma = {
    agentEndpoint: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockSseParser = {
    detectFormat: jest.fn(),
    getRecommendation: jest.fn(),
    parseStream: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseParserService, useValue: mockSseParser },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    prisma = module.get<PrismaService>(PrismaService);
    sseParser = module.get<SseParserService>(SseParserService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建智能体端点', async () => {
      const dto = {
        skillId: 'skill-1',
        name: '测试Agent',
        url: 'https://api.example.com/sse',
        authType: 'none',
        sseFormat: 'auto',
      };
      const expectedResult = { id: 'agent-id', ...dto, createdAt: new Date() };

      mockPrisma.agentEndpoint.create.mockResolvedValue(expectedResult);

      const result = await service.create(dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrisma.agentEndpoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          skillId: dto.skillId,
          name: dto.name,
          url: dto.url,
          authType: 'none',
          sseFormat: 'auto',
          timeout: 30000,
          maxRetries: 3,
        }),
      });
    });

    it('应该使用默认值填充可选字段', async () => {
      const dto = {
        skillId: 'skill-1',
        name: '测试Agent',
        url: 'https://api.example.com/sse',
      };

      mockPrisma.agentEndpoint.create.mockResolvedValue({ id: 'agent-id', ...dto });

      await service.create(dto);

      expect(mockPrisma.agentEndpoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          authType: 'none',
          sseFormat: 'auto',
          timeout: 30000,
          maxRetries: 3,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('应该返回所有智能体端点', async () => {
      const mockEndpoints = [
        { id: '1', name: 'Agent1', url: 'https://api1.com' },
        { id: '2', name: 'Agent2', url: 'https://api2.com' },
      ];

      mockPrisma.agentEndpoint.findMany.mockResolvedValue(mockEndpoints);

      const result = await service.findAll();

      expect(result).toEqual(mockEndpoints);
      expect(mockPrisma.agentEndpoint.findMany).toHaveBeenCalledWith({ where: {} });
    });

    it('应该支持按 skillId 筛选', async () => {
      mockPrisma.agentEndpoint.findMany.mockResolvedValue([]);

      await service.findAll('skill-1');

      expect(mockPrisma.agentEndpoint.findMany).toHaveBeenCalledWith({
        where: { skillId: 'skill-1' },
      });
    });
  });

  describe('findOne', () => {
    it('应该返回指定 ID 的智能体端点', async () => {
      const mockEndpoint = { id: 'agent-id', name: '测试Agent' };
      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(mockEndpoint);

      const result = await service.findOne('agent-id');

      expect(result).toEqual(mockEndpoint);
    });

    it('应该在端点不存在时抛出 NotFoundException', async () => {
      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('应该成功更新智能体端点', async () => {
      const dto = { name: '更新后的名称' };
      const mockUpdated = { id: 'agent-id', ...dto };

      mockPrisma.agentEndpoint.findUnique.mockResolvedValue({ id: 'agent-id' });
      mockPrisma.agentEndpoint.update.mockResolvedValue(mockUpdated);

      const result = await service.update('agent-id', dto);

      expect(result).toEqual(mockUpdated);
    });

    it('应该在端点不存在时抛出 NotFoundException', async () => {
      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('应该成功删除智能体端点', async () => {
      const mockDeleted = { id: 'agent-id', name: '测试Agent' };

      mockPrisma.agentEndpoint.findUnique.mockResolvedValue({ id: 'agent-id' });
      mockPrisma.agentEndpoint.delete.mockResolvedValue(mockDeleted);

      const result = await service.remove('agent-id');

      expect(result).toEqual(mockDeleted);
    });

    it('应该在端点不存在时抛出 NotFoundException', async () => {
      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('testConnection', () => {
    it('应该在连接成功时返回延迟和输出', async () => {
      const mockEndpoint = {
        id: 'agent-id',
        url: 'https://api.example.com/sse',
        authType: 'none',
        sseFormat: 'auto',
        timeout: 30000,
      };

      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(mockEndpoint);
      
      const mockStream = { pipe: jest.fn() };
      mockedAxios.mockResolvedValue({ data: mockStream });
      
      mockSseParser.parseStream.mockResolvedValue({
        text: '测试输出',
        raw: [],
        detectedFormat: 'content',
        tokenCount: 10,
      });

      const result = await service.testConnection('agent-id', '测试输入');

      expect(result.success).toBe(true);
      expect(result.output).toBe('测试输出');
      expect(result.latency).toBeDefined();
    });

    it('应该在连接失败时返回错误信息', async () => {
      const mockEndpoint = {
        id: 'agent-id',
        url: 'https://api.example.com/sse',
        authType: 'none',
        sseFormat: 'auto',
        timeout: 30000,
      };

      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(mockEndpoint);
      mockedAxios.mockRejectedValue(new Error('Connection refused'));

      const result = await service.testConnection('agent-id', '测试输入');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('probeSseFormat', () => {
    it('应该探测 SSE 格式并返回推荐', async () => {
      const mockEndpoint = {
        id: 'agent-id',
        url: 'https://api.example.com/sse',
        authType: 'none',
        timeout: 30000,
      };

      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(mockEndpoint);
      
      const mockStream = { pipe: jest.fn() };
      mockedAxios.mockResolvedValue({ data: mockStream });
      
      mockSseParser.detectFormat.mockResolvedValue('openai');
      mockSseParser.getRecommendation.mockReturnValue('推荐使用 OpenAI 格式');

      const result = await service.probeSseFormat('agent-id', '测试');

      expect(result.success).toBe(true);
      expect(result.detectedFormat).toBe('openai');
      expect(result.recommendation).toBe('推荐使用 OpenAI 格式');
    });

    it('应该在探测失败时返回错误信息', async () => {
      const mockEndpoint = {
        id: 'agent-id',
        url: 'https://api.example.com/sse',
        authType: 'none',
        timeout: 30000,
      };

      mockPrisma.agentEndpoint.findUnique.mockResolvedValue(mockEndpoint);
      mockedAxios.mockRejectedValue(new Error('Timeout'));

      const result = await service.probeSseFormat('agent-id', '测试');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout');
    });
  });
});
