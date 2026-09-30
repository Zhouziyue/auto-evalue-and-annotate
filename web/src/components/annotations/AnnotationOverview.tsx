import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Tag, Sparkles, Zap, BarChart3, UserPlus, ArrowRight } from 'lucide-react'
import axios from 'axios'

interface AnnotationTask {
  id: string
  name: string
  type: string
  status: string
  evalRunId: string | null
  assignees: string[]
  totalItems: number
  completedItems: number
  approvedItems: number
  rejectedItems: number
  conflictItems: number
  modifiedItems: number
  avgConfidence: number
  createdAt: string
}

interface DashboardMetrics {
  pendingReview: number
  conflicts: number
  approved: number
  modified: number
  totalAi: number
  totalHuman: number
  reviewRate: number
  avgAgreement: number | null
}

interface OverviewProps {
  onGoWorkbench: (status?: string) => void
}

// 标注总览：紧凑指标条 + 任务表格 + 自动标注入口
export default function AnnotationOverview({ onGoWorkbench }: OverviewProps) {
  const [tasks, setTasks] = useState<AnnotationTask[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  // 自动标注
  const [autoAnnotateOpen, setAutoAnnotateOpen] = useState(false)
  const [evalRuns, setEvalRuns] = useState<any[]>([])
  const [selectedEvalRunId, setSelectedEvalRunId] = useState<string>('')
  const [autoAnnotateLoading, setAutoAnnotateLoading] = useState(false)
  const [autoAnnotateResult, setAutoAnnotateResult] = useState<any>(null)
  const [annotationStats, setAnnotationStats] = useState<any>(null)
  // 分配任务
  const [assignTask, setAssignTask] = useState<AnnotationTask | null>(null)
  const [assignInput, setAssignInput] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, dashRes] = await Promise.all([
        axios.get('/api/annotation/tasks'),
        axios.get('/api/annotation/dashboard'),
      ])
      setTasks(tasksRes.data || [])
      setMetrics(dashRes.data || null)
    } catch (e) {
      console.error(e)
      toastError('加载标注数据失败')
    }
    setLoading(false)
  }, [toastError])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const openAutoAnnotate = async () => {
    setAutoAnnotateResult(null)
    setSelectedEvalRunId('')
    setAutoAnnotateOpen(true)
    try {
      const res = await axios.get('/api/report/eval-runs')
      setEvalRuns(res.data || [])
    } catch (e) {
      setEvalRuns([])
    }
  }

  const handleAutoAnnotate = async () => {
    if (!selectedEvalRunId) return
    setAutoAnnotateLoading(true)
    try {
      const res = await axios.post(`/api/annotation/auto-annotate/${selectedEvalRunId}`)
      setAutoAnnotateResult(res.data)
      toastSuccess(`自动标注完成：${res.data.annotated} 条已标注`)
      try {
        const statsRes = await axios.get(`/api/annotation/eval-stats/${selectedEvalRunId}`)
        setAnnotationStats(statsRes.data)
      } catch {}
      fetchAll()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '自动标注失败')
    }
    setAutoAnnotateLoading(false)
  }

  const handleAssign = async () => {
    if (!assignTask) return
    const assignees = assignInput.split(/[,，\s]+/).filter(Boolean)
    try {
      await axios.post(`/api/annotation/tasks/${assignTask.id}/assign`, { assignees })
      toastSuccess('任务分配成功')
      setAssignTask(null)
      fetchAll()
    } catch (e) {
      toastError('任务分配失败')
    }
  }

  // 规范 §7.3: 语义色映射
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="border-success/30 bg-success-light text-success">已完成</Badge>
      case 'in_progress':
      case 'active':
        return <Badge className="border-info/30 bg-info-light text-info">进行中</Badge>
      case 'pending':
      case 'draft':
        return <Badge variant="outline">待处理</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProgressPercent = (task: AnnotationTask) => {
    if (task.totalItems === 0) return 0
    return Math.round((task.completedItems / task.totalItems) * 100)
  }

  // 紧凑指标条（替代大卡片）
  const metricItems = [
    { label: '待审核', value: metrics?.pendingReview ?? '-', color: 'text-foreground', onClick: () => onGoWorkbench('pending') },
    { label: '冲突', value: metrics?.conflicts ?? '-', color: 'text-destructive', onClick: () => onGoWorkbench('conflict') },
    { label: '已修改', value: metrics?.modified ?? '-', color: 'text-warning', onClick: () => onGoWorkbench('modified') },
    { label: '审核率', value: metrics ? `${(metrics.reviewRate * 100).toFixed(0)}%` : '-', color: 'text-info', onClick: () => onGoWorkbench('all') },
    { label: '人机一致性', value: metrics?.avgAgreement != null ? `${(metrics.avgAgreement * 100).toFixed(0)}%` : '-', color: 'text-success', onClick: undefined },
  ]

  return (
    <div className="space-y-4">
      {/* 页面标题 + 操作按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Tag className="h-5 w-5" /> 标注总览
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onGoWorkbench('pending')} className="gap-2">
            <ArrowRight className="h-4 w-4" /> 进入工作台
          </Button>
          <Button onClick={openAutoAnnotate} className="gap-2">
            <Sparkles className="h-4 w-4" /> 自动标注
          </Button>
        </div>
      </div>

      {/* 紧凑指标条 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {metricItems.map((m) => (
          <div
            key={m.label}
            className={`rounded-md border bg-card px-3 py-2 flex items-center justify-between ${m.onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors duration-150' : ''}`}
            onClick={m.onClick}
          >
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className={`text-lg font-bold ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" /> 标注任务
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-center">进度</TableHead>
                <TableHead className="text-center">通过</TableHead>
                <TableHead className="text-center">拒绝</TableHead>
                <TableHead className="text-center">冲突</TableHead>
                <TableHead className="text-center">平均置信度</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 py-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    <div className="py-12">
                      <Tag className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">暂无标注任务</p>
                      <p className="mt-1 text-xs text-muted-foreground">点击「自动标注」选择评测运行，系统会创建标注任务</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-muted/50 transition-colors duration-150">
                    <TableCell className="font-medium max-w-[200px] truncate">{task.name}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${getProgressPercent(task)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {task.completedItems}/{task.totalItems}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-success">{task.approvedItems}</TableCell>
                    <TableCell className="text-center text-destructive">{task.rejectedItems}</TableCell>
                    <TableCell className="text-center">
                      {task.conflictItems > 0 ? (
                        <Badge className="border-destructive/30 bg-error-light text-destructive">{task.conflictItems}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={task.avgConfidence >= 0.8 ? 'default' : 'secondary'}>
                        {(task.avgConfidence * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {task.assignees?.length > 0 ? task.assignees.join(', ') : '未分配'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => onGoWorkbench('pending')}>
                          审核
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setAssignTask(task); setAssignInput((task.assignees || []).join(',')) }}
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分配任务 Dialog */}
      <Dialog open={!!assignTask} onOpenChange={(open) => !open && setAssignTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分配标注任务</DialogTitle>
            <DialogDescription>{assignTask?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">标注员（逗号分隔）</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="如：张三,李四"
              value={assignInput}
              onChange={(e) => setAssignInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTask(null)}>取消</Button>
            <Button onClick={handleAssign}>确认分配</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 自动标注 Dialog */}
      <Dialog open={autoAnnotateOpen} onOpenChange={setAutoAnnotateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI 自动标注
            </DialogTitle>
            <DialogDescription>
              选择评测运行，AI 将自动对所有评测结果进行多维度评分标注
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!autoAnnotateResult ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择评测运行 *</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedEvalRunId}
                    onChange={(e) => setSelectedEvalRunId(e.target.value)}
                  >
                    <option value="">请选择评测运行...</option>
                    {evalRuns.map((run: any) => (
                      <option key={run.id} value={run.id}>
                        {run.id.slice(0, 8)}... | {run.status} | {run.totalCases || 0} 用例 | {new Date(run.createdAt).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-md bg-muted/50 p-4 space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-warning" /> 标注说明
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• AI 将从<strong>准确性、完整性、相关性、安全性</strong>四个维度评分，并计算置信度</li>
                    <li>• 每条评测结果会自动生成 AI 标注和评语，已标注的结果不会重复标注</li>
                    <li>• 已有人工修正样本会自动注入 Prompt 做少样本校准</li>
                    <li>• 标注完成后进入<strong>标注工作台</strong>，按低置信度优先人工审核</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* 标注结果统计 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-md bg-success/10 p-3 text-center">
                    <div className="text-2xl font-bold text-success">{autoAnnotateResult.annotated || 0}</div>
                    <div className="text-xs text-muted-foreground">已标注</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3 text-center">
                    <div className="text-2xl font-bold">{autoAnnotateResult.total || 0}</div>
                    <div className="text-xs text-muted-foreground">总计</div>
                  </div>
                  <div className="rounded-md bg-destructive/10 p-3 text-center">
                    <div className="text-2xl font-bold text-destructive">{autoAnnotateResult.failed || 0}</div>
                    <div className="text-xs text-muted-foreground">失败</div>
                  </div>
                </div>

                {/* 平均分 */}
                {annotationStats?.avgScores && (
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> 平均评分
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(annotationStats.avgScores).map(([key, value]: [string, any]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold">{(value * 100).toFixed(0)}%</div>
                          <div className="text-xs text-muted-foreground">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full gap-2" onClick={() => { setAutoAnnotateOpen(false); onGoWorkbench('pending') }}>
                  <ArrowRight className="h-4 w-4" /> 前往工作台审核
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            {!autoAnnotateResult ? (
              <>
                <Button variant="outline" onClick={() => setAutoAnnotateOpen(false)}>取消</Button>
                <Button onClick={handleAutoAnnotate} disabled={!selectedEvalRunId || autoAnnotateLoading} className="gap-2">
                  {autoAnnotateLoading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> 标注中...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> 开始自动标注</>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setAutoAnnotateOpen(false)}>关闭</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
