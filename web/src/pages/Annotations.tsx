import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Tag, CheckCircle, XCircle, Clock, Edit3, Filter, Sparkles, Plus, Zap, BarChart3 } from 'lucide-react'
import axios from 'axios'

interface AnnotationTask {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed'
  totalItems: number
  completedItems: number
  approvedItems: number
  rejectedItems: number
  createdAt: string
  updatedAt: string
}

interface AnnotationItem {
  id: string
  taskId: string
  input: string
  aiOutput: string
  expectedOutput: string | null
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  annotatorComment: string | null
  aiConfidence: number
  createdAt: string
}

export default function Annotations() {
  const [tasks, setTasks] = useState<AnnotationTask[]>([])
  const [items, setItems] = useState<AnnotationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<AnnotationTask | null>(null)
  const [workbenchOpen, setWorkbenchOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<AnnotationItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // 自动标注状态
  const [autoAnnotateOpen, setAutoAnnotateOpen] = useState(false)
  const [evalRuns, setEvalRuns] = useState<any[]>([])
  const [selectedEvalRunId, setSelectedEvalRunId] = useState<string>('')
  const [autoAnnotateLoading, setAutoAnnotateLoading] = useState(false)
  const [autoAnnotateResult, setAutoAnnotateResult] = useState<any>(null)
  const [annotationStats, setAnnotationStats] = useState<any>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/annotation/tasks')
      setTasks(res.data)
    } catch (e) {
      console.error(e)
      toastError('加载标注任务失败')
    }
    setLoading(false)
  }

  const fetchItems = async (taskId: string) => {
    try {
      const res = await axios.get(`/api/eval/annotation/tasks/${taskId}/pending`)
      setItems(res.data)
    } catch (e) {
      console.error(e)
      toastError('加载标注项失败')
    }
  }

  const handleTaskClick = async (task: AnnotationTask) => {
    setSelectedTask(task)
    await fetchItems(task.id)
  }

  const handleItemClick = (item: AnnotationItem) => {
    setCurrentItem(item)
    setWorkbenchOpen(true)
  }

  const handleApprove = async (itemId: string) => {
    if (!selectedTask) return
    try {
      await axios.post(`/api/eval/annotation/tasks/${selectedTask.id}/review`, {
        itemId: itemId,
        approved: true,
      })
      if (selectedTask) await fetchItems(selectedTask.id)
      setWorkbenchOpen(false)
      toastSuccess('已通过审核')
    } catch (e) {
      toastError('操作失败')
    }
  }

  const handleReject = async (itemId: string) => {
    if (!selectedTask) return
    try {
      await axios.post(`/api/eval/annotation/tasks/${selectedTask.id}/review`, {
        itemId: itemId,
        approved: false,
      })
      if (selectedTask) await fetchItems(selectedTask.id)
      setWorkbenchOpen(false)
      toastSuccess('已拒绝')
    } catch (e) {
      toastError('操作失败')
    }
  }

  const openAutoAnnotate = async () => {
    setAutoAnnotateResult(null)
    setSelectedEvalRunId('')
    setAutoAnnotateOpen(true)
    // 加载评测运行列表
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
      // 加载标注统计
      try {
        const statsRes = await axios.get(`/api/annotation/eval-stats/${selectedEvalRunId}`)
        setAnnotationStats(statsRes.data)
      } catch {}
      fetchTasks()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '自动标注失败')
    }
    setAutoAnnotateLoading(false)
  }

  // 规范 §7.3: 语义色映射
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="border-success/30 bg-success-light text-success">已完成</Badge>
      case 'in_progress':
        return <Badge className="border-info/30 bg-info-light text-info">进行中</Badge>
      case 'pending':
        return <Badge variant="outline">待处理</Badge>
      case 'approved':
        return <Badge className="border-success/30 bg-success-light text-success"><CheckCircle className="mr-1 h-3 w-3" />已通过</Badge>
      case 'rejected':
        return <Badge className="border-destructive/30 bg-error-light text-destructive"><XCircle className="mr-1 h-3 w-3" />已拒绝</Badge>
      case 'modified':
        return <Badge className="border-warning/30 bg-warning-light text-warning"><Edit3 className="mr-1 h-3 w-3" />已修改</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProgressPercent = (task: AnnotationTask) => {
    if (task.totalItems === 0) return 0
    return Math.round((task.completedItems / task.totalItems) * 100)
  }

  const filteredItems = statusFilter === 'all'
    ? items
    : items.filter(item => item.status === statusFilter)

  return (
    <div className="space-y-4">
      {/* 页面标题 + 操作按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Tag className="h-5 w-5" /> 标注管理
        </h3>
        <Button onClick={openAutoAnnotate} className="gap-2">
          <Sparkles className="h-4 w-4" /> 自动标注
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" /> 标注任务
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-center">进度</TableHead>
                <TableHead className="text-center">已通过</TableHead>
                <TableHead className="text-center">已拒绝</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 py-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <div className="py-12">
                      <Tag className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">暂无标注任务</p>
                      <p className="mt-1 text-xs text-muted-foreground">完成评测后，系统会自动创建标注任务</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors duration-150"
                    onClick={() => handleTaskClick(task)}
                  >
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${getProgressPercent(task)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getProgressPercent(task)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-success">{task.approvedItems}</TableCell>
                    <TableCell className="text-center text-destructive">{task.rejectedItems}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(task.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 标注项列表 */}
      {selectedTask && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              标注项 - {selectedTask.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="modified">已修改</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>输入</TableHead>
                  <TableHead>AI 输出</TableHead>
                  <TableHead className="text-center">置信度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无标注项
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors duration-150">
                      <TableCell className="max-w-[200px] truncate">{item.input}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {item.aiOutput}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.aiConfidence >= 0.8 ? 'default' : 'secondary'}>
                          {(item.aiConfidence * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleItemClick(item)}
                        >
                          审核
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

      {/* 标注工作台弹窗 */}
      <Dialog open={workbenchOpen} onOpenChange={setWorkbenchOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>标注工作台</DialogTitle>
            <DialogDescription>审核 AI 输出结果</DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* 左侧：输入和 AI 输出 */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">用户输入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="rounded-md bg-muted p-3 text-sm">{currentItem.input}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">AI 输出</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="rounded-md bg-muted p-3 text-sm">{currentItem.aiOutput}</p>
                  </CardContent>
                </Card>

                {currentItem.expectedOutput && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">期望输出</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="rounded-md bg-success-light p-3 text-sm">{currentItem.expectedOutput}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>AI 置信度:</span>
                  <Badge variant={currentItem.aiConfidence >= 0.8 ? 'default' : 'secondary'}>
                    {(currentItem.aiConfidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>

              {/* 右侧：审核操作 */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">审核操作</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">审核意见</label>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        placeholder="输入审核意见（可选）..."
                        defaultValue={currentItem.annotatorComment || ''}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-success hover:bg-success/90 text-white"
                        onClick={() => handleApprove(currentItem.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> 通过
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(currentItem.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> 拒绝
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">当前状态</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">状态:</span>
                      {getStatusBadge(currentItem.status)}
                    </div>
                    {currentItem.annotatorComment && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">意见:</span>
                        <p className="mt-1 text-sm">{currentItem.annotatorComment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
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
                    <li>• AI 将从<strong>准确性、完整性、相关性、安全性</strong>四个维度评分</li>
                    <li>• 每条评测结果会自动生成 AI 标注和评语</li>
                    <li>• 已标注的结果不会重复标注</li>
                    <li>• 标注完成后可在标注工作台中人工审核</li>
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
