import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Eye, Search, Wrench, FileText, Users, Tag, BookOpen, Shield } from 'lucide-react'
import axios from 'axios'

interface Skill {
  id: string
  name: string
  description: string | null
  version: string
  category: string | null
  tags: string | null
  instructions: string | null
  allowedTools: string | null
  requiredContext: string | null
  author: string | null
  license: string | null
  status: string
  createdAt: string
  updatedAt: string
  _count?: {
    endpoints: number
    evalRuns: number
    skillVersions: number
  }
}

interface SkillDetail extends Skill {
  endpoints: any[]
  evalRuns: any[]
  skillVersions: any[]
}

const CATEGORIES = ['function_call', 'rag', 'agent', 'chat', 'classification', 'summarization']
const CATEGORY_LABELS: Record<string, string> = {
  function_call: '函数调用',
  rag: 'RAG 检索',
  agent: 'Agent',
  chat: '对话',
  classification: '分类',
  summarization: '摘要',
}

const STATUS_OPTIONS = ['active', 'draft', 'deprecated']

// 骨架屏
function SkeletonCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-28 animate-skeleton rounded" />
                <div className="h-5 w-12 animate-skeleton rounded-full" />
              </div>
              <div className="h-4 w-full animate-skeleton rounded" />
              <div className="h-4 w-2/3 animate-skeleton rounded" />
              <div className="flex gap-2">
                <div className="h-5 w-16 animate-skeleton rounded-full" />
                <div className="h-5 w-14 animate-skeleton rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | string[]>([])
  const [currentSkill, setCurrentSkill] = useState<SkillDetail | null>(null)
  const [formData, setFormData] = useState({
    name: '', description: '', version: '1.0.0', category: '', tags: '',
    instructions: '', allowedTools: '', requiredContext: '',
    author: '', license: '', status: 'active',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const { toastSuccess, toastError } = useToastActions()

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/skills')
      setSkills(res.data)
    } catch (e) {
      console.error(e)
      toastError('加载技能列表失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchSkills() }, [])

  const handleCreate = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        version: formData.version,
        category: formData.category || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        instructions: formData.instructions || undefined,
        allowedTools: formData.allowedTools ? formData.allowedTools.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        requiredContext: formData.requiredContext ? formData.requiredContext.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        author: formData.author || undefined,
        license: formData.license || undefined,
        status: formData.status,
      }
      await axios.post('/api/skills', payload)
      setCreateOpen(false)
      resetForm()
      toastSuccess('技能创建成功')
      fetchSkills()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleEdit = async () => {
    if (!currentSkill) return
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        version: formData.version,
        category: formData.category || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        instructions: formData.instructions || undefined,
        allowedTools: formData.allowedTools ? formData.allowedTools.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        requiredContext: formData.requiredContext ? formData.requiredContext.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        author: formData.author || undefined,
        license: formData.license || undefined,
        status: formData.status,
      }
      await axios.put(`/api/skills/${currentSkill.id}`, payload)
      setEditOpen(false)
      toastSuccess('技能更新成功')
      fetchSkills()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '更新失败')
    }
  }

  const handleDelete = (id: string) => {
    setDeleteTarget([id])
    setDeleteConfirmOpen(true)
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setDeleteTarget(selectedIds)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    try {
      const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget]
      await Promise.all(ids.map(id => axios.delete(`/api/skills/${id}`)))
      setSelectedIds([])
      setDeleteConfirmOpen(false)
      setDeleteTarget([])
      toastSuccess(`已删除 ${ids.length} 个技能`)
      fetchSkills()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const res = await axios.get(`/api/skills/${id}`)
      setCurrentSkill(res.data)
      setDetailOpen(true)
    } catch (e) {
      toastError('获取详情失败')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', description: '', version: '1.0.0', category: '', tags: '',
      instructions: '', allowedTools: '', requiredContext: '',
      author: '', license: '', status: 'active',
    })
  }

  const openEdit = (skill: Skill) => {
    setCurrentSkill(skill as SkillDetail)
    setFormData({
      name: skill.name,
      description: skill.description || '',
      version: skill.version,
      category: (skill as any).category || '',
      tags: (skill as any).tags || '',
      instructions: (skill as any).instructions || '',
      allowedTools: (skill as any).allowedTools || '',
      requiredContext: (skill as any).requiredContext || '',
      author: (skill as any).author || '',
      license: (skill as any).license || '',
      status: (skill as any).status || 'active',
    })
    setEditOpen(true)
  }

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (skill.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (skill.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSkills.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredSkills.map(s => s.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600">active</Badge>
      case 'draft': return <Badge variant="outline">draft</Badge>
      case 'deprecated': return <Badge variant="destructive">deprecated</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              技能管理
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              管理智能体技能——定义指令、工具绑定和上下文需求
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
            >
              {viewMode === 'card' ? '表格视图' : '卡片视图'}
            </Button>
            <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> 新建技能
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Batch Actions */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索技能名称、描述或分类..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBatchDelete} aria-label="批量删除选中技能">
                <Trash2 className="mr-1 h-3 w-3" /> 删除选中 ({selectedIds.length})
              </Button>
            )}
          </div>

          {loading ? <SkeletonCards /> : viewMode === 'card' ? (
            /* Card View */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSkills.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <Wrench className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-4 text-muted-foreground">暂无数据</p>
                  <p className="mt-1 text-xs text-muted-foreground">点击"新建技能"开始创建</p>
                </div>
              ) : (
                filteredSkills.map((skill) => (
                  <Card
                    key={skill.id}
                    className="group relative cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleViewDetail(skill.id)}
                  >
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold leading-tight">{skill.name}</h3>
                        {statusBadge(skill.status)}
                      </div>

                      {/* Description */}
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {skill.description || '暂无描述'}
                      </p>

                      {/* Category + Version */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        {skill.category && (
                          <Badge variant="secondary">
                            {CATEGORY_LABELS[skill.category] || skill.category}
                          </Badge>
                        )}
                        <Badge variant="outline">v{skill.version}</Badge>
                        {skill.author && (
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {skill.author}
                          </Badge>
                        )}
                      </div>

                      {/* Tools + Context */}
                      <div className="mb-3 flex flex-wrap gap-1">
                        {(skill.allowedTools || '').split(',').filter(Boolean).slice(0, 3).map((tool, i) => (
                          <span key={i} className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {tool.trim()}
                          </span>
                        ))}
                        {(skill.allowedTools || '').split(',').filter(Boolean).length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{(skill.allowedTools || '').split(',').filter(Boolean).length - 3}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between border-t border-border-light pt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {skill._count?.endpoints || 0} 接入点
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {skill._count?.evalRuns || 0} 评测
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" /> {skill._count?.skillVersions || 0} 版本
                        </span>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); openEdit(skill) }} aria-label="编辑">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); handleDelete(skill.id) }} aria-label="删除">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            /* Table View */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredSkills.length && filteredSkills.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border"
                    />
                  </TableHead>
                  <TableHead>技能名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-center">接入点</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <div className="py-12">
                        <Wrench className="mx-auto h-12 w-12 text-muted-foreground/40" />
                        <p className="mt-4 text-muted-foreground">暂无数据</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSkills.map((skill) => (
                    <TableRow key={skill.id} className="hover:bg-muted/50 transition-colors duration-150">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(skill.id)}
                          onChange={() => toggleSelect(skill.id)}
                          className="h-4 w-4 rounded border-border"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{skill.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{skill.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {CATEGORY_LABELS[skill.category || ''] || skill.category || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">v{skill.version}</Badge></TableCell>
                      <TableCell>{statusBadge(skill.status)}</TableCell>
                      <TableCell className="text-center">{skill._count?.endpoints || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(skill.id)} aria-label="查看详情">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(skill)} aria-label="编辑">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(skill.id)} aria-label="删除">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建技能</DialogTitle>
            <DialogDescription>创建一个新的智能体技能，定义指令和工具绑定</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">技能名称 <span className="text-destructive">*</span></label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如：客服问答技能" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">请选择分类</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="技能功能描述" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> 技能指令 (SKILL.md)
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="# 技能名称&#10;&#10;## 概述&#10;描述技能的功能和适用场景...&#10;&#10;## 工作流程&#10;1. 步骤一&#10;2. 步骤二&#10;&#10;## 最佳实践&#10;- 注意事项..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5" /> 允许工具 (逗号分隔)
                </label>
                <Input value={formData.allowedTools} onChange={(e) => setFormData({ ...formData, allowedTools: e.target.value })} placeholder="tool1, tool2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> 所需上下文 (逗号分隔)
                </label>
                <Input value={formData.requiredContext} onChange={(e) => setFormData({ ...formData, requiredContext: e.target.value })} placeholder="context1, context2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">版本号</label>
                <Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">作者</label>
                <Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} placeholder="团队/个人" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签 (逗号分隔)</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="如：rag, nlp, customer-service" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑技能</DialogTitle>
            <DialogDescription>修改技能信息和指令定义</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">技能名称</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">请选择分类</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> 技能指令 (SKILL.md)
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">允许工具</label>
                <Input value={formData.allowedTools} onChange={(e) => setFormData({ ...formData, allowedTools: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">所需上下文</label>
                <Input value={formData.requiredContext} onChange={(e) => setFormData({ ...formData, requiredContext: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">版本号</label>
                <Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">作者</label>
                <Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {currentSkill?.name}
              {currentSkill && statusBadge(currentSkill.status)}
            </DialogTitle>
            <DialogDescription>{currentSkill?.description || '暂无描述'}</DialogDescription>
          </DialogHeader>
          {currentSkill && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <div className="text-2xl font-bold">{currentSkill.endpoints?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">接入点</div>
                </div>
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <div className="text-2xl font-bold">{currentSkill.evalRuns?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">评测次数</div>
                </div>
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <div className="text-2xl font-bold">{currentSkill.skillVersions?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">版本数</div>
                </div>
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <Badge variant="outline">v{currentSkill.version}</Badge>
                  <div className="mt-1 text-xs text-muted-foreground">当前版本</div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">分类：</span>
                  <Badge variant="secondary">{CATEGORY_LABELS[currentSkill.category || ''] || currentSkill.category || '-'}</Badge>
                </div>
                <div>
                  <span className="font-medium">作者：</span>
                  {currentSkill.author || '-'}
                </div>
                <div>
                  <span className="font-medium">许可：</span>
                  {currentSkill.license || '-'}
                </div>
                <div>
                  <span className="font-medium">创建时间：</span>
                  {new Date(currentSkill.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Tags */}
              {currentSkill.tags && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> 标签
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {currentSkill.tags.split(',').filter(Boolean).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Allowed Tools */}
              {currentSkill.allowedTools && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" /> 允许使用的工具
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {currentSkill.allowedTools.split(',').filter(Boolean).map((tool, i) => (
                      <span key={i} className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {tool.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Context */}
              {currentSkill.requiredContext && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> 所需上下文
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {currentSkill.requiredContext.split(',').filter(Boolean).map((ctx, i) => (
                      <span key={i} className="inline-flex items-center rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        {ctx.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {currentSkill.instructions && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> 技能指令 (SKILL.md)
                  </h4>
                  <div className="rounded-lg bg-muted p-4 text-sm">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{currentSkill.instructions}</pre>
                  </div>
                </div>
              )}

              {/* Bound Endpoints */}
              {currentSkill.endpoints && currentSkill.endpoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">绑定的智能体</h4>
                  <div className="space-y-2">
                    {currentSkill.endpoints.map((ep: any) => (
                      <div key={ep.id} className="flex items-center justify-between rounded-lg border border-border-light p-3">
                        <div>
                          <div className="font-medium text-sm">{ep.name}</div>
                          <div className="text-xs text-muted-foreground">{ep.url}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ep.model && <Badge variant="secondary" className="text-xs">{ep.model}</Badge>}
                          <Badge variant={ep.status === 'active' ? 'default' : 'outline'} className="text-xs">{ep.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除 {Array.isArray(deleteTarget) ? deleteTarget.length : 1} 个技能吗？此操作不可恢复。
            </DialogDescription>
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
