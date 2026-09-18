// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 数据版本
export interface DataVersion {
  id: string;
  datasetId: string;
  version: number;
  name: string;
  description?: string;
  data: any[];
  metadata: {
    itemCount: number;
    size: number;
    checksum: string;
    tags: string[];
    parentVersion?: number;
  };
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  createdBy: string;
  publishedAt?: Date;
}

// 版本差异
export interface VersionDiff {
  added: any[];
  removed: any[];
  modified: Array<{
    old: any;
    new: any;
    path: string;
  }>;
  summary: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  };
}

// 版本快照
export interface VersionSnapshot {
  id: string;
  versionId: string;
  name: string;
  description?: string;
  data: any[];
  createdAt: Date;
  createdBy: string;
}

@Injectable()
export class DataVersioningService {
  private versions: Map<string, DataVersion[]> = new Map(); // datasetId -> versions
  private snapshots: Map<string, VersionSnapshot[]> = new Map(); // versionId -> snapshots

  constructor() {}

  // 创建新版本
  async createVersion(data: {
    datasetId: string;
    name: string;
    description?: string;
    data: any[];
    tags?: string[];
    createdBy: string;
  }): Promise<DataVersion> {
    const datasetVersions = this.versions.get(data.datasetId) || [];
    const versionNumber = datasetVersions.length > 0 
      ? Math.max(...datasetVersions.map(v => v.version)) + 1 
      : 1;

    const id = `ver_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const checksum = this.calculateChecksum(data.data);

    const version: DataVersion = {
      id,
      datasetId: data.datasetId,
      version: versionNumber,
      name: data.name,
      description: data.description,
      data: data.data,
      metadata: {
        itemCount: data.data.length,
        size: JSON.stringify(data.data).length,
        checksum,
        tags: data.tags || [],
        parentVersion: versionNumber > 1 ? versionNumber - 1 : undefined,
      },
      status: 'draft',
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    datasetVersions.push(version);
    this.versions.set(data.datasetId, datasetVersions);
    return version;
  }

  // 发布版本
  async publishVersion(datasetId: string, versionNumber: number): Promise<DataVersion> {
    const versions = this.versions.get(datasetId);
    if (!versions) throw new Error('Dataset not found');

    const version = versions.find(v => v.version === versionNumber);
    if (!version) throw new Error('Version not found');

    version.status = 'published';
    version.publishedAt = new Date();
    return version;
  }

  // 归档版本
  async archiveVersion(datasetId: string, versionNumber: number): Promise<DataVersion> {
    const versions = this.versions.get(datasetId);
    if (!versions) throw new Error('Dataset not found');

    const version = versions.find(v => v.version === versionNumber);
    if (!version) throw new Error('Version not found');

    version.status = 'archived';
    return version;
  }

  // 获取版本列表
  async getVersions(datasetId: string, options?: {
    status?: 'draft' | 'published' | 'archived';
    tag?: string;
  }): Promise<DataVersion[]> {
    let versions = this.versions.get(datasetId) || [];

    if (options?.status) versions = versions.filter(v => v.status === options.status);
    if (options?.tag) versions = versions.filter(v => v.metadata.tags.includes(options.tag!));

    return versions.sort((a, b) => b.version - a.version);
  }

  // 获取特定版本
  async getVersion(datasetId: string, versionNumber: number): Promise<DataVersion | undefined> {
    const versions = this.versions.get(datasetId);
    return versions?.find(v => v.version === versionNumber);
  }

  // 获取最新版本
  async getLatestVersion(datasetId: string): Promise<DataVersion | undefined> {
    const versions = this.versions.get(datasetId);
    if (!versions || versions.length === 0) return undefined;
    return versions.reduce((latest, v) => v.version > latest.version ? v : latest, versions[0]);
  }

  // 比较版本差异
  async diffVersions(
    datasetId: string,
    versionA: number,
    versionB: number,
  ): Promise<VersionDiff> {
    const versions = this.versions.get(datasetId);
    if (!versions) throw new Error('Dataset not found');

    const vA = versions.find(v => v.version === versionA);
    const vB = versions.find(v => v.version === versionB);
    if (!vA || !vB) throw new Error('Version not found');

    const added: any[] = [];
    const removed: any[] = [];
    const modified: VersionDiff['modified'] = [];

    // 简化的差异比较
    const dataA = new Map(vA.data.map((item, i) => [i, item]));
    const dataB = new Map(vB.data.map((item, i) => [i, item]));

    // 查找新增项
    for (const [key, value] of dataB.entries()) {
      if (!dataA.has(key)) {
        added.push(value);
      }
    }

    // 查找删除项
    for (const [key, value] of dataA.entries()) {
      if (!dataB.has(key)) {
        removed.push(value);
      }
    }

    // 查找修改项
    for (const [key, valueB] of dataB.entries()) {
      const valueA = dataA.get(key);
      if (valueA && JSON.stringify(valueA) !== JSON.stringify(valueB)) {
        modified.push({
          old: valueA,
          new: valueB,
          path: `[${key}]`,
        });
      }
    }

    return {
      added,
      removed,
      modified,
      summary: {
        addedCount: added.length,
        removedCount: removed.length,
        modifiedCount: modified.length,
      },
    };
  }

  // 回滚到指定版本
  async rollbackVersion(datasetId: string, targetVersion: number): Promise<DataVersion> {
    const versions = this.versions.get(datasetId);
    if (!versions) throw new Error('Dataset not found');

    const target = versions.find(v => v.version === targetVersion);
    if (!target) throw new Error('Target version not found');

    // 创建新版本，数据与目标版本相同
    return this.createVersion({
      datasetId,
      name: `Rollback to v${targetVersion}`,
      description: `回滚到版本 ${targetVersion}`,
      data: target.data,
      tags: ['rollback'],
      createdBy: 'system',
    });
  }

  // 创建版本快照
  async createSnapshot(versionId: string, data: {
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<VersionSnapshot> {
    const version = this.findVersionById(versionId);
    if (!version) throw new Error('Version not found');

    const id = `snap_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const snapshot: VersionSnapshot = {
      id,
      versionId,
      name: data.name,
      description: data.description,
      data: version.data,
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    const snapshots = this.snapshots.get(versionId) || [];
    snapshots.push(snapshot);
    this.snapshots.set(versionId, snapshots);
    return snapshot;
  }

  // 获取版本快照列表
  async getSnapshots(versionId: string): Promise<VersionSnapshot[]> {
    return (this.snapshots.get(versionId) || []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  // 恢复快照
  async restoreSnapshot(snapshotId: string): Promise<any[]> {
    const snapshot = this.findSnapshotById(snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');
    return snapshot.data;
  }

  // 删除版本
  async deleteVersion(datasetId: string, versionNumber: number): Promise<boolean> {
    const versions = this.versions.get(datasetId);
    if (!versions) return false;

    const index = versions.findIndex(v => v.version === versionNumber);
    if (index === -1) return false;

    versions.splice(index, 1);
    return true;
  }

  // 计算校验和
  private calculateChecksum(data: any[]): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // 根据 ID 查找版本
  private findVersionById(versionId: string): DataVersion | undefined {
    for (const versions of this.versions.values()) {
      const version = versions.find(v => v.id === versionId);
      if (version) return version;
    }
    return undefined;
  }

  // 根据 ID 查找快照
  private findSnapshotById(snapshotId: string): VersionSnapshot | undefined {
    for (const snapshots of this.snapshots.values()) {
      const snapshot = snapshots.find(s => s.id === snapshotId);
      if (snapshot) return snapshot;
    }
    return undefined;
  }

  // 获取版本统计
  async getVersionStats(datasetId: string): Promise<{
    totalVersions: number;
    draftCount: number;
    publishedCount: number;
    archivedCount: number;
    latestVersion: number | null;
  }> {
    const versions = this.versions.get(datasetId) || [];
    return {
      totalVersions: versions.length,
      draftCount: versions.filter(v => v.status === 'draft').length,
      publishedCount: versions.filter(v => v.status === 'published').length,
      archivedCount: versions.filter(v => v.status === 'archived').length,
      latestVersion: versions.length > 0 ? Math.max(...versions.map(v => v.version)) : null,
    };
  }
}
