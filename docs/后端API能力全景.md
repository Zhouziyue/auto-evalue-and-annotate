# 后端 API 能力全景文档

## 一、核心业务模块

### 1. 技能管理 (Skills)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /skills | 创建技能 | ✅ 已实现 |
| GET /skills | 获取技能列表 | ✅ 已实现 |
| GET /skills/:id | 获取技能详情 | ✅ 已实现 |
| PUT /skills/:id | 更新技能 | ✅ 已实现 |
| DELETE /skills/:id | 删除技能 | ✅ 已实现 |
| GET /skills/:id/stats | 获取技能统计 | ⚠️ 详情页已展示 |

### 2. 智能体管理 (Agents)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /agents | 注册智能体 | ✅ 已实现 |
| GET /agents | 获取智能体列表 | ✅ 已实现 |
| GET /agents/:id | 获取智能体详情 | ✅ 已实现 |
| PUT /agents/:id | 更新智能体配置 | ✅ 已实现 |
| DELETE /agents/:id | 删除智能体 | ✅ 已实现 |
| POST /agents/:id/probe | 探测 SSE 响应格式 | ❌ 缺失 |
| POST /agents/:id/test | 测试智能体连接 | ✅ 已实现 |

### 3. 数据集管理 (Datasets)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /datasets | 创建数据集 | ✅ 已实现 |
| GET /datasets | 获取数据集列表 | ✅ 已实现 |
| GET /datasets/:id | 获取数据集详情 | ✅ 已实现 |
| PUT /datasets/:id | 更新数据集 | ✅ 已实现 |
| DELETE /datasets/:id | 删除数据集 | ✅ 已实现 |
| GET /datasets/:id/cases | 获取用例列表 | ✅ 详情页已展示 |
| POST /datasets/:id/cases | 添加用例 | ✅ 已实现 |
| PUT /datasets/:id/cases/:caseId | 更新用例 | ❌ 缺失 |
| DELETE /datasets/:id/cases/:caseId | 删除用例 | ❌ 缺失 |
| POST /datasets/generate | AI 生成评测用例 | ✅ 已实现 |
| POST /datasets/generate/batch | 批量 AI 生成 | ❌ 缺失 |
| POST /datasets/generate/select | 选择/修正 AI 答案 | ✅ 已实现 |
| POST /datasets/:id/snapshot | 创建数据集快照 | ❌ 缺失 |
| POST /datasets/:id/import | 导入用例 | ✅ 已实现 |
| GET /datasets/:id/export | 导出用例 | ✅ 已实现 |

### 4. 数据集版本管理
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /datasets/:id/versions | 创建数据集版本 | ❌ 缺失 |
| GET /datasets/:id/versions | 获取版本列表 | ❌ 缺失 |
| POST /datasets/:id/versions/:versionId/publish | 发布版本 | ❌ 缺失 |
| POST /datasets/:id/versions/:versionId/archive | 归档版本 | ❌ 缺失 |
| POST /datasets/:id/versions/diff | 对比两个版本 | ❌ 缺失 |
| POST /datasets/:id/versions/:versionId/rollback | 回滚到指定版本 | ❌ 缺失 |

### 5. 数据清洗
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /datasets/:id/clean | 清洗数据集 | ❌ 缺失 |
| GET /datasets/:id/quality-report | 生成质量报告 | ❌ 缺失 |
| GET /datasets/curation/rules | 获取筛选规则 | ❌ 缺失 |
| POST /datasets/curation/rules | 创建筛选规则 | ❌ 缺失 |
| POST /datasets/curation/rules/:id/toggle | 启用/禁用规则 | ❌ 缺失 |

---

## 二、评测执行模块

### 6. 评测指标 (Metrics)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/metrics/run | 运行所有指标评测 | ✅ 已实现 |
| POST /eval/metrics/:type | 运行单个指标 | ❌ 缺失 |
| POST /eval/metrics/g-eval/custom | G-Eval 自定义评测 | ❌ 缺失 |

### 7. RAG 评测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/rag/run | 运行所有 RAG 指标 | ❌ 缺失 |
| POST /eval/rag/context-precision | 上下文精度 | ❌ 缺失 |
| POST /eval/rag/context-recall | 上下文召回 | ❌ 缺失 |

### 8. 对话评测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/conversation/run | 运行对话评测 | ❌ 缺失 |
| POST /eval/conversation/coherence | 对话连贯性 | ❌ 缺失 |
| POST /eval/conversation/completeness | 对话完整性 | ❌ 缺失 |

### 9. 矩阵对比评测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/matrix | 运行矩阵评测 | ❌ 缺失 |
| POST /eval/matrix/export | 导出矩阵结果 | ❌ 缺失 |

### 10. 红队安全扫描
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/redteam | 运行红队测试 | ✅ 已实现 |
| POST /eval/redteam/generate | 生成攻击样本 | ❌ 缺失 |
| GET /eval/redteam/plugins | 获取可用插件 | ❌ 缺失 |

### 11. LLM-as-Judge 智能评判
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/judge/run | 运行 LLM 评判 | ✅ 已实现 |
| POST /eval/judge/batch | 批量评判 | ❌ 缺失 |
| GET /eval/judge/rubrics | 获取所有 Rubrics | ✅ 已实现 |
| GET /eval/judge/rubrics/:id | 获取单个 Rubric | ❌ 缺失 |
| POST /eval/judge/rubrics | 创建自定义 Rubric | ❌ 缺失 |

### 12. 输出护栏
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/guardrails/check-input | 检查输入 | ❌ 缺失 |
| POST /eval/guardrails/check-output | 检查输出 | ❌ 缺失 |
| POST /eval/guardrails/check-both | 同时检查 | ❌ 缺失 |
| GET /eval/guardrails/validators | 获取验证器 | ❌ 缺失 |
| POST /eval/guardrails/validators | 创建验证器 | ❌ 缺失 |
| POST /eval/guardrails/validators/:id/toggle | 切换验证器 | ❌ 缺失 |

---

## 三、报告与导出模块

### 13. 评测报告 (Reports)
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /report/eval-runs | 获取评测运行列表 | ✅ 已实现 |
| GET /report/eval-runs/:id | 获取评测运行详情 | ✅ 已实现 |
| POST /report/generate/:evalRunId | 生成评测报告 | ❌ 缺失 |
| POST /report/ai-analysis/:evalRunId | AI 智能分析 | ❌ 缺失 |
| GET /report/dashboard | 看板数据 | ❌ 缺失 |
| POST /report/export/:evalRunId | 导出报告 | ❌ 缺失 |
| GET /report/:id/export/csv | 导出 CSV | ❌ 缺失 |
| GET /report/:id/export/excel | 导出 Excel | ❌ 缺失 |
| GET /report/export/formats | 获取导出格式 | ❌ 缺失 |

---

## 四、流水线与调度模块

### 14. 流水线 (Pipeline)
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /pipeline/executions | 获取执行记录 | ✅ 已实现 |
| POST /pipeline | 创建流水线 | ✅ 已实现 |
| POST /pipeline/templates/:template | 从模板创建 | ❌ 缺失 |
| GET /pipeline | 获取流水线列表 | ✅ 已实现 |
| GET /pipeline/:id | 获取流水线详情 | ❌ 缺失 |
| POST /pipeline/:id/run | 运行流水线 | ✅ 已实现 |
| GET /pipeline/:id/runs | 获取运行列表 | ❌ 缺失 |
| GET /pipeline/runs/:runId | 获取运行详情 | ❌ 缺失 |
| POST /pipeline/:id/toggle | 启用/禁用 | ❌ 缺失 |
| PUT /pipeline/:id/schedule | 设置定时执行 | ❌ 缺失 |
| GET /pipeline/types/steps | 获取步骤类型 | ❌ 缺失 |

### 15. 评测调度
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/scheduler/tasks | 创建调度任务 | ❌ 缺失 |
| GET /eval/scheduler/tasks | 获取任务列表 | ❌ 缺失 |
| GET /eval/scheduler/tasks/:id | 获取任务详情 | ❌ 缺失 |
| POST /eval/scheduler/tasks/:id | 更新任务 | ❌ 缺失 |
| POST /eval/scheduler/tasks/:id/pause | 暂停任务 | ❌ 缺失 |
| POST /eval/scheduler/tasks/:id/resume | 恢复任务 | ❌ 缺失 |
| POST /eval/scheduler/tasks/:id/cancel | 取消任务 | ❌ 缺失 |
| POST /eval/scheduler/tasks/:id/delete | 删除任务 | ❌ 缺失 |
| POST /eval/scheduler/tasks/:id/trigger | 手动触发 | ❌ 缺失 |
| GET /eval/scheduler/executions | 获取执行记录 | ❌ 缺失 |
| GET /eval/scheduler/stats | 获取调度统计 | ❌ 缺失 |

---

## 五、追踪与可观测性模块

### 16. 追踪系统 (Traces)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/traces | 创建追踪 | ❌ 缺失 |
| GET /eval/traces | 获取追踪列表 | ❌ 缺失 |
| GET /eval/traces/:id | 获取追踪详情 | ❌ 缺失 |
| POST /eval/traces/:id/complete | 完成追踪 | ❌ 缺失 |
| GET /eval/sessions/:sessionId/stats | 获取 Session 统计 | ❌ 缺失 |

### 17. 可观测性 (Observability)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/observability/record | 记录 LLM 调用 | ❌ 缺失 |
| GET /eval/observability/stats | 获取统计 | ❌ 缺失 |
| GET /eval/observability/records | 获取调用记录 | ❌ 缺失 |

### 18. 成本追踪 (Cost Tracking)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/cost/record | 记录使用量 | ❌ 缺失 |
| GET /eval/cost/stats | 获取成本统计 | ❌ 缺失 |
| GET /eval/cost/records | 获取使用记录 | ❌ 缺失 |
| GET /eval/cost/pricing | 获取模型定价 | ❌ 缺失 |
| POST /eval/cost/predict | 成本预测 | ❌ 缺失 |
| POST /eval/cost/budget-alert | 创建预算告警 | ❌ 缺失 |
| GET /eval/cost/budget-alerts | 获取预算告警 | ❌ 缺失 |

---

## 六、高级评测模块

### 19. 排行榜 (Leaderboard)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/leaderboard | 生成排行榜 | ❌ 缺失 |
| GET /eval/leaderboard/summary | 获取排行榜摘要 | ❌ 缺失 |
| POST /eval/leaderboard/compare | 模型对比 | ❌ 缺失 |
| GET /eval/leaderboard/trend/:modelId | 获取趋势 | ❌ 缺失 |

### 20. 基准测试 (Benchmark)
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/benchmark/run | 运行基准测试 | ❌ 缺失 |
| POST /eval/benchmark/run-all | 运行所有基准 | ❌ 缺失 |
| GET /eval/benchmark/results | 获取结果 | ❌ 缺失 |
| POST /eval/benchmark/compare | 对比模型 | ❌ 缺失 |
| GET /eval/benchmark/types | 获取可用基准 | ❌ 缺失 |
| POST /eval/benchmark/custom | 添加自定义基准 | ❌ 缺失 |

### 21. Elo 评分排名
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/elo/battles | 记录对战 | ❌ 缺失 |
| POST /eval/elo/battles/batch | 批量记录 | ❌ 缺失 |
| GET /eval/elo/leaderboard | 生成排行榜 | ❌ 缺失 |
| GET /eval/elo/models/:model/rating | 获取模型评分 | ❌ 缺失 |
| GET /eval/elo/battles | 获取对战记录 | ❌ 缺失 |
| GET /eval/elo/expected | 预期对战结果 | ❌ 缺失 |
| POST /eval/elo/simulate | 模拟对战 | ❌ 缺失 |

### 22. A/B 测试
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/ab-tests | 创建 A/B 测试 | ❌ 缺失 |
| GET /eval/ab-tests | 获取测试列表 | ❌ 缺失 |
| GET /eval/ab-tests/:id | 获取测试详情 | ❌ 缺失 |
| POST /eval/ab-tests/:id/start | 启动测试 | ❌ 缺失 |
| POST /eval/ab-tests/:id/pause | 暂停测试 | ❌ 缺失 |
| POST /eval/ab-tests/:id/complete | 完成测试 | ❌ 缺失 |
| POST /eval/ab-tests/:id/runs | 记录运行结果 | ❌ 缺失 |
| GET /eval/ab-tests/:id/select-variant | 选择变体 | ❌ 缺失 |
| GET /eval/ab-tests/:id/results | 获取测试结果 | ❌ 缺失 |
| POST /eval/ab-tests/:id/compare | 对比变体 | ❌ 缺失 |

### 23. 实验追踪
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/experiments | 创建实验 | ❌ 缺失 |
| GET /eval/experiments | 获取实验列表 | ❌ 缺失 |
| GET /eval/experiments/:id | 获取实验详情 | ❌ 缺失 |
| POST /eval/experiments/:id/runs | 记录实验运行 | ❌ 缺失 |
| POST /eval/experiments/compare | 对比实验 | ❌ 缺失 |

### 24. 多模态评测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/multimodal/run | 运行多模态评测 | ❌ 缺失 |
| GET /eval/multimodal/types | 获取支持类型 | ❌ 缺失 |

### 25. 多维度能力评估
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/capability/run | 运行能力评测 | ❌ 缺失 |

### 26. 数据污染检测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/contamination/check | 运行污染检测 | ❌ 缺失 |

### 27. 质量门禁
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/quality-gate/check | 检查质量门禁 | ❌ 缺失 |
| GET /eval/quality-gate/config | 获取配置 | ❌ 缺失 |

### 28. 用户反馈
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/feedback | 提交反馈 | ❌ 缺失 |
| GET /eval/feedback | 获取反馈列表 | ❌ 缺失 |
| GET /eval/feedback/stats | 获取反馈统计 | ❌ 缺失 |
| POST /eval/feedback/thumbs-up | 点赞 | ❌ 缺失 |
| POST /eval/feedback/thumbs-down | 点踩 | ❌ 缺失 |
| POST /eval/feedback/rate | 评分 | ❌ 缺失 |

### 29. 回归检测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/regression/detect | 检测回归 | ❌ 缺失 |
| POST /eval/regression/detect-batch | 批量检测 | ❌ 缺失 |
| POST /eval/regression/baselines | 设置基线 | ❌ 缺失 |
| GET /eval/regression/baselines | 获取所有基线 | ❌ 缺失 |
| GET /eval/regression/detections | 获取检测历史 | ❌ 缺失 |
| GET /eval/regression/trend/:metric | 获取指标趋势 | ❌ 缺失 |
| GET /eval/regression/stats | 获取回归统计 | ❌ 缺失 |

### 30. 评测快照
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/snapshots | 创建快照 | ❌ 缺失 |
| POST /eval/snapshots/from-run/:evalRunId | 从评测运行创建 | ❌ 缺失 |
| GET /eval/snapshots | 获取快照列表 | ❌ 缺失 |
| GET /eval/snapshots/:id | 获取快照详情 | ❌ 缺失 |
| POST /eval/snapshots/:id/delete | 删除快照 | ❌ 缺失 |
| POST /eval/snapshots/compare | 对比两个快照 | ❌ 缺失 |
| GET /eval/snapshots/trend/:model/:metric | 获取模型趋势 | ❌ 缺失 |
| POST /eval/snapshots/:id/tags | 添加标签 | ❌ 缺失 |
| GET /eval/snapshots/tags | 获取所有标签 | ❌ 缺失 |

---

## 七、数据管理模块

### 31. 语义缓存
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /eval/cache/lookup | 查询缓存 | ❌ 缺失 |
| POST /eval/cache/store | 存储到缓存 | ❌ 缺失 |
| POST /eval/cache/:id/delete | 删除缓存条目 | ❌ 缺失 |
| POST /eval/cache/delete-by-tag | 按标签删除 | ❌ 缺失 |
| POST /eval/cache/clear | 清空缓存 | ❌ 缺失 |
| GET /eval/cache/stats | 获取缓存统计 | ❌ 缺失 |
| GET /eval/cache/entries | 获取缓存列表 | ❌ 缺失 |
| POST /eval/cache/config | 更新缓存配置 | ❌ 缺失 |
| GET /eval/cache/config | 获取缓存配置 | ❌ 缺失 |
| POST /eval/cache/warmup | 预热缓存 | ❌ 缺失 |
| GET /eval/cache/hit-rate-trend | 获取命中率趋势 | ❌ 缺失 |

### 32. 合成数据生成
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/synthetic/tasks | 创建生成任务 | ❌ 缺失 |
| POST /eval/synthetic/tasks/:id/start | 启动生成 | ❌ 缺失 |
| GET /eval/synthetic/tasks | 获取任务列表 | ❌ 缺失 |
| GET /eval/synthetic/tasks/:id | 获取任务详情 | ❌ 缺失 |
| GET /eval/synthetic/tasks/:id/results | 获取生成结果 | ❌ 缺失 |
| GET /eval/synthetic/tasks/:id/export/json | 导出 JSON | ❌ 缺失 |
| GET /eval/synthetic/tasks/:id/export/csv | 导出 CSV | ❌ 缺失 |
| GET /eval/synthetic/tasks/:id/quality | 质量报告 | ❌ 缺失 |
| POST /eval/synthetic/tasks/:id/delete | 删除任务 | ❌ 缺失 |

### 33. 数据增强
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/data-augmentation/tasks | 创建增强任务 | ❌ 缺失 |
| GET /eval/data-augmentation/tasks | 获取任务列表 | ❌ 缺失 |
| GET /eval/data-augmentation/tasks/:id | 获取任务详情 | ❌ 缺失 |
| POST /eval/data-augmentation/tasks/:id/execute | 执行增强 | ❌ 缺失 |
| GET /eval/data-augmentation/tasks/:id/results | 获取结果 | ❌ 缺失 |
| GET /eval/data-augmentation/tasks/:id/export | 导出结果 | ❌ 缺失 |
| POST /eval/data-augmentation/tasks/:id/delete | 删除任务 | ❌ 缺失 |
| GET /eval/data-augmentation/strategies | 获取策略 | ❌ 缺失 |

### 34. 数据脱敏
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/anonymization/anonymize | 脱敏文本 | ❌ 缺失 |
| POST /eval/anonymization/anonymize-batch | 批量脱敏 | ❌ 缺失 |
| POST /eval/anonymization/anonymize-json | 脱敏 JSON | ❌ 缺失 |
| POST /eval/anonymization/detect | 检测敏感数据 | ❌ 缺失 |
| GET /eval/anonymization/rules | 获取规则 | ❌ 缺失 |
| POST /eval/anonymization/rules | 添加规则 | ❌ 缺失 |
| POST /eval/anonymization/rules/:id/toggle | 切换规则 | ❌ 缺失 |
| POST /eval/anonymization/rules/:id/delete | 删除规则 | ❌ 缺失 |

### 35. 数据血缘
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/lineage/nodes | 注册节点 | ❌ 缺失 |
| GET /eval/lineage/nodes | 获取节点列表 | ❌ 缺失 |
| POST /eval/lineage/edges | 创建边 | ❌ 缺失 |
| GET /eval/lineage/:id/upstream | 获取上游 | ❌ 缺失 |
| GET /eval/lineage/:id/downstream | 获取下游 | ❌ 缺失 |
| GET /eval/lineage/:id/full | 获取完整血缘图 | ❌ 缺失 |
| GET /eval/lineage/:id/impact | 影响分析 | ❌ 缺失 |
| GET /eval/lineage/eval-run/:id/trace | 追踪评测运行血缘 | ❌ 缺失 |
| GET /eval/lineage/events | 获取事件历史 | ❌ 缺失 |

### 36. 数据集采样
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/sampling/sample | 执行采样 | ❌ 缺失 |
| GET /eval/sampling/results/:id | 获取采样结果 | ❌ 缺失 |
| GET /eval/sampling/results | 获取采样记录 | ❌ 缺失 |
| GET /eval/sampling/strategies | 获取可用策略 | ❌ 缺失 |

---

## 八、模板与配置模块

### 37. 评测模板
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /eval/templates | 获取模板列表 | ❌ 缺失 |
| GET /eval/templates/:id | 获取模板详情 | ❌ 缺失 |
| POST /eval/templates | 创建自定义模板 | ❌ 缺失 |
| POST /eval/templates/:id/update | 更新模板 | ❌ 缺失 |
| POST /eval/templates/:id/delete | 删除模板 | ❌ 缺失 |
| POST /eval/templates/:id/instantiate | 实例化模板 | ❌ 缺失 |
| GET /eval/templates/categories/list | 获取模板分类 | ❌ 缺失 |
| POST /eval/templates/:id/duplicate | 复制模板 | ❌ 缺失 |
| GET /eval/templates/:id/export | 导出模板 | ❌ 缺失 |
| POST /eval/templates/import | 导入模板 | ❌ 缺失 |

### 38. Prompt 管理
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /prompts | 获取 Prompt 列表 | ❌ 缺失 |
| GET /prompts/:id | 获取 Prompt 详情 | ❌ 缺失 |
| POST /prompts | 创建 Prompt | ❌ 缺失 |
| POST /prompts/:id/versions | 创建新版本 | ❌ 缺失 |
| GET /prompts/:id/versions | 获取版本列表 | ❌ 缺失 |
| PUT /prompts/:promptId/versions/:versionId/status | 更新版本状态 | ❌ 缺失 |
| GET /prompts/:id/versions/diff | 对比版本 | ❌ 缺失 |
| DELETE /prompts/:id | 删除 Prompt | ❌ 缺失 |

### 39. Prompt 优化
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/prompt-optimize | 优化 Prompt | ❌ 缺失 |
| GET /eval/prompt-optimize/strategies | 获取优化策略 | ❌ 缺失 |

### 40. 配置管理
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /eval/config/:key | 获取配置 | ❌ 缺失 |
| POST /eval/config | 设置配置 | ❌ 缺失 |
| POST /eval/config/batch-get | 批量获取 | ❌ 缺失 |
| GET /eval/config | 获取配置列表 | ❌ 缺失 |
| POST /eval/config/:id/delete | 删除配置 | ❌ 缺失 |
| GET /eval/config/changes | 变更历史 | ❌ 缺失 |
| POST /eval/config/:id/rollback | 回滚 | ❌ 缺失 |
| GET /eval/config/defaults/list | 默认配置 | ❌ 缺失 |
| GET /eval/config/export | 导出配置 | ❌ 缺失 |
| POST /eval/config/import | 导入配置 | ❌ 缺失 |

---

## 九、告警与通知模块

### 41. 告警配置
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /alert/config | 获取告警配置 | ❌ 缺失 |
| PUT /alert/config | 更新告警配置 | ❌ 缺失 |
| POST /alert/test | 测试 Webhook | ❌ 缺失 |

### 42. 告警规则
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/alerts/rules | 创建告警规则 | ❌ 缺失 |
| GET /eval/alerts/rules | 获取规则列表 | ❌ 缺失 |
| GET /eval/alerts/rules/:id | 获取规则详情 | ❌ 缺失 |
| POST /eval/alerts/rules/:id | 更新规则 | ❌ 缺失 |
| POST /eval/alerts/rules/:id/delete | 删除规则 | ❌ 缺失 |
| POST /eval/alerts/evaluate/:id | 评估规则 | ❌ 缺失 |
| GET /eval/alerts/events | 获取告警事件 | ❌ 缺失 |
| POST /eval/alerts/events/:id/acknowledge | 确认告警 | ❌ 缺失 |
| POST /eval/alerts/events/:id/resolve | 解决告警 | ❌ 缺失 |
| GET /eval/alerts/stats | 告警统计 | ❌ 缺失 |
| GET /eval/alerts/templates | 内置规则模板 | ❌ 缺失 |

### 43. Webhook 管理
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/webhooks | 创建 Webhook | ❌ 缺失 |
| GET /eval/webhooks | 获取 Webhook 列表 | ❌ 缺失 |
| GET /eval/webhooks/:id | 获取 Webhook 详情 | ❌ 缺失 |
| POST /eval/webhooks/:id | 更新 Webhook | ❌ 缺失 |
| POST /eval/webhooks/:id/delete | 删除 Webhook | ❌ 缺失 |
| POST /eval/webhooks/trigger | 触发事件 | ❌ 缺失 |
| GET /eval/webhooks/deliveries | 获取投递记录 | ❌ 缺失 |
| POST /eval/webhooks/deliveries/:id/redeliver | 重新投递 | ❌ 缺失 |
| GET /eval/webhooks/events/types | 获取事件类型 | ❌ 缺失 |

---

## 十、权限与多租户模块

### 44. 权限控制
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/permissions/users | 创建用户 | ❌ 缺失 |
| GET /eval/permissions/users | 获取用户列表 | ❌ 缺失 |
| POST /eval/permissions/users/:id/role | 更新角色 | ❌ 缺失 |
| POST /eval/permissions/check | 检查权限 | ❌ 缺失 |
| POST /eval/permissions/api-keys | 创建 API Key | ❌ 缺失 |
| GET /eval/permissions/api-keys | 获取 API Key 列表 | ❌ 缺失 |
| POST /eval/permissions/api-keys/:id/revoke | 撤销 API Key | ❌ 缺失 |
| GET /eval/permissions/roles/:role | 获取角色权限 | ❌ 缺失 |
| GET /eval/permissions/roles | 获取所有角色 | ❌ 缺失 |
| GET /eval/permissions/audit-logs | 审计日志 | ❌ 缺失 |

### 45. 多租户
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/tenants | 创建租户 | ❌ 缺失 |
| GET /eval/tenants/:id | 获取租户 | ❌ 缺失 |
| GET /eval/tenants | 获取租户列表 | ❌ 缺失 |
| POST /eval/tenants/:id/settings | 更新设置 | ❌ 缺失 |
| POST /eval/tenants/:id/upgrade | 升级计划 | ❌ 缺失 |
| GET /eval/tenants/:id/quota/:resource | 检查配额 | ❌ 缺失 |
| GET /eval/tenants/:id/usage | 使用统计 | ❌ 缺失 |
| POST /eval/tenants/:id/members | 添加成员 | ❌ 缺失 |
| GET /eval/tenants/:id/members | 获取成员 | ❌ 缺失 |
| POST /eval/tenants/:id/members/:userId/remove | 移除成员 | ❌ 缺失 |
| GET /eval/tenants/plans/list | 获取计划列表 | ❌ 缺失 |

---

## 十一、高级功能模块

### 46. 工作流引擎
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/workflows | 创建工作流 | ❌ 缺失 |
| GET /eval/workflows | 获取工作流列表 | ❌ 缺失 |
| GET /eval/workflows/:id | 获取工作流详情 | ❌ 缺失 |
| POST /eval/workflows/:id | 更新工作流 | ❌ 缺失 |
| POST /eval/workflows/:id/delete | 删除工作流 | ❌ 缺失 |
| POST /eval/workflows/:id/execute | 执行工作流 | ❌ 缺失 |
| GET /eval/workflows/executions | 获取执行列表 | ❌ 缺失 |
| GET /eval/workflows/executions/:id | 获取执行详情 | ❌ 缺失 |
| POST /eval/workflows/executions/:id/cancel | 取消执行 | ❌ 缺失 |
| GET /eval/workflows/templates | 获取内置模板 | ❌ 缺失 |

### 47. 多模型对比
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/comparison | 创建对比任务 | ❌ 缺失 |
| POST /eval/comparison/:id/execute | 执行对比 | ❌ 缺失 |
| GET /eval/comparison | 获取对比任务列表 | ❌ 缺失 |
| GET /eval/comparison/:id | 获取对比详情 | ❌ 缺失 |
| GET /eval/comparison/:id/report | 导出对比报告 | ❌ 缺失 |
| POST /eval/comparison/:id/delete | 删除对比任务 | ❌ 缺失 |

### 48. 指标聚合
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/aggregation/query | 执行聚合查询 | ❌ 缺失 |
| GET /eval/aggregation/trend/:metric | 获取趋势数据 | ❌ 缺失 |
| POST /eval/aggregation/compare | 对比数据 | ❌ 缺失 |
| GET /eval/aggregation/distribution/:metric | 获取分布数据 | ❌ 缺失 |

### 49. 在线评测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/online/configs | 创建在线评测配置 | ❌ 缺失 |
| GET /eval/online/configs | 获取配置列表 | ❌ 缺失 |
| GET /eval/online/configs/:id | 获取配置详情 | ❌ 缺失 |
| POST /eval/online/configs/:id | 更新配置 | ❌ 缺失 |
| POST /eval/online/configs/:id/delete | 删除配置 | ❌ 缺失 |
| POST /eval/online/:id/ingest | 接收在线数据 | ❌ 缺失 |
| GET /eval/online/:id/results | 获取评测结果 | ❌ 缺失 |
| GET /eval/online/:id/metrics/realtime | 获取实时指标 | ❌ 缺失 |

### 50. 可视化数据
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /eval/visualization/overview | 获取评测概览 | ❌ 缺失 |
| POST /eval/visualization/dashboards | 生成仪表盘 | ❌ 缺失 |
| GET /eval/visualization/dashboards/:id | 获取仪表盘 | ❌ 缺失 |
| GET /eval/visualization/dashboards | 获取仪表盘列表 | ❌ 缺失 |
| POST /eval/visualization/dashboards/:id/delete | 删除仪表盘 | ❌ 缺失 |
| POST /eval/visualization/comparison-chart | 模型对比图表 | ❌ 缺失 |
| GET /eval/visualization/distribution/:metric | 指标分布图 | ❌ 缺失 |

### 51. 结果搜索
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /eval/search | 搜索 | ❌ 缺失 |
| POST /eval/search/advanced | 高级搜索 | ❌ 缺失 |
| POST /eval/search/reindex | 重建索引 | ❌ 缺失 |
| GET /eval/search/stats | 搜索统计 | ❌ 缺失 |

### 52. 评测回放
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/replay | 创建回放 | ❌ 缺失 |
| POST /eval/replay/:id/execute | 执行回放 | ❌ 缺失 |
| GET /eval/replay | 获取回放列表 | ❌ 缺失 |
| GET /eval/replay/:id | 获取回放详情 | ❌ 缺失 |
| GET /eval/replay/:id/results | 获取回放结果 | ❌ 缺失 |
| GET /eval/replay/:id/comparison | 获取回放对比 | ❌ 缺失 |
| GET /eval/replay/:id/report | 导出回放报告 | ❌ 缺失 |
| POST /eval/replay/:id/cancel | 取消回放 | ❌ 缺失 |
| POST /eval/replay/:id/delete | 删除回放 | ❌ 缺失 |

### 53. 标注辅助
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/annotation/tasks | 创建标注任务 | ❌ 缺失 |
| GET /eval/annotation/tasks | 获取标注任务列表 | ❌ 缺失 |
| GET /eval/annotation/tasks/:id | 获取标注任务详情 | ❌ 缺失 |
| POST /eval/annotation/tasks/:id/pre-annotate | 生成预标注 | ❌ 缺失 |
| POST /eval/annotation/tasks/:id/submit | 提交标注 | ❌ 缺失 |
| POST /eval/annotation/tasks/:id/review | 审核标注 | ❌ 缺失 |
| GET /eval/annotation/tasks/:id/pending | 获取待标注项 | ❌ 缺失 |
| GET /eval/annotation/tasks/:id/annotated | 获取已标注项 | ❌ 缺失 |
| POST /eval/annotation/tasks/:id/activate | 激活任务 | ❌ 缺失 |
| POST /eval/annotation/tasks/:id/complete | 完成任务 | ❌ 缺失 |
| GET /eval/annotation/tasks/:id/quality | 获取质量指标 | ❌ 缺失 |
| GET /eval/annotation/tasks/:id/export | 导出标注 | ❌ 缺失 |
| GET /eval/annotation/types | 获取标注类型 | ❌ 缺失 |

### 54. 结果可解释性
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/result-explanation/explain | 生成解释 | ❌ 缺失 |
| GET /eval/result-explanation/explanations | 获取解释列表 | ❌ 缺失 |
| GET /eval/result-explanation/explanations/:id | 获取解释详情 | ❌ 缺失 |
| POST /eval/result-explanation/explanations/:id/delete | 删除解释 | ❌ 缺失 |
| GET /eval/result-explanation/types | 获取解释类型 | ❌ 缺失 |
| POST /eval/result-explanation/compare | 对比解释 | ❌ 缺失 |

### 55. 指标归因分析
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/metric-attribution/analyze | 分析归因 | ❌ 缺失 |
| GET /eval/metric-attribution/results | 获取归因结果 | ❌ 缺失 |
| GET /eval/metric-attribution/results/:id | 获取归因详情 | ❌ 缺失 |
| POST /eval/metric-attribution/results/:id/delete | 删除归因 | ❌ 缺失 |
| GET /eval/metric-attribution/feature-importance/:targetId | 特征重要性 | ❌ 缺失 |
| GET /eval/metric-attribution/sample-influence/:targetId | 样本影响 | ❌ 缺失 |
| POST /eval/metric-attribution/compare | 对比归因 | ❌ 缺失 |
| GET /eval/metric-attribution/types | 获取归因类型 | ❌ 缺失 |

### 56. 场景管理
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/scenarios | 创建场景 | ❌ 缺失 |
| POST /eval/scenarios/from-template/:templateId | 从模板创建 | ❌ 缺失 |
| GET /eval/scenarios | 获取场景列表 | ❌ 缺失 |
| GET /eval/scenarios/:id | 获取场景详情 | ❌ 缺失 |
| POST /eval/scenarios/:id/activate | 激活场景 | ❌ 缺失 |
| POST /eval/scenarios/:id/archive | 归档场景 | ❌ 缺失 |
| POST /eval/scenarios/:id/execute | 执行场景 | ❌ 缺失 |
| GET /eval/scenarios/executions | 获取执行列表 | ❌ 缺失 |
| GET /eval/scenarios/executions/:id | 获取执行详情 | ❌ 缺失 |
| GET /eval/scenarios/templates | 获取模板 | ❌ 缺失 |
| GET /eval/scenarios/templates/:id | 获取模板详情 | ❌ 缺失 |
| GET /eval/scenarios/types | 获取场景类型 | ❌ 缺失 |
| GET /eval/scenarios/stats | 获取场景统计 | ❌ 缺失 |

### 57. 数据质量评估
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/data-quality/check | 检查数据质量 | ❌ 缺失 |
| GET /eval/data-quality/results | 获取质量结果 | ❌ 缺失 |
| GET /eval/data-quality/results/:id | 获取质量详情 | ❌ 缺失 |
| POST /eval/data-quality/results/:id/delete | 删除质量结果 | ❌ 缺失 |
| GET /eval/data-quality/rules | 获取质量规则 | ❌ 缺失 |
| POST /eval/data-quality/rules | 添加质量规则 | ❌ 缺失 |
| POST /eval/data-quality/rules/:id/update | 更新质量规则 | ❌ 缺失 |
| POST /eval/data-quality/rules/:id/delete | 删除质量规则 | ❌ 缺失 |
| GET /eval/data-quality/dimensions | 获取质量维度 | ❌ 缺失 |
| GET /eval/data-quality/check-types | 获取检查类型 | ❌ 缺失 |

### 58. 任务编排
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/task-orchestration/orchestrations | 创建编排 | ❌ 缺失 |
| GET /eval/task-orchestration/orchestrations | 获取编排列表 | ❌ 缺失 |
| GET /eval/task-orchestration/orchestrations/:id | 获取编排详情 | ❌ 缺失 |
| POST /eval/task-orchestration/orchestrations/:id/execute | 执行编排 | ❌ 缺失 |
| POST /eval/task-orchestration/orchestrations/:id/cancel | 取消编排 | ❌ 缺失 |
| POST /eval/task-orchestration/orchestrations/:id/retry | 重试失败节点 | ❌ 缺失 |
| GET /eval/task-orchestration/orchestrations/:id/logs | 获取编排日志 | ❌ 缺失 |
| GET /eval/task-orchestration/task-types | 获取任务类型 | ❌ 缺失 |
| GET /eval/task-orchestration/stats | 获取编排统计 | ❌ 缺失 |

### 59. 模型蒸馏
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/distillation/tasks | 创建蒸馏任务 | ❌ 缺失 |
| GET /eval/distillation/tasks | 获取任务列表 | ❌ 缺失 |
| GET /eval/distillation/tasks/:id | 获取任务详情 | ❌ 缺失 |
| POST /eval/distillation/tasks/:id/execute | 执行蒸馏 | ❌ 缺失 |
| POST /eval/distillation/tasks/:id/generate-data | 生成蒸馏数据 | ❌ 缺失 |
| GET /eval/distillation/tasks/:id/data | 获取蒸馏数据 | ❌ 缺失 |
| GET /eval/distillation/tasks/:id/metrics | 获取蒸馏指标 | ❌ 缺失 |
| GET /eval/distillation/tasks/:id/compare | 对比蒸馏模型 | ❌ 缺失 |
| GET /eval/distillation/templates | 获取蒸馏模板 | ❌ 缺失 |
| GET /eval/distillation/templates/:id | 获取模板详情 | ❌ 缺失 |
| GET /eval/distillation/strategies | 获取蒸馏策略 | ❌ 缺失 |
| GET /eval/distillation/stats | 获取蒸馏统计 | ❌ 缺失 |

### 60. 联邦学习评测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/federated/tasks | 创建联邦任务 | ❌ 缺失 |
| GET /eval/federated/tasks | 获取任务列表 | ❌ 缺失 |
| GET /eval/federated/tasks/:id | 获取任务详情 | ❌ 缺失 |
| POST /eval/federated/tasks/:id/execute | 执行联邦 | ❌ 缺失 |
| GET /eval/federated/tasks/:id/history | 获取轮次历史 | ❌ 缺失 |
| GET /eval/federated/tasks/:id/participants | 获取参与者状态 | ❌ 缺失 |
| POST /eval/federated/tasks/:id/participants/:participantId/status | 更新参与者状态 | ❌ 缺失 |
| GET /eval/federated/tasks/:id/metrics | 获取联邦指标 | ❌ 缺失 |
| POST /eval/federated/tasks/:id/privacy | 设置隐私配置 | ❌ 缺失 |
| GET /eval/federated/tasks/:id/privacy | 获取隐私配置 | ❌ 缺失 |
| GET /eval/federated/types | 获取联邦类型 | ❌ 缺失 |
| GET /eval/federated/strategies | 获取聚合策略 | ❌ 缺失 |
| GET /eval/federated/stats | 获取联邦统计 | ❌ 缺失 |

### 61. 多语言评测
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/multilingual/evaluate | 多语言评测 | ❌ 缺失 |
| GET /eval/multilingual/results | 获取评测结果 | ❌ 缺失 |
| GET /eval/multilingual/languages | 获取语言配置 | ❌ 缺失 |
| GET /eval/multilingual/eval-types | 获取评测类型 | ❌ 缺失 |

### 62. 报告生成
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/reports/configs | 创建报告配置 | ❌ 缺失 |
| GET /eval/reports/configs | 获取报告配置列表 | ❌ 缺失 |
| GET /eval/reports/configs/:id | 获取报告配置详情 | ❌ 缺失 |
| POST /eval/reports/configs/:id/delete | 删除报告配置 | ❌ 缺失 |
| POST /eval/reports/generate/:configId | 生成报告 | ❌ 缺失 |
| GET /eval/reports/results | 获取报告结果列表 | ❌ 缺失 |
| GET /eval/reports/results/:id | 获取报告结果详情 | ❌ 缺失 |
| POST /eval/reports/results/:id/delete | 删除报告结果 | ❌ 缺失 |
| GET /eval/reports/types | 获取报告类型 | ❌ 缺失 |
| GET /eval/reports/formats | 获取报告格式 | ❌ 缺失 |

### 63. 数据版本控制
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/data-versioning/versions | 创建数据版本 | ❌ 缺失 |
| GET /eval/data-versioning/versions/:datasetId | 获取数据版本列表 | ❌ 缺失 |
| GET /eval/data-versioning/versions/:datasetId/:version | 获取数据版本详情 | ❌ 缺失 |
| POST /eval/data-versioning/versions/:datasetId/:version/publish | 发布数据版本 | ❌ 缺失 |
| POST /eval/data-versioning/versions/:datasetId/:version/archive | 归档数据版本 | ❌ 缺失 |
| POST /eval/data-versioning/diff | 对比数据版本 | ❌ 缺失 |
| POST /eval/data-versioning/rollback/:datasetId/:version | 回滚数据版本 | ❌ 缺失 |
| GET /eval/data-versioning/stats/:datasetId | 获取数据版本统计 | ❌ 缺失 |

### 64. API 限流
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/rate-limiting/check | 检查限流 | ❌ 缺失 |
| GET /eval/rate-limiting/configs | 获取限流配置 | ❌ 缺失 |
| POST /eval/rate-limiting/configs | 创建限流配置 | ❌ 缺失 |
| POST /eval/rate-limiting/configs/:id | 更新限流配置 | ❌ 缺失 |
| POST /eval/rate-limiting/configs/:id/delete | 删除限流配置 | ❌ 缺失 |
| GET /eval/rate-limiting/stats | 获取限流统计 | ❌ 缺失 |
| GET /eval/rate-limiting/blocklist | 获取黑名单 | ❌ 缺失 |
| POST /eval/rate-limiting/reset | 重置计数器 | ❌ 缺失 |

---

## 十二、其他模块

### 65. 标注一致性
| API | 功能 | 前端状态 |
|-----|------|----------|
| GET /annotation/consistency/:datasetId | 生成一致性报告 | ❌ 缺失 |
| GET /annotation/stats/:datasetId | 获取标注统计 | ❌ 缺失 |

### 66. YAML 导入
| API | 功能 | 前端状态 |
|-----|------|----------|
| POST /eval/yaml/validate | 验证 YAML 格式 | ❌ 缺失 |
| POST /eval/yaml/parse | 解析 YAML 预览 | ✅ 已实现 |
| POST /eval/yaml/import | 导入 YAML 到数据集 | ❌ 缺失 |
| GET /eval/yaml/template | 获取示例 YAML 模板 | ✅ 已实现 |

---

## 统计汇总

| 模块 | API 总数 | 已实现 | 缺失 | 完成率 |
|------|----------|--------|------|--------|
| 技能管理 | 6 | 6 | 0 | 100% |
| 智能体管理 | 7 | 6 | 1 | 86% |
| 数据集管理 | 13 | 9 | 4 | 69% |
| 数据集版本 | 6 | 0 | 6 | 0% |
| 数据清洗 | 5 | 0 | 5 | 0% |
| 评测指标 | 3 | 1 | 2 | 33% |
| RAG 评测 | 3 | 0 | 3 | 0% |
| 对话评测 | 3 | 0 | 3 | 0% |
| 矩阵评测 | 2 | 0 | 2 | 0% |
| 红队测试 | 3 | 1 | 2 | 33% |
| LLM Judge | 5 | 2 | 3 | 40% |
| 输出护栏 | 6 | 0 | 6 | 0% |
| 评测报告 | 9 | 2 | 7 | 22% |
| 流水线 | 11 | 4 | 7 | 36% |
| 评测调度 | 11 | 0 | 11 | 0% |
| 追踪系统 | 5 | 0 | 5 | 0% |
| 可观测性 | 3 | 0 | 3 | 0% |
| 成本追踪 | 7 | 0 | 7 | 0% |
| 排行榜 | 4 | 0 | 4 | 0% |
| 基准测试 | 6 | 0 | 6 | 0% |
| Elo 评分 | 7 | 0 | 7 | 0% |
| A/B 测试 | 10 | 0 | 10 | 0% |
| 实验追踪 | 5 | 0 | 5 | 0% |
| 多模态评测 | 2 | 0 | 2 | 0% |
| 能力评估 | 1 | 0 | 1 | 0% |
| 污染检测 | 1 | 0 | 1 | 0% |
| 质量门禁 | 2 | 0 | 2 | 0% |
| 用户反馈 | 6 | 0 | 6 | 0% |
| 回归检测 | 7 | 0 | 7 | 0% |
| 评测快照 | 9 | 0 | 9 | 0% |
| 语义缓存 | 11 | 0 | 11 | 0% |
| 合成数据 | 9 | 0 | 9 | 0% |
| 数据增强 | 8 | 0 | 8 | 0% |
| 数据脱敏 | 8 | 0 | 8 | 0% |
| 数据血缘 | 9 | 0 | 9 | 0% |
| 数据集采样 | 4 | 0 | 4 | 0% |
| 评测模板 | 10 | 0 | 10 | 0% |
| Prompt 管理 | 8 | 0 | 8 | 0% |
| Prompt 优化 | 2 | 0 | 2 | 0% |
| 配置管理 | 10 | 0 | 10 | 0% |
| 告警配置 | 3 | 0 | 3 | 0% |
| 告警规则 | 11 | 0 | 11 | 0% |
| Webhook | 9 | 0 | 9 | 0% |
| 权限控制 | 10 | 0 | 10 | 0% |
| 多租户 | 11 | 0 | 11 | 0% |
| 工作流引擎 | 10 | 0 | 10 | 0% |
| 多模型对比 | 6 | 0 | 6 | 0% |
| 指标聚合 | 4 | 0 | 4 | 0% |
| 在线评测 | 8 | 0 | 8 | 0% |
| 可视化 | 7 | 0 | 7 | 0% |
| 结果搜索 | 4 | 0 | 4 | 0% |
| 评测回放 | 9 | 0 | 9 | 0% |
| 标注辅助 | 13 | 0 | 13 | 0% |
| 结果可解释性 | 6 | 0 | 6 | 0% |
| 指标归因 | 8 | 0 | 8 | 0% |
| 场景管理 | 13 | 0 | 13 | 0% |
| 数据质量 | 10 | 0 | 10 | 0% |
| 任务编排 | 9 | 0 | 9 | 0% |
| 模型蒸馏 | 12 | 0 | 12 | 0% |
| 联邦学习 | 13 | 0 | 13 | 0% |
| 多语言评测 | 4 | 0 | 4 | 0% |
| 报告生成 | 10 | 0 | 10 | 0% |
| 数据版本控制 | 8 | 0 | 8 | 0% |
| API 限流 | 8 | 0 | 8 | 0% |
| 标注一致性 | 2 | 0 | 2 | 0% |
| YAML 导入 | 4 | 2 | 2 | 50% |

**总计**: 约 400+ API 端点，前端已实现约 30 个，完成率约 7.5%

---

## 优先级建议

### P0 - 核心功能（必须实现）
1. 评测报告生成与导出（CSV/Excel/HTML）
2. 数据集版本管理
3. 数据清洗与质量报告
4. 评测模板管理
5. Prompt 管理与版本控制

### P1 - 重要功能（优先实现）
1. RAG 评测
2. 对话评测
3. A/B 测试
4. 实验追踪
5. 标注辅助系统
6. 结果可解释性

### P2 - 高级功能（后续实现）
1. 基准测试
2. Elo 评分
3. 联邦学习评测
4. 模型蒸馏
5. 多语言评测
6. 多模态评测

### P3 - 辅助功能（按需实现）
1. 语义缓存
2. 数据血缘
3. 成本追踪
4. 可观测性
5. Webhook 管理
6. API 限流
