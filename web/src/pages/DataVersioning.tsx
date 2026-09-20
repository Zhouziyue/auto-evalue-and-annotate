import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, GitBranch, Eye, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function DataVersioning() {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [formData, setFormData] = useState({ datasetId: '', name: '', description: '', data: '[]' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchVersions() }, [])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/data-versioning/versions')
      setVersions(res.data || [])
    } catch (e) {
      setVersions([])
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.datasetId || !formData.name) return
    try {
      let data = []
      try {
        data = JSON.parse(formData.data)
      } catch {
        toastError('数据格式错误')
        return
      }
      await axios.post('/api/eval/data-versioning/versions', {
        datasetId: formData.datasetId,
        name: formData.name,
        description: formData.description,
        data,
        createdBy: 'current',
      })
      toastSuccess('版本创建成功')
      setCreateOpen(false)
      setFormData({ datasetId: '', name: '', description: '', data: '[]' })
      fetchVersions()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handlePublish = async (datasetId: string, version: number) => {
    try {
      await axios.post(`/api/eval/data-versioning/versions/${datasetId}/${version}/publish`)
      toastSuccess('版本已发布')
      fetchVersions()
    } catch (e) {
      toastError('发布失败')
    }
  }

  const handleArchive = async (datasetId: string, version: number) => {
    try {
      await axios.post(`/api/eval/data-versioning/versions/${datasetId}/${version}/archive`)
      toastSuccess('版本已归档')
      fetchVersions()
    } catch (e) {
      toastError('归档失败')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> 数据版本控制
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建版本
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据集</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无版本
                  </TableCell>
                </TableRow>
              ) : (
                versions.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.datasetId?.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline">v{v.version}</Badge></TableCell>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell><Badge>{v.status}</Badge></TableCell>
                    <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {v.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => handlePublish(v.datasetId, v.version)}>
                            发布
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedVersion(v); setDetailOpen(true) }}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建数据版本</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">数据集 ID *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.datasetId}
                onChange={(e) => setFormData({ ...formData, datasetId: e.target.value })}
                placeholder="数据集ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">版本名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="版本名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="版本描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数据 (JSON)</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                placeholder='[{"field": "value"}]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.datasetId || !formData.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>版本详情</DialogTitle>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">数据集</label>
                  <p className="mt-1 text-sm font-mono">{selectedVersion.datasetId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">版本</label>
                  <p className="mt-1"><Badge>v{selectedVersion.version}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedVersion.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1"><Badge>{selectedVersion.status}</Badge></p>
                </div>
              </div>
              {selectedVersion.data && (
                <div>
                  <label className="text-sm font-medium">数据</label>
                  <pre className="mt-2 text-xs bg-muted rounded p-3 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedVersion.data, null, 2)}
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
