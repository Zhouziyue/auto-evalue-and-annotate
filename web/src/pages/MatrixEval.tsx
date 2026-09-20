import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Download } from 'lucide-react'
import axios from 'axios'

export default function MatrixEval() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [formData, setFormData] = useState({ models: '', metrics: '', datasets: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/matrix')
      setTasks(res.data || [])
    } catch (e) {
      setTasks([])
    }
    setLoading(false)
  }

  const handleRun = async () => {
    try {
      const res = await axios.post('/api/eval/matrix', {
        models: formData.models.split(',').map(m => m.trim()).filter(Boolean),
        metrics: formData.metrics.split(',').map(m => m.trim()).filter(Boolean),
        datasets: formData.datasets.split(',').map(d => d.trim()).filter(Boolean),
      })
      toastSuccess('矩阵评测完成')
      setTasks([res.data, ...tasks])
      setCreateOpen(false)
    } catch (e: any) {
      toastError(e?.response?.data?.message || '评测失败')
    }
  }

  const handleExport = async (task: any) => {
    try {
      const res = await axios.post('/api/eval/matrix/export', task.config)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'matrix-results.csv')
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>矩阵评测</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行评测
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型数</TableHead>
                <TableHead>指标数</TableHead>
                <TableHead>数据集数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无评测记录
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task, i) => (
                  <TableRow key={i}>
                    <TableCell>{task.models?.length || 0}</TableCell>
                    <TableCell>{task.metrics?.length || 0}</TableCell>
                    <TableCell>{task.datasets?.length || 0}</TableCell>
                    <TableCell><Badge>{task.status || 'completed'}</Badge></TableCell>
                    <TableCell>{new Date(task.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(task); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleExport(task)}>
                          <Download className="h-4 w-4" />
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
            <DialogTitle>运行矩阵评测</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">模型（逗号分隔）*</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.models}
                onChange={(e) => setFormData({ ...formData, models: e.target.value })}
                placeholder="gpt-4,gpt-3.5,claude-3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">指标（逗号分隔）*</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.metrics}
                onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                placeholder="accuracy,precision,recall"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数据集（逗号分隔）*</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.datasets}
                onChange={(e) => setFormData({ ...formData, datasets: e.target.value })}
                placeholder="dataset1,dataset2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRun}>运行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>矩阵评测详情</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">结果矩阵</label>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">模型</th>
                        {selectedTask.metrics?.map((m: string) => (
                          <th key={m} className="border px-2 py-1">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTask.results?.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border px-2 py-1 font-medium">{row.model}</td>
                          {selectedTask.metrics?.map((m: string) => (
                            <td key={m} className="border px-2 py-1 text-center">
                              {(row.scores?.[m] * 100).toFixed(1)}%
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
