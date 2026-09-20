import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Network, Globe, Users, Shield, Plus, Eye, Play, Settings } from 'lucide-react'
import axios from 'axios'

interface FederatedTask { id: string; name: string; type: string; strategy: string; status: string; participants: { id: string; name: string; role: string; status: string; dataPoints: number; lastSync: string; modelVersion: string }[]; round: number; totalRounds: number; createdAt: string }

export default function Federated() {
  const [tasks, setTasks] = useState<FederatedTask[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'horizontal', strategy: 'fedavg', totalRounds: 10 })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<FederatedTask | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [privacyConfig, setPrivacyConfig] = useState({ dpEnabled: false, dpEpsilon: 1.0, secureAggregation: false })
  const [executing, setExecuting] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTasks() }, [])
  const fetchTasks = async () => { setLoading(true); try { const res = await axios.get('/api/eval/federated/tasks'); setTasks(res.data || []) } catch (e) { console.error(e) }; setLoading(false) }

  const handleCreate = async () => {
    if (!formData.name) return
    try { await axios.post('/api/eval/federated/tasks', formData); toastSuccess('已创建'); setCreateOpen(false); setFormData({ name: '', type: 'horizontal', strategy: 'fedavg', totalRounds: 10 }); fetchTasks() }
    catch (e: any) { toastError(e?.response?.data?.message || '创建失败') }
  }
  const handleExecute = async (id: string) => { setExecuting(id); try { await axios.post(`/api/eval/federated/tasks/${id}/execute`); toastSuccess('已启动'); fetchTasks() } catch (e) { toastError('执行失败') }; setExecuting(null) }
  const openDetail = async (task: FederatedTask) => { try { const res = await axios.get(`/api/eval/federated/tasks/${task.id}`); setSelected(res.data) } catch (e) { setSelected(task) }; setDetailOpen(true) }
  const handleSavePrivacy = async () => { if (!selected) return; try { await axios.post(`/api/eval/federated/tasks/${selected.id}/privacy`, privacyConfig); toastSuccess('已保存'); setPrivacyOpen(false) } catch (e) { toastError('保存失败') } }

  const getStatusBadge = (s: string) => s === 'active' || s === 'completed' ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">活跃</Badge> : s === 'running' ? <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20" variant="outline">执行中</Badge> : s === 'paused' ? <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20" variant="outline">已暂停</Badge> : <Badge variant="outline">{s}</Badge>
  const totalDataPoints = tasks.reduce((sum, t) => sum + (t.participants?.reduce((s, p) => s + p.dataPoints, 0) || 0), 0)
  const activeNodes = tasks.reduce((sum, t) => sum + (t.participants?.filter(p => p.status === 'active').length || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">任务</span> <span className="font-bold">{tasks.length}</span></span>
          <span><span className="text-muted-foreground">在线节点</span> <span className="font-bold">{activeNodes}</span></span>
          <span><span className="text-muted-foreground">数据点</span> <span className="font-bold">{totalDataPoints.toLocaleString()}</span></span>
          <span><span className="text-muted-foreground">策略</span> <span className="font-bold">{new Set(tasks.map(t => t.strategy)).size}</span></span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建</Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>任务名称</TableHead><TableHead>类型</TableHead><TableHead>策略</TableHead><TableHead className="text-center">状态</TableHead><TableHead className="text-center">轮次</TableHead><TableHead className="text-center">参与者</TableHead><TableHead>创建时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          : tasks.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无任务</TableCell></TableRow>
          : tasks.map(task => (
            <TableRow key={task.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{task.name}</TableCell>
              <TableCell><Badge variant="outline">{task.type}</Badge></TableCell>
              <TableCell><Badge variant="secondary">{task.strategy}</Badge></TableCell>
              <TableCell className="text-center">{getStatusBadge(task.status)}</TableCell>
              <TableCell className="text-center">{task.round}/{task.totalRounds}</TableCell>
              <TableCell className="text-center">{task.participants?.length || 0}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(task.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openDetail(task)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleExecute(task.id)}><Play className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => { setSelected(task); setPrivacyOpen(true) }}><Settings className="h-4 w-4" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建联邦任务</DialogTitle><DialogDescription>配置联邦学习参数</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">名称</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">类型</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="horizontal">水平</option><option value="vertical">垂直</option><option value="hybrid">混合</option></select></div>
              <div className="space-y-2"><label className="text-sm font-medium">策略</label><select value={formData.strategy} onChange={(e) => setFormData({ ...formData, strategy: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="fedavg">FedAvg</option><option value="fedprox">FedProx</option><option value="scaffold">SCAFFOLD</option></select></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">总轮次</label><Input type="number" min={1} value={formData.totalRounds} onChange={(e) => setFormData({ ...formData, totalRounds: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>任务详情</DialogTitle><DialogDescription>{selected?.name}</DialogDescription></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><span className="text-sm text-muted-foreground">类型：</span><Badge variant="outline">{selected.type}</Badge></div>
              <div><span className="text-sm text-muted-foreground">策略：</span><Badge variant="secondary">{selected.strategy}</Badge></div>
              <div><span className="text-sm text-muted-foreground">轮次：</span><span className="font-bold">{selected.round}/{selected.totalRounds}</span></div>
            </div>
            {selected.participants?.length > 0 && <Table><TableHeader><TableRow><TableHead>节点</TableHead><TableHead>角色</TableHead><TableHead className="text-center">状态</TableHead><TableHead className="text-center">数据点</TableHead><TableHead>版本</TableHead><TableHead>同步时间</TableHead></TableRow></TableHeader><TableBody>{selected.participants.map(p => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell><Badge variant="outline">{p.role}</Badge></TableCell><TableCell className="text-center"><Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status === 'active' ? '在线' : '离线'}</Badge></TableCell><TableCell className="text-center">{p.dataPoints?.toLocaleString()}</TableCell><TableCell className="font-mono text-xs">{p.modelVersion}</TableCell><TableCell className="text-muted-foreground text-sm">{p.lastSync ? new Date(p.lastSync).toLocaleString() : '-'}</TableCell></TableRow>)}</TableBody></Table>}
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>隐私配置</DialogTitle><DialogDescription>差分隐私和安全聚合</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><label className="text-sm font-medium">差分隐私</label><button onClick={() => setPrivacyConfig({ ...privacyConfig, dpEnabled: !privacyConfig.dpEnabled })} className={`relative h-6 w-11 rounded-full transition-colors ${privacyConfig.dpEnabled ? 'bg-primary' : 'bg-muted'}`}><span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${privacyConfig.dpEnabled ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>
            {privacyConfig.dpEnabled && <div className="space-y-2"><label className="text-sm font-medium">Epsilon (ε)</label><Input type="number" step={0.1} min={0.1} value={privacyConfig.dpEpsilon} onChange={(e) => setPrivacyConfig({ ...privacyConfig, dpEpsilon: Number(e.target.value) })} /><p className="text-xs text-muted-foreground">较小的 ε 提供更强的隐私保护</p></div>}
            <div className="flex items-center justify-between"><label className="text-sm font-medium">安全聚合</label><button onClick={() => setPrivacyConfig({ ...privacyConfig, secureAggregation: !privacyConfig.secureAggregation })} className={`relative h-6 w-11 rounded-full transition-colors ${privacyConfig.secureAggregation ? 'bg-primary' : 'bg-muted'}`}><span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${privacyConfig.secureAggregation ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>
          </div>
          <DialogFooter><Button onClick={handleSavePrivacy}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
