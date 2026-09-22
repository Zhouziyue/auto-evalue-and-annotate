import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { PlayCircle, BarChart3, Shield, FileText, Zap, Eye, CheckCircle2, XCircle, Sparkles, Award, Tag } from 'lucide-react'
import axios from 'axios'

export default function EvalRuns() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'history' | 'metrics' | 'judge' | 'matrix' | 'redteam' | 'yaml'>('history')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRun, setDetailRun] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { toastSuccess, toastError, toastWarning } = useToastActions()

  // 指标评测状态
  const [metricsInput, setMetricsInput] = useState({
    input: '',
    actualOutput: '',
    expectedOutput: '',
    context: '',
  })
  const [metricsResult, setMetricsResult] = useState<any[]>([])
  const [metricsLoading, setMetricsLoading] = useState(false)

  // LLM Judge 状态
  const [judgeInput, setJudgeInput] = useState({
    input: '',
    output: '',
    expectedOutput: '',
    rubricId: 'helpfulness',
  })
  const [judgeResult, setJudgeResult] = useState<any>(null)
  const [judgeLoading, setJudgeLoading] = useState(false)
  const [rubrics, setRubrics] = useState<any[]>([])

  // 红队测试状态
  const [redTeamConfig, setRedTeamConfig] = useState({
    targetPrompt: '你是一个有帮助的AI助手。',
    plugins: ['jailbreak', 'injection', 'hallucination'],
    numTestsPerPlugin: 3,
  })
  const [redTeamResult, setRedTeamResult] = useState<any>(null)
  const [redTeamLoading, setRedTeamLoading] = useState(false)

  // YAML 导入状态
  const [yamlContent, setYamlContent] = useState('')
  const [yamlPreview, setYamlPreview] = useState<any>(null)
  const [datasetName, setDatasetName] = useState('')
  // 自动标注状态
  const [annotating, setAnnotating] = useState(false)
  const [annotationResult, setAnnotationResult] = useState<any>(null)
  // 指标管理状态
  const [metricsConfigOpen, setMetricsConfigOpen] = useState(false)
  const [availableMetrics, setAvailableMetrics] = useState<any[]>([])
  const [taskTypes, setTaskTypes] = useState<any[]>([])
  const [selectedTaskType, setSelectedTaskType] = useState<string>('qa')
  const [recommendedMetrics, setRecommendedMetrics] = useState<any[]>([])

  // 失败分析状态
  const [failureAnalysisOpen, setFailureAnalysisOpen] = useState(false)
  const [failureAnalysisResult, setFailureAnalysisResult] = useState<any>(null)
  const [failureAnalysisLoading, setFailureAnalysisLoading] = useState(false)

  // 能力画像状态
  const [capabilityProfileOpen, setCapabilityProfileOpen] = useState(false)
  const [capabilityProfile, setCapabilityProfile] = useState<any>(null)
  const [capabilityProfileLoading, setCapabilityProfileLoading] = useState(false)

  // 根因分析状态
  const [rootCauseOpen, setRootCauseOpen] = useState(false)
  const [rootCauseResult, setRootCauseResult] = useState<any>(null)
  const [rootCauseLoading, setRootCauseLoading] = useState(false)

  // 自然语言报告状态
  const [narrativeReportOpen, setNarrativeReportOpen] = useState(false)
  const [narrativeReport, setNarrativeReport] = useState<any>(null)
  const [narrativeReportLoading, setNarrativeReportLoading] = useState(false)

  // 自动修复状态
  const [autoFixOpen, setAutoFixOpen] = useState(false)
  const [fixPlans, setFixPlans] = useState<any[]>([])
  const [fixLoading, setFixLoading] = useState(false)
  const [fixVerifying, setFixVerifying] = useState<string | null>(null)
  const [fixVerifyResult, setFixVerifyResult] = useState<any>(null)

  useEffect(() => {
    fetchRuns()
    fetchRubrics()
  }, [])

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/report/eval-runs')
      setRuns(res.data)
    } catch (e) {
      console.error(e)
      toastError('加载评测记录失败')
    }
    setLoading(false)
  }

  const fetchRubrics = async () => {
    try {
      const res = await axios.get('/api/eval/judge/rubrics')
      setRubrics(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMetricsConfig = async () => {
    try {
      const [metricsRes, taskTypesRes] = await Promise.all([
        axios.get('/api/eval/metrics/types'),
        axios.get('/api/eval/metrics/task-types'),
      ])
      setAvailableMetrics(metricsRes.data)
      setTaskTypes(taskTypesRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRecommendedMetrics = async (taskType: string) => {
    try {
      const res = await axios.get(`/api/eval/metrics/recommend?taskType=${taskType}`)
      setRecommendedMetrics(res.data.recommendedMetrics || [])
    } catch (e) {
      console.error(e)
    }
  }

  const openMetricsConfig = async () => {
    setMetricsConfigOpen(true)
    await fetchMetricsConfig()
    await fetchRecommendedMetrics(selectedTaskType)
  }

  const handleTaskTypeChange = async (taskType: string) => {
    setSelectedTaskType(taskType)
    await fetchRecommendedMetrics(taskType)
  }

  const runJudge = async () => {
    setJudgeLoading(true)
    try {
      const res = await axios.post('/api/eval/judge/run', {
        rubricId: judgeInput.rubricId,
        type: 'single_point',
        input: judgeInput.input,
        output: judgeInput.output,
        expectedOutput: judgeInput.expectedOutput || undefined,
      })
      setJudgeResult(res.data)
      toastSuccess('LLM 评判完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || 'LLM 评判失败')
    }
    setJudgeLoading(false)
  }

  const openDetail = async (run: any) => {
    setDetailLoading(true)
    setDetailOpen(true)
    setAnnotationResult(null)
    try {
      const res = await axios.get(`/api/report/eval-runs/${run.id}`)
      setDetailRun(res.data)
    } catch (e) {
      toastError('加载评测详情失败')
    }
    setDetailLoading(false)
  }

  const handleAutoAnnotate = async () => {
    if (!detailRun) return
    setAnnotating(true)
    try {
      const res = await axios.post(`/api/annotation/auto-annotate/${detailRun.id}`)
      setAnnotationResult(res.data)
      toastSuccess(`自动标注完成：${res.data.annotated} 条已标注`)
      // 刷新详情
      const detailRes = await axios.get(`/api/report/eval-runs/${detailRun.id}`)
      setDetailRun(detailRes.data)
    } catch (e: any) {
      toastError(e?.response?.data?.message || '自动标注失败')
    }
    setAnnotating(false)
  }

  // 失败模式分析
  const handleFailureAnalysis = async () => {
    if (!detailRun) return
    setFailureAnalysisLoading(true)
    try {
      const res = await axios.post('/api/eval/failure-clustering/analyze', {
        evalRunId: detailRun.id,
      })
      setFailureAnalysisResult(res.data)
      setFailureAnalysisOpen(true)
      toastSuccess('失败模式分析完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '分析失败')
    }
    setFailureAnalysisLoading(false)
  }

  // 生成能力画像
  const handleGenerateProfile = async () => {
    if (!detailRun) return
    setCapabilityProfileLoading(true)
    try {
      const res = await axios.post('/api/eval/capability-profile/generate', {
        evalRunId: detailRun.id,
      })
      setCapabilityProfile(res.data)
      setCapabilityProfileOpen(true)
      toastSuccess('能力画像生成完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '生成能力画像失败')
    }
    setCapabilityProfileLoading(false)
  }

  // 根因分析
  const handleRootCauseAnalysis = async () => {
    if (!detailRun) return
    setRootCauseLoading(true)
    try {
      const res = await axios.post('/api/eval/root-cause/analyze', {
        evalRunId: detailRun.id,
      })
      setRootCauseResult(res.data)
      setRootCauseOpen(true)
      toastSuccess('根因分析完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '根因分析失败')
    }
    setRootCauseLoading(false)
  }

  // 生成自然语言报告
  const handleGenerateNarrativeReport = async () => {
    if (!detailRun) return
    setNarrativeReportLoading(true)
    try {
      const res = await axios.post('/api/eval/narrative-report/generate', {
        evalRunId: detailRun.id,
      })
      setNarrativeReport(res.data)
      setNarrativeReportOpen(true)
      toastSuccess('自然语言报告生成完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '生成报告失败')
    }
    setNarrativeReportLoading(false)
  }

  // 生成修复方案
  const handleGenerateFixPlan = async () => {
    if (!detailRun) return
    setFixLoading(true)
    try {
      const res = await axios.post('/api/eval/auto-fix/plan', {
        evalRunId: detailRun.id,
      })
      setFixPlans(res.data)
      setAutoFixOpen(true)
      toastSuccess('修复方案生成完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '生成修复方案失败')
    }
    setFixLoading(false)
  }

  // 应用修复
  const handleApplyFix = async (fixId: string) => {
    try {
      await axios.post('/api/eval/auto-fix/apply', { fixId })
      toastSuccess('修复方案已应用')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '应用修复失败')
    }
  }

  // 验证修复效果
  const handleVerifyFix = async (fixId: string) => {
    if (!detailRun) return
    setFixVerifying(fixId)
    try {
      const res = await axios.post('/api/eval/auto-fix/verify', {
        evalRunId: detailRun.id,
        fixId,
      })
      setFixVerifyResult(res.data)
      toastSuccess('修复效果验证完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '验证修复效果失败')
    }
    setFixVerifying(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-500/10'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-500/10'
    return 'text-red-600 bg-red-500/10'
  }

  // 运行指标评测
  const runMetrics = async () => {
    setMetricsLoading(true)
    try {
      const res = await axios.post('/api/eval/metrics/run', {
        input: metricsInput.input,
        actualOutput: metricsInput.actualOutput,
        expectedOutput: metricsInput.expectedOutput || undefined,
        context: metricsInput.context ? metricsInput.context.split('\n').filter(Boolean) : undefined,
      })
      setMetricsResult(res.data)
      toastSuccess('评测完成')
    } catch (e) {
      console.error(e)
      toastError('评测失败')
    }
    setMetricsLoading(false)
  }

  // 运行红队测试
  const runRedTeam = async () => {
    setRedTeamLoading(true)
    try {
      const res = await axios.post('/api/eval/redteam', redTeamConfig)
      setRedTeamResult(res.data)
      toastSuccess('红队测试完成')
    } catch (e) {
      console.error(e)
      toastError('红队测试失败')
    }
    setRedTeamLoading(false)
  }

  // 预览 YAML
  const previewYaml = async () => {
    try {
      const res = await axios.post('/api/eval/yaml/parse', { content: yamlContent })
      setYamlPreview(res.data)
    } catch (e) {
      console.error(e)
      toastError('YAML 格式错误')
    }
  }

  // 导入 YAML
  const importYaml = async () => {
    if (!datasetName) {
      toastWarning('请输入数据集名称')
      return
    }
    try {
      await axios.post('/api/eval/yaml/import', {
        content: yamlContent,
        datasetName,
      })
      toastSuccess('导入成功')
      setYamlContent('')
      setYamlPreview(null)
      setDatasetName('')
    } catch (e) {
      console.error(e)
      toastError('导入失败')
    }
  }

  // 获取示例模板
  const loadTemplate = async () => {
    try {
      const res = await axios.get('/api/eval/yaml/template')
      setYamlContent(res.data.template)
    } catch (e) {
      console.error(e)
      toastError('加载模板失败')
    }
  }

  // 规范 §7.3: 语义色映射状态
  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'border-success/30 bg-success-light text-success'
      case 'running': return 'border-info/30 bg-info-light text-info'
      case 'failed': return 'border-destructive/30 bg-error-light text-destructive'
      default: return 'border-border bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab 切换 */}
      <div className="flex gap-2 border-b pb-4">
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
        >
          <PlayCircle className="mr-2 h-4 w-4" /> 评测历史
        </Button>
        <Button
          variant={activeTab === 'metrics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 className="mr-2 h-4 w-4" /> 指标评测
        </Button>
        <Button
          variant={activeTab === 'judge' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('judge')}
        >
          <Award className="mr-2 h-4 w-4" /> LLM评判
        </Button>
        <Button
          variant={activeTab === 'redteam' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('redteam')}
        >
          <Shield className="mr-2 h-4 w-4" /> 红队测试
        </Button>
        <Button
          variant={activeTab === 'yaml' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('yaml')}
        >
          <FileText className="mr-2 h-4 w-4" /> YAML导入
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={openMetricsConfig}
          className="gap-1"
        >
          <BarChart3 className="h-4 w-4" /> 指标配置
        </Button>
      </div>

      {/* 评测历史 */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {/* 紧凑行内统计条 */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">共 <span className="font-medium text-foreground">{runs.length}</span> 条记录</span>
            <span className="text-muted-foreground">通过 <span className="font-medium text-success">{runs.reduce((sum, r) => sum + r.passedCases, 0)}</span></span>
            <span className="text-muted-foreground">失败 <span className="font-medium text-destructive">{runs.reduce((sum, r) => sum + r.failedCases, 0)}</span></span>
            <span className="text-muted-foreground">平均通过率 <span className="font-medium text-foreground">{runs.length > 0 ? `${(runs.reduce((sum, r) => sum + (r.totalCases > 0 ? r.passedCases / r.totalCases : 0), 0) / runs.length * 100).toFixed(1)}%` : '-'}</span></span>
          </div>
          {/* 表格直接展示 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>状态</TableHead>
                <TableHead>总用例</TableHead>
                <TableHead>通过</TableHead>
                <TableHead>失败</TableHead>
                <TableHead>通过率</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>结束时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    加载中...
                  </div>
                </TableCell></TableRow>
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <div className="py-12">
                      <PlayCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">暂无评测记录</p>
                      <p className="mt-1 text-xs text-muted-foreground">完成评测后，记录会显示在此处</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id} className="hover:bg-muted/50 transition-colors duration-150">
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(run.status)}`}>
                        {run.status}
                      </span>
                    </TableCell>
                    <TableCell>{run.totalCases}</TableCell>
                    <TableCell className="text-success">{run.passedCases}</TableCell>
                    <TableCell className="text-destructive">{run.failedCases}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {run.totalCases > 0 ? `${((run.passedCases / run.totalCases) * 100).toFixed(1)}%` : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{run.startTime ? new Date(run.startTime).toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{run.endTime ? new Date(run.endTime).toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openDetail(run)}>
                        <Eye className="mr-1 h-3 w-3" /> 查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 指标评测 */}
      {activeTab === 'metrics' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>输入数据</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">用户问题</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={metricsInput.input}
                  onChange={(e) => setMetricsInput({ ...metricsInput, input: e.target.value })}
                  placeholder="例如：什么是机器学习？"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">模型回答</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={metricsInput.actualOutput}
                  onChange={(e) => setMetricsInput({ ...metricsInput, actualOutput: e.target.value })}
                  placeholder="模型的实际输出"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">期望回答（可选）</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={metricsInput.expectedOutput}
                  onChange={(e) => setMetricsInput({ ...metricsInput, expectedOutput: e.target.value })}
                  placeholder="标准答案"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">参考上下文（可选，每行一条）</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={metricsInput.context}
                  onChange={(e) => setMetricsInput({ ...metricsInput, context: e.target.value })}
                  placeholder="用于评估忠实度的参考信息"
                />
              </div>
              <Button onClick={runMetrics} disabled={metricsLoading || !metricsInput.input || !metricsInput.actualOutput} className="w-full">
                <Zap className="mr-2 h-4 w-4" /> {metricsLoading ? '评测中...' : '运行评测'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评测结果</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsResult.length > 0 ? (
                <div className="space-y-4">
                  {metricsResult.map((result, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.metric}</span>
                        <Badge variant={result.score >= 0.7 ? 'default' : result.score >= 0.4 ? 'secondary' : 'destructive'}>
                          {(result.score * 100).toFixed(1)}分
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{result.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4">输入数据后点击"运行评测"查看结果</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* LLM Judge 智能标注 */}
      {activeTab === 'judge' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" /> LLM 智能评判
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">评判标准</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={judgeInput.rubricId}
                  onChange={(e) => setJudgeInput({ ...judgeInput, rubricId: e.target.value })}
                >
                  {rubrics.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">用户问题</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={judgeInput.input}
                  onChange={(e) => setJudgeInput({ ...judgeInput, input: e.target.value })}
                  placeholder="例如：什么是机器学习？"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">AI 回答</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={judgeInput.output}
                  onChange={(e) => setJudgeInput({ ...judgeInput, output: e.target.value })}
                  placeholder="需要评判的 AI 回答"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">期望回答（可选）</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={judgeInput.expectedOutput}
                  onChange={(e) => setJudgeInput({ ...judgeInput, expectedOutput: e.target.value })}
                  placeholder="标准答案，用于对比评判"
                />
              </div>
              <Button 
                onClick={runJudge} 
                disabled={judgeLoading || !judgeInput.input || !judgeInput.output} 
                className="w-full gap-2"
              >
                {judgeLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    AI 评判中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> 运行 LLM 评判
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评判结果</CardTitle>
            </CardHeader>
            <CardContent>
              {judgeResult ? (
                <div className="space-y-4">
                  {/* 总体评分 */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">综合评分</span>
                      <Badge 
                        variant={judgeResult.score >= 0.7 ? 'default' : judgeResult.score >= 0.4 ? 'secondary' : 'destructive'}
                        className="text-lg px-3 py-1"
                      >
                        {(judgeResult.score * 100).toFixed(1)}分
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{judgeResult.reasoning}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>置信度: {(judgeResult.confidence * 100).toFixed(0)}%</span>
                      <span>耗时: {judgeResult.latency}ms</span>
                    </div>
                  </div>

                  {/* 维度评分 */}
                  {judgeResult.criteriaScores && Object.keys(judgeResult.criteriaScores).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">维度评分</h4>
                      <div className="space-y-2">
                        {Object.entries(judgeResult.criteriaScores).map(([criteria, score]: [string, any]) => (
                          <div key={criteria} className="flex items-center justify-between rounded-md border p-3">
                            <span className="text-sm">{criteria}</span>
                            <Badge variant={score >= 0.7 ? 'default' : score >= 0.4 ? 'secondary' : 'destructive'}>
                              {(score * 100).toFixed(0)}分
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4">输入数据后点击"运行 LLM 评判"查看结果</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 红队测试 */}
      {activeTab === 'redteam' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>测试配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">目标系统 Prompt</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={redTeamConfig.targetPrompt}
                  onChange={(e) => setRedTeamConfig({ ...redTeamConfig, targetPrompt: e.target.value })}
                  placeholder="目标 AI 的系统提示词"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">攻击插件</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'jailbreak', name: '越狱攻击' },
                    { id: 'injection', name: '提示注入' },
                    { id: 'hallucination', name: '幻觉诱导' },
                    { id: 'data-leak', name: '数据泄露' },
                    { id: 'competitor', name: '竞品引导' },
                    { id: 'overreliance', name: '过度依赖' },
                    { id: 'excessive-agency', name: '过度授权' },
                  ].map(plugin => (
                    <label key={plugin.id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={redTeamConfig.plugins.includes(plugin.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRedTeamConfig({
                              ...redTeamConfig,
                              plugins: [...redTeamConfig.plugins, plugin.id],
                            })
                          } else {
                            setRedTeamConfig({
                              ...redTeamConfig,
                              plugins: redTeamConfig.plugins.filter(p => p !== plugin.id),
                            })
                          }
                        }}
                      />
                      <span className="text-sm">{plugin.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">每个插件测试数量</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={redTeamConfig.numTestsPerPlugin}
                  onChange={(e) => setRedTeamConfig({ ...redTeamConfig, numTestsPerPlugin: parseInt(e.target.value) || 3 })}
                />
              </div>
              <Button onClick={runRedTeam} disabled={redTeamLoading || redTeamConfig.plugins.length === 0} className="w-full">
                <Shield className="mr-2 h-4 w-4" /> {redTeamLoading ? '测试中...' : '开始红队测试'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              {redTeamResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold">{(redTeamResult.summary.passRate * 100).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">安全通过率</div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold text-destructive">{redTeamResult.summary.criticalVulnerabilities}</div>
                      <div className="text-sm text-muted-foreground">高危漏洞</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {redTeamResult.summary.pluginResults.map((pr: any) => (
                      <div key={pr.plugin} className="flex items-center justify-between rounded-md border p-3">
                        <span className="text-sm font-medium">{pr.plugin}</span>
                        <Badge variant={pr.passRate >= 0.8 ? 'default' : pr.passRate >= 0.5 ? 'secondary' : 'destructive'}>
                          {(pr.passRate * 100).toFixed(0)}% 通过
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4">配置后点击"开始红队测试"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* YAML 导入 */}
      {activeTab === 'yaml' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>YAML 内容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">测试套件 (Promptfoo 格式)</label>
                  <Button variant="outline" size="sm" onClick={loadTemplate}>
                    加载示例模板
                  </Button>
                </div>
                <textarea
                  className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                  placeholder="粘贴 YAML 格式的测试套件..."
                />
              </div>
              <Button onClick={previewYaml} disabled={!yamlContent} className="w-full">
                <FileText className="mr-2 h-4 w-4" /> 预览解析结果
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>导入预览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {yamlPreview ? (
                <>
                  <div className="rounded-lg border p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{yamlPreview.promptCount}</div>
                        <div className="text-sm text-muted-foreground">Prompt 数量</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{yamlPreview.testCaseCount}</div>
                        <div className="text-sm text-muted-foreground">测试用例数</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{yamlPreview.testCases?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">预览条数</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">数据集名称</label>
                    <Input
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      placeholder="例如：客服问答测试集"
                    />
                  </div>
                  <Button onClick={importYaml} disabled={!datasetName} className="w-full">
                    导入到数据集
                  </Button>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4">粘贴 YAML 后点击"预览解析结果"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 评测详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> 评测详情
            </DialogTitle>
            <DialogDescription>查看本次评测的详细结果</DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : detailRun ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* 评测概览 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">评测概览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border p-3">
                      <div className="text-sm text-muted-foreground">技能</div>
                      <div className="mt-1 font-medium">{detailRun.skillName}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-sm text-muted-foreground">接入点</div>
                      <div className="mt-1 font-medium">{detailRun.endpointName}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-sm text-muted-foreground">状态</div>
                      <div className="mt-1">
                        <Badge variant={detailRun.status === 'completed' ? 'default' : 'outline'}>
                          {detailRun.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-sm text-muted-foreground">通过率</div>
                      <div className="mt-1 font-medium">
                        {detailRun.totalCases > 0 ? `${((detailRun.passedCases / detailRun.totalCases) * 100).toFixed(1)}%` : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{detailRun.totalCases}</div>
                      <div className="text-sm text-muted-foreground">总用例</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{detailRun.passedCases}</div>
                      <div className="text-sm text-muted-foreground">通过</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{detailRun.failedCases}</div>
                      <div className="text-sm text-muted-foreground">失败</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 测试用例详情 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">测试用例详情 ({detailRun.results?.length || 0})</CardTitle>
                  <div className="flex items-center gap-2">
                    {annotationResult && (
                      <Badge variant="outline" className="text-xs">
                        已标注 {annotationResult.annotated}/{annotationResult.total}
                      </Badge>
                    )}
                    {/* AI 分析按钮组 - 根据失败用例数量动态显示 */}
                    {(() => {
                      const failedCount = detailRun.results?.filter((r: any) => r.status === 'failed').length || 0
                      const hasResults = (detailRun.results?.length || 0) > 0
                      const hasFailures = failedCount > 0
                      return (
                        <>
                          {/* 能力画像 - 始终可用 */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateProfile}
                            disabled={capabilityProfileLoading || !hasResults}
                            className="gap-1"
                          >
                            {capabilityProfileLoading ? (
                              <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 生成中...</>
                            ) : (
                              <><Award className="h-3 w-3" /> 能力画像</>
                            )}
                          </Button>
                          {/* AI 报告 - 始终可用 */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateNarrativeReport}
                            disabled={narrativeReportLoading || !hasResults}
                            className="gap-1"
                          >
                            {narrativeReportLoading ? (
                              <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 生成中...</>
                            ) : (
                              <><FileText className="h-3 w-3" /> AI 报告</>
                            )}
                          </Button>
                          {/* AI 自动标注 - 始终可用 */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAutoAnnotate}
                            disabled={annotating || !hasResults}
                            className="gap-1"
                          >
                            {annotating ? (
                              <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 标注中...</>
                            ) : (
                              <><Sparkles className="h-3 w-3" /> AI 标注</>
                            )}
                          </Button>
                          {/* 失败分析 - 仅有失败用例时显示 */}
                          {hasFailures && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleFailureAnalysis}
                              disabled={failureAnalysisLoading}
                              className="gap-1"
                            >
                              {failureAnalysisLoading ? (
                                <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 分析中...</>
                              ) : (
                                <><BarChart3 className="h-3 w-3" /> 失败分析</>
                              )}
                            </Button>
                          )}
                          {/* 根因分析 - 仅有失败用例时显示 */}
                          {hasFailures && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRootCauseAnalysis}
                              disabled={rootCauseLoading}
                              className="gap-1"
                            >
                              {rootCauseLoading ? (
                                <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 分析中...</>
                              ) : (
                                <><Zap className="h-3 w-3" /> 根因分析</>
                              )}
                            </Button>
                          )}
                          {/* 一键修复 - 仅有失败用例时显示 */}
                          {hasFailures && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleGenerateFixPlan}
                              disabled={fixLoading}
                              className="gap-1"
                            >
                              {fixLoading ? (
                                <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 生成中...</>
                              ) : (
                                <><CheckCircle2 className="h-3 w-3" /> 一键修复</>
                              )}
                            </Button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  {(!detailRun.results || detailRun.results.length === 0) ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4">暂无测试用例结果</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {detailRun.results.map((result: any, index: number) => (
                        <Card key={result.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              {/* 用例标题和状态 */}
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">用例 #{index + 1}</h4>
                                <div className="flex items-center gap-2">
                                  {result.status === 'passed' ? (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                                      <CheckCircle2 className="mr-1 h-3 w-3" /> 通过
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20" variant="outline">
                                      <XCircle className="mr-1 h-3 w-3" /> 失败
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* 输入问题 */}
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">输入问题：</label>
                                <p className="mt-1 text-sm bg-muted/50 rounded-md p-3">{result.input}</p>
                              </div>

                              {/* 期望输出 */}
                              {result.expectedOutput && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">期望输出：</label>
                                  <p className="mt-1 text-sm bg-green-500/5 border border-green-500/10 rounded-md p-3">
                                    {result.expectedOutput}
                                  </p>
                                </div>
                              )}

                              {/* 实际输出 */}
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">实际输出：</label>
                                <p className="mt-1 text-sm bg-blue-500/5 border border-blue-500/10 rounded-md p-3">
                                  {result.actualOutput || '无输出'}
                                </p>
                              </div>

                              {/* 指标得分 */}
                              {result.scores && Object.keys(result.scores).length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">指标得分：</label>
                                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(result.scores).map(([metric, score]: [string, any]) => (
                                      <div key={metric} className={`rounded-md border px-3 py-2 ${getScoreColor(score)}`}>
                                        <div className="text-xs text-muted-foreground">{metric}</div>
                                        <div className="text-lg font-bold">{(score * 100).toFixed(1)}%</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 详细指标 */}
                              {result.metrics && Object.keys(result.metrics).length > 0 && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">详细指标：</label>
                                  <pre className="mt-1 text-xs bg-muted/50 rounded-md p-2 overflow-x-auto">
                                    {JSON.stringify(result.metrics, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 失败分析 Dialog */}
      <Dialog open={failureAnalysisOpen} onOpenChange={setFailureAnalysisOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> 失败模式分析
            </DialogTitle>
            <DialogDescription>
              AI 自动分析失败用例的根因和分布
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {failureAnalysisResult ? (
              <>
                {/* 概览统计 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">分析概览</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{failureAnalysisResult.totalFailures}</div>
                        <div className="text-sm text-muted-foreground">失败用例数</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{failureAnalysisResult.modeDistribution?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">失败模式类型</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{failureAnalysisResult.topIssues?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">主要问题</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 失败模式分布 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">失败模式分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {failureAnalysisResult.modeDistribution?.map((mode: any) => (
                        <div key={mode.mode} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: mode.color }}
                              />
                              <span className="font-medium">{mode.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {mode.count} 例
                              </Badge>
                            </div>
                            <span className="text-sm font-medium">
                              {mode.percentage.toFixed(1)}%
                            </span>
                          </div>
                          {/* 进度条 */}
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${mode.percentage}%`,
                                backgroundColor: mode.color,
                              }}
                            />
                          </div>
                          {/* 示例 */}
                          {mode.examples && mode.examples.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs text-muted-foreground mb-1">示例：</div>
                              <div className="space-y-1">
                                {mode.examples.slice(0, 3).map((example: string, idx: number) => (
                                  <div key={idx} className="text-xs bg-muted/50 rounded px-2 py-1 truncate">
                                    {example}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top 问题和建议 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">主要问题与改进建议</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {failureAnalysisResult.topIssues?.map((issue: any, idx: number) => (
                        <div key={idx} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}
                              >
                                {issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}
                              </Badge>
                              <span className="font-medium">{issue.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {issue.affectedCases} 例
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                          <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
                            <div className="text-xs font-medium text-primary mb-1">改进建议：</div>
                            <p className="text-sm">{issue.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4">暂无分析结果</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFailureAnalysisOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 能力画像 Dialog */}
      <Dialog open={capabilityProfileOpen} onOpenChange={setCapabilityProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> 能力画像
            </DialogTitle>
            <DialogDescription>
              基于评测结果自动生成的智能体能力画像
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {capabilityProfile ? (
              <>
                {/* 概览 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">能力概览</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{capabilityProfile.overallScore?.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">综合得分</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{capabilityProfile.dimensions?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">评估维度</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{capabilityProfile.modelName || '-'}</div>
                        <div className="text-sm text-muted-foreground">评测对象</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground text-center">{capabilityProfile.summary}</p>
                  </CardContent>
                </Card>

                {/* 雷达图 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">能力雷达图</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <svg viewBox="0 0 400 400" className="w-80 h-80">
                        {/* 背景网格 */}
                        {[20, 40, 60, 80, 100].map((level) => {
                          const points = capabilityProfile.radarChartData?.labels.map((_: string, i: number) => {
                            const angle = (Math.PI * 2 * i) / capabilityProfile.radarChartData.labels.length - Math.PI / 2
                            const r = level * 1.5
                            const x = 200 + r * Math.cos(angle)
                            const y = 200 + r * Math.sin(angle)
                            return `${x},${y}`
                          }).join(' ')
                          return <polygon key={level} points={points} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                        })}
                        {/* 轴线 */}
                        {capabilityProfile.radarChartData?.labels.map((_: string, i: number) => {
                          const angle = (Math.PI * 2 * i) / capabilityProfile.radarChartData.labels.length - Math.PI / 2
                          const x = 200 + 150 * Math.cos(angle)
                          const y = 200 + 150 * Math.sin(angle)
                          return <line key={i} x1="200" y1="200" x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                        })}
                        {/* 数据区域 */}
                        {capabilityProfile.radarChartData && (() => {
                          const points = capabilityProfile.radarChartData.values.map((val: number, i: number) => {
                            const angle = (Math.PI * 2 * i) / capabilityProfile.radarChartData.labels.length - Math.PI / 2
                            const r = (val / 100) * 150
                            const x = 200 + r * Math.cos(angle)
                            const y = 200 + r * Math.sin(angle)
                            return `${x},${y}`
                          }).join(' ')
                          return <polygon points={points} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
                        })()}
                        {/* 数据点 */}
                        {capabilityProfile.radarChartData?.values.map((val: number, i: number) => {
                          const angle = (Math.PI * 2 * i) / capabilityProfile.radarChartData.labels.length - Math.PI / 2
                          const r = (val / 100) * 150
                          const x = 200 + r * Math.cos(angle)
                          const y = 200 + r * Math.sin(angle)
                          return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />
                        })}
                        {/* 标签 */}
                        {capabilityProfile.radarChartData?.labels.map((label: string, i: number) => {
                          const angle = (Math.PI * 2 * i) / capabilityProfile.radarChartData.labels.length - Math.PI / 2
                          const r = 170
                          const x = 200 + r * Math.cos(angle)
                          const y = 200 + r * Math.sin(angle)
                          return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-muted-foreground">{label}</text>
                        })}
                      </svg>
                    </div>
                  </CardContent>
                </Card>

                {/* 各维度详情 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">各维度得分</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {capabilityProfile.dimensions?.map((dim: any) => (
                        <div key={dim.dimension} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: dim.color }} />
                              <span className="font-medium text-sm">{dim.name}</span>
                            </div>
                            <span className="text-sm font-bold">{dim.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${dim.percentage}%`, backgroundColor: dim.color }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{dim.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 优势与劣势 */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-green-600">优势能力</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {capabilityProfile.strengths?.map((s: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{s.name}</span>
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                              {s.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-red-600">待提升</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {capabilityProfile.weaknesses?.map((w: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{w.name}</span>
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20" variant="outline">
                              {w.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4">暂无能力画像数据</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCapabilityProfileOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 根因分析 Dialog */}
      <Dialog open={rootCauseOpen} onOpenChange={setRootCauseOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> 根因分析与修复建议
            </DialogTitle>
            <DialogDescription>
              AI 自动分析 bad case 的根本原因，并给出可操作的修复建议
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {rootCauseResult ? (
              <>
                {/* 概览 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">分析概览</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{rootCauseResult.totalCases}</div>
                        <div className="text-sm text-muted-foreground">总用例数</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{rootCauseResult.analyzedCases}</div>
                        <div className="text-sm text-muted-foreground">Bad Cases</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{rootCauseResult.rootCauseDistribution?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">根因类型</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 根因分布 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">根因分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {rootCauseResult.rootCauseDistribution?.map((cause: any) => (
                        <div key={cause.type} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{cause.name}</span>
                              <Badge variant="outline" className="text-xs">{cause.count} 例</Badge>
                            </div>
                            <span className="text-sm font-medium">{cause.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${cause.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 整体建议 */}
                {rootCauseResult.overallSuggestions?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">整体改进建议</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {rootCauseResult.overallSuggestions.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Bad Case 详情 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bad Case 详情 ({rootCauseResult.caseDetails?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {rootCauseResult.caseDetails?.slice(0, 20).map((c: any, i: number) => (
                        <div key={i} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={c.fixPriority === 'high' ? 'destructive' : c.fixPriority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                {c.fixPriority === 'high' ? '高' : c.fixPriority === 'medium' ? '中' : '低'}
                              </Badge>
                              <span className="text-sm font-medium">{c.rootCauseName}</span>
                              <Badge variant="outline" className="text-xs">置信度 {(c.confidence * 100).toFixed(0)}%</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">输入：{c.input}</p>
                          <p className="text-xs text-muted-foreground truncate">输出：{c.actualOutput}</p>
                          <div className="bg-primary/5 border border-primary/10 rounded-md p-2">
                            <p className="text-xs"><span className="font-medium">修复建议：</span>{c.fixSuggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Zap className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4">暂无分析结果</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRootCauseOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 自然语言报告 Dialog */}
      <Dialog open={narrativeReportOpen} onOpenChange={setNarrativeReportOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> AI 评测报告
            </DialogTitle>
            <DialogDescription>
              {narrativeReport?.skillName ? `评测对象：${narrativeReport.skillName}` : '自然语言评测报告'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {narrativeReport ? (
              <>
                {narrativeReport.sections?.map((section: any, i: number) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm whitespace-pre-line leading-relaxed">{section.content}</div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4">暂无报告</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNarrativeReportOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 自动修复 Dialog */}
      <Dialog open={autoFixOpen} onOpenChange={setAutoFixOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> 一键修复
            </DialogTitle>
            <DialogDescription>
              基于根因分析自动生成修复方案，应用后自动验证效果
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {fixPlans.length > 0 ? (
              <>
                {fixPlans.map((plan: any, i: number) => (
                  <Card key={plan.fixId || i}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline">{plan.fixAction?.type || '修复'}</Badge>
                        {plan.fixAction?.description || '修复方案'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{plan.message}</p>
                      {plan.fixAction?.before && (
                        <div className="text-xs">
                          <span className="font-medium">修复前：</span>
                          <span className="text-muted-foreground">{plan.fixAction.before}</span>
                        </div>
                      )}
                      {plan.fixAction?.after && (
                        <div className="text-xs">
                          <span className="font-medium">修复后：</span>
                          <span className="text-green-600">{plan.fixAction.after}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApplyFix(plan.fixId)}
                          disabled={plan.fixAction?.applied}
                        >
                          {plan.fixAction?.applied ? '已应用' : '应用修复'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyFix(plan.fixId)}
                          disabled={fixVerifying === plan.fixId}
                        >
                          {fixVerifying === plan.fixId ? '验证中...' : '验证效果'}
                        </Button>
                      </div>
                      {fixVerifyResult && (
                        <div className="bg-muted/50 rounded-md p-3 text-xs space-y-1">
                          <div>修复前通过率：<span className="font-medium">{fixVerifyResult.beforePassRate}%</span></div>
                          <div>修复后通过率：<span className="font-medium text-green-600">{fixVerifyResult.afterPassRate}%</span></div>
                          <div>提升幅度：<span className="font-medium text-green-600">+{fixVerifyResult.improvement}%</span></div>
                          <div className="text-muted-foreground">{fixVerifyResult.verdict}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4">暂无修复方案</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoFixOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 指标配置 Dialog */}
      <Dialog open={metricsConfigOpen} onOpenChange={setMetricsConfigOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> 指标配置
            </DialogTitle>
            <DialogDescription>
              根据任务类型选择推荐的评测指标，或自定义指标组合
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* 任务类型选择 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">选择任务类型</h4>
              <div className="grid grid-cols-4 gap-2">
                {taskTypes.map((tt) => (
                  <Button
                    key={tt.id}
                    variant={selectedTaskType === tt.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTaskTypeChange(tt.id)}
                    className="justify-start"
                  >
                    {tt.name}
                  </Button>
                ))}
              </div>
              {taskTypes.find(tt => tt.id === selectedTaskType) && (
                <p className="text-xs text-muted-foreground">
                  {taskTypes.find(tt => tt.id === selectedTaskType)?.description}
                </p>
              )}
            </div>

            {/* 推荐指标 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> 推荐指标
              </h4>
              {recommendedMetrics.length > 0 ? (
                <div className="grid gap-3">
                  {recommendedMetrics.map((metric: any) => (
                    <Card key={metric.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{metric.name}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                {metric.category === 'quality' ? '质量' :
                                 metric.category === 'safety' ? '安全' :
                                 metric.category === 'efficiency' ? '效率' : '检索'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              评分范围: {metric.scoreRange?.min || 0} - {metric.scoreRange?.max || 1}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{metric.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  请选择任务类型以查看推荐指标
                </p>
              )}
            </div>

            {/* 所有可用指标 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">所有可用指标 ({availableMetrics.length})</h4>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {availableMetrics.map((metric: any) => (
                  <div key={metric.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {metric.isBuiltIn ? '内置' : '自定义'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricsConfigOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
