import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Trash2, Play, Search } from 'lucide-react'
import axios from 'axios'

export default function RAGEval() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [formData, setFormData] = useState({ query: '', contexts: '', groundTruth: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/rag/run')
      setTasks(res.data || [])
    } catch (e) {
      setTasks([])
    }
    setLoading(false)
  }

  const handleRun = async () => {
    if (!formData.query) return
    try {
      const res = await axios.post('/api/eval/rag/run', {
        query: formData.query,
        contexts: formData.contexts.split('\n').filter(Boolean),
        groundTruth: formData.groundTruth,
      })
      toastSuccess('RAG 评测完成')
      setTasks([res.data, ...tasks])
      setCreateOpen(false)
      setFormData({ query: '', contexts: '', groundTruth: '' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '评测失败')
    }
  }

  const openDetail = (task: any) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>RAG 评测</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行评测
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>查询</TableHead>
                <TableHead>上下文精度</TableHead>
                <TableHead>上下文召回</TableHead>
                <TableHead>忠实度</TableHead>
                <TableHead>答案相关性</TableHead>
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
                    <TableCell className="max-w-xs truncate">{task.query}</TableCell>
                    <TableCell><Badge variant="outline">{(task.contextPrecision * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell><Badge variant="outline">{(task.contextRecall * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell><Badge variant="outline">{(task.factfulness * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell><Badge variant="outline">{(task.answerRelevancy * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(task)}>
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
            <DialogTitle>运行 RAG 评测</DialogTitle>
            <DialogDescription>输入查询和上下文进行 RAG 评测</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">查询 *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.query}
                onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                placeholder="输入查询问题"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">上下文（每行一条）</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.contexts}
                onChange={(e) => setFormData({ ...formData, contexts: e.target.value })}
                placeholder="输入检索到的上下文"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标准答案</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.groundTruth}
                onChange={(e) => setFormData({ ...formData, groundTruth: e.target.value })}
                placeholder="输入标准答案"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRun} disabled={!formData.query}>运行</Button>
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
              <div>
                <label className="text-sm font-medium">查询</label>
                <p className="mt-1 text-sm bg-muted rounded p-2">{selectedTask.query}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">上下文精度</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.contextPrecision * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">上下文召回</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.contextRecall * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">忠实度</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.factfulness * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">答案相关性</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.answerRelevancy * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
