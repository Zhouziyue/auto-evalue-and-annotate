import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Trash2, Camera } from 'lucide-react'
import axios from 'axios'

export default function Snapshots() {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', evalRunId: '', modelName: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchSnapshots() }, [])

  const fetchSnapshots = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/snapshots')
      setSnapshots(res.data || [])
    } catch (e) {
      setSnapshots([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.evalRunId || !formData.modelName) return
    try {
      await axios.post('/api/eval/snapshots', {
        name: formData.name,
        evalRunId: formData.evalRunId,
        modelName: formData.modelName,
        metrics: {},
        summary: {},
      })
      toastSuccess('快照创建成功')
      setCreateOpen(false)
      setFormData({ name: '', evalRunId: '', modelName: '' })
      fetchSnapshots()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/snapshots/${id}/delete`)
      toastSuccess('快照已删除')
      fetchSnapshots()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> 评测快照
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 创建快照
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无快照
                  </TableCell>
                </TableRow>
              ) : (
                snapshots.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.modelName}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {s.tags?.slice(0, 2).map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedSnapshot(s); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
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
            <DialogTitle>创建快照</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="快照名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">评测运行 ID *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.evalRunId}
                onChange={(e) => setFormData({ ...formData, evalRunId: e.target.value })}
                placeholder="评测运行ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">模型名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                placeholder="模型名称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.evalRunId || !formData.modelName}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>快照详情</DialogTitle>
          </DialogHeader>
          {selectedSnapshot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedSnapshot.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">模型</label>
                  <p className="mt-1 text-sm">{selectedSnapshot.modelName}</p>
                </div>
              </div>
              {selectedSnapshot.metrics && Object.keys(selectedSnapshot.metrics).length > 0 && (
                <div>
                  <label className="text-sm font-medium">指标</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(selectedSnapshot.metrics).map(([k, v]) => (
                      <div key={k} className="flex justify-between rounded-md border p-2">
                        <span className="text-sm">{k}</span>
                        <Badge>{((v as number) * 100).toFixed(1)}%</Badge>
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
