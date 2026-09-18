// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 权限动作
export enum Permission {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  EXPORT = 'export',
  ADMIN = 'admin',
}

// 资源类型
export enum ResourceType {
  DATASET = 'dataset',
  EVAL_RUN = 'eval_run',
  MODEL = 'model',
  REPORT = 'report',
  WORKFLOW = 'workflow',
  TEMPLATE = 'template',
  ALERT = 'alert',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  SYSTEM = 'system',
}

// 角色
export enum Role {
  VIEWER = 'viewer',
  ANNOTATOR = 'annotator',
  EVALUATOR = 'evaluator',
  DEVELOPER = 'developer',
  ADMIN = 'admin',
  OWNER = 'owner',
}

// 角色权限映射
const ROLE_PERMISSIONS: Record<Role, Record<ResourceType, Permission[]>> = {
  [Role.VIEWER]: {
    [ResourceType.DATASET]: [Permission.READ],
    [ResourceType.EVAL_RUN]: [Permission.READ],
    [ResourceType.MODEL]: [Permission.READ],
    [ResourceType.REPORT]: [Permission.READ, Permission.EXPORT],
    [ResourceType.WORKFLOW]: [Permission.READ],
    [ResourceType.TEMPLATE]: [Permission.READ],
    [ResourceType.ALERT]: [Permission.READ],
    [ResourceType.WEBHOOK]: [Permission.READ],
    [ResourceType.SCHEDULE]: [Permission.READ],
    [ResourceType.SYSTEM]: [Permission.READ],
  },
  [Role.ANNOTATOR]: {
    [ResourceType.DATASET]: [Permission.READ, Permission.UPDATE],
    [ResourceType.EVAL_RUN]: [Permission.READ],
    [ResourceType.MODEL]: [Permission.READ],
    [ResourceType.REPORT]: [Permission.READ, Permission.EXPORT],
    [ResourceType.WORKFLOW]: [Permission.READ],
    [ResourceType.TEMPLATE]: [Permission.READ],
    [ResourceType.ALERT]: [Permission.READ],
    [ResourceType.WEBHOOK]: [],
    [ResourceType.SCHEDULE]: [Permission.READ],
    [ResourceType.SYSTEM]: [],
  },
  [Role.EVALUATOR]: {
    [ResourceType.DATASET]: [Permission.READ, Permission.CREATE, Permission.UPDATE],
    [ResourceType.EVAL_RUN]: [Permission.READ, Permission.CREATE, Permission.EXECUTE],
    [ResourceType.MODEL]: [Permission.READ],
    [ResourceType.REPORT]: [Permission.READ, Permission.CREATE, Permission.EXPORT],
    [ResourceType.WORKFLOW]: [Permission.READ, Permission.EXECUTE],
    [ResourceType.TEMPLATE]: [Permission.READ, Permission.CREATE],
    [ResourceType.ALERT]: [Permission.READ],
    [ResourceType.WEBHOOK]: [Permission.READ],
    [ResourceType.SCHEDULE]: [Permission.READ, Permission.CREATE],
    [ResourceType.SYSTEM]: [],
  },
  [Role.DEVELOPER]: {
    [ResourceType.DATASET]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE],
    [ResourceType.EVAL_RUN]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXECUTE],
    [ResourceType.MODEL]: [Permission.READ, Permission.CREATE, Permission.UPDATE],
    [ResourceType.REPORT]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT],
    [ResourceType.WORKFLOW]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXECUTE],
    [ResourceType.TEMPLATE]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE],
    [ResourceType.ALERT]: [Permission.READ, Permission.CREATE, Permission.UPDATE],
    [ResourceType.WEBHOOK]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE],
    [ResourceType.SCHEDULE]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXECUTE],
    [ResourceType.SYSTEM]: [Permission.READ],
  },
  [Role.ADMIN]: {
    [ResourceType.DATASET]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.ADMIN],
    [ResourceType.EVAL_RUN]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXECUTE, Permission.ADMIN],
    [ResourceType.MODEL]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.ADMIN],
    [ResourceType.REPORT]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT, Permission.ADMIN],
    [ResourceType.WORKFLOW]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXECUTE, Permission.ADMIN],
    [ResourceType.TEMPLATE]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.ADMIN],
    [ResourceType.ALERT]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.ADMIN],
    [ResourceType.WEBHOOK]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.ADMIN],
    [ResourceType.SCHEDULE]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXECUTE, Permission.ADMIN],
    [ResourceType.SYSTEM]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.ADMIN],
  },
  [Role.OWNER]: {
    [ResourceType.DATASET]: Object.values(Permission),
    [ResourceType.EVAL_RUN]: Object.values(Permission),
    [ResourceType.MODEL]: Object.values(Permission),
    [ResourceType.REPORT]: Object.values(Permission),
    [ResourceType.WORKFLOW]: Object.values(Permission),
    [ResourceType.TEMPLATE]: Object.values(Permission),
    [ResourceType.ALERT]: Object.values(Permission),
    [ResourceType.WEBHOOK]: Object.values(Permission),
    [ResourceType.SCHEDULE]: Object.values(Permission),
    [ResourceType.SYSTEM]: Object.values(Permission),
  },
};

// 用户
export interface EvalUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  team?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// API Key
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: Permission[];
  resources: ResourceType[];
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  active: boolean;
}

// 审计日志
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: ResourceType;
  resourceId?: string;
  details: Record<string, any>;
  ip?: string;
  timestamp: Date;
}

@Injectable()
export class PermissionService {
  private users: Map<string, EvalUser> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {}

  // 检查权限
  async checkPermission(userId: string, resource: ResourceType, permission: Permission): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const user = this.users.get(userId);
    if (!user) return { allowed: false, reason: 'User not found' };

    const rolePerms = ROLE_PERMISSIONS[user.role];
    if (!rolePerms) return { allowed: false, reason: 'Invalid role' };

    const resourcePerms = rolePerms[resource];
    if (!resourcePerms) return { allowed: false, reason: 'Resource not accessible' };

    if (!resourcePerms.includes(permission)) {
      return { allowed: false, reason: `Role ${user.role} lacks ${permission} on ${resource}` };
    }

    return { allowed: true };
  }

  // 批量检查
  async checkPermissions(userId: string, checks: Array<{ resource: ResourceType; permission: Permission }>): Promise<{
    allAllowed: boolean;
    results: Array<{ resource: ResourceType; permission: Permission; allowed: boolean }>;
  }> {
    const results = [];
    let allAllowed = true;

    for (const check of checks) {
      const result = await this.checkPermission(userId, check.resource, check.permission);
      results.push({ ...check, allowed: result.allowed });
      if (!result.allowed) allAllowed = false;
    }

    return { allAllowed, results };
  }

  // 创建用户
  async createUser(data: { name: string; email: string; role: Role; team?: string }): Promise<EvalUser> {
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user: EvalUser = {
      id,
      name: data.name,
      email: data.email,
      role: data.role,
      team: data.team,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    this.addAuditLog(id, 'user_created', ResourceType.SYSTEM, { targetUser: id });
    return user;
  }

  // 更新用户角色
  async updateRole(userId: string, role: Role): Promise<EvalUser | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    user.role = role;
    this.addAuditLog(userId, 'role_changed', ResourceType.SYSTEM, { newRole: role });
    return user;
  }

  // 获取用户列表
  async listUsers(role?: Role): Promise<EvalUser[]> {
    let users = Array.from(this.users.values());
    if (role) users = users.filter(u => u.role === role);
    return users;
  }

  // 创建 API Key
  async createApiKey(data: {
    userId: string;
    name: string;
    permissions: Permission[];
    resources: ResourceType[];
    expiresAt?: Date;
  }): Promise<ApiKey> {
    const id = `key_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const key = `eval_${Buffer.from(id).toString('base64')}_${Math.random().toString(36).slice(2, 18)}`;

    const apiKey: ApiKey = {
      id,
      userId: data.userId,
      name: data.name,
      key,
      permissions: data.permissions,
      resources: data.resources,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      active: true,
    };

    this.apiKeys.set(id, apiKey);
    this.addAuditLog(data.userId, 'api_key_created', ResourceType.SYSTEM, { keyId: id });
    return apiKey;
  }

  // 验证 API Key
  async validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: ApiKey; reason?: string }> {
    const apiKey = Array.from(this.apiKeys.values()).find(k => k.key === key);
    if (!apiKey) return { valid: false, reason: 'Key not found' };
    if (!apiKey.active) return { valid: false, reason: 'Key deactivated' };
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { valid: false, reason: 'Key expired' };

    apiKey.lastUsedAt = new Date();
    return { valid: true, apiKey };
  }

  // 检查 API Key 权限
  async checkApiKeyPermission(keyId: string, resource: ResourceType, permission: Permission): Promise<boolean> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey || !apiKey.active) return false;
    if (!apiKey.resources.includes(resource)) return false;
    if (!apiKey.permissions.includes(permission)) return false;
    return true;
  }

  // 撤销 API Key
  async revokeApiKey(keyId: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) return false;
    apiKey.active = false;
    this.addAuditLog(apiKey.userId, 'api_key_revoked', ResourceType.SYSTEM, { keyId });
    return true;
  }

  // 获取 API Key 列表
  async listApiKeys(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(k => k.userId === userId);
  }

  // 获取角色权限
  getRolePermissions(role: Role): Record<ResourceType, Permission[]> {
    return ROLE_PERMISSIONS[role];
  }

  // 获取所有角色
  getRoles(): Array<{ role: Role; name: string; description: string }> {
    return [
      { role: Role.VIEWER, name: '查看者', description: '只读访问所有资源' },
      { role: Role.ANNOTATOR, name: '标注员', description: '可更新数据集和标注' },
      { role: Role.EVALUATOR, name: '评测员', description: '可创建和执行评测' },
      { role: Role.DEVELOPER, name: '开发者', description: '完全读写权限' },
      { role: Role.ADMIN, name: '管理员', description: '管理权限' },
      { role: Role.OWNER, name: '所有者', description: '最高权限' },
    ];
  }

  // 获取审计日志
  async getAuditLogs(options?: {
    userId?: string;
    resource?: ResourceType;
    limit?: number;
  }): Promise<AuditLog[]> {
    let logs = [...this.auditLogs];
    if (options?.userId) logs = logs.filter(l => l.userId === options.userId);
    if (options?.resource) logs = logs.filter(l => l.resource === options.resource);
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (options?.limit) logs = logs.slice(0, options.limit);
    return logs;
  }

  // 添加审计日志
  private addAuditLog(userId: string, action: string, resource: ResourceType, details: Record<string, any>): void {
    this.auditLogs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      action,
      resource,
      details,
      timestamp: new Date(),
    });
  }
}
