import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Gauge, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function RateLimiting() {
  const [configs, setConfigs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', limit: '100', window: '60' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchConfigs()
    fetchStats()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/rate-limiting/configs')
      setConfigs(res.data || [])
    } catch (e) {
      setConfigs([])
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/eval/rate-limiting/stats')
      setStats(res.data)
    } catch (e) {}
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.limit || !formData.window) return
    try {
      await axios.post('/api/eval/rate-limiting/configs', {
        name: formData.name,
        limit: parseInt(formData.limit),
        windowMs: parseInt(formData.window) * 1000,
      })
      toastSuccess('限流配置创建成功')
      setCreateOpen(false)
      setFormData({ name: '', limit: '100', window: '60' })
      fetchConfigs()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/rate-limiting/configs/${id}/delete`)
      toastSuccess('配置已删除')
      fetchConfigs()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2"><Gauge className="h-5 w-5" /> API 限流</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建配置</Button>
      </div>
      {stats && (
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">总请求</span> <span className="font-bold">{stats.totalRequests || 0}</span></span>
          <span><span className="text-muted-foreground">被限流</span> <span className="font-bold">{stats.rateLimited || 0}</span></span>
          <span><span className="text-muted-foreground">限流率</span> <span className="font-bold">{stats.rateLimitRate ? (stats.rateLimitRate * 100).toFixed(1) + '%' : '-'}</span></span>
        </div>
      )}
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>限制</TableHead>
                <TableHead>窗口</TableHead>
                <TableHead>当前使用</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无配置
                  </TableCell>
                </TableRow>
              ) : (
                configs.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="outline">{c.limit}</Badge></TableCell>
                    <TableCell>{(c.windowMs / 1000).toFixed(0)}s</TableCell>
                    <TableCell>{c.currentUsage || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建限流配置</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">请求限制</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">时间窗口 (秒)</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.window}
                  onChange={(e) => setFormData({ ...formData, window: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.limit || !formData.window}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
