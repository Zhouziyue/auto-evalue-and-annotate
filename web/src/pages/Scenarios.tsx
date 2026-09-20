import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Map, Tag, Layers, CheckCircle, Plus, Eye, Play, Search, Archive } from 'lucide-react'
import axios from 'axios'

interface Scenario { id: string; name: string; category: string; status: string; difficulty: string; description: string; caseCount: number; avgScore: number; tags: string[]; createdAt: string; updatedAt: string }

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', category: '', difficulty: 'medium', description: '', tags: '' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Scenario | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchScenarios() }, [])
  const fetchScenarios = async () => { setLoading(true); try { const res = await axios.get('/api/eval/scenarios'); setScenarios(res.data || []) } catch (e) { console.error(e) }; setLoading(false) }

  const handleCreate = async () => {
    if (!formData.name) return
    try { const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean); await axios.post('/api/eval/scenarios', { ...formData, tags }); toastSuccess('已创建'); setCreateOpen(false); setFormData({ name: '', category: '', difficulty: 'medium', description: '', tags: '' }); fetchScenarios() }
    catch (e: any) { toastError(e?.response?.data?.message || '创建失败') }
  }
  const handleActivate = async (id: string) => { try { await axios.post(`/api/eval/scenarios/${id}/activate`); toastSuccess('已激活'); fetchScenarios() } catch (e) { toastError('激活失败') } }
  const handleArchive = async (id: string) => { try { await axios.post(`/api/eval/scenarios/${id}/archive`); toastSuccess('已归档'); fetchScenarios() } catch (e) { toastError('归档失败') } }
  const handleExecute = async (id: string) => { try { await axios.post(`/api/eval/scenarios/${id}/execute`); toastSuccess('已执行'); fetchScenarios() } catch (e) { toastError('执行失败') } }
  const openDetail = async (s: Scenario) => { try { const res = await axios.get(`/api/eval/scenarios/${s.id}`); setSelected(res.data) } catch (e) { setSelected(s) }; setDetailOpen(true) }

  const filtered = scenarios.filter(s => (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())) && (!categoryFilter || s.category === categoryFilter))
  const categories = [...new Set(scenarios.map(s => s.category))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">场景</span> <span className="font-bold">{scenarios.length}</span></span>
          <span><span className="text-muted-foreground">启用</span> <span className="font-bold">{scenarios.filter(s => s.status === 'active').length}</span></span>
          <span><span className="text-muted-foreground">分类</span> <span className="font-bold">{categories.length}</span></span>
          <span><span className="text-muted-foreground">总用例</span> <span className="font-bold">{scenarios.reduce((a, s) => a + s.caseCount, 0)}</span></span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded border border-input bg-background px-3 py-1.5 text-sm h-8">
          <option value="">全部分类</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>分类</TableHead><TableHead className="text-center">状态</TableHead><TableHead>难度</TableHead><TableHead className="text-center">用例</TableHead><TableHead className="text-center">平均分</TableHead><TableHead>标签</TableHead><TableHead>更新时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          : filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">暂无</TableCell></TableRow>
          : filtered.map(s => (
            <TableRow key={s.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
              <TableCell className="text-center"><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status === 'active' ? '启用' : '归档'}</Badge></TableCell>
              <TableCell><Badge variant={s.difficulty === 'easy' ? 'secondary' : s.difficulty === 'hard' ? 'destructive' : 'outline'}>{s.difficulty === 'easy' ? '简单' : s.difficulty === 'medium' ? '中等' : '困难'}</Badge></TableCell>
              <TableCell className="text-center">{s.caseCount}</TableCell>
              <TableCell className="text-center font-bold">{s.avgScore > 0 ? (s.avgScore * 100).toFixed(1) + '%' : '-'}</TableCell>
              <TableCell><div className="flex flex-wrap gap-1">{s.tags?.slice(0, 2).map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}</div></TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(s.updatedAt).toLocaleString()}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openDetail(s)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleExecute(s.id)}><Play className="h-4 w-4" /></Button>{s.status === 'active' ? <Button variant="ghost" size="sm" onClick={() => handleArchive(s.id)}><Archive className="h-4 w-4" /></Button> : <Button variant="ghost" size="sm" onClick={() => handleActivate(s.id)}><CheckCircle className="h-4 w-4" /></Button>}</div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建场景</DialogTitle><DialogDescription>创建评测场景</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">名称</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">分类</label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">难度</label><select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="easy">简单</option><option value="medium">中等</option><option value="hard">困难</option></select></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">描述</label><textarea className="w-full h-16 rounded border p-3 text-sm resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">标签(逗号分隔)</label><Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>场景详情</DialogTitle><DialogDescription>{selected?.name}</DialogDescription></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-muted-foreground">分类：</span><Badge variant="outline">{selected.category}</Badge></div>
              <div><span className="text-sm text-muted-foreground">状态：</span><Badge>{selected.status}</Badge></div>
              <div><span className="text-sm text-muted-foreground">难度：</span><Badge variant="outline">{selected.difficulty}</Badge></div>
              <div><span className="text-sm text-muted-foreground">用例：</span><span className="font-bold">{selected.caseCount}</span></div>
            </div>
            {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
            {selected.tags?.length > 0 && <div className="flex flex-wrap gap-1">{selected.tags.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
