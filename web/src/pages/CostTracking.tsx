import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToastActions } from '@/components/ui/toast'
import { DollarSign, Plus, Search, Calculator, AlertTriangle, BarChart3 } from 'lucide-react'
import axios from 'axios'

interface CostRecord { id: string; model: string; inputTokens: number; outputTokens: number; cost: number; date: string; metadata?: any }
interface CostStats { totalCost: number; totalInputTokens: number; totalOutputTokens: number; modelCount: number }
interface PricingInfo { model: string; inputPricePer1K: number; outputPricePer1K: number }

export default function CostTracking() {
  const [records, setRecords] = useState<CostRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<CostStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ model: '', inputTokens: 0, outputTokens: 0 })
  const [pricing, setPricing] = useState<PricingInfo[]>([])
  const [pricingOpen, setPricingOpen] = useState(false)
  const [predictOpen, setPredictOpen] = useState(false)
  const [predictInput, setPredictInput] = useState({ model: '', inputTokens: 0, outputTokens: 0 })
  const [predictResult, setPredictResult] = useState<any>(null)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetData, setBudgetData] = useState({ amount: 100, alertThreshold: 80 })
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([])
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => { fetchRecords(); fetchPricing(); fetchBudgetAlerts() }, [])
  useEffect(() => {
    if (records.length > 0) {
      setStats({
        totalCost: records.reduce((a, r) => a + r.cost, 0),
        totalInputTokens: records.reduce((a, r) => a + r.inputTokens, 0),
        totalOutputTokens: records.reduce((a, r) => a + r.outputTokens, 0),
        modelCount: new Set(records.map(r => r.model)).size,
      })
    }
  }, [records])

  const fetchRecords = async () => { setLoading(true); try { const res = await axios.get('/api/eval/cost/records'); setRecords(res.data || []) } catch (e) { console.error(e) }; setLoading(false) }
  const fetchPricing = async () => { try { const res = await axios.get('/api/eval/cost/pricing'); setPricing(res.data || []) } catch (e) {} }
  const fetchBudgetAlerts = async () => { try { const res = await axios.get('/api/eval/cost/budget-alerts'); setBudgetAlerts(res.data || []) } catch (e) {} }

  const handleCreate = async () => {
    if (!formData.model) return
    try { await axios.post('/api/eval/cost/record', formData); toastSuccess('已添加'); setCreateOpen(false); setFormData({ model: '', inputTokens: 0, outputTokens: 0 }); fetchRecords() }
    catch (e: any) { toastError(e?.response?.data?.message || '添加失败') }
  }
  const handlePredict = async () => {
    if (!predictInput.model) return
    try { const res = await axios.post('/api/eval/cost/predict', predictInput); setPredictResult(res.data) } catch (e) { toastError('预测失败') }
  }
  const handleCreateBudgetAlert = async () => {
    try { await axios.post('/api/eval/cost/budget-alert', budgetData); toastSuccess('已创建'); setBudgetOpen(false); fetchBudgetAlerts() } catch (e) { toastError('创建失败') }
  }

  const filteredRecords = records.filter(r => (!searchQuery || r.model.toLowerCase().includes(searchQuery.toLowerCase())) && (!modelFilter || r.model === modelFilter))
  const models = [...new Set(records.map(r => r.model))]

  return (
    <div className="space-y-4">
      {/* 统计 + 操作 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm">
          <span><span className="text-muted-foreground">总费用</span> <span className="font-bold">${stats?.totalCost?.toFixed(2) || '0.00'}</span></span>
          <span><span className="text-muted-foreground">输入</span> <span className="font-bold">{stats ? (stats.totalInputTokens / 1000).toFixed(0) + 'K' : '0'}</span></span>
          <span><span className="text-muted-foreground">输出</span> <span className="font-bold">{stats ? (stats.totalOutputTokens / 1000).toFixed(0) + 'K' : '0'}</span></span>
          <span><span className="text-muted-foreground">模型</span> <span className="font-bold">{stats?.modelCount || 0}</span></span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPredictOpen(true)}><Calculator className="mr-2 h-3.5 w-3.5" />预测</Button>
          <Button variant="outline" size="sm" onClick={() => setPricingOpen(true)}><BarChart3 className="mr-2 h-3.5 w-3.5" />定价</Button>
          <Button variant="outline" size="sm" onClick={() => setBudgetOpen(true)}><AlertTriangle className="mr-2 h-3.5 w-3.5" />预算</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />添加</Button>
        </div>
      </div>

      {/* 搜索/筛选 */}
      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索模型..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
        <select value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} className="rounded border border-input bg-background px-3 py-1.5 text-sm h-8">
          <option value="">全部模型</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* 表格 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>模型</TableHead>
            <TableHead className="text-center">输入Token</TableHead>
            <TableHead className="text-center">输出Token</TableHead>
            <TableHead className="text-center">费用</TableHead>
            <TableHead>日期</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
          ) : filteredRecords.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无记录</TableCell></TableRow>
          ) : filteredRecords.map(record => (
            <TableRow key={record.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{record.model}</TableCell>
              <TableCell className="text-center">{record.inputTokens.toLocaleString()}</TableCell>
              <TableCell className="text-center">{record.outputTokens.toLocaleString()}</TableCell>
              <TableCell className="text-center font-bold">${record.cost.toFixed(4)}</TableCell>
              <TableCell className="text-muted-foreground">{record.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加成本记录</DialogTitle><DialogDescription>记录一次 LLM 调用的 Token 消耗</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">模型</label><Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">输入Token</label><Input type="number" value={formData.inputTokens} onChange={(e) => setFormData({ ...formData, inputTokens: Number(e.target.value) })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">输出Token</label><Input type="number" value={formData.outputTokens} onChange={(e) => setFormData({ ...formData, outputTokens: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>添加</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={predictOpen} onOpenChange={setPredictOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>成本预测</DialogTitle><DialogDescription>根据 Token 用量预测费用</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">模型</label><Input value={predictInput.model} onChange={(e) => setPredictInput({ ...predictInput, model: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">预计输入Token</label><Input type="number" value={predictInput.inputTokens} onChange={(e) => setPredictInput({ ...predictInput, inputTokens: Number(e.target.value) })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">预计输出Token</label><Input type="number" value={predictInput.outputTokens} onChange={(e) => setPredictInput({ ...predictInput, outputTokens: Number(e.target.value) })} /></div>
            </div>
            <Button onClick={handlePredict} className="w-full">预测</Button>
            {predictResult && <div className="rounded border p-4"><p className="text-sm text-muted-foreground">预计费用</p><p className="text-2xl font-bold">${predictResult.estimatedCost?.toFixed(4)}</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>模型定价</DialogTitle><DialogDescription>各模型 Token 单价（每 1K）</DialogDescription></DialogHeader>
          <Table>
            <TableHeader><TableRow><TableHead>模型</TableHead><TableHead className="text-center">输入/1K</TableHead><TableHead className="text-center">输出/1K</TableHead></TableRow></TableHeader>
            <TableBody>
              {pricing.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">暂无</TableCell></TableRow>
              : pricing.map((p, i) => <TableRow key={i}><TableCell className="font-medium">{p.model}</TableCell><TableCell className="text-center">${p.inputPricePer1K?.toFixed(4)}</TableCell><TableCell className="text-center">${p.outputPricePer1K?.toFixed(4)}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>预算告警</DialogTitle><DialogDescription>设置费用预算和告警阈值</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">预算金额 ($)</label><Input type="number" value={budgetData.amount} onChange={(e) => setBudgetData({ ...budgetData, amount: Number(e.target.value) })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">告警阈值 (%)</label><Input type="number" value={budgetData.alertThreshold} onChange={(e) => setBudgetData({ ...budgetData, alertThreshold: Number(e.target.value) })} /></div>
            {budgetAlerts.length > 0 && <div className="space-y-2"><label className="text-sm font-medium">已有告警</label>{budgetAlerts.map((a, i) => <div key={i} className="flex items-center justify-between rounded border p-2"><span className="text-sm">${a.amount} / {a.alertThreshold}%</span><Badge variant={a.triggered ? 'destructive' : 'secondary'}>{a.triggered ? '已触发' : '正常'}</Badge></div>)}</div>}
          </div>
          <DialogFooter><Button onClick={handleCreateBudgetAlert}>创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
