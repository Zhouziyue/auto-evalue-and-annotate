// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 节点类型
export enum WorkflowNodeType {
  TRIGGER = 'trigger',           // 触发器
  DATASET_LOAD = 'dataset_load', // 加载数据集
  EVAL_RUN = 'eval_run',         // 执行评测
  TRANSFORM = 'transform',       // 数据转换
  FILTER = 'filter',             // 过滤
  AGGREGATE = 'aggregate',       // 聚合
  BRANCH = 'branch',             // 条件分支
  PARALLEL = 'parallel',         // 并行执行
  MERGE = 'merge',               // 合并
  NOTIFY = 'notify',             // 通知
  EXPORT = 'export',             // 导出
  QUALITY_GATE = 'quality_gate', // 质量门禁
  END = 'end',                   // 结束
}

// 节点状态
export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// 工作流节点
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  config: Record<string, any>;
  inputs: string[];  // 输入端口（连接其他节点 id）
  outputs: string[]; // 输出端口
  position?: { x: number; y: number }; // 画布位置
}

// 工作流定义
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: Array<{ from: string; to: string; condition?: string }>;
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 工作流执行
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  nodeExecutions: NodeExecution[];
  context: Record<string, any>;
  error?: string;
  duration?: number;
}

// 节点执行记录
export interface NodeExecution {
  nodeId: string;
  nodeName: string;
  status: NodeStatus;
  startedAt?: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
}

@Injectable()
export class WorkflowEngineService {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {}

  // 创建工作流
  async createWorkflow(data: {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: Array<{ from: string; to: string; condition?: string }>;
    variables?: Record<string, any>;
  }): Promise<WorkflowDefinition> {
    // 验证工作流结构
    this.validateWorkflow(data.nodes, data.edges);

    const id = `wf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const workflow: WorkflowDefinition = {
      id,
      name: data.name,
      description: data.description,
      version: '1.0.0',
      nodes: data.nodes,
      edges: data.edges,
      variables: data.variables || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  // 验证工作流结构
  private validateWorkflow(nodes: WorkflowNode[], edges: Array<{ from: string; to: string }>): void {
    const nodeIds = new Set(nodes.map(n => n.id));

    // 检查边引用的节点是否存在
    for (const edge of edges) {
      if (!nodeIds.has(edge.from)) throw new Error(`Edge references unknown node: ${edge.from}`);
      if (!nodeIds.has(edge.to)) throw new Error(`Edge references unknown node: ${edge.to}`);
    }

    // 检查是否有触发器节点
    const hasTrigger = nodes.some(n => n.type === WorkflowNodeType.TRIGGER);
    if (!hasTrigger) throw new Error('Workflow must have a trigger node');

    // 检查是否有结束节点
    const hasEnd = nodes.some(n => n.type === WorkflowNodeType.END);
    if (!hasEnd) throw new Error('Workflow must have an end node');

    // 检查循环依赖
    this.checkCycles(nodes, edges);
  }

  // 检查循环依赖
  private checkCycles(nodes: WorkflowNode[], edges: Array<{ from: string; to: string }>): void {
    const adj = new Map<string, string[]>();
    for (const edge of edges) {
      if (!adj.has(edge.from)) adj.set(edge.from, []);
      adj.get(edge.from)!.push(edge.to);
    }

    const visited = new Set<string>();
    const recursion = new Set<string>();

    const dfs = (node: string): boolean => {
      if (recursion.has(node)) return true; // cycle detected
      if (visited.has(node)) return false;
      visited.add(node);
      recursion.add(node);
      for (const next of (adj.get(node) || [])) {
        if (dfs(next)) return true;
      }
      recursion.delete(node);
      return false;
    };

    for (const node of nodes) {
      if (dfs(node.id)) throw new Error('Workflow contains a cycle');
    }
  }

  // 执行工作流
  async execute(workflowId: string, input?: Record<string, any>): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      workflowId,
      status: 'running',
      startedAt: new Date(),
      nodeExecutions: [],
      context: { ...workflow.variables, ...input },
    };

    this.executions.set(execution.id, execution);

    try {
      // 拓扑排序
      const sortedNodes = this.topologicalSort(workflow.nodes, workflow.edges);

      // 按顺序执行节点
      for (const node of sortedNodes) {
        const nodeExec = await this.executeNode(node, workflow, execution);
        execution.nodeExecutions.push(nodeExec);

        if (nodeExec.status === NodeStatus.FAILED) {
          execution.status = 'failed';
          execution.error = `Node ${node.name} failed: ${nodeExec.error}`;
          break;
        }

        if (nodeExec.status === NodeStatus.SKIPPED) continue;
      }

      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
    }

    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt!.getTime();
    return execution;
  }

  // 拓扑排序
  private topologicalSort(nodes: WorkflowNode[], edges: Array<{ from: string; to: string }>): WorkflowNode[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adj.set(node.id, []);
    }

    for (const edge of edges) {
      adj.get(edge.from)!.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(id);
    }

    const sorted: WorkflowNode[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      sorted.push(nodeMap.get(id)!);
      for (const next of adj.get(id) || []) {
        inDegree.set(next, inDegree.get(next)! - 1);
        if (inDegree.get(next) === 0) queue.push(next);
      }
    }

    return sorted;
  }

  // 执行单个节点
  private async executeNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
  ): Promise<NodeExecution> {
    const nodeExec: NodeExecution = {
      nodeId: node.id,
      nodeName: node.name,
      status: NodeStatus.RUNNING,
      startedAt: new Date(),
    };

    try {
      // 收集输入
      const input = this.collectNodeInput(node, workflow, execution);
      nodeExec.input = input;

      // 根据类型执行
      let output: any;
      switch (node.type) {
        case WorkflowNodeType.TRIGGER:
          output = execution.context;
          break;
        case WorkflowNodeType.DATASET_LOAD:
          output = await this.executeDatasetLoad(node.config, execution.context);
          break;
        case WorkflowNodeType.EVAL_RUN:
          output = await this.executeEvalRun(node.config, input, execution.context);
          break;
        case WorkflowNodeType.TRANSFORM:
          output = this.executeTransform(node.config, input);
          break;
        case WorkflowNodeType.FILTER:
          output = this.executeFilter(node.config, input);
          break;
        case WorkflowNodeType.AGGREGATE:
          output = this.executeAggregate(node.config, input);
          break;
        case WorkflowNodeType.BRANCH:
          output = this.executeBranch(node.config, input);
          break;
        case WorkflowNodeType.PARALLEL:
          output = await this.executeParallel(node.config, input, workflow, execution);
          break;
        case WorkflowNodeType.MERGE:
          output = this.executeMerge(input);
          break;
        case WorkflowNodeType.NOTIFY:
          output = await this.executeNotify(node.config, input);
          break;
        case WorkflowNodeType.EXPORT:
          output = await this.executeExport(node.config, input);
          break;
        case WorkflowNodeType.QUALITY_GATE:
          output = await this.executeQualityGate(node.config, input);
          break;
        case WorkflowNodeType.END:
          output = { completed: true, summary: input };
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      nodeExec.output = output;
      nodeExec.status = NodeStatus.COMPLETED;

      // 存储到上下文
      execution.context[`node_${node.id}_output`] = output;
    } catch (error) {
      nodeExec.status = NodeStatus.FAILED;
      nodeExec.error = error.message;
    }

    nodeExec.completedAt = new Date();
    nodeExec.duration = nodeExec.completedAt.getTime() - nodeExec.startedAt!.getTime();
    return nodeExec;
  }

  // 收集节点输入
  private collectNodeInput(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
  ): any {
    const inputs: any[] = [];
    for (const inputNodeId of node.inputs) {
      const key = `node_${inputNodeId}_output`;
      if (execution.context[key] !== undefined) {
        inputs.push(execution.context[key]);
      }
    }
    return inputs.length === 1 ? inputs[0] : inputs;
  }

  // 节点类型执行实现
  private async executeDatasetLoad(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    return {
      dataset: config.datasetId || 'default',
      items: config.mockItems || [],
      loadedAt: new Date(),
    };
  }

  private async executeEvalRun(config: Record<string, any>, input: any, context: Record<string, any>): Promise<any> {
    return {
      evalType: config.evalType || 'default',
      metrics: config.metrics || [],
      results: [{ score: 0.85, metric: 'accuracy' }],
      executedAt: new Date(),
    };
  }

  private executeTransform(config: Record<string, any>, input: any): any {
    if (Array.isArray(input)) {
      return input.map(item => {
        if (config.mapping) {
          const transformed: any = {};
          for (const [key, source] of Object.entries(config.mapping)) {
            transformed[key] = item[source as string];
          }
          return transformed;
        }
        return item;
      });
    }
    return input;
  }

  private executeFilter(config: Record<string, any>, input: any): any {
    if (!Array.isArray(input)) return input;
    const { field, operator, value } = config;
    return input.filter(item => {
      switch (operator) {
        case 'eq': return item[field] === value;
        case 'gt': return item[field] > value;
        case 'lt': return item[field] < value;
        case 'contains': return String(item[field]).includes(value);
        default: return true;
      }
    });
  }

  private executeAggregate(config: Record<string, any>, input: any): any {
    if (!Array.isArray(input)) return { result: input };
    const { groupBy, metric, fn } = config;
    const groups = new Map<string, number[]>();

    for (const item of input) {
      const key = groupBy ? item[groupBy] : 'all';
      if (!groups.has(key)) groups.set(key, []);
      if (typeof item[metric] === 'number') groups.get(key)!.push(item[metric]);
    }

    const result: Record<string, number> = {};
    for (const [key, values] of groups.entries()) {
      switch (fn) {
        case 'avg': result[key] = values.reduce((a, b) => a + b, 0) / values.length; break;
        case 'sum': result[key] = values.reduce((a, b) => a + b, 0); break;
        case 'max': result[key] = Math.max(...values); break;
        case 'min': result[key] = Math.min(...values); break;
        case 'count': result[key] = values.length; break;
      }
    }
    return result;
  }

  private executeBranch(config: Record<string, any>, input: any): any {
    const { conditions } = config;
    for (const cond of conditions || []) {
      const { field, operator, value } = cond;
      let match = false;
      switch (operator) {
        case 'eq': match = input?.[field] === value; break;
        case 'gt': match = input?.[field] > value; break;
        case 'lt': match = input?.[field] < value; break;
        case 'gte': match = input?.[field] >= value; break;
        case 'lte': match = input?.[field] <= value; break;
      }
      if (match) return { branch: cond.target, data: input };
    }
    return { branch: config.default || 'default', data: input };
  }

  private async executeParallel(
    config: Record<string, any>,
    input: any,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
  ): Promise<any> {
    const parallelNodes = config.nodes || [];
    const results = await Promise.all(
      parallelNodes.map(async (nodeId: string) => {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) return null;
        return this.executeNode(node, workflow, execution);
      }),
    );
    return results.filter(Boolean);
  }

  private executeMerge(input: any): any {
    if (Array.isArray(input)) {
      return input.flat();
    }
    return input;
  }

  private async executeNotify(config: Record<string, any>, input: any): Promise<any> {
    return {
      channel: config.channel || 'default',
      message: config.message || 'Workflow notification',
      recipients: config.recipients || [],
      sentAt: new Date(),
      data: input,
    };
  }

  private async executeExport(config: Record<string, any>, input: any): Promise<any> {
    return {
      format: config.format || 'json',
      data: input,
      exportedAt: new Date(),
    };
  }

  private async executeQualityGate(config: Record<string, any>, input: any): Promise<any> {
    const thresholds = config.thresholds || {};
    const results: Record<string, { passed: boolean; value: number; threshold: number }> = {};

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const value = input?.[metric] || 0;
      results[metric] = {
        passed: value >= (threshold as number),
        value,
        threshold: threshold as number,
      };
    }

    const allPassed = Object.values(results).every(r => r.passed);
    return { passed: allPassed, results, data: input };
  }

  // 获取工作流列表
  async listWorkflows(): Promise<WorkflowDefinition[]> {
    return Array.from(this.workflows.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取工作流详情
  async getWorkflow(id: string): Promise<WorkflowDefinition | undefined> {
    return this.workflows.get(id);
  }

  // 更新工作流
  async updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    if (updates.nodes || updates.edges) {
      this.validateWorkflow(updates.nodes || workflow.nodes, updates.edges || workflow.edges);
    }

    Object.assign(workflow, updates, { updatedAt: new Date() });
    return workflow;
  }

  // 删除工作流
  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // 获取执行列表
  async listExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    let execs = Array.from(this.executions.values());
    if (workflowId) execs = execs.filter(e => e.workflowId === workflowId);
    return execs.sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  // 获取执行详情
  async getExecution(id: string): Promise<WorkflowExecution | undefined> {
    return this.executions.get(id);
  }

  // 取消执行
  async cancelExecution(id: string): Promise<WorkflowExecution | undefined> {
    const execution = this.executions.get(id);
    if (!execution) return undefined;
    if (execution.status === 'running') {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
    }
    return execution;
  }

  // 获取内置模板
  getBuiltinTemplates(): Array<{ name: string; description: string; nodes: WorkflowNode[]; edges: any[] }> {
    return [
      {
        name: '基础评测流程',
        description: '加载数据集 -> 执行评测 -> 聚合结果 -> 导出',
        nodes: [
          { id: 't1', type: WorkflowNodeType.TRIGGER, name: '开始', config: {}, inputs: [], outputs: ['dl1'] },
          { id: 'dl1', type: WorkflowNodeType.DATASET_LOAD, name: '加载数据集', config: {}, inputs: ['t1'], outputs: ['ev1'] },
          { id: 'ev1', type: WorkflowNodeType.EVAL_RUN, name: '执行评测', config: {}, inputs: ['dl1'], outputs: ['ag1'] },
          { id: 'ag1', type: WorkflowNodeType.AGGREGATE, name: '聚合结果', config: {}, inputs: ['ev1'], outputs: ['ex1'] },
          { id: 'ex1', type: WorkflowNodeType.EXPORT, name: '导出报告', config: {}, inputs: ['ag1'], outputs: ['e1'] },
          { id: 'e1', type: WorkflowNodeType.END, name: '结束', config: {}, inputs: ['ex1'], outputs: [] },
        ],
        edges: [
          { from: 't1', to: 'dl1' }, { from: 'dl1', to: 'ev1' },
          { from: 'ev1', to: 'ag1' }, { from: 'ag1', to: 'ex1' }, { from: 'ex1', to: 'e1' },
        ],
      },
      {
        name: '质量门禁流程',
        description: '评测 -> 质量门禁 -> 通过则通知/失败则告警',
        nodes: [
          { id: 't1', type: WorkflowNodeType.TRIGGER, name: '开始', config: {}, inputs: [], outputs: ['ev1'] },
          { id: 'ev1', type: WorkflowNodeType.EVAL_RUN, name: '执行评测', config: {}, inputs: ['t1'], outputs: ['qg1'] },
          { id: 'qg1', type: WorkflowNodeType.QUALITY_GATE, name: '质量门禁', config: {}, inputs: ['ev1'], outputs: ['br1'] },
          { id: 'br1', type: WorkflowNodeType.BRANCH, name: '分支判断', config: {}, inputs: ['qg1'], outputs: ['n1', 'n2'] },
          { id: 'n1', type: WorkflowNodeType.NOTIFY, name: '通过通知', config: {}, inputs: ['br1'], outputs: ['e1'] },
          { id: 'n2', type: WorkflowNodeType.NOTIFY, name: '失败告警', config: {}, inputs: ['br1'], outputs: ['e1'] },
          { id: 'e1', type: WorkflowNodeType.END, name: '结束', config: {}, inputs: ['n1', 'n2'], outputs: [] },
        ],
        edges: [
          { from: 't1', to: 'ev1' }, { from: 'ev1', to: 'qg1' }, { from: 'qg1', to: 'br1' },
          { from: 'br1', to: 'n1', condition: 'passed' }, { from: 'br1', to: 'n2', condition: 'failed' },
          { from: 'n1', to: 'e1' }, { from: 'n2', to: 'e1' },
        ],
      },
    ];
  }
}
