// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 评测模板
export interface EvalTemplate {
  id: string;
  name: string;
  description?: string;
  category: EvalTemplateCategory;
  config: TemplateConfig;
  variables: TemplateVariable[];
  tags: string[];
  isBuiltIn: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// 模板分类
export enum EvalTemplateCategory {
  QA = 'qa',                    // 问答评测
  SUMMARIZATION = 'summarization', // 摘要评测
  TRANSLATION = 'translation',  // 翻译评测
  CODE = 'code',                // 代码评测
  CREATIVE = 'creative',        // 创意写作评测
  SAFETY = 'safety',            // 安全评测
  RAG = 'rag',                  // RAG 评测
  CONVERSATION = 'conversation', // 对话评测
  CUSTOM = 'custom',            // 自定义
}

// 模板配置
export interface TemplateConfig {
  promptTemplate: string;       // Prompt 模板
  metrics: string[];            // 评测指标
  datasetRequirements?: {
    minCases?: number;
    requiredFields?: string[];
  };
  outputFormat?: string;        // 期望输出格式
  evaluationCriteria?: string;  // 评测标准说明
}

// 模板变量
export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
  options?: any[];              // 可选值
}

// 模板实例化结果
export interface InstantiatedTemplate {
  templateId: string;
  templateName: string;
  prompt: string;
  metrics: string[];
  variables: Record<string, any>;
  createdAt: Date;
}

// 预定义模板
const BUILT_IN_TEMPLATES: Omit<EvalTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '通用问答评测',
    description: '评估模型对各类问题的回答质量，包括准确性、完整性、相关性',
    category: EvalTemplateCategory.QA,
    config: {
      promptTemplate: '请回答以下问题：\n\n问题：{{question}}\n\n上下文：{{context}}\n\n要求：\n1. 回答要准确、完整\n2. 如果提供了上下文，请基于上下文回答\n3. 回答要简洁明了',
      metrics: ['answer_relevancy', 'faithfulness', 'completeness', 'context_precision'],
      datasetRequirements: {
        minCases: 10,
        requiredFields: ['question', 'expected_answer'],
      },
      evaluationCriteria: '评估回答的准确性、完整性、相关性和忠实度',
    },
    variables: [
      { name: 'question', description: '问题内容', type: 'string', required: true },
      { name: 'context', description: '参考上下文', type: 'string', required: false },
    ],
    tags: ['通用', '问答', '基础'],
    isBuiltIn: true,
    usageCount: 0,
  },
  {
    name: 'RAG 检索增强评测',
    description: '评估 RAG 系统的检索质量和生成质量',
    category: EvalTemplateCategory.RAG,
    config: {
      promptTemplate: '基于以下检索到的上下文回答问题。\n\n问题：{{question}}\n\n检索到的上下文：\n{{contexts}}\n\n请基于上下文给出准确回答，如果上下文不足以回答问题，请说明。',
      metrics: ['context_precision', 'context_recall', 'faithfulness', 'answer_relevancy', 'noise_sensitivity'],
      datasetRequirements: {
        minCases: 20,
        requiredFields: ['question', 'contexts', 'expected_answer'],
      },
      evaluationCriteria: '评估检索质量（精度、召回）和生成质量（忠实度、相关性）',
    },
    variables: [
      { name: 'question', description: '问题内容', type: 'string', required: true },
      { name: 'contexts', description: '检索到的上下文列表', type: 'array', required: true },
    ],
    tags: ['RAG', '检索增强', '高级'],
    isBuiltIn: true,
    usageCount: 0,
  },
  {
    name: '代码生成评测',
    description: '评估模型生成代码的正确性、效率和可读性',
    category: EvalTemplateCategory.CODE,
    config: {
      promptTemplate: '请根据以下需求编写代码：\n\n需求：{{requirement}}\n\n编程语言：{{language}}\n\n要求：\n1. 代码要正确实现需求\n2. 代码要简洁易读\n3. 添加必要的注释\n4. 考虑边界情况',
      metrics: ['code_correctness', 'code_efficiency', 'code_readability'],
      datasetRequirements: {
        minCases: 15,
        requiredFields: ['requirement', 'expected_code'],
      },
      evaluationCriteria: '评估代码的功能正确性、执行效率和代码质量',
    },
    variables: [
      { name: 'requirement', description: '代码需求描述', type: 'string', required: true },
      { name: 'language', description: '编程语言', type: 'string', required: false, defaultValue: 'Python' },
    ],
    tags: ['代码', '编程', '技术'],
    isBuiltIn: true,
    usageCount: 0,
  },
  {
    name: '文本摘要评测',
    description: '评估模型生成摘要的质量',
    category: EvalTemplateCategory.SUMMARIZATION,
    config: {
      promptTemplate: '请为以下文本生成一个简洁的摘要：\n\n文本：\n{{text}}\n\n要求：\n1. 摘要要涵盖主要信息\n2. 摘要长度控制在原文的20%以内\n3. 保持关键信息不丢失',
      metrics: ['rouge_l', 'bert_score', 'content_coverage', 'conciseness'],
      datasetRequirements: {
        minCases: 10,
        requiredFields: ['text', 'reference_summary'],
      },
      evaluationCriteria: '评估摘要的信息覆盖度、简洁性和准确性',
    },
    variables: [
      { name: 'text', description: '原文内容', type: 'string', required: true },
    ],
    tags: ['摘要', '文本压缩', 'NLP'],
    isBuiltIn: true,
    usageCount: 0,
  },
  {
    name: '安全对齐评测',
    description: '评估模型的安全性和对齐程度',
    category: EvalTemplateCategory.SAFETY,
    config: {
      promptTemplate: '{{prompt}}',
      metrics: ['toxicity', 'bias', 'harmlessness', 'refusal_accuracy'],
      datasetRequirements: {
        minCases: 50,
        requiredFields: ['prompt', 'expected_behavior'],
      },
      evaluationCriteria: '评估模型拒绝有害请求的能力、输出安全性和偏见程度',
    },
    variables: [
      { name: 'prompt', description: '测试提示', type: 'string', required: true },
    ],
    tags: ['安全', '对齐', '红队'],
    isBuiltIn: true,
    usageCount: 0,
  },
  {
    name: '多轮对话评测',
    description: '评估模型在多轮对话中的表现',
    category: EvalTemplateCategory.CONVERSATION,
    config: {
      promptTemplate: '以下是一段对话历史：\n\n{{conversation_history}}\n\n用户最新问题：{{current_question}}\n\n请给出合适的回答，注意保持对话的连贯性。',
      metrics: ['coherence', 'engagement', 'topic_adherence', 'context_retention'],
      datasetRequirements: {
        minCases: 10,
        requiredFields: ['conversation_history', 'current_question'],
      },
      evaluationCriteria: '评估对话的连贯性、参与度、话题遵循度和上下文保持能力',
    },
    variables: [
      { name: 'conversation_history', description: '对话历史', type: 'array', required: true },
      { name: 'current_question', description: '当前问题', type: 'string', required: true },
    ],
    tags: ['对话', '多轮', '交互'],
    isBuiltIn: true,
    usageCount: 0,
  },
  {
    name: '翻译质量评测',
    description: '评估模型的翻译质量',
    category: EvalTemplateCategory.TRANSLATION,
    config: {
      promptTemplate: '请将以下文本从{{source_language}}翻译成{{target_language}}：\n\n原文：{{text}}\n\n要求：\n1. 翻译要准确\n2. 保持原文的语气和风格\n3. 符合目标语言的表达习惯',
      metrics: ['bleu', 'meteor', 'translation_accuracy', 'fluency'],
      datasetRequirements: {
        minCases: 20,
        requiredFields: ['text', 'reference_translation'],
      },
      evaluationCriteria: '评估翻译的准确性、流畅性和风格保持',
    },
    variables: [
      { name: 'text', description: '原文内容', type: 'string', required: true },
      { name: 'source_language', description: '源语言', type: 'string', required: true },
      { name: 'target_language', description: '目标语言', type: 'string', required: true },
    ],
    tags: ['翻译', '多语言', 'NLP'],
    isBuiltIn: true,
    usageCount: 0,
  },
  {
    name: '创意写作评测',
    description: '评估模型的创意写作能力',
    category: EvalTemplateCategory.CREATIVE,
    config: {
      promptTemplate: '请根据以下要求创作：\n\n创作类型：{{genre}}\n主题：{{theme}}\n要求：{{requirements}}\n\n请发挥创意，写出有吸引力的内容。',
      metrics: ['creativity', 'coherence', 'originality', 'engagement'],
      datasetRequirements: {
        minCases: 10,
        requiredFields: ['genre', 'theme'],
      },
      evaluationCriteria: '评估创意的原创性、内容的连贯性和吸引力',
    },
    variables: [
      { name: 'genre', description: '创作类型（诗歌/故事/散文等）', type: 'string', required: true },
      { name: 'theme', description: '主题', type: 'string', required: true },
      { name: 'requirements', description: '具体要求', type: 'string', required: false },
    ],
    tags: ['创意', '写作', '文学'],
    isBuiltIn: true,
    usageCount: 0,
  },
];

@Injectable()
export class EvalTemplateService {
  private templates: Map<string, EvalTemplate> = new Map();

  constructor(private prisma: PrismaService) {
    // 初始化内置模板
    this.initBuiltInTemplates();
  }

  private initBuiltInTemplates() {
    for (const template of BUILT_IN_TEMPLATES) {
      const id = `builtin_${template.name.toLowerCase().replace(/\s+/g, '_')}`;
      this.templates.set(id, {
        ...template,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // 获取所有模板
  async listTemplates(options?: {
    category?: EvalTemplateCategory;
    tags?: string[];
    includeBuiltIn?: boolean;
  }): Promise<EvalTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (options?.category) {
      templates = templates.filter(t => t.category === options.category);
    }
    if (options?.tags && options.tags.length > 0) {
      templates = templates.filter(t =>
        options.tags!.some(tag => t.tags.includes(tag)),
      );
    }
    if (options?.includeBuiltIn === false) {
      templates = templates.filter(t => !t.isBuiltIn);
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  // 获取模板详情
  async getTemplate(id: string): Promise<EvalTemplate | undefined> {
    return this.templates.get(id);
  }

  // 创建自定义模板
  async createTemplate(data: {
    name: string;
    description?: string;
    category: EvalTemplateCategory;
    config: TemplateConfig;
    variables?: TemplateVariable[];
    tags?: string[];
    createdBy?: string;
  }): Promise<EvalTemplate> {
    const id = `template_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const template: EvalTemplate = {
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      config: data.config,
      variables: data.variables || [],
      tags: data.tags || [],
      isBuiltIn: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy,
    };

    this.templates.set(id, template);
    return template;
  }

  // 更新模板
  async updateTemplate(id: string, updates: Partial<EvalTemplate>): Promise<EvalTemplate | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;
    if (template.isBuiltIn) throw new Error('Cannot modify built-in template');

    Object.assign(template, updates, { updatedAt: new Date() });
    return template;
  }

  // 删除模板
  async deleteTemplate(id: string): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;
    if (template.isBuiltIn) throw new Error('Cannot delete built-in template');

    return this.templates.delete(id);
  }

  // 实例化模板
  async instantiateTemplate(
    templateId: string,
    variables: Record<string, any>,
  ): Promise<InstantiatedTemplate> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    // 验证必填变量
    for (const v of template.variables) {
      if (v.required && !(v.name in variables)) {
        throw new Error(`Missing required variable: ${v.name}`);
      }
    }

    // 替换变量
    let prompt = template.config.promptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(placeholder, String(value));
    }

    // 增加使用次数
    template.usageCount++;

    return {
      templateId: template.id,
      templateName: template.name,
      prompt,
      metrics: template.config.metrics,
      variables,
      createdAt: new Date(),
    };
  }

  // 获取模板分类列表
  getCategories(): Array<{
    id: EvalTemplateCategory;
    name: string;
    description: string;
    templateCount: number;
  }> {
    const categoryInfo: Record<EvalTemplateCategory, { name: string; description: string }> = {
      [EvalTemplateCategory.QA]: { name: '问答评测', description: '评估问答系统的回答质量' },
      [EvalTemplateCategory.SUMMARIZATION]: { name: '摘要评测', description: '评估文本摘要生成质量' },
      [EvalTemplateCategory.TRANSLATION]: { name: '翻译评测', description: '评估翻译质量' },
      [EvalTemplateCategory.CODE]: { name: '代码评测', description: '评估代码生成质量' },
      [EvalTemplateCategory.CREATIVE]: { name: '创意写作', description: '评估创意写作能力' },
      [EvalTemplateCategory.SAFETY]: { name: '安全评测', description: '评估模型安全性' },
      [EvalTemplateCategory.RAG]: { name: 'RAG 评测', description: '评估检索增强生成系统' },
      [EvalTemplateCategory.CONVERSATION]: { name: '对话评测', description: '评估多轮对话能力' },
      [EvalTemplateCategory.CUSTOM]: { name: '自定义', description: '自定义评测模板' },
    };

    return Object.values(EvalTemplateCategory).map(cat => ({
      id: cat,
      name: categoryInfo[cat].name,
      description: categoryInfo[cat].description,
      templateCount: Array.from(this.templates.values()).filter(t => t.category === cat).length,
    }));
  }

  // 复制模板
  async duplicateTemplate(id: string, newName?: string): Promise<EvalTemplate> {
    const template = this.templates.get(id);
    if (!template) throw new Error('Template not found');

    const newId = `template_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newTemplate: EvalTemplate = {
      ...template,
      id: newId,
      name: newName || `${template.name} (副本)`,
      isBuiltIn: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(newId, newTemplate);
    return newTemplate;
  }

  // 导入模板
  async importTemplate(template: Omit<EvalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<EvalTemplate> {
    const id = `template_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const newTemplate: EvalTemplate = {
      ...template,
      id,
      isBuiltIn: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  // 导出模板
  async exportTemplate(id: string): Promise<Omit<EvalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>> {
    const template = this.templates.get(id);
    if (!template) throw new Error('Template not found');

    const { id: _, createdAt, updatedAt, usageCount, ...exportData } = template;
    return exportData;
  }
}
