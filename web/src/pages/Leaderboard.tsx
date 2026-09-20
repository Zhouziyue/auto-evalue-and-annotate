import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react'
import axios from 'axios'

interface LeaderboardEntry {
  rank: number
  modelId: string
  modelName: string
  overallScore: number
  metrics: Record<string, number>
  totalEvaluations: number
  avgLatency: number
  lastEvaluatedAt: string
}

interface LeaderboardSummary {
  totalModels: number
  totalEvaluations: number
  topModel: { id: string; name: string; score: number } | null
  recentActivity: { date: string; evaluations: number; avgScore: number }[]
}

// 骨架屏
function SkeletonTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><div className="h-4 w-12 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-28 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-16 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-12 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-16 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-24 animate-skeleton rounded" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map(i => (
          <TableRow key={i}>
            <TableCell><div className="h-5 w-8 animate-skeleton rounded-full mx-auto" /></TableCell>
            <TableCell><div className="h-4 w-32 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-4 w-14 animate-skeleton rounded mx-auto" /></TableCell>
            <TableCell><div className="h-5 w-10 animate-skeleton rounded-full mx-auto" /></TableCell>
            <TableCell><div className="h-4 w-14 animate-skeleton rounded mx-auto" /></TableCell>
            <TableCell><div className="h-4 w-24 animate-skeleton rounded" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [summary, setSummary] = useState<LeaderboardSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leaderboardRes, summaryRes] = await Promise.all([
        axios.post('/api/eval/leaderboard', {
          name: '默认排行榜',
          metricWeights: { passRate: 1 },
        }),
        axios.get('/api/eval/leaderboard/summary'),
      ])
      setEntries(leaderboardRes.data.entries || [])
      setSummary(summaryRes.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-muted-foreground" />
      case 3: return <Award className="h-5 w-5 text-warning" />
      default: return <span className="text-muted-foreground">#{rank}</span>
    }
  }

  // 规范 §7.3: 语义色映射
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success'
    if (score >= 0.6) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="space-y-4">
      {/* 摘要卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模型总数</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalModels || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">评测总数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEvaluations || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最佳模型</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {summary?.topModel?.name || '-'}
            </div>
            {summary?.topModel && (
              <div className="text-sm text-muted-foreground">
                得分: {(summary.topModel.score * 100).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日评测</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.recentActivity?.[0]?.evaluations || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 排行榜表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> 模型排行榜
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonTable /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">排名</TableHead>
                  <TableHead>模型名称</TableHead>
                  <TableHead className="text-center">综合得分</TableHead>
                  <TableHead className="text-center">评测次数</TableHead>
                  <TableHead className="text-center">平均延迟</TableHead>
                  <TableHead>最后评测</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <div className="py-12">
                        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/40" />
                        <p className="mt-4 text-muted-foreground">暂无评测数据</p>
                        <p className="mt-1 text-xs text-muted-foreground">完成评测后，模型排行会显示在此处</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.modelId} className="hover:bg-muted/50 transition-colors duration-150">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{entry.modelName}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getScoreColor(entry.overallScore)}`}>
                          {(entry.overallScore * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{entry.totalEvaluations}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {entry.avgLatency > 0 ? `${entry.avgLatency.toFixed(0)}ms` : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(entry.lastEvaluatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 最近活动 */}
      {summary?.recentActivity && summary.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近活动（7天）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recentActivity.map((activity) => (
                <div key={activity.date} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{activity.date}</span>
                    <Badge variant="outline">{activity.evaluations} 次评测</Badge>
                  </div>
                  <span className={`font-medium ${getScoreColor(activity.avgScore)}`}>
                    平均分: {(activity.avgScore * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
