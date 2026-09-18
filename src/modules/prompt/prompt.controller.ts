// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PromptVersionService, CreatePromptInput, UpdatePromptInput, PromptVersionStatus } from './prompt-version.service';

@Controller('prompts')
export class PromptController {
  constructor(private promptVersionService: PromptVersionService) {}

  // 获取 Prompt 列表
  @Get()
  async listPrompts(
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.promptVersionService.listPrompts({
      category,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  // 获取 Prompt 详情
  @Get(':id')
  async getPrompt(@Param('id') id: string) {
    return this.promptVersionService.getPrompt(id);
  }

  // 创建 Prompt
  @Post()
  async createPrompt(@Body() input: CreatePromptInput) {
    return this.promptVersionService.createPrompt(input);
  }

  // 创建新版本
  @Post(':id/versions')
  async createVersion(@Param('id') id: string, @Body() input: UpdatePromptInput) {
    return this.promptVersionService.createVersion(id, input);
  }

  // 获取版本列表
  @Get(':id/versions')
  async getVersions(@Param('id') id: string) {
    return this.promptVersionService.getVersions(id);
  }

  // 更新版本状态
  @Put(':promptId/versions/:versionId/status')
  async updateVersionStatus(
    @Param('promptId') promptId: string,
    @Param('versionId') versionId: string,
    @Body() body: { status: PromptVersionStatus },
  ) {
    return this.promptVersionService.updateVersionStatus(promptId, versionId, body.status);
  }

  // 对比版本
  @Get(':id/versions/diff')
  async diffVersions(@Query('v1') v1: string, @Query('v2') v2: string) {
    return this.promptVersionService.diffVersions(v1, v2);
  }

  // 删除 Prompt
  @Delete(':id')
  async deletePrompt(@Param('id') id: string) {
    await this.promptVersionService.deletePrompt(id);
    return { success: true };
  }
}
