import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Database, Bot, PlayCircle } from 'lucide-react'
import axios from 'axios'

interface DashboardData {
  overview: {
    totalSkills: number
    totalDatasets: number
    totalTestCases: number
    recentRuns: number
  }
  recentRuns: Array<{
    id: string
    skillName: string
    status: string
    passRate: number
    createdAt: string
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/reports/dashboard')
        setData(res.data)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">技能总数</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalSkills || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据集</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalDatasets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">评测用例</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalTestCases || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近评测</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.recentRuns || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>最近评测记录</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentRuns && data.recentRuns.length > 0 ? (
            <div className="space-y-4">
              {data.recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <div className="font-medium">{run.skillName}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      通过率: <span className="font-semibold">{(run.passRate * 100).toFixed(1)}%</span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : run.status === 'running'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">暂无评测记录</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
