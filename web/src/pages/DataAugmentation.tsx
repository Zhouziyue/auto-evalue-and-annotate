import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Eye, Download, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function DataAugmentation() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [strategies, setStrategies] = useState<any[]>([])
  const [formData, setFormData] = useState({ name: '', sourceData: '', strategies: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchTasks()
    fetchStrategies()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/data-augmentation/tasks')
      setTasks(res.data || [])
    } catch (e) {
      setTasks([])
    }
    setLoading(false)
  }

  const fetchStrategies = async () => {
    try {
      const res = await axios.get('/api/eval/data-augmentation/strategies')
      setStrategies(res.data || [])
    } catch (e) {}
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.sourceData) return
    try {
      let sourceData = []
      try {
        sourceData = JSON.parse(formData.sourceData)
      } catch {
        toastError('源数据格式错误')
        return
      }
      await axios.post('/api/eval/data-augmentation/tasks', {
        name: formData.name,
        sourceData,
        strategies: formData.strategies.split(',').map(s => s.trim()).filter(Boolean),
      })
      toastSuccess('任务创建成功')
      setCreateOpen(false)
      setFormData({ name: '', sourceData: '', strategies: '' })
      fetchTasks()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleExecute = async (id: string) => {
    try {
      await axios.post(`/api/eval/data-augmentation/tasks/${id}/execute`)
      toastSuccess('增强已启动')
      fetchTasks()
    } catch (e) {
      toastError('执行失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/data-augmentation/tasks/${id}/delete`)
      toastSuccess('任务已删除')
      fetchTasks()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>数据增强</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建任务
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>策略</TableHead>
                <TableHead>源数据</TableHead>
                <TableHead>增强数据</TableHead>
                <TableHead>状态</TableHead>
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
                    <TableCell>
                      <div className="flex gap-1">
                        {t.strategies?.slice(0, 2).map((s: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{t.sourceCount || 0}</TableCell>
                    <TableCell>{t.augmentedCount || 0}</TableCell>
                    <TableCell><Badge>{t.status || 'pending'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {t.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleExecute(t.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(t); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建数据增强任务</DialogTitle>
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
              <label className="text-sm font-medium">源数据 (JSON) *</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.sourceData}
                onChange={(e) => setFormData({ ...formData, sourceData: e.target.value })}
                placeholder='[{"text": "原始数据1"}, {"text": "原始数据2"}]'
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">增强策略（逗号分隔）</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.strategies}
                onChange={(e) => setFormData({ ...formData, strategies: e.target.value })}
                placeholder="synonym,back_translation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.sourceData}>创建</Button>
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
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1"><Badge>{selectedTask.status}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">源数据</label>
                  <p className="mt-1 text-sm">{selectedTask.sourceCount || 0} 条</p>
                </div>
                <div>
                  <label className="text-sm font-medium">增强数据</label>
                  <p className="mt-1 text-sm">{selectedTask.augmentedCount || 0} 条</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
