import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Eye, Search, Sparkles } from 'lucide-react'
import axios from 'axios'

interface OptimizeRecord { id: string; promptName: string; version: string; score: number; tokens: number; improvement: number; strategy: string; optimizedAt: string }

export default function PromptOptimize() {
  const [records, setRecords] = useState<OptimizeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [optimizeOpen, setOptimizeOpen] = useState(false)
  const [formData, setFormData] = useState({ prompt: '', strategy: '', targetMetric: 'accuracy' })
  const [optimizeLoading, setOptimizeLoading] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<OptimizeRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchRecords() }, [])
  const fetchRecords = async () => { setLoading(true); try { const res = await axios.get('/api/eval/prompt-optimize/strategies'); setRecords(Array.isArray(res.data) ? res.data : []) } catch (e) { console.error(e) }; setLoading(false) }

  const handleOptimize = async () => {
    if (!formData.prompt) return
    setOptimizeLoading(true)
    try { const res = await axios.post('/api/eval/prompt-optimize', { prompt: formData.prompt, strategy: formData.strategy || undefined, targetMetric: formData.targetMetric }); setOptimizeResult(res.data); toastSuccess('优化完成'); fetchRecords() }
    catch (e: any) { toastError(e?.response?.data?.message || '优化失败') }
    setOptimizeLoading(false)
  }

  const filtered = records.filter(r => !searchQuery || r.promptName?.toLowerCase().includes(searchQuery.toLowerCase()))
  const avgScore = records.length > 0 ? records.reduce((a, r) => a + r.score, 0) / records.length : 0
  const avgImp = records.length > 0 ? records.reduce((a, r) => a + r.improvement, 0) / records.length : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">记录</span> <span className="font-bold">{records.length}</span></span>
          <span><span className="text-muted-foreground">平均得分</span> <span className="font-bold">{(avgScore * 100).toFixed(1)}%</span></span>
          <span><span className="text-muted-foreground">平均提升</span> <span className="font-bold text-green-600">+{(avgImp * 100).toFixed(1)}%</span></span>
          <span><span className="text-muted-foreground">Token节省</span> <span className="font-bold">{records.reduce((a, r) => a + r.tokens, 0).toLocaleString()}</span></span>
        </div>
        <Button size="sm" onClick={() => setOptimizeOpen(true)}><Sparkles className="mr-2 h-3.5 w-3.5" />优化</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Prompt</TableHead><TableHead>版本</TableHead><TableHead>策略</TableHead><TableHead className="text-center">得分</TableHead><TableHead className="text-center">Tokens</TableHead><TableHead className="text-center">提升</TableHead><TableHead>时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无记录</TableCell></TableRow>
          : filtered.map(r => (
            <TableRow key={r.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{r.promptName}</TableCell>
              <TableCell><Badge variant="outline">{r.version}</Badge></TableCell>
              <TableCell><Badge variant="secondary">{r.strategy || '-'}</Badge></TableCell>
              <TableCell className="text-center font-bold">{(r.score * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-center">{r.tokens}</TableCell>
              <TableCell className="text-center text-green-600 font-bold">+{(r.improvement * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(r.optimizedAt).toLocaleString()}</TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => { setSelected(r); setDetailOpen(true) }}><Eye className="h-4 w-4" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={optimizeOpen} onOpenChange={setOptimizeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>优化 Prompt</DialogTitle><DialogDescription>输入需要优化的 Prompt</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">Prompt</label><textarea className="w-full h-32 rounded border p-3 text-sm font-mono resize-none" value={formData.prompt} onChange={(e) => setFormData({ ...formData, prompt: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">策略</label><select value={formData.strategy} onChange={(e) => setFormData({ ...formData, strategy: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="">自动</option><option value="dsp">DSP</option><option value="opopro">OPRO</option><option value="textgrad">TextGrad</option><option value="compression">压缩</option></select></div>
              <div className="space-y-2"><label className="text-sm font-medium">目标指标</label><select value={formData.targetMetric} onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm"><option value="accuracy">准确率</option><option value="f1">F1</option><option value="bleu">BLEU</option><option value="rouge">ROUGE</option></select></div>
            </div>
            <Button onClick={handleOptimize} disabled={optimizeLoading} className="w-full">{optimizeLoading ? '优化中...' : '开始优化'}</Button>
            {optimizeResult && <div className="rounded border p-4 space-y-3"><p className="text-sm font-medium">优化结果</p><div className="rounded bg-muted p-3 text-sm font-mono">{optimizeResult.optimizedPrompt}</div><div className="grid grid-cols-3 gap-4"><div><span className="text-xs text-muted-foreground">得分：</span><span className="font-bold text-green-600">{(optimizeResult.score * 100).toFixed(1)}%</span></div><div><span className="text-xs text-muted-foreground">Tokens：</span><span className="font-bold">{optimizeResult.tokens}</span></div><div><span className="text-xs text-muted-foreground">提升：</span><span className="font-bold text-green-600">+{(optimizeResult.improvement * 100).toFixed(1)}%</span></div></div></div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>详情</DialogTitle><DialogDescription>{selected?.promptName} - {selected?.version}</DialogDescription></DialogHeader>
          {selected && <div className="grid grid-cols-2 gap-4"><div><span className="text-sm text-muted-foreground">策略：</span><Badge variant="secondary">{selected.strategy}</Badge></div><div><span className="text-sm text-muted-foreground">得分：</span><span className="font-bold">{(selected.score * 100).toFixed(1)}%</span></div><div><span className="text-sm text-muted-foreground">Tokens：</span><span className="font-bold">{selected.tokens}</span></div><div><span className="text-sm text-muted-foreground">提升：</span><span className="font-bold text-green-600">+{(selected.improvement * 100).toFixed(1)}%</span></div></div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
