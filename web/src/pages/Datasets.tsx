import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Database, Edit, Trash2, Search, Upload, FileText, Download } from 'lucide-react'
import axios from 'axios'

interface Dataset {
  id: string
  name: string
  description: string | null
  category: string | null
  _count?: { testCases: number }
  createdAt: string
}

// 骨架屏
function SkeletonTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><div className="h-4 w-24 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-32 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-16 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-12 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-28 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-24 animate-skeleton rounded" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4].map(i => (
          <TableRow key={i}>
            <TableCell><div className="h-4 w-28 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-4 w-40 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-5 w-14 animate-skeleton rounded-full" /></TableCell>
            <TableCell><div className="h-5 w-8 animate-skeleton rounded-full" /></TableCell>
            <TableCell><div className="h-4 w-32 animate-skeleton rounded" /></TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <div className="h-8 w-16 animate-skeleton rounded" />
                <div className="h-8 w-8 animate-skeleton rounded" />
                <div className="h-8 w-8 animate-skeleton rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', category: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [importData, setImportData] = useState('')
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  const handleExport = async (datasetId: string, datasetName: string) => {
    try {
      const res = await axios.get(`/api/datasets/${datasetId}/export`)
      const data = res.data
      // 转换为 JSON 文件下载
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${datasetName}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('导出成功')
    } catch (e) {
      toastError('导出失败')
    }
  }

  const fetchDatasets = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/datasets')
      setDatasets(res.data)
    } catch (e) {
      console.error(e)
      toastError('加载数据集列表失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchDatasets() }, [])

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      await axios.post('/api/datasets', formData)
      setCreateOpen(false)
      setFormData({ name: '', description: '', category: '' })
      toastSuccess('数据集创建成功')
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleEdit = async () => {
    if (!currentDataset || !formData.name) return
    try {
      await axios.put(`/api/datasets/${currentDataset.id}`, formData)
      setEditOpen(false)
      toastSuccess('数据集更新成功')
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '更新失败')
    }
  }

  const handleDelete = (id: string) => {
    setDeleteTargetId(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await axios.delete(`/api/datasets/${deleteTargetId}`)
      setDeleteConfirmOpen(false)
      setDeleteTargetId(null)
      toastSuccess('已删除数据集')
      fetchDatasets()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleImport = async () => {
    if (!currentDataset || !importData) return
    try {
      let cases
      if (importFormat === 'json') {
        cases = JSON.parse(importData)
      } else {
        const lines = importData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        cases = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const obj: any = {}
          headers.forEach((h, i) => { obj[h] = values[i] })
          return obj
        })
      }
      await axios.post(`/api/datasets/${currentDataset.id}/import`, { cases })
      setImportOpen(false)
      setImportData('')
      toastSuccess(`成功导入 ${cases.length} 条用例`)
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '导入失败')
    }
  }

  const openEdit = (ds: Dataset) => {
    setCurrentDataset(ds)
    setFormData({ name: ds.name, description: ds.description || '', category: ds.category || '' })
    setEditOpen(true)
  }

  const openImport = (ds: Dataset) => {
    setCurrentDataset(ds)
    setImportData('')
    setImportOpen(true)
  }

  const categories = [...new Set(datasets.map(d => d.category).filter((c): c is string => !!c))]

  const filteredDatasets = datasets.filter(ds => {
    const matchSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ds.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !categoryFilter || ds.category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> 评测数据集</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建数据集
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索数据集..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {categories.length > 0 && (
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? <SkeletonTable /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead className="text-center">用例数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <div className="py-12">
                        <Database className="mx-auto h-12 w-12 text-muted-foreground/40" />
                        <p className="mt-4 text-muted-foreground">暂无数据</p>
                        <p className="mt-1 text-xs text-muted-foreground">点击"新建数据集"开始创建</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDatasets.map((ds) => (
                    <TableRow key={ds.id} className="hover:bg-muted/50 transition-colors duration-150">
                      <TableCell className="font-medium">{ds.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{ds.description || '-'}</TableCell>
                      <TableCell>{ds.category ? <Badge variant="outline">{ds.category}</Badge> : '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{ds._count?.testCases || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(ds.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleExport(ds.id, ds.name)} aria-label="导出数据集">
                            <Download className="mr-1 h-3 w-3" /> 导出
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openImport(ds)} aria-label="导入测试用例">
                            <Upload className="mr-1 h-3 w-3" /> 导入
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(ds)} aria-label="编辑数据集">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(ds.id)} aria-label="删除数据集">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建数据集</DialogTitle>
            <DialogDescription>创建评测数据集</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 <span className="text-destructive">*</span></label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如: 客服问答测试集" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="如: 客服" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑数据集</DialogTitle>
            <DialogDescription>修改数据集信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> 导入用例 - {currentDataset?.name}
            </DialogTitle>
            <DialogDescription>支持 JSON 和 CSV 格式导入</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">导入格式:</label>
              <div className="flex gap-2">
                <Button
                  variant={importFormat === 'json' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportFormat('json')}
                >
                  <FileText className="mr-1 h-3 w-3" /> JSON
                </Button>
                <Button
                  variant={importFormat === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportFormat('csv')}
                >
                  <FileText className="mr-1 h-3 w-3" /> CSV
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数据内容</label>
              <textarea
                className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={importFormat === 'json'
                  ? '[\n  { "input": "问题", "expectedOutput": "答案", "difficulty": "easy" }\n]'
                  : 'input,expectedOutput,difficulty\n问题,答案,easy'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>取消</Button>
            <Button onClick={handleImport} disabled={!importData}>导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除该数据集吗？关联的测试用例也会被删除。此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
