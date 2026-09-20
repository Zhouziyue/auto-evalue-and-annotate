import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Users, Key, Shield } from 'lucide-react'
import axios from 'axios'

export default function Permissions() {
  const [users, setUsers] = useState<any[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [createKeyOpen, setCreateKeyOpen] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'viewer' })
  const [keyForm, setKeyForm] = useState({ name: '', userId: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchUsers()
    fetchApiKeys()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/permissions/users')
      setUsers(res.data || [])
    } catch (e) {
      setUsers([])
    }
    setLoading(false)
  }

  const fetchApiKeys = async () => {
    try {
      const res = await axios.get('/api/eval/permissions/api-keys')
      setApiKeys(res.data || [])
    } catch (e) {
      setApiKeys([])
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/eval/permissions/roles')
      setRoles(res.data || [])
    } catch (e) {}
  }

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email) return
    try {
      await axios.post('/api/eval/permissions/users', {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      })
      toastSuccess('用户创建成功')
      setCreateUserOpen(false)
      setUserForm({ name: '', email: '', role: 'viewer' })
      fetchUsers()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleCreateKey = async () => {
    if (!keyForm.name || !keyForm.userId) return
    try {
      const res = await axios.post('/api/eval/permissions/api-keys', {
        name: keyForm.name,
        userId: keyForm.userId,
      })
      toastSuccess('API Key 创建成功')
      setCreateKeyOpen(false)
      setKeyForm({ name: '', userId: '' })
      fetchApiKeys()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleRevokeKey = async (id: string) => {
    try {
      await axios.post(`/api/eval/permissions/api-keys/${id}/revoke`)
      toastSuccess('API Key 已撤销')
      fetchApiKeys()
    } catch (e) {
      toastError('撤销失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2"><Users className="h-5 w-5" /> 用户管理</h3>
        <Button size="sm" onClick={() => setCreateUserOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建用户</Button>
      </div>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    暂无用户
                  </TableCell>
                </TableRow>
              ) : (
                users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</h3>
        <Button size="sm" onClick={() => setCreateKeyOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />新建 Key</Button>
      </div>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无 API Key
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="font-mono text-xs">{k.key?.slice(0, 20)}...</TableCell>
                    <TableCell>{k.userId}</TableCell>
                    <TableCell><Badge>{k.revoked ? '已撤销' : '活跃'}</Badge></TableCell>
                    <TableCell>{new Date(k.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {!k.revoked && (
                        <Button variant="ghost" size="sm" onClick={() => handleRevokeKey(k.id)}>
                          撤销
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="用户名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱 *</label>
              <input
                type="email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">角色</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
                {roles.length === 0 && (
                  <>
                    <option value="admin">管理员</option>
                    <option value="editor">编辑</option>
                    <option value="viewer">查看者</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>取消</Button>
            <Button onClick={handleCreateUser} disabled={!userForm.name || !userForm.email}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createKeyOpen} onOpenChange={setCreateKeyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建 API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={keyForm.name}
                onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                placeholder="Key 名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">用户 *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={keyForm.userId}
                onChange={(e) => setKeyForm({ ...keyForm, userId: e.target.value })}
              >
                <option value="">选择用户</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateKeyOpen(false)}>取消</Button>
            <Button onClick={handleCreateKey} disabled={!keyForm.name || !keyForm.userId}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
