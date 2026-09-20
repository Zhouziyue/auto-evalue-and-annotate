import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, BarChart3, Eye, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function MetricAttribution() {
  const [results, setResults] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [formData, setFormData] = useState({ targetId: '', metric: '', value: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchResults()
    fetchTypes()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/metric-attribution/results')
      setResults(res.data || [])
    } catch (e) {
      setResults([])
    }
    setLoading(false)
  }

  const fetchTypes = async () => {
    try {
      const res = await axios.get('/api/eval/metric-attribution/types')
      setTypes(res.data || [])
    } catch (e) {}
  }

  const handleAnalyze = async () => {
    if (!formData.targetId || !formData.metric || !formData.value) return
    try {
      const res = await axios.post('/api/eval/metric-attribution/analyze', {
        targetId: formData.targetId,
        metric: formData.metric,
        value: parseFloat(formData.value),
      })
      toastSuccess('归因分析完成')
      setResults([res.data, ...results])
      setCreateOpen(false)
      setFormData({ targetId: '', metric: '', value: '' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '分析失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/metric-attribution/results/${id}/delete`)
      toastSuccess('结果已删除')
      fetchResults()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> 指标归因分析
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行分析
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>目标</TableHead>
                <TableHead>指标</TableHead>
                <TableHead>值</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>分析时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无分析结果
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.targetId?.slice(0, 8)}</TableCell>
                    <TableCell>{r.metric}</TableCell>
                    <TableCell>{r.value}</TableCell>
                    <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                    <TableCell>{new Date(r.analyzedAt || r.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedResult(r); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
            <DialogTitle>运行归因分析</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">目标 ID *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                placeholder="目标ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">指标 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                placeholder="指标名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">值 *</label>
              <input
                type="number"
                step="0.01"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="指标值"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleAnalyze} disabled={!formData.targetId || !formData.metric || !formData.value}>分析</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>归因详情</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">目标</label>
                  <p className="mt-1 text-sm font-mono">{selectedResult.targetId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">指标</label>
                  <p className="mt-1 text-sm">{selectedResult.metric}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">值</label>
                  <p className="mt-1 text-sm">{selectedResult.value}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">类型</label>
                  <p className="mt-1"><Badge>{selectedResult.type}</Badge></p>
                </div>
              </div>
              {selectedResult.attributions && (
                <div>
                  <label className="text-sm font-medium">归因结果</label>
                  <pre className="mt-2 text-xs bg-muted rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedResult.attributions, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
