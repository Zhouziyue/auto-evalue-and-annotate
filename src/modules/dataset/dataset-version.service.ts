// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 数据集版本
export interface DatasetVersion {
  id: string;
  datasetId: string;
  version: number;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  testCaseCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  createdBy?: string;
}

// 版本对比结果
export interface VersionDiff {
  version1: DatasetVersion;
  version2: DatasetVersion;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

@Injectable()
export class DatasetVersionService {
  constructor(private prisma: PrismaService) {}

  // 创建新版本
  async createVersion(datasetId: string, data: {
    name: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<DatasetVersion> {
    // 获取当前最大版本号
    const versions = await this.getVersions(datasetId);
    const maxVersion = versions.reduce((max, v) => Math.max(max, v.version), 0);

    // 统计测试用例数
    const testCaseCount = await this.prisma.testCase.count({
      where: { datasetId },
    });

    const version: DatasetVersion = {
      id: `dv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      datasetId,
      version: maxVersion + 1,
      name: data.name,
      description: data.description,
      status: 'draft',
      testCaseCount,
      metadata: data.metadata || {},
      createdAt: new Date(),
    };

    // 存储到数据库
    await this.prisma.skill.create({
      data: {
        name: `dataset_version_${datasetId}_${version.version}`,
        description: JSON.stringify({
          type: 'dataset_version',
          datasetId,
          version: version.version,
          versionName: data.name,
          versionDescription: data.description,
          status: 'draft',
          testCaseCount,
          metadata: data.metadata,
          createdAt: version.createdAt,
        }),
        version: version.version.toString(),
      },
    });

    return version;
  }

  // 获取数据集的所有版本
  async getVersions(datasetId: string): Promise<DatasetVersion[]> {
    const skills = await this.prisma.skill.findMany({
      where: {
        name: { startsWith: `dataset_version_${datasetId}_` },
      },
      orderBy: { createdAt: 'desc' },
    });

    return skills.map(skill => {
      const desc = JSON.parse(skill.description || '{}');
      return {
        id: skill.id,
        datasetId,
        version: parseInt(skill.version) || 0,
        name: desc.versionName || `v${skill.version}`,
        description: desc.versionDescription,
        status: desc.status || 'draft',
        testCaseCount: desc.testCaseCount || 0,
        metadata: desc.metadata || {},
        createdAt: desc.createdAt || skill.createdAt,
      };
    });
  }

  // 发布版本
  async publishVersion(datasetId: string, versionId: string): Promise<DatasetVersion> {
    const skill = await this.prisma.skill.findUnique({
      where: { id: versionId },
    });

    if (!skill) throw new Error('Version not found');

    const desc = JSON.parse(skill.description || '{}');
    desc.status = 'published';

    await this.prisma.skill.update({
      where: { id: versionId },
      data: { description: JSON.stringify(desc) },
    });

    return {
      id: skill.id,
      datasetId,
      version: parseInt(skill.version) || 0,
      name: desc.versionName || `v${skill.version}`,
      description: desc.versionDescription,
      status: 'published',
      testCaseCount: desc.testCaseCount || 0,
      metadata: desc.metadata || {},
      createdAt: desc.createdAt || skill.createdAt,
    };
  }

  // 归档版本
  async archiveVersion(datasetId: string, versionId: string): Promise<DatasetVersion> {
    const skill = await this.prisma.skill.findUnique({
      where: { id: versionId },
    });

    if (!skill) throw new Error('Version not found');

    const desc = JSON.parse(skill.description || '{}');
    desc.status = 'archived';

    await this.prisma.skill.update({
      where: { id: versionId },
      data: { description: JSON.stringify(desc) },
    });

    return {
      id: skill.id,
      datasetId,
      version: parseInt(skill.version) || 0,
      name: desc.versionName || `v${skill.version}`,
      description: desc.versionDescription,
      status: 'archived',
      testCaseCount: desc.testCaseCount || 0,
      metadata: desc.metadata || {},
      createdAt: desc.createdAt || skill.createdAt,
    };
  }

  // 对比两个版本
  async diffVersions(versionId1: string, versionId2: string): Promise<VersionDiff> {
    const skill1 = await this.prisma.skill.findUnique({ where: { id: versionId1 } });
    const skill2 = await this.prisma.skill.findUnique({ where: { id: versionId2 } });

    if (!skill1 || !skill2) throw new Error('Version not found');

    const desc1 = JSON.parse(skill1.description || '{}');
    const desc2 = JSON.parse(skill2.description || '{}');

    const version1: DatasetVersion = {
      id: skill1.id,
      datasetId: desc1.datasetId,
      version: parseInt(skill1.version) || 0,
      name: desc1.versionName || `v${skill1.version}`,
      description: desc1.versionDescription,
      status: desc1.status || 'draft',
      testCaseCount: desc1.testCaseCount || 0,
      metadata: desc1.metadata || {},
      createdAt: desc1.createdAt || skill1.createdAt,
    };

    const version2: DatasetVersion = {
      id: skill2.id,
      datasetId: desc2.datasetId,
      version: parseInt(skill2.version) || 0,
      name: desc2.versionName || `v${skill2.version}`,
      description: desc2.versionDescription,
      status: desc2.status || 'draft',
      testCaseCount: desc2.testCaseCount || 0,
      metadata: desc2.metadata || {},
      createdAt: desc2.createdAt || skill2.createdAt,
    };

    // 简化版对比（基于用例数量）
    const count1 = version1.testCaseCount;
    const count2 = version2.testCaseCount;
    const diff = Math.abs(count2 - count1);

    return {
      version1,
      version2,
      added: count2 > count1 ? diff : 0,
      removed: count1 > count2 ? diff : 0,
      modified: 0,  // 需要更复杂的对比逻辑
      unchanged: Math.min(count1, count2),
    };
  }

  // 回滚到指定版本
  async rollbackToVersion(datasetId: string, versionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const skill = await this.prisma.skill.findUnique({
      where: { id: versionId },
    });

    if (!skill) throw new Error('Version not found');

    const desc = JSON.parse(skill.description || '{}');
    
    // 标记当前版本为归档
    const currentVersions = await this.getVersions(datasetId);
    const currentPublished = currentVersions.find(v => v.status === 'published');
    
    if (currentPublished) {
      await this.archiveVersion(datasetId, currentPublished.id);
    }

    // 发布目标版本
    await this.publishVersion(datasetId, versionId);

    return {
      success: true,
      message: `已回滚到版本 v${desc.version || skill.version}`,
    };
  }
}
