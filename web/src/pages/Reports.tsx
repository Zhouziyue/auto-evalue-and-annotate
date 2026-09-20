import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { BarChart3, FileText, Download, TrendingUp, TrendingDown, Minus, Plus, FileSpreadsheet, Sparkles } from 'lucide-react'
import axios from 'axios'

interface Report {
  id: string
  name: string
  evalRunId: string
  status: 'generating' | 'completed' | 'failed'
  summary: {
    totalCases: number
    passedCases: number
    failedCases: number
    passRate: number
    avgScore: number
    duration: number
  } | null
  metrics: Array<{
    name: string
    score: number
    details: string
  }>
  createdAt: string
  updatedAt: string
}

// 骨架屏
function SkeletonTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><div className="h-4 w-28 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-16 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-16 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-16 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-12 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-12 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-28 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-20 animate-skeleton rounded" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3].map(i => (
          <TableRow key={i}>
            <TableCell><div className="h-4 w-32 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-5 w-14 animate-skeleton rounded-full" /></TableCell>
            <TableCell><div className="h-4 w-14 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-4 w-14 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-4 w-8 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-4 w-10 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-4 w-32 animate-skeleton rounded" /></TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <div className="h-8 w-14 animate-skeleton rounded" />
                <div className="h-8 w-8 animate-skeleton rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      // 从 eval-runs 获取已完成的评测运行作为报告
      const res = await axios.get('/api/report/eval-runs')
      // 将 evalRuns 转换为报告格式
      const reports = (res.data || []).map((run: any) => ({
        id: run.id,
        name: `评测报告 - ${run.skillName || '未命名'}`,
        evalRunId: run.id,
        status: run.status === 'completed' ? 'completed' : run.status === 'running' ? 'generating' : 'failed',
        summary: {
          totalCases: run.totalCases || 0,
          passedCases: run.passedCases || 0,
          failedCases: run.failedCases || 0,
          passRate: run.totalCases ? (run.passedCases || 0) / run.totalCases : 0,
          avgScore: run.avgScore || 0,
          duration: run.duration || 0,
        },
        metrics: [],
        createdAt: run.createdAt,
        updatedAt: run.updatedAt || run.createdAt,
      }))
      setReports(reports)
    } catch (e) {
      console.error(e)
      toastError('加载报告列表失败')
    }
    setLoading(false)
  }

  const handleViewDetail = async (report: Report) => {
    try {
      // 使用 evalRunId 获取详情
      const res = await axios.get(`/api/report/eval-runs/${report.evalRunId}`)
      const run = res.data
      setSelectedReport({
        ...report,
        summary: {
          totalCases: run.totalCases || 0,
          passedCases: run.passedCases || 0,
          failedCases: run.failedCases || 0,
          passRate: run.totalCases ? (run.passedCases || 0) / run.totalCases : 0,
          avgScore: run.avgScore || 0,
          duration: run.duration || 0,
        },
      })
      setDetailOpen(true)
    } catch (e) {
      toastError('获取报告详情失败')
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // 获取最新的评测运行来生成报告
      const runsRes = await axios.get('/api/report/eval-runs')
      const completedRuns = runsRes.data.filter((r: any) => r.status === 'completed')
      if (completedRuns.length === 0) {
        toastError('没有已完成的评测运行，无法生成报告')
        return
      }
      // 使用最新的评测运行生成报告
      const latestRun = completedRuns[0]
      await axios.post(`/api/report/generate/${latestRun.id}`)
      await fetchReports()
      toastSuccess('报告生成成功')
    } catch (e) {
      toastError('报告生成失败')
    }
    setGenerating(false)
  }

  const handleDownload = async (reportId: string) => {
    try {
      const res = await axios.get(`/api/eval/reports/${reportId}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${reportId}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('报告下载成功')
    } catch (e) {
      toastError('下载失败')
    }
  }

  const handleExportCsv = async (reportId: string) => {
    try {
      const res = await axios.get(`/api/report/${reportId}/export/csv`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${reportId}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('CSV 导出成功')
    } catch (e) {
      toastError('CSV 导出失败')
    }
  }

  const handleExportExcel = async (reportId: string) => {
    try {
      const res = await axios.get(`/api/report/${reportId}/export/excel`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${reportId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('Excel 导出成功')
    } catch (e) {
      toastError('Excel 导出失败')
    }
  }

  const handleAiAnalysis = async (evalRunId: string) => {
    setAiAnalyzing(true)
    setAiAnalysis(null)
    try {
      const res = await axios.post(`/api/report/ai-analysis/${evalRunId}`)
      setAiAnalysis(res.data.analysis || res.data.result || JSON.stringify(res.data, null, 2))
      toastSuccess('AI 分析完成')
    } catch (e) {
      toastError('AI 分析失败')
    }
    setAiAnalyzing(false)
  }

  // 规范 §7.3: 语义色映射
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="border-success/30 bg-success-light text-success">已完成</Badge>
      case 'generating':
        return <Badge className="border-info/30 bg-info-light text-info">生成中</Badge>
      case 'failed':
        return <Badge className="border-destructive/30 bg-error-light text-destructive">失败</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success'
    if (score >= 0.6) return 'text-warning'
    return 'text-destructive'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (previous === 0) return <Minus className="h-4 w-4 text-muted-foreground" />
    const diff = current - previous
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-success" />
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-destructive" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">评测报告</h2>
        <Button onClick={handleGenerate} disabled={generating}>
          <Plus className="mr-2 h-4 w-4" />
          {generating ? '生成中...' : '生成报告'}
        </Button>
      </div>

      {/* 报告列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> 报告列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonTable /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-center">通过率</TableHead>
                  <TableHead className="text-center">平均分</TableHead>
                  <TableHead className="text-center">用例数</TableHead>
                  <TableHead className="text-center">耗时</TableHead>
                  <TableHead>生成时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <div className="py-12">
                        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
                        <p className="mt-4 text-muted-foreground">暂无评测报告</p>
                        <p className="mt-1 text-xs text-muted-foreground">完成评测后，可在此生成详细报告</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50 transition-colors duration-150">
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-center">
                        {report.summary ? (
                          <span className={`font-semibold ${getScoreColor(report.summary.passRate)}`}>
                            {(report.summary.passRate * 100).toFixed(1)}%
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.summary ? (
                          <span className={`font-semibold ${getScoreColor(report.summary.avgScore)}`}>
                            {(report.summary.avgScore * 100).toFixed(1)}%
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.summary ? report.summary.totalCases : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.summary ? `${(report.summary.duration / 1000).toFixed(1)}s` : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(report.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(report)}
                            disabled={report.status !== 'completed'}
                          >
                            查看
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.id)}
                            disabled={report.status !== 'completed'}
                            aria-label="下载报告"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 报告详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedReport?.name}
            </DialogTitle>
            <DialogDescription>报告详情</DialogDescription>
          </DialogHeader>
          {selectedReport && selectedReport.summary && (
            <div className="space-y-6">
              {/* 概览区 */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">通过率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedReport.summary.passRate)}`}>
                      {(selectedReport.summary.passRate * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedReport.summary.passedCases}/{selectedReport.summary.totalCases} 通过
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">平均分</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedReport.summary.avgScore)}`}>
                      {(selectedReport.summary.avgScore * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总用例</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedReport.summary.totalCases}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">{selectedReport.summary.passedCases} 通过</span>
                      {' / '}
                      <span className="text-destructive">{selectedReport.summary.failedCases} 失败</span>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">耗时</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(selectedReport.summary.duration / 1000).toFixed(1)}s
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 指标明细 */}
              {selectedReport.metrics && selectedReport.metrics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">指标明细</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>指标名称</TableHead>
                          <TableHead className="text-center">得分</TableHead>
                          <TableHead>说明</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.metrics.map((metric, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/50 transition-colors duration-150">
                            <TableCell className="font-medium">{metric.name}</TableCell>
                            <TableCell className="text-center">
                              <span className={`font-semibold ${getScoreColor(metric.score)}`}>
                                {(metric.score * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{metric.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* 报告操作按钮 */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleAiAnalysis(selectedReport.evalRunId)}
                  disabled={aiAnalyzing}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {aiAnalyzing ? '分析中...' : 'AI 智能分析'}
                </Button>
                <Button variant="outline" onClick={() => handleExportCsv(selectedReport.id)}>
                  <FileText className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" onClick={() => handleExportExcel(selectedReport.id)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                </Button>
                <Button onClick={() => handleDownload(selectedReport.id)}>
                  <Download className="mr-2 h-4 w-4" /> JSON
                </Button>
              </div>

              {/* AI 分析结果 */}
              {aiAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI 智能分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm bg-muted/50 rounded-md p-4 max-h-96 overflow-y-auto">
                      {aiAnalysis}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
