import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Map, Tag, Layers, CheckCircle, Plus, Eye, Play, Search, Archive, Trash2 } from 'lucide-react'
import axios from 'axios'

interface Scenario {
  id: string
  name: string
  category: string
  status: string
  difficulty: string
  description: string
  caseCount: number
  avgScore: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', category: '', difficulty: 'medium', description: '', tags: '' })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Scenario | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stats, setStats] = useState<any>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchScenarios()
    fetchStats()
  }, [])

  const fetchScenarios = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/scenarios')
      setScenarios(res.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/eval/scenarios/stats')
      setStats(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      await axios.post('/api/eval/scenarios', { ...formData, tags })
      toastSuccess('场景已创建')
      setCreateOpen(false)
      setFormData({ name: '', category: '', difficulty: 'medium', description: '', tags: '' })
      fetchScenarios()
      fetchStats()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await axios.post(`/api/eval/scenarios/${id}/activate`)
      toastSuccess('场景已激活')
      fetchScenarios()
    } catch (e) {
      toastError('激活失败')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await axios.post(`/api/eval/scenarios/${id}/archive`)
      toastSuccess('场景已归档')
      fetchScenarios()
    } catch (e) {
      toastError('归档失败')
    }
  }

  const handleExecute = async (id: string) => {
    try {
      await axios.post(`/api/eval/scenarios/${id}/execute`)
      toastSuccess('场景已执行')
      fetchScenarios()
    } catch (e) {
      toastError('执行失败')
    }
  }

  const openDetail = async (scenario: Scenario) => {
    try {
      const res = await axios.get(`/api/eval/scenarios/${scenario.id}`)
      setSelected(res.data)
    } catch (e) {
      setSelected(scenario)
    }
    setDetailOpen(true)
  }

  const filteredScenarios = scenarios.filter(s => {
    const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !categoryFilter || s.category === categoryFilter
    return matchSearch && matchCategory
  })

  const categories = [...new Set(scenarios.map(s => s.category))]
  const totalCases = scenarios.reduce((a, s) => a + s.caseCount, 0)

  return (
    <div className="space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">场景总数</span>
            </div>
            <p className="text-2xl font-bold mt-2">{scenarios.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">已启用</span>
            </div>
            <p className="text-2xl font-bold mt-2">{scenarios.filter(s => s.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">分类数</span>
            </div>
            <p className="text-2xl font-bold mt-2">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">总用例数</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalCases}</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-1">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索场景..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm">
                <option value="">全部分类</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> 新建场景
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 场景列表 */}
      <Card>
        <CardHeader>
          <CardTitle>场景管理</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead>难度</TableHead>
                <TableHead className="text-center">用例数</TableHead>
                <TableHead className="text-center">平均分</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filteredScenarios.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">暂无场景</TableCell></TableRow>
              ) : filteredScenarios.map(scenario => (
                <TableRow key={scenario.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{scenario.name}</TableCell>
                  <TableCell><Badge variant="outline">{scenario.category}</Badge></TableCell>
                  <TableCell className="text-center">
                    <Badge variant={scenario.status === 'active' ? 'default' : scenario.status === 'archived' ? 'secondary' : 'outline'}>
                      {scenario.status === 'active' ? '已启用' : scenario.status === 'archived' ? '已归档' : scenario.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={scenario.difficulty === 'easy' ? 'secondary' : scenario.difficulty === 'hard' ? 'destructive' : 'outline'}>
                      {scenario.difficulty === 'easy' ? '简单' : scenario.difficulty === 'medium' ? '中等' : '困难'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{scenario.caseCount}</TableCell>
                  <TableCell className="text-center font-bold">{scenario.avgScore > 0 ? (scenario.avgScore * 100).toFixed(1) + '%' : '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {scenario.tags?.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(scenario.updatedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(scenario)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleExecute(scenario.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      {scenario.status === 'active' ? (
                        <Button variant="ghost" size="sm" onClick={() => handleArchive(scenario.id)}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleActivate(scenario.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新建场景 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建场景</DialogTitle>
            <DialogDescription>创建一个评测场景</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">场景名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如 客服咨询场景" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">分类</label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="如 customer-service" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">难度</label>
                <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <textarea
                className="w-full h-20 rounded border p-3 text-sm resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="场景描述..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签（逗号分隔）</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="如 tag1, tag2" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>场景详情</DialogTitle>
            <DialogDescription>{selected?.name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">分类：</span><Badge variant="outline">{selected.category}</Badge></div>
                <div><span className="text-sm text-muted-foreground">状态：</span><Badge>{selected.status}</Badge></div>
                <div><span className="text-sm text-muted-foreground">难度：</span><Badge variant="outline">{selected.difficulty}</Badge></div>
                <div><span className="text-sm text-muted-foreground">用例数：</span><span className="font-bold">{selected.caseCount}</span></div>
                <div><span className="text-sm text-muted-foreground">平均分：</span><span className="font-bold">{selected.avgScore > 0 ? (selected.avgScore * 100).toFixed(1) + '%' : '-'}</span></div>
              </div>
              {selected.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">描述</label>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>
              )}
              {selected.tags && selected.tags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">标签</label>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
