// @ts-nocheck
import { Injectable } from '@nestjs/common';

// Prompt 版本状态
export enum PromptVersionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

// Prompt 版本
export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  variables: string[];
  description?: string;
  status: PromptVersionStatus;
  tags: string[];
  metadata: Record<string, any>;
  testResults?: {
    total: number;
    passed: number;
    avgScore: number;
  };
  createdAt: Date;
  createdBy: string;
  activatedAt?: Date;
}

// Prompt 定义
export interface PromptDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  currentVersionId?: string;
  versions: PromptVersion[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Prompt 测试用例
export interface PromptTestCase {
  id: string;
  input: Record<string, any>;
  expectedOutput?: string;
  expectedScore?: number;
  tags: string[];
}

// Prompt 测试结果
export interface PromptTestResult {
  id: string;
  promptId: string;
  versionId: string;
  testCaseId: string;
  output: string;
  score: number;
  latency: number;
  passed: boolean;
  timestamp: Date;
}

@Injectable()
export class PromptVersionService {
  private prompts: Map<string, PromptDefinition> = new Map();
  private testCases: Map<string, PromptTestCase[]> = new Map();
  private testResults: PromptTestResult[] = [];

  constructor() {}

  // 创建 Prompt
  async createPrompt(data: {
    name: string;
    description?: string;
    category: string;
    content: string;
    tags?: string[];
    createdBy: string;
  }): Promise<PromptDefinition> {
    const id = `prompt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const variables = this.extractVariables(data.content);
    const versionId = `ver_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const firstVersion: PromptVersion = {
      id: versionId,
      promptId: id,
      version: 1,
      content: data.content,
      variables,
      status: PromptVersionStatus.ACTIVE,
      tags: data.tags || [],
      metadata: {},
      createdAt: new Date(),
      createdBy: data.createdBy,
      activatedAt: new Date(),
    };

    const prompt: PromptDefinition = {
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      currentVersionId: versionId,
      versions: [firstVersion],
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy,
    };

    this.prompts.set(id, prompt);
    return prompt;
  }

  // 创建新版本
  async createVersion(promptId: string, data: {
    content: string;
    description?: string;
    tags?: string[];
    createdBy: string;
  }): Promise<PromptVersion> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error('Prompt not found');

    const lastVersion = prompt.versions[prompt.versions.length - 1];
    const versionNum = lastVersion.version + 1;
    const versionId = `ver_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const version: PromptVersion = {
      id: versionId,
      promptId,
      version: versionNum,
      content: data.content,
      variables: this.extractVariables(data.content),
      description: data.description,
      status: PromptVersionStatus.DRAFT,
      tags: data.tags || [],
      metadata: {},
      createdAt: new Date(),
      createdBy: data.createdBy,
    };

    prompt.versions.push(version);
    prompt.updatedAt = new Date();
    return version;
  }

  // 激活版本
  async activateVersion(promptId: string, versionId: string): Promise<PromptVersion | undefined> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return undefined;

    // 停用当前版本
    for (const v of prompt.versions) {
      if (v.status === PromptVersionStatus.ACTIVE) {
        v.status = PromptVersionStatus.ARCHIVED;
      }
    }

    // 激活新版本
    const version = prompt.versions.find(v => v.id === versionId);
    if (!version) return undefined;

    version.status = PromptVersionStatus.ACTIVE;
    version.activatedAt = new Date();
    prompt.currentVersionId = versionId;
    prompt.updatedAt = new Date();

    return version;
  }

  // 回滚到上一版本
  async rollbackVersion(promptId: string): Promise<PromptVersion | undefined> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return undefined;

    const activeVersion = prompt.versions.find(v => v.status === PromptVersionStatus.ACTIVE);
    if (!activeVersion) return undefined;

    const activeIdx = prompt.versions.indexOf(activeVersion);
    if (activeIdx <= 0) return undefined;

    const prevVersion = prompt.versions[activeIdx - 1];
    return this.activateVersion(promptId, prevVersion.id);
  }

  // 对比两个版本
  compareVersions(promptId: string, versionIdA: string, versionIdB: string): {
    versionA: PromptVersion;
    versionB: PromptVersion;
    diff: {
      addedLines: number;
      removedLines: number;
      changedLines: number;
      variableChanges: { added: string[]; removed: string[] };
    };
  } | null {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return null;

    const vA = prompt.versions.find(v => v.id === versionIdA);
    const vB = prompt.versions.find(v => v.id === versionIdB);
    if (!vA || !vB) return null;

    const linesA = vA.content.split('\n');
    const linesB = vB.content.split('\n');
    const setA = new Set(linesA);
    const setB = new Set(linesB);

    const added = linesB.filter(l => !setA.has(l)).length;
    const removed = linesA.filter(l => !setB.has(l)).length;
    const changed = Math.abs(added - removed);

    const varsA = new Set(vA.variables);
    const varsB = new Set(vB.variables);
    const addedVars = vB.variables.filter(v => !varsA.has(v));
    const removedVars = vA.variables.filter(v => !varsB.has(v));

    return {
      versionA: vA,
      versionB: vB,
      diff: {
        addedLines: added,
        removedLines: removed,
        changedLines: changed,
        variableChanges: { added: addedVars, removed: removedVars },
      },
    };
  }

  // 提取变量
  private extractVariables(content: string): string[] {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  }

  // 获取 Prompt 列表
  async listPrompts(category?: string): Promise<PromptDefinition[]> {
    let prompts = Array.from(this.prompts.values());
    if (category) prompts = prompts.filter(p => p.category === category);
    return prompts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // 获取 Prompt 详情
  async getPrompt(id: string): Promise<PromptDefinition | undefined> {
    return this.prompts.get(id);
  }

  // 获取当前激活版本
  async getActiveVersion(promptId: string): Promise<PromptVersion | undefined> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return undefined;
    return prompt.versions.find(v => v.id === prompt.currentVersionId);
  }

  // 获取版本历史
  async getVersionHistory(promptId: string): Promise<PromptVersion[]> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return [];
    return prompt.versions.sort((a, b) => b.version - a.version);
  }

  // 添加测试用例
  async addTestCase(promptId: string, data: {
    input: Record<string, any>;
    expectedOutput?: string;
    expectedScore?: number;
    tags?: string[];
  }): Promise<PromptTestCase> {
    const testCase: PromptTestCase = {
      id: `tc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      input: data.input,
      expectedOutput: data.expectedOutput,
      expectedScore: data.expectedScore,
      tags: data.tags || [],
    };

    if (!this.testCases.has(promptId)) this.testCases.set(promptId, []);
    this.testCases.get(promptId)!.push(testCase);
    return testCase;
  }

  // 运行测试
  async runTests(promptId: string, versionId: string): Promise<{
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    results: PromptTestResult[];
  }> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error('Prompt not found');

    const version = prompt.versions.find(v => v.id === versionId);
    if (!version) throw new Error('Version not found');

    const cases = this.testCases.get(promptId) || [];
    const results: PromptTestResult[] = [];

    for (const tc of cases) {
      // 简化：模拟执行
      let output = version.content;
      for (const [key, value] of Object.entries(tc.input)) {
        output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }

      const score = tc.expectedScore || Math.random() * 0.4 + 0.6;
      const passed = tc.expectedOutput ? output.includes(tc.expectedOutput) : score >= 0.6;

      const result: PromptTestResult = {
        id: `tr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        promptId,
        versionId,
        testCaseId: tc.id,
        output,
        score,
        latency: Math.random() * 1000,
        passed,
        timestamp: new Date(),
      };

      results.push(result);
      this.testResults.push(result);
    }

    const passedCount = results.filter(r => r.passed).length;
    const avgScore = results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0;

    // 更新版本测试结果
    version.testResults = {
      total: results.length,
      passed: passedCount,
      avgScore,
    };

    return {
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      avgScore,
      results,
    };
  }

  // 删除 Prompt
  async deletePrompt(id: string): Promise<boolean> {
    this.testCases.delete(id);
    return this.prompts.delete(id);
  }

  // 渲染 Prompt（变量替换）
  renderPrompt(promptId: string, variables: Record<string, any>): { rendered: string; version: number } | null {
    const prompt = this.prompts.get(promptId);
    if (!prompt) return null;

    const activeVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
    if (!activeVersion) return null;

    let rendered = activeVersion.content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }

    return { rendered, version: activeVersion.version };
  }
}
