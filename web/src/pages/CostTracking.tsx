import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { DollarSign, TrendingDown, CreditCard, BarChart3, Plus, Search, Calculator, AlertTriangle } from 'lucide-react'
import axios from 'axios'

interface CostRecord {
  id: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  date: string
  metadata?: any
}

interface CostStats {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  modelCount: number
}

interface PricingInfo {
  model: string
  inputPricePer1K: number
  outputPricePer1K: number
}

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

  useEffect(() => {
    fetchRecords()
    fetchPricing()
    fetchBudgetAlerts()
  }, [])

  useEffect(() => {
    if (records.length > 0) {
      const totalCost = records.reduce((a, r) => a + r.cost, 0)
      const totalInput = records.reduce((a, r) => a + r.inputTokens, 0)
      const totalOutput = records.reduce((a, r) => a + r.outputTokens, 0)
      const models = new Set(records.map(r => r.model))
      setStats({ totalCost, totalInputTokens: totalInput, totalOutputTokens: totalOutput, modelCount: models.size })
    }
  }, [records])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/cost/records')
      setRecords(res.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchPricing = async () => {
    try {
      const res = await axios.get('/api/eval/cost/pricing')
      setPricing(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchBudgetAlerts = async () => {
    try {
      const res = await axios.get('/api/eval/cost/budget-alerts')
      setBudgetAlerts(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async () => {
    if (!formData.model) return
    try {
      await axios.post('/api/eval/cost/record', formData)
      toastSuccess('成本记录已添加')
      setCreateOpen(false)
      setFormData({ model: '', inputTokens: 0, outputTokens: 0 })
      fetchRecords()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '添加失败')
    }
  }

  const handlePredict = async () => {
    if (!predictInput.model) return
    try {
      const res = await axios.post('/api/eval/cost/predict', predictInput)
      setPredictResult(res.data)
    } catch (e) {
      toastError('预测失败')
    }
  }

  const handleCreateBudgetAlert = async () => {
    try {
      await axios.post('/api/eval/cost/budget-alert', budgetData)
      toastSuccess('预算告警已创建')
      setBudgetOpen(false)
      fetchBudgetAlerts()
    } catch (e) {
      toastError('创建预算告警失败')
    }
  }

  const filteredRecords = records.filter(r => {
    const matchSearch = !searchQuery || r.model.toLowerCase().includes(searchQuery.toLowerCase())
    const matchModel = !modelFilter || r.model === modelFilter
    return matchSearch && matchModel
  })

  const models = [...new Set(records.map(r => r.model))]

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">总费用</span>
            </div>
            <p className="text-2xl font-bold mt-2">${stats?.totalCost?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">总输入Token</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats ? (stats.totalInputTokens / 1000).toFixed(0) + 'K' : '0'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">总输出Token</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats ? (stats.totalOutputTokens / 1000).toFixed(0) + 'K' : '0'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">模型数</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats?.modelCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-1">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索模型..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">全部模型</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPredictOpen(true)}>
                <Calculator className="mr-2 h-4 w-4" /> 成本预测
              </Button>
              <Button variant="outline" onClick={() => setPricingOpen(true)}>
                <BarChart3 className="mr-2 h-4 w-4" /> 定价
              </Button>
              <Button variant="outline" onClick={() => setBudgetOpen(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" /> 预算告警
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> 添加记录
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 费用列表 */}
      <Card>
        <CardHeader>
          <CardTitle>成本记录</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* 添加记录 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加成本记录</DialogTitle>
            <DialogDescription>记录一次 LLM 调用的 Token 消耗和费用</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">模型名称</label>
              <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="如 GPT-4o" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">输入 Token</label>
                <Input type="number" value={formData.inputTokens} onChange={(e) => setFormData({ ...formData, inputTokens: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">输出 Token</label>
                <Input type="number" value={formData.outputTokens} onChange={(e) => setFormData({ ...formData, outputTokens: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 成本预测 Dialog */}
      <Dialog open={predictOpen} onOpenChange={setPredictOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>成本预测</DialogTitle>
            <DialogDescription>根据 Token 用量预测费用</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">模型</label>
              <Input value={predictInput.model} onChange={(e) => setPredictInput({ ...predictInput, model: e.target.value })} placeholder="如 GPT-4o" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">预计输入 Token</label>
                <Input type="number" value={predictInput.inputTokens} onChange={(e) => setPredictInput({ ...predictInput, inputTokens: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">预计输出 Token</label>
                <Input type="number" value={predictInput.outputTokens} onChange={(e) => setPredictInput({ ...predictInput, outputTokens: Number(e.target.value) })} />
              </div>
            </div>
            <Button onClick={handlePredict} className="w-full">预测费用</Button>
            {predictResult && (
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">预计费用</p>
                <p className="text-2xl font-bold">${predictResult.estimatedCost?.toFixed(4)}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 定价 Dialog */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>模型定价</DialogTitle>
            <DialogDescription>各模型的 Token 单价（每 1K Token）</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型</TableHead>
                <TableHead className="text-center">输入价格/1K</TableHead>
                <TableHead className="text-center">输出价格/1K</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">暂无定价信息</TableCell></TableRow>
              ) : pricing.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{p.model}</TableCell>
                  <TableCell className="text-center">${p.inputPricePer1K?.toFixed(4)}</TableCell>
                  <TableCell className="text-center">${p.outputPricePer1K?.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* 预算告警 Dialog */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预算告警</DialogTitle>
            <DialogDescription>设置费用预算和告警阈值</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">预算金额 ($)</label>
              <Input type="number" value={budgetData.amount} onChange={(e) => setBudgetData({ ...budgetData, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">告警阈值 (%)</label>
              <Input type="number" value={budgetData.alertThreshold} onChange={(e) => setBudgetData({ ...budgetData, alertThreshold: Number(e.target.value) })} />
            </div>
            {budgetAlerts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">已有告警</label>
                {budgetAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded border p-2">
                    <span className="text-sm">预算 ${alert.amount} | 阈值 {alert.alertThreshold}%</span>
                    <Badge variant={alert.triggered ? 'destructive' : 'secondary'}>
                      {alert.triggered ? '已触发' : '正常'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateBudgetAlert}>创建告警</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
