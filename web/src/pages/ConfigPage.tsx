import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Settings, Trash2, RotateCcw } from 'lucide-react'
import axios from 'axios'

export default function ConfigPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ key: '', value: '', type: 'string', scope: 'global' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchConfigs() }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/config')
      setConfigs(res.data || [])
    } catch (e) {
      setConfigs([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.key || !formData.value) return
    try {
      await axios.post('/api/eval/config', {
        key: formData.key,
        value: formData.value,
        type: formData.type,
        scope: formData.scope,
      })
      toastSuccess('配置创建成功')
      setCreateOpen(false)
      setFormData({ key: '', value: '', type: 'string', scope: 'global' })
      fetchConfigs()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/config/${id}/delete`)
      toastSuccess('配置已删除')
      fetchConfigs()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleRollback = async (id: string) => {
    try {
      await axios.post(`/api/eval/config/${id}/rollback`, { userId: 'current' })
      toastSuccess('配置已回滚')
      fetchConfigs()
    } catch (e) {
      toastError('回滚失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> 配置管理
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建配置
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>作用域</TableHead>
                <TableHead>更新时间</TableHead>
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
                    <TableCell className="font-mono text-sm font-medium">{c.key}</TableCell>
                    <TableCell className="max-w-xs truncate">{c.value}</TableCell>
                    <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{c.scope}</Badge></TableCell>
                    <TableCell>{new Date(c.updatedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleRollback(c.id)}>
                          <RotateCcw className="h-4 w-4" />
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
            <DialogTitle>新建配置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="config.key"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="配置值"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">类型</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="string">字符串</option>
                  <option value="number">数字</option>
                  <option value="boolean">布尔</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">作用域</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                >
                  <option value="global">全局</option>
                  <option value="user">用户</option>
                  <option value="project">项目</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.key || !formData.value}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
