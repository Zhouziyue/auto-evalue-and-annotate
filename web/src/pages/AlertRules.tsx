import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Trash2, Bell } from 'lucide-react'
import axios from 'axios'

export default function AlertRules() {
  const [rules, setRules] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', metric: '', operator: 'lt', threshold: '', severity: 'medium' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchRules()
    fetchEvents()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/alerts/rules')
      setRules(res.data || [])
    } catch (e) {
      setRules([])
    }
    setLoading(false)
  }

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/eval/alerts/events')
      setEvents(res.data || [])
    } catch (e) {
      setEvents([])
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.metric || !formData.threshold) return
    try {
      await axios.post('/api/eval/alerts/rules', {
        name: formData.name,
        metric: formData.metric,
        operator: formData.operator,
        threshold: parseFloat(formData.threshold),
        severity: formData.severity,
      })
      toastSuccess('规则创建成功')
      setCreateOpen(false)
      setFormData({ name: '', metric: '', operator: 'lt', threshold: '', severity: 'medium' })
      fetchRules()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/alerts/rules/${id}/delete`)
      toastSuccess('规则已删除')
      fetchRules()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-500/10 text-red-600">高</Badge>
      case 'medium': return <Badge className="bg-yellow-500/10 text-yellow-600">中</Badge>
      case 'low': return <Badge className="bg-blue-500/10 text-blue-600">低</Badge>
      default: return <Badge variant="outline">{severity}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> 告警规则
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建规则
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>指标</TableHead>
                <TableHead>条件</TableHead>
                <TableHead>严重度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无规则
                  </TableCell>
                </TableRow>
              ) : (
                rules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.metric}</TableCell>
                    <TableCell className="font-mono text-xs">{r.operator} {r.threshold}</TableCell>
                    <TableCell>{getSeverityBadge(r.severity)}</TableCell>
                    <TableCell><Badge>{r.enabled ? '启用' : '禁用'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近告警</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>规则</TableHead>
                <TableHead>值</TableHead>
                <TableHead>严重度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>触发时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无告警
                  </TableCell>
                </TableRow>
              ) : (
                events.slice(0, 10).map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.ruleName || e.ruleId}</TableCell>
                    <TableCell>{e.value}</TableCell>
                    <TableCell>{getSeverityBadge(e.severity)}</TableCell>
                    <TableCell><Badge>{e.status}</Badge></TableCell>
                    <TableCell>{new Date(e.triggeredAt).toLocaleString()}</TableCell>
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
            <DialogTitle>新建告警规则</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="规则名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">指标 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                placeholder="例如：pass_rate"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">操作符</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                >
                  <option value="lt">小于</option>
                  <option value="gt">大于</option>
                  <option value="eq">等于</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">阈值 *</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">严重度</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.metric || !formData.threshold}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
