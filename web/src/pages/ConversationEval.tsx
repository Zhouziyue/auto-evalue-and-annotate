import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye } from 'lucide-react'
import axios from 'axios'

export default function ConversationEval() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [formData, setFormData] = useState({ conversation: '', groundTruth: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/conversation/run')
      setTasks(res.data || [])
    } catch (e) {
      setTasks([])
    }
    setLoading(false)
  }

  const handleRun = async () => {
    if (!formData.conversation) return
    try {
      const res = await axios.post('/api/eval/conversation/run', {
        conversation: JSON.parse(formData.conversation),
        groundTruth: formData.groundTruth ? JSON.parse(formData.groundTruth) : undefined,
      })
      toastSuccess('对话评测完成')
      setTasks([res.data, ...tasks])
      setCreateOpen(false)
      setFormData({ conversation: '', groundTruth: '' })
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
          <CardTitle>对话评测</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行评测
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>轮次</TableHead>
                <TableHead>连贯性</TableHead>
                <TableHead>完整性</TableHead>
                <TableHead>信息量</TableHead>
                <TableHead>用时</TableHead>
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
                    <TableCell>{task.turnCount || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{(task.coherence * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell><Badge variant="outline">{(task.completeness * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell><Badge variant="outline">{(task.informationGain * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell>{task.latency || '-'}ms</TableCell>
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
            <DialogTitle>运行对话评测</DialogTitle>
            <DialogDescription>输入对话历史进行评测</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">对话历史 (JSON) *</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.conversation}
                onChange={(e) => setFormData({ ...formData, conversation: e.target.value })}
                placeholder='[{"role":"user","content":"你好"},{"role":"assistant","content":"你好！"}]'
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标准答案 (JSON，可选)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.groundTruth}
                onChange={(e) => setFormData({ ...formData, groundTruth: e.target.value })}
                placeholder='{"expectedTopics":["问候"],"minTurns":1}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRun} disabled={!formData.conversation}>运行</Button>
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
                  <label className="text-sm font-medium">连贯性</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.coherence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">完整性</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.completeness * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">信息量</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedTask.informationGain * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">用时</label>
                  <p className="mt-1 text-2xl font-bold">{selectedTask.latency}ms</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
