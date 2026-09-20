import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { ArrowLeftRight, BarChart3, Trophy, Target, Plus, Eye, Trash2, FileText } from 'lucide-react'
import axios from 'axios'

interface Comparison {
  id: string
  modelA: string
  modelB: string
  metrics: { metric: string; scoreA: number; scoreB: number }[]
  status: string
  createdAt: string
}

export default function ModelComparison() {
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ modelA: '', modelB: '', metrics: '' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Comparison | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchComparisons()
  }, [])

  const fetchComparisons = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/comparison')
      setComparisons(res.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.modelA || !formData.modelB) return
    try {
      const metrics = formData.metrics.split(',').map(m => m.trim()).filter(Boolean)
      await axios.post('/api/eval/comparison', {
        modelA: formData.modelA,
        modelB: formData.modelB,
        metrics,
      })
      toastSuccess('对比任务已创建')
      setCreateOpen(false)
      setFormData({ modelA: '', modelB: '', metrics: '' })
      fetchComparisons()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleExecute = async (id: string) => {
    setExecuting(id)
    try {
      await axios.post(`/api/eval/comparison/${id}/execute`)
      toastSuccess('对比任务已执行')
      fetchComparisons()
    } catch (e: any) {
      toastError('执行失败')
    }
    setExecuting(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/comparison/${id}/delete`)
      toastSuccess('已删除')
      fetchComparisons()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleViewReport = async (id: string) => {
    try {
      const res = await axios.get(`/api/eval/comparison/${id}/report`)
      setSelected({ ...comparisons.find(c => c.id === id)!, ...res.data })
      setDetailOpen(true)
    } catch (e) {
      toastError('获取报告失败')
    }
  }

  const openDetail = (item: Comparison) => {
    setSelected(item)
    setDetailOpen(true)
  }

  const allModels = [...new Set([...comparisons.map(c => c.modelA), ...comparisons.map(c => c.modelB)])]

  return (
    <div className="space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">对比组</span>
            </div>
            <p className="text-2xl font-bold mt-2">{comparisons.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">参评模型</span>
            </div>
            <p className="text-2xl font-bold mt-2">{allModels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">已完成</span>
            </div>
            <p className="text-2xl font-bold mt-2">{comparisons.filter(c => c.status === 'completed').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">胜率最高</span>
            </div>
            <p className="text-2xl font-bold mt-2 truncate">{allModels[0] || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> 新建对比
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 对比列表 */}
      <Card>
        <CardHeader>
          <CardTitle>模型对比任务</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型A</TableHead>
                <TableHead>模型B</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="text-center">指标数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : comparisons.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无对比任务</TableCell></TableRow>
              ) : comparisons.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{item.modelA}</TableCell>
                  <TableCell className="font-medium">{item.modelB}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.status === 'completed' ? 'default' : item.status === 'running' ? 'secondary' : 'outline'}>
                      {item.status === 'completed' ? '已完成' : item.status === 'running' ? '执行中' : '待执行'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{item.metrics?.length || 0}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status !== 'completed' && (
                        <Button variant="ghost" size="sm" onClick={() => handleExecute(item.id)} disabled={executing === item.id}>
                          {executing === item.id ? '执行中...' : '执行'}
                        </Button>
                      )}
                      {item.status === 'completed' && (
                        <Button variant="ghost" size="sm" onClick={() => handleViewReport(item.id)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
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

      {/* 新建对比 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建模型对比</DialogTitle>
            <DialogDescription>选择两个模型进行对比评测</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">模型 A</label>
                <Input value={formData.modelA} onChange={(e) => setFormData({ ...formData, modelA: e.target.value })} placeholder="如 GPT-4o" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">模型 B</label>
                <Input value={formData.modelB} onChange={(e) => setFormData({ ...formData, modelB: e.target.value })} placeholder="如 Claude-3.5" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">评测指标（逗号分隔）</label>
              <Input value={formData.metrics} onChange={(e) => setFormData({ ...formData, metrics: e.target.value })} placeholder="如 accuracy,safety,speed" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>模型对比详情</DialogTitle>
            <DialogDescription>{selected?.modelA} vs {selected?.modelB}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.metrics && selected.metrics.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指标</TableHead>
                      <TableHead className="text-center">{selected.modelA}</TableHead>
                      <TableHead className="text-center">{selected.modelB}</TableHead>
                      <TableHead className="text-center">胜出</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.metrics.map((m: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{m.metric}</TableCell>
                        <TableCell className="text-center font-bold">{(m.scoreA * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-center font-bold">{(m.scoreB * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={m.scoreA > m.scoreB ? 'default' : m.scoreB > m.scoreA ? 'secondary' : 'outline'}>
                            {m.scoreA > m.scoreB ? selected.modelA : m.scoreB > m.scoreA ? selected.modelB : '平局'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">暂无对比结果，请先执行对比任务</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
