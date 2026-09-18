// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        name: dto.name,
        description: dto.description,
        version: dto.version || '1.0.0',
        category: dto.category,
        tags: dto.tags ? dto.tags.join(',') : null,
      },
    });
  }

  async findAll() {
    return this.prisma.skill.findMany({
      include: {
        _count: {
          select: {
            endpoints: true,
            evalRuns: true,
            skillVersions: true,
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
        endpoints: true,
        evalRuns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        skillVersions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!skill) throw new NotFoundException(`Skill ${id} not found`);
    return skill;
  }

  async update(id: string, dto: UpdateSkillDto) {
    await this.findOne(id);
    return this.prisma.skill.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        version: dto.version,
        category: dto.category,
        tags: dto.tags ? dto.tags.join(',') : dto.tags === null ? null : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.skill.delete({ where: { id } });
  }

  /**
   * 获取技能统计信息
   */
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
      totalEndpoints: skill.endpoints.length,
      totalRuns,
      completedRuns,
      avgPassRate,
      latestVersion: skill.version,
      versionCount: skill.skillVersions.length,
    };
  }
}
