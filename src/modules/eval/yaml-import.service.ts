// @ts-nocheck
import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { PrismaService } from '../../common/prisma/prisma.service';

// YAML 测试用例格式（兼容 Promptfoo）
export interface YamlTestSuite {
  description?: string;
  prompts: string[];
  providers: (string | YamlProvider)[];
  tests: YamlTestCase[];
  defaultTest?: {
    vars?: Record<string, string>;
    assert?: YamlAssert[];
  };
}

export interface YamlProvider {
  id: string;
  config?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    baseURL?: string;
    apiKey?: string;
  };
}

export interface YamlTestCase {
  description?: string;
  vars: Record<string, string>;
  assert?: YamlAssert[];
  tags?: string[];
}

export interface YamlAssert {
  type: string;
  value?: string | number | boolean;
  threshold?: number;
  weight?: number;
}

// 转换后的内部格式
export interface ImportedTestCase {
  name: string;
  description?: string;
  input: string;
  expectedOutput?: string;
  variables: Record<string, string>;
  assertions: {
    type: string;
    value?: any;
    threshold?: number;
  }[];
  tags: string[];
}

@Injectable()
export class YamlImportService {
  constructor(private prisma: PrismaService) {}

  // 解析 YAML 内容
  parseYaml(content: string): YamlTestSuite {
    try {
      // 使用 safeLoad 防止代码执行攻击
      const parsed = yaml.safeLoad(content) as YamlTestSuite;
      this.validateSuite(parsed);
      return parsed;
    } catch (e) {
      throw new Error(`YAML 解析失败: ${e.message}`);
    }
  }

  // 验证套件格式
  private validateSuite(suite: YamlTestSuite): void {
    if (!suite.prompts || !Array.isArray(suite.prompts) || suite.prompts.length === 0) {
      throw new Error('缺少 prompts 字段或 prompts 为空');
    }
    if (!suite.tests || !Array.isArray(suite.tests) || suite.tests.length === 0) {
      throw new Error('缺少 tests 字段或 tests 为空');
    }
  }

  // 将 YAML 套件转换为内部测试用例
  convertToTestCases(suite: YamlTestSuite): ImportedTestCase[] {
    const testCases: ImportedTestCase[] = [];
    const defaultVars = suite.defaultTest?.vars || {};
    const defaultAsserts = suite.defaultTest?.assert || [];

    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      
      // 合并默认变量
      const vars = { ...defaultVars, ...test.vars };
      
      // 合并默认断言
      const asserts = [...defaultAsserts, ...(test.assert || [])];

      // 生成输入（使用第一个 prompt 模板）
      let input = suite.prompts[0];
      for (const [key, value] of Object.entries(vars)) {
        input = input.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }

      // 提取期望输出（从断言中）
      let expectedOutput: string | undefined;
      const equalsAssert = asserts.find(a => a.type === 'equals' || a.type === 'contains');
      if (equalsAssert && typeof equalsAssert.value === 'string') {
        expectedOutput = equalsAssert.value;
      }

      testCases.push({
        name: test.description || `测试用例 ${i + 1}`,
        description: test.description,
        input,
        expectedOutput,
        variables: vars,
        assertions: asserts.map(a => ({
          type: a.type,
          value: a.value,
          threshold: a.threshold,
        })),
        tags: test.tags || [],
      });
    }

    return testCases;
  }

  // 导入到数据集
  async importToDataset(
    suite: YamlTestSuite,
    datasetName: string,
    datasetDescription?: string
  ): Promise<{ datasetId: string; testCaseCount: number }> {
    // 创建数据集
    const dataset = await this.prisma.dataset.create({
      data: {
        name: datasetName,
        description: datasetDescription || suite.description || '从 YAML 导入的数据集',
        category: 'yaml-import',
      },
    });

    // 转换测试用例
    const testCases = this.convertToTestCases(suite);

    // 批量创建测试用例
    for (const tc of testCases) {
      await this.prisma.testCase.create({
        data: {
          datasetId: dataset.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput || null,
          category: tc.tags[0] || 'default',
          difficulty: 'medium',
          metadata: JSON.stringify({
            description: tc.description,
            variables: tc.variables,
            assertions: tc.assertions,
            tags: tc.tags,
          }),
        },
      });
    }

    return {
      datasetId: dataset.id,
      testCaseCount: testCases.length,
    };
  }

  // 生成示例 YAML 模板
  generateSampleTemplate(): string {
    return `# Promptfoo 格式的测试套件
description: 示例测试套件

# Prompt 模板（支持 {{variable}} 占位符）
prompts:
  - |
    你是一个客服助手。请回答用户的问题。
    用户问题: {{question}}
    产品类别: {{category}}

# 模型配置
providers:
  - id: openai:gpt-4
    config:
      temperature: 0.7
      max_tokens: 1000

# 测试用例
tests:
  - description: 退货政策咨询
    vars:
      question: 你们的退货政策是什么？
      category: 电商
    assert:
      - type: contains
        value: 退货
      - type: llm-rubric
        value: 回答应该包含退货期限和条件
    tags:
      - 客服
      - 政策

  - description: 产品推荐
    vars:
      question: 推荐一款适合学生的笔记本电脑
      category: 电子产品
    assert:
      - type: contains
        value: 笔记本
      - type: javascript
        value: output.length > 100
    tags:
      - 客服
      - 推荐

  - description: 投诉处理
    vars:
      question: 我收到的商品有质量问题，非常不满意！
      category: 售后
    assert:
      - type: llm-rubric
        value: 回答应该表达歉意并提供解决方案
      - type: not-contains
        value: 这不是我们的责任
    tags:
      - 客服
      - 投诉

# 默认测试配置
defaultTest:
  vars:
    company: 示例公司
  assert:
    - type: not-contains
      value: 我不知道
`;
  }

  // 验证 YAML 格式
  validateYaml(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const suite = this.parseYaml(content);
      
      // 检查 prompts
      if (!suite.prompts || suite.prompts.length === 0) {
        errors.push('至少需要一个 prompt 模板');
      }

      // 检查 tests
      if (!suite.tests || suite.tests.length === 0) {
        errors.push('至少需要一个测试用例');
      }

      // 检查每个测试用例
      suite.tests?.forEach((test, i) => {
        if (!test.vars || Object.keys(test.vars).length === 0) {
          errors.push(`测试用例 ${i + 1} 缺少 vars 变量`);
        }
      });

      // 检查 prompt 中的变量是否都有定义
      const promptVars = new Set<string>();
      suite.prompts?.forEach(prompt => {
        const matches = prompt.match(/\{\{(\w+)\}\}/g) || [];
        matches.forEach(m => promptVars.add(m.slice(2, -2)));
      });

      const definedVars = new Set(Object.keys(suite.defaultTest?.vars || {}));
      suite.tests?.forEach(test => {
        Object.keys(test.vars || {}).forEach(v => definedVars.add(v));
      });

      for (const v of promptVars) {
        if (!definedVars.has(v)) {
          errors.push(`变量 "{{${v}}}" 在 prompt 中使用但未定义`);
        }
      }
    } catch (e) {
      errors.push(`解析错误: ${e.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
