import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Globe, Eye } from 'lucide-react'
import axios from 'axios'

export default function Multilingual() {
  const [results, setResults] = useState<any[]>([])
  const [languages, setLanguages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [formData, setFormData] = useState({ text: '', language: 'en', type: 'translation' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchResults()
    fetchLanguages()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/multilingual/results')
      setResults(res.data || [])
    } catch (e) {
      setResults([])
    }
    setLoading(false)
  }

  const fetchLanguages = async () => {
    try {
      const res = await axios.get('/api/eval/multilingual/languages')
      setLanguages(res.data || [])
    } catch (e) {}
  }

  const handleEvaluate = async () => {
    if (!formData.text || !formData.language) return
    try {
      const res = await axios.post('/api/eval/multilingual/evaluate', {
        text: formData.text,
        language: formData.language,
        type: formData.type,
      })
      toastSuccess('多语言评测完成')
      setResults([res.data, ...results])
      setCreateOpen(false)
      setFormData({ text: '', language: 'en', type: 'translation' })
    } catch (e: any) {
      toastError(e?.response?.data?.message || '评测失败')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> 多语言评测
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 运行评测
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文本</TableHead>
                <TableHead>语言</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>得分</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    暂无评测记录
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-xs truncate">{r.text}</TableCell>
                    <TableCell><Badge variant="outline">{r.language}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                    <TableCell><Badge>{(r.score * 100).toFixed(1)}%</Badge></TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedResult(r); setDetailOpen(true) }}>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>运行多语言评测</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文本 *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="输入要评测的文本"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">语言 *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  <option value="en">英语</option>
                  <option value="zh">中文</option>
                  <option value="ja">日语</option>
                  <option value="ko">韩语</option>
                  <option value="es">西班牙语</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">评测类型</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="translation">翻译</option>
                  <option value="summarization">摘要</option>
                  <option value="qa">问答</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleEvaluate} disabled={!formData.text || !formData.language}>评测</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>评测详情</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">文本</label>
                <p className="mt-1 text-sm bg-muted rounded p-2">{selectedResult.text}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">语言</label>
                  <p className="mt-1"><Badge>{selectedResult.language}</Badge></p>
                </div>
                <div>
                  <label className="text-sm font-medium">得分</label>
                  <p className="mt-1 text-2xl font-bold">{(selectedResult.score * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
