// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // 获取告警配置
  async getConfig() {
    return this.prisma.alertConfig.findFirst();
  }

  // 更新告警配置
  async updateConfig(data: {
    webhookKey?: string;
    passRateThreshold?: number;
    enabled?: boolean;
  }) {
    const existing = await this.prisma.alertConfig.findFirst();
    if (existing) {
      return this.prisma.alertConfig.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.alertConfig.create({
      data: {
        webhookKey: data.webhookKey || '',
        passRateThreshold: data.passRateThreshold ?? 80.0,
        enabled: data.enabled ?? true,
      },
    });
  }

  // 测试 Webhook 连通性
  async testWebhook() {
    const config = await this.getConfig();
    if (!config?.webhookKey) {
      return { success: false, message: '未配置 Webhook Key' };
    }
    try {
      await this.sendWechatMessage('测试消息：企业微信告警连通性测试 ✅');
      return { success: true, message: '发送成功' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // 评测完成告警检查
  async checkAndAlert(params: {
    pipelineName: string;
    passRate: number;
    totalCases: number;
    failedCases: number;
    duration?: number;
  }) {
    const config = await this.getConfig();
    if (!config || !config.enabled) return;

    if (params.passRate >= config.passRateThreshold) return;

    const markdown = [
      `## ⚠️ 评测通过率告警`,
      `> **${params.pipelineName}** 通过率低于阈值`,
      `- 通过率: <font color="warning">${(params.passRate * 100).toFixed(1)}%</font>`,
      `- 阈值: ${config.passRateThreshold}%`,
      `- 总用例: ${params.totalCases}`,
      `- 失败: ${params.failedCases}`,
      params.duration ? `- 耗时: ${(params.duration / 1000).toFixed(1)}s` : '',
      `- 时间: ${new Date().toLocaleString('zh-CN')}`,
    ].filter(Boolean).join('\n');

    try {
      await this.sendWechatMarkdown(markdown);
      this.logger.log(`告警已发送: ${params.pipelineName} 通过率 ${(params.passRate * 100).toFixed(1)}%`);
    } catch (e) {
      this.logger.error(`告警发送失败: ${e.message}`);
    }
  }

  // 发送企业微信文本消息
  private async sendWechatMessage(content: string) {
    const config = await this.getConfig();
    if (!config?.webhookKey) throw new Error('Webhook Key not configured');

    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${config.webhookKey}`;
    await axios.post(url, {
      msgtype: 'text',
      text: { content },
    });
  }

  // 发送企业微信 Markdown 消息
  private async sendWechatMarkdown(markdown: string) {
    const config = await this.getConfig();
    if (!config?.webhookKey) throw new Error('Webhook Key not configured');

    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${config.webhookKey}`;
    await axios.post(url, {
      msgtype: 'markdown',
      markdown: { content },
    });
  }
}
