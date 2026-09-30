import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToastActions } from '@/components/ui/toast'
import { CheckCircle, XCircle, Sparkles, RefreshCw, Save, AlertTriangle, Keyboard } from 'lucide-react'
import axios from 'axios'

const DEFAULT_DIMENSIONS = ['准确性', '完整性', '相关性', '安全性']

// 维度按实际数据键动态派生（兼容中英文评分键），无数据时回退默认四维
function deriveDimensions(item: QueueItem | null): string[] {
  if (!item) return DEFAULT_DIMENSIONS
  const keys = new Set<string>()
  Object.keys(item.aiScores || {}).forEach(k => keys.add(k))
  Object.keys(item.humanAnnotation?.scores || {}).forEach(k => keys.add(k))
  return keys.size > 0 ? Array.from(keys) : DEFAULT_DIMENSIONS
}

interface QueueItem {
  id: string
  status: string
  confidence: number
  modelVersion: string | null
  aiScores: Record<string, number>
  aiComment: string | null
  evalResultId: string
  input: string
  expectedOutput: string | null
  actualOutput: string
  evalStatus: string
  humanAnnotation: { id: string; scores: Record<string, number>; comment: string | null; annotatorId: string | null } | null
  createdAt: string
}

interface WorkbenchProps {
  initialStatus?: string
}

const STATUS_TABS = [
  { value: 'pending', label: '待审核' },
  { value: 'conflict', label: '冲突' },
  { value: 'modified', label: '已修改' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'all', label: '全部' },
]

// 标注工作台：左侧队列 / 中间详情 / 右侧评分面板，支持快捷键审核
export default function AnnotationWorkbench({ initialStatus = 'pending' }: WorkbenchProps) {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<QueueItem | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [dirty, setDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    setStatusFilter(initialStatus)
  }, [initialStatus])

  const fetchQueue = useCallback(async (status: string, keepSelectedId?: string) => {
    setLoading(true)
    try {
      const res = await axios.get('/api/annotation/queue', {
        params: { status, sortBy: 'confidence_asc', limit: 100 },
      })
      const items: QueueItem[] = res.data || []
      setQueue(items)
      const targetIdx = keepSelectedId ? items.findIndex(i => i.id === keepSelectedId) : -1
      const idx = targetIdx >= 0 ? targetIdx : (items.length > 0 ? 0 : -1)
      if (idx >= 0) {
        selectItem(items[idx], idx)
      } else {
        setSelected(null)
        setSelectedIdx(-1)
      }
    } catch (e) {
      console.error(e)
      toastError('加载审核队列失败')
    }
    setLoading(false)
  }, [toastError])

  useEffect(() => {
    fetchQueue(statusFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const selectItem = (item: QueueItem, idx: number) => {
    setSelected(item)
    setSelectedIdx(idx)
    setScores({ ...item.aiScores })
    setComment(item.humanAnnotation?.comment || '')
    setDirty(false)
  }

  const navigate = (delta: number) => {
    if (queue.length === 0) return
    const nextIdx = Math.min(Math.max(selectedIdx + delta, 0), queue.length - 1)
    if (nextIdx !== selectedIdx) selectItem(queue[nextIdx], nextIdx)
  }

  const submitReview = async (approved: boolean, withModified: boolean) => {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      const body: any = { approved, reviewerId: 'default-reviewer' }
      if (withModified && dirty) {
        body.modifiedScores = scores
        body.comment = comment
      } else if (comment) {
        body.comment = comment
      }
      await axios.post(`/api/annotation/${selected.id}/review`, body)
      toastSuccess(approved ? (withModified && dirty ? '已修改并通过' : '已通过') : '已拒绝')
      // 审核后自动跳到下一条
      const removed = queue.filter(q => q.id !== selected.id)
      const nextIdx = Math.min(selectedIdx, removed.length - 1)
      if (removed.length > 0 && nextIdx >= 0) {
        selectItem(removed[nextIdx], nextIdx)
        setQueue(removed)
      } else {
        await fetchQueue(statusFilter)
      }
    } catch (e: any) {
      toastError(e?.response?.data?.message || '审核操作失败')
    }
    setSubmitting(false)
  }

  const handleApprove = () => submitReview(true, true)
  const handleReject = () => submitReview(false, false)

  const handleSaveModified = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      await axios.put(`/api/annotation/${selected.id}`, { scores, comment })
      toastSuccess('评分已修正')
      setDirty(false)
      await fetchQueue(statusFilter, selected.id)
    } catch (e) {
      toastError('修正失败')
    }
    setSubmitting(false)
  }

  const handleAdoptAi = () => {
    if (!selected) return
    setScores({ ...selected.aiScores })
    setDirty(false)
  }

  const handleReAnnotate = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      await axios.post(`/api/annotation/re-annotate/${selected.evalResultId}`)
      toastSuccess('已重新标注')
      await fetchQueue(statusFilter)
    } catch (e) {
      toastError('重新标注失败')
    }
    setSubmitting(false)
  }

  // 快捷键：A 通过 / R 拒绝 / M 保存修正 / ←→ 切换（输入框聚焦时不触发）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (!selected) return
      switch (e.key.toLowerCase()) {
        case 'a': handleApprove(); break
        case 'r': handleReject(); break
        case 'm': handleSaveModified(); break
        case 'arrowleft': navigate(-1); break
        case 'arrowright': navigate(1); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="border-success/30 bg-success-light text-success"><CheckCircle className="mr-1 h-3 w-3" />已通过</Badge>
      case 'rejected':
        return <Badge className="border-destructive/30 bg-error-light text-destructive"><XCircle className="mr-1 h-3 w-3" />已拒绝</Badge>
      case 'modified':
        return <Badge className="border-warning/30 bg-warning-light text-warning">已修改</Badge>
      case 'conflict':
        return <Badge className="border-destructive/30 bg-error-light text-destructive"><AlertTriangle className="mr-1 h-3 w-3" />冲突</Badge>
      default:
        return <Badge variant="outline">待审核</Badge>
    }
  }

  const confidenceBadge = (confidence: number) => {
    if (confidence < 0.6) return <Badge className="border-destructive/30 bg-error-light text-destructive">{(confidence * 100).toFixed(0)}%</Badge>
    if (confidence < 0.8) return <Badge className="border-warning/30 bg-warning-light text-warning">{(confidence * 100).toFixed(0)}%</Badge>
    return <Badge className="border-success/30 bg-success-light text-success">{(confidence * 100).toFixed(0)}%</Badge>
  }

  return (
    <div className="space-y-3">
      {/* 工具栏：状态筛选 + 排序说明 + 刷新 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {STATUS_TABS.map(tab => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>低置信度优先</span>
          <Button variant="outline" size="sm" onClick={() => fetchQueue(statusFilter)}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[280px_1fr_300px]">
        {/* 左栏：待审队列 */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">审核队列（{queue.length}）</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                加载中...
              </div>
            ) : queue.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">暂无待审核条目</p>
            ) : (
              <div className="max-h-[560px] space-y-1 overflow-y-auto">
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`cursor-pointer rounded-md border p-2 transition-colors duration-150 ${
                      selected?.id === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => selectItem(item, idx)}
                  >
                    <p className="truncate text-xs font-medium">{item.input || '(无输入)'}</p>
                    <div className="mt-1 flex items-center justify-between">
                      {confidenceBadge(item.confidence)}
                      {item.status !== 'pending' && getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 中栏：条目详情 */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>条目详情</span>
              {selected && (
                <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                  {selectedIdx + 1} / {queue.length}
                  {getStatusBadge(selected.status)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="py-12 text-center text-sm text-muted-foreground">从左侧队列选择一条标注进行审核</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <h4 className="mb-1 text-xs font-medium text-muted-foreground">用户输入</h4>
                  <p className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{selected.input}</p>
                </div>
                {selected.expectedOutput && (
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-muted-foreground">期望输出</h4>
                    <p className="rounded-md bg-success-light p-3 text-sm whitespace-pre-wrap">{selected.expectedOutput}</p>
                  </div>
                )}
                <div>
                  <h4 className="mb-1 text-xs font-medium text-muted-foreground">实际输出</h4>
                  <p className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{selected.actualOutput || '(空)'}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-medium text-muted-foreground">AI 批注</h4>
                  <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{selected.aiComment || '(无)'}</p>
                </div>
                {selected.humanAnnotation && (
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                      已有最终人工标注（{selected.humanAnnotation.annotatorId || '匿名'}）
                    </h4>
                    <div className="rounded-md bg-warning-light p-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selected.humanAnnotation.scores).map(([k, v]) => (
                          <Badge key={k} variant="outline">{k}: {(v * 100).toFixed(0)}%</Badge>
                        ))}
                      </div>
                      {selected.humanAnnotation.comment && (
                        <p className="mt-2 text-xs text-muted-foreground">{selected.humanAnnotation.comment}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>AI 置信度: {confidenceBadge(selected.confidence)}</span>
                  {selected.modelVersion && <span>模型: {selected.modelVersion}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右栏：评分面板 */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>评分面板</span>
              {dirty && <Badge className="border-warning/30 bg-warning-light text-warning">已修改</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="py-12 text-center text-sm text-muted-foreground">-</p>
            ) : (
              <div className="space-y-4">
                {/* 多维评分滑块（按数据维度动态渲染） */}
                <div className="space-y-3">
                  {deriveDimensions(selected).map(dim => (
                    <div key={dim}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{dim}</span>
                        <span className="flex items-center gap-1">
                          {selected.humanAnnotation?.scores[dim] !== undefined && (
                            <span className="text-muted-foreground line-through">
                              {(selected.humanAnnotation.scores[dim] * 100).toFixed(0)}%
                            </span>
                          )}
                          <span className={dirty && scores[dim] !== selected.aiScores[dim] ? 'text-warning font-bold' : ''}>
                            {((scores[dim] ?? 0) * 100).toFixed(0)}%
                          </span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={scores[dim] ?? 0}
                        onChange={(e) => {
                          setScores(s => ({ ...s, [dim]: Number(e.target.value) }))
                          setDirty(true)
                        }}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}
                </div>

                {/* 批注 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">审核批注</label>
                  <textarea
                    ref={commentRef}
                    className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    placeholder="输入审核意见（可选）..."
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); setDirty(true) }}
                  />
                </div>

                {/* 操作按钮 */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-success hover:bg-success/90 text-white" size="sm" onClick={handleApprove} disabled={submitting}>
                      <CheckCircle className="mr-1 h-4 w-4" /> 通过 (A)
                    </Button>
                    <Button variant="destructive" className="flex-1" size="sm" onClick={handleReject} disabled={submitting}>
                      <XCircle className="mr-1 h-4 w-4" /> 拒绝 (R)
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm" onClick={handleSaveModified} disabled={submitting || !dirty}>
                      <Save className="mr-1 h-4 w-4" /> 保存修正 (M)
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm" onClick={handleAdoptAi} disabled={submitting}>
                      <Sparkles className="mr-1 h-4 w-4" /> 采纳 AI
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full" size="sm" onClick={handleReAnnotate} disabled={submitting}>
                    <RefreshCw className="mr-1 h-4 w-4" /> 重新标注
                  </Button>
                </div>

                {/* 快捷键提示条 */}
                <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1 font-medium"><Keyboard className="h-3 w-3" /> 快捷键</p>
                  <p className="mt-1">A 通过 · R 拒绝 · M 保存修正 · ←/→ 切换条目</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
