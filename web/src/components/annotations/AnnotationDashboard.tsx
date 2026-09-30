import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToastActions } from '@/components/ui/toast'
import { BarChart3, AlertTriangle, Users, FileSearch, ArrowRight } from 'lucide-react'
import axios from 'axios'

interface DashboardMetrics {
  pendingReview: number
  conflicts: number
  approved: number
  rejected: number
  modified: number
  totalAi: number
  totalHuman: number
  reviewRate: number
  avgAgreement: number | null
  annotatorStats: Array<{ annotatorId: string; total: number; conflicts: number }>
}

interface ConflictItem {
  id: string
  input: string
  confidence: number
  scoreDiffs: Array<{ dimension: string; aiScore: number; humanScore: number; diff: number }>
  reviewedBy?: string
}

interface ConsistencyReport {
  datasetId: string
  totalAnnotations: number
  totalAnnotators: number
  overallAgreement: number
  fleissKappa: number
  krippendorffAlpha: number
  perCategoryAgreement: Record<string, number>
  disagreements: Array<{ testCaseId: string; input: string; agreementLevel: number; severity: string }>
  suggestions: string[]
}

interface DashboardProps {
  onGoWorkbench: (status?: string) => void
}

// 一致性 & 质量看板：暴露冲突检测、一致性报告与标注员统计
export default function AnnotationDashboard({ onGoWorkbench }: DashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [conflicts, setConflicts] = useState<ConflictItem[]>([])
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [report, setReport] = useState<ConsistencyReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const { toastError } = useToastActions()

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, conflictRes] = await Promise.all([
        axios.get('/api/annotation/dashboard'),
        axios.get('/api/annotation/conflicts'),
      ])
      setMetrics(dashRes.data || null)
      setConflicts(conflictRes.data || [])
    } catch (e) {
      console.error(e)
      toastError('加载看板数据失败')
    }
    try {
      const dsRes = await axios.get('/api/datasets')
      setDatasets(Array.isArray(dsRes.data) ? dsRes.data : (dsRes.data?.items || []))
    } catch {
      setDatasets([])
    }
  }, [toastError])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const generateReport = async () => {
    if (!selectedDatasetId) return
    setReportLoading(true)
    try {
      const res = await axios.get(`/api/annotation/consistency/${selectedDatasetId}`)
      setReport(res.data)
    } catch (e) {
      toastError('生成一致性报告失败')
    }
    setReportLoading(false)
  }

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="border-destructive/30 bg-error-light text-destructive">高</Badge>
      case 'medium':
        return <Badge className="border-warning/30 bg-warning-light text-warning">中</Badge>
      default:
        return <Badge variant="outline">低</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* 核心指标条 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-md border bg-card px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">AI 标注总量</span>
          <span className="text-lg font-bold">{metrics?.totalAi ?? '-'}</span>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">人工最终标注</span>
          <span className="text-lg font-bold text-info">{metrics?.totalHuman ?? '-'}</span>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">审核率</span>
          <span className="text-lg font-bold text-success">{metrics ? `${(metrics.reviewRate * 100).toFixed(0)}%` : '-'}</span>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">人机一致性</span>
          <span className="text-lg font-bold text-warning">
            {metrics?.avgAgreement != null ? `${(metrics.avgAgreement * 100).toFixed(0)}%` : '-'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 冲突列表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" /> 标注冲突（{conflicts.length}）
            </CardTitle>
            {conflicts.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => onGoWorkbench('conflict')} className="gap-1">
                去仲裁 <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {conflicts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无冲突，AI 与人工评分一致性良好</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>输入</TableHead>
                    <TableHead>维度差异</TableHead>
                    <TableHead className="text-center">审核人</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.slice(0, 20).map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="max-w-[160px] truncate text-xs">{item.input}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.scoreDiffs.filter(d => d.diff > 0.3).map(d => (
                            <Badge key={d.dimension} className="border-destructive/30 bg-error-light text-destructive text-xs">
                              {d.dimension} Δ{(d.diff * 100).toFixed(0)}%
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{item.reviewedBy || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 标注员统计 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-info" /> 标注员统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!metrics || metrics.annotatorStats.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无人工标注记录</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标注员</TableHead>
                    <TableHead className="text-center">最终标注数</TableHead>
                    <TableHead className="text-center">涉及冲突</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.annotatorStats.map(stat => (
                    <TableRow key={stat.annotatorId} className="hover:bg-muted/50">
                      <TableCell className="text-sm font-medium">{stat.annotatorId}</TableCell>
                      <TableCell className="text-center text-sm">{stat.total}</TableCell>
                      <TableCell className="text-center text-sm text-destructive">{stat.conflicts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 数据集一致性报告 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-4 w-4" /> 数据集标注一致性报告
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              className="flex h-9 w-72 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
            >
              <option value="">选择数据集...</option>
              {datasets.map((ds: any) => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </select>
            <Button size="sm" onClick={generateReport} disabled={!selectedDatasetId || reportLoading} className="gap-2">
              {reportLoading ? (
                <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 生成中...</>
              ) : (
                <><BarChart3 className="h-4 w-4" /> 生成报告</>
              )}
            </Button>
          </div>

          {report && (
            <div className="space-y-4">
              {/* 一致性核心指标 */}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <div className="text-xl font-bold">{(report.overallAgreement * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">总体一致率</div>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <div className="text-xl font-bold">{report.fleissKappa.toFixed(3)}</div>
                  <div className="text-xs text-muted-foreground">Fleiss Kappa</div>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <div className="text-xl font-bold">{report.krippendorffAlpha.toFixed(3)}</div>
                  <div className="text-xs text-muted-foreground">Krippendorff α</div>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <div className="text-xl font-bold">{report.totalAnnotations}</div>
                  <div className="text-xs text-muted-foreground">标注总数</div>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <div className="text-xl font-bold">{report.totalAnnotators}</div>
                  <div className="text-xs text-muted-foreground">标注员数</div>
                </div>
              </div>

              {/* 分维度一致率条形图 */}
              {Object.keys(report.perCategoryAgreement || {}).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">分维度一致率</h4>
                  {Object.entries(report.perCategoryAgreement).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-24 truncate text-xs text-muted-foreground">{key}</span>
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${value >= 0.8 ? 'bg-success' : value >= 0.6 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${(value * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs">{(value * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 建议 */}
              {report.suggestions?.length > 0 && (
                <div className="rounded-md bg-info-light p-3">
                  <h4 className="text-sm font-medium">系统建议</h4>
                  <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                    {report.suggestions.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              )}

              {/* 分歧列表 */}
              {report.disagreements?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">分歧条目（{report.disagreements.length}）</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>输入</TableHead>
                        <TableHead className="text-center">一致度</TableHead>
                        <TableHead className="text-center">严重度</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.disagreements.slice(0, 10).map((d, i) => (
                        <TableRow key={i} className="hover:bg-muted/50">
                          <TableCell className="max-w-[300px] truncate text-xs">{d.input}</TableCell>
                          <TableCell className="text-center text-xs">{(d.agreementLevel * 100).toFixed(0)}%</TableCell>
                          <TableCell className="text-center">{severityBadge(d.severity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
