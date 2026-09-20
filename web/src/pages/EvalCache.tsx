import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToastActions } from '@/components/ui/toast'
import { Database, Trash2, RefreshCw } from 'lucide-react'
import axios from 'axios'

export default function EvalCache() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchStats() }, [])
  const fetchStats = async () => { setLoading(true); try { const res = await axios.get('/api/eval/eval-cache/stats'); setStats(res.data) } catch (e) { setStats(null) }; setLoading(false) }
  const handleClear = async () => { try { await axios.post('/api/eval/eval-cache/clear'); toastSuccess('已清空'); fetchStats() } catch (e) { toastError('清空失败') } }
  const handleClearExpired = async () => { try { await axios.post('/api/eval/eval-cache/clear-expired'); toastSuccess('已清理'); fetchStats() } catch (e) { toastError('清理失败') } }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">总条目</span> <span className="font-bold">{stats?.totalEntries || 0}</span></span>
          <span><span className="text-muted-foreground">命中</span> <span className="font-bold">{stats?.hits || 0}</span></span>
          <span><span className="text-muted-foreground">未命中</span> <span className="font-bold">{stats?.misses || 0}</span></span>
          <span><span className="text-muted-foreground">命中率</span> <span className="font-bold">{stats?.hitRate ? (stats.hitRate * 100).toFixed(1) + '%' : '-'}</span></span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClearExpired}><RefreshCw className="mr-2 h-3.5 w-3.5" />清理过期</Button>
          <Button variant="destructive" size="sm" onClick={handleClear}><Trash2 className="mr-2 h-3.5 w-3.5" />清空</Button>
        </div>
      </div>
      {!stats && <div className="py-12 text-center text-muted-foreground">暂无缓存数据</div>}
    </div>
  )
}
