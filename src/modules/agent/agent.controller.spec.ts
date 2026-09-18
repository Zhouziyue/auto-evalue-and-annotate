// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

describe('AgentController', () => {
  let controller: AgentController;

  const mockAgentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    testConnection: jest.fn(),
    probeSseFormat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        { provide: AgentService, useValue: mockAgentService },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该调用 service.create', async () => {
      const dto = { name: 'Agent', url: 'https://api.com', skillId: 'skill-1' };
      mockAgentService.create.mockResolvedValue({ id: 'agent-1', ...dto });

      const result = await controller.create(dto);

      expect(result.id).toBe('agent-1');
      expect(mockAgentService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('应该返回所有智能体', async () => {
      mockAgentService.findAll.mockResolvedValue([{ id: '1' }]);

      const result = await controller.findAll('skill-1');

      expect(result).toHaveLength(1);
      expect(mockAgentService.findAll).toHaveBeenCalledWith('skill-1');
    });
  });

  describe('findOne', () => {
    it('应该返回指定智能体', async () => {
      mockAgentService.findOne.mockResolvedValue({ id: 'agent-1' });

      const result = await controller.findOne('agent-1');

      expect(result.id).toBe('agent-1');
    });
  });

  describe('testConnection', () => {
    it('应该测试连接并返回结果', async () => {
      const mockResult = { success: true, latency: 150, output: 'test' };
      mockAgentService.testConnection.mockResolvedValue(mockResult);

      const result = await controller.testConnection('agent-1', { input: 'hello' });

      expect(result.success).toBe(true);
      expect(result.latency).toBe(150);
    });
  });

  describe('probeSse', () => {
    it('应该探测 SSE 格式', async () => {
      const mockResult = { success: true, detectedFormat: 'openai' };
      mockAgentService.probeSseFormat.mockResolvedValue(mockResult);

      const result = await controller.probeSse('agent-1', { input: 'test' });

      expect(result.detectedFormat).toBe('openai');
    });
  });
});
