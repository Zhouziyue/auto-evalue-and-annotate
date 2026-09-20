import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Database, Target, Zap, Clock, Search, Trash2, Settings, RefreshCw, BarChart3, Eye } from 'lucide-react'
import axios from 'axios'

interface CacheEntry {
  id: string
  query: string
  cachedResult: string
  similarity: number
  hitCount: number
  tags: string[]
  createdAt: string
  expiresAt: string
}

interface CacheStats {
  totalEntries: number
  hitRate: number
  totalHits: number
  avgLatency: number
}

interface CacheConfig {
  enabled: boolean
  threshold: number
  maxEntries: number
  ttl: number
}

export default function SemanticCache() {
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [config, setConfig] = useState<CacheConfig>({ enabled: true, threshold: 0.85, maxEntries: 10000, ttl: 3600 })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<CacheEntry | null>(null)
  const [warmupOpen, setWarmupOpen] = useState(false)
  const [warmupData, setWarmupData] = useState('')
  const [warmupLoading, setWarmupLoading] = useState(false)
  const [trendData, setTrendData] = useState<any[]>([])
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchEntries()
    fetchStats()
    fetchConfig()
    fetchTrend()
  }, [])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/cache/entries')
      setEntries(res.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/eval/cache/stats')
      setStats(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/eval/cache/config')
      if (res.data) setConfig(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTrend = async () => {
    try {
      const res = await axios.get('/api/eval/cache/hit-rate-trend')
      setTrendData(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleLookup = async () => {
    if (!lookupQuery) return
    setLookupLoading(true)
    try {
      const res = await axios.get('/api/eval/cache/lookup', { params: { query: lookupQuery } })
      setLookupResult(res.data)
    } catch (e: any) {
      toastError('查询失败')
    }
    setLookupLoading(false)
  }

  const handleSaveConfig = async () => {
    try {
      await axios.post('/api/eval/cache/config', config)
      toastSuccess('缓存配置已保存')
      setConfigOpen(false)
    } catch (e) {
      toastError('保存配置失败')
    }
  }

  const handleClearCache = async () => {
    try {
      await axios.post('/api/eval/cache/clear')
      toastSuccess('缓存已清空')
      fetchEntries()
      fetchStats()
    } catch (e) {
      toastError('清空缓存失败')
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      await axios.post(`/api/eval/cache/${id}/delete`)
      toastSuccess('缓存条目已删除')
      fetchEntries()
      fetchStats()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleWarmup = async () => {
    if (!warmupData) return
    setWarmupLoading(true)
    try {
      const queries = warmupData.split('\n').filter(q => q.trim())
      await axios.post('/api/eval/cache/warmup', { queries })
      toastSuccess(`预热完成，已缓存 ${queries.length} 条查询`)
      setWarmupOpen(false)
      setWarmupData('')
      fetchEntries()
      fetchStats()
    } catch (e: any) {
      toastError('预热失败')
    }
    setWarmupLoading(false)
  }

  const filteredEntries = entries.filter(e =>
    !searchQuery || e.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* 统计 + 操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">缓存条目</span> <span className="font-bold">{stats?.totalEntries?.toLocaleString() || 0}</span></span>
          <span><span className="text-muted-foreground">命中率</span> <span className="font-bold">{stats ? (stats.hitRate * 100).toFixed(1) + '%' : '0%'}</span></span>
          <span><span className="text-muted-foreground">总命中</span> <span className="font-bold">{stats?.totalHits?.toLocaleString() || 0}</span></span>
          <span><span className="text-muted-foreground">延迟</span> <span className="font-bold">{stats?.avgLatency || 0}ms</span></span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLookupOpen(true)}><Search className="mr-2 h-3.5 w-3.5" />查询</Button>
          <Button variant="outline" size="sm" onClick={() => setWarmupOpen(true)}><RefreshCw className="mr-2 h-3.5 w-3.5" />预热</Button>
          <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}><Settings className="mr-2 h-3.5 w-3.5" />配置</Button>
          <Button variant="destructive" size="sm" onClick={handleClearCache}><Trash2 className="mr-2 h-3.5 w-3.5" />清空</Button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索缓存条目..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
      </div>

      {/* 命中率趋势 */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> 命中率趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-24">
              {trendData.map((point: any, idx: number) => (
                <div
                  key={idx}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group"
                  style={{ height: `${(point.hitRate || 0) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {point.time}: {(point.hitRate * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 表格 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>查询内容</TableHead>
                <TableHead className="text-center">相似度</TableHead>
                <TableHead className="text-center">命中次数</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>过期时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filteredEntries.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无缓存条目</TableCell></TableRow>
              ) : filteredEntries.map(entry => (
                <TableRow key={entry.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium max-w-[300px] truncate">{entry.query}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{(entry.similarity * 100).toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold">{entry.hitCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entry.tags?.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(entry.expiresAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedEntry(entry); setDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

      {/* 缓存查询 Dialog */}
      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>缓存查询</DialogTitle>
            <DialogDescription>输入查询内容，检查是否存在语义相似的缓存结果</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="输入查询内容..."
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
            />
            <Button onClick={handleLookup} disabled={lookupLoading} className="w-full">
              {lookupLoading ? '查询中...' : '查询'}
            </Button>
            {lookupResult && (
              <div className="rounded border p-4 space-y-2">
                <p className="text-sm font-medium">
                  {lookupResult.hit ? '✅ 缓存命中' : '❌ 未命中'}
                </p>
                {lookupResult.hit && (
                  <>
                    <p className="text-sm text-muted-foreground">相似度: {(lookupResult.similarity * 100).toFixed(1)}%</p>
                    <p className="text-sm">结果: {lookupResult.result}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 配置 Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>缓存配置</DialogTitle>
            <DialogDescription>配置语义缓存的参数</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">启用缓存</label>
              <button
                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${config.enabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">相似度阈值</label>
              <Input
                type="number" min={0} max={1} step={0.01}
                value={config.threshold}
                onChange={(e) => setConfig({ ...config, threshold: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">最大条目数</label>
              <Input
                type="number" min={100}
                value={config.maxEntries}
                onChange={(e) => setConfig({ ...config, maxEntries: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">TTL（秒）</label>
              <Input
                type="number" min={60}
                value={config.ttl}
                onChange={(e) => setConfig({ ...config, ttl: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveConfig}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>缓存条目详情</DialogTitle>
            <DialogDescription>{selectedEntry?.id}</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">查询内容</label>
                <div className="rounded bg-muted p-3 text-sm">{selectedEntry.query}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">缓存结果</label>
                <div className="rounded bg-muted p-3 text-sm max-h-40 overflow-auto">{selectedEntry.cachedResult}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">相似度：</span><span className="font-bold">{(selectedEntry.similarity * 100).toFixed(1)}%</span></div>
                <div><span className="text-sm text-muted-foreground">命中次数：</span><span className="font-bold">{selectedEntry.hitCount}</span></div>
                <div><span className="text-sm text-muted-foreground">创建时间：</span><span>{new Date(selectedEntry.createdAt).toLocaleString()}</span></div>
                <div><span className="text-sm text-muted-foreground">过期时间：</span><span>{new Date(selectedEntry.expiresAt).toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 预热 Dialog */}
      <Dialog open={warmupOpen} onOpenChange={setWarmupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>缓存预热</DialogTitle>
            <DialogDescription>输入需要预热的查询列表（每行一个）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full h-40 rounded border p-3 text-sm font-mono resize-none"
              placeholder="每行输入一个查询内容..."
              value={warmupData}
              onChange={(e) => setWarmupData(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleWarmup} disabled={warmupLoading}>
              {warmupLoading ? '预热中...' : '开始预热'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
