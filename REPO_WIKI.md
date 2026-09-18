# 技能评测系统 — Repo Wiki

> **项目名称**：Auto-Evaluate & Annotate（技能评测系统）
> **版本**：v1.8
> **定位**：面向 AI 技能 / Agent 的自动化评测平台，支持 **"跑 → 评 → 标 → 修 → 验"** 全链路闭环。

---

## 目录

1. [系统概览](#1-系统概览)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [架构设计](#4-架构设计)
5. [后端模块详解](#5-后端模块详解)
6. [数据模型](#6-数据模型)
7. [前端页面](#7-前端页面)
8. [API 路由总览](#8-api-路由总览)
9. [环境配置与启动](#9-环境配置与启动)
10. [功能迭代历程](#10-功能迭代历程)
11. [参考项目](#11-参考项目)

---

## 1. 系统概览

本系统解决 AI 技能迭代过程中 **"改了不知道好不好、好了不知道好多少"** 的核心痛点。通过自动化评测、双标注体系、AI 修复建议，让技能质量**可量化、可追溯、可自动回归**。

### 核心能力

| 能力 | 说明 |
|------|------|
| 智能体接入 | HTTP + SSE 协议适配，自动探测响应格式 |
| 数据集管理 | 用例分级、AI 辅助生成、快照版本化 |
| 自动化执行 | 并发执行评测任务，采集性能指标 |
| 多维度评测 | 规则评测 / AI 评测 / 指标评测 / RAG 指标 / 对话指标 |
| 双标注体系 | AI 预标注 + 人工复核，计算一致性 |
| AI 修复 | 诊断 bad case 根因，生成修复建议并验证 |
| 流水线编排 | 预置模板 + 自定义节点串联 |
| 回归测试 | 版本对比，自动识别退化项 |
| 可观测性 | 延迟/成本/token 监控，告警规则 |
| 排行榜 | 多模型性能排名，指标对比可视化 |

---

## 2. 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| NestJS | 10.x | 后端框架 |
| TypeScript | 5.x | 开发语言 |
| Prisma | 5.x | ORM（SQLite） |
| Bull | 4.x | 任务队列 |
| ioredis-mock | 8.x | 内存 Redis（开发免部署） |
| axios | 1.x | HTTP 客户端 |
| eventsource-parser | 1.x | SSE 流解析 |
| Swagger (OpenAPI) | 7.x | API 文档 |
| class-validator / class-transformer | — | DTO 校验 |
| js-yaml | 5.x | YAML 声明式用例导入 |
| @nestjs/schedule | 4.x | 定时任务 |

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| Vite | 5.x | 构建工具 |
| Tailwind CSS | 3.x | 原子化 CSS |
| shadcn/ui + Radix UI | — | 组件库 |
| React Router | 6.x | 路由 |
| Ant Design | 5.x | 部分组件仍在使用 |
| lucide-react | 1.x | 图标库 |
| axios | 1.x | HTTP 请求 |
| dayjs | 1.x | 日期处理 |

---

## 3. 项目结构

```
auto-evalue-and-annotate/
├── src/                              # 后端源码
│   ├── common/prisma/                # Prisma 公共模块
│   │   ├── prisma.module.ts          #   模块定义
│   │   └── prisma.service.ts         #   数据库服务
│   ├── modules/
│   │   ├── agent/                    # 智能体接入与适配（5 文件）
│   │   ├── dataset/                  # 数据集管理（8 文件）
│   │   ├── executor/                 # 自动化执行引擎（2 文件）
│   │   ├── eval/                     # 评测引擎（24 文件，最大模块）
│   │   ├── annotation/              # 双标注体系（3 文件）
│   │   ├── fixer/                    # AI 修复（2 文件）
│   │   ├── report/                   # 评测报告与导出（4 文件）
│   │   ├── regression/              # 回归测试（2 文件）
│   │   ├── pipeline/                 # 流水线编排（3 文件）
│   │   ├── prompt/                   # Prompt 版本管理（4 文件）
│   │   └── skill/                    # 技能管理（4 文件）
│   ├── app.module.ts                 # 根模块
│   └── main.ts                       # 入口（Swagger + CORS + ValidationPipe）
├── web/                              # 前端源码
│   ├── src/
│   │   ├── pages/                    # 10 个功能页面
│   │   ├── components/               # 布局组件 + UI 基础组件
│   │   ├── lib/                      # 工具函数
│   │   ├── App.tsx                   # 路由配置
│   │   ├── main.tsx                  # 前端入口
│   │   └── index.css                 # 全局样式
│   ├── tailwind.config.js            # Tailwind 配置
│   ├── vite.config.ts                # Vite 配置
│   └── package.json                  # 前端依赖
├── prisma/
│   ├── schema.prisma                 # 数据模型定义（251 行，14 个模型）
│   ├── migrations/                   # 数据库迁移
│   └── dev.db                        # SQLite 数据库文件
├── docs/
│   ├── 系统方案.md                    # 系统设计方案
│   └── 功能迭代记录.md                # 版本迭代记录
├── .env.example                      # 环境变量模板
├── .env.local                        # 本地环境变量（AI 提供商配置）
├── docker-compose.yml                # Redis 容器（可选）
├── nest-cli.json                     # NestJS CLI 配置
├── tsconfig.json                     # TypeScript 配置
└── package.json                      # 后端依赖
```

---

## 4. 架构设计

### 4.1 系统架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                      前端 (React 18 + Vite 5)                        │
│  Dashboard │ Skills │ Agents │ Datasets │ EvalRuns │ Annotations    │
│  Reports │ Pipelines │ Leaderboard │ Observability                   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ /api/*
┌───────────────────────────────▼──────────────────────────────────────┐
│                       后端 (NestJS 10, port 3000)                     │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Skill   │  │  Agent   │  │ Dataset  │  │ Executor │            │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │              │              │              │                  │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐           │
│  │  Eval    │  │Annotation│  │  Fixer   │  │  Report  │           │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │           │
│  │ (24文件) │  │          │  │          │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Regression│  │ Pipeline │  │  Prompt  │  │  其他    │           │
│  │  Module  │  │  Module  │  │  Module  │  │ 服务     │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Pipeline Module (流水线编排)                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────┐  ┌─────────────────────┐  ┌──────────────┐           │
│  │  Prisma  │  │ Bull (任务队列)      │  │ Swagger API  │           │
│  │  Module  │  │ ioredis-mock 内存模式│  │   Docs       │           │
│  └──────────┘  └─────────────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 核心业务流

```
数据集准备 → 智能体接入 → 执行引擎 → 评测打分 → 标注确认 → 修复验证 → 报告输出
   │            │            │           │           │           │           │
 Dataset     Agent      Executor     Eval      Annotation   Fixer     Report
 Module     Module     Module     Module     Module     Module    Module
```

### 4.3 评测引擎内部架构（Eval Module，24 个服务）

Eval Module 是系统最核心的模块，包含 21 个服务：

| 服务 | 职责 |
|------|------|
| `EvalService` | 基础评测：规则评测 / AI 评测 / 指标评测 |
| `MetricsService` | 评测指标体系（相关性/忠实度/幻觉/完整性/毒性/偏见） |
| `MatrixEvalService` | 矩阵对比评测（多模型×多prompt×多用例） |
| `TraceService` | 评测追踪（Trace/Span 调用链路） |
| `RedTeamService` | 红队安全扫描（7 种攻击插件） |
| `YamlImportService` | YAML 声明式测试用例导入 |
| `RAGMetricsService` | RAG 评测指标（精度/召回/噪声敏感度） |
| `ConversationalMetricsService` | 对话评测指标（连贯性/完整性/参与度/安全性） |
| `LeaderboardService` | 评测排行榜 |
| `ObservabilityService` | LLM 可观测性面板 |
| `CapabilityEvalService` | 多维度能力评估（语言/知识/推理/代码/数学等） |
| `ContaminationCheckService` | 数据污染检测 |
| `ExperimentService` | 实验追踪服务 |
| `QualityGateService` | 质量门禁（CI/CD 集成） |
| `FeedbackService` | 用户反馈收集 |
| `MultimodalEvalService` | 多模态评测（图像/音频） |
| `LLMJudgeService` | LLM-as-Judge 评判 |
| `GuardrailsService` | 输出护栏（PII/毒性/Schema验证） |
| `ABTestService` | A/B 测试服务 |
| `PromptOptimizationService` | Prompt 自动优化 |
| `CostTrackingService` | 成本追踪 |
| `BenchmarkService` | 基准测试（MMLU/HellaSwag/MATH） |

---

## 5. 后端模块详解

### 5.1 Skill Module — 技能管理

**路径**：`src/modules/skill/`
**文件**：`skill.controller.ts`、`skill.service.ts`、`skill.dto.ts`、`skill.module.ts`
**API**：`/api/skills`

管理待评测的 AI 技能，支持 CRUD 操作。每个 Skill 可关联多个 AgentEndpoint 和 SkillVersion。

### 5.2 Agent Module — 智能体接入与适配

**路径**：`src/modules/agent/`
**文件**：`agent.controller.ts`、`agent.service.ts`、`sse-parser.service.ts`、`agent.dto.ts`、`agent.module.ts`
**API**：`/api/agents`

**核心能力**：
- **SSE 格式自动探测**：发送测试请求，自动识别响应格式（content / delta / OpenAI / text / output / 自定义）
- **请求体模板**：支持 `{{input}}`、`{{context}}`、`{{timestamp}}` 变量注入
- **多种认证方式**：none / api_key / oauth / token
- **性能指标采集**：总延迟、首 token 延迟 (TTFT)、token 数量估算

**SSE 解析器**（`sse-parser.service.ts`，264 行）：
- 自动检测 SSE 流格式
- 支持 JSONPath / 正则提取
- 支持自定义解析模板

### 5.3 Dataset Module — 评测数据集管理

**路径**：`src/modules/dataset/`
**文件**：8 个文件（最大业务模块之一）
**API**：`/api/datasets`

| 服务 | 职责 |
|------|------|
| `DatasetService` | 数据集/用例 CRUD、快照、批量导入导出 |
| `DatasetCurationService` | 数据集筛选与管理（386 行） |
| `DatasetVersionService` | 数据集版本管理（创建/发布/归档/对比/回滚） |
| `AiGenerationService` | AI 生成 3 个候选答案 → 智能优选 → 人工确认 |
| `SyntheticDatasetService` | 合成数据集生成（多 persona、边缘情况发现） |

### 5.4 Executor Module — 自动化执行引擎

**路径**：`src/modules/executor/`
**文件**：`executor.service.ts`、`executor.module.ts`

**核心逻辑**：
- 并发执行（每批 5 个用例，可配置）
- 调用 `AgentService.invoke()` 执行智能体
- 收集执行产物：解析后文本、原始 SSE 流、耗时指标、错误信息
- 状态管理：pending → running → completed / failed

**调用链**：`ExecutorService.executeEvalRun()` → `AgentService.invoke()` → 保存 `EvalResult`

### 5.5 Eval Module — 多维度评测引擎

**路径**：`src/modules/eval/`
**文件**：24 个文件（系统最大模块）
**API**：`/api/eval`

#### 基础评测（EvalService）

| 评测方式 | 说明 | 评分维度 |
|----------|------|----------|
| 规则评测 | 精确匹配、关键词匹配、格式校验 | exactMatch / keywordMatch / formatCheck |
| AI 评测 | 调用 LLM 对输出打分 | 准确性(0.4) / 完整性(0.3) / 相关性(0.2) / 安全性(0.1) |
| 指标评测 | 基于性能指标评分 | 响应时间 / 首 token 延迟 |

#### 高级评测服务

- **RAG 指标**：Context Precision / Context Recall / Noise Sensitivity / Answer Context Relevance
- **对话指标**：连贯性 / 完整性 / 参与度 / 安全性 / 话题遵循度
- **红队扫描**：7 种攻击插件（注入/越狱/偏见/毒性等）
- **矩阵评测**：多模型×多prompt×多用例交叉对比
- **多模态评测**：图像描述/图像问答/图像分类/视觉定位/音频转写/音频问答
- **LLM-as-Judge**：单点评判 / 对比评判 / 参考评判 / 自定义 Rubric
- **基准测试**：MMLU / HellaSwag / MATH 等标准基准

### 5.6 Annotation Module — 双标注体系

**路径**：`src/modules/annotation/`
**文件**：`annotation.service.ts`、`annotation-consistency.service.ts`、`annotation.module.ts`

**流程**：
```
评测结果 → AI 预标注（自动评分+批注）→ 人工复核（修改确认）→ 计算一致性
```

`annotation-consistency.service.ts`（333 行）负责计算 AI 与人工标注的一致性指标。

### 5.7 Fixer Module — AI 魔法修复

**路径**：`src/modules/fixer/`
**文件**：`fixer.service.ts`、`fixer.module.ts`

**修复类型**：
- `prompt` — 改写提示词
- `knowledge` — 补充知识
- `parameter` — 调整参数

**流程**：Bad Case → AI 诊断根因 → 生成修复方案 → 应用修复 → 重跑验证 → 对比评分

### 5.8 Report Module — 评测报告与看板

**路径**：`src/modules/report/`
**文件**：`report.service.ts`、`report-export.service.ts`、`report.controller.ts`、`report.module.ts`

**导出格式**：JSON / HTML / Markdown / CSV

**报告内容**：
- 通过率、各维度平均分、平均延迟
- Bad Case 列表
- AI 智能分析：失败模式聚类、能力画像、改进建议、自然语言总结

### 5.9 Regression Module — 回归测试

**路径**：`src/modules/regression/`

对比两个版本的评测结果，自动识别回归项（passed → failed）和改进项（failed → passed）。

### 5.10 Pipeline Module — 流水线编排

**路径**：`src/modules/pipeline/`
**文件**：`pipeline.service.ts`、`pipeline-orchestration.service.ts`（416 行）、`pipeline.module.ts`

**预置模板**：

| 模板 | 节点 |
|------|------|
| 快速评测 | 执行 → 规则评测 → 出报告 |
| 完整评测 | 执行 → 规则评测 → AI评测 → 标注 → 修复 → 再验证 |
| 回归评测 | 执行 → 对比上一版本 → 告警 |

### 5.11 Prompt Module — Prompt 版本管理

**路径**：`src/modules/prompt/`
**文件**：`prompt-version.service.ts`（344 行）、`prompt.controller.ts`、`prompt.module.ts`

- Prompt 版本控制与标签管理（draft / staging / production / archived）
- 版本对比与状态流转

---

## 6. 数据模型

### 6.1 实体关系图

```
Skill (技能)
 ├── AgentEndpoint (接入端点)          1:N
 ├── EvalRun (评测执行)                1:N
 │    └── EvalResult (评测结果)        1:N
 │         └── Annotation (标注记录)   1:N
 └── SkillVersion (版本快照)           1:N

Dataset (数据集)
 ├── TestCase (评测用例)               1:N
 │    ├── EvalResult (评测结果)        1:N（反向关联）
 │    └── GenerationRecord (AI生成记录) 1:N
 └── DatasetSnapshot (数据快照)        1:N

FixRecord (修复记录) — 独立

Pipeline (流水线定义)
 └── PipelineInstance (执行实例)       1:N
      └── EvalRun (评测执行)           1:1
```

### 6.2 核心模型字段说明

| 模型 | 表名 | 关键字段 |
|------|------|----------|
| Skill | `skills` | name, description, version |
| AgentEndpoint | `agent_endpoints` | url, authType, sseFormat, sseTemplate, requestTemplate, timeout, maxRetries |
| SkillVersion | `skill_versions` | version, snapshot (JSON) |
| Dataset | `datasets` | name, description, category |
| TestCase | `test_cases` | input, expectedOutput, difficulty, tags, metadata |
| DatasetSnapshot | `dataset_snapshots` | version, data (JSON) |
| GenerationRecord | `generation_records` | candidates (JSON), aiRecommendation, selectedIndex, finalOutput |
| EvalRun | `eval_runs` | status, config, totalCases, passedCases, failedCases |
| EvalResult | `eval_results` | status, actualOutput, rawSseStream, metrics (JSON), scores (JSON) |
| Annotation | `annotations` | type (ai/human), scores (JSON), comment, isFinal |
| FixRecord | `fix_records` | diagnosis, suggestion, fixType, fixContent, verified |
| Pipeline | `pipelines` | template (JSON), isPreset, cronExpression |
| PipelineInstance | `pipeline_instances` | status, currentNode, progress (JSON) |

---

## 7. 前端页面

### 7.1 路由与页面映射

| 路由 | 页面组件 | 说明 |
|------|----------|------|
| `/dashboard` | `Dashboard.tsx` | 总览看板：技能数/数据集数/用例数/最近评测 |
| `/skills` | `Skills.tsx` | 技能管理：CRUD + 版本管理 |
| `/agents` | `Agents.tsx` | 智能体管理：接入配置 + SSE 探测 + 连接测试 |
| `/datasets` | `Datasets.tsx` | 数据集管理：用例管理 + AI 生成 + 快照 |
| `/eval-runs` | `EvalRuns.tsx` | 评测执行：发起评测 + 查看进度 + 结果详情（478 行，最大页面） |
| `/annotations` | `Annotations.tsx` | 标注管理：AI 预标注 + 人工复核 |
| `/reports` | `Reports.tsx` | 评测报告：查看/导出报告 |
| `/pipelines` | `Pipelines.tsx` | 流水线：预置模板 + 自定义编排 |
| `/leaderboard` | `Leaderboard.tsx` | 排行榜：多模型排名 + 指标对比 |
| `/observability` | `Observability.tsx` | 可观测性：延迟/成本/token 监控面板 |

### 7.2 UI 组件

| 组件 | 说明 |
|------|------|
| `MainLayout.tsx` | 主布局：可折叠侧边栏 + 顶栏 + 内容区 |
| `ui/badge.tsx` | 徽章组件 |
| `ui/button.tsx` | 按钮组件 |
| `ui/card.tsx` | 卡片组件 |
| `ui/dialog.tsx` | 对话框组件 |
| `ui/input.tsx` | 输入框组件 |
| `ui/table.tsx` | 表格组件 |

### 7.3 侧边栏菜单

```
📊 看板
🖼  技能管理
🤖 智能体管理
💾 评测数据集
▶️  评测执行
🏷  标注管理
📊 评测报告
🔀 流水线
🏆 排行榜
📈 可观测性
```

---

## 8. API 路由总览

所有 API 统一前缀 `/api`。

| 路由前缀 | Controller | 说明 |
|----------|------------|------|
| `/api/skills` | SkillController | 技能 CRUD |
| `/api/agents` | AgentController | 智能体 CRUD + SSE 探测 + 连接测试 |
| `/api/datasets` | DatasetController | 数据集/用例 CRUD + AI 生成 + 快照 + 导入导出 |
| `/api/eval` | EvalController | 评测执行 + 多种评测方式 + 排行榜 + 追踪 + 红队等 |
| `/api/reports` | ReportController | 报告生成 + 导出（JSON/HTML/MD/CSV） |
| `/api/prompts` | PromptController | Prompt 版本管理 |

---

## 9. 环境配置与启动

### 9.1 环境要求

- Node.js >= 18
- Redis（可选，默认使用 ioredis-mock 内存模式）

### 9.2 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `file:./dev.db` |
| `REDIS_HOST` | Redis 地址 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `PORT` | 后端服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `OPENAI_API_KEY` | AI 服务 API Key | — |
| `OPENAI_BASE_URL` | AI 服务接口地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | AI 模型名称 | `gpt-4` |

### 9.3 启动步骤

```bash
# 1. 安装后端依赖
cd auto-evalue-and-annotate
npm install

# 2. 初始化数据库
npx prisma generate
npx prisma migrate dev

# 3. 安装前端依赖
cd web
npm install

# 4. 启动后端（默认 http://localhost:3000）
npm run dev

# 5. 启动前端（默认 http://localhost:5173）
cd web && npm run dev
```

### 9.4 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端 API | http://localhost:3000/api |
| Swagger 文档 | http://localhost:3000/api/docs |

### 9.5 常用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动后端开发服务 |
| `npm run build` | 构建后端 |
| `npm run build:web` | 构建前端 |
| `npm run db:migrate` | 数据库迁移 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run db:generate` | 生成 Prisma Client |

---

## 10. 功能迭代历程

### v1.0 — 基础评测框架
技能管理 CRUD、数据集管理、评测执行、标注管理

### v1.1 — shadcn/ui 迁移
前端从 Ant Design 迁移到 shadcn/ui + Tailwind CSS，响应式侧边栏布局

### v1.2 — 评测功能增强
- 评测指标体系（借鉴 DeepEval）
- 矩阵对比评测 + 红队安全扫描 + YAML 用例导入（借鉴 Promptfoo）
- 评测追踪系统（借鉴 Langfuse）

### v1.3 — 高级评测能力
- 合成数据集生成（借鉴 Promptfoo）
- RAG 评测指标（借鉴 Ragas）
- 对话评测指标（借鉴 DeepEval）
- Prompt 版本管理（借鉴 Langfuse）
- 评测排行榜

### v1.4 — 可观测性与能力评估
- LLM 可观测性面板（借鉴 Arize Phoenix）
- 多维度能力评估 + 数据污染检测（借鉴 OpenCompass）

### v1.5 — CI/CD 集成
- 实验追踪服务（借鉴 MLflow）
- 质量门禁服务（CI/CD 集成）
- 用户反馈收集

### v1.6 — 多模态与版本管理
- 多模态评测服务（图像/音频，BLEU/CLIP Score）
- 数据集版本管理（创建/发布/归档/对比/回滚）
- 评测报告导出（JSON/HTML/MD/CSV）

### v1.7 — LLM 评判与安全护栏
- LLM-as-Judge 服务（借鉴 Microsoft llm-as-judge + TruLens）
- 输出护栏服务（借鉴 Guardrails AI）
- A/B 测试服务（借鉴 Langfuse）

### v1.8 — Prompt 优化与成本管理
- Prompt 优化服务（借鉴 AutoPrompt / Promptomatix）
- 成本追踪服务（借鉴 Langfuse / LLMTracker）
- 基准测试服务（借鉴 OpenCompass）

---

## 11. 参考项目

| 项目 | Stars | 借鉴功能 |
|------|-------|----------|
| DeepEval | 6k+ | 评测指标体系、G-Eval、对话评测 |
| Promptfoo | 8k+ | 矩阵评测、红队扫描、YAML 用例、合成数据 |
| Langfuse | 27k+ | 追踪系统、Prompt 管理、A/B 测试、成本追踪 |
| Ragas | 5k+ | RAG 专用评测指标 |
| OpenCompass（司南） | 4k+ | 中文评测基准、能力评估、数据污染检测 |
| MLflow | 27k+ | 实验追踪、质量门禁、反馈收集 |
| Arize Phoenix | 5k+ | LLM 可观测性 |
| Microsoft LLM-as-Judge | — | LLM 评判框架 |
| TruLens | 3k+ | LLM 评估与追踪 |
| Guardrails AI | 6.6k+ | LLM 输出验证与护栏 |
| AutoPrompt | — | Prompt 自动优化 |
| Promptomatix | — | 自动 Prompt 优化 |

---

> **文档生成时间**：2026-09-17
> **项目源码路径**：`c:\Users\admin\Desktop\学习\auto-evalue-and-annotate\`
> **后端源文件数**：60 个 TypeScript 文件
> **前端源文件数**：20 个 TSX/TS 文件
> **数据模型**：14 个 Prisma 模型，251 行 schema
