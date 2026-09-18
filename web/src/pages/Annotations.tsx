import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tag, CheckCircle, XCircle, Clock, Edit3, Filter } from 'lucide-react'
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

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/annotations/tasks')
      setTasks(res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchItems = async (taskId: string) => {
    try {
      const res = await axios.get(`/api/eval/annotations/tasks/${taskId}/items`)
      setItems(res.data)
    } catch (e) {
      console.error(e)
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
    try {
      await axios.post(`/api/eval/annotations/items/${itemId}/approve`, {
        comment: '审核通过',
      })
      if (selectedTask) await fetchItems(selectedTask.id)
      setWorkbenchOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async (itemId: string) => {
    try {
      await axios.post(`/api/eval/annotations/items/${itemId}/reject`, {
        comment: '需要修正',
      })
      if (selectedTask) await fetchItems(selectedTask.id)
      setWorkbenchOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">进行中</Badge>
      case 'pending':
        return <Badge variant="outline">待处理</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />已通过</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="mr-1 h-3 w-3" />已拒绝</Badge>
      case 'modified':
        return <Badge className="bg-yellow-100 text-yellow-700"><Edit3 className="mr-1 h-3 w-3" />已修改</Badge>
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
    <div className="space-y-6">
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
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">加载中...</TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <div className="py-8">
                      <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">暂无标注任务</p>
                      <p className="mt-2 text-sm text-muted-foreground">完成评测后，系统会自动创建标注任务</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTaskClick(task)}
                  >
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${getProgressPercent(task)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getProgressPercent(task)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-green-600">{task.approvedItems}</TableCell>
                    <TableCell className="text-center text-red-600">{task.rejectedItems}</TableCell>
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
                className="h-8 rounded-md border border-input bg-transparent px-3 text-sm"
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
                    <TableRow key={item.id}>
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
                      <p className="rounded-md bg-green-50 p-3 text-sm">{currentItem.expectedOutput}</p>
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
                        className="flex-1 bg-green-600 hover:bg-green-700"
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
    </div>
  )
}
