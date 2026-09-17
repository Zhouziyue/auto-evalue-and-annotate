import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Zap } from 'lucide-react'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', url: '', authType: 'none', sseFormat: 'auto' })

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
    try {
      await axios.post('/api/agents', formData)
      setModalOpen(false)
      setFormData({ name: '', url: '', authType: 'none', sseFormat: 'auto' })
      fetchAgents()
    } catch (e: any) {
      alert(e?.response?.data?.message || '创建失败')
    }
  }

  const handleTest = async (id: string) => {
    try {
      const res = await axios.post(`/api/agents/${id}/test`, { input: 'test' })
      alert(`连接成功！延迟: ${res.data.latency}ms`)
    } catch (e) {
      alert('连接失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>智能体管理</CardTitle>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 接入智能体
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>认证方式</TableHead>
                <TableHead>SSE格式</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">加载中...</TableCell></TableRow>
              ) : agents.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">{agent.url}</TableCell>
                    <TableCell>
                      <Badge variant={agent.authType === 'none' ? 'outline' : 'secondary'}>{agent.authType}</Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline">{agent.sseFormat}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleTest(agent.id)}>
                        <Zap className="mr-2 h-4 w-4" /> 测试连接
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>接入智能体</DialogTitle>
            <DialogDescription>配置智能体的接入信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如: 客服Agent" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">接口地址</label>
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
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleCreate}>接入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
