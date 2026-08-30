import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDatasetDto, UpdateDatasetDto, CreateTestCaseDto } from './dataset.dto';

@Injectable()
export class DatasetService {
  constructor(private readonly prisma: PrismaService) {}

  async createDataset(dto: CreateDatasetDto) {
    return this.prisma.dataset.create({
      data: { name: dto.name, description: dto.description, category: dto.category },
    });
  }

  async findAllDatasets(category?: string) {
    const where = category ? { category } : {};
    return this.prisma.dataset.findMany({
      where,
      include: { _count: { select: { testCases: true } } },
    });
  }

  async findDataset(id: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: { testCases: true, snapshots: true },
    });
    if (!dataset) throw new NotFoundException(`Dataset ${id} not found`);
    return dataset;
  }

  async updateDataset(id: string, dto: UpdateDatasetDto) {
    await this.findDataset(id);
    return this.prisma.dataset.update({ where: { id }, data: dto });
  }

  async removeDataset(id: string) {
    await this.findDataset(id);
    return this.prisma.dataset.delete({ where: { id } });
  }

  async findTestCases(datasetId: string, difficulty?: string) {
    const where: any = { datasetId };
    if (difficulty) where.difficulty = difficulty;
    return this.prisma.testCase.findMany({ where });
  }

  async createTestCase(datasetId: string, dto: CreateTestCaseDto) {
    await this.findDataset(datasetId);
    return this.prisma.testCase.create({
      data: {
        datasetId,
        input: dto.input,
        expectedOutput: dto.expectedOutput,
        difficulty: dto.difficulty || 'medium',
        tags: dto.tags || [],
        metadata: dto.metadata,
      },
    });
  }

  async updateTestCase(id: string, dto: Partial<CreateTestCaseDto>) {
    return this.prisma.testCase.update({ where: { id }, data: dto });
  }

  async removeTestCase(id: string) {
    return this.prisma.testCase.delete({ where: { id } });
  }

  async createSnapshot(datasetId: string, version: string) {
    const cases = await this.prisma.testCase.findMany({ where: { datasetId } });
    return this.prisma.datasetSnapshot.create({
      data: {
        datasetId,
        version,
        data: cases as any,
      },
    });
  }

  async importCases(datasetId: string, cases: CreateTestCaseDto[]) {
    const results = [];
    for (const c of cases) {
      const result = await this.createTestCase(datasetId, c);
      results.push(result);
    }
    return { imported: results.length, cases: results };
  }

  async exportCases(datasetId: string) {
    return this.prisma.testCase.findMany({ where: { datasetId } });
  }
}
