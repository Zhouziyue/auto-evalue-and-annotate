import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, AlertTriangle } from 'lucide-react'
import axios from 'axios'

export default function Regression() {
  const [detections, setDetections] = useState<any[]>([])
  const [baselines, setBaselines] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ metric: '', value: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchDetections()
    fetchBaselines()
  }, [])

  const fetchDetections = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/regression/detections')
      setDetections(res.data || [])
    } catch (e) {
      setDetections([])
    }
    setLoading(false)
  }

  const fetchBaselines = async () => {
    try {
      const res = await axios.get('/api/eval/regression/baselines')
      setBaselines(res.data || [])
    } catch (e) {
      setBaselines([])
    }
  }

  const handleDetect = async () => {
    if (!formData.metric || !formData.value) return
    try {
      const res = await axios.post('/api/eval/regression/detect', {
        metric: formData.metric,
        value: parseFloat(formData.value),
      })
      toastSuccess('回归检测完成')
      setDetections([res.data, ...detections])
      setCreateOpen(false)
      setFormData({ metric: '', value: '' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '检测失败')
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-500/10 text-red-600">严重</Badge>
      case 'medium': return <Badge className="bg-yellow-500/10 text-yellow-600">中等</Badge>
      case 'low': return <Badge className="bg-blue-500/10 text-blue-600">轻微</Badge>
      default: return <Badge variant="outline">{severity}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" /> 回归检测
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行检测
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>指标</TableHead>
                <TableHead>当前值</TableHead>
                <TableHead>基线值</TableHead>
                <TableHead>偏差</TableHead>
                <TableHead>严重程度</TableHead>
                <TableHead>检测时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无检测记录
                  </TableCell>
                </TableRow>
              ) : (
                detections.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{d.metric}</TableCell>
                    <TableCell>{d.value?.toFixed(4)}</TableCell>
                    <TableCell>{d.baseline?.toFixed(4)}</TableCell>
                    <TableCell>
                      <Badge variant={d.deviation > 0 ? 'destructive' : 'outline'}>
                        {d.deviation > 0 ? '+' : ''}{(d.deviation * 100).toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{getSeverityBadge(d.severity)}</TableCell>
                    <TableCell>{new Date(d.detectedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>基线配置</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>指标</TableHead>
                <TableHead>基线值</TableHead>
                <TableHead>阈值</TableHead>
                <TableHead>类型</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baselines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    暂无基线配置
                  </TableCell>
                </TableRow>
              ) : (
                baselines.map((b, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{b.metric}</TableCell>
                    <TableCell>{b.value?.toFixed(4)}</TableCell>
                    <TableCell>{(b.threshold * 100).toFixed(1)}%</TableCell>
                    <TableCell><Badge variant="outline">{b.type}</Badge></TableCell>
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
            <DialogTitle>运行回归检测</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">指标名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                placeholder="例如：accuracy"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">当前值 *</label>
              <input
                type="number"
                step="0.0001"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.85"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleDetect} disabled={!formData.metric || !formData.value}>检测</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
