// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationConsistencyController } from './annotation-consistency.controller';
import { AnnotationConsistencyService } from './annotation-consistency.service';
import { AnnotationService } from './annotation.service';

describe('AnnotationConsistencyController', () => {
  let controller: AnnotationConsistencyController;
  let service: Partial<Record<keyof AnnotationConsistencyService, jest.Mock>>;
  let annotationService: Partial<Record<keyof AnnotationService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      generateConsistencyReport: jest.fn(),
      getAnnotationStats: jest.fn(),
    };
    annotationService = {
      batchAutoAnnotate: jest.fn(),
      getEvalRunAnnotationStats: jest.fn(),
      aiAnnotate: jest.fn(),
      humanAnnotate: jest.fn(),
      calculateAgreement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnotationConsistencyController],
      providers: [
        { provide: AnnotationConsistencyService, useValue: service },
        { provide: AnnotationService, useValue: annotationService },
      ],
    }).compile();

    controller = module.get<AnnotationConsistencyController>(AnnotationConsistencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getConsistencyReport - 生成一致性报告', async () => {
    const result = {
      datasetId: 'ds-1',
      totalAnnotations: 10,
      totalAnnotators: 3,
      overallAgreement: 0.85,
      fleissKappa: 0.75,
      krippendorffAlpha: 0.8,
      perCategoryAgreement: { default: 0.85 },
      disagreements: [],
      suggestions: ['标注一致性良好'],
    };
    service.generateConsistencyReport.mockResolvedValue(result);

    expect(await controller.getConsistencyReport('ds-1')).toEqual(result);
    expect(service.generateConsistencyReport).toHaveBeenCalledWith('ds-1');
  });

  it('getAnnotationStats - 获取标注统计', async () => {
    const result = {
      totalAnnotations: 20,
      annotatorCount: 3,
      avgAnnotationsPerCase: 2.5,
      avgConfidence: 0.9,
      labelDistribution: { correct: 15, incorrect: 5 },
      annotatorStats: [],
    };
    service.getAnnotationStats.mockResolvedValue(result);

    expect(await controller.getAnnotationStats('ds-1')).toEqual(result);
    expect(service.getAnnotationStats).toHaveBeenCalledWith('ds-1');
  });

  it('batchAutoAnnotate - 批量自动标注', async () => {
    const result = { evalRunId: 'run-1', total: 5, annotated: 5, failed: 0 };
    annotationService.batchAutoAnnotate.mockResolvedValue(result);

    expect(await controller.batchAutoAnnotate('run-1')).toEqual(result);
    expect(annotationService.batchAutoAnnotate).toHaveBeenCalledWith('run-1');
  });

  it('getEvalRunAnnotationStats - 获取评测运行标注统计', async () => {
    const result = { evalRunId: 'run-1', totalResults: 10, aiAnnotated: 8, pendingAnnotation: 2 };
    annotationService.getEvalRunAnnotationStats.mockResolvedValue(result);

    expect(await controller.getEvalRunAnnotationStats('run-1')).toEqual(result);
  });

  it('aiAnnotate - 单条 AI 标注', async () => {
    const result = { id: 'ann-1', type: 'ai', scores: {} };
    annotationService.aiAnnotate.mockResolvedValue(result);

    expect(await controller.aiAnnotate('result-1')).toEqual(result);
  });
});
