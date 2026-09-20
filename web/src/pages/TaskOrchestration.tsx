import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Eye, Trash2, Workflow } from 'lucide-react'
import axios from 'axios'

export default function TaskOrchestration() {
  const [orchestrations, setOrchestrations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrch, setSelectedOrch] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', tasks: '[]' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchOrchestrations() }, [])

  const fetchOrchestrations = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/task-orchestration/orchestrations')
      setOrchestrations(res.data || [])
    } catch (e) {
      setOrchestrations([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      let tasks = []
      try {
        tasks = JSON.parse(formData.tasks)
      } catch {
        toastError('任务配置格式错误')
        return
      }
      await axios.post('/api/eval/task-orchestration/orchestrations', {
        name: formData.name,
        tasks,
      })
      toastSuccess('编排创建成功')
      setCreateOpen(false)
      setFormData({ name: '', tasks: '[]' })
      fetchOrchestrations()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleExecute = async (id: string) => {
    try {
      await axios.post(`/api/eval/task-orchestration/orchestrations/${id}/execute`)
      toastSuccess('编排已启动')
      fetchOrchestrations()
    } catch (e) {
      toastError('执行失败')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await axios.post(`/api/eval/task-orchestration/orchestrations/${id}/cancel`)
      toastSuccess('编排已取消')
      fetchOrchestrations()
    } catch (e) {
      toastError('取消失败')
    }
  }

  const handleRetry = async (id: string) => {
    try {
      await axios.post(`/api/eval/task-orchestration/orchestrations/${id}/retry`)
      toastSuccess('编排已重试')
      fetchOrchestrations()
    } catch (e) {
      toastError('重试失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge className="bg-blue-500/10 text-blue-600">运行中</Badge>
      case 'completed': return <Badge className="bg-green-500/10 text-green-600">已完成</Badge>
      case 'failed': return <Badge className="bg-red-500/10 text-red-600">失败</Badge>
      case 'cancelled': return <Badge className="bg-gray-500/10 text-gray-600">已取消</Badge>
      default: return <Badge variant="outline">{status || 'pending'}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2"><Workflow className="h-5 w-5" /> 任务编排</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建编排</Button>
      </div>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>任务数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orchestrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无编排
                  </TableCell>
                </TableRow>
              ) : (
                orchestrations.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell><Badge variant="outline">{o.tasks?.length || 0}</Badge></TableCell>
                    <TableCell>{getStatusBadge(o.status)}</TableCell>
                    <TableCell>{o.progress ? `${(o.progress * 100).toFixed(0)}%` : '-'}</TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {o.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleExecute(o.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {o.status === 'running' && (
                          <Button variant="ghost" size="sm" onClick={() => handleCancel(o.id)}>
                            取消
                          </Button>
                        )}
                        {o.status === 'failed' && (
                          <Button variant="ghost" size="sm" onClick={() => handleRetry(o.id)}>
                            重试
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedOrch(o); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建任务编排</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="编排名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">任务配置 (JSON)</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.tasks}
                onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                placeholder='[{"type": "eval", "config": {}}, {"type": "report", "config": {}}]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编排详情</DialogTitle>
          </DialogHeader>
          {selectedOrch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedOrch.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1">{getStatusBadge(selectedOrch.status)}</p>
                </div>
              </div>
              {selectedOrch.tasks && (
                <div>
                  <label className="text-sm font-medium">任务列表</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrch.tasks.map((t: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <Badge variant="outline">{t.type}</Badge>
                          <span className="ml-2 text-sm">{t.name || `任务 ${i + 1}`}</span>
                        </div>
                        {t.status && <Badge>{t.status}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
