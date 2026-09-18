import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, Database, Bot, PlayCircle, TrendingUp, TrendingDown, Zap, FileText, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  trends?: {
    skillsChange: number
    datasetsChange: number
    testCasesChange: number
    runsChange: number
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />
    return null
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
            {data?.trends?.skillsChange && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.skillsChange)}
                <span>较上周 {data.trends.skillsChange > 0 ? '+' : ''}{data.trends.skillsChange}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据集</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalDatasets || 0}</div>
            {data?.trends?.datasetsChange && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.datasetsChange)}
                <span>较上周 {data.trends.datasetsChange > 0 ? '+' : ''}{data.trends.datasetsChange}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">评测用例</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalTestCases || 0}</div>
            {data?.trends?.testCasesChange && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.testCasesChange)}
                <span>较上周 {data.trends.testCasesChange > 0 ? '+' : ''}{data.trends.testCasesChange}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近评测</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.recentRuns || 0}</div>
            {data?.trends?.runsChange && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.runsChange)}
                <span>较上周 {data.trends.runsChange > 0 ? '+' : ''}{data.trends.runsChange}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> 快捷操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/skills')}
            >
              <Plus className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">新建技能</div>
                <div className="text-xs text-muted-foreground">创建评测技能</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/datasets')}
            >
              <Database className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">导入数据集</div>
                <div className="text-xs text-muted-foreground">导入测试用例</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/eval-runs')}
            >
              <PlayCircle className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">开始评测</div>
                <div className="text-xs text-muted-foreground">执行评测任务</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">查看报告</div>
                <div className="text-xs text-muted-foreground">评测报告详情</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>最近评测记录</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentRuns && data.recentRuns.length > 0 ? (
            <div className="space-y-4">
              {data.recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2"
                  onClick={() => navigate('/eval-runs')}
                >
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
                    <Badge
                      variant={run.status === 'completed' ? 'default' : run.status === 'running' ? 'secondary' : 'outline'}
                      className={
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : run.status === 'running'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {run.status === 'completed' ? '已完成' : run.status === 'running' ? '运行中' : run.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">暂无评测记录</div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> 系统状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">数据库</div>
                <div className="text-sm text-muted-foreground">连接正常</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">任务队列</div>
                <div className="text-sm text-muted-foreground">运行正常</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">LLM 服务</div>
                <div className="text-sm text-muted-foreground">
                  {data?.overview.totalSkills ? '已配置' : '未配置'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
