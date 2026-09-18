// @ts-nocheck
import { Injectable } from '@nestjs/common';

// 租户状态
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

// 租户计划
export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

// 租户
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: TenantStatus;
  plan: TenantPlan;
  settings: TenantSettings;
  quota: TenantQuota;
  usage: TenantUsage;
  ownerUserId: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt?: Date;
}

// 租户设置
export interface TenantSettings {
  defaultModel?: string;
  defaultMetrics?: string[];
  timezone?: string;
  language?: string;
  customDomain?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
  };
}

// 租户配额
export interface TenantQuota {
  maxEvalRuns: number;
  maxDatasets: number;
  maxModels: number;
  maxMembers: number;
  maxStorageMb: number;
  maxApiCallsPerDay: number;
  maxConcurrentEvals: number;
}

// 租户使用量
export interface TenantUsage {
  evalRuns: number;
  datasets: number;
  models: number;
  storageMb: number;
  apiCallsToday: number;
  lastResetAt: Date;
}

// 租户成员
export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  lastActiveAt?: Date;
}

// 计划配额定义
const PLAN_QUOTAS: Record<TenantPlan, TenantQuota> = {
  [TenantPlan.FREE]: {
    maxEvalRuns: 100,
    maxDatasets: 5,
    maxModels: 3,
    maxMembers: 2,
    maxStorageMb: 500,
    maxApiCallsPerDay: 1000,
    maxConcurrentEvals: 2,
  },
  [TenantPlan.STARTER]: {
    maxEvalRuns: 1000,
    maxDatasets: 20,
    maxModels: 10,
    maxMembers: 5,
    maxStorageMb: 5000,
    maxApiCallsPerDay: 10000,
    maxConcurrentEvals: 5,
  },
  [TenantPlan.PRO]: {
    maxEvalRuns: 10000,
    maxDatasets: 100,
    maxModels: 50,
    maxMembers: 20,
    maxStorageMb: 50000,
    maxApiCallsPerDay: 100000,
    maxConcurrentEvals: 20,
  },
  [TenantPlan.ENTERPRISE]: {
    maxEvalRuns: Infinity,
    maxDatasets: Infinity,
    maxModels: Infinity,
    maxMembers: Infinity,
    maxStorageMb: Infinity,
    maxApiCallsPerDay: Infinity,
    maxConcurrentEvals: 100,
  },
};

@Injectable()
export class MultiTenantService {
  private tenants: Map<string, Tenant> = new Map();
  private members: Map<string, TenantMember[]> = new Map();

  constructor() {}

  // 创建租户
  async createTenant(data: {
    name: string;
    slug: string;
    description?: string;
    plan?: TenantPlan;
    ownerUserId: string;
    trialDays?: number;
  }): Promise<Tenant> {
    // 检查 slug 唯一性
    const existing = Array.from(this.tenants.values()).find(t => t.slug === data.slug);
    if (existing) throw new Error('Slug already taken');

    const id = `tenant_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const plan = data.plan || TenantPlan.FREE;

    const tenant: Tenant = {
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.trialDays ? TenantStatus.TRIAL : TenantStatus.ACTIVE,
      plan,
      settings: {},
      quota: { ...PLAN_QUOTAS[plan] },
      usage: {
        evalRuns: 0,
        datasets: 0,
        models: 0,
        storageMb: 0,
        apiCallsToday: 0,
        lastResetAt: new Date(),
      },
      ownerUserId: data.ownerUserId,
      memberCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      trialEndsAt: data.trialDays ? new Date(Date.now() + data.trialDays * 86400000) : undefined,
    };

    this.tenants.set(id, tenant);

    // 添加 owner 为成员
    this.members.set(id, [{
      id: `member_${Date.now()}`,
      tenantId: id,
      userId: data.ownerUserId,
      userName: 'Owner',
      role: 'owner',
      joinedAt: new Date(),
    }]);

    return tenant;
  }

  // 获取租户
  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  // 按 slug 获取租户
  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(t => t.slug === slug);
  }

  // 获取租户列表
  async listTenants(status?: TenantStatus): Promise<Tenant[]> {
    let tenants = Array.from(this.tenants.values());
    if (status) tenants = tenants.filter(t => t.status === status);
    return tenants.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 更新租户设置
  async updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;
    Object.assign(tenant.settings, settings);
    tenant.updatedAt = new Date();
    return tenant;
  }

  // 升级计划
  async upgradePlan(tenantId: string, plan: TenantPlan): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;
    tenant.plan = plan;
    tenant.quota = { ...PLAN_QUOTAS[plan] };
    tenant.updatedAt = new Date();
    if (tenant.status === TenantStatus.TRIAL) tenant.status = TenantStatus.ACTIVE;
    return tenant;
  }

  // 检查配额
  async checkQuota(tenantId: string, resource: keyof TenantQuota): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    percentage: number;
  }> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const limit = tenant.quota[resource];
    const usageKey = resource.replace('max', '').charAt(0).toLowerCase() + resource.replace('max', '').slice(1);
    const used = (tenant.usage as any)[usageKey] || 0;
    const percentage = limit === Infinity ? 0 : (used / limit) * 100;

    return {
      allowed: used < limit,
      used,
      limit,
      percentage,
    };
  }

  // 增加使用量
  async incrementUsage(tenantId: string, resource: keyof TenantUsage, amount: number = 1): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;
    (tenant.usage as any)[resource] = ((tenant.usage as any)[resource] || 0) + amount;
  }

  // 重置每日使用量
  async resetDailyUsage(tenantId?: string): Promise<void> {
    const tenants = tenantId ? [this.tenants.get(tenantId)].filter(Boolean) : Array.from(this.tenants.values());
    for (const tenant of tenants) {
      if (!tenant) continue;
      tenant.usage.apiCallsToday = 0;
      tenant.usage.lastResetAt = new Date();
    }
  }

  // 添加成员
  async addMember(tenantId: string, data: {
    userId: string;
    userName: string;
    role: TenantMember['role'];
  }): Promise<TenantMember> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const member: TenantMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tenantId,
      userId: data.userId,
      userName: data.userName,
      role: data.role,
      joinedAt: new Date(),
    };

    if (!this.members.has(tenantId)) this.members.set(tenantId, []);
    this.members.get(tenantId)!.push(member);
    tenant.memberCount++;

    return member;
  }

  // 移除成员
  async removeMember(tenantId: string, userId: string): Promise<boolean> {
    const tenantMembers = this.members.get(tenantId);
    if (!tenantMembers) return false;

    const idx = tenantMembers.findIndex(m => m.userId === userId);
    if (idx === -1) return false;

    tenantMembers.splice(idx, 1);
    const tenant = this.tenants.get(tenantId);
    if (tenant) tenant.memberCount--;
    return true;
  }

  // 获取成员列表
  async listMembers(tenantId: string): Promise<TenantMember[]> {
    return this.members.get(tenantId) || [];
  }

  // 获取用户的租户列表
  async getUserTenants(userId: string): Promise<Tenant[]> {
    const tenantIds: string[] = [];
    for (const [tenantId, memberList] of this.members.entries()) {
      if (memberList.some(m => m.userId === userId)) tenantIds.push(tenantId);
    }
    return tenantIds.map(id => this.tenants.get(id)!).filter(Boolean);
  }

  // 暂停租户
  async suspendTenant(tenantId: string, reason?: string): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;
    tenant.status = TenantStatus.SUSPENDED;
    tenant.updatedAt = new Date();
    return tenant;
  }

  // 恢复租户
  async activateTenant(tenantId: string): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;
    tenant.status = TenantStatus.ACTIVE;
    tenant.updatedAt = new Date();
    return tenant;
  }

  // 获取计划信息
  getPlans(): Array<{ plan: TenantPlan; name: string; quotas: TenantQuota; price: string }> {
    return [
      { plan: TenantPlan.FREE, name: '免费版', quotas: PLAN_QUOTAS[TenantPlan.FREE], price: '¥0' },
      { plan: TenantPlan.STARTER, name: '入门版', quotas: PLAN_QUOTAS[TenantPlan.STARTER], price: '¥99/月' },
      { plan: TenantPlan.PRO, name: '专业版', quotas: PLAN_QUOTAS[TenantPlan.PRO], price: '¥499/月' },
      { plan: TenantPlan.ENTERPRISE, name: '企业版', quotas: PLAN_QUOTAS[TenantPlan.ENTERPRISE], price: '联系销售' },
    ];
  }

  // 获取使用统计
  async getUsageStats(tenantId: string): Promise<{
    quota: TenantQuota;
    usage: TenantUsage;
    quotaPercentages: Record<string, number>;
  }> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const percentages: Record<string, number> = {};
    for (const [key, limit] of Object.entries(tenant.quota)) {
      const usageKey = key.replace('max', '').charAt(0).toLowerCase() + key.replace('max', '').slice(1);
      const used = (tenant.usage as any)[usageKey] || 0;
      percentages[key] = limit === Infinity ? 0 : Math.round((used / limit) * 100);
    }

    return { quota: tenant.quota, usage: tenant.usage, quotaPercentages: percentages };
  }
}
