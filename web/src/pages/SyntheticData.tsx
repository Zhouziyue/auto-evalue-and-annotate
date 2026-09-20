import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Eye, Download, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function SyntheticData() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', count: '100', strategy: 'paraphrase' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/synthetic/tasks')
      setTasks(res.data || [])
    } catch (e) {
      setTasks([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      await axios.post('/api/eval/synthetic/tasks', {
        name: formData.name,
        count: parseInt(formData.count),
        strategy: formData.strategy,
      })
      toastSuccess('任务创建成功')
      setCreateOpen(false)
      setFormData({ name: '', count: '100', strategy: 'paraphrase' })
      fetchTasks()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleStart = async (id: string) => {
    try {
      await axios.post(`/api/eval/synthetic/tasks/${id}/start`)
      toastSuccess('生成已启动')
      fetchTasks()
    } catch (e) {
      toastError('启动失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/synthetic/tasks/${id}/delete`)
      toastSuccess('任务已删除')
      fetchTasks()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleExport = async (id: string) => {
    try {
      const res = await axios.get(`/api/eval/synthetic/tasks/${id}/export/json`)
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `synthetic-${id}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('导出成功')
    } catch (e) {
      toastError('导出失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">合成数据生成</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建任务</Button>
      </div>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>策略</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无任务
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.strategy}</Badge></TableCell>
                    <TableCell>{t.count || t.generatedCount || 0}</TableCell>
                    <TableCell><Badge>{t.status || 'pending'}</Badge></TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {t.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleStart(t.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(t); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleExport(t.id)}>
                          <Download className="h-4 w-4" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建合成数据任务</DialogTitle>
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
              <label className="text-sm font-medium">生成数量</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">生成策略</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              >
                <option value="paraphrase">改写</option>
                <option value="back_translation">回译</option>
                <option value="template">模板</option>
                <option value="llm">LLM 生成</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedTask.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">策略</label>
                  <p className="mt-1"><Badge>{selectedTask.strategy}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1"><Badge>{selectedTask.status}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">生成数量</label>
                  <p className="mt-1 text-sm">{selectedTask.generatedCount || 0}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
