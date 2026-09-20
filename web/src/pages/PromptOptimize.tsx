import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Zap, TrendingUp, ArrowUp, Plus, Eye, Sparkles, Search } from 'lucide-react'
import axios from 'axios'

interface OptimizeRecord {
  id: string
  promptName: string
  version: string
  score: number
  tokens: number
  improvement: number
  strategy: string
  optimizedAt: string
}

export default function PromptOptimize() {
  const [records, setRecords] = useState<OptimizeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [strategies, setStrategies] = useState<any[]>([])
  const [optimizeOpen, setOptimizeOpen] = useState(false)
  const [formData, setFormData] = useState({ prompt: '', strategy: '', targetMetric: 'accuracy' })
  const [optimizeLoading, setOptimizeLoading] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<OptimizeRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchRecords()
    fetchStrategies()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/prompt-optimize/strategies')
      setRecords(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchStrategies = async () => {
    try {
      const res = await axios.get('/api/eval/prompt-optimize/strategies')
      setStrategies(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleOptimize = async () => {
    if (!formData.prompt) return
    setOptimizeLoading(true)
    try {
      const res = await axios.post('/api/eval/prompt-optimize', {
        prompt: formData.prompt,
        strategy: formData.strategy || undefined,
        targetMetric: formData.targetMetric,
      })
      setOptimizeResult(res.data)
      toastSuccess('Prompt 优化完成')
      fetchRecords()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '优化失败')
    }
    setOptimizeLoading(false)
  }

  const filteredRecords = records.filter(r =>
    !searchQuery || r.promptName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const avgScore = records.length > 0 ? records.reduce((a, r) => a + r.score, 0) / records.length : 0
  const avgImprovement = records.length > 0 ? records.reduce((a, r) => a + r.improvement, 0) / records.length : 0
  const totalTokenSaved = records.reduce((a, r) => a + r.tokens, 0)

  return (
    <div className="space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">优化记录</span>
            </div>
            <p className="text-2xl font-bold mt-2">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">平均得分</span>
            </div>
            <p className="text-2xl font-bold mt-2">{(avgScore * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">平均提升</span>
            </div>
            <p className="text-2xl font-bold mt-2">+{(avgImprovement * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">总Token节省</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalTokenSaved.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索Prompt..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => setOptimizeOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> 优化 Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 优化历史 */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt 优化历史</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>策略</TableHead>
                <TableHead className="text-center">得分</TableHead>
                <TableHead className="text-center">Tokens</TableHead>
                <TableHead className="text-center">提升</TableHead>
                <TableHead>优化时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无优化记录</TableCell></TableRow>
              ) : filteredRecords.map(record => (
                <TableRow key={record.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{record.promptName}</TableCell>
                  <TableCell><Badge variant="outline">{record.version}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{record.strategy || '-'}</Badge></TableCell>
                  <TableCell className="text-center font-bold">{(record.score * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-center">{record.tokens}</TableCell>
                  <TableCell className="text-center text-green-600 font-bold">+{(record.improvement * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(record.optimizedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(record); setDetailOpen(true) }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 优化 Dialog */}
      <Dialog open={optimizeOpen} onOpenChange={setOptimizeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>优化 Prompt</DialogTitle>
            <DialogDescription>输入需要优化的 Prompt，系统将自动寻找最优版本</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt 内容</label>
              <textarea
                className="w-full h-32 rounded border p-3 text-sm font-mono resize-none"
                placeholder="输入需要优化的 Prompt..."
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">优化策略</label>
                <select value={formData.strategy} onChange={(e) => setFormData({ ...formData, strategy: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
                  <option value="">自动选择</option>
                  <option value="dsp">DSP 优化</option>
                  <option value="opopro">OPRO 优化</option>
                  <option value="textgrad">TextGrad</option>
                  <option value="compression">Prompt 压缩</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">目标指标</label>
                <select value={formData.targetMetric} onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
                  <option value="accuracy">准确率</option>
                  <option value="f1">F1 Score</option>
                  <option value="bleu">BLEU</option>
                  <option value="rouge">ROUGE</option>
                </select>
              </div>
            </div>
            <Button onClick={handleOptimize} disabled={optimizeLoading} className="w-full">
              {optimizeLoading ? '优化中...' : '开始优化'}
            </Button>
            {optimizeResult && (
              <div className="rounded border p-4 space-y-3">
                <h4 className="text-sm font-medium">优化结果</h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">优化后 Prompt：</p>
                  <div className="rounded bg-muted p-3 text-sm font-mono">{optimizeResult.optimizedPrompt}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><span className="text-xs text-muted-foreground">得分：</span><span className="font-bold text-green-600">{(optimizeResult.score * 100).toFixed(1)}%</span></div>
                  <div><span className="text-xs text-muted-foreground">Tokens：</span><span className="font-bold">{optimizeResult.tokens}</span></div>
                  <div><span className="text-xs text-muted-foreground">提升：</span><span className="font-bold text-green-600">+{(optimizeResult.improvement * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>优化详情</DialogTitle>
            <DialogDescription>{selected?.promptName} - {selected?.version}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">策略：</span><Badge variant="secondary">{selected.strategy}</Badge></div>
                <div><span className="text-sm text-muted-foreground">得分：</span><span className="font-bold">{(selected.score * 100).toFixed(1)}%</span></div>
                <div><span className="text-sm text-muted-foreground">Tokens：</span><span className="font-bold">{selected.tokens}</span></div>
                <div><span className="text-sm text-muted-foreground">提升：</span><span className="font-bold text-green-600">+{(selected.improvement * 100).toFixed(1)}%</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
