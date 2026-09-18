import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { GitBranch, Play, Plus, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

const presets = [
  { id: 'quick', name: '快速评测', desc: '执行 → 规则评测 → 出报告', nodes: 3, icon: '⚡' },
  { id: 'full', name: '完整评测', desc: '执行 → 规则评测 → AI评测 → 标注 → 修复 → 再验证', nodes: 6, icon: '🔬' },
  { id: 'regression', name: '回归评测', desc: '执行 → 对比上一版本 → 告警', nodes: 3, icon: '🔄' },
]

interface PipelineExecution {
  id: string
  pipelineName: string
  status: 'running' | 'completed' | 'failed'
  startTime: string
  endTime: string | null
  duration: number | null
}

export default function Pipelines() {
  const [executions, setExecutions] = useState<PipelineExecution[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [customPipeline, setCustomPipeline] = useState({ name: '', description: '', nodes: '' })
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchExecutions()
  }, [])

  const fetchExecutions = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/pipelines/executions')
      setExecutions(res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleRunPreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return

    setRunningIds(prev => new Set(prev).add(presetId))
    try {
      await axios.post('/api/eval/pipelines/run', {
        type: 'preset',
        presetId: preset.id,
        name: preset.name,
      })
      await fetchExecutions()
    } catch (e) {
      console.error(e)
    }
    setRunningIds(prev => {
      const next = new Set(prev)
      next.delete(presetId)
      return next
    })
  }

  const handleCreateCustom = async () => {
    if (!customPipeline.name) return
    try {
      await axios.post('/api/eval/pipelines/create', {
        name: customPipeline.name,
        description: customPipeline.description,
        nodes: customPipeline.nodes.split(',').map(n => n.trim()).filter(Boolean),
      })
      setCreateOpen(false)
      setCustomPipeline({ name: '', description: '', nodes: '' })
      await fetchExecutions()
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />完成</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700"><Loader2 className="mr-1 h-3 w-3 animate-spin" />运行中</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="mr-1 h-3 w-3" />失败</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 预设流水线 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> 评测流水线</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 自定义流水线
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {presets.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>{p.icon}</span> {p.name}
                  </h3>
                  <Badge variant="secondary">{p.nodes} 节点</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  onClick={() => handleRunPreset(p.id)}
                  disabled={runningIds.has(p.id)}
                >
                  {runningIds.has(p.id) ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 执行中...</>
                  ) : (
                    <><Play className="mr-2 h-4 w-4" /> 立即执行</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 执行历史 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> 执行历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>流水线</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>结束时间</TableHead>
                <TableHead className="text-center">耗时</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">加载中...</TableCell>
                </TableRow>
              ) : executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="py-8">
                      <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">暂无执行记录</p>
                      <p className="mt-2 text-sm text-muted-foreground">点击上方"立即执行"开始运行流水线</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((exec) => (
                  <TableRow key={exec.id}>
                    <TableCell className="font-medium">{exec.pipelineName}</TableCell>
                    <TableCell>{getStatusBadge(exec.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(exec.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {exec.endTime ? new Date(exec.endTime).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 自定义流水线弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>自定义流水线</DialogTitle>
            <DialogDescription>创建自定义评测流水线</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">流水线名称 <span className="text-red-500">*</span></label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={customPipeline.name}
                onChange={(e) => setCustomPipeline({ ...customPipeline, name: e.target.value })}
                placeholder="如: 自定义评测流程"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={customPipeline.description}
                onChange={(e) => setCustomPipeline({ ...customPipeline, description: e.target.value })}
                placeholder="流水线描述"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">节点（逗号分隔）</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={customPipeline.nodes}
                onChange={(e) => setCustomPipeline({ ...customPipeline, nodes: e.target.value })}
                placeholder="如: execute, rule-eval, ai-eval, annotate"
              />
              <p className="text-xs text-muted-foreground">
                可用节点: execute, rule-eval, ai-eval, annotate, fix, verify, report
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreateCustom} disabled={!customPipeline.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
