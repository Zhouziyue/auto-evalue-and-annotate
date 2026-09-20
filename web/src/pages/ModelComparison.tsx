import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { ArrowLeftRight, BarChart3, Trophy, Plus, Eye, Trash2, FileText } from 'lucide-react'
import axios from 'axios'

interface Comparison { id: string; modelA: string; modelB: string; metrics: { metric: string; scoreA: number; scoreB: number }[]; status: string; createdAt: string }

export default function ModelComparison() {
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ modelA: '', modelB: '', metrics: '' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Comparison | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchComparisons() }, [])
  const fetchComparisons = async () => { setLoading(true); try { const res = await axios.get('/api/eval/comparison'); setComparisons(res.data || []) } catch (e) { console.error(e) }; setLoading(false) }

  const handleCreate = async () => {
    if (!formData.modelA || !formData.modelB) return
    try { const metrics = formData.metrics.split(',').map(m => m.trim()).filter(Boolean); await axios.post('/api/eval/comparison', { modelA: formData.modelA, modelB: formData.modelB, metrics }); toastSuccess('已创建'); setCreateOpen(false); setFormData({ modelA: '', modelB: '', metrics: '' }); fetchComparisons() }
    catch (e: any) { toastError(e?.response?.data?.message || '创建失败') }
  }
  const handleExecute = async (id: string) => { setExecuting(id); try { await axios.post(`/api/eval/comparison/${id}/execute`); toastSuccess('已执行'); fetchComparisons() } catch (e) { toastError('执行失败') }; setExecuting(null) }
  const handleDelete = async (id: string) => { try { await axios.post(`/api/eval/comparison/${id}/delete`); toastSuccess('已删除'); fetchComparisons() } catch (e) { toastError('删除失败') } }
  const handleViewReport = async (id: string) => { try { const res = await axios.get(`/api/eval/comparison/${id}/report`); setSelected({ ...comparisons.find(c => c.id === id)!, ...res.data }); setDetailOpen(true) } catch (e) { toastError('获取报告失败') } }

  const allModels = [...new Set([...comparisons.map(c => c.modelA), ...comparisons.map(c => c.modelB)])]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">对比组</span> <span className="font-bold">{comparisons.length}</span></span>
          <span><span className="text-muted-foreground">模型</span> <span className="font-bold">{allModels.length}</span></span>
          <span><span className="text-muted-foreground">已完成</span> <span className="font-bold">{comparisons.filter(c => c.status === 'completed').length}</span></span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建</Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>模型A</TableHead><TableHead>模型B</TableHead><TableHead className="text-center">状态</TableHead><TableHead className="text-center">指标数</TableHead><TableHead>创建时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          : comparisons.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无对比</TableCell></TableRow>
          : comparisons.map(item => (
            <TableRow key={item.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{item.modelA}</TableCell>
              <TableCell className="font-medium">{item.modelB}</TableCell>
              <TableCell className="text-center"><Badge variant={item.status === 'completed' ? 'default' : item.status === 'running' ? 'secondary' : 'outline'}>{item.status === 'completed' ? '已完成' : item.status === 'running' ? '执行中' : '待执行'}</Badge></TableCell>
              <TableCell className="text-center">{item.metrics?.length || 0}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(item.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => { setSelected(item); setDetailOpen(true) }}><Eye className="h-4 w-4" /></Button>{item.status !== 'completed' && <Button variant="ghost" size="sm" onClick={() => handleExecute(item.id)} disabled={executing === item.id}>执行</Button>}{item.status === 'completed' && <Button variant="ghost" size="sm" onClick={() => handleViewReport(item.id)}><FileText className="h-4 w-4" /></Button>}<Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建对比</DialogTitle><DialogDescription>选择两个模型对比</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">模型A</label><Input value={formData.modelA} onChange={(e) => setFormData({ ...formData, modelA: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">模型B</label><Input value={formData.modelB} onChange={(e) => setFormData({ ...formData, modelB: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">指标(逗号分隔)</label><Input value={formData.metrics} onChange={(e) => setFormData({ ...formData, metrics: e.target.value })} placeholder="accuracy,safety,speed" /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>对比详情</DialogTitle><DialogDescription>{selected?.modelA} vs {selected?.modelB}</DialogDescription></DialogHeader>
          {selected && selected.metrics?.length > 0 ? <Table><TableHeader><TableRow><TableHead>指标</TableHead><TableHead className="text-center">{selected.modelA}</TableHead><TableHead className="text-center">{selected.modelB}</TableHead><TableHead className="text-center">胜出</TableHead></TableRow></TableHeader><TableBody>{selected.metrics.map((m: any, i: number) => <TableRow key={i}><TableCell className="font-medium">{m.metric}</TableCell><TableCell className="text-center font-bold">{(m.scoreA * 100).toFixed(1)}%</TableCell><TableCell className="text-center font-bold">{(m.scoreB * 100).toFixed(1)}%</TableCell><TableCell className="text-center"><Badge variant={m.scoreA > m.scoreB ? 'default' : 'secondary'}>{m.scoreA > m.scoreB ? selected.modelA : m.scoreB > m.scoreA ? selected.modelB : '平局'}</Badge></TableCell></TableRow>)}</TableBody></Table>
          : <p className="text-center text-muted-foreground py-8">暂无结果</p>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
