import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Cpu, ArrowDown, Target, CheckCircle, Plus, Eye, Play, Search, BarChart3 } from 'lucide-react'
import axios from 'axios'

interface DistillationTask {
  id: string
  name: string
  teacherModel: string
  studentModel: string
  status: string
  strategy: string
  compressionRatio: number
  accuracyRetention: number
  config: any
  metrics: any
  createdAt: string
  updatedAt: string
}

export default function Distillation() {
  const [tasks, setTasks] = useState<DistillationTask[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', teacherModel: '', studentModel: '', strategy: 'knowledge-distillation', config: '' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<DistillationTask | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [strategies, setStrategies] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchTasks()
    fetchStrategies()
    fetchStats()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/distillation/tasks')
      setTasks(res.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchStrategies = async () => {
    try {
      const res = await axios.get('/api/eval/distillation/strategies')
      setStrategies(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/eval/distillation/stats')
      setStats(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.teacherModel || !formData.studentModel) return
    try {
      const config = formData.config ? JSON.parse(formData.config) : undefined
      await axios.post('/api/eval/distillation/tasks', { ...formData, config })
      toastSuccess('蒸馏任务已创建')
      setCreateOpen(false)
      setFormData({ name: '', teacherModel: '', studentModel: '', strategy: 'knowledge-distillation', config: '' })
      fetchTasks()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleExecute = async (id: string) => {
    setExecuting(id)
    try {
      await axios.post(`/api/eval/distillation/tasks/${id}/execute`)
      toastSuccess('蒸馏任务已启动')
      fetchTasks()
    } catch (e) {
      toastError('执行失败')
    }
    setExecuting(null)
  }

  const handleGenerateData = async (id: string) => {
    try {
      await axios.post(`/api/eval/distillation/tasks/${id}/generate-data`)
      toastSuccess('蒸馏数据已生成')
      fetchTasks()
    } catch (e) {
      toastError('生成失败')
    }
  }

  const openDetail = async (task: DistillationTask) => {
    try {
      const res = await axios.get(`/api/eval/distillation/tasks/${task.id}`)
      setSelected(res.data)
    } catch (e) {
      setSelected(task)
    }
    setDetailOpen(true)
  }

  const filteredTasks = tasks.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const completedTasks = tasks.filter(t => t.status === 'completed')
  const avgCompression = completedTasks.filter(t => t.compressionRatio > 0).length > 0
    ? completedTasks.filter(t => t.compressionRatio > 0).reduce((a, t) => a + t.compressionRatio, 0) / completedTasks.filter(t => t.compressionRatio > 0).length
    : 0
  const avgRetention = completedTasks.filter(t => t.accuracyRetention > 0).length > 0
    ? completedTasks.filter(t => t.accuracyRetention > 0).reduce((a, t) => a + t.accuracyRetention, 0) / completedTasks.filter(t => t.accuracyRetention > 0).length
    : 0

  return (
    <div className="space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">蒸馏任务</span>
            </div>
            <p className="text-2xl font-bold mt-2">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">已完成</span>
            </div>
            <p className="text-2xl font-bold mt-2">{completedTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">平均压缩比</span>
            </div>
            <p className="text-2xl font-bold mt-2">{avgCompression > 0 ? avgCompression.toFixed(1) + 'x' : '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">平均精度保留</span>
            </div>
            <p className="text-2xl font-bold mt-2">{avgRetention > 0 ? (avgRetention * 100).toFixed(1) + '%' : '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索任务..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> 新建蒸馏任务
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>模型蒸馏</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>教师模型</TableHead>
                <TableHead>学生模型</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead>策略</TableHead>
                <TableHead className="text-center">压缩比</TableHead>
                <TableHead className="text-center">精度保留</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">暂无蒸馏任务</TableCell></TableRow>
              ) : filteredTasks.map(task => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell><Badge variant="outline">{task.teacherModel}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{task.studentModel}</Badge></TableCell>
                  <TableCell className="text-center">
                    <Badge variant={task.status === 'completed' ? 'default' : task.status === 'running' ? 'secondary' : 'outline'}>
                      {task.status === 'completed' ? '已完成' : task.status === 'running' ? '执行中' : '待执行'}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{task.strategy}</Badge></TableCell>
                  <TableCell className="text-center font-bold">{task.compressionRatio > 0 ? task.compressionRatio.toFixed(1) + 'x' : '-'}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">
                    {task.accuracyRetention > 0 ? (task.accuracyRetention * 100).toFixed(1) + '%' : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(task.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(task)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleExecute(task.id)} disabled={executing === task.id}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleGenerateData(task.id)}>
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新建蒸馏任务 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建蒸馏任务</DialogTitle>
            <DialogDescription>将大模型的知识蒸馏到小模型中</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">任务名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如 GPT4o→Mini蒸馏" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">教师模型</label>
                <Input value={formData.teacherModel} onChange={(e) => setFormData({ ...formData, teacherModel: e.target.value })} placeholder="如 GPT-4o" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">学生模型</label>
                <Input value={formData.studentModel} onChange={(e) => setFormData({ ...formData, studentModel: e.target.value })} placeholder="如 GPT-4o-mini" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">蒸馏策略</label>
              <select value={formData.strategy} onChange={(e) => setFormData({ ...formData, strategy: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
                <option value="knowledge-distillation">知识蒸馏</option>
                <option value="response-distillation">响应蒸馏</option>
                <option value="feature-distillation">特征蒸馏</option>
                <option value="self-distillation">自蒸馏</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">配置（JSON，可选）</label>
              <textarea
                className="w-full h-20 rounded border p-3 text-sm font-mono resize-none"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                placeholder='{"temperature": 4.0, "alpha": 0.5}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>蒸馏任务详情</DialogTitle>
            <DialogDescription>{selected?.name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">教师模型：</span><Badge variant="outline">{selected.teacherModel}</Badge></div>
                <div><span className="text-sm text-muted-foreground">学生模型：</span><Badge variant="outline">{selected.studentModel}</Badge></div>
                <div><span className="text-sm text-muted-foreground">策略：</span><Badge variant="secondary">{selected.strategy}</Badge></div>
                <div><span className="text-sm text-muted-foreground">状态：</span><Badge>{selected.status}</Badge></div>
                <div><span className="text-sm text-muted-foreground">压缩比：</span><span className="font-bold">{selected.compressionRatio > 0 ? selected.compressionRatio.toFixed(1) + 'x' : '-'}</span></div>
                <div><span className="text-sm text-muted-foreground">精度保留：</span><span className="font-bold text-green-600">{selected.accuracyRetention > 0 ? (selected.accuracyRetention * 100).toFixed(1) + '%' : '-'}</span></div>
              </div>
              {selected.metrics && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">蒸馏指标</h4>
                  <pre className="rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-40">{JSON.stringify(selected.metrics, null, 2)}</pre>
                </div>
              )}
              {selected.config && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">配置</h4>
                  <pre className="rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-40">{JSON.stringify(selected.config, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
