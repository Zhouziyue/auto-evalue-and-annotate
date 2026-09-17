import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlayCircle } from 'lucide-react'
import axios from 'axios'

export default function EvalRuns() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await axios.get('/api/eval-runs')
        setRuns(res.data)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    fetch()
  }, [])

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'running': return 'bg-blue-100 text-blue-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> 评测执行记录</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>状态</TableHead>
              <TableHead>总用例</TableHead>
              <TableHead>通过</TableHead>
              <TableHead>失败</TableHead>
              <TableHead>通过率</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>结束时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">加载中...</TableCell></TableRow>
            ) : runs.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">暂无评测记录</TableCell></TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </TableCell>
                  <TableCell>{run.totalCases}</TableCell>
                  <TableCell className="text-green-600">{run.passedCases}</TableCell>
                  <TableCell className="text-red-600">{run.failedCases}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {run.totalCases > 0 ? `${((run.passedCases / run.totalCases) * 100).toFixed(1)}%` : '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{run.startTime ? new Date(run.startTime).toLocaleString() : '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{run.endTime ? new Date(run.endTime).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
