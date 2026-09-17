import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { PlayCircle, BarChart3, Shield, FileText, Zap } from 'lucide-react'
import axios from 'axios'

export default function EvalRuns() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'history' | 'metrics' | 'matrix' | 'redteam' | 'yaml'>('history')

  // 指标评测状态
  const [metricsInput, setMetricsInput] = useState({
    input: '',
    actualOutput: '',
    expectedOutput: '',
    context: '',
  })
  const [metricsResult, setMetricsResult] = useState<any[]>([])
  const [metricsLoading, setMetricsLoading] = useState(false)

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
  }, [])

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval-runs')
      setRuns(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
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
    } catch (e) {
      console.error(e)
      alert('评测失败')
    }
    setMetricsLoading(false)
  }

  // 运行红队测试
  const runRedTeam = async () => {
    setRedTeamLoading(true)
    try {
      const res = await axios.post('/api/eval/redteam', redTeamConfig)
      setRedTeamResult(res.data)
    } catch (e) {
      console.error(e)
      alert('红队测试失败')
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
      alert('YAML 格式错误')
    }
  }

  // 导入 YAML
  const importYaml = async () => {
    if (!datasetName) {
      alert('请输入数据集名称')
      return
    }
    try {
      await axios.post('/api/eval/yaml/import', {
        content: yamlContent,
        datasetName,
      })
      alert('导入成功！')
      setYamlContent('')
      setYamlPreview(null)
      setDatasetName('')
    } catch (e) {
      console.error(e)
      alert('导入失败')
    }
  }

  // 获取示例模板
  const loadTemplate = async () => {
    try {
      const res = await axios.get('/api/eval/yaml/template')
      setYamlContent(res.data.template)
    } catch (e) {
      console.error(e)
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'running': return 'bg-blue-100 text-blue-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">加载中...</TableCell></TableRow>
                ) : runs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">暂无评测记录</TableCell></TableRow>
                ) : (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </TableCell>
                      <TableCell>{run.totalCases}</TableCell>
                      <TableCell className="text-green-600">{run.passedCases}</TableCell>
                      <TableCell className="text-red-600">{run.failedCases}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {run.totalCases > 0 ? `${((run.passedCases / run.totalCases) * 100).toFixed(1)}%` : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{run.startTime ? new Date(run.startTime).toLocaleString() : '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{run.endTime ? new Date(run.endTime).toLocaleString() : '-'}</TableCell>
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
                    <label key={plugin.id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
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
                      <div className="text-2xl font-bold text-red-600">{redTeamResult.summary.criticalVulnerabilities}</div>
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
    </div>
  )
}
