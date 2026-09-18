// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 血缘节点类型
export enum LineageNodeType {
  DATASET = 'dataset',
  MODEL = 'model',
  EVAL_RUN = 'eval_run',
  METRIC = 'metric',
  PROMPT = 'prompt',
  PIPELINE = 'pipeline',
  REPORT = 'report',
  ARTIFACT = 'artifact',
}

// 血缘节点
export interface LineageNode {
  id: string;
  type: LineageNodeType;
  name: string;
  metadata: Record<string, any>;
  createdAt: Date;
  tags: string[];
}

// 血缘边
export interface LineageEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: 'produced_by' | 'consumed_by' | 'derived_from' | 'triggered' | 'contains';
  metadata?: Record<string, any>;
  createdAt: Date;
}

// 血缘图
export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  depth: number;
  rootNodeId?: string;
}

// 血缘追踪事件
export interface LineageEvent {
  id: string;
  nodeId: string;
  action: 'created' | 'updated' | 'consumed' | 'produced' | 'linked';
  details: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

@Injectable()
export class DataLineageService {
  constructor(private prisma: PrismaService) {}

  private nodes: Map<string, LineageNode> = new Map();
  private edges: Map<string, LineageEdge> = new Map();
  private events: LineageEvent[] = [];

  // 注册节点
  async registerNode(data: {
    type: LineageNodeType;
    name: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }): Promise<LineageNode> {
    const id = `lineage_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const node: LineageNode = {
      id,
      type: data.type,
      name: data.name,
      metadata: data.metadata || {},
      createdAt: new Date(),
      tags: data.tags || [],
    };
    this.nodes.set(id, node);
    this.addEvent(id, 'created', { type: data.type, name: data.name });
    return node;
  }

  // 创建边（关联）
  async createEdge(data: {
    sourceId: string;
    targetId: string;
    relation: LineageEdge['relation'];
    metadata?: Record<string, any>;
  }): Promise<LineageEdge> {
    if (!this.nodes.has(data.sourceId)) throw new Error(`Source node not found: ${data.sourceId}`);
    if (!this.nodes.has(data.targetId)) throw new Error(`Target node not found: ${data.targetId}`);

    const id = `edge_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const edge: LineageEdge = {
      id,
      sourceId: data.sourceId,
      targetId: data.targetId,
      relation: data.relation,
      metadata: data.metadata,
      createdAt: new Date(),
    };
    this.edges.set(id, edge);
    this.addEvent(data.sourceId, 'linked', { targetId: data.targetId, relation: data.relation });
    return edge;
  }

  // 获取节点的上游（谁产生了它）
  async getUpstream(nodeId: string, depth: number = 3): Promise<LineageGraph> {
    const visited = new Set<string>();
    const resultNodes: LineageNode[] = [];
    const resultEdges: LineageEdge[] = [];

    const traverse = (id: string, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node) resultNodes.push(node);

      // 找到指向当前节点的边（上游）
      for (const edge of this.edges.values()) {
        if (edge.targetId === id) {
          resultEdges.push(edge);
          traverse(edge.sourceId, currentDepth + 1);
        }
      }
    };

    traverse(nodeId, 0);
    return { nodes: resultNodes, edges: resultEdges, depth, rootNodeId: nodeId };
  }

  // 获取节点的下游（它影响了谁）
  async getDownstream(nodeId: string, depth: number = 3): Promise<LineageGraph> {
    const visited = new Set<string>();
    const resultNodes: LineageNode[] = [];
    const resultEdges: LineageEdge[] = [];

    const traverse = (id: string, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node) resultNodes.push(node);

      // 找到从当前节点出发的边（下游）
      for (const edge of this.edges.values()) {
        if (edge.sourceId === id) {
          resultEdges.push(edge);
          traverse(edge.targetId, currentDepth + 1);
        }
      }
    };

    traverse(nodeId, 0);
    return { nodes: resultNodes, edges: resultEdges, depth, rootNodeId: nodeId };
  }

  // 获取完整血缘图
  async getFullLineage(nodeId: string, upstreamDepth: number = 2, downstreamDepth: number = 2): Promise<LineageGraph> {
    const upstream = await this.getUpstream(nodeId, upstreamDepth);
    const downstream = await this.getDownstream(nodeId, downstreamDepth);

    // 合并
    const nodeMap = new Map<string, LineageNode>();
    const edgeMap = new Map<string, LineageEdge>();

    for (const n of [...upstream.nodes, ...downstream.nodes]) nodeMap.set(n.id, n);
    for (const e of [...upstream.edges, ...downstream.edges]) edgeMap.set(e.id, e);

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
      depth: upstreamDepth + downstreamDepth,
      rootNodeId: nodeId,
    };
  }

  // 获取节点详情
  async getNode(id: string): Promise<LineageNode | undefined> {
    return this.nodes.get(id);
  }

  // 获取节点列表
  async listNodes(type?: LineageNodeType, tags?: string[]): Promise<LineageNode[]> {
    let nodes = Array.from(this.nodes.values());
    if (type) nodes = nodes.filter(n => n.type === type);
    if (tags?.length) nodes = nodes.filter(n => tags.some(t => n.tags.includes(t)));
    return nodes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取节点的事件历史
  async getNodeEvents(nodeId: string, limit: number = 50): Promise<LineageEvent[]> {
    return this.events
      .filter(e => e.nodeId === nodeId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // 追踪评测运行的完整血缘
  async traceEvalRun(evalRunId: string): Promise<{
    dataset?: LineageNode;
    model?: LineageNode;
    prompt?: LineageNode;
    metrics: LineageNode[];
    reports: LineageNode[];
    graph: LineageGraph;
  }> {
    const graph = await this.getFullLineage(evalRunId, 3, 3);

    const dataset = graph.nodes.find(n => n.type === LineageNodeType.DATASET);
    const model = graph.nodes.find(n => n.type === LineageNodeType.MODEL);
    const prompt = graph.nodes.find(n => n.type === LineageNodeType.PROMPT);
    const metrics = graph.nodes.filter(n => n.type === LineageNodeType.METRIC);
    const reports = graph.nodes.filter(n => n.type === LineageNodeType.REPORT);

    return { dataset, model, prompt, metrics, reports, graph };
  }

  // 影响分析：如果某个数据集变更，影响哪些评测结果
  async impactAnalysis(nodeId: string): Promise<{
    affectedNodes: LineageNode[];
    affectedEvalRuns: LineageNode[];
    affectedReports: LineageNode[];
    severity: 'low' | 'medium' | 'high';
  }> {
    const downstream = await this.getDownstream(nodeId, 5);

    const affectedEvalRuns = downstream.nodes.filter(n => n.type === LineageNodeType.EVAL_RUN);
    const affectedReports = downstream.nodes.filter(n => n.type === LineageNodeType.REPORT);

    const severity = affectedEvalRuns.length > 10 ? 'high' : affectedEvalRuns.length > 3 ? 'medium' : 'low';

    return {
      affectedNodes: downstream.nodes,
      affectedEvalRuns,
      affectedReports,
      severity,
    };
  }

  // 自动从 Prisma 同步血缘
  async syncFromEvalRun(evalRunId: string): Promise<LineageGraph> {
    const run = await this.prisma.evalRun.findUnique({
      where: { id: evalRunId },
      include: { results: true, skill: true },
    });

    if (!run) throw new Error('EvalRun not found');

    // 注册评测运行节点
    const runNode = await this.registerNode({
      type: LineageNodeType.EVAL_RUN,
      name: `EvalRun ${evalRunId.substring(0, 8)}`,
      metadata: { evalRunId, status: run.status },
      tags: ['auto-synced'],
    });

    // 注册模型节点
    if (run.skill) {
      const modelNode = await this.registerNode({
        type: LineageNodeType.MODEL,
        name: run.skill.name,
        metadata: { skillId: run.skillId },
        tags: ['model'],
      });
      await this.createEdge({ sourceId: modelNode.id, targetId: runNode.id, relation: 'produced_by' });
    }

    return this.getFullLineage(runNode.id, 2, 2);
  }

  // 添加事件
  private addEvent(nodeId: string, action: LineageEvent['action'], details: Record<string, any>): void {
    this.events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      nodeId,
      action,
      details,
      timestamp: new Date(),
    });
  }

  // 获取所有事件
  async getAllEvents(options?: {
    nodeId?: string;
    action?: LineageEvent['action'];
    limit?: number;
  }): Promise<LineageEvent[]> {
    let filtered = [...this.events];
    if (options?.nodeId) filtered = filtered.filter(e => e.nodeId === options.nodeId);
    if (options?.action) filtered = filtered.filter(e => e.action === options.action);
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (options?.limit) filtered = filtered.slice(0, options.limit);
    return filtered;
  }
}
