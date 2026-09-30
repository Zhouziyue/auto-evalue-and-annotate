# 定时任务提示词 · Supabase 风格前端重构 + 现有功能完全补充

> 计划触发时间：今晚 22:30（2026-09-30）
> 选定设计风格：**Supabase**（暗色优先 + 荧光绿强调）
> 推进策略：功能补充最大化推进（P0→P4）
> Git：分阶段提交并 push
> 说明：本文件是可交给 Agent 直接执行的完整提示词，风格 token 已写死，无需再联网选风格。

---

## 0. 运行环境与自主性约束（无人值守，务必遵守）
- 项目根目录：`c:\Users\admin\Desktop\学习\auto-evalue-and-annotate`
- 技术栈：后端 NestJS 10 + TypeScript + Prisma + SQLite；前端 React 18 + Vite 5 + TypeScript + shadcn/ui + Radix + Tailwind CSS（位于 `web/`）
- Shell 为 Windows PowerShell：命令分隔用 `;`，禁用 `&&`；npm/git/npx 若报 command not found，用绝对路径重试（git 常见于 `C:\Program Files\Git\cmd\git.exe`）
- 全程非交互：不得等待用户输入或权限确认；需要决策处一律采用最合理默认值并记录到报告
- 数据库如需迁移：禁用交互式 `prisma migrate dev`，改用 `npx prisma migrate diff --script` 生成 SQL 落盘到 `prisma/migrations/<时间戳>_<名>/migration.sql` + `npx prisma migrate deploy` 应用 + `npx prisma generate`
- 前端严禁 Mock 数据，所有页面必须调用真实后端 API（`/api` 前缀，vite proxy 已配）
- 后端 Service 文件沿用现有 `// @ts-nocheck` 约定
- 每完成一个阶段都必须保证：前端 `cd web; npx tsc --noEmit` 零错误、后端 `npx tsc -p tsconfig.json --noEmit` 零错误；任意时刻项目可编译、可启动
- 遇到无法解决的阻塞：记录到报告"阻塞项"，跳过并继续，不中断整个任务

## 0.1 开跑前置（Preflight，务必最先执行）
- 先 `git status` 检查工作区。当前可能存在**本任务之外的既有未提交改动**（标注系统重构：`prisma/schema.prisma`、`prisma/migrations/20260929000000_redesign_annotation/`、`src/modules/annotation/*`、`src/modules/eval/annotation-assistance.service.ts`、`eval.controller.ts`、`test/helpers.ts`、`web/src/pages/Annotations.tsx`、`web/src/components/annotations/*`、以及本提示词 md）
- 若有这类既有改动：**先单独提交为一个基线 commit**（信息示例：`feat(annotation): 标注系统重构与工作流增强`）并 push，使工作区干净后再开始本任务，避免混入后续分阶段提交
- 确认依赖就绪：根目录与 `web/` 下 `node_modules` 存在；缺失则非交互 `npm install`
- 记录起始 commit hash 到报告，便于回溯
- push 前置已验证：远程 `git@github.com:Zhouziyue/auto-evalue-and-annotate.git`，分支 `main`（upstream `origin/main`），SSH 非交互认证可用

## 1. 总体目标（先风格、后功能）
- **目标 A：前端风格完全重构为 Supabase 风格**——替换现有 Indigo/WebUI v1.0 视觉，全量落地
- **目标 B：现有功能完全补充**——把后端已具备但前端缺失/仅占位的能力全部补齐为可用实现
- 顺序：先立风格基座（A0–A2），再全量 sweep 页面（A3）与补功能（B），补功能时直接套用新风格

## 2. 目标 A：Supabase 风格前端重构

### A0. 明确禁止与既定方向
- **禁止**参考 `knowledge-study` 下任何 WebUI 规范文档，**禁止**沿用 `web/src/index.css` 里现有 "WebUI设计规范 v1.0" 的 Indigo 配色作为基准；本任务用下面的 Supabase token 全量替换
- 目标观感：Supabase 官网/控制台那种——暗色优先、荧光绿强调、发丝级描边、圆角克制、数据密集但通透、细节精致

### A1. 重建 Design Tokens（重写 `web/src/index.css` 的 CSS 变量 + `web/tailwind.config.js` 的 theme.extend）
采用以下 Supabase 风格 token（暗色为默认主题，同时提供亮色）：

**暗色（默认，`:root` 或 `.dark`）**
- 背景 base：`#1C1C1C`；页面更深层 `#171717`
- 面板/卡片 surface：`#232323`；悬浮/elevated：`#2A2A2A`
- 描边 border：`#2E2E2E`（发丝级，1px）；更浅分隔 `#262626`
- 主色 primary（荧光绿）：`#3ECF8E`；hover：`#57D9A3`；active：`#2FB57C`；主色上的前景文字：`#0A0A0A`
- 主文字 foreground：`#EDEDED`；次要/ muted 文字：`#A0A0A0`；更弱：`#7A7A7A`
- 语义色：success `#3ECF8E`；warning `#F5A623`；error/destructive `#F56565`；info `#6C9FF8`
- 圆角 radius：`6px`（md），卡片/弹窗可到 `8px`
- 阴影：暗色下以描边分层为主，阴影极弱（如 `0 1px 2px rgba(0,0,0,.4)`）
- 字体：`Inter, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`；等宽 `"JetBrains Mono", "SF Mono", Consolas, monospace`
- 字号阶梯（正文 14px 起）：12/13/14/16/20/24/30；正文行高约 1.57（中文友好）

**亮色（备选主题，`.light` 或默认 `:root` 的 light 分支）**
- 背景 `#FFFFFF`；surface `#F7F7F7`；border `#E5E7EB`
- 主色绿（提高对比）：`#249E73`，hover `#1C8A64`，主色上文字 `#FFFFFF`
- 主文字 `#1F1F1F`；muted `#6B7280`
- 语义色：success `#249E73`；warning `#D97706`；error `#DC2626`；info `#2563EB`

要求：
- 保留现有"CSS 变量 + tailwind extend"机制，只替换取值；确保 `bg-background / text-foreground / bg-card / border-border / primary / success / warning / destructive / info / muted` 等语义类名全部可用
- 暗色为默认；主题切换（HTML class + localStorage 持久化）保持可用，移动端侧边栏 overlay drawer 保持可用
- 图表/数据可视化配色也统一到该色板（绿色主色 + 中性灰阶 + 语义色）

### A2. 升级基础 UI 组件与布局骨架
- 按 Supabase 风格调整 `web/src/components/ui/*`：button（绿色主按钮、暗色描边次按钮）、card（`#232323` 面板 + 发丝描边 + 弱阴影）、badge（含状态 pill）、table（暗色斑马/描边、行 hover）、input/select（暗底、focus 绿色 ring）、dialog、tabs、toast
- 优化 `web/src/components/MainLayout.tsx`：暗色侧边栏、当前项绿色高亮/左侧指示条、顶栏搜索与头像，整体通透精致

### A3. 全量页面风格 sweep（`web/src/pages` 下共 59 个页面）
逐页套用 Supabase 新风格，并统一遵循布局/交互规范：
- 数据列表页用紧凑行内统计条，不用独立 Card 包数字；工具栏用 flex div 不嵌 Card；表格直接展示不嵌 Card/CardHeader；按钮统一 `size="sm"`
- 上千条数据的列表页禁用大数量级卡片布局
- 表格行统一 `hover:bg-muted/50 transition-colors duration-150`
- 硬编码颜色（如 `text-green-600`）一律换语义色（`text-success`/`bg-success-light`/`text-info` 等）
- `alert()` 全换 Toast（success 3s，error/warning 5s）；加载态用骨架屏或 spinner；空状态给图标 + 友好文案；必填项标 `text-destructive`
- 页面垂直间距：普通页 `space-y-4`，多区域复杂页（Datasets/EvalRuns/Skills/Agents/Dashboard/Settings 等）`space-y-6`
- 卡片交互禁止用绝对定位遮挡内容
- 每页不能只停留在增删改查，需提供详情展示视图
- 每改完一批页面跑一次前端 tsc，保证零错误
- 注意：标注模块（`web/src/pages/Annotations.tsx` 及 `web/src/components/annotations/*`）刚重构过（总览/工作台/质量看板三视图），保持功能不被破坏，仅套用新风格

## 3. 目标 B：现有功能完全补充

### B0. 建立"后端能力 vs 前端实现"差集
- 通读 `docs/后端API能力全景.md`、`docs/前端能力补齐落地计划.md`，并实际扫描后端各 controller 路由，列出"后端已有但前端缺失/仅占位"的清单作为补齐依据

### B1. 按功能域逐批补齐（对齐落地计划 5 批次）
- 第一批 核心评测闭环：报告生成/AI 分析/多格式导出、数据集版本管理、数据清洗与质量、评测模板、Prompt 管理
- 第二批 评测能力增强：RAG、对话评测、A/B 测试、实验追踪、标注辅助、结果可解释性
- 第三批 高级评测：基准测试、Elo 排名、回归检测、评测快照、用户反馈、多模态、污染检测、质量门禁
- 第四批 数据与可观测性：追踪、可观测性、成本追踪、语义缓存、合成数据、数据增强、数据脱敏、数据采样
- 第五批 平台化：权限、多租户、Webhook、告警规则、工作流、配置管理、输出护栏、指标归因、场景管理
- 每个功能：占位页替换为真实实现并接真实 API；新页面在 `web/src/App.tsx` 注册路由、在 `MainLayout.tsx` 侧边栏加导航；沿用 A 阶段新风格与布局规范
- 若需新增后端逻辑，补对应单测

### B2. 现实性与推进策略（最大化推进）
- 工作量极大，无法保证一夜全部完成：按批次系统推进，优先级 P0→P4，保证任意时刻可编译可运行，最大化完成度
- 每完成一个功能域跑前端 tsc + `cd web; npm run build` 确认可构建

## 4. 质量验收（全部执行）
1. 前端 `cd web; npx tsc --noEmit` 与 `cd web; npm run build` 均成功零错误
2. 后端 `npx tsc -p tsconfig.json --noEmit` 零错误；`npx jest` 全量单测通过
3. 启动后端 `npm run dev`（:3000）与前端 `cd web; npm run dev`（:5173），对关键新端点冒烟（HTTP 200 + 合理数据）
4. 以用户视角全量探索：侧边栏逐页进入、点击主要操作，发现报错即修复后再次全量回归，循环直至稳定
5. 关键链路补/跑 Playwright E2E（`web/e2e`），至少覆盖导航与一条核心业务链路

## 5. Git 提交与 push
- 分阶段提交（风格基座 / 每批次功能 各一提交），提交信息遵循项目 Git 命名规范（功能描述式）
- **每阶段提交后 push 到当前分支对应的远程**；禁止 force push、禁止改 git config、禁止跳过 hooks
- push 前确认工作区仅包含本任务相关改动

## 6. 交付物
- 写入 `docs/前端重构与功能补充报告.md`：
  - Supabase 风格落地摘要与 token 变更（暗/亮对照）
  - 改动文件清单（按 A/B 分类）
  - 功能补齐"已完成 / 未完成 / 阻塞项"对照表
  - 各项验收结果（tsc/build/jest/冒烟/E2E）
  - 已 push 的提交列表与后续建议

## 7. 完成信号
- 上述验收全部通过、报告写入、改动已分阶段 push 后，任务视为完成
- 若因工作量未全部完成，也在报告中如实标注进度与剩余项后结束
