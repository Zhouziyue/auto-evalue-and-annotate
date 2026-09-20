import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToastActions } from '@/components/ui/toast'
import { Activity, DollarSign, Clock, Cpu, Zap, AlertTriangle } from 'lucide-react'
import axios from 'axios'

interface ObservabilityStats {
  totalCalls: number
  totalTokens: number
  totalCost: number
  avgLatency: number
  errorRate: number
  modelBreakdown: {
    model: string
    calls: number
    tokens: number
    cost: number
    avgLatency: number
  }[]
  hourlyDistribution: {
    hour: string
    calls: number
    tokens: number
    cost: number
  }[]
  p50Latency: number
  p95Latency: number
  p99Latency: number
}

interface LLMRecord {
  id: string
  model: string
  provider: string
  timestamp: string
  latency: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  status: 'success' | 'error'
  errorMessage?: string
}

// 骨架屏
function SkeletonCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-20 animate-skeleton rounded" />
            <div className="h-4 w-4 animate-skeleton rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 animate-skeleton rounded" />
            <div className="mt-2 h-3 w-32 animate-skeleton rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function Observability() {
  const [stats, setStats] = useState<ObservabilityStats | null>(null)
  const [records, setRecords] = useState<LLMRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [hours, setHours] = useState(24)
  const { toastError } = useToastActions()

  useEffect(() => {
    fetchData()
  }, [hours])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, recordsRes] = await Promise.all([
        axios.get(`/api/eval/observability/stats?hours=${hours}`),
        axios.get(`/api/eval/observability/records?hours=${hours}&limit=50`),
      ])
      setStats(statsRes.data)
      setRecords(recordsRes.data)
    } catch (e) {
      console.error(e)
      toastError('加载监控数据失败')
    }
    setLoading(false)
  }

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(2)}`
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-4">
      {/* 时间范围选择 */}
      <div className="flex gap-2">
        {[1, 6, 24, 72].map(h => (
          <Button
            key={h}
            variant={hours === h ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHours(h)}
          >
            {h < 24 ? `${h}h` : `${h / 24}d`}
          </Button>
        ))}
      </div>

      {/* 统计卡片 */}
      {loading ? <SkeletonCards /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总调用次数</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCalls || 0}</div>
              <p className="text-xs text-muted-foreground">
                错误率: {((stats?.errorRate || 0) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总 Token 数</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalTokens ? (stats.totalTokens / 1000).toFixed(1) + 'K' : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                平均 {stats?.totalCalls ? Math.round(stats.totalTokens / stats.totalCalls) : 0} tokens/次
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总成本</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(stats?.totalCost || 0)}</div>
              <p className="text-xs text-muted-foreground">
                平均 {stats?.totalCalls ? formatCost(stats.totalCost / stats.totalCalls) : '$0'}/次
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均延迟</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatLatency(stats?.avgLatency || 0)}</div>
              <p className="text-xs text-muted-foreground">
                P95: {formatLatency(stats?.p95Latency || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 延迟分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> 延迟分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center hover:shadow-sm transition-shadow duration-200">
              <div className="text-sm text-muted-foreground">P50</div>
              <div className="text-xl font-bold">{formatLatency(stats?.p50Latency || 0)}</div>
            </div>
            <div className="rounded-lg border p-4 text-center hover:shadow-sm transition-shadow duration-200">
              <div className="text-sm text-muted-foreground">P95</div>
              <div className="text-xl font-bold text-warning">{formatLatency(stats?.p95Latency || 0)}</div>
            </div>
            <div className="rounded-lg border p-4 text-center hover:shadow-sm transition-shadow duration-200">
              <div className="text-sm text-muted-foreground">P99</div>
              <div className="text-xl font-bold text-destructive">{formatLatency(stats?.p99Latency || 0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 模型分布 */}
      {stats?.modelBreakdown && stats.modelBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> 模型使用分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模型</TableHead>
                  <TableHead className="text-center">调用次数</TableHead>
                  <TableHead className="text-center">Token 数</TableHead>
                  <TableHead className="text-center">成本</TableHead>
                  <TableHead className="text-center">平均延迟</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.modelBreakdown.map((m) => (
                  <TableRow key={m.model} className="hover:bg-muted/50 transition-colors duration-150">
                    <TableCell className="font-medium">{m.model}</TableCell>
                    <TableCell className="text-center">{m.calls}</TableCell>
                    <TableCell className="text-center">{(m.tokens / 1000).toFixed(1)}K</TableCell>
                    <TableCell className="text-center">{formatCost(m.cost)}</TableCell>
                    <TableCell className="text-center">{formatLatency(m.avgLatency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 最近调用记录 */}
      <Card>
        <CardHeader>
          <CardTitle>最近调用记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-center">延迟</TableHead>
                <TableHead className="text-center">Tokens</TableHead>
                <TableHead className="text-center">成本</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 py-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <div className="py-12">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4 text-muted-foreground">暂无记录</p>
                      <p className="mt-1 text-xs text-muted-foreground">调用 LLM 后，记录会显示在此处</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50 transition-colors duration-150">
                    <TableCell className="text-muted-foreground">
                      {new Date(r.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{r.model}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'success' ? 'default' : 'destructive'}>
                        {r.status === 'success' ? '成功' : '失败'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{formatLatency(r.latency)}</TableCell>
                    <TableCell className="text-center">{r.totalTokens}</TableCell>
                    <TableCell className="text-center">{formatCost(r.cost)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
