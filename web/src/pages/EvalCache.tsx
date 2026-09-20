import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToastActions } from '@/components/ui/toast'
import { Database, Trash2, RefreshCw } from 'lucide-react'
import axios from 'axios'

export default function EvalCache() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/eval-cache/stats')
      setStats(res.data)
    } catch (e) {
      setStats(null)
    }
    setLoading(false)
  }

  const handleClear = async () => {
    try {
      await axios.post('/api/eval/eval-cache/clear')
      toastSuccess('缓存已清空')
      fetchStats()
    } catch (e) {
      toastError('清空失败')
    }
  }

  const handleClearExpired = async () => {
    try {
      await axios.post('/api/eval/eval-cache/clear-expired')
      toastSuccess('过期缓存已清理')
      fetchStats()
    } catch (e) {
      toastError('清理失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> 评测缓存
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearExpired}>
              <RefreshCw className="mr-2 h-4 w-4" /> 清理过期
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              <Trash2 className="mr-2 h-4 w-4" /> 清空缓存
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">总条目</div>
                <div className="mt-1 text-2xl font-bold">{stats.totalEntries || 0}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">命中次数</div>
                <div className="mt-1 text-2xl font-bold">{stats.hits || 0}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">未命中</div>
                <div className="mt-1 text-2xl font-bold">{stats.misses || 0}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">命中率</div>
                <div className="mt-1 text-2xl font-bold">
                  {stats.hitRate ? `${(stats.hitRate * 100).toFixed(1)}%` : '-'}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              暂无缓存数据
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
