import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToastActions } from '@/components/ui/toast'
import { Search, Eye } from 'lucide-react'
import axios from 'axios'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toastError } = useToastActions()

  const handleSearch = async () => {
    if (!query) return
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/search', { params: { q: query } })
      setResults(res.data?.results || res.data || [])
    } catch (e) {
      toastError('搜索失败')
      setResults([])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> 结果搜索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="搜索评测结果..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={!query || loading}>
              {loading ? '搜索中...' : '搜索'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>搜索结果 ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>相关度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell><Badge variant="outline">{r.type || '-'}</Badge></TableCell>
                    <TableCell className="font-medium">{r.name || r.title || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{r.description || '-'}</TableCell>
                    <TableCell>
                      {r.score && <Badge>{(r.score * 100).toFixed(0)}%</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && query && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            未找到相关结果
          </CardContent>
        </Card>
      )}
    </div>
  )
}
