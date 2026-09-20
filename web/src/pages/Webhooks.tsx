import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Trash2, Webhook } from 'lucide-react'
import axios from 'axios'

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', url: '', events: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchWebhooks() }, [])

  const fetchWebhooks = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/webhooks')
      setWebhooks(res.data || [])
    } catch (e) {
      setWebhooks([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.url || !formData.events) return
    try {
      await axios.post('/api/eval/webhooks', {
        name: formData.name,
        url: formData.url,
        events: formData.events.split(',').map(e => e.trim()).filter(Boolean),
      })
      toastSuccess('Webhook 创建成功')
      setCreateOpen(false)
      setFormData({ name: '', url: '', events: '' })
      fetchWebhooks()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/webhooks/${id}/delete`)
      toastSuccess('Webhook 已删除')
      fetchWebhooks()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" /> Webhook 管理
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建 Webhook
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>事件</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无 Webhook
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">{w.url}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {w.events?.slice(0, 2).map((e: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                        {w.events?.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{w.events.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(w.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedWebhook(w); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(w.id)}>
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
            <DialogTitle>新建 Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Webhook 名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL *</label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">事件（逗号分隔）*</label>
              <Input
                value={formData.events}
                onChange={(e) => setFormData({ ...formData, events: e.target.value })}
                placeholder="eval.completed,report.generated"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.url || !formData.events}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Webhook 详情</DialogTitle>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">名称</label>
                <p className="mt-1 text-sm">{selectedWebhook.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <p className="mt-1 text-sm font-mono">{selectedWebhook.url}</p>
              </div>
              <div>
                <label className="text-sm font-medium">事件</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedWebhook.events?.map((e: string, i: number) => (
                    <Badge key={i} variant="outline">{e}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
