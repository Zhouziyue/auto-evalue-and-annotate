import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Eye } from 'lucide-react'
import axios from 'axios'

export default function Benchmark() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [types, setTypes] = useState<any[]>([])
  const [formData, setFormData] = useState({ type: '', modelName: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchResults()
    fetchTypes()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/benchmark/results')
      setResults(res.data || [])
    } catch (e) {
      setResults([])
    }
    setLoading(false)
  }

  const fetchTypes = async () => {
    try {
      const res = await axios.get('/api/eval/benchmark/types')
      setTypes(res.data || [])
    } catch (e) {}
  }

  const handleRun = async () => {
    if (!formData.type) return
    try {
      const res = await axios.post('/api/eval/benchmark/run', {
        type: formData.type,
        modelName: formData.modelName,
      })
      toastSuccess('基准测试完成')
      setResults([res.data, ...results])
      setCreateOpen(false)
      setFormData({ type: '', modelName: '' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '测试失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>基准测试</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行测试
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>得分</TableHead>
                <TableHead>用时</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无测试结果
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result, i) => (
                  <TableRow key={i}>
                    <TableCell><Badge variant="outline">{result.type}</Badge></TableCell>
                    <TableCell>{result.modelName || '-'}</TableCell>
                    <TableCell><Badge>{(result.score * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell>{result.latency || '-'}ms</TableCell>
                    <TableCell>{new Date(result.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedResult(result); setDetailOpen(true) }}>
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
            <DialogTitle>运行基准测试</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">测试类型 *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">选择类型</option>
                {types.map((t: any) => (
                  <option key={t.id || t} value={t.id || t}>{t.name || t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">模型名称</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRun} disabled={!formData.type}>运行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>测试详情</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">类型</label>
                  <p className="mt-1"><Badge>{selectedResult.type}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">得分</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedResult.score * 100).toFixed(1)}%</p>
                </div>
              </div>
              {selectedResult.details && (
                <div>
                  <label className="text-sm font-medium">详细信息</label>
                  <pre className="mt-1 text-xs bg-muted rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedResult.details, null, 2)}
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
