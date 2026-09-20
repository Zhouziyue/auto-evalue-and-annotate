import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Zap, Edit, Trash2, Search, Bot, Eye, Cpu, MessageSquare, Activity } from 'lucide-react'
import axios from 'axios'

interface Agent {
  id: string
  name: string
  description: string | null
  url: string
  model: string | null
  systemPrompt: string | null
  status: string
  authType: string
  sseFormat: string
  skillId: string
  createdAt: string
  updatedAt: string
}

interface Skill {
  id: string
  name: string
  category: string | null
}

// 骨架屏
function SkeletonCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-5 w-32 animate-skeleton rounded" />
              <div className="h-4 w-full animate-skeleton rounded" />
              <div className="h-4 w-2/3 animate-skeleton rounded" />
              <div className="flex gap-2">
                <div className="h-5 w-16 animate-skeleton rounded-full" />
                <div className="h-5 w-20 animate-skeleton rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const MODEL_OPTIONS = ['gpt-4o', 'gpt-4-turbo', 'claude-3-sonnet', 'claude-3-opus', 'qwen-max', 'deepseek-v3', 'gemini-pro']

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    name: '', description: '', url: '', model: '', systemPrompt: '',
    authType: 'none', sseFormat: 'auto', skillId: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [testStatus, setTestStatus] = useState<Record<string, { success: boolean; latency: number }>>({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [agentsRes, skillsRes] = await Promise.all([
        axios.get('/api/agents'),
        axios.get('/api/skills'),
      ])
      setAgents(agentsRes.data)
      setSkills(skillsRes.data)
    } catch (e) {
      console.error(e)
      toastError('加载数据失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const getSkillName = (skillId: string) => skills.find(s => s.id === skillId)?.name || '未知技能'
  const getSkillCategory = (skillId: string) => skills.find(s => s.id === skillId)?.category

  const handleCreate = async () => {
    if (!formData.name || !formData.url || !formData.skillId) return
    try {
      await axios.post('/api/agents', {
        ...formData,
        description: formData.description || undefined,
        model: formData.model || undefined,
        systemPrompt: formData.systemPrompt || undefined,
      })
      setCreateOpen(false)
      resetForm()
      toastSuccess('智能体接入成功')
      fetchData()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleEdit = async () => {
    if (!currentAgent || !formData.name) return
    try {
      await axios.put(`/api/agents/${currentAgent.id}`, {
        ...formData,
        description: formData.description || undefined,
        model: formData.model || undefined,
        systemPrompt: formData.systemPrompt || undefined,
      })
      setEditOpen(false)
      toastSuccess('智能体更新成功')
      fetchData()
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
      await axios.delete(`/api/agents/${deleteTargetId}`)
      setDeleteConfirmOpen(false)
      setDeleteTargetId(null)
      toastSuccess('已删除智能体')
      fetchData()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleTest = async (id: string) => {
    setTestStatus(prev => ({ ...prev, [id]: { success: false, latency: 0 } }))
    try {
      const res = await axios.post(`/api/agents/${id}/test`, { input: 'test' })
      setTestStatus(prev => ({ ...prev, [id]: { success: res.data.success !== false, latency: res.data.latency || 0 } }))
    } catch (e) {
      setTestStatus(prev => ({ ...prev, [id]: { success: false, latency: 0 } }))
    }
  }

  const openEdit = (agent: Agent) => {
    setCurrentAgent(agent)
    setFormData({
      name: agent.name,
      description: agent.description || '',
      url: agent.url,
      model: agent.model || '',
      systemPrompt: agent.systemPrompt || '',
      authType: agent.authType,
      sseFormat: agent.sseFormat,
      skillId: agent.skillId,
    })
    setEditOpen(true)
  }

  const openDetail = (agent: Agent) => {
    setCurrentAgent(agent)
    setDetailOpen(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', url: '', model: '', systemPrompt: '', authType: 'none', sseFormat: 'auto', skillId: '' })
  }

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.model || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-400'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              智能体管理
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              管理已接入的 AI 智能体，配置模型、系统提示词和技能绑定
            </p>
          </div>
          <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> 接入智能体
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索智能体名称、描述或模型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              共 {agents.length} 个智能体
            </div>
          </div>

          {loading ? <SkeletonCards /> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-4 text-muted-foreground">暂无数据</p>
                  <p className="mt-1 text-xs text-muted-foreground">点击"接入智能体"开始配置</p>
                </div>
              ) : (
                filteredAgents.map((agent) => (
                  <Card
                    key={agent.id}
                    className="group relative cursor-pointer transition-all hover:shadow-md"
                    onClick={() => openDetail(agent)}
                  >
                    <CardContent className="p-5">
                      {/* Header: name + status */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusColor(agent.status)}`} />
                          <h3 className="font-semibold leading-tight">{agent.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getSkillCategory(agent.skillId)}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {agent.description || '暂无描述'}
                      </p>

                      {/* Model + Skill */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        {agent.model && (
                          <Badge variant="secondary" className="gap-1">
                            <Cpu className="h-3 w-3" />
                            {agent.model}
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1 text-xs">
                          <MessageSquare className="h-3 w-3" />
                          {getSkillName(agent.skillId)}
                        </Badge>
                      </div>

                      {/* Test status + Actions */}
                      <div className="flex items-center justify-between border-t border-border-light pt-3">
                        <div className="text-xs text-muted-foreground">
                          {testStatus[agent.id] ? (
                            <Badge variant={testStatus[agent.id].success ? 'default' : 'destructive'} className="text-xs">
                              {testStatus[agent.id].success
                                ? `✓ ${testStatus[agent.id].latency}ms`
                                : '✗ 连接失败'}
                            </Badge>
                          ) : (
                            <span>未测试</span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost" size="sm"
                            onClick={(e) => { e.stopPropagation(); handleTest(agent.id) }}
                            aria-label="测试连接"
                          >
                            <Zap className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={(e) => { e.stopPropagation(); openEdit(agent) }}
                            aria-label="编辑"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDelete(agent.id) }}
                            aria-label="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>接入智能体</DialogTitle>
            <DialogDescription>配置智能体的基本信息和接入参数</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 <span className="text-destructive">*</span></label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如: 客服问答 Agent" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="智能体的功能描述" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">绑定技能 <span className="text-destructive">*</span></label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.skillId}
                onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
              >
                <option value="">请选择技能</option>
                {skills.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">底层模型</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                >
                  <option value="">请选择模型</option>
                  {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">接口地址 <span className="text-destructive">*</span></label>
                <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">系统提示词</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="定义智能体的行为和角色..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">认证方式</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.authType}
                  onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                >
                  <option value="none">无认证</option>
                  <option value="api_key">API Key</option>
                  <option value="token">Bearer Token</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SSE 格式</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.sseFormat}
                  onChange={(e) => setFormData({ ...formData, sseFormat: e.target.value })}
                >
                  <option value="auto">自动探测</option>
                  <option value="content">content</option>
                  <option value="delta">delta</option>
                  <option value="openai">OpenAI格式</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.url || !formData.skillId}>接入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑智能体</DialogTitle>
            <DialogDescription>修改智能体配置</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">底层模型</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                >
                  <option value="">请选择模型</option>
                  {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">接口地址</label>
                <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">系统提示词</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">认证方式</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.authType}
                  onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                >
                  <option value="none">无认证</option>
                  <option value="api_key">API Key</option>
                  <option value="token">Bearer Token</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SSE 格式</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.sseFormat}
                  onChange={(e) => setFormData({ ...formData, sseFormat: e.target.value })}
                >
                  <option value="auto">自动探测</option>
                  <option value="content">content</option>
                  <option value="delta">delta</option>
                  <option value="openai">OpenAI格式</option>
                </select>
              </div>
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
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {currentAgent?.name}
              {currentAgent && (
                <Badge variant={currentAgent.status === 'active' ? 'default' : 'outline'}>
                  {currentAgent.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>{currentAgent?.description || '暂无描述'}</DialogDescription>
          </DialogHeader>
          {currentAgent && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <Cpu className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">{currentAgent.model || '未配置'}</div>
                  <div className="text-xs text-muted-foreground">底层模型</div>
                </div>
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <MessageSquare className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">{getSkillName(currentAgent.skillId)}</div>
                  <div className="text-xs text-muted-foreground">绑定技能</div>
                </div>
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <Zap className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">{currentAgent.authType}</div>
                  <div className="text-xs text-muted-foreground">认证方式</div>
                </div>
                <div className="rounded-lg border border-border-light p-3 text-center">
                  <Activity className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">{currentAgent.sseFormat}</div>
                  <div className="text-xs text-muted-foreground">SSE 格式</div>
                </div>
              </div>

              {/* System Prompt */}
              {currentAgent.systemPrompt && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">系统提示词</h4>
                  <div className="rounded-lg bg-muted p-4 text-sm">
                    <pre className="whitespace-pre-wrap font-sans">{currentAgent.systemPrompt}</pre>
                  </div>
                </div>
              )}

              {/* Endpoint URL */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">接入地址</h4>
                <code className="block rounded bg-muted px-3 py-2 text-sm">{currentAgent.url}</code>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleTest(currentAgent.id)}>
                  <Zap className="mr-1 h-3 w-3" /> 测试连接
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setDetailOpen(false); openEdit(currentAgent) }}>
                  <Edit className="mr-1 h-3 w-3" /> 编辑
                </Button>
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
            <DialogDescription>确定要删除该智能体吗？此操作不可恢复。</DialogDescription>
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
