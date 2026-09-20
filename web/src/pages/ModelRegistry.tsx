import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Package, Bot, Tag, Clock, Plus, Eye, Search, Trash2 } from 'lucide-react'
import axios from 'axios'

interface Model { id: string; name: string; provider: string; version: string; status: string; taskType: string; accuracy: number; description: string; config: any; registeredAt: string; updatedAt: string }

export default function ModelRegistry() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', provider: '', version: '', taskType: 'chat', description: '', config: '' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Model | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchModels() }, [])
  const fetchModels = async () => { setLoading(true); try { const res = await axios.get('/api/eval/model-registry/models'); setModels(Array.isArray(res.data) ? res.data : []) } catch (e) { console.error(e) }; setLoading(false) }

  const handleCreate = async () => {
    if (!formData.name || !formData.provider) return
    try { const config = formData.config ? JSON.parse(formData.config) : undefined; await axios.post('/api/eval/model-registry/models', { ...formData, config }); toastSuccess('已注册'); setCreateOpen(false); setFormData({ name: '', provider: '', version: '', taskType: 'chat', description: '', config: '' }); fetchModels() }
    catch (e: any) { toastError(e?.response?.data?.message || '注册失败') }
  }
  const handleDelete = async (id: string) => { try { await axios.post(`/api/eval/model-registry/models/${id}/delete`); toastSuccess('已删除'); fetchModels() } catch (e) { toastError('删除失败') } }
  const openDetail = async (model: Model) => { try { const res = await axios.get(`/api/eval/model-registry/models/${model.id}`); setSelected(res.data) } catch (e) { setSelected(model) }; setDetailOpen(true) }

  const filtered = models.filter(m => (!searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())) && (!providerFilter || m.provider === providerFilter))
  const providers = [...new Set(models.map(m => m.provider))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">模型</span> <span className="font-bold">{models.length}</span></span>
          <span><span className="text-muted-foreground">活跃</span> <span className="font-bold">{models.filter(m => m.status === 'active').length}</span></span>
          <span><span className="text-muted-foreground">供应商</span> <span className="font-bold">{providers.length}</span></span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />注册</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className="rounded border border-input bg-background px-3 py-1.5 text-sm h-8">
          <option value="">全部供应商</option>{providers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>模型</TableHead><TableHead>供应商</TableHead><TableHead>版本</TableHead><TableHead className="text-center">状态</TableHead><TableHead>类型</TableHead><TableHead className="text-center">准确率</TableHead><TableHead>注册时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无</TableCell></TableRow>
          : filtered.map(model => (
            <TableRow key={model.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{model.name}</TableCell>
              <TableCell><Badge variant="outline">{model.provider}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{model.version}</TableCell>
              <TableCell className="text-center"><Badge variant={model.status === 'active' ? 'default' : 'secondary'}>{model.status === 'active' ? '活跃' : '停用'}</Badge></TableCell>
              <TableCell><Badge variant="secondary">{model.taskType}</Badge></TableCell>
              <TableCell className="text-center font-bold">{model.accuracy > 0 ? (model.accuracy * 100).toFixed(1) + '%' : '-'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(model.registeredAt).toLocaleString()}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openDetail(model)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(model.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>注册模型</DialogTitle><DialogDescription>注册新模型到平台</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">名称</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">供应商</label><Input value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">版本</label><Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">类型</label><select value={formData.taskType} onChange={(e) => setFormData({ ...formData, taskType: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="chat">对话</option><option value="embedding">向量化</option><option value="completion">补全</option><option value="classification">分类</option></select></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">描述</label><textarea className="w-full h-16 rounded border p-3 text-sm resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">配置(JSON)</label><textarea className="w-full h-16 rounded border p-3 text-sm font-mono resize-none" value={formData.config} onChange={(e) => setFormData({ ...formData, config: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>注册</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>模型详情</DialogTitle><DialogDescription>{selected?.name}</DialogDescription></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-muted-foreground">供应商：</span><Badge variant="outline">{selected.provider}</Badge></div>
              <div><span className="text-sm text-muted-foreground">版本：</span><span className="font-mono text-sm">{selected.version}</span></div>
              <div><span className="text-sm text-muted-foreground">状态：</span><Badge>{selected.status}</Badge></div>
              <div><span className="text-sm text-muted-foreground">类型：</span><Badge variant="secondary">{selected.taskType}</Badge></div>
              <div><span className="text-sm text-muted-foreground">准确率：</span><span className="font-bold">{selected.accuracy > 0 ? (selected.accuracy * 100).toFixed(1) + '%' : '-'}</span></div>
              <div><span className="text-sm text-muted-foreground">注册：</span><span className="text-sm">{new Date(selected.registeredAt).toLocaleString()}</span></div>
            </div>
            {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
            {selected.config && <pre className="rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-40">{JSON.stringify(selected.config, null, 2)}</pre>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
