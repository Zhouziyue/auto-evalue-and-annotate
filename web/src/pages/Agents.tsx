import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Zap, Edit, Trash2, Search } from 'lucide-react'
import axios from 'axios'

interface Agent {
  id: string
  name: string
  url: string
  authType: string
  sseFormat: string
  createdAt: string
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({ name: '', url: '', authType: 'none', sseFormat: 'auto' })
  const [searchQuery, setSearchQuery] = useState('')
  const [testStatus, setTestStatus] = useState<Record<string, { success: boolean; latency: number }>>({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/agents')
      setAgents(res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAgents() }, [])

  const handleCreate = async () => {
    if (!formData.name || !formData.url) return
    try {
      await axios.post('/api/agents', formData)
      setCreateOpen(false)
      setFormData({ name: '', url: '', authType: 'none', sseFormat: 'auto' })
      fetchAgents()
    } catch (e: any) {
      alert(e?.response?.data?.message || '创建失败')
    }
  }

  const handleEdit = async () => {
    if (!currentAgent || !formData.name) return
    try {
      await axios.put(`/api/agents/${currentAgent.id}`, formData)
      setEditOpen(false)
      fetchAgents()
    } catch (e: any) {
      alert(e?.response?.data?.message || '更新失败')
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
      fetchAgents()
    } catch (e) {
      alert('删除失败')
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
    setFormData({ name: agent.name, url: agent.url, authType: agent.authType, sseFormat: agent.sseFormat })
    setEditOpen(true)
  }

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>智能体管理</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 接入智能体
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索智能体名称或地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>认证方式</TableHead>
                <TableHead>SSE格式</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filteredAgents.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${testStatus[agent.id]?.success ? 'bg-green-500' : testStatus[agent.id] ? 'bg-red-500' : 'bg-gray-300'}`} />
                        {agent.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{agent.url}</TableCell>
                    <TableCell>
                      <Badge variant={agent.authType === 'none' ? 'outline' : 'secondary'}>{agent.authType}</Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline">{agent.sseFormat}</Badge></TableCell>
                    <TableCell className="text-center">
                      {testStatus[agent.id] ? (
                        <Badge variant={testStatus[agent.id].success ? 'default' : 'destructive'}>
                          {testStatus[agent.id].success
                            ? `${testStatus[agent.id].latency}ms`
                            : '失败'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">未测试</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleTest(agent.id)} aria-label="测试智能体连接">
                          <Zap className="mr-1 h-3 w-3" /> 测试
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(agent)} aria-label="编辑智能体">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(agent.id)} aria-label="删除智能体">
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
            <DialogTitle>接入智能体</DialogTitle>
            <DialogDescription>配置智能体的接入信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 <span className="text-red-500">*</span></label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如: 客服Agent" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">接口地址 <span className="text-red-500">*</span></label>
              <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://api.example.com/agent/sse" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">认证方式</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
              >
                <option value="none">无认证</option>
                <option value="api_key">API Key</option>
                <option value="token">Bearer Token</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SSE响应格式</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.sseFormat}
                onChange={(e) => setFormData({ ...formData, sseFormat: e.target.value })}
              >
                <option value="auto">自动探测</option>
                <option value="content">content</option>
                <option value="delta">delta</option>
                <option value="openai">OpenAI格式</option>
                <option value="text">text</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.url}>接入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
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
              <label className="text-sm font-medium">接口地址</label>
              <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">认证方式</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
              >
                <option value="none">无认证</option>
                <option value="api_key">API Key</option>
                <option value="token">Bearer Token</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SSE响应格式</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={formData.sseFormat}
                onChange={(e) => setFormData({ ...formData, sseFormat: e.target.value })}
              >
                <option value="auto">自动探测</option>
                <option value="content">content</option>
                <option value="delta">delta</option>
                <option value="openai">OpenAI格式</option>
                <option value="text">text</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
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
