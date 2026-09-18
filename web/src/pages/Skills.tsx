import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react'
import axios from 'axios'

interface Skill {
  id: string
  name: string
  description: string | null
  version: string
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

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | string[]>([])
  const [currentSkill, setCurrentSkill] = useState<SkillDetail | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', version: '1.0.0', category: '', tags: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const CATEGORIES = ['function_call', 'rag', 'agent', 'chat', 'classification', 'summarization']

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/skills')
      setSkills(res.data)
    } catch (e) {
      console.error(e)
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
      }
      await axios.post('/api/skills', payload)
      setCreateOpen(false)
      setFormData({ name: '', description: '', version: '1.0.0', category: '', tags: '' })
      fetchSkills()
    } catch (e: any) {
      alert(e?.response?.data?.message || '创建失败')
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
      }
      await axios.put(`/api/skills/${currentSkill.id}`, payload)
      setEditOpen(false)
      fetchSkills()
    } catch (e: any) {
      alert(e?.response?.data?.message || '更新失败')
    }
  }

  const handleDelete = async (id: string) => {
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
      fetchSkills()
    } catch (e) {
      alert('删除失败')
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const res = await axios.get(`/api/skills/${id}`)
      setCurrentSkill(res.data)
      setDetailOpen(true)
    } catch (e) {
      alert('获取详情失败')
    }
  }

  const openEdit = (skill: Skill) => {
    setCurrentSkill(skill as SkillDetail)
    setFormData({
      name: skill.name,
      description: skill.description || '',
      version: skill.version,
      category: (skill as any).category || '',
      tags: (skill as any).tags?.join(', ') || '',
    })
    setEditOpen(true)
  }

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (skill.description || '').toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>技能管理</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建技能
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Batch Actions */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索技能名称或描述..."
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredSkills.length && filteredSkills.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                </TableHead>
                <TableHead>技能名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>版本</TableHead>
                <TableHead className="text-center">接入点</TableHead>
                <TableHead className="text-center">评测次数</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filteredSkills.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                filteredSkills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(skill.id)}
                        onChange={() => toggleSelect(skill.id)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{skill.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{skill.description || '-'}</TableCell>
                    <TableCell><Badge variant="secondary">{skill.version}</Badge></TableCell>
                    <TableCell className="text-center">{skill._count?.endpoints || 0}</TableCell>
                    <TableCell className="text-center">{skill._count?.evalRuns || 0}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(skill.updatedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(skill.id)} aria-label="查看技能详情">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(skill)} aria-label="编辑技能">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(skill.id)} aria-label="删除技能">
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建技能</DialogTitle>
            <DialogDescription>创建一个新的评测技能</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">技能名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如：客服问答技能" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="技能描述" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">请选择分类</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签 (逗号分隔)</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="如：ui-test, automated" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">版本号</label>
              <Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑技能</DialogTitle>
            <DialogDescription>修改技能信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">技能名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">请选择分类</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签 (逗号分隔)</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">版本号</label>
              <Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>技能详情 - {currentSkill?.name}</DialogTitle>
            <DialogDescription>查看技能详细信息</DialogDescription>
          </DialogHeader>
          {currentSkill && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">{currentSkill.endpoints?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">接入点</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">{currentSkill.evalRuns?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">评测次数</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">{currentSkill.skillVersions?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">版本数</div>
                </div>
              </div>
              <div className="space-y-2">
                <div><span className="font-medium">名称：</span>{currentSkill.name}</div>
                <div><span className="font-medium">描述：</span>{currentSkill.description || '无'}</div>
                <div><span className="font-medium">版本：</span><Badge variant="secondary">{currentSkill.version}</Badge></div>
                <div><span className="font-medium">创建时间：</span>{new Date(currentSkill.createdAt).toLocaleString()}</div>
              </div>
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
