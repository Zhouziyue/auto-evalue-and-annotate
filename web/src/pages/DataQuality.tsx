import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Trash2, CheckCircle } from 'lucide-react'
import axios from 'axios'

export default function DataQuality() {
  const [results, setResults] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [formData, setFormData] = useState({ datasetId: '', datasetName: '', data: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchResults()
    fetchRules()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/data-quality/results')
      setResults(res.data || [])
    } catch (e) {
      setResults([])
    }
    setLoading(false)
  }

  const fetchRules = async () => {
    try {
      const res = await axios.get('/api/eval/data-quality/rules')
      setRules(res.data || [])
    } catch (e) {}
  }

  const handleCheck = async () => {
    if (!formData.datasetId || !formData.data) return
    try {
      let data = []
      try {
        data = JSON.parse(formData.data)
      } catch {
        toastError('数据格式错误')
        return
      }
      const res = await axios.post('/api/eval/data-quality/check', {
        datasetId: formData.datasetId,
        datasetName: formData.datasetName,
        data,
      })
      toastSuccess('质量检查完成')
      setResults([res.data, ...results])
      setCreateOpen(false)
      setFormData({ datasetId: '', datasetName: '', data: '' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '检查失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/data-quality/results/${id}/delete`)
      toastSuccess('记录已删除')
      fetchResults()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-500/10'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-500/10'
    return 'text-red-600 bg-red-500/10'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> 数据质量评估
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行检查
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据集</TableHead>
                <TableHead>质量分</TableHead>
                <TableHead>完整性</TableHead>
                <TableHead>一致性</TableHead>
                <TableHead>问题数</TableHead>
                <TableHead>检查时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    暂无检查记录
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.datasetName || r.datasetId?.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge className={getScoreColor(r.overallScore || 0)}>
                        {((r.overallScore || 0) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{((r.completeness || 0) * 100).toFixed(1)}%</TableCell>
                    <TableCell>{((r.consistency || 0) * 100).toFixed(1)}%</TableCell>
                    <TableCell><Badge variant="destructive">{r.issues?.length || 0}</Badge></TableCell>
                    <TableCell>{new Date(r.checkedAt || r.createdAt).toLocaleString()}</TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>运行数据质量检查</DialogTitle>
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
              <label className="text-sm font-medium">数据集名称</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.datasetName}
                onChange={(e) => setFormData({ ...formData, datasetName: e.target.value })}
                placeholder="可选"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数据 (JSON) *</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                placeholder='[{"field1": "value1"}, {"field1": "value2"}]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCheck} disabled={!formData.datasetId || !formData.data}>检查</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>质量检查详情</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">数据集</label>
                  <p className="mt-1 text-sm">{selectedResult.datasetName || selectedResult.datasetId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">质量分</label>
                  <p className="mt-1 text-2xl font-bold">{((selectedResult.overallScore || 0) * 100).toFixed(1)}%</p>
                </div>
              </div>
              {selectedResult.issues && selectedResult.issues.length > 0 && (
                <div>
                  <label className="text-sm font-medium">问题列表</label>
                  <div className="mt-2 space-y-2">
                    {selectedResult.issues.map((issue: any, i: number) => (
                      <div key={i} className="rounded-md border p-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{issue.type}</Badge>
                          <Badge variant={issue.severity === 'high' ? 'destructive' : 'outline'}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
