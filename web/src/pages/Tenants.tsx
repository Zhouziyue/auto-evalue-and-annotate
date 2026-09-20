import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Building2 } from 'lucide-react'
import axios from 'axios'

export default function Tenants() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', plan: 'free' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTenants() }, [])

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/tenants')
      setTenants(res.data || [])
    } catch (e) {
      setTenants([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      await axios.post('/api/eval/tenants', {
        name: formData.name,
        plan: formData.plan,
      })
      toastSuccess('租户创建成功')
      setCreateOpen(false)
      setFormData({ name: '', plan: 'free' })
      fetchTenants()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> 多租户管理
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建租户
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>计划</TableHead>
                <TableHead>成员数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无租户
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.plan}</Badge></TableCell>
                    <TableCell>{t.memberCount || 0}</TableCell>
                    <TableCell><Badge>{t.status || 'active'}</Badge></TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedTenant(t); setDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>新建租户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="租户名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">计划</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              >
                <option value="free">免费版</option>
                <option value="pro">专业版</option>
                <option value="enterprise">企业版</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>租户详情</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedTenant.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">计划</label>
                  <p className="mt-1"><Badge>{selectedTenant.plan}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">成员数</label>
                  <p className="mt-1 text-sm">{selectedTenant.memberCount || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1"><Badge>{selectedTenant.status}</Badge></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
