import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Shield, AlertTriangle } from 'lucide-react'
import axios from 'axios'

export default function RedTeam() {
  const [results, setResults] = useState<any[]>([])
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ targetPrompt: '', plugins: [] as string[] })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchPlugins()
  }, [])

  const fetchPlugins = async () => {
    try {
      const res = await axios.get('/api/eval/redteam/plugins')
      setPlugins(res.data?.plugins || [])
    } catch (e) {}
  }

  const handleRun = async () => {
    if (!formData.targetPrompt || formData.plugins.length === 0) return
    try {
      const res = await axios.post('/api/eval/redteam', {
        targetPrompt: formData.targetPrompt,
        plugins: formData.plugins,
        numTestsPerPlugin: 3,
      })
      toastSuccess('红队测试完成')
      setResults([res.data, ...results])
      setCreateOpen(false)
      setFormData({ targetPrompt: '', plugins: [] })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '测试失败')
    }
  }

  const togglePlugin = (pluginId: string) => {
    setFormData(prev => ({
      ...prev,
      plugins: prev.plugins.includes(pluginId)
        ? prev.plugins.filter(p => p !== pluginId)
        : [...prev.plugins, pluginId]
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2"><Shield className="h-5 w-5 text-red-500" /> 红队测试</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />运行测试</Button>
      </div>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>测试时间</TableHead>
                <TableHead>插件数</TableHead>
                <TableHead>攻击数</TableHead>
                <TableHead>成功率</TableHead>
                <TableHead>漏洞数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无测试记录
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(r.timestamp || Date.now()).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{r.pluginCount || 0}</Badge></TableCell>
                    <TableCell>{r.attackCount || 0}</TableCell>
                    <TableCell><Badge variant="destructive">{((r.successRate || 0) * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell>
                      <Badge className={r.vulnerabilities > 0 ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}>
                        {r.vulnerabilities || 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>运行红队测试</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">目标系统 Prompt *</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.targetPrompt}
                onChange={(e) => setFormData({ ...formData, targetPrompt: e.target.value })}
                placeholder="目标 AI 的系统提示词"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">攻击插件 *</label>
              <div className="grid grid-cols-2 gap-2">
                {plugins.map(p => (
                  <label key={p.id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={formData.plugins.includes(p.id)}
                      onChange={() => togglePlugin(p.id)}
                      className="rounded"
                    />
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRun} disabled={!formData.targetPrompt || formData.plugins.length === 0}>运行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
