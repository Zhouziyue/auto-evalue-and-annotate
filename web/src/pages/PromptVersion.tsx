import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { FileText, Tag, Clock, Layers, Plus, Eye, GitBranch, Trash2, Search, CheckCircle, RotateCcw } from 'lucide-react'
import axios from 'axios'

interface Prompt {
  id: string
  name: string
  category: string
  description?: string
  versionCount: number
  activeVersion?: string
  createdAt: string
  updatedAt: string
}

interface PromptVersion {
  id: string
  promptId: string
  version: number
  content: string
  status: 'active' | 'draft' | 'archived'
  createdBy?: string
  createdAt: string
}

export default function PromptVersion() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createVersionOpen, setCreateVersionOpen] = useState(false)
  const [diffOpen, setDiffOpen] = useState(false)
  const [diffVersions, setDiffVersions] = useState<{ v1: string; v2: string }>({ v1: '', v2: '' })
  const [diffResult, setDiffResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    content: '',
  })
  const [versionContent, setVersionContent] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/prompts')
      setPrompts(res.data || [])
    } catch (e) {
      console.error(e)
      toastError('加载 Prompt 列表失败')
    }
    setLoading(false)
  }

  const fetchVersions = async (promptId: string) => {
    setVersionsLoading(true)
    try {
      const res = await axios.get(`/api/prompts/${promptId}/versions`)
      setVersions(res.data || [])
    } catch (e) {
      console.error(e)
      setVersions([])
    }
    setVersionsLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.category) return
    try {
      await axios.post('/api/prompts', {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        content: formData.content,
      })
      toastSuccess('Prompt 创建成功')
      setCreateOpen(false)
      setFormData({ name: '', category: '', description: '', content: '' })
      fetchPrompts()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleCreateVersion = async () => {
    if (!selectedPrompt || !versionContent) return
    try {
      await axios.post(`/api/prompts/${selectedPrompt.id}/versions`, {
        content: versionContent,
      })
      toastSuccess('版本创建成功')
      setCreateVersionOpen(false)
      setVersionContent('')
      fetchVersions(selectedPrompt.id)
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建版本失败')
    }
  }

  const handleActivateVersion = async (versionId: string) => {
    if (!selectedPrompt) return
    try {
      await axios.post(`/api/prompts/${selectedPrompt.id}/versions/${versionId}/activate`)
      toastSuccess('版本已激活')
      fetchVersions(selectedPrompt.id)
    } catch (e) {
      toastError('激活失败')
    }
  }

  const handleRollback = async () => {
    if (!selectedPrompt) return
    try {
      await axios.post(`/api/prompts/${selectedPrompt.id}/rollback`)
      toastSuccess('已回滚到上一版本')
      fetchVersions(selectedPrompt.id)
    } catch (e) {
      toastError('回滚失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/prompts/${id}/delete`)
      toastSuccess('Prompt 删除成功')
      fetchPrompts()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleDiff = async () => {
    if (!selectedPrompt || !diffVersions.v1 || !diffVersions.v2) return
    try {
      const res = await axios.get(`/api/prompts/${selectedPrompt.id}/versions/diff`, {
        params: { v1: diffVersions.v1, v2: diffVersions.v2 },
      })
      setDiffResult(res.data)
    } catch (e) {
      toastError('版本对比失败')
    }
  }

  const openDetail = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setDetailOpen(true)
    fetchVersions(prompt.id)
  }

  const categories = [...new Set(prompts.map(p => p.category))]
  const filteredPrompts = prompts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !categoryFilter || p.category === categoryFilter
    return matchSearch && matchCategory
  })

  const getVersionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">活跃</Badge>
      case 'archived':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20" variant="outline">已归档</Badge>
      default:
        return <Badge variant="outline">草稿</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompt 总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prompts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总版本数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prompts.reduce((a, p) => a + (p.versionCount || 0), 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分类数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近更新</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {prompts.length ? new Date(prompts[0].updatedAt).toLocaleDateString() : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Prompt 版本管理
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建 Prompt
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索 Prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {loading ? (
            <div className="py-12 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="mt-2 text-muted-foreground">加载中...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead className="text-center">版本数</TableHead>
                  <TableHead>活跃版本</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrompts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">暂无 Prompt</p>
                      <p className="mt-1 text-xs text-muted-foreground">点击"新建 Prompt"开始创建</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrompts.map(p => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{p.versionCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.activeVersion || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(p.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedPrompt?.name}
            </DialogTitle>
            <DialogDescription>{selectedPrompt?.description}</DialogDescription>
          </DialogHeader>
          {selectedPrompt && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">分类：</span>
                  <Badge variant="outline">{selectedPrompt.category}</Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">版本数：</span>
                  <Badge variant="outline">{selectedPrompt.versionCount || 0}</Badge>
                </div>
              </div>

              {/* 版本管理 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GitBranch className="h-4 w-4" /> 版本历史
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleRollback}>
                        <RotateCcw className="mr-1 h-3 w-3" /> 回滚
                      </Button>
                      <Button size="sm" onClick={() => setCreateVersionOpen(true)}>
                        <Plus className="mr-1 h-3 w-3" /> 新版本
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {versionsLoading ? (
                    <div className="py-8 text-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4">暂无版本</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versions.map(v => (
                        <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium">v{v.version}</span>
                                {getVersionStatusBadge(v.status)}
                              </div>
                              <span className="text-xs text-muted-foreground mt-1">
                                {new Date(v.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {v.status !== 'active' && (
                              <Button variant="outline" size="sm" onClick={() => handleActivateVersion(v.id)}>
                                <CheckCircle className="mr-1 h-3 w-3" /> 激活
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* 版本对比 */}
                      {versions.length >= 2 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">版本对比</span>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                              value={diffVersions.v1}
                              onChange={(e) => setDiffVersions({ ...diffVersions, v1: e.target.value })}
                            >
                              <option value="">选择版本</option>
                              {versions.map(v => (
                                <option key={v.id} value={v.id}>v{v.version}</option>
                              ))}
                            </select>
                            <span className="text-muted-foreground">vs</span>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                              value={diffVersions.v2}
                              onChange={(e) => setDiffVersions({ ...diffVersions, v2: e.target.value })}
                            >
                              <option value="">选择版本</option>
                              {versions.map(v => (
                                <option key={v.id} value={v.id}>v{v.version}</option>
                              ))}
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDiff}
                              disabled={!diffVersions.v1 || !diffVersions.v2}
                            >
                              对比
                            </Button>
                          </div>
                          {diffResult && (
                            <div className="mt-3 rounded-lg bg-muted/50 p-3">
                              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                {typeof diffResult === 'string' ? diffResult : JSON.stringify(diffResult, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建 Prompt</DialogTitle>
            <DialogDescription>创建新的 Prompt 配置</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：客服问答 Prompt"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类 *</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="例如：qa、classification、summarization"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Prompt 描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">初始内容 *</label>
              <textarea
                className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="输入 Prompt 内容..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.category || !formData.content}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Version Dialog */}
      <Dialog open={createVersionOpen} onOpenChange={setCreateVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" /> 创建新版本
            </DialogTitle>
            <DialogDescription>为当前 Prompt 创建新版本</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">版本内容 *</label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={versionContent}
                onChange={(e) => setVersionContent(e.target.value)}
                placeholder="输入新版本 Prompt 内容..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateVersionOpen(false)}>取消</Button>
            <Button onClick={handleCreateVersion} disabled={!versionContent}>创建版本</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
