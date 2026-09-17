// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 追踪数据结构
export interface Trace {
  id: string;
  name: string;
  sessionId?: string;           // 会话ID，用于关联多轮对话
  userId?: string;              // 用户ID
  tags?: string[];
  metadata?: Record<string, any>;
  input?: any;
  output?: any;
  startTime: Date;
  endTime?: Date;
  spans: Span[];                // 子span
}

export interface Span {
  id: string;
  traceId: string;
  parentId?: string;            // 父span ID，支持嵌套
  name: string;
  type: SpanType;
  startTime: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  level: SpanLevel;
  statusMessage?: string;
}

export enum SpanType {
  LLM = 'llm',                  // LLM 调用
  RETRIEVER = 'retriever',      // 检索
  TOOL = 'tool',                // 工具调用
  AGENT = 'agent',              // Agent 步骤
  CHAIN = 'chain',              // 链式调用
  EVALUATION = 'evaluation',    // 评测
  OTHER = 'other',
}

export enum SpanLevel {
  DEBUG = 'DEBUG',
  DEFAULT = 'DEFAULT',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

@Injectable()
export class TraceService {
  constructor(private prisma: PrismaService) {}

  // 创建追踪记录
  async createTrace(data: {
    name: string;
    sessionId?: string;
    userId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    input?: any;
  }): Promise<Trace> {
    const trace: Trace = {
      id: `trace_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: data.name,
      sessionId: data.sessionId,
      userId: data.userId,
      tags: data.tags || [],
      metadata: data.metadata || {},
      input: data.input,
      startTime: new Date(),
      spans: [],
    };

    // 存储到数据库（简化版，实际可以用专门的表）
    await this.prisma.evalRun.create({
      data: {
        id: trace.id,
        status: 'running',
        totalCases: 0,
        passedCases: 0,
        failedCases: 0,
        metadata: JSON.stringify({
          type: 'trace',
          name: trace.name,
          sessionId: trace.sessionId,
          userId: trace.userId,
          tags: trace.tags,
          metadata: trace.metadata,
          input: trace.input,
          startTime: trace.startTime,
        }),
      },
    });

    return trace;
  }

  // 添加 Span 到追踪
  async addSpan(traceId: string, span: Omit<Span, 'id' | 'traceId'>): Promise<Span> {
    const fullSpan: Span = {
      ...span,
      id: `span_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      traceId,
    };

    // 更新追踪记录
    const evalRun = await this.prisma.evalRun.findUnique({ where: { id: traceId } });
    if (evalRun) {
      const metadata = JSON.parse(evalRun.metadata || '{}');
      if (!metadata.spans) metadata.spans = [];
      metadata.spans.push(fullSpan);
      
      await this.prisma.evalRun.update({
        where: { id: traceId },
        data: { metadata: JSON.stringify(metadata) },
      });
    }

    return fullSpan;
  }

  // 完成 Span
  async completeSpan(traceId: string, spanId: string, output: any, usage?: Span['usage']): Promise<void> {
    const evalRun = await this.prisma.evalRun.findUnique({ where: { id: traceId } });
    if (evalRun) {
      const metadata = JSON.parse(evalRun.metadata || '{}');
      if (metadata.spans) {
        const span = metadata.spans.find((s: Span) => s.id === spanId);
        if (span) {
          span.endTime = new Date();
          span.output = output;
          if (usage) span.usage = usage;
        }
      }
      
      await this.prisma.evalRun.update({
        where: { id: traceId },
        data: { metadata: JSON.stringify(metadata) },
      });
    }
  }

  // 完成追踪
  async completeTrace(traceId: string, output: any): Promise<Trace> {
    const evalRun = await this.prisma.evalRun.findUnique({ where: { id: traceId } });
    if (evalRun) {
      const metadata = JSON.parse(evalRun.metadata || '{}');
      
      await this.prisma.evalRun.update({
        where: { id: traceId },
        data: {
          status: 'completed',
          endTime: new Date(),
          metadata: JSON.stringify({ ...metadata, output }),
        },
      });

      return {
        id: traceId,
        name: metadata.name,
        sessionId: metadata.sessionId,
        userId: metadata.userId,
        tags: metadata.tags,
        metadata: metadata.metadata,
        input: metadata.input,
        output,
        startTime: metadata.startTime,
        endTime: new Date(),
        spans: metadata.spans || [],
      };
    }
    throw new Error('Trace not found');
  }

  // 获取追踪详情
  async getTrace(traceId: string): Promise<Trace | null> {
    const evalRun = await this.prisma.evalRun.findUnique({ where: { id: traceId } });
    if (!evalRun) return null;

    const metadata = JSON.parse(evalRun.metadata || '{}');
    if (metadata.type !== 'trace') return null;

    return {
      id: traceId,
      name: metadata.name,
      sessionId: metadata.sessionId,
      userId: metadata.userId,
      tags: metadata.tags,
      metadata: metadata.metadata,
      input: metadata.input,
      output: metadata.output,
      startTime: metadata.startTime,
      endTime: evalRun.endTime,
      spans: metadata.spans || [],
    };
  }

  // 获取追踪列表
  async listTraces(options: {
    sessionId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Trace[]> {
    const where: any = {};
    
    if (options.sessionId || options.userId) {
      where.metadata = { contains: '"type":"trace"' };
    }

    const evalRuns = await this.prisma.evalRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    const traces: Trace[] = [];
    for (const run of evalRuns) {
      const metadata = JSON.parse(run.metadata || '{}');
      if (metadata.type !== 'trace') continue;
      
      if (options.sessionId && metadata.sessionId !== options.sessionId) continue;
      if (options.userId && metadata.userId !== options.userId) continue;

      traces.push({
        id: run.id,
        name: metadata.name,
        sessionId: metadata.sessionId,
        userId: metadata.userId,
        tags: metadata.tags,
        metadata: metadata.metadata,
        input: metadata.input,
        output: metadata.output,
        startTime: metadata.startTime,
        endTime: run.endTime,
        spans: metadata.spans || [],
      });
    }

    return traces;
  }

  // 获取 Session 统计
  async getSessionStats(sessionId: string): Promise<{
    totalTraces: number;
    totalSpans: number;
    totalTokens: number;
    avgLatency: number;
  }> {
    const traces = await this.listTraces({ sessionId, limit: 1000 });
    
    let totalSpans = 0;
    let totalTokens = 0;
    let totalLatency = 0;

    for (const trace of traces) {
      totalSpans += trace.spans.length;
      for (const span of trace.spans) {
        if (span.usage) {
          totalTokens += span.usage.totalTokens;
        }
        if (span.endTime && span.startTime) {
          totalLatency += new Date(span.endTime).getTime() - new Date(span.startTime).getTime();
        }
      }
    }

    return {
      totalTraces: traces.length,
      totalSpans,
      totalTokens,
      avgLatency: totalSpans > 0 ? totalLatency / totalSpans : 0,
    };
  }
}
