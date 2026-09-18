// @ts-nocheck
import { Controller, Get, Put, Post, Body } from '@nestjs/common';
import { AlertService } from './alert.service';

@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // 获取告警配置
  @Get('config')
  async getConfig() {
    return this.alertService.getConfig();
  }

  // 更新告警配置
  @Put('config')
  async updateConfig(@Body() body: {
    webhookKey?: string;
    passRateThreshold?: number;
    enabled?: boolean;
  }) {
    return this.alertService.updateConfig(body);
  }

  // 测试 Webhook
  @Post('test')
  async testWebhook() {
    return this.alertService.testWebhook();
  }
}
