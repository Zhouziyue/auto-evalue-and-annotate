import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { FileText, Tag, Layers, Copy, Plus, Eye, Download, Upload, Search, Sparkles } from 'lucide-react'
import axios from 'axios'

interface Template {
  id: string
  name: string
  category: string
  description: string
  builtIn: boolean
  tags: string[]
  config?: any
  variables?: any[]
  createdAt?: string
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [instantiateOpen, setInstantiateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    config: '',
  })
  const [instantiateData, setInstantiateData] = useState('')
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/templates')
      setTemplates(res.data || [])
    } catch (e) {
      console.error(e)
      toastError('加载模板列表失败')
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.category) return
    try {
      let config = {}
      try {
        config = formData.config ? JSON.parse(formData.config) : {}
      } catch {
        toastError('配置格式错误，请输入有效的 JSON')
        return
      }
      await axios.post('/api/eval/templates', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        config,
      })
      toastSuccess('模板创建成功')
      setCreateOpen(false)
      setFormData({ name: '', description: '', category: '', tags: '', config: '' })
      fetchTemplates()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleInstantiate = async () => {
    if (!selectedTemplate || !instantiateData) return
    try {
      let variables = {}
      try {
        variables = JSON.parse(instantiateData)
      } catch {
        toastError('变量格式错误，请输入有效的 JSON')
        return
      }
      await axios.post(`/api/eval/templates/${selectedTemplate.id}/instantiate`, { variables })
      toastSuccess('模板实例化成功')
      setInstantiateOpen(false)
      setInstantiateData('')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '实例化失败')
    }
  }

  const handleDuplicate = async (template: Template) => {
    try {
      await axios.post(`/api/eval/templates/${template.id}/duplicate`, {
        newName: `${template.name} (副本)`,
      })
      toastSuccess('模板复制成功')
      fetchTemplates()
    } catch (e) {
      toastError('复制失败')
    }
  }

  const handleExport = async (template: Template) => {
    try {
      const res = await axios.get(`/api/eval/templates/${template.id}/export`)
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `template-${template.name}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('模板导出成功')
    } catch (e) {
      toastError('导出失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/templates/${id}/delete`)
      toastSuccess('模板删除成功')
      fetchTemplates()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const openDetail = (template: Template) => {
    setSelectedTemplate(template)
    setDetailOpen(true)
  }

  const categories = [...new Set(templates.map(t => t.category))]
  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !categoryFilter || t.category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模板总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内置模板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.builtIn).length}</div>
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
            <CardTitle className="text-sm font-medium">标签数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(templates.flatMap(t => t.tags || [])).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Template List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> 评测模板
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建模板
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模板..."
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
                  <TableHead className="text-center">类型</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">暂无评测模板</p>
                      <p className="mt-1 text-xs text-muted-foreground">点击"新建模板"开始创建</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map(t => (
                    <TableRow key={t.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                      <TableCell className="text-center">
                        {t.builtIn ? <Badge>内置</Badge> : <Badge variant="outline">自定义</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.tags?.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                          {t.tags?.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{t.tags.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{t.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(t)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(t)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleExport(t)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {!t.builtIn && (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                              <span className="text-destructive">删除</span>
                            </Button>
                          )}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedTemplate?.name}
              {selectedTemplate?.builtIn && <Badge>内置</Badge>}
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">分类：</span>
                  <Badge variant="outline">{selectedTemplate.category}</Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">创建时间：</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedTemplate.createdAt ? new Date(selectedTemplate.createdAt).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
              {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium">标签：</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTemplate.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedTemplate.config && (
                <div>
                  <span className="text-sm font-medium">配置：</span>
                  <pre className="mt-1 text-xs bg-muted rounded-md p-3 overflow-x-auto">
                    {JSON.stringify(selectedTemplate.config, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <span className="text-sm font-medium">变量：</span>
                  <div className="mt-1 space-y-1">
                    {selectedTemplate.variables.map((v: any, i: number) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <code className="bg-muted px-2 py-0.5 rounded text-xs">{v.name}</code>
                        <span className="text-muted-foreground">{v.description || v.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleDuplicate(selectedTemplate)}>
                  <Copy className="mr-2 h-4 w-4" /> 复制
                </Button>
                <Button variant="outline" onClick={() => handleExport(selectedTemplate)}>
                  <Download className="mr-2 h-4 w-4" /> 导出
                </Button>
                <Button onClick={() => { setInstantiateOpen(true) }}>
                  <Sparkles className="mr-2 h-4 w-4" /> 实例化
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建评测模板</DialogTitle>
            <DialogDescription>创建自定义评测模板</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：客服问答评测模板"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="模板描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类 *</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="例如：qa、rag、chat"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签（逗号分隔）</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="例如：客服,问答,评测"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">配置（JSON）</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                placeholder='{"metrics": ["answer_relevancy", "faithfulness"]}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.category}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instantiate Dialog */}
      <Dialog open={instantiateOpen} onOpenChange={setInstantiateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> 实例化模板
            </DialogTitle>
            <DialogDescription>
              为模板变量赋值，生成评测配置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-2">模板变量：</p>
                {selectedTemplate.variables.map((v: any, i: number) => (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <code className="bg-background px-2 py-0.5 rounded">{v.name}</code>
                    <span className="text-muted-foreground">{v.description || v.type}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">变量值（JSON）</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={instantiateData}
                onChange={(e) => setInstantiateData(e.target.value)}
                placeholder='{"model": "gpt-4", "dataset": "test-set"}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstantiateOpen(false)}>取消</Button>
            <Button onClick={handleInstantiate} disabled={!instantiateData}>实例化</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
