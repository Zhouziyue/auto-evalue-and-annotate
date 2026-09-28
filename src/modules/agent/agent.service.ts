// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SseParserService } from './sse-parser.service';
import { CreateAgentDto, UpdateAgentDto } from './agent.dto';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sseParser: SseParserService,
  ) {}

  async create(dto: CreateAgentDto) {
    const endpoint = await this.prisma.agentEndpoint.create({
      data: {
        name: dto.name,
        description: dto.description,
        url: dto.url,
        model: dto.model,
        systemPrompt: dto.systemPrompt,
        status: dto.status || 'active',
        authType: dto.authType || 'none',
        authConfig: dto.authConfig ? JSON.stringify(dto.authConfig) : null,
        sseFormat: dto.sseFormat || 'auto',
        sseTemplate: dto.sseTemplate ? JSON.stringify(dto.sseTemplate) : null,
        requestTemplate: dto.requestTemplate ? JSON.stringify(dto.requestTemplate) : null,
        timeout: dto.timeout || 30000,
        maxRetries: dto.maxRetries || 3,
      },
    });

    // 如果提供了 skillIds，自动创建关联
    if (dto.skillIds && dto.skillIds.length > 0) {
      for (const skillId of dto.skillIds) {
        await this.prisma.skillAgent.create({
          data: { skillId, endpointId: endpoint.id, role: 'primary' },
        });
      }
    }

    return endpoint;
  }

  async findAll() {
    return this.prisma.agentEndpoint.findMany({
      include: {
        _count: {
          select: { skillAgents: true, evalRuns: true },
        },
        skillAgents: {
          include: {
            skill: { select: { id: true, name: true, icon: true, category: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const endpoint = await this.prisma.agentEndpoint.findUnique({
      where: { id },
      include: {
        skillAgents: {
          include: {
            skill: { select: { id: true, name: true, icon: true, category: true } },
          },
        },
        _count: {
          select: { skillAgents: true, evalRuns: true },
        },
      },
    });
    if (!endpoint) throw new NotFoundException(`Agent endpoint ${id} not found`);
    return endpoint;
  }

  /**
   * 获取 Agent 关联的技能列表
   */
  async getLinkedSkills(endpointId: string) {
    const links = await this.prisma.skillAgent.findMany({
      where: { endpointId },
      include: {
        skill: { select: { id: true, name: true, icon: true, category: true, description: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return links.map(l => ({ linkId: l.id, role: l.role, config: l.config, skill: l.skill }));
  }

  /**
   * 关联 Agent 到技能
   */
  async linkToSkill(endpointId: string, skillId: string, role = 'primary') {
    return this.prisma.skillAgent.create({
      data: { endpointId, skillId, role },
      include: {
        skill: { select: { id: true, name: true, icon: true, category: true } },
      },
    });
  }

  /**
   * 取消 Agent 与技能的关联
   */
  async unlinkFromSkill(endpointId: string, linkId: string) {
    const link = await this.prisma.skillAgent.findFirst({
      where: { id: linkId, endpointId },
    });
    if (!link) throw new NotFoundException('关联记录不存在');
    return this.prisma.skillAgent.delete({ where: { id: linkId } });
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    // Serialize JSON fields to string for database storage
    if (dto.authConfig !== undefined) {
      data.authConfig = dto.authConfig ? JSON.stringify(dto.authConfig) : null;
    }
    if (dto.sseTemplate !== undefined) {
      data.sseTemplate = dto.sseTemplate ? JSON.stringify(dto.sseTemplate) : null;
    }
    if (dto.requestTemplate !== undefined) {
      data.requestTemplate = dto.requestTemplate ? JSON.stringify(dto.requestTemplate) : null;
    }
    return this.prisma.agentEndpoint.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agentEndpoint.delete({ where: { id } });
  }

  /**
   * 解析 JSON 字符串模板为对象
   */
  private parseTemplate(template: string | Record<string, any> | null): Record<string, any> | null {
    if (!template) return null;
    if (typeof template === 'string') {
      try {
        return JSON.parse(template);
      } catch {
        return null;
      }
    }
    return template;
  }

  /**
   * 探测 SSE 响应格式
   */
  async probeSseFormat(id: string, input: string) {
    const endpoint = await this.findOne(id);
    const requestBody = this.buildRequestBody(this.parseTemplate(endpoint.requestTemplate), input);
    const config = this.buildAxiosConfig(endpoint);

    try {
      const response = await axios({
        ...config,
        responseType: 'stream',
      });

      const format = await this.sseParser.detectFormat(response.data);
      return {
        success: true,
        detectedFormat: format,
        recommendation: this.sseParser.getRecommendation(format),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 测试智能体连接
   */
  async testConnection(id: string, input: string) {
    const endpoint = await this.findOne(id);
    const requestBody = this.buildRequestBody(this.parseTemplate(endpoint.requestTemplate), input);
    const config = this.buildAxiosConfig(endpoint);

    const startTime = Date.now();

    try {
      const response = await axios({
        ...config,
        data: requestBody,
        responseType: 'stream',
      });

      // Check if the response is actually an error (e.g. 422) wrapped in a 200
      const contentType = response.headers?.['content-type'] || '';
      if (response.status >= 400) {
        const errorBody = await this.readStream(response.data);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorBody}`,
          latency: Date.now() - startTime,
        };
      }

      const result = await this.sseParser.parseStream(
        response.data,
        endpoint.sseFormat as string,
        this.parseTemplate(endpoint.sseTemplate),
      );

      return {
        success: true,
        latency: Date.now() - startTime,
        output: result.text,
        rawStream: result.raw,
        format: result.detectedFormat,
      };
    } catch (error: any) {
      let errorDetail = error.message;
      if (error.response?.data) {
        // Read stream error response body
        try {
          errorDetail = await this.readStream(error.response.data);
        } catch {
          // Not a stream, use as-is
          if (typeof error.response.data === 'string') {
            errorDetail = error.response.data;
          }
        }
      }
      console.log('[AgentService] Error detail:', errorDetail);
      return {
        success: false,
        error: errorDetail,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Read a stream or string into a string
   */
  private async readStream(data: any): Promise<string> {
    if (typeof data === 'string') return data;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      data.on('data', (chunk: Buffer) => chunks.push(chunk));
      data.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      data.on('error', reject);
    });
  }

  /**
   * 调用智能体（供执行引擎使用）
   */
  async invoke(endpointId: string, input: string, sessionContext?: any) {
    const endpoint = await this.findOne(endpointId);
    const requestBody = this.buildRequestBody(
      this.parseTemplate(endpoint.requestTemplate),
      input,
      sessionContext,
    );
    const config = this.buildAxiosConfig(endpoint);

    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    try {
      const response = await axios({
        ...config,
        data: requestBody,
        responseType: 'stream',
      });

      const result = await this.sseParser.parseStream(
        response.data,
        endpoint.sseFormat as string,
        this.parseTemplate(endpoint.sseTemplate),
        (chunk: string) => {
          if (!firstTokenTime && chunk.trim()) {
            firstTokenTime = Date.now();
          }
        },
      );

      return {
        success: true,
        output: result.text,
        rawStream: result.raw,
        metrics: {
          totalLatency: Date.now() - startTime,
          ttft: firstTokenTime ? firstTokenTime - startTime : null,
          tokenCount: result.tokenCount,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metrics: {
          totalLatency: Date.now() - startTime,
        },
      };
    }
  }

  private buildRequestBody(
    template: Record<string, any> | null,
    input: string,
    context?: any,
  ): Record<string, any> {
    if (!template) {
      return { message: input };
    }

    const body = JSON.parse(JSON.stringify(template));
    const result = this.replaceVariables(body, {
      input,
      context: context ? JSON.stringify(context) : '',
      timestamp: new Date().toISOString(),
    });
    console.log('[AgentService] Request body:', JSON.stringify(result));
    return result;
  }

  private replaceVariables(obj: any, vars: Record<string, string>): any {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceVariables(item, vars));
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, vars);
      }
      return result;
    }
    return obj;
  }

  private buildAxiosConfig(endpoint: any): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: endpoint.url,
      timeout: endpoint.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 添加认证头
    if (endpoint.authType === 'api_key' && endpoint.authConfig) {
      const authConf = endpoint.authConfig as Record<string, any>;
      config.headers![authConf.headerName || 'Authorization'] =
        `${authConf.prefix || 'Bearer'} ${authConf.key}`;
    } else if (endpoint.authType === 'token' && endpoint.authConfig) {
      const authConf = endpoint.authConfig as Record<string, any>;
      config.headers!['Authorization'] = `Bearer ${authConf.token}`;
    }

    return config;
  }
}
