import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, BarChart3, Search } from 'lucide-react'
import axios from 'axios'

interface Experiment { id: string; name: string; status: string; hypothesis: string; metric: string; baseline: number; improvement: number; config: any; runs: { id: string; params: any; result: number; createdAt: string }[]; createdAt: string; updatedAt: string }

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', hypothesis: '', metric: 'accuracy', baseline: 0 })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Experiment | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareResult, setCompareResult] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchExperiments() }, [])
  const fetchExperiments = async () => { setLoading(true); try { const res = await axios.get('/api/eval/experiments'); setExperiments(res.data || []) } catch (e) { console.error(e) }; setLoading(false) }

  const handleCreate = async () => {
    if (!formData.name || !formData.hypothesis) return
    try { await axios.post('/api/eval/experiments', formData); toastSuccess('已创建'); setCreateOpen(false); setFormData({ name: '', hypothesis: '', metric: 'accuracy', baseline: 0 }); fetchExperiments() }
    catch (e: any) { toastError(e?.response?.data?.message || '创建失败') }
  }
  const openDetail = async (exp: Experiment) => { try { const res = await axios.get(`/api/eval/experiments/${exp.id}`); setSelected(res.data) } catch (e) { setSelected(exp) }; setDetailOpen(true) }
  const handleCompare = async () => {
    if (compareIds.length < 2) return
    try { const res = await axios.post('/api/eval/experiments/compare', { experimentIds: compareIds }); setCompareResult(res.data) } catch (e) { toastError('对比失败') }
  }

  const getStatusBadge = (s: string) => s === 'completed' ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">已完成</Badge> : s === 'running' ? <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20" variant="outline">进行中</Badge> : <Badge variant="outline">{s}</Badge>
  const filtered = experiments.filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const completed = experiments.filter(e => e.improvement > 0)
  const avgImp = completed.length > 0 ? completed.reduce((a, e) => a + e.improvement, 0) / completed.length : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">实验</span> <span className="font-bold">{experiments.length}</span></span>
          <span><span className="text-muted-foreground">进行中</span> <span className="font-bold">{experiments.filter(e => e.status === 'running').length}</span></span>
          <span><span className="text-muted-foreground">已完成</span> <span className="font-bold">{experiments.filter(e => e.status === 'completed').length}</span></span>
          <span><span className="text-muted-foreground">平均提升</span> <span className="font-bold text-green-600">+{(avgImp * 100).toFixed(1)}%</span></span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)} disabled={experiments.length < 2}><BarChart3 className="mr-2 h-3.5 w-3.5" />对比</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索实验..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>名称</TableHead><TableHead className="text-center">状态</TableHead><TableHead>假设</TableHead><TableHead>指标</TableHead><TableHead className="text-center">基线</TableHead><TableHead className="text-center">提升</TableHead><TableHead>创建时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无实验</TableCell></TableRow>
          : filtered.map(exp => (
            <TableRow key={exp.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{exp.name}</TableCell>
              <TableCell className="text-center">{getStatusBadge(exp.status)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{exp.hypothesis}</TableCell>
              <TableCell><Badge variant="outline">{exp.metric}</Badge></TableCell>
              <TableCell className="text-center">{exp.baseline ? (exp.baseline * 100).toFixed(1) + '%' : '-'}</TableCell>
              <TableCell className="text-center font-bold text-green-600">{exp.improvement > 0 ? '+' + (exp.improvement * 100).toFixed(1) + '%' : '-'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(exp.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openDetail(exp)}><Eye className="h-4 w-4" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建实验</DialogTitle><DialogDescription>创建评测实验</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">名称</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">假设</label><Input value={formData.hypothesis} onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">指标</label><select value={formData.metric} onChange={(e) => setFormData({ ...formData, metric: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="accuracy">准确率</option><option value="f1_score">F1</option><option value="reasoning">推理</option></select></div>
              <div className="space-y-2"><label className="text-sm font-medium">基线</label><Input type="number" step={0.01} value={formData.baseline} onChange={(e) => setFormData({ ...formData, baseline: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>实验详情</DialogTitle><DialogDescription>{selected?.name}</DialogDescription></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-muted-foreground">状态：</span>{getStatusBadge(selected.status)}</div>
              <div><span className="text-sm text-muted-foreground">指标：</span><Badge variant="outline">{selected.metric}</Badge></div>
              <div className="col-span-2"><span className="text-sm text-muted-foreground">假设：</span>{selected.hypothesis}</div>
            </div>
            {selected.runs?.length > 0 && <Table><TableHeader><TableRow><TableHead>参数</TableHead><TableHead className="text-center">结果</TableHead><TableHead>时间</TableHead></TableRow></TableHeader><TableBody>{selected.runs.map(r => <TableRow key={r.id}><TableCell className="font-mono text-xs">{JSON.stringify(r.params)}</TableCell><TableCell className="text-center font-bold">{(r.result * 100).toFixed(1)}%</TableCell><TableCell className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table>}
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>对比实验</DialogTitle><DialogDescription>选择多个实验对比</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-auto">{experiments.map(exp => <label key={exp.id} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/50"><input type="checkbox" checked={compareIds.includes(exp.id)} onChange={(e) => { if (e.target.checked) setCompareIds([...compareIds, exp.id]); else setCompareIds(compareIds.filter(id => id !== exp.id)) }} /><span className="text-sm font-medium">{exp.name}</span><Badge variant="outline" className="ml-auto">{exp.metric}</Badge></label>)}</div>
            <Button onClick={handleCompare} disabled={compareIds.length < 2} className="w-full">对比</Button>
            {compareResult && <pre className="text-xs font-mono overflow-auto max-h-60 rounded border p-4">{JSON.stringify(compareResult, null, 2)}</pre>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
