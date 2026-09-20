import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Pause, Trash2, Clock } from 'lucide-react'
import axios from 'axios'

export default function Scheduler() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', cronExpression: '', taskType: 'eval_run', taskConfig: '{}' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/scheduler/tasks')
      setTasks(res.data || [])
    } catch (e) {
      setTasks([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.cronExpression) return
    try {
      let taskConfig = {}
      try {
        taskConfig = JSON.parse(formData.taskConfig)
      } catch {
        toastError('任务配置格式错误')
        return
      }
      await axios.post('/api/eval/scheduler/tasks', {
        name: formData.name,
        cronExpression: formData.cronExpression,
        taskType: formData.taskType,
        taskConfig,
      })
      toastSuccess('任务创建成功')
      setCreateOpen(false)
      setFormData({ name: '', cronExpression: '', taskType: 'eval_run', taskConfig: '{}' })
      fetchTasks()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handlePause = async (id: string) => {
    try {
      await axios.post(`/api/eval/scheduler/tasks/${id}/pause`)
      toastSuccess('任务已暂停')
      fetchTasks()
    } catch (e) {
      toastError('暂停失败')
    }
  }

  const handleResume = async (id: string) => {
    try {
      await axios.post(`/api/eval/scheduler/tasks/${id}/resume`)
      toastSuccess('任务已恢复')
      fetchTasks()
    } catch (e) {
      toastError('恢复失败')
    }
  }

  const handleTrigger = async (id: string) => {
    try {
      await axios.post(`/api/eval/scheduler/tasks/${id}/trigger`)
      toastSuccess('任务已触发')
      fetchTasks()
    } catch (e) {
      toastError('触发失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/scheduler/tasks/${id}/delete`)
      toastSuccess('任务已删除')
      fetchTasks()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-600">活跃</Badge>
      case 'paused': return <Badge className="bg-yellow-500/10 text-yellow-600">已暂停</Badge>
      case 'completed': return <Badge>已完成</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> 评测调度
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建任务
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>Cron 表达式</TableHead>
                <TableHead>任务类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>上次执行</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无调度任务
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.cronExpression}</TableCell>
                    <TableCell><Badge variant="outline">{t.taskType}</Badge></TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                    <TableCell>{t.lastExecutedAt ? new Date(t.lastExecutedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {t.status === 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => handlePause(t.id)}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {t.status === 'paused' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleResume(t.id)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleTrigger(t.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建调度任务</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="任务名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cron 表达式 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                placeholder="0 0 * * * (每天0点)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">任务类型</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
              >
                <option value="eval_run">评测运行</option>
                <option value="benchmark">基准测试</option>
                <option value="pipeline">流水线</option>
                <option value="cleanup">清理</option>
                <option value="report">报告</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">任务配置 (JSON)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.taskConfig}
                onChange={(e) => setFormData({ ...formData, taskConfig: e.target.value })}
                placeholder='{"agentId": "xxx", "datasetId": "yyy"}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.cronExpression}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
