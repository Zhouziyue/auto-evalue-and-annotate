import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { useToastActions } from '@/components/ui/toast'
import { Cpu, Plus, Eye, Play, Search, BarChart3 } from 'lucide-react'
import axios from 'axios'

interface DistillationTask { id: string; name: string; teacherModel: string; studentModel: string; status: string; strategy: string; compressionRatio: number; accuracyRetention: number; config: any; metrics: any; createdAt: string; updatedAt: string }

export default function Distillation() {
  const [tasks, setTasks] = useState<DistillationTask[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', teacherModel: '', studentModel: '', strategy: 'knowledge-distillation', config: '' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<DistillationTask | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [executing, setExecuting] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTasks() }, [])
  const fetchTasks = async () => { setLoading(true); try { const res = await axios.get('/api/eval/distillation/tasks'); setTasks(res.data || []) } catch (e) { console.error(e) }; setLoading(false) }

  const handleCreate = async () => {
    if (!formData.name || !formData.teacherModel || !formData.studentModel) return
    try { const config = formData.config ? JSON.parse(formData.config) : undefined; await axios.post('/api/eval/distillation/tasks', { ...formData, config }); toastSuccess('已创建'); setCreateOpen(false); setFormData({ name: '', teacherModel: '', studentModel: '', strategy: 'knowledge-distillation', config: '' }); fetchTasks() }
    catch (e: any) { toastError(e?.response?.data?.message || '创建失败') }
  }
  const handleExecute = async (id: string) => { setExecuting(id); try { await axios.post(`/api/eval/distillation/tasks/${id}/execute`); toastSuccess('已启动'); fetchTasks() } catch (e) { toastError('执行失败') }; setExecuting(null) }
  const handleGenerateData = async (id: string) => { try { await axios.post(`/api/eval/distillation/tasks/${id}/generate-data`); toastSuccess('数据已生成'); fetchTasks() } catch (e) { toastError('生成失败') } }
  const openDetail = async (task: DistillationTask) => { try { const res = await axios.get(`/api/eval/distillation/tasks/${task.id}`); setSelected(res.data) } catch (e) { setSelected(task) }; setDetailOpen(true) }

  const filtered = tasks.filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const completed = tasks.filter(t => t.status === 'completed')
  const avgComp = completed.filter(t => t.compressionRatio > 0).length > 0 ? completed.filter(t => t.compressionRatio > 0).reduce((a, t) => a + t.compressionRatio, 0) / completed.filter(t => t.compressionRatio > 0).length : 0
  const avgRet = completed.filter(t => t.accuracyRetention > 0).length > 0 ? completed.filter(t => t.accuracyRetention > 0).reduce((a, t) => a + t.accuracyRetention, 0) / completed.filter(t => t.accuracyRetention > 0).length : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">任务</span> <span className="font-bold">{tasks.length}</span></span>
          <span><span className="text-muted-foreground">已完成</span> <span className="font-bold">{completed.length}</span></span>
          <span><span className="text-muted-foreground">平均压缩</span> <span className="font-bold">{avgComp > 0 ? avgComp.toFixed(1) + 'x' : '-'}</span></span>
          <span><span className="text-muted-foreground">精度保留</span> <span className="font-bold text-green-600">{avgRet > 0 ? (avgRet * 100).toFixed(1) + '%' : '-'}</span></span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>教师</TableHead><TableHead>学生</TableHead><TableHead className="text-center">状态</TableHead><TableHead>策略</TableHead><TableHead className="text-center">压缩比</TableHead><TableHead className="text-center">精度</TableHead><TableHead>创建时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          : filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">暂无任务</TableCell></TableRow>
          : filtered.map(task => (
            <TableRow key={task.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{task.name}</TableCell>
              <TableCell><Badge variant="outline">{task.teacherModel}</Badge></TableCell>
              <TableCell><Badge variant="outline">{task.studentModel}</Badge></TableCell>
              <TableCell className="text-center"><Badge variant={task.status === 'completed' ? 'default' : task.status === 'running' ? 'secondary' : 'outline'}>{task.status === 'completed' ? '已完成' : task.status === 'running' ? '执行中' : '待执行'}</Badge></TableCell>
              <TableCell><Badge variant="secondary">{task.strategy}</Badge></TableCell>
              <TableCell className="text-center font-bold">{task.compressionRatio > 0 ? task.compressionRatio.toFixed(1) + 'x' : '-'}</TableCell>
              <TableCell className="text-center font-bold text-green-600">{task.accuracyRetention > 0 ? (task.accuracyRetention * 100).toFixed(1) + '%' : '-'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(task.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openDetail(task)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleExecute(task.id)} disabled={executing === task.id}><Play className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleGenerateData(task.id)}><BarChart3 className="h-4 w-4" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建蒸馏任务</DialogTitle><DialogDescription>将大模型知识蒸馏到小模型</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">名称</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">教师模型</label><Input value={formData.teacherModel} onChange={(e) => setFormData({ ...formData, teacherModel: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">学生模型</label><Input value={formData.studentModel} onChange={(e) => setFormData({ ...formData, studentModel: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">策略</label><select value={formData.strategy} onChange={(e) => setFormData({ ...formData, strategy: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="knowledge-distillation">知识蒸馏</option><option value="response-distillation">响应蒸馏</option><option value="feature-distillation">特征蒸馏</option></select></div>
            <div className="space-y-2"><label className="text-sm font-medium">配置(JSON)</label><textarea className="w-full h-16 rounded border p-3 text-sm font-mono resize-none" value={formData.config} onChange={(e) => setFormData({ ...formData, config: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>任务详情</DialogTitle><DialogDescription>{selected?.name}</DialogDescription></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-muted-foreground">教师：</span><Badge variant="outline">{selected.teacherModel}</Badge></div>
              <div><span className="text-sm text-muted-foreground">学生：</span><Badge variant="outline">{selected.studentModel}</Badge></div>
              <div><span className="text-sm text-muted-foreground">策略：</span><Badge variant="secondary">{selected.strategy}</Badge></div>
              <div><span className="text-sm text-muted-foreground">状态：</span><Badge>{selected.status}</Badge></div>
              <div><span className="text-sm text-muted-foreground">压缩比：</span><span className="font-bold">{selected.compressionRatio > 0 ? selected.compressionRatio.toFixed(1) + 'x' : '-'}</span></div>
              <div><span className="text-sm text-muted-foreground">精度保留：</span><span className="font-bold text-green-600">{selected.accuracyRetention > 0 ? (selected.accuracyRetention * 100).toFixed(1) + '%' : '-'}</span></div>
            </div>
            {selected.metrics && <div><h4 className="text-sm font-medium mb-2">指标</h4><pre className="rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-40">{JSON.stringify(selected.metrics, null, 2)}</pre></div>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
