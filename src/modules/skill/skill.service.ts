// @ts-nocheck
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateSkillDto, UpdateSkillDto,
  CreateSkillFileDto, UpdateSkillFileDto, BatchCreateFilesDto,
  LinkAgentDto,
} from './skill.dto';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // Skill CRUD
  // ============================================

  async create(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        name: dto.name,
        description: dto.description,
        version: dto.version || '1.0.0',
        category: dto.category,
        tags: dto.tags ? dto.tags.join(',') : null,
        instructions: dto.instructions,
        allowedTools: dto.allowedTools ? dto.allowedTools.join(',') : null,
        requiredContext: dto.requiredContext ? dto.requiredContext.join(',') : null,
        author: dto.author,
        license: dto.license,
        status: dto.status || 'active',
        parentId: dto.parentId || null,
        packageType: dto.packageType || (dto.parentId ? 'sub_skill' : 'root'),
        icon: dto.icon || null,
      },
    });
  }

  async findAll(parentId?: string) {
    const where: any = {};
    if (parentId === undefined) {
      // 默认只返回 root 级技能
      where.packageType = 'root';
    } else if (parentId === 'all') {
      // 返回所有（包括子技能）
    } else {
      where.parentId = parentId;
    }

    return this.prisma.skill.findMany({
      where,
      include: {
        _count: {
          select: {
            files: true,
            children: true,
            skillAgents: true,
            evalRuns: true,
            skillVersions: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            icon: true,
            packageType: true,
            status: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        files: {
          orderBy: { path: 'asc' },
        },
        children: {
          include: {
            _count: { select: { files: true, skillAgents: true } },
          },
          orderBy: { name: 'asc' },
        },
        skillAgents: {
          include: {
            endpoint: true,
          },
        },
        evalRuns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        skillVersions: {
          orderBy: { createdAt: 'desc' },
        },
        parent: {
          select: { id: true, name: true, icon: true },
        },
      },
    });
    if (!skill) throw new NotFoundException(`Skill ${id} not found`);
    return skill;
  }

  async update(id: string, dto: UpdateSkillDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.version !== undefined) data.version = dto.version;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.tags !== undefined) data.tags = dto.tags ? dto.tags.join(',') : null;
    if (dto.instructions !== undefined) data.instructions = dto.instructions;
    if (dto.allowedTools !== undefined) data.allowedTools = dto.allowedTools ? dto.allowedTools.join(',') : null;
    if (dto.requiredContext !== undefined) data.requiredContext = dto.requiredContext ? dto.requiredContext.join(',') : null;
    if (dto.author !== undefined) data.author = dto.author;
    if (dto.license !== undefined) data.license = dto.license;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.parentId !== undefined) {
      data.parentId = dto.parentId || null;
      data.packageType = dto.parentId ? 'sub_skill' : 'root';
    }
    if (dto.icon !== undefined) data.icon = dto.icon;

    return this.prisma.skill.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.skill.delete({ where: { id } });
  }

  // ============================================
  // 文件树管理
  // ============================================

  async getFileTree(skillId: string) {
    await this.findOne(skillId);
    const files = await this.prisma.skillFile.findMany({
      where: { skillId },
      orderBy: { path: 'asc' },
    });
    return this.buildFileTree(files);
  }

  async addFile(skillId: string, dto: CreateSkillFileDto) {
    await this.findOne(skillId);

    const existing = await this.prisma.skillFile.findUnique({
      where: { skillId_path: { skillId, path: dto.path } },
    });
    if (existing) {
      throw new ConflictException(`文件 ${dto.path} 已存在`);
    }

    const fileType = dto.fileType || this.inferFileType(dto.path);
    return this.prisma.skillFile.create({
      data: {
        skillId,
        path: dto.path,
        content: dto.content,
        fileType,
        size: Buffer.byteLength(dto.content, 'utf-8'),
      },
    });
  }

  async updateFile(skillId: string, fileId: string, dto: UpdateSkillFileDto) {
    const file = await this.prisma.skillFile.findFirst({
      where: { id: fileId, skillId },
    });
    if (!file) throw new NotFoundException('文件不存在');

    const data: any = {};
    if (dto.content !== undefined) {
      data.content = dto.content;
      data.size = Buffer.byteLength(dto.content, 'utf-8');
    }
    if (dto.path !== undefined && dto.path !== file.path) {
      // 检查新路径是否冲突
      const conflict = await this.prisma.skillFile.findUnique({
        where: { skillId_path: { skillId, path: dto.path } },
      });
      if (conflict) throw new ConflictException(`路径 ${dto.path} 已存在`);
      data.path = dto.path;
      data.fileType = this.inferFileType(dto.path);
    }

    return this.prisma.skillFile.update({ where: { id: fileId }, data });
  }

  async deleteFile(skillId: string, fileId: string) {
    const file = await this.prisma.skillFile.findFirst({
      where: { id: fileId, skillId },
    });
    if (!file) throw new NotFoundException('文件不存在');
    return this.prisma.skillFile.delete({ where: { id: fileId } });
  }

  async batchCreateFiles(skillId: string, dto: BatchCreateFilesDto) {
    await this.findOne(skillId);
    const results = [];
    for (const f of dto.files) {
      const fileType = f.fileType || this.inferFileType(f.path);
      const file = await this.prisma.skillFile.upsert({
        where: { skillId_path: { skillId, path: f.path } },
        create: {
          skillId,
          path: f.path,
          content: f.content,
          fileType,
          size: Buffer.byteLength(f.content, 'utf-8'),
        },
        update: {
          content: f.content,
          fileType,
          size: Buffer.byteLength(f.content, 'utf-8'),
        },
      });
      results.push(file);
    }
    return results;
  }

  async getAllFiles(skillId: string) {
    return this.prisma.skillFile.findMany({
      where: { skillId },
      orderBy: { path: 'asc' },
    });
  }

  // ============================================
  // 技能-智能体关联（M:N）
  // ============================================

  async getLinkedAgents(skillId: string) {
    await this.findOne(skillId);
    return this.prisma.skillAgent.findMany({
      where: { skillId },
      include: { endpoint: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async linkAgent(skillId: string, dto: LinkAgentDto) {
    await this.findOne(skillId);

    const existing = await this.prisma.skillAgent.findUnique({
      where: { skillId_endpointId: { skillId, endpointId: dto.endpointId } },
    });
    if (existing) {
      throw new ConflictException('该智能体已关联此技能');
    }

    return this.prisma.skillAgent.create({
      data: {
        skillId,
        endpointId: dto.endpointId,
        role: dto.role || 'primary',
        config: dto.config ? JSON.stringify(dto.config) : null,
      },
      include: { endpoint: true },
    });
  }

  async unlinkAgent(skillId: string, linkId: string) {
    const link = await this.prisma.skillAgent.findFirst({
      where: { id: linkId, skillId },
    });
    if (!link) throw new NotFoundException('关联记录不存在');
    return this.prisma.skillAgent.delete({ where: { id: linkId } });
  }

  // ============================================
  // 统计信息
  // ============================================

  async getStats(id: string) {
    const skill = await this.findOne(id);

    const totalRuns = skill.evalRuns.length;
    const completedRuns = skill.evalRuns.filter((r) => r.status === 'completed').length;
    const avgPassRate =
      completedRuns > 0
        ? skill.evalRuns.reduce((sum, r) => {
            const rate = r.totalCases > 0 ? r.passedCases / r.totalCases : 0;
            return sum + rate;
          }, 0) / completedRuns
        : 0;

    return {
      skillId: id,
      skillName: skill.name,
      totalFiles: skill.files.length,
      totalChildren: skill.children.length,
      totalAgents: skill.skillAgents.length,
      totalRuns,
      completedRuns,
      avgPassRate,
      latestVersion: skill.version,
      versionCount: skill.skillVersions.length,
    };
  }

  // ============================================
  // 工具方法
  // ============================================

  private inferFileType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      md: 'markdown', markdown: 'markdown',
      json: 'json',
      yaml: 'yaml', yml: 'yaml',
      txt: 'text', text: 'text',
      py: 'python',
      js: 'javascript', ts: 'javascript',
    };
    return map[ext] || 'text';
  }

  private buildFileTree(files: any[]): any[] {
    const root: any[] = [];
    const dirMap: Map<string, any> = new Map();

    // 先排序确保目录在前
    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sorted) {
      const parts = file.path.split('/');
      let currentPath = '';
      let parentChildren = root;

      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        if (!dirMap.has(currentPath)) {
          const dir = { name: parts[i], path: currentPath, type: 'directory', children: [] };
          dirMap.set(currentPath, dir);
          parentChildren.push(dir);
        }
        parentChildren = dirMap.get(currentPath).children;
      }

      parentChildren.push({
        name: parts[parts.length - 1],
        path: file.path,
        type: 'file',
        fileType: file.fileType,
        size: file.size,
        id: file.id,
      });
    }

    return root;
  }
}
