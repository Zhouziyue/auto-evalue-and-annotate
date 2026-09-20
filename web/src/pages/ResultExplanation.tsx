import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { HelpCircle, BarChart3, TrendingUp, CheckCircle, Eye, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import axios from 'axios'

interface Explanation {
  id: string
  evalRunId: string
  modelName: string
  score: number
  topFactors: string[]
  confidence: number
  method: string
  generatedAt: string
}

export default function ResultExplanation() {
  const [explanations, setExplanations] = useState<Explanation[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [formData, setFormData] = useState({ evalRunId: '', modelName: '', method: 'shap' })
  const [generateLoading, setGenerateLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Explanation | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareResult, setCompareResult] = useState<any>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchExplanations()
  }, [])

  const fetchExplanations = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/result-explanation/explanations')
      setExplanations(res.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!formData.evalRunId) return
    setGenerateLoading(true)
    try {
      const res = await axios.post('/api/eval/result-explanation/explain', {
        evalRunId: formData.evalRunId,
        modelName: formData.modelName,
        method: formData.method,
      })
      toastSuccess('解释已生成')
      setGenerateOpen(false)
      setFormData({ evalRunId: '', modelName: '', method: 'shap' })
      fetchExplanations()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '生成失败')
    }
    setGenerateLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/result-explanation/explanations/${id}/delete`)
      toastSuccess('已删除')
      fetchExplanations()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleCompare = async () => {
    if (compareIds.length < 2) return
    try {
      const res = await axios.post('/api/eval/result-explanation/compare', { explanationIds: compareIds })
      setCompareResult(res.data)
    } catch (e) {
      toastError('对比失败')
    }
  }

  const filteredExplanations = explanations.filter(e =>
    !searchQuery || e.modelName?.toLowerCase().includes(searchQuery.toLowerCase()) || e.evalRunId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const avgConfidence = explanations.length > 0
    ? explanations.reduce((a, e) => a + e.confidence, 0) / explanations.length
    : 0
  const avgScore = explanations.length > 0
    ? explanations.reduce((a, e) => a + e.score, 0) / explanations.length
    : 0

  return (
    <div className="space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">解释记录</span>
            </div>
            <p className="text-2xl font-bold mt-2">{explanations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">模型数</span>
            </div>
            <p className="text-2xl font-bold mt-2">{new Set(explanations.map(e => e.modelName)).size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">平均置信度</span>
            </div>
            <p className="text-2xl font-bold mt-2">{(avgConfidence * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">平均得分</span>
            </div>
            <p className="text-2xl font-bold mt-2">{(avgScore * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索模型或评测..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCompareOpen(true)} disabled={explanations.length < 2}>
                <BarChart3 className="mr-2 h-4 w-4" /> 对比
              </Button>
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" /> 生成解释
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 解释列表 */}
      <Card>
        <CardHeader>
          <CardTitle>结果解释</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>评测执行</TableHead>
                <TableHead>模型</TableHead>
                <TableHead className="text-center">得分</TableHead>
                <TableHead>关键因素</TableHead>
                <TableHead>方法</TableHead>
                <TableHead className="text-center">置信度</TableHead>
                <TableHead>生成时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filteredExplanations.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无解释记录</TableCell></TableRow>
              ) : filteredExplanations.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{item.evalRunId?.slice(0, 16)}...</TableCell>
                  <TableCell className="font-medium">{item.modelName}</TableCell>
                  <TableCell className="text-center font-bold">{(item.score * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.topFactors?.slice(0, 3).map((f, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{item.method}</Badge></TableCell>
                  <TableCell className="text-center font-bold">{(item.confidence * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(item.generatedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 生成解释 Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>生成结果解释</DialogTitle>
            <DialogDescription>为评测结果生成可解释性分析</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">评测运行 ID</label>
              <Input value={formData.evalRunId} onChange={(e) => setFormData({ ...formData, evalRunId: e.target.value })} placeholder="输入评测运行ID" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">模型名称</label>
              <Input value={formData.modelName} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} placeholder="如 GPT-4o" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">解释方法</label>
              <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
                <option value="shap">SHAP</option>
                <option value="lime">LIME</option>
                <option value="integrated-gradients">Integrated Gradients</option>
                <option value="feature-importance">Feature Importance</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGenerate} disabled={generateLoading}>
              {generateLoading ? '生成中...' : '生成解释'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>解释详情</DialogTitle>
            <DialogDescription>{selected?.modelName} - {selected?.evalRunId}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><span className="text-sm text-muted-foreground">得分：</span><span className="font-bold">{(selected.score * 100).toFixed(1)}%</span></div>
                <div><span className="text-sm text-muted-foreground">置信度：</span><span className="font-bold">{(selected.confidence * 100).toFixed(1)}%</span></div>
                <div><span className="text-sm text-muted-foreground">方法：</span><Badge variant="secondary">{selected.method}</Badge></div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">关键因素</h4>
                <div className="space-y-2">
                  {selected.topFactors?.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${((selected.topFactors.length - idx) / selected.topFactors.length) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium w-32">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 对比 Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>对比解释</DialogTitle>
            <DialogDescription>选择多个解释进行对比分析</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-auto">
              {explanations.map(exp => (
                <label key={exp.id} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(exp.id)}
                    onChange={(e) => {
                      if (e.target.checked) setCompareIds([...compareIds, exp.id])
                      else setCompareIds(compareIds.filter(id => id !== exp.id))
                    }}
                  />
                  <span className="text-sm font-medium">{exp.modelName}</span>
                  <span className="text-xs text-muted-foreground">{exp.evalRunId?.slice(0, 12)}...</span>
                  <Badge variant="outline" className="ml-auto">{(exp.score * 100).toFixed(1)}%</Badge>
                </label>
              ))}
            </div>
            <Button onClick={handleCompare} disabled={compareIds.length < 2} className="w-full">对比</Button>
            {compareResult && (
              <div className="rounded border p-4">
                <h4 className="text-sm font-medium mb-2">对比结果</h4>
                <pre className="text-xs font-mono overflow-auto max-h-60">{JSON.stringify(compareResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
