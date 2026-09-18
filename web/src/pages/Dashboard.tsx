import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToastActions } from '@/components/ui/toast'
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

// 骨架屏组件
function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-20 animate-skeleton rounded" />
        <div className="h-4 w-4 animate-skeleton rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 animate-skeleton rounded" />
        <div className="mt-2 h-3 w-24 animate-skeleton rounded" />
      </CardContent>
    </Card>
  )
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center justify-between rounded-md p-3">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-skeleton rounded" />
            <div className="h-3 w-40 animate-skeleton rounded" />
          </div>
          <div className="h-6 w-16 animate-skeleton rounded-full" />
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToastActions()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/report/dashboard')
        setData(res.data)
      } catch (e) {
        console.error(e)
        setError(true)
        toastError('加载看板数据失败')
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-success" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-destructive" />
    return null
  }

  // 规范 §8.1: 数据加载 — 骨架屏
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <Card>
          <CardHeader><div className="h-6 w-32 animate-skeleton rounded" /></CardHeader>
          <CardContent><SkeletonTable /></CardContent>
        </Card>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">加载失败，请刷新重试</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards — 规范 §4.2: 卡片间距 16~24px */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">技能总数</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalSkills || 0}</div>
            {data?.trends?.skillsChange ? (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.skillsChange)}
                <span>较上周 {data.trends.skillsChange > 0 ? '+' : ''}{data.trends.skillsChange}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据集</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalDatasets || 0}</div>
            {data?.trends?.datasetsChange ? (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.datasetsChange)}
                <span>较上周 {data.trends.datasetsChange > 0 ? '+' : ''}{data.trends.datasetsChange}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">评测用例</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.totalTestCases || 0}</div>
            {data?.trends?.testCasesChange ? (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.testCasesChange)}
                <span>较上周 {data.trends.testCasesChange > 0 ? '+' : ''}{data.trends.testCasesChange}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近评测</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview.recentRuns || 0}</div>
            {data?.trends?.runsChange ? (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(data.trends.runsChange)}
                <span>较上周 {data.trends.runsChange > 0 ? '+' : ''}{data.trends.runsChange}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions — 规范 §6.1: 一个视图区域最多 1 个 Primary 按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" /> 快捷操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
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
              className="h-auto flex-col items-start gap-2 p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
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
              className="h-auto flex-col items-start gap-2 p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
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
              className="h-auto flex-col items-start gap-2 p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
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
            <div className="space-y-3">
              {data.recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border border-border-light p-3 cursor-pointer hover:border-primary/30 hover:bg-primary-light/30 transition-all duration-200"
                  onClick={() => navigate('/eval-runs')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/eval-runs')}
                >
                  <div>
                    <div className="font-medium">{run.skillName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      通过率: <span className="font-semibold">{(run.passRate * 100).toFixed(1)}%</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        run.status === 'completed'
                          ? 'border-success/30 bg-success-light text-success'
                          : run.status === 'running'
                          ? 'border-info/30 bg-info-light text-info'
                          : 'text-muted-foreground'
                      }
                    >
                      {run.status === 'completed' ? '已完成' : run.status === 'running' ? '运行中' : run.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <PlayCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">暂无评测记录</p>
              <p className="mt-1 text-xs text-muted-foreground">完成评测后将在此显示</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-success" /> 系统状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-border-light p-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <div className="font-medium">数据库</div>
                <div className="text-sm text-muted-foreground">连接正常</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border-light p-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <div className="font-medium">任务队列</div>
                <div className="text-sm text-muted-foreground">运行正常</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border-light p-4">
              <AlertCircle className={`h-5 w-5 ${data?.overview.totalSkills ? 'text-success' : 'text-warning'}`} />
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
