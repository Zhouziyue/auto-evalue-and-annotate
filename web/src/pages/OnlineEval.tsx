import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Trash2, Radio } from 'lucide-react'
import axios from 'axios'

export default function OnlineEval() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', model: '', threshold: '0.8' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchConfigs() }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/online/configs')
      setConfigs(res.data || [])
    } catch (e) {
      setConfigs([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.model) return
    try {
      await axios.post('/api/eval/online/configs', {
        name: formData.name,
        model: formData.model,
        threshold: parseFloat(formData.threshold),
      })
      toastSuccess('配置创建成功')
      setCreateOpen(false)
      setFormData({ name: '', model: '', threshold: '0.8' })
      fetchConfigs()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/online/configs/${id}/delete`)
      toastSuccess('配置已删除')
      fetchConfigs()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" /> 在线评测
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建配置
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>阈值</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无配置
                  </TableCell>
                </TableRow>
              ) : (
                configs.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.model}</TableCell>
                    <TableCell><Badge variant="outline">{(c.threshold * 100).toFixed(0)}%</Badge></TableCell>
                    <TableCell><Badge>{c.status || 'active'}</Badge></TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedConfig(c); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
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
            <DialogTitle>新建在线评测配置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="配置名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">模型 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="模型名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">阈值</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.model}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>配置详情</DialogTitle>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedConfig.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">模型</label>
                  <p className="mt-1 text-sm">{selectedConfig.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">阈值</label>
                  <p className="mt-1 text-sm">{(selectedConfig.threshold * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1"><Badge>{selectedConfig.status}</Badge></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
