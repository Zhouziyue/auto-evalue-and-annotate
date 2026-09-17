// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// Prompt 版本状态
export enum PromptVersionStatus {
  DRAFT = 'draft',           // 草稿
  STAGING = 'staging',       // 预发布
  PRODUCTION = 'production', // 生产
  ARCHIVED = 'archived',     // 归档
}

// Prompt 版本
export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  status: PromptVersionStatus;
  labels: string[];          // 标签，如 "production", "v2.0"
  commitMessage?: string;    // 提交说明
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Prompt 定义
export interface PromptDefinition {
  id: string;
  name: string;
  description?: string;
  category?: string;
  currentVersionId?: string;
  versions: PromptVersion[];
  createdAt: Date;
  updatedAt: Date;
}

// 创建 Prompt 输入
export interface CreatePromptInput {
  name: string;
  description?: string;
  category?: string;
  content: string;
  labels?: string[];
}

// 更新 Prompt 输入
export interface UpdatePromptInput {
  content: string;
  commitMessage?: string;
  labels?: string[];
  status?: PromptVersionStatus;
}

@Injectable()
export class PromptVersionService {
  constructor(private prisma: PrismaService) {}

  // 创建 Prompt
  async createPrompt(input: CreatePromptInput): Promise<PromptDefinition> {
    // 使用 Agent 表存储 Prompt（复用现有表结构）
    const agent = await this.prisma.agent.create({
      data: {
        name: input.name,
        url: 'prompt://local',
        authType: 'prompt',
        sseFormat: input.category || 'general',
        metadata: JSON.stringify({
          type: 'prompt',
          description: input.description,
        }),
      },
    });

    // 创建第一个版本
    const version = await this.createVersion(agent.id, {
      content: input.content,
      labels: input.labels || ['draft'],
      status: PromptVersionStatus.DRAFT,
    });

    // 更新当前版本
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { metadata: JSON.stringify({
        type: 'prompt',
        description: input.description,
        currentVersionId: version.id,
      })},
    });

    return this.getPrompt(agent.id);
  }

  // 获取 Prompt 详情
  async getPrompt(id: string): Promise<PromptDefinition | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) return null;

    const metadata = JSON.parse(agent.metadata || '{}');
    if (metadata.type !== 'prompt') return null;

    const versions = await this.getVersions(id);

    return {
      id: agent.id,
      name: agent.name,
      description: metadata.description,
      category: agent.sseFormat,
      currentVersionId: metadata.currentVersionId,
      versions,
      createdAt: agent.createdAt,
      updatedAt: agent.createdAt, // Agent 表没有 updatedAt，使用 createdAt
    };
  }

  // 获取所有 Prompt 列表
  async listPrompts(options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<PromptDefinition[]> {
    const where: any = {
      authType: 'prompt',
    };

    if (options?.category) {
      where.sseFormat = options.category;
    }

    const agents = await this.prisma.agent.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    const prompts: PromptDefinition[] = [];
    for (const agent of agents) {
      const metadata = JSON.parse(agent.metadata || '{}');
      if (metadata.type !== 'prompt') continue;
      
      prompts.push({
        id: agent.id,
        name: agent.name,
        description: metadata.description,
        category: agent.sseFormat,
        currentVersionId: metadata.currentVersionId,
        versions: [], // 列表不加载版本详情
        createdAt: agent.createdAt,
        updatedAt: agent.createdAt,
      });
    }

    return prompts;
  }

  // 创建新版本
  async createVersion(promptId: string, input: UpdatePromptInput): Promise<PromptVersion> {
    // 获取当前最大版本号
    const prompt = await this.getPrompt(promptId);
    const maxVersion = prompt?.versions?.reduce((max, v) => Math.max(max, v.version), 0) || 0;

    // 使用 Skill 表存储版本（复用现有表结构）
    const skill = await this.prisma.skill.create({
      data: {
        name: `version_${maxVersion + 1}`,
        description: input.commitMessage || '',
        version: (maxVersion + 1).toString(),
        metadata: JSON.stringify({
          type: 'prompt_version',
          promptId,
          content: input.content,
          status: input.status || PromptVersionStatus.DRAFT,
          labels: input.labels || [],
        }),
      },
    });

    return {
      id: skill.id,
      promptId,
      version: maxVersion + 1,
      content: input.content,
      status: input.status || PromptVersionStatus.DRAFT,
      labels: input.labels || [],
      commitMessage: input.commitMessage,
      createdAt: skill.createdAt,
      updatedAt: skill.createdAt,
    };
  }

  // 获取 Prompt 的所有版本
  async getVersions(promptId: string): Promise<PromptVersion[]> {
    const skills = await this.prisma.skill.findMany({
      where: {
        metadata: { contains: `"promptId":"${promptId}"` },
      },
      orderBy: { createdAt: 'desc' },
    });

    return skills.map(skill => {
      const metadata = JSON.parse(skill.metadata || '{}');
      return {
        id: skill.id,
        promptId,
        version: parseInt(skill.version) || 0,
        content: metadata.content || '',
        status: metadata.status || PromptVersionStatus.DRAFT,
        labels: metadata.labels || [],
        commitMessage: skill.description,
        createdAt: skill.createdAt,
        updatedAt: skill.createdAt,
      };
    });
  }

  // 更新版本状态
  async updateVersionStatus(
    promptId: string,
    versionId: string,
    status: PromptVersionStatus,
  ): Promise<PromptVersion> {
    const skill = await this.prisma.skill.findUnique({
      where: { id: versionId },
    });

    if (!skill) throw new Error('Version not found');

    const metadata = JSON.parse(skill.metadata || '{}');
    metadata.status = status;

    await this.prisma.skill.update({
      where: { id: versionId },
      data: { metadata: JSON.stringify(metadata) },
    });

    // 如果设置为 production，更新当前版本
    if (status === PromptVersionStatus.PRODUCTION) {
      const agent = await this.prisma.agent.findUnique({
        where: { id: promptId },
      });
      if (agent) {
        const agentMetadata = JSON.parse(agent.metadata || '{}');
        agentMetadata.currentVersionId = versionId;
        await this.prisma.agent.update({
          where: { id: promptId },
          data: { metadata: JSON.stringify(agentMetadata) },
        });
      }
    }

    return {
      id: skill.id,
      promptId,
      version: parseInt(skill.version) || 0,
      content: metadata.content || '',
      status,
      labels: metadata.labels || [],
      commitMessage: skill.description,
      createdAt: skill.createdAt,
      updatedAt: new Date(),
    };
  }

  // 删除 Prompt
  async deletePrompt(id: string): Promise<void> {
    // 删除所有版本
    await this.prisma.skill.deleteMany({
      where: {
        metadata: { contains: `"promptId":"${id}"` },
      },
    });

    // 删除 Prompt 定义
    await this.prisma.agent.delete({
      where: { id },
    });
  }

  // 对比两个版本
  async diffVersions(versionId1: string, versionId2: string): Promise<{
    version1: PromptVersion;
    version2: PromptVersion;
    diff: {
      added: string[];
      removed: string[];
      modified: string[];
    };
  }> {
    const skill1 = await this.prisma.skill.findUnique({ where: { id: versionId1 } });
    const skill2 = await this.prisma.skill.findUnique({ where: { id: versionId2 } });

    if (!skill1 || !skill2) throw new Error('Version not found');

    const metadata1 = JSON.parse(skill1.metadata || '{}');
    const metadata2 = JSON.parse(skill2.metadata || '{}');

    const content1 = metadata1.content || '';
    const content2 = metadata2.content || '';

    // 简单的行级 diff
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const added = lines2.filter(l => !lines1.includes(l));
    const removed = lines1.filter(l => !lines2.includes(l));
    const modified = lines1.filter((l, i) => lines2[i] && l !== lines2[i]);

    const version1: PromptVersion = {
      id: skill1.id,
      promptId: JSON.parse(skill1.metadata || '{}').promptId,
      version: parseInt(skill1.version) || 0,
      content: content1,
      status: metadata1.status || PromptVersionStatus.DRAFT,
      labels: metadata1.labels || [],
      commitMessage: skill1.description,
      createdAt: skill1.createdAt,
      updatedAt: skill1.createdAt,
    };

    const version2: PromptVersion = {
      id: skill2.id,
      promptId: JSON.parse(skill2.metadata || '{}').promptId,
      version: parseInt(skill2.version) || 0,
      content: content2,
      status: metadata2.status || PromptVersionStatus.DRAFT,
      labels: metadata2.labels || [],
      commitMessage: skill2.description,
      createdAt: skill2.createdAt,
      updatedAt: skill2.createdAt,
    };

    return {
      version1,
      version2,
      diff: { added, removed, modified },
    };
  }
}
