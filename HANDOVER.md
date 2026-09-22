# 技能评测系统 - 项目交接文档

## 1. 项目概述

### 1.1 项目定位
**技能评测系统**（auto-evalue-and-annotate）是一个面向 AI 智能体和技能的自动化评测平台，用于对各类 AI 技能进行系统化的评测、标注、分析和优化。

### 1.2 核心价值
- **自动化评测**：支持批量自动化评测 AI 技能/智能体的性能
- **多维度标注**：支持 AI 自动标注和人工标注，提供标注一致性检测
- **流水线编排**：可视化编排评测流程，支持定时执行
- **数据分析**：提供评测报告、趋势分析、Elo 排名等
- **可观测性**：实时监控评测过程，支持企业微信告警

### 1.3 项目规模（截至 v1.101）
- **后端服务**：294 个服务文件
- **API 端点**：600+ 个
- **代码量**：50,000+ 行
- **前端页面**：27 个主要页面
- **单元测试**：178 个测试用例，全部通过

---

## 2. 技术栈

### 2.1 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| **NestJS** | 10.x | 后端框架 |
| **Prisma** | 5.x | ORM 和数据库迁移 |
| **SQLite** | - | 开发/测试数据库 |
| **Bull** | 4.x | 任务队列（已用 ioredis-mock 替代 Redis） |
| **class-validator** | 0.14.x | DTO 验证 |
| **Swagger** | 7.x | API 文档 |
| **Jest** | 29.x | 单元测试框架 |

### 2.2 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.x | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Vite** | 5.x | 构建工具 |
| **Tailwind CSS** | 3.x | 原子化 CSS |
| **shadcn/ui** | - | UI 组件库 |
| **Radix UI** | - | 无障碍组件 |
| **Ant Design** | 5.x | 部分组件 |
| **react-router-dom** | 6.x | 路由管理 |
| **i18next** | 26.x | 国际化 |
| **Playwright** | 1.x | E2E 测试 |

### 2.3 开发工具
- **包管理**：npm
- **代码规范**：ESLint + Prettier
- **Git**：版本控制
- **Node.js**：24.x（推荐 18+）

---

## 3. 系统架构

### 3.1 整体架构
```
┌─────────────────────────────────────────────────────────┐
│                      前端层 (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 技能管理 │  │ 智能体   │  │ 数据集   │  ...         │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                    API 网关层 (NestJS)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Controller│  │Controller│  │Controller│  ...         │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     业务逻辑层                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Service  │  │ Service  │  │ Service  │  ...         │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      数据访问层                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Prisma ORM                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      数据持久层                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ SQLite   │  │ 文件存储 │  │ 缓存     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 核心模块划分

#### 后端模块（12 个主要模块）
1. **agent** - 智能体管理
2. **skill** - 技能管理
3. **dataset** - 数据集管理
4. **eval** - 评测执行（包含 139 个服务文件）
5. **executor** - 评测执行引擎
6. **annotation** - 标注管理
7. **fixer** - AI 修复建议
8. **pipeline** - 流水线编排
9. **report** - 报告生成
10. **alert** - 告警配置
11. **prompt** - Prompt 管理
12. **regression** - 回归检测

#### 前端页面（27 个页面）
- Dashboard - 数据看板
- Skills - 技能管理
- Agents - 智能体管理
- Datasets - 数据集管理
- EvalRuns - 评测记录
- Annotations - 标注管理
- Pipelines - 流水线编排
- Reports - 报告中心
- Prompts - Prompt 管理
- Settings - 系统设置
- 等 17 个其他页面

---

## 4. 目录结构

```
auto-evalue-and-annotate/
├── prisma/                          # 数据库相关
│   ├── migrations/                  # 数据库迁移文件
│   ├── schema.prisma                # 数据模型定义
│   ├── seed.ts                      # Mock 数据种子
│   └── dev.db                       # SQLite 数据库文件
│
├── src/                             # 后端源代码
│   ├── common/                      # 公共模块
│   │   └── prisma/                  # Prisma 服务
│   ├── modules/                     # 业务模块
│   │   ├── agent/                   # 智能体模块
│   │   ├── skill/                   # 技能模块
│   │   ├── dataset/                 # 数据集模块
│   │   ├── eval/                    # 评测模块（核心）
│   │   ├── executor/                # 执行引擎
│   │   ├── annotation/              # 标注模块
│   │   ├── fixer/                   # 修复模块
│   │   ├── pipeline/                # 流水线模块
│   │   ├── report/                  # 报告模块
│   │   ├── alert/                   # 告警模块
│   │   ├── prompt/                  # Prompt 模块
│   │   └── regression/              # 回归检测
│   ├── app.module.ts                # 根模块
│   └── main.ts                      # 入口文件
│
├── web/                             # 前端项目
│   ├── src/
│   │   ├── components/              # 公共组件
│   │   ├── pages/                   # 页面组件
│   │   ├── App.tsx                  # 根组件
│   │   └── main.tsx                 # 入口文件
│   ├── package.json
│   └── vite.config.ts
│
├── package.json                     # 后端依赖
├── tsconfig.json                    # TypeScript 配置
├── nest-cli.json                    # NestJS 配置
└── .env.example                     # 环境变量示例
```

---

## 5. 数据模型

### 5.1 核心实体关系

```
Skill (技能)
  ├── AgentEndpoint (智能体接入点) - 1:N
  ├── EvalRun (评测运行) - 1:N
  └── SkillVersion (版本历史) - 1:N

Dataset (数据集)
  ├── TestCase (测试用例) - 1:N
  └── DatasetSnapshot (快照) - 1:N

EvalRun (评测运行)
  ├── EvalResult (评测结果) - 1:N
  └── PipelineInstance (流水线实例) - 1:1

EvalResult (评测结果)
  └── Annotation (标注) - 1:N

Pipeline (流水线)
  └── PipelineInstance (实例) - 1:N
```

### 5.2 关键字段说明

#### Skill（技能）
- `instructions`: SKILL.md 风格的技能指令（Markdown）
- `allowedTools`: 允许使用的工具列表
- `requiredContext`: 所需上下文信息
- `status`: active/deprecated/draft

#### AgentEndpoint（智能体）
- `model`: 底层模型（gpt-4o, claude-3-sonnet 等）
- `systemPrompt`: 系统提示词
- `sseFormat`: SSE 响应格式（auto/content/delta/openai）
- `status`: active/inactive/error

#### EvalRun（评测运行）
- `status`: pending/running/completed/failed
- `totalCases/passedCases/failedCases`: 评测统计

---

## 6. 启动和运行

### 6.1 环境准备
```bash
# 1. 安装 Node.js 18+
# 2. 安装 npm

# 3. 克隆项目
git clone <repository-url>
cd auto-evalue-and-annotate
```

### 6.2 后端启动
```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器（热重载）
npm run dev

# 或启动生产版本
npm run build
npm run start
```

后端默认运行在：`http://localhost:3000`
Swagger 文档：`http://localhost:3000/api/docs`

### 6.3 前端启动
```bash
cd web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端默认运行在：`http://localhost:5173`

### 6.4 环境变量
创建 `.env` 文件：
```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

### 6.5 常用命令
```bash
# 数据库操作
npm run db:migrate      # 执行迁移
npm run db:seed         # 填充 Mock 数据
npm run db:studio       # 打开 Prisma Studio
npm run db:generate     # 生成 Prisma Client

# 测试
npm test                # 运行单元测试
npm run test:watch      # 监听模式
npm run test:cov        # 生成覆盖率报告

# 构建
npm run build           # 构建后端
npm run build:web       # 构建前端
```

---

## 7. 核心功能详解

### 7.1 技能管理
- **技能定义**：支持 SKILL.md 格式的技能指令
- **版本管理**：技能版本历史和快照
- **工具绑定**：配置技能允许使用的工具
- **状态管理**：active/deprecated/draft

### 7.2 智能体管理
- **智能体接入**：配置智能体 API 端点
- **模型配置**：指定底层模型（GPT-4, Claude 等）
- **系统提示词**：自定义智能体行为
- **连接测试**：实时测试智能体连通性
- **SSE 解析**：支持多种 SSE 响应格式

### 7.3 数据集管理
- **数据集创建**：支持手动和 AI 生成
- **测试用例**：管理评测用例
- **数据清洗**：长度过滤、去重、空值检查
- **版本快照**：数据集版本管理

### 7.4 评测执行
- **批量评测**：支持大规模并发评测
- **多维度评分**：准确性、相关性、流畅性等
- **性能指标**：延迟、Token 消耗、成本
- **Elo 排名**：智能体对战排名系统

### 7.5 标注管理
- **AI 自动标注**：基于规则或模型的自动标注
- **人工标注**：支持多标注员
- **标注审核**：审核和拒绝机制
- **一致性检测**：Fleiss' Kappa、Krippendorff's Alpha

### 7.6 流水线编排
- **可视化编排**：拖拽式流水线设计
- **8 种步骤类型**：加载数据集、应用 Prompt、调用模型、评测、过滤、聚合、导出、通知
- **定时执行**：支持 Cron 表达式
- **执行监控**：实时进度跟踪

### 7.7 报告中心
- **评测报告**：自动生成评测报告
- **数据导出**：Excel、CSV 格式
- **趋势分析**：历史评测趋势
- **对比分析**：多版本对比

### 7.8 告警配置
- **企业微信告警**：Webhook 集成
- **阈值配置**：通过率阈值
- **触发条件**：评测失败、性能下降等

---

## 8. API 端点

### 8.1 主要 API 分组

#### 技能管理 `/api/skills`
- `GET /api/skills` - 获取技能列表
- `POST /api/skills` - 创建技能
- `GET /api/skills/:id` - 获取技能详情
- `PUT /api/skills/:id` - 更新技能
- `DELETE /api/skills/:id` - 删除技能

#### 智能体管理 `/api/agents`
- `GET /api/agents` - 获取智能体列表
- `POST /api/agents` - 注册智能体
- `GET /api/agents/:id` - 获取智能体详情
- `PUT /api/agents/:id` - 更新配置
- `DELETE /api/agents/:id` - 删除智能体
- `POST /api/agents/:id/test` - 测试连接

#### 数据集管理 `/api/datasets`
- `GET /api/datasets` - 获取数据集列表
- `POST /api/datasets` - 创建数据集
- `GET /api/datasets/:id` - 获取详情
- `PUT /api/datasets/:id` - 更新
- `DELETE /api/datasets/:id` - 删除
- `POST /api/datasets/:id/import` - 导入数据

#### 评测执行 `/api/eval`
- `POST /api/eval/run` - 启动评测
- `GET /api/eval/runs` - 获取评测列表
- `GET /api/eval/runs/:id` - 获取评测详情
- `GET /api/eval/results` - 获取结果列表

#### 流水线 `/api/pipeline`
- `GET /api/pipeline` - 获取流水线列表
- `POST /api/pipeline` - 创建流水线
- `POST /api/pipeline/:id/run` - 运行流水线
- `GET /api/pipeline/executions` - 获取执行记录

#### 报告 `/api/report`
- `GET /api/report/dashboard` - 看板数据
- `GET /api/report/eval-runs` - 评测运行统计
- `POST /api/report/generate/:evalRunId` - 生成报告
- `POST /api/report/export/:evalRunId` - 导出报告

### 8.2 完整 API 文档
访问 `http://localhost:3000/api/docs` 查看 Swagger 文档

---

## 9. 前端页面

### 9.1 主要页面路由

| 路由 | 页面 | 功能 |
|------|------|------|
| `/dashboard` | Dashboard | 数据看板 |
| `/skills` | Skills | 技能管理（卡片/表格视图） |
| `/agents` | Agents | 智能体管理（卡片视图） |
| `/datasets` | Datasets | 数据集管理 |
| `/eval-runs` | EvalRuns | 评测记录 |
| `/annotations` | Annotations | 标注管理 |
| `/pipelines` | Pipelines | 流水线编排 |
| `/reports` | Reports | 报告中心 |
| `/prompts` | Prompts | Prompt 管理 |
| `/settings` | Settings | 系统设置 |

### 9.2 UI 设计规范
- **暗色模式**：支持，通过 ThemeProvider 管理
- **响应式布局**：支持移动端和桌面端
- **国际化**：支持中英文切换
- **组件库**：shadcn/ui + Radix UI + Ant Design

---

## 10. 测试

### 10.1 单元测试
- **框架**：Jest
- **覆盖范围**：178 个测试用例
- **运行命令**：`npm test`

### 10.2 E2E 测试
- **框架**：Playwright
- **测试文件**：`web/tests/e2e/`
- **运行命令**：`cd web && npm run test:e2e`

### 10.3 测试规范
- Controller 和 Service 必须有单元测试
- 新增功能需补充对应测试
- 测试覆盖率目标：80%+

---

## 11. 部署

### 11.1 生产构建
```bash
# 后端构建
npm run build

# 前端构建
cd web && npm run build
```

### 11.2 Docker 部署（待实现）
项目包含 `docker-compose.yml`，但尚未完全配置。建议：
- 后端容器：Node.js 18+
- 前端容器：Nginx 静态文件服务
- 数据库：SQLite 文件挂载

### 11.3 环境变量
生产环境需配置：
```env
DATABASE_URL="file:./prod.db"
PORT=3000
NODE_ENV=production
```

---

## 12. 已知问题和待办事项

### 12.1 已知问题
1. **数据库限制**：SQLite 不适合生产环境，建议迁移到 PostgreSQL
2. **Redis 依赖**：Bull 队列需要 Redis，当前使用 ioredis-mock 模拟
3. **文件存储**：缺少统一文件存储服务
4. **权限系统**：尚未实现完整的 RBAC 权限控制

### 12.2 待办事项
1. **数据库迁移**：从 SQLite 迁移到 PostgreSQL
2. **权限系统**：实现用户认证和 RBAC
3. **文件存储**：集成 OSS/S3 文件存储
4. **监控告警**：完善 Prometheus + Grafana 监控
5. **API 限流**：实现 API 限流和防刷
6. **日志系统**：集成 ELK 或类似日志系统
7. **CI/CD**：配置 GitHub Actions 自动化部署

---

## 13. 开发规范

### 13.1 代码规范
- **TypeScript**：严格模式
- **ESLint**：遵循项目配置
- **Prettier**：代码格式化
- **命名规范**：
  - 文件名：kebab-case
  - 类名：PascalCase
  - 变量/函数：camelCase
  - 常量：UPPER_SNAKE_CASE

### 13.2 Git 规范
- **提交信息**：使用语义化提交
  - `feat:` 新功能
  - `fix:` 修复 bug
  - `docs:` 文档更新
  - `refactor:` 重构
  - `test:` 测试相关
- **分支管理**：
  - `main` - 主分支
  - `develop` - 开发分支
  - `feature/*` - 功能分支

### 13.3 前端规范
- **组件命名**：PascalCase
- **Props 类型**：必须定义 TypeScript 接口
- **样式**：优先使用 Tailwind 原子类
- **状态管理**：React Hooks，避免全局状态

### 13.4 后端规范
- **DTO 验证**：使用 class-validator
- **错误处理**：统一异常过滤器
- **日志**：使用 NestJS Logger
- **依赖注入**：通过构造函数注入

---

## 14. 借鉴项目

本项目借鉴了以下开源项目的设计理念：
- **DeepEval** - LLM 评测框架
- **Promptfoo** - Prompt 评测工具
- **Langfuse** - LLM 可观测性平台
- **Ragas** - RAG 评测框架
- **Arize Phoenix** - AI 可观测性
- **OpenCompass** - 大模型评测平台
- **MLflow** - ML 生命周期管理

---

## 15. 联系方式

如有问题，请联系项目维护者。

---

**文档版本**：v1.0  
**最后更新**：2026-09-22  
**项目版本**：v1.101
