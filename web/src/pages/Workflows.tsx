import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Play, Eye, Trash2, GitBranch } from 'lucide-react'
import axios from 'axios'

export default function Workflows() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', nodes: '[]' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchWorkflows() }, [])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/workflows')
      setWorkflows(res.data || [])
    } catch (e) {
      setWorkflows([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      let nodes = []
      try {
        nodes = JSON.parse(formData.nodes)
      } catch {
        toastError('节点配置格式错误')
        return
      }
      await axios.post('/api/eval/workflows', {
        name: formData.name,
        description: formData.description,
        nodes,
      })
      toastSuccess('工作流创建成功')
      setCreateOpen(false)
      setFormData({ name: '', description: '', nodes: '[]' })
      fetchWorkflows()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleExecute = async (id: string) => {
    try {
      await axios.post(`/api/eval/workflows/${id}/execute`)
      toastSuccess('工作流已启动')
      fetchWorkflows()
    } catch (e) {
      toastError('执行失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/workflows/${id}/delete`)
      toastSuccess('工作流已删除')
      fetchWorkflows()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> 工作流引擎
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建工作流
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>节点数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无工作流
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{w.description || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{w.nodes?.length || 0}</Badge></TableCell>
                    <TableCell><Badge>{w.status || 'active'}</Badge></TableCell>
                    <TableCell>{new Date(w.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleExecute(w.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedWorkflow(w); setDetailOpen(true) }}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建工作流</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="工作流名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="工作流描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">节点配置 (JSON)</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.nodes}
                onChange={(e) => setFormData({ ...formData, nodes: e.target.value })}
                placeholder='[{"type": "load_dataset", "config": {}}, {"type": "evaluate", "config": {}}]'
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>工作流详情</DialogTitle>
          </DialogHeader>
          {selectedWorkflow && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">名称</label>
                <p className="mt-1 text-sm">{selectedWorkflow.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">描述</label>
                <p className="mt-1 text-sm text-muted-foreground">{selectedWorkflow.description || '-'}</p>
              </div>
              {selectedWorkflow.nodes && (
                <div>
                  <label className="text-sm font-medium">节点</label>
                  <pre className="mt-2 text-xs bg-muted rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedWorkflow.nodes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
