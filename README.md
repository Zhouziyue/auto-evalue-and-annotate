# 技能评测系统 (Auto-Evaluate & Annotate)

> 面向 AI 技能 / Agent 的自动化评测平台，支持 **"跑 → 评 → 标 → 修 → 验"** 全链路闭环。

## 系统定位

解决 AI 技能迭代过程中 **"改了不知道好不好、好了不知道好多少"** 的问题。通过自动化评测、双标注体系、AI 修复建议，让技能质量可量化、可追溯、可自动回归。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite 5 + Ant Design 5 + React Router 6 |
| 后端 | NestJS 10 + TypeScript |
| 数据库 | SQLite (Prisma ORM) |
| 任务队列 | Bull (Redis / ioredis-mock 内存模式) |
| AI 能力 | OpenAI API 兼容接口（评测、标注、修复、用例生成） |

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (React + Vite)                       │
│  Dashboard │ Agents │ Datasets │ EvalRuns │ Annotations │ Reports│
└──────────────────────────────┬──────────────────────────────────┘
                               │ /api/*
┌──────────────────────────────▼──────────────────────────────────┐
│                     后端 (NestJS, port 3000)                     │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Agent   │  │ Dataset  │  │ Executor │  │   Eval   │        │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │              │              │              │              │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐        │
│  │Annotation│  │  Fixer   │  │  Report  │  │Regression│        │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Pipeline Module (流水线编排)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌─────────────────────┐  ┌──────────────┐       │
│  │  Prisma  │  │ Bull (任务队列)      │  │ Swagger API  │       │
│  │  Module  │  │ Redis / ioredis-mock│  │   Docs       │       │
│  └──────────┘  └─────────────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 核心模块详解

### 1. Agent Module — 智能体接入与适配

**职责**：管理待评测的智能体，处理 HTTP + SSE 协议适配。

| 文件 | 说明 |
|------|------|
| `agent.controller.ts` | REST API：CRUD + SSE 探测 + 连接测试 |
| `agent.service.ts` | 核心逻辑：调用智能体、构建请求体、处理认证 |
| `sse-parser.service.ts` | SSE 流解析器：自动检测格式、模板提取、JSONPath 解析 |
| `agent.dto.ts` | 请求校验 DTO |

**关键能力**：
- **SSE 格式自动探测**：发送测试请求，自动识别响应格式（content / delta / OpenAI / text / output / 自定义）
- **请求体模板**：支持 `{{input}}`、`{{context}}`、`{{timestamp}}` 变量注入
- **多种认证方式**：none / api_key / oauth / token
- **性能指标采集**：总延迟、首 token 延迟 (TTFT)、token 数量估算

**API 路由**：`/api/agents`

---

### 2. Dataset Module — 评测数据集管理

**职责**：管理评测数据集和用例，支持 AI 辅助生成标准答案。

| 文件 | 说明 |
|------|------|
| `dataset.controller.ts` | REST API：数据集 CRUD + 用例管理 + AI 生成 + 快照 + 导入导出 |
| `dataset.service.ts` | 数据集/用例的增删改查、快照、批量导入导出 |
| `ai-generation.service.ts` | AI 生成 3 个候选答案 → 智能优选 → 人工确认 |
| `dataset.dto.ts` | 请求校验 DTO |

**关键能力**：
- **用例分级**：easy / medium / hard，支持标签和元数据
- **AI 生成评测用例**：输入问题 → AI 生成 3 个不同风格候选答案（简洁型/详细型/结构化）→ 自动推荐最优 → 人工选择或修正
- **数据集快照**：版本化管理，支持回溯
- **批量操作**：JSON 导入导出

**API 路由**：`/api/datasets`

---

### 3. Executor Module — 自动化执行引擎

**职责**：并发执行评测任务，调用智能体跑用例。

| 文件 | 说明 |
|------|------|
| `executor.service.ts` | 执行核心：批量并发跑用例、收集结果、更新状态 |

**关键能力**：
- **并发执行**：每批 5 个用例并行（可配置）
- **执行产物**：解析后文本、原始 SSE 流、耗时指标、错误信息
- **状态管理**：pending → running → completed / failed

**调用链**：`ExecutorService.executeEvalRun()` → `AgentService.invoke()` → 保存 `EvalResult`

---

### 4. Eval Module — 多维度评测引擎

**职责**：对执行结果进行多维度评分。

| 文件 | 说明 |
|------|------|
| `eval.service.ts` | 三种评测模式：规则评测、AI 评测、指标评测 |

**评测方式**：

| 方式 | 说明 | 评分维度 |
|------|------|----------|
| 规则评测 | 精确匹配、关键词匹配、格式校验 | exactMatch / keywordMatch / formatCheck |
| AI 评测 | 调用 LLM 对输出打分 | 准确性(0.4) / 完整性(0.3) / 相关性(0.2) / 安全性(0.1) |
| 指标评测 | 基于性能指标评分 | 响应时间 / 首 token 延迟 |

---

### 5. Annotation Module — 双标注体系

**职责**：AI 预标注 + 人工复核，计算标注一致性。

| 文件 | 说明 |
|------|------|
| `annotation.service.ts` | AI 预标注、人工标注、一致性计算（余弦相似度） |

**流程**：
```
评测结果 → AI 预标注（自动评分+批注）→ 人工复核（修改确认）→ 计算一致性
```

---

### 6. Fixer Module — AI 魔法修复

**职责**：诊断 bad case 根因，生成修复建议，验证修复效果。

| 文件 | 说明 |
|------|------|
| `fixer.service.ts` | AI 诊断、生成修复建议、应用修复、验证效果 |

**修复类型**：
- `prompt` — 改写提示词
- `knowledge` — 补充知识
- `parameter` — 调整参数

**流程**：
```
Bad Case → AI 诊断根因 → 生成修复方案 → 应用修复 → 重跑验证 → 对比评分
```

---

### 7. Report Module — 评测报告与看板

**职责**：生成评测报告、AI 智能分析、看板数据。

| 文件 | 说明 |
|------|------|
| `report.service.ts` | 报告生成、AI 深度分析、看板统计 |

**报告内容**：
- 通过率、各维度平均分、平均延迟
- Bad Case 列表（输入/输出/期望/评分）
- AI 智能分析：失败模式聚类、能力画像、改进建议、自然语言总结

**看板数据**：技能总数、数据集总数、用例总数、最近评测记录

---

### 8. Regression Module — 回归测试与版本对比

**职责**：对比两个版本的评测结果，发现退化项。

| 文件 | 说明 |
|------|------|
| `regression.service.ts` | 版本对比、版本快照 |

**对比内容**：
- 逐用例对比：状态变化、输出差异、评分变化
- 自动识别：回归项（passed → failed）、改进项（failed → passed）
- 版本快照：保存某版本的评测指标，用于历史追溯

---

### 9. Pipeline Module — 流水线编排

**职责**：将评测流程节点串联，支持预置模板和自定义编排。

| 文件 | 说明 |
|------|------|
| `pipeline.service.ts` | 流水线创建、执行、实例管理、预置模板 |

**预置模板**：

| 模板 | 节点 |
|------|------|
| 快速评测 | 执行 → 规则评测 → 出报告 |
| 完整评测 | 执行 → 规则评测 → AI评测 → 标注 → 修复 → 再验证 |
| 回归评测 | 执行 → 对比上一版本 → 告警 |

---

## 数据模型

```
Skill (技能)
 ├── AgentEndpoint (接入端点)     1:N
 └── SkillVersion (版本快照)      1:N

Dataset (数据集)
 ├── TestCase (评测用例)          1:N
 │    └── GenerationRecord (AI生成记录)  1:N
 └── DatasetSnapshot (数据快照)   1:N

EvalRun (评测执行)
 └── EvalResult (评测结果)        1:N
      └── Annotation (标注记录)   1:N

FixRecord (修复记录)             独立

Pipeline (流水线定义)
 └── PipelineInstance (执行实例)  1:N
```

---

## 前端页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/dashboard` | Dashboard | 总览看板 |
| `/agents` | Agents | 智能体管理 |
| `/datasets` | Datasets | 数据集管理 |
| `/eval-runs` | EvalRuns | 评测执行记录 |
| `/annotations` | Annotations | 标注管理 |
| `/reports` | Reports | 评测报告 |
| `/pipelines` | Pipelines | 流水线编排 |

---

## 快速启动

### 环境要求

- Node.js >= 18
- Redis（可选，默认使用 ioredis-mock 内存模式）

### 安装与运行

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
cd ..
npm run dev

# 5. 启动前端（默认 http://localhost:5173）
cd web
npm run dev
```

### 环境变量

复制 `.env.example` 为 `.env`：

```env
DATABASE_URL="file:./dev.db"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_key_here        # 留空则使用模拟数据
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端 API | http://localhost:3000/api |
| Swagger 文档 | http://localhost:3000/api/docs |

---

## 项目结构

```
auto-evalue-and-annotate/
├── src/
│   ├── common/prisma/          # Prisma 公共模块
│   ├── modules/
│   │   ├── agent/              # 智能体接入与适配（含 SSE 解析）
│   │   ├── dataset/            # 数据集管理 + AI 用例生成
│   │   ├── executor/           # 自动化执行引擎
│   │   ├── eval/               # 多维度评测引擎
│   │   ├── annotation/         # 双标注体系
│   │   ├── fixer/              # AI 修复
│   │   ├── report/             # 评测报告与看板
│   │   ├── regression/         # 回归测试与版本对比
│   │   └── pipeline/           # 流水线编排
│   ├── app.module.ts           # 根模块
│   └── main.ts                 # 入口
├── web/                        # React 前端
│   └── src/
│       ├── pages/              # 7 个功能页面
│       ├── components/         # 布局组件
│       └── App.tsx             # 路由配置
├── prisma/
│   └── schema.prisma           # 数据模型定义
├── docs/
│   └── 系统方案.md              # 系统设计方案
├── docker-compose.yml          # Redis 容器（可选）
└── package.json
```
