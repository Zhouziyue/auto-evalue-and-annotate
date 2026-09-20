import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye } from 'lucide-react'
import axios from 'axios'

export default function DataSampling() {
  const [results, setResults] = useState<any[]>([])
  const [strategies, setStrategies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [formData, setFormData] = useState({ datasetId: '', strategy: 'random', count: '10' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchResults()
    fetchStrategies()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/sampling/results')
      setResults(res.data || [])
    } catch (e) {
      setResults([])
    }
    setLoading(false)
  }

  const fetchStrategies = async () => {
    try {
      const res = await axios.get('/api/eval/sampling/strategies')
      setStrategies(res.data || [])
    } catch (e) {}
  }

  const handleSample = async () => {
    if (!formData.datasetId) return
    try {
      const res = await axios.post('/api/eval/sampling/sample', {
        datasetId: formData.datasetId,
        strategy: formData.strategy,
        count: parseInt(formData.count),
      })
      toastSuccess('采样完成')
      setResults([res.data, ...results])
      setCreateOpen(false)
      setFormData({ datasetId: '', strategy: 'random', count: '10' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '采样失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>数据采样</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行采样
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据集</TableHead>
                <TableHead>策略</TableHead>
                <TableHead>采样数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无采样记录
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.datasetId?.slice(0, 8) || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{r.strategy}</Badge></TableCell>
                    <TableCell>{r.samples?.length || r.count || 0}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedResult(r); setDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>运行数据采样</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">数据集 ID *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.datasetId}
                onChange={(e) => setFormData({ ...formData, datasetId: e.target.value })}
                placeholder="数据集ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">采样策略</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              >
                <option value="random">随机采样</option>
                <option value="stratified">分层采样</option>
                <option value="systematic">系统采样</option>
                {strategies.map((s: any) => (
                  <option key={s.id || s} value={s.id || s}>{s.name || s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">采样数量</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleSample} disabled={!formData.datasetId}>采样</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>采样详情</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">策略</label>
                  <p className="mt-1"><Badge>{selectedResult.strategy}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">采样数</label>
                  <p className="mt-1 text-sm">{selectedResult.samples?.length || selectedResult.count || 0}</p>
                </div>
              </div>
              {selectedResult.samples && (
                <div>
                  <label className="text-sm font-medium">采样结果</label>
                  <pre className="mt-2 text-xs bg-muted rounded p-3 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedResult.samples, null, 2)}
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
