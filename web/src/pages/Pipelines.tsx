import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { GitBranch, Play, Plus, Clock, CheckCircle, XCircle, Loader2, Timer, Trash2 } from 'lucide-react'
import axios from 'axios'

const presets = [
  { id: 'quick', name: '快速评测', desc: '执行 → 规则评测 → 出报告', nodes: 3, icon: '⚡' },
  { id: 'full', name: '完整评测', desc: '执行 → 规则评测 → AI评测 → 标注 → 修复 → 再验证', nodes: 6, icon: '🔬' },
  { id: 'regression', name: '回归评测', desc: '执行 → 对比上一版本 → 告警', nodes: 3, icon: '🔄' },
]

interface PipelineExecution {
  id: string
  pipelineName: string
  status: 'running' | 'completed' | 'failed'
  startTime: string
  endTime: string | null
  duration: number | null
}

interface PipelineRecord {
  id: string
  name: string
  description: string | null
  cronExpression: string | null
  isPreset: boolean
}

export default function Pipelines() {
  const [executions, setExecutions] = useState<PipelineExecution[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [customPipeline, setCustomPipeline] = useState({ name: '', description: '', nodes: '' })
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleTarget, setScheduleTarget] = useState<{ id: string; name: string } | null>(null)
  const [cronExpr, setCronExpr] = useState('')
  const [pipelines, setPipelines] = useState<PipelineRecord[]>([])
  const [savingSchedule, setSavingSchedule] = useState(false)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchExecutions()
    fetchPipelines()
  }, [])

  const fetchExecutions = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/pipeline/executions')
      setExecutions(res.data)
    } catch (e) {
      console.error(e)
      toastError('加载执行记录失败')
    }
    setLoading(false)
  }

  const fetchPipelines = async () => {
    try {
      const res = await axios.get('/api/pipeline')
      setPipelines(res.data)
    } catch (e) {
      // 静默
    }
  }

  const handleOpenSchedule = (id: string, name: string, currentCron?: string | null) => {
    setScheduleTarget({ id, name })
    setCronExpr(currentCron || '')
    setScheduleOpen(true)
  }

  const handleSaveSchedule = async () => {
    if (!scheduleTarget) return
    setSavingSchedule(true)
    try {
      await axios.put(`/api/pipeline/${scheduleTarget.id}/schedule`, {
        cronExpression: cronExpr || null,
      })
      toastSuccess(`已${cronExpr ? '设置' : '取消'}定时计划`)
      setScheduleOpen(false)
      await fetchPipelines()
    } catch (e) {
      toastError('设置定时失败')
    }
    setSavingSchedule(false)
  }

  const handleClearSchedule = async (id: string) => {
    try {
      await axios.put(`/api/pipeline/${id}/schedule`, { cronExpression: null })
      toastSuccess('已取消定时计划')
      await fetchPipelines()
    } catch (e) {
      toastError('取消定时失败')
    }
  }

  const cronPresets = [
    { label: '每 5 分钟', value: '*/5 * * * *' },
    { label: '每 15 分钟', value: '*/15 * * * *' },
    { label: '每 30 分钟', value: '*/30 * * * *' },
    { label: '每 1 小时', value: '0 * * * *' },
    { label: '每 6 小时', value: '0 */6 * * *' },
    { label: '每天 0 点', value: '0 0 * * *' },
  ]

  const handleRunPipeline = async (pipelineId: string, pipelineName: string) => {
    setRunningIds(prev => new Set(prev).add(pipelineId))
    try {
      await axios.post(`/api/pipeline/${pipelineId}/run`)
      await fetchExecutions()
      toastSuccess(`${pipelineName} 执行完成`)
    } catch (e) {
      toastError(`${pipelineName} 执行失败`)
    }
    setRunningIds(prev => {
      const next = new Set(prev)
      next.delete(pipelineId)
      return next
    })
  }

  const handleRunPreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return

    setRunningIds(prev => new Set(prev).add(presetId))
    try {
      await axios.post(`/api/pipeline/${preset.id}/run`)
      await fetchExecutions()
      toastSuccess(`${preset.name}执行完成`)
    } catch (e) {
      toastError(`${preset.name}执行失败`)
    }
    setRunningIds(prev => {
      const next = new Set(prev)
      next.delete(presetId)
      return next
    })
  }

  const handleCreateCustom = async () => {
    if (!customPipeline.name) return
    try {
      await axios.post('/api/pipeline', {
        name: customPipeline.name,
        description: customPipeline.description,
        steps: customPipeline.nodes.split(',').map(n => n.trim()).filter(Boolean).map((nodeType: string) => ({ type: nodeType, config: {} })),
      })
      setCreateOpen(false)
      setCustomPipeline({ name: '', description: '', nodes: '' })
      toastSuccess('流水线创建成功')
      await fetchExecutions()
    } catch (e) {
      toastError('创建失败')
    }
  }

  // 规范 §7.3: 语义色映射
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="border-success/30 bg-success-light text-success"><CheckCircle className="mr-1 h-3 w-3" />完成</Badge>
      case 'running':
        return <Badge className="border-info/30 bg-info-light text-info"><Loader2 className="mr-1 h-3 w-3 animate-spin" />运行中</Badge>
      case 'failed':
        return <Badge className="border-destructive/30 bg-error-light text-destructive"><XCircle className="mr-1 h-3 w-3" />失败</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 预设流水线 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> 评测流水线</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 自定义流水线
          </Button>
        </CardHeader>
        <CardContent>
          {pipelines.length === 0 ? (
            <div className="py-12 text-center">
              <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">暂无流水线</p>
              <p className="mt-1 text-xs text-muted-foreground">点击“自定义流水线”创建</p>
            </div>
          ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {pipelines.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>🔧</span> {p.name}
                  </h3>
                  {p.cronExpression && <Badge variant="outline"><Timer className="mr-1 h-3 w-3" />{p.cronExpression}</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.description || '暂无描述'}</p>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  onClick={() => handleRunPipeline(p.id, p.name)}
                  disabled={runningIds.has(p.id)}
                >
                  {runningIds.has(p.id) ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 执行中...</>
                  ) : (
                    <><Play className="mr-2 h-4 w-4" /> 立即执行</>
                  )}
                </Button>
                <Button
                  className="mt-2 w-full"
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenSchedule(p.id, p.name, p.cronExpression)}
                >
                  <Timer className="mr-2 h-3.5 w-3.5" /> 定时计划
                </Button>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* 定时计划 */}
      {pipelines.filter(p => p.cronExpression).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" /> 定时计划
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>流水线</TableHead>
                  <TableHead>Cron 表达式</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelines.filter(p => p.cronExpression).map(p => (
                  <TableRow key={p.id} className="hover:bg-muted/50 transition-colors duration-150">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{p.cronExpression}</code></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cronPresets.find(c => c.value === p.cronExpression)?.label || '自定义'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenSchedule(p.id, p.name, p.cronExpression)}>
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleClearSchedule(p.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 执行历史 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> 执行历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>流水线</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>结束时间</TableHead>
                <TableHead className="text-center">耗时</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 py-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="py-12">
                      <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">暂无执行记录</p>
                      <p className="mt-1 text-xs text-muted-foreground">点击上方"立即执行"开始运行流水线</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((exec) => (
                  <TableRow key={exec.id} className="hover:bg-muted/50 transition-colors duration-150">
                    <TableCell className="font-medium">{exec.pipelineName}</TableCell>
                    <TableCell>{getStatusBadge(exec.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(exec.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {exec.endTime ? new Date(exec.endTime).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 定时计划弹窗 */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" /> 定时计划
            </DialogTitle>
            <DialogDescription>
              为「{scheduleTarget?.name}」设置定时执行
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cron 表达式</label>
              <Input
                value={cronExpr}
                onChange={(e) => setCronExpr(e.target.value)}
                placeholder="如: */15 * * * *"
              />
              <p className="text-xs text-muted-foreground">
                格式: 分 时 日 月 周，如 <code className="rounded bg-muted px-1">*/15 * * * *</code> 表示每 15 分钟执行
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">快捷选择</label>
              <div className="flex flex-wrap gap-2">
                {cronPresets.map(p => (
                  <Button
                    key={p.value}
                    variant={cronExpr === p.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCronExpr(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            {cronExpr && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  当前设置: <code className="font-mono">{cronExpr}</code>
                  {cronPresets.find(c => c.value === cronExpr) && (
                    <span className="ml-2 text-foreground">({cronPresets.find(c => c.value === cronExpr)?.label})</span>
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCronExpr(''); handleSaveSchedule() }}>
              取消定时
            </Button>
            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 自定义流水线弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>自定义流水线</DialogTitle>
            <DialogDescription>创建自定义评测流水线</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">流水线名称 <span className="text-destructive">*</span></label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={customPipeline.name}
                onChange={(e) => setCustomPipeline({ ...customPipeline, name: e.target.value })}
                placeholder="如: 自定义评测流程"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={customPipeline.description}
                onChange={(e) => setCustomPipeline({ ...customPipeline, description: e.target.value })}
                placeholder="流水线描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">节点（逗号分隔）</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={customPipeline.nodes}
                onChange={(e) => setCustomPipeline({ ...customPipeline, nodes: e.target.value })}
                placeholder="如: execute, rule-eval, ai-eval, annotate"
              />
              <p className="text-xs text-muted-foreground">
                可用节点: execute, rule-eval, ai-eval, annotate, fix, verify, report
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreateCustom} disabled={!customPipeline.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
