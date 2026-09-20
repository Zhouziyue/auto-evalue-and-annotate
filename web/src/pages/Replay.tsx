import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Eye, Trash2, Repeat } from 'lucide-react'
import axios from 'axios'

export default function Replay() {
  const [replays, setReplays] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedReplay, setSelectedReplay] = useState<any>(null)
  const [formData, setFormData] = useState({ sourceEvalRunId: '', name: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchReplays() }, [])

  const fetchReplays = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/replay')
      setReplays(res.data || [])
    } catch (e) {
      setReplays([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.sourceEvalRunId) return
    try {
      await axios.post('/api/eval/replay', {
        sourceEvalRunId: formData.sourceEvalRunId,
        name: formData.name,
      })
      toastSuccess('回放创建成功')
      setCreateOpen(false)
      setFormData({ sourceEvalRunId: '', name: '' })
      fetchReplays()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleExecute = async (id: string) => {
    try {
      await axios.post(`/api/eval/replay/${id}/execute`)
      toastSuccess('回放已启动')
      fetchReplays()
    } catch (e) {
      toastError('执行失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/replay/${id}/delete`)
      toastSuccess('回放已删除')
      fetchReplays()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" /> 评测回放
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建回放
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>源评测</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无回放
                  </TableCell>
                </TableRow>
              ) : (
                replays.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{r.sourceEvalRunId?.slice(0, 8)}</TableCell>
                    <TableCell><Badge>{r.status || 'pending'}</Badge></TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleExecute(r.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedReplay(r); setDetailOpen(true) }}>
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
            <DialogTitle>新建评测回放</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="可选"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">源评测运行 ID *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.sourceEvalRunId}
                onChange={(e) => setFormData({ ...formData, sourceEvalRunId: e.target.value })}
                placeholder="评测运行ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.sourceEvalRunId}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>回放详情</DialogTitle>
          </DialogHeader>
          {selectedReplay && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedReplay.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1"><Badge>{selectedReplay.status}</Badge></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
