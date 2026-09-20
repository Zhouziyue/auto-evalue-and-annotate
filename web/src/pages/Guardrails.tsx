import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Shield, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

export default function Guardrails() {
  const [validators, setValidators] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [checkResult, setCheckResult] = useState<any>(null)
  const [formData, setFormData] = useState({ input: '', output: '' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchValidators() }, [])

  const fetchValidators = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/guardrails/validators')
      setValidators(res.data || [])
    } catch (e) {
      setValidators([])
    }
    setLoading(false)
  }

  const handleCheck = async () => {
    if (!formData.input && !formData.output) return
    try {
      const res = await axios.post('/api/eval/guardrails/check-both', {
        input: formData.input,
        output: formData.output,
      })
      setCheckResult(res.data)
      toastSuccess('检查完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '检查失败')
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await axios.post(`/api/eval/guardrails/validators/${id}/toggle`, { enabled: !enabled })
      toastSuccess(enabled ? '已禁用' : '已启用')
      fetchValidators()
    } catch (e) {
      toastError('操作失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2"><Shield className="h-5 w-5" /> 输出护栏</h3>
        <Button size="sm" onClick={() => setCheckOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />运行检查</Button>
      </div>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无验证器
                  </TableCell>
                </TableRow>
              ) : (
                validators.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell><Badge variant="outline">{v.type}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{v.description}</TableCell>
                    <TableCell>
                      {v.enabled ? (
                        <Badge className="bg-green-500/10 text-green-600">启用</Badge>
                      ) : (
                        <Badge variant="outline">禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(v.id, v.enabled)}>
                        {v.enabled ? '禁用' : '启用'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
      </Table>

      <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>运行护栏检查</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">输入内容</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.input}
                onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                placeholder="用户输入"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">输出内容</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.output}
                onChange={(e) => setFormData({ ...formData, output: e.target.value })}
                placeholder="AI 输出"
              />
            </div>
            {checkResult && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {checkResult.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">{checkResult.passed ? '通过' : '未通过'}</span>
                </div>
                {checkResult.issues && checkResult.issues.length > 0 && (
                  <div className="mt-2">
                    <label className="text-xs font-medium text-muted-foreground">问题：</label>
                    <ul className="mt-1 space-y-1">
                      {checkResult.issues.map((issue: any, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOpen(false)}>关闭</Button>
            <Button onClick={handleCheck} disabled={!formData.input && !formData.output}>检查</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
