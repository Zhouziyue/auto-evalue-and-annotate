// @ts-nocheck
import { Injectable } from '@nestjs/common';
import axios from 'axios';

// Webhook 事件类型
export enum WebhookEvent {
  EVAL_COMPLETED = 'eval_completed',
  EVAL_FAILED = 'eval_failed',
  REGRESSION_DETECTED = 'regression_detected',
  QUALITY_GATE_PASSED = 'quality_gate_passed',
  QUALITY_GATE_FAILED = 'quality_gate_failed',
  BENCHMARK_COMPLETED = 'benchmark_completed',
  BUDGET_ALERT = 'budget_alert',
  PIPELINE_COMPLETED = 'pipeline_completed',
}

// Webhook 配置
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  retryCount: number;
  timeout: number;
  createdAt: Date;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
}

// Webhook 投递记录
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed';
  responseCode?: number;
  responseBody?: string;
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class WebhookService {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveries: WebhookDelivery[] = [];

  constructor() {}

  // 创建 Webhook
  async createWebhook(config: {
    name: string;
    url: string;
    events: WebhookEvent[];
    secret?: string;
    headers?: Record<string, string>;
    retryCount?: number;
    timeout?: number;
  }): Promise<WebhookConfig> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const webhook: WebhookConfig = {
      id,
      name: config.name,
      url: config.url,
      events: config.events,
      secret: config.secret,
      headers: config.headers,
      enabled: true,
      retryCount: config.retryCount || 3,
      timeout: config.timeout || 10000,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0,
    };

    this.webhooks.set(id, webhook);
    return webhook;
  }

  // 触发事件
  async triggerEvent(event: WebhookEvent, payload: Record<string, any>): Promise<WebhookDelivery[]> {
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      w => w.enabled && w.events.includes(event),
    );

    const deliveries: WebhookDelivery[] = [];

    for (const webhook of matchingWebhooks) {
      const delivery = await this.deliver(webhook, event, payload);
      deliveries.push(delivery);
    }

    return deliveries;
  }

  // 投递 Webhook
  private async deliver(
    webhook: WebhookConfig,
    event: WebhookEvent,
    payload: Record<string, any>,
  ): Promise<WebhookDelivery> {
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      event,
      payload: {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      },
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    // 尝试投递
    for (let attempt = 0; attempt <= webhook.retryCount; attempt++) {
      delivery.attempts = attempt + 1;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Delivery': deliveryId,
          ...webhook.headers,
        };

        if (webhook.secret) {
          headers['X-Webhook-Signature'] = this.generateSignature(
            JSON.stringify(delivery.payload),
            webhook.secret,
          );
        }

        const response = await axios.post(webhook.url, delivery.payload, {
          headers,
          timeout: webhook.timeout,
        });

        delivery.status = 'delivered';
        delivery.responseCode = response.status;
        delivery.responseBody = JSON.stringify(response.data).substring(0, 1000);

        webhook.successCount++;
        webhook.lastTriggeredAt = new Date();
        break;
      } catch (error) {
        delivery.responseCode = error.response?.status;
        delivery.responseBody = error.message;

        if (attempt === webhook.retryCount) {
          delivery.status = 'failed';
          webhook.failureCount++;
          webhook.lastTriggeredAt = new Date();
        }
      }
    }

    this.deliveries.push(delivery);
    return delivery;
  }

  // 获取 Webhook 列表
  async listWebhooks(): Promise<WebhookConfig[]> {
    return Array.from(this.webhooks.values());
  }

  // 获取 Webhook 详情
  async getWebhook(id: string): Promise<WebhookConfig | undefined> {
    return this.webhooks.get(id);
  }

  // 更新 Webhook
  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | undefined> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return undefined;
    Object.assign(webhook, updates);
    return webhook;
  }

  // 删除 Webhook
  async deleteWebhook(id: string): Promise<boolean> {
    return this.webhooks.delete(id);
  }

  // 启用/禁用
  async toggleWebhook(id: string, enabled: boolean): Promise<void> {
    const webhook = this.webhooks.get(id);
    if (webhook) webhook.enabled = enabled;
  }

  // 获取投递记录
  async getDeliveries(options?: {
    webhookId?: string;
    event?: WebhookEvent;
    status?: string;
    limit?: number;
  }): Promise<WebhookDelivery[]> {
    let filtered = [...this.deliveries];

    if (options?.webhookId) filtered = filtered.filter(d => d.webhookId === options.webhookId);
    if (options?.event) filtered = filtered.filter(d => d.event === options.event);
    if (options?.status) filtered = filtered.filter(d => d.status === options.status);

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (options?.limit) filtered = filtered.slice(0, options.limit);

    return filtered;
  }

  // 重新投递
  async redeliver(deliveryId: string): Promise<WebhookDelivery | null> {
    const original = this.deliveries.find(d => d.id === deliveryId);
    if (!original) return null;

    const webhook = this.webhooks.get(original.webhookId);
    if (!webhook) return null;

    return this.deliver(webhook, original.event, original.payload.data);
  }

  // 获取支持的事件类型
  getEventTypes(): Array<{ id: WebhookEvent; name: string; description: string }> {
    return [
      { id: WebhookEvent.EVAL_COMPLETED, name: '评测完成', description: '评测运行完成时触发' },
      { id: WebhookEvent.EVAL_FAILED, name: '评测失败', description: '评测运行失败时触发' },
      { id: WebhookEvent.REGRESSION_DETECTED, name: '回归检测', description: '检测到性能回归时触发' },
      { id: WebhookEvent.QUALITY_GATE_PASSED, name: '质量门禁通过', description: '质量门禁检查通过时触发' },
      { id: WebhookEvent.QUALITY_GATE_FAILED, name: '质量门禁失败', description: '质量门禁检查失败时触发' },
      { id: WebhookEvent.BENCHMARK_COMPLETED, name: '基准测试完成', description: '基准测试完成时触发' },
      { id: WebhookEvent.BUDGET_ALERT, name: '预算告警', description: '成本超出预算时触发' },
      { id: WebhookEvent.PIPELINE_COMPLETED, name: '流水线完成', description: '评测流水线完成时触发' },
    ];
  }

  // 生成签名
  private generateSignature(payload: string, secret: string): string {
    let hash = 0;
    const combined = payload + secret;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sha256=${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }
}
