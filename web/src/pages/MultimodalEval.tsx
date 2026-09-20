import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye } from 'lucide-react'
import axios from 'axios'

export default function MultimodalEval() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [types, setTypes] = useState<any[]>([])
  const [formData, setFormData] = useState({ type: '', input: '', expected: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchTasks()
    fetchTypes()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/multimodal/run')
      setTasks(res.data || [])
    } catch (e) {
      setTasks([])
    }
    setLoading(false)
  }

  const fetchTypes = async () => {
    try {
      const res = await axios.get('/api/eval/multimodal/types')
      setTypes(res.data?.types || [])
    } catch (e) {}
  }

  const handleRun = async () => {
    if (!formData.type || !formData.input) return
    try {
      const res = await axios.post('/api/eval/multimodal/run', {
        type: formData.type,
        input: formData.input,
        expectedOutput: formData.expected,
      })
      toastSuccess('多模态评测完成')
      setTasks([res.data, ...tasks])
      setCreateOpen(false)
      setFormData({ type: '', input: '', expected: '' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '评测失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>多模态评测</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行评测
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>输入</TableHead>
                <TableHead>得分</TableHead>
                <TableHead>用时</TableHead>
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
                    <TableCell><Badge variant="outline">{task.type}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{task.input}</TableCell>
                    <TableCell><Badge>{(task.score * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell>{task.latency}ms</TableCell>
                    <TableCell>{new Date(task.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(task); setDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>运行多模态评测</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">评测类型 *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">选择类型</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">输入 *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.input}
                onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                placeholder="输入内容（图片URL、音频URL等）"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">期望输出</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.expected}
                onChange={(e) => setFormData({ ...formData, expected: e.target.value })}
                placeholder="标准答案"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRun} disabled={!formData.type || !formData.input}>运行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>评测详情</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">类型</label>
                  <p className="mt-1"><Badge>{selectedTask.type}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">得分</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.score * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">输入</label>
                <p className="mt-1 text-sm bg-muted rounded p-2">{selectedTask.input}</p>
              </div>
              {selectedTask.output && (
                <div>
                  <label className="text-sm font-medium">输出</label>
                  <p className="mt-1 text-sm bg-muted rounded p-2">{selectedTask.output}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
