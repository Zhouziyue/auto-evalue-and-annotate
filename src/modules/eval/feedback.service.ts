// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 反馈类型
export enum FeedbackType {
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
  RATING = 'rating',
  COMMENT = 'comment',
  CORRECTION = 'correction',
}

// 用户反馈
export interface UserFeedback {
  id: string;
  traceId?: string;           // 关联的追踪ID
  sessionId?: string;         // 会话ID
  userId?: string;            // 用户ID
  type: FeedbackType;
  value: number | string;     // 评分值或评论内容
  metadata?: Record<string, any>;
  createdAt: Date;
}

// 提交反馈输入
export interface SubmitFeedbackInput {
  traceId?: string;
  sessionId?: string;
  userId?: string;
  type: FeedbackType;
  value: number | string;
  metadata?: Record<string, any>;
}

// 反馈统计
export interface FeedbackStats {
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
  recentFeedback: UserFeedback[];
  satisfactionRate: number;  // 满意率
}

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  // 提交反馈
  async submitFeedback(input: SubmitFeedbackInput): Promise<UserFeedback> {
    const feedback: UserFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      traceId: input.traceId,
      sessionId: input.sessionId,
      userId: input.userId,
      type: input.type,
      value: input.value,
      metadata: input.metadata || {},
      createdAt: new Date(),
    };

    // 存储到数据库
    await this.prisma.evalRun.create({
      data: {
        id: feedback.id,
        status: 'completed',
        totalCases: 0,
        passedCases: 0,
        failedCases: 0,
        metadata: JSON.stringify(feedback),
      },
    });

    return feedback;
  }

  // 获取反馈列表
  async listFeedback(options?: {
    traceId?: string;
    sessionId?: string;
    userId?: string;
    type?: FeedbackType;
    limit?: number;
  }): Promise<UserFeedback[]> {
    const evalRuns = await this.prisma.evalRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });

    const feedbacks: UserFeedback[] = [];
    for (const run of evalRuns) {
      const metadata = JSON.parse(run.metadata || '{}');
      if (!metadata.type) continue;  // 不是反馈
      
      if (options?.traceId && metadata.traceId !== options.traceId) continue;
      if (options?.sessionId && metadata.sessionId !== options.sessionId) continue;
      if (options?.userId && metadata.userId !== options.userId) continue;
      if (options?.type && metadata.type !== options.type) continue;

      feedbacks.push(metadata as UserFeedback);
    }

    return feedbacks;
  }

  // 获取反馈统计
  async getFeedbackStats(options?: {
    sessionId?: string;
    userId?: string;
  }): Promise<FeedbackStats> {
    const feedbacks = await this.listFeedback({
      sessionId: options?.sessionId,
      userId: options?.userId,
      limit: 1000,
    });

    const thumbsUp = feedbacks.filter(f => f.type === FeedbackType.THUMBS_UP).length;
    const thumbsDown = feedbacks.filter(f => f.type === FeedbackType.THUMBS_DOWN).length;
    
    const ratings = feedbacks
      .filter(f => f.type === FeedbackType.RATING && typeof f.value === 'number')
      .map(f => f.value as number);
    
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    const ratingDistribution: Record<number, number> = {};
    for (const r of ratings) {
      ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
    }

    const totalExplicit = thumbsUp + thumbsDown;
    const satisfactionRate = totalExplicit > 0 ? thumbsUp / totalExplicit : 0;

    return {
      totalFeedback: feedbacks.length,
      thumbsUp,
      thumbsDown,
      avgRating,
      ratingDistribution,
      recentFeedback: feedbacks.slice(0, 10),
      satisfactionRate,
    };
  }

  // 点赞
  async thumbsUp(traceId: string, userId?: string): Promise<UserFeedback> {
    return this.submitFeedback({
      traceId,
      userId,
      type: FeedbackType.THUMBS_UP,
      value: 1,
    });
  }

  // 点踩
  async thumbsDown(traceId: string, userId?: string, reason?: string): Promise<UserFeedback> {
    return this.submitFeedback({
      traceId,
      userId,
      type: FeedbackType.THUMBS_DOWN,
      value: 0,
      metadata: reason ? { reason } : undefined,
    });
  }

  // 评分
  async rate(traceId: string, rating: number, userId?: string): Promise<UserFeedback> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    return this.submitFeedback({
      traceId,
      userId,
      type: FeedbackType.RATING,
      value: rating,
    });
  }

  // 评论
  async comment(traceId: string, comment: string, userId?: string): Promise<UserFeedback> {
    return this.submitFeedback({
      traceId,
      userId,
      type: FeedbackType.COMMENT,
      value: comment,
    });
  }

  // 纠正
  async correction(traceId: string, correctedOutput: string, userId?: string): Promise<UserFeedback> {
    return this.submitFeedback({
      traceId,
      userId,
      type: FeedbackType.CORRECTION,
      value: correctedOutput,
    });
  }
}
