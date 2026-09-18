// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 告警级别
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

// 告警状态
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SILENCED = 'silenced',
}

// 条件操作符
export enum AlertOperator {
  GT = 'gt',           // 大于
  GTE = 'gte',         // 大于等于
  LT = 'lt',           // 小于
  LTE = 'lte',         // 小于等于
  EQ = 'eq',           // 等于
  NEQ = 'neq',         // 不等于
  CHANGE_GT = 'change_gt', // 变化率大于
  CHANGE_LT = 'change_lt', // 变化率小于
}

// 告警规则
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: AlertCondition[];
  conditionLogic: 'and' | 'or';
  severity: AlertSeverity;
  channels: AlertChannel[];
  cooldown: number; // 冷却时间(ms)
  autoResolve: boolean;
  resolveThreshold?: number;
  lastTriggeredAt?: Date;
  triggerCount: number;
  createdAt: Date;
  createdBy?: string;
}

// 告警条件
export interface AlertCondition {
  id: string;
  metric: string;
  operator: AlertOperator;
  value: number;
  window?: number; // 时间窗口(ms)
  dimension?: string; // 维度过滤
}

// 告警通道
export interface AlertChannel {
  type: 'webhook' | 'email' | 'slack' | 'dingtalk' | 'feishu';
  config: Record<string, any>;
}

// 告警事件
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  details: Record<string, any>;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

@Injectable()
export class AlertRuleService {
  private rules: Map<string, AlertRule> = new Map();
  private events: AlertEvent[] = [];
  private lastCheckTime: Map<string, Date> = new Map();

  constructor() {}

  // 创建告警规则
  async createRule(data: {
    name: string;
    description?: string;
    conditions: Array<{ metric: string; operator: AlertOperator; value: number; window?: number; dimension?: string }>;
    conditionLogic?: 'and' | 'or';
    severity: AlertSeverity;
    channels: AlertChannel[];
    cooldown?: number;
    autoResolve?: boolean;
    resolveThreshold?: number;
    createdBy?: string;
  }): Promise<AlertRule> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const rule: AlertRule = {
      id,
      name: data.name,
      description: data.description,
      enabled: true,
      conditions: data.conditions.map((c, i) => ({ ...c, id: `cond_${i}` })),
      conditionLogic: data.conditionLogic || 'and',
      severity: data.severity,
      channels: data.channels,
      cooldown: data.cooldown || 300000, // 默认5分钟
      autoResolve: data.autoResolve ?? true,
      resolveThreshold: data.resolveThreshold,
      triggerCount: 0,
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    this.rules.set(id, rule);
    return rule;
  }

  // 评估规则（核心入口）
  async evaluateRule(ruleId: string, metrics: Record<string, number>): Promise<AlertEvent | null> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) return null;

    // 检查冷却期
    const lastCheck = this.lastCheckTime.get(ruleId);
    if (lastCheck && Date.now() - lastCheck.getTime() < rule.cooldown) {
      return null;
    }

    // 评估条件
    const conditionResults = rule.conditions.map(c => this.evaluateCondition(c, metrics));
    const triggered = rule.conditionLogic === 'and'
      ? conditionResults.every(r => r.triggered)
      : conditionResults.some(r => r.triggered);

    this.lastCheckTime.set(ruleId, new Date());

    if (!triggered) {
      // 检查是否自动解决
      if (rule.autoResolve) {
        const activeEvents = this.events.filter(e => e.ruleId === ruleId && e.status === AlertStatus.ACTIVE);
        for (const event of activeEvents) {
          event.status = AlertStatus.RESOLVED;
          event.resolvedAt = new Date();
        }
      }
      return null;
    }

    // 触发告警
    rule.triggerCount++;
    rule.lastTriggeredAt = new Date();

    const event: AlertEvent = {
      id: `alert_evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: AlertStatus.ACTIVE,
      message: this.buildAlertMessage(rule, conditionResults),
      details: {
        conditions: conditionResults,
        metrics,
      },
      triggeredAt: new Date(),
    };

    this.events.push(event);

    // 发送通知
    await this.sendNotifications(rule, event);

    return event;
  }

  // 评估单个条件
  private evaluateCondition(
    condition: AlertCondition,
    metrics: Record<string, number>,
  ): { triggered: boolean; metric: string; currentValue: number; threshold: number } {
    const currentValue = metrics[condition.metric] || 0;
    const threshold = condition.value;
    let triggered = false;

    switch (condition.operator) {
      case AlertOperator.GT:
        triggered = currentValue > threshold;
        break;
      case AlertOperator.GTE:
        triggered = currentValue >= threshold;
        break;
      case AlertOperator.LT:
        triggered = currentValue < threshold;
        break;
      case AlertOperator.LTE:
        triggered = currentValue <= threshold;
        break;
      case AlertOperator.EQ:
        triggered = currentValue === threshold;
        break;
      case AlertOperator.NEQ:
        triggered = currentValue !== threshold;
        break;
      case AlertOperator.CHANGE_GT:
        // 简化：与上次值对比
        const lastValue = metrics[`${condition.metric}_prev`] || currentValue;
        const changeRate = lastValue > 0 ? (currentValue - lastValue) / lastValue : 0;
        triggered = changeRate > threshold;
        break;
      case AlertOperator.CHANGE_LT:
        const prev = metrics[`${condition.metric}_prev`] || currentValue;
        const rate = prev > 0 ? (currentValue - prev) / prev : 0;
        triggered = rate < -threshold;
        break;
    }

    return { triggered, metric: condition.metric, currentValue, threshold };
  }

  // 构建告警消息
  private buildAlertMessage(
    rule: AlertRule,
    conditionResults: Array<{ triggered: boolean; metric: string; currentValue: number; threshold: number }>,
  ): string {
    const parts = conditionResults
      .filter(r => r.triggered)
      .map(r => `${r.metric}: ${r.currentValue.toFixed(3)} (阈值: ${r.threshold})`);

    return `[${rule.severity.toUpperCase()}] ${rule.name}: ${parts.join(', ')}`;
  }

  // 发送通知
  private async sendNotifications(rule: AlertRule, event: AlertEvent): Promise<void> {
    for (const channel of rule.channels) {
      try {
        switch (channel.type) {
          case 'webhook':
            await this.sendWebhook(channel.config, event);
            break;
          case 'email':
            // 简化：记录日志
            break;
          case 'slack':
            await this.sendSlack(channel.config, event);
            break;
          case 'dingtalk':
            await this.sendDingtalk(channel.config, event);
            break;
          case 'feishu':
            await this.sendFeishu(channel.config, event);
            break;
        }
      } catch (error) {
        // 通知失败不阻塞
      }
    }
  }

  private async sendWebhook(config: Record<string, any>, event: AlertEvent): Promise<void> {
    // 简化实现
  }

  private async sendSlack(config: Record<string, any>, event: AlertEvent): Promise<void> {
    // 简化实现
  }

  private async sendDingtalk(config: Record<string, any>, event: AlertEvent): Promise<void> {
    // 简化实现
  }

  private async sendFeishu(config: Record<string, any>, event: AlertEvent): Promise<void> {
    // 简化实现
  }

  // 获取规则列表
  async listRules(enabled?: boolean): Promise<AlertRule[]> {
    let rules = Array.from(this.rules.values());
    if (enabled !== undefined) rules = rules.filter(r => r.enabled === enabled);
    return rules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取规则详情
  async getRule(id: string): Promise<AlertRule | undefined> {
    return this.rules.get(id);
  }

  // 更新规则
  async updateRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule | undefined> {
    const rule = this.rules.get(id);
    if (!rule) return undefined;
    Object.assign(rule, updates);
    return rule;
  }

  // 删除规则
  async deleteRule(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  // 启用/禁用规则
  async toggleRule(id: string, enabled: boolean): Promise<void> {
    const rule = this.rules.get(id);
    if (rule) rule.enabled = enabled;
  }

  // 确认告警
  async acknowledgeEvent(eventId: string, userId?: string): Promise<AlertEvent | null> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return null;
    event.status = AlertStatus.ACKNOWLEDGED;
    event.acknowledgedAt = new Date();
    event.acknowledgedBy = userId;
    return event;
  }

  // 解决告警
  async resolveEvent(eventId: string, userId?: string): Promise<AlertEvent | null> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return null;
    event.status = AlertStatus.RESOLVED;
    event.resolvedAt = new Date();
    event.resolvedBy = userId;
    return event;
  }

  // 静默告警
  async silenceEvent(eventId: string, duration?: number): Promise<AlertEvent | null> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return null;
    event.status = AlertStatus.SILENCED;
    return event;
  }

  // 获取告警事件列表
  async listEvents(options?: {
    ruleId?: string;
    severity?: AlertSeverity;
    status?: AlertStatus;
    limit?: number;
  }): Promise<AlertEvent[]> {
    let filtered = [...this.events];
    if (options?.ruleId) filtered = filtered.filter(e => e.ruleId === options.ruleId);
    if (options?.severity) filtered = filtered.filter(e => e.severity === options.severity);
    if (options?.status) filtered = filtered.filter(e => e.status === options.status);
    filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
    if (options?.limit) filtered = filtered.slice(0, options.limit);
    return filtered;
  }

  // 获取告警统计
  getStats(): {
    totalRules: number;
    activeRules: number;
    totalEvents: number;
    activeEvents: number;
    eventsBySeverity: Record<AlertSeverity, number>;
    recentTriggers: AlertEvent[];
  } {
    const allRules = Array.from(this.rules.values());
    const eventsBySeverity: Record<AlertSeverity, number> = {
      [AlertSeverity.INFO]: 0,
      [AlertSeverity.WARNING]: 0,
      [AlertSeverity.CRITICAL]: 0,
      [AlertSeverity.EMERGENCY]: 0,
    };

    for (const event of this.events) {
      eventsBySeverity[event.severity]++;
    }

    return {
      totalRules: allRules.length,
      activeRules: allRules.filter(r => r.enabled).length,
      totalEvents: this.events.length,
      activeEvents: this.events.filter(e => e.status === AlertStatus.ACTIVE).length,
      eventsBySeverity,
      recentTriggers: this.events.slice(-10).reverse(),
    };
  }

  // 内置规则模板
  getBuiltinTemplates(): Array<{
    name: string;
    description: string;
    conditions: any[];
    severity: AlertSeverity;
  }> {
    return [
      {
        name: '准确率下降告警',
        description: '当评测准确率低于阈值时触发',
        conditions: [{ metric: 'accuracy', operator: AlertOperator.LT, value: 0.7 }],
        severity: AlertSeverity.WARNING,
      },
      {
        name: '延迟异常告警',
        description: '当平均延迟超过阈值时触发',
        conditions: [{ metric: 'latency_avg', operator: AlertOperator.GT, value: 5000 }],
        severity: AlertSeverity.CRITICAL,
      },
      {
        name: '成本超支告警',
        description: '当成本超出预算时触发',
        conditions: [{ metric: 'cost_total', operator: AlertOperator.GT, value: 100 }],
        severity: AlertSeverity.WARNING,
      },
      {
        name: '安全评分骤降',
        description: '安全评分大幅下降时触发',
        conditions: [{ metric: 'safety', operator: AlertOperator.CHANGE_LT, value: 0.2 }],
        severity: AlertSeverity.EMERGENCY,
      },
    ];
  }
}
