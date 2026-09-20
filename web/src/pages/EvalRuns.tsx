import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { PlayCircle, BarChart3, Shield, FileText, Zap, Eye, CheckCircle2, XCircle, Sparkles, Award } from 'lucide-react'
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
    try {
      const res = await axios.get(`/api/report/eval-runs/${run.id}`)
      setDetailRun(res.data)
    } catch (e) {
      toastError('加载评测详情失败')
    }
    setDetailLoading(false)
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
      </div>

      {/* 评测历史 */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> 评测执行记录</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 py-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      加载中...
                    </div>
                  </TableCell></TableRow>
                ) : runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
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
          </CardContent>
        </Card>
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
                <CardHeader>
                  <CardTitle className="text-lg">测试用例详情 ({detailRun.results?.length || 0})</CardTitle>
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
    </div>
  )
}
