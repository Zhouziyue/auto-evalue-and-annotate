import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BarChart3, FileText, Download, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react'
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

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/reports')
      setReports(res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleViewDetail = async (report: Report) => {
    try {
      const res = await axios.get(`/api/eval/reports/${report.id}`)
      setSelectedReport(res.data)
      setDetailOpen(true)
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await axios.post('/api/eval/reports/generate', {
        name: `评测报告 ${new Date().toLocaleDateString()}`,
      })
      await fetchReports()
    } catch (e) {
      console.error(e)
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
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-700">生成中</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">失败</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (previous === 0) return <Minus className="h-4 w-4 text-muted-foreground" />
    const diff = current - previous
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">加载中...</TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <div className="py-12">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">暂无评测报告</p>
                      <p className="mt-2 text-sm text-muted-foreground">完成评测后，可在此生成详细报告</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
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
                      <div className="flex justify-end gap-2">
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
                      <span className="text-green-600">{selectedReport.summary.passedCases} 通过</span>
                      {' / '}
                      <span className="text-red-600">{selectedReport.summary.failedCases} 失败</span>
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
                          <TableRow key={idx}>
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

              {/* 下载报告按钮 */}
              <div className="flex justify-end">
                <Button onClick={() => handleDownload(selectedReport.id)}>
                  <Download className="mr-2 h-4 w-4" /> 下载报告
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
