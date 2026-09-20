import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Eye, Scale } from 'lucide-react'
import axios from 'axios'

export default function LLMJudge() {
  const [results, setResults] = useState<any[]>([])
  const [rubrics, setRubrics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ input: '', output: '', rubricId: 'helpfulness' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchRubrics()
  }, [])

  const fetchRubrics = async () => {
    try {
      const res = await axios.get('/api/eval/judge/rubrics')
      setRubrics(res.data || [])
      if (res.data?.length > 0) {
        setFormData({ ...formData, rubricId: res.data[0].id })
      }
    } catch (e) {}
  }

  const handleRun = async () => {
    if (!formData.input || !formData.output) return
    try {
      const res = await axios.post('/api/eval/judge/run', {
        rubricId: formData.rubricId,
        type: 'single_point',
        input: formData.input,
        output: formData.output,
      })
      toastSuccess('LLM 评判完成')
      setResults([res.data, ...results])
      setCreateOpen(false)
      setFormData({ input: '', output: '', rubricId: rubrics[0]?.id || 'helpfulness' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '评判失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" /> LLM 评判
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行评判
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>输入</TableHead>
                <TableHead>输出</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>置信度</TableHead>
                <TableHead>用时</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无评判记录
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-xs truncate">{r.input}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.output}</TableCell>
                    <TableCell><Badge>{(r.score * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell>{(r.confidence * 100).toFixed(1)}%</TableCell>
                    <TableCell>{r.latency}ms</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>评判标准（Rubrics）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>标准</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rubrics.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{r.description}</TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.criteria?.slice(0, 3).map((c: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>运行 LLM 评判</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">评判标准 *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.rubricId}
                onChange={(e) => setFormData({ ...formData, rubricId: e.target.value })}
              >
                {rubrics.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">输入 *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.input}
                onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                placeholder="用户问题"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">输出 *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.output}
                onChange={(e) => setFormData({ ...formData, output: e.target.value })}
                placeholder="AI 回答"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRun} disabled={!formData.input || !formData.output}>评判</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
