import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Trash2, Shield } from 'lucide-react'
import axios from 'axios'

export default function Anonymization() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [anonymizeOpen, setAnonymizeOpen] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({ text: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchRules() }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/anonymization/rules')
      setRules(res.data || [])
    } catch (e) {
      setRules([])
    }
    setLoading(false)
  }

  const handleAnonymize = async () => {
    if (!formData.text) return
    try {
      const res = await axios.post('/api/eval/anonymization/anonymize', { text: formData.text })
      setResult(res.data)
      toastSuccess('脱敏完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '脱敏失败')
    }
  }

  const handleDetect = async () => {
    if (!formData.text) return
    try {
      const res = await axios.post('/api/eval/anonymization/detect', { text: formData.text })
      setResult(res.data)
      toastSuccess('检测完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '检测失败')
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await axios.post(`/api/eval/anonymization/rules/${id}/toggle`, { enabled: !enabled })
      toastSuccess(enabled ? '已禁用' : '已启用')
      fetchRules()
    } catch (e) {
      toastError('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.post(`/api/eval/anonymization/rules/${id}/delete`)
      toastSuccess('规则已删除')
      fetchRules()
    } catch (e) {
      toastError('删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2"><Shield className="h-5 w-5" /> 数据脱敏</h3>
        <Button size="sm" onClick={() => setAnonymizeOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />运行脱敏</Button>
      </div>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>规则名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>模式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无规则
                  </TableCell>
                </TableRow>
              ) : (
                rules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{r.pattern}</TableCell>
                    <TableCell>
                      {r.enabled ? (
                        <Badge className="bg-green-500/10 text-green-600">启用</Badge>
                      ) : (
                        <Badge variant="outline">禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(r.id, r.enabled)}>
                          {r.enabled ? '禁用' : '启用'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>


      <Dialog open={anonymizeOpen} onOpenChange={setAnonymizeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>数据脱敏</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">输入文本</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="输入需要脱敏的文本..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAnonymize} disabled={!formData.text}>脱敏</Button>
              <Button variant="outline" onClick={handleDetect} disabled={!formData.text}>检测敏感数据</Button>
            </div>
            {result && (
              <div className="rounded-lg border p-4">
                <label className="text-sm font-medium">结果</label>
                <pre className="mt-2 text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre-wrap">
                  {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnonymizeOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
