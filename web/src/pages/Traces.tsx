import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Eye, Search } from 'lucide-react'
import axios from 'axios'

export default function Traces() {
  const [traces, setTraces] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTrace, setSelectedTrace] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toastError } = useToastActions()

  useEffect(() => { fetchTraces() }, [])

  const fetchTraces = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/traces', { params: { limit: 100 } })
      setTraces(res.data || [])
    } catch (e) {
      setTraces([])
    }
    setLoading(false)
  }

  const openDetail = async (trace: any) => {
    try {
      const res = await axios.get(`/api/eval/traces/${trace.id}`)
      setSelectedTrace(res.data)
      setDetailOpen(true)
    } catch (e) {
      toastError('获取详情失败')
    }
  }

  const filteredTraces = traces.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sessionId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>追踪系统</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="搜索追踪..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTraces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    暂无追踪记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredTraces.map((trace) => (
                  <TableRow key={trace.id}>
                    <TableCell className="font-medium">{trace.name}</TableCell>
                    <TableCell className="text-xs">{trace.sessionId?.slice(0, 8) || '-'}</TableCell>
                    <TableCell>{trace.userId || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {trace.tags?.slice(0, 2).map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell><Badge>{trace.status || 'active'}</Badge></TableCell>
                    <TableCell>{new Date(trace.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(trace)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>追踪详情</DialogTitle>
          </DialogHeader>
          {selectedTrace && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedTrace.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Session</label>
                  <p className="mt-1 text-sm font-mono">{selectedTrace.sessionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">用户</label>
                  <p className="mt-1 text-sm">{selectedTrace.userId || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">状态</label>
                  <p className="mt-1"><Badge>{selectedTrace.status}</Badge></p>
                </div>
              </div>
              {selectedTrace.input && (
                <div>
                  <label className="text-sm font-medium">输入</label>
                  <pre className="mt-1 text-xs bg-muted rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedTrace.input, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTrace.output && (
                <div>
                  <label className="text-sm font-medium">输出</label>
                  <pre className="mt-1 text-xs bg-muted rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedTrace.output, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTrace.metadata && (
                <div>
                  <label className="text-sm font-medium">元数据</label>
                  <pre className="mt-1 text-xs bg-muted rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedTrace.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
