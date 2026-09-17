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
    return this.prisma.agentEndpoint.create({
      data: {
        skillId: dto.skillId,
        name: dto.name,
        url: dto.url,
        authType: dto.authType || 'none',
        authConfig: dto.authConfig,
        sseFormat: dto.sseFormat || 'auto',
        sseTemplate: dto.sseTemplate,
        requestTemplate: dto.requestTemplate,
        timeout: dto.timeout || 30000,
        maxRetries: dto.maxRetries || 3,
      },
    });
  }

  async findAll(skillId?: string) {
    const where = skillId ? { skillId } : {};
    return this.prisma.agentEndpoint.findMany({ where });
  }

  async findOne(id: string) {
    const endpoint = await this.prisma.agentEndpoint.findUnique({ where: { id } });
    if (!endpoint) throw new NotFoundException(`Agent endpoint ${id} not found`);
    return endpoint;
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    return this.prisma.agentEndpoint.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agentEndpoint.delete({ where: { id } });
  }

  /**
   * 探测 SSE 响应格式
   */
  async probeSseFormat(id: string, input: string) {
    const endpoint = await this.findOne(id);
    const requestBody = this.buildRequestBody(endpoint.requestTemplate as Record<string, any>, input);
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
    const requestBody = this.buildRequestBody(endpoint.requestTemplate as Record<string, any>, input);
    const config = this.buildAxiosConfig(endpoint);

    const startTime = Date.now();

    try {
      const response = await axios({
        ...config,
        responseType: 'stream',
      });

      const result = await this.sseParser.parseStream(
        response.data,
        endpoint.sseFormat as string,
        endpoint.sseTemplate as Record<string, any>,
      );

      return {
        success: true,
        latency: Date.now() - startTime,
        output: result.text,
        rawStream: result.raw,
        format: result.detectedFormat,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * 调用智能体（供执行引擎使用）
   */
  async invoke(endpointId: string, input: string, sessionContext?: any) {
    const endpoint = await this.findOne(endpointId);
    const requestBody = this.buildRequestBody(
      endpoint.requestTemplate as Record<string, any>,
      input,
      sessionContext,
    );
    const config = this.buildAxiosConfig(endpoint);

    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    try {
      const response = await axios({
        ...config,
        responseType: 'stream',
      });

      const result = await this.sseParser.parseStream(
        response.data,
        endpoint.sseFormat as string,
        endpoint.sseTemplate as Record<string, any>,
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
    return this.replaceVariables(body, {
      input,
      context: context ? JSON.stringify(context) : '',
      timestamp: new Date().toISOString(),
    });
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
        Accept: 'text/event-stream',
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
