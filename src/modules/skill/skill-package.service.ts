// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as AdmZip from 'adm-zip';
import * as JSZip from 'jszip';
import * as path from 'path';

@Injectable()
export class SkillPackageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 解析上传的 zip 文件，创建 Skill Package
   */
  async importFromZip(buffer: Buffer, parentId?: string) {
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch (e) {
      throw new BadRequestException('无法解析 zip 文件，请确认文件格式');
    }

    const entries = zip.getEntries();
    if (entries.length === 0) {
      throw new BadRequestException('zip 文件为空');
    }

    // 查找根目录的 SKILL.md 或 skill.json 提取元数据
    const metadata = this.extractMetadata(entries);

    // 创建主 Skill
    const skill = await this.prisma.skill.create({
      data: {
        name: metadata.name || path.basename(entries[0].entryName.split('/')[0] || 'Imported Skill'),
        description: metadata.description || null,
        version: metadata.version || '1.0.0',
        category: metadata.category || null,
        tags: metadata.tags ? metadata.tags.join(',') : null,
        instructions: metadata.instructions || null,
        author: metadata.author || null,
        license: metadata.license || null,
        icon: metadata.icon || null,
        parentId: parentId || null,
        packageType: parentId ? 'sub_skill' : 'root',
        status: 'active',
      },
    });

    // 收集文件和子技能
    const filesToCreate: any[] = [];
    const subSkills: Map<string, { metadata: any; files: any[] }> = new Map();

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const entryPath = this.normalizePath(entry.entryName);
      // 跳过隐藏文件和 __MACOSX
      if (entryPath.startsWith('.') || entryPath.includes('__MACOSX')) continue;

      const parts = entryPath.split('/');

      // 检查是否是子技能目录（包含 SKILL.md 的子目录）
      if (parts.length > 1 && this.isSubSkillRoot(parts, entries)) {
        const subSkillDir = parts[0];
        if (!subSkills.has(subSkillDir)) {
          subSkills.set(subSkillDir, { metadata: null, files: [] });
        }
        const subContent = entry.getData().toString('utf-8');
        subSkills.get(subSkillDir).files.push({
          path: parts.slice(1).join('/'),
          content: subContent,
        });
        // 如果是子技能的 SKILL.md，提取元数据
        if (parts[1] === 'SKILL.md' || parts[1] === 'skill.json') {
          subSkills.get(subSkillDir).metadata = this.parseMetadataFile(
            parts[1], subContent,
          );
        }
      } else {
        // 普通文件
        const content = entry.getData().toString('utf-8');
        filesToCreate.push({
          path: entryPath,
          content,
        });
      }
    }

    // 批量创建文件
    for (const f of filesToCreate) {
      const fileType = this.inferFileType(f.path);
      await this.prisma.skillFile.upsert({
        where: { skillId_path: { skillId: skill.id, path: f.path } },
        create: {
          skillId: skill.id,
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
    }

    // 创建子技能
    for (const [dirName, subData] of subSkills.entries()) {
      const subMeta = subData.metadata || {};
      const subSkill = await this.prisma.skill.create({
        data: {
          name: subMeta.name || dirName,
          description: subMeta.description || null,
          version: subMeta.version || '1.0.0',
          category: subMeta.category || null,
          instructions: subMeta.instructions || null,
          parentId: skill.id,
          packageType: 'sub_skill',
          status: 'active',
        },
      });

      // 创建子技能的文件
      for (const f of subData.files) {
        if (!f.path) continue;
        const fileType = this.inferFileType(f.path);
        await this.prisma.skillFile.upsert({
          where: { skillId_path: { skillId: subSkill.id, path: f.path } },
          create: {
            skillId: subSkill.id,
            path: f.path,
            content: f.content,
            fileType,
            size: Buffer.byteLength(f.content, 'utf-8'),
          },
          update: {
            content: f.content,
          },
        });
      }
    }

    // 返回完整的 Skill 信息
    return this.prisma.skill.findUnique({
      where: { id: skill.id },
      include: {
        files: true,
        children: { include: { files: true } },
        _count: { select: { files: true, children: true } },
      },
    });
  }

  /**
   * 导出 Skill Package 为 zip
   */
  async exportToZip(skillId: string): Promise<Buffer> {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        files: true,
        children: { include: { files: true } },
      },
    });
    if (!skill) throw new BadRequestException('技能不存在');

    const zip = new JSZip();

    // 生成 skill.json 元数据
    const skillJson = {
      name: skill.name,
      description: skill.description,
      version: skill.version,
      category: skill.category,
      tags: skill.tags ? skill.tags.split(',').filter(Boolean) : [],
      author: skill.author,
      license: skill.license,
      icon: skill.icon,
      instructions: skill.instructions,
      allowedTools: skill.allowedTools ? skill.allowedTools.split(',').filter(Boolean) : [],
      requiredContext: skill.requiredContext ? skill.requiredContext.split(',').filter(Boolean) : [],
    };
    zip.file('skill.json', JSON.stringify(skillJson, null, 2));

    // 如果有 instructions 但没有 SKILL.md，自动生成
    if (skill.instructions) {
      zip.file('SKILL.md', skill.instructions);
    }

    // 添加所有文件
    for (const file of skill.files) {
      zip.file(file.path, file.content);
    }

    // 添加子技能
    for (const child of skill.children) {
      const childDir = child.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
      // 子技能元数据
      const childJson = {
        name: child.name,
        description: child.description,
        version: child.version,
        category: child.category,
        instructions: child.instructions,
      };
      zip.file(`${childDir}/skill.json`, JSON.stringify(childJson, null, 2));
      if (child.instructions) {
        zip.file(`${childDir}/SKILL.md`, child.instructions);
      }
      for (const file of child.files) {
        zip.file(`${childDir}/${file.path}`, file.content);
      }
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    return buffer;
  }

  // ============================================
  // 工具方法
  // ============================================

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
  }

  private extractMetadata(entries: AdmZip.IZipEntry[]): any {
    // 优先查找 skill.json
    const skillJsonEntry = entries.find(e => {
      const p = this.normalizePath(e.entryName);
      return (p === 'skill.json' || p.split('/').length === 2 && p.endsWith('/skill.json'));
    });
    if (skillJsonEntry) {
      try {
        return JSON.parse(skillJsonEntry.getData().toString('utf-8'));
      } catch {}
    }

    // 其次查找 SKILL.md
    const skillMdEntry = entries.find(e => {
      const p = this.normalizePath(e.entryName);
      return p === 'SKILL.md' || (p.split('/').length === 2 && p.endsWith('/SKILL.md'));
    });
    if (skillMdEntry) {
      return this.parseSkillMd(skillMdEntry.getData().toString('utf-8'));
    }

    return {};
  }

  private parseMetadataFile(filename: string, content: string): any {
    if (filename === 'skill.json') {
      try { return JSON.parse(content); } catch { return {}; }
    }
    if (filename === 'SKILL.md') {
      return this.parseSkillMd(content);
    }
    return {};
  }

  private parseSkillMd(content: string): any {
    const result: any = {};
    // 提取第一行 # 标题作为 name
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) result.name = titleMatch[1].trim();

    // 提取 ## 概述 段落作为 description
    const overviewMatch = content.match(/##\s*概述\s*\n([\s\S]*?)(?=\n##|$)/);
    if (overviewMatch) result.description = overviewMatch[1].trim().substring(0, 200);

    // 整个内容作为 instructions
    result.instructions = content;

    return result;
  }

  private isSubSkillRoot(parts: string[], entries: AdmZip.IZipEntry[]): boolean {
    // 只有第一层子目录才检查是否为子技能
    if (parts.length <= 1) return false;
    const dir = parts[0];
    // 检查该目录下是否有 SKILL.md 或 skill.json
    return entries.some(e => {
      const p = this.normalizePath(e.entryName);
      return p.startsWith(`${dir}/SKILL.md`) || p.startsWith(`${dir}/skill.json`);
    });
  }

  private inferFileType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
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
}
