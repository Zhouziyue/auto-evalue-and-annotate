import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Pause, CheckCircle, Eye, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function ABTests() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', variants: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchTests() }, [])

  const fetchTests = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/ab-tests')
      setTests(res.data || [])
    } catch (e) {
      setTests([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      const variants = formData.variants.split('\n').filter(Boolean).map(v => {
        const [id, name] = v.split(':').map(s => s.trim())
        return { id: id || `v${Date.now()}`, name: name || id }
      })
      await axios.post('/api/eval/ab-tests', {
        name: formData.name,
        description: formData.description,
        variants,
      })
      toastSuccess('A/B 测试创建成功')
      setCreateOpen(false)
      setFormData({ name: '', description: '', variants: '' })
      fetchTests()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleStart = async (id: string) => {
    try {
      await axios.post(`/api/eval/ab-tests/${id}/start`)
      toastSuccess('测试已启动')
      fetchTests()
    } catch (e) {
      toastError('启动失败')
    }
  }

  const handlePause = async (id: string) => {
    try {
      await axios.post(`/api/eval/ab-tests/${id}/pause`)
      toastSuccess('测试已暂停')
      fetchTests()
    } catch (e) {
      toastError('暂停失败')
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await axios.post(`/api/eval/ab-tests/${id}/complete`)
      toastSuccess('测试已完成')
      fetchTests()
    } catch (e) {
      toastError('完成失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge className="bg-blue-500/10 text-blue-600">运行中</Badge>
      case 'paused': return <Badge className="bg-yellow-500/10 text-yellow-600">已暂停</Badge>
      case 'completed': return <Badge className="bg-green-500/10 text-green-600">已完成</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>A/B 测试</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建测试
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>变体数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无 A/B 测试
                  </TableCell>
                </TableRow>
              ) : (
                tests.map(test => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{test.description || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{test.variants?.length || 0}</Badge></TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell>{new Date(test.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {test.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => handleStart(test.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handlePause(test.id)}>
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleComplete(test.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTest(test); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
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
            <DialogTitle>新建 A/B 测试</DialogTitle>
            <DialogDescription>创建 A/B 测试对比不同变体</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="测试名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="测试描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">变体（每行一个，格式：id:名称）</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.variants}
                onChange={(e) => setFormData({ ...formData, variants: e.target.value })}
                placeholder={"v1:变体A\nv2:变体B"}
              />
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
            <DialogTitle>测试详情</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">名称</label>
                <p className="mt-1 text-sm">{selectedTest.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">描述</label>
                <p className="mt-1 text-sm text-muted-foreground">{selectedTest.description || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">状态</label>
                <p className="mt-1">{getStatusBadge(selectedTest.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">变体</label>
                <div className="mt-2 space-y-2">
                  {selectedTest.variants?.map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{v.name}</span>
                      <Badge variant="outline">{v.id}</Badge>
                    </div>
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
