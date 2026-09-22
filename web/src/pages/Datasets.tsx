import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Database, Edit, Trash2, Search, Upload, FileText, Download, Eye, Tag, Sparkles, GitBranch, History, RotateCcw, GitCompare, Shield, BarChart3, FlaskConical, Users, Zap, CheckCircle2, AlertCircle, XCircle, Play } from 'lucide-react'
import axios from 'axios'

interface TestCase {
  id: string
  datasetId: string
  input: string
  expectedOutput: string | null
  difficulty: string | null
  tags: string | null
  metadata: any
  createdAt: string
}

interface DatasetVersion {
  id: string
  datasetId: string
  version: number
  name: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  tags: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface Dataset {
  id: string
  name: string
  description: string | null
  category: string | null
  validationStatus?: 'draft' | 'validating' | 'validated' | 'rejected'
  validationReport?: string | null
  _count?: { testCases: number }
  createdAt: string
  testCases?: TestCase[]
  versions?: DatasetVersion[]
}

interface ValidationReport {
  datasetId: string
  totalCases: number
  difficultyDistribution: { easy: number; medium: number; hard: number }
  coverageScore: number
  discriminationScore: number
  overallQuality: number
  problematicCases: Array<{
    testCaseId: string
    issue: 'too_easy' | 'too_hard' | 'low_discrimination' | 'duplicate_intent'
    suggestion: string
  }>
  suggestions: string[]
  status: string
}

// 骨架屏
function SkeletonTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><div className="h-4 w-24 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-32 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-16 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-12 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-28 animate-skeleton rounded" /></TableHead>
          <TableHead><div className="h-4 w-24 animate-skeleton rounded" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4].map(i => (
          <TableRow key={i}>
            <TableCell><div className="h-4 w-28 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-4 w-40 animate-skeleton rounded" /></TableCell>
            <TableCell><div className="h-5 w-14 animate-skeleton rounded-full" /></TableCell>
            <TableCell><div className="h-5 w-8 animate-skeleton rounded-full" /></TableCell>
            <TableCell><div className="h-4 w-32 animate-skeleton rounded" /></TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <div className="h-8 w-16 animate-skeleton rounded" />
                <div className="h-8 w-8 animate-skeleton rounded" />
                <div className="h-8 w-8 animate-skeleton rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', category: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [importData, setImportData] = useState('')
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailDataset, setDetailDataset] = useState<Dataset | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false)
  const [aiGenerateDataset, setAiGenerateDataset] = useState<Dataset | null>(null)
  const [aiGenerateInput, setAiGenerateInput] = useState('')
  const [aiGenerateContext, setAiGenerateContext] = useState('')
  const [aiGenerateLoading, setAiGenerateLoading] = useState(false)
  const [aiGenerateResult, setAiGenerateResult] = useState<any>(null)
  const [versions, setVersions] = useState<DatasetVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [createVersionOpen, setCreateVersionOpen] = useState(false)
  const [versionFormData, setVersionFormData] = useState({ name: '', description: '' })
  const [diffOpen, setDiffOpen] = useState(false)
  const [diffVersions, setDiffVersions] = useState<{ v1: string; v2: string }>({ v1: '', v2: '' })
  const [diffResult, setDiffResult] = useState<any>(null)
  const [cleaning, setCleaning] = useState(false)
  const [qualityReport, setQualityReport] = useState<any>(null)
  const [qualityLoading, setQualityLoading] = useState(false)
  // 智能批量生成状态
  const [syntheticOpen, setSyntheticOpen] = useState(false)
  const [syntheticDataset, setSyntheticDataset] = useState<Dataset | null>(null)
  const [syntheticConfig, setSyntheticConfig] = useState({
    prompt: '',
    numPersonas: '3',
    numTestCasesPerPersona: '5',
    instructions: '',
    edgeCases: true,
    language: '中文',
  })
  const [syntheticLoading, setSyntheticLoading] = useState(false)
  const [syntheticResult, setSyntheticResult] = useState<any>(null)
  const [syntheticStep, setSyntheticStep] = useState<'config' | 'preview' | 'done'>('config')
  // 验证状态
  const [validating, setValidating] = useState(false)
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  // 批量生成状态
  const [batchGenPrompt, setBatchGenPrompt] = useState('')
  const [batchGenCount, setBatchGenCount] = useState('100')
  const [batchGenPersonas, setBatchGenPersonas] = useState('10')
  const [batchGenEdgeCases, setBatchGenEdgeCases] = useState(true)
  const [batchGenLoading, setBatchGenLoading] = useState(false)
  const [batchGenResult, setBatchGenResult] = useState<any>(null)
  const { toastSuccess, toastError } = useToastActions()

  const handleExport = async (datasetId: string, datasetName: string) => {
    try {
      const res = await axios.get(`/api/datasets/${datasetId}/export`)
      const data = res.data
      // 转换为 JSON 文件下载
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${datasetName}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('导出成功')
    } catch (e) {
      toastError('导出失败')
    }
  }

  const fetchDatasets = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/datasets')
      setDatasets(res.data)
    } catch (e) {
      console.error(e)
      toastError('加载数据集列表失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchDatasets() }, [])

  const handleCreate = async () => {
    if (!formData.name) return
    try {
      await axios.post('/api/datasets', formData)
      setCreateOpen(false)
      setFormData({ name: '', description: '', category: '' })
      toastSuccess('数据集创建成功')
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建失败')
    }
  }

  const handleEdit = async () => {
    if (!currentDataset || !formData.name) return
    try {
      await axios.put(`/api/datasets/${currentDataset.id}`, formData)
      setEditOpen(false)
      toastSuccess('数据集更新成功')
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '更新失败')
    }
  }

  const handleDelete = (id: string) => {
    setDeleteTargetId(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await axios.delete(`/api/datasets/${deleteTargetId}`)
      setDeleteConfirmOpen(false)
      setDeleteTargetId(null)
      toastSuccess('已删除数据集')
      fetchDatasets()
    } catch (e) {
      toastError('删除失败')
    }
  }

  const handleImport = async () => {
    if (!currentDataset || !importData) return
    try {
      let cases
      if (importFormat === 'json') {
        cases = JSON.parse(importData)
      } else {
        const lines = importData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        cases = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const obj: any = {}
          headers.forEach((h, i) => { obj[h] = values[i] })
          return obj
        })
      }
      await axios.post(`/api/datasets/${currentDataset.id}/import`, { cases })
      setImportOpen(false)
      setImportData('')
      toastSuccess(`成功导入 ${cases.length} 条用例`)
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '导入失败')
    }
  }

  const openEdit = (ds: Dataset) => {
    setCurrentDataset(ds)
    setFormData({ name: ds.name, description: ds.description || '', category: ds.category || '' })
    setEditOpen(true)
  }

  const openImport = (ds: Dataset) => {
    setCurrentDataset(ds)
    setImportData('')
    setImportOpen(true)
  }

  const openDetail = async (ds: Dataset) => {
    setDetailLoading(true)
    setDetailOpen(true)
    setValidationReport(null)
    try {
      const res = await axios.get(`/api/datasets/${ds.id}`)
      setDetailDataset(res.data)
      // 获取版本列表
      fetchVersions(ds.id)
      // 获取验证报告
      if (res.data.validationReport) {
        handleFetchValidationReport()
      }
    } catch (e) {
      toastError('加载数据集详情失败')
    }
    setDetailLoading(false)
  }

  const fetchVersions = async (datasetId: string) => {
    setVersionsLoading(true)
    try {
      const res = await axios.get(`/api/datasets/${datasetId}/versions`)
      setVersions(res.data || [])
    } catch (e) {
      console.error(e)
      setVersions([])
    }
    setVersionsLoading(false)
  }

  const handleCreateVersion = async () => {
    if (!currentDataset || !versionFormData.name) return
    try {
      await axios.post(`/api/datasets/${currentDataset.id}/versions`, {
        name: versionFormData.name,
        description: versionFormData.description || undefined,
      })
      toastSuccess('版本创建成功')
      setCreateVersionOpen(false)
      setVersionFormData({ name: '', description: '' })
      fetchVersions(currentDataset.id)
    } catch (e: any) {
      toastError(e?.response?.data?.message || '创建版本失败')
    }
  }

  const handlePublishVersion = async (versionId: string) => {
    if (!currentDataset) return
    try {
      await axios.post(`/api/datasets/${currentDataset.id}/versions/${versionId}/publish`)
      toastSuccess('版本已发布')
      fetchVersions(currentDataset.id)
    } catch (e) {
      toastError('发布失败')
    }
  }

  const handleArchiveVersion = async (versionId: string) => {
    if (!currentDataset) return
    try {
      await axios.post(`/api/datasets/${currentDataset.id}/versions/${versionId}/archive`)
      toastSuccess('版本已归档')
      fetchVersions(currentDataset.id)
    } catch (e) {
      toastError('归档失败')
    }
  }

  const handleRollbackVersion = async (versionId: string) => {
    if (!currentDataset) return
    try {
      await axios.post(`/api/datasets/${currentDataset.id}/versions/${versionId}/rollback`)
      toastSuccess('版本已回滚')
      fetchVersions(currentDataset.id)
    } catch (e) {
      toastError('回滚失败')
    }
  }

  const handleDiffVersions = async () => {
    if (!currentDataset || !diffVersions.v1 || !diffVersions.v2) return
    try {
      const res = await axios.post(`/api/datasets/${currentDataset.id}/versions/diff`, {
        versionId1: diffVersions.v1,
        versionId2: diffVersions.v2,
      })
      setDiffResult(res.data)
    } catch (e) {
      toastError('版本对比失败')
    }
  }

  const getVersionStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">已发布</Badge>
      case 'archived':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20" variant="outline">已归档</Badge>
      default:
        return <Badge variant="outline">草稿</Badge>
    }
  }

  const handleCleanDataset = async () => {
    if (!currentDataset) return
    setCleaning(true)
    try {
      const res = await axios.post(`/api/datasets/${currentDataset.id}/clean`)
      toastSuccess(`清洗完成：${res.data.removedCount || 0} 条数据被移除`)
      fetchVersions(currentDataset.id)
    } catch (e: any) {
      toastError(e?.response?.data?.message || '数据清洗失败')
    }
    setCleaning(false)
  }

  const handleViewQualityReport = async () => {
    if (!currentDataset) return
    setQualityLoading(true)
    try {
      const res = await axios.get(`/api/datasets/${currentDataset.id}/quality-report`)
      setQualityReport(res.data)
    } catch (e) {
      toastError('获取质量报告失败')
    }
    setQualityLoading(false)
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getDifficultyLabel = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return difficulty || '未设置'
    }
  }

  const openAiGenerate = (ds: Dataset) => {
    setAiGenerateDataset(ds)
    setAiGenerateInput('')
    setAiGenerateContext('')
    setAiGenerateResult(null)
    setAiGenerateOpen(true)
  }

  const openSyntheticGenerate = (ds: Dataset) => {
    setSyntheticDataset(ds)
    setSyntheticConfig({ prompt: '', numPersonas: '3', numTestCasesPerPersona: '5', instructions: '', edgeCases: true, language: '中文' })
    setSyntheticResult(null)
    setSyntheticStep('config')
    setSyntheticOpen(true)
  }

  const handleSyntheticPreview = async () => {
    if (!syntheticConfig.prompt) return
    setSyntheticLoading(true)
    try {
      const res = await axios.post('/api/datasets/synthetic/preview', {
        prompt: syntheticConfig.prompt,
        numPersonas: parseInt(syntheticConfig.numPersonas),
        numTestCasesPerPersona: parseInt(syntheticConfig.numTestCasesPerPersona),
        instructions: syntheticConfig.instructions || undefined,
        edgeCases: syntheticConfig.edgeCases,
        language: syntheticConfig.language,
      })
      setSyntheticResult(res.data)
      setSyntheticStep('preview')
    } catch (e: any) {
      toastError(e?.response?.data?.message || '智能生成失败')
    }
    setSyntheticLoading(false)
  }

  const handleSyntheticImport = async () => {
    if (!syntheticDataset || !syntheticConfig.prompt) return
    setSyntheticLoading(true)
    try {
      const res = await axios.post(`/api/datasets/${syntheticDataset.id}/synthetic-generate`, {
        prompt: syntheticConfig.prompt,
        numPersonas: parseInt(syntheticConfig.numPersonas),
        numTestCasesPerPersona: parseInt(syntheticConfig.numTestCasesPerPersona),
        instructions: syntheticConfig.instructions || undefined,
        edgeCases: syntheticConfig.edgeCases,
        language: syntheticConfig.language,
      })
      setSyntheticStep('done')
      toastSuccess(`成功导入 ${res.data.importedCount} 条测试用例`)
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '导入失败')
    }
    setSyntheticLoading(false)
  }

  // 批量生成
  const handleBatchGenerate = async () => {
    if (!detailDataset || !batchGenPrompt) return
    setBatchGenLoading(true)
    setBatchGenResult(null)
    try {
      const res = await axios.post(`/api/datasets/${detailDataset.id}/synthetic-generate`, {
        prompt: batchGenPrompt,
        numPersonas: parseInt(batchGenPersonas),
        numTestCasesPerPersona: Math.ceil(parseInt(batchGenCount) / parseInt(batchGenPersonas)),
        edgeCases: batchGenEdgeCases,
        language: '中文',
      })
      setBatchGenResult(res.data)
      toastSuccess(`成功生成 ${res.data.importedCount} 条测试用例`)
      // 刷新数据集列表和详情
      fetchDatasets()
      if (detailDataset) {
        const dsRes = await axios.get(`/api/datasets/${detailDataset.id}`)
        setDetailDataset(dsRes.data)
      }
    } catch (e: any) {
      toastError(e?.response?.data?.message || '批量生成失败')
    }
    setBatchGenLoading(false)
  }

  // 验证相关函数
  const handleValidate = async () => {
    if (!detailDataset) return
    setValidating(true)
    try {
      const res = await axios.post(`/api/datasets/${detailDataset.id}/validate`, {})
      setValidationReport(res.data)
      toastSuccess('验证完成')
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '验证失败')
    }
    setValidating(false)
  }

  const handleFetchValidationReport = async () => {
    if (!detailDataset) return
    try {
      const res = await axios.get(`/api/datasets/${detailDataset.id}/validation-report`)
      setValidationReport(res.data)
    } catch (e: any) {
      if (e?.response?.status !== 404) {
        toastError('获取验证报告失败')
      }
    }
  }

  const handleApprove = async () => {
    if (!detailDataset) return
    try {
      await axios.post(`/api/datasets/${detailDataset.id}/approve`)
      toastSuccess('数据集已审批通过')
      fetchDatasets()
      if (detailDataset) {
        const res = await axios.get(`/api/datasets/${detailDataset.id}`)
        setDetailDataset(res.data)
      }
    } catch (e: any) {
      toastError(e?.response?.data?.message || '审批失败')
    }
  }

  const handleReject = async () => {
    if (!detailDataset) return
    try {
      await axios.post(`/api/datasets/${detailDataset.id}/reject`, { reason: rejectReason })
      toastSuccess('数据集已被拒绝')
      setRejectOpen(false)
      setRejectReason('')
      fetchDatasets()
      if (detailDataset) {
        const res = await axios.get(`/api/datasets/${detailDataset.id}`)
        setDetailDataset(res.data)
      }
    } catch (e: any) {
      toastError(e?.response?.data?.message || '操作失败')
    }
  }

  const handleAiGenerate = async () => {
    if (!aiGenerateInput) return
    setAiGenerateLoading(true)
    try {
      const res = await axios.post('/api/datasets/generate', {
        input: aiGenerateInput,
        context: aiGenerateContext || undefined,
      })
      setAiGenerateResult(res.data)
      toastSuccess('AI 生成完成')
    } catch (e: any) {
      toastError(e?.response?.data?.message || 'AI 生成失败')
    }
    setAiGenerateLoading(false)
  }

  const handleSelectCandidate = async (candidate: any, index: number) => {
    if (!aiGenerateDataset || !aiGenerateResult) return
    try {
      // 先选择答案
      await axios.post('/api/datasets/generate/select', {
        generationId: aiGenerateResult.generationId,
        selectedIndex: index,
        customAnswer: undefined,
      })
      // 然后添加到数据集
      await axios.post(`/api/datasets/${aiGenerateDataset.id}/cases`, {
        input: aiGenerateInput,
        expectedOutput: candidate.text,
        difficulty: 'medium',
        tags: 'AI生成',
      })
      toastSuccess('已添加到数据集')
      setAiGenerateOpen(false)
      fetchDatasets()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '添加失败')
    }
  }

  const categories = [...new Set(datasets.map(d => d.category).filter((c): c is string => !!c))]

  const filteredDatasets = datasets.filter(ds => {
    const matchSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ds.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !categoryFilter || ds.category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> 评测数据集</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建数据集
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索数据集..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {categories.length > 0 && (
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? <SkeletonTable /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead className="text-center">用例数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <div className="py-12">
                        <Database className="mx-auto h-12 w-12 text-muted-foreground/40" />
                        <p className="mt-4 text-muted-foreground">暂无数据</p>
                        <p className="mt-1 text-xs text-muted-foreground">点击"新建数据集"开始创建</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDatasets.map((ds) => (
                    <TableRow key={ds.id} className="hover:bg-muted/50 transition-colors duration-150">
                      <TableCell className="font-medium">{ds.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{ds.description || '-'}</TableCell>
                      <TableCell>{ds.category ? <Badge variant="outline">{ds.category}</Badge> : '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{ds._count?.testCases || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(ds.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => openSyntheticGenerate(ds)} className="gap-1">
                            <FlaskConical className="h-3 w-3" /> 智能生成
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAiGenerate(ds)} className="gap-1">
                            <Sparkles className="h-3 w-3" /> AI生成
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openDetail(ds)} aria-label="查看详情">
                            <Eye className="mr-1 h-3 w-3" /> 详情
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleExport(ds.id, ds.name)} aria-label="导出数据集">
                            <Download className="mr-1 h-3 w-3" /> 导出
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openImport(ds)} aria-label="导入测试用例">
                            <Upload className="mr-1 h-3 w-3" /> 导入
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(ds)} aria-label="编辑数据集">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(ds.id)} aria-label="删除数据集">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建数据集</DialogTitle>
            <DialogDescription>创建评测数据集</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 <span className="text-destructive">*</span></label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如: 客服问答测试集" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="如: 客服" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!formData.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑数据集</DialogTitle>
            <DialogDescription>修改数据集信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> 导入用例 - {currentDataset?.name}
            </DialogTitle>
            <DialogDescription>支持 JSON 和 CSV 格式导入</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">导入格式:</label>
              <div className="flex gap-2">
                <Button
                  variant={importFormat === 'json' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportFormat('json')}
                >
                  <FileText className="mr-1 h-3 w-3" /> JSON
                </Button>
                <Button
                  variant={importFormat === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportFormat('csv')}
                >
                  <FileText className="mr-1 h-3 w-3" /> CSV
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数据内容</label>
              <textarea
                className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={importFormat === 'json'
                  ? '[\n  { "input": "问题", "expectedOutput": "答案", "difficulty": "easy" }\n]'
                  : 'input,expectedOutput,difficulty\n问题,答案,easy'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>取消</Button>
            <Button onClick={handleImport} disabled={!importData}>导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除该数据集吗？关联的测试用例也会被删除。此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> 数据集详情
            </DialogTitle>
            <DialogDescription>查看数据集信息和测试用例</DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : detailDataset ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* 数据集基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{detailDataset.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">描述：</span>
                      <p className="text-sm">{detailDataset.description || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">分类：</span>
                      <div className="mt-1">
                        {detailDataset.category ? (
                          <Badge variant="outline">{detailDataset.category}</Badge>
                        ) : '-'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">创建时间：</span>
                      <p className="text-sm">{new Date(detailDataset.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">测试用例数：</span>
                      <p className="text-sm">
                        <Badge variant="secondary">{detailDataset.testCases?.length || 0}</Badge>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 测试用例列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">测试用例 ({detailDataset.testCases?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {(!detailDataset.testCases || detailDataset.testCases.length === 0) ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4">暂无测试用例</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {detailDataset.testCases.map((tc, index) => (
                        <Card key={tc.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              {/* 用例标题 */}
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">用例 #{index + 1}</h4>
                                <div className="flex items-center gap-2">
                                  {tc.difficulty && (
                                    <Badge className={getDifficultyColor(tc.difficulty)} variant="outline">
                                      {getDifficultyLabel(tc.difficulty)}
                                    </Badge>
                                  )}
                                  {tc.tags && (
                                    <div className="flex items-center gap-1">
                                      <Tag className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{tc.tags}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 输入内容 */}
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">输入问题：</label>
                                <p className="mt-1 text-sm bg-muted/50 rounded-md p-3">{tc.input}</p>
                              </div>

                              {/* 期望输出 */}
                              {tc.expectedOutput && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">期望输出：</label>
                                  <p className="mt-1 text-sm bg-green-500/5 border border-green-500/10 rounded-md p-3">
                                    {tc.expectedOutput}
                                  </p>
                                </div>
                              )}

                              {/* 元数据 */}
                              {tc.metadata && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">元数据：</label>
                                  <pre className="mt-1 text-xs bg-muted/50 rounded-md p-2 overflow-x-auto">
                                    {JSON.stringify(tc.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 版本管理 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GitBranch className="h-5 w-5" /> 版本管理
                    </CardTitle>
                    <Button size="sm" onClick={() => setCreateVersionOpen(true)}>
                      <Plus className="mr-1 h-3 w-3" /> 创建版本
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {versionsLoading ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                      <p className="mt-2 text-sm">加载中...</p>
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <History className="mx-auto h-12 w-12 text-muted-foreground/40" />
                      <p className="mt-4">暂无版本记录</p>
                      <p className="mt-1 text-xs">点击"创建版本"开始版本管理</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((v) => (
                        <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">v{v.version}</span>
                                <span className="text-sm">{v.name}</span>
                                {getVersionStatusBadge(v.status)}
                              </div>
                              {v.description && (
                                <span className="text-xs text-muted-foreground mt-1">{v.description}</span>
                              )}
                              <span className="text-xs text-muted-foreground mt-1">
                                {new Date(v.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {v.status === 'draft' && (
                              <Button variant="outline" size="sm" onClick={() => handlePublishVersion(v.id)}>
                                发布
                              </Button>
                            )}
                            {v.status === 'published' && (
                              <Button variant="outline" size="sm" onClick={() => handleArchiveVersion(v.id)}>
                                归档
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => handleRollbackVersion(v.id)}>
                              <RotateCcw className="mr-1 h-3 w-3" /> 回滚
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* 版本对比 */}
                      {versions.length >= 2 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <GitCompare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">版本对比</span>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                              value={diffVersions.v1}
                              onChange={(e) => setDiffVersions({ ...diffVersions, v1: e.target.value })}
                            >
                              <option value="">选择版本</option>
                              {versions.map(v => (
                                <option key={v.id} value={v.id}>v{v.version} {v.name}</option>
                              ))}
                            </select>
                            <span className="text-muted-foreground">vs</span>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                              value={diffVersions.v2}
                              onChange={(e) => setDiffVersions({ ...diffVersions, v2: e.target.value })}
                            >
                              <option value="">选择版本</option>
                              {versions.map(v => (
                                <option key={v.id} value={v.id}>v{v.version} {v.name}</option>
                              ))}
                            </select>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleDiffVersions}
                              disabled={!diffVersions.v1 || !diffVersions.v2}
                            >
                              对比
                            </Button>
                          </div>
                          
                          {/* 对比结果 */}
                          {diffResult && (
                            <div className="mt-3 rounded-lg bg-muted/50 p-3">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(diffResult, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 数据清洗与质量 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" /> 数据清洗与质量
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCleanDataset}
                      disabled={cleaning}
                    >
                      {cleaning ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          清洗中...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 h-3 w-3" /> 执行清洗
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewQualityReport}
                      disabled={qualityLoading}
                    >
                      {qualityLoading ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          加载中...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="mr-1 h-3 w-3" /> 查看质量报告
                        </>
                      )}
                    </Button>
                  </div>

                  {/* 质量报告 */}
                  {qualityReport && (
                    <div className="rounded-lg border p-4 space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> 数据质量报告
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-md bg-muted/50 p-2 text-center">
                          <div className="text-lg font-bold">{qualityReport.totalCases || 0}</div>
                          <div className="text-xs text-muted-foreground">总用例数</div>
                        </div>
                        <div className="rounded-md bg-green-500/10 p-2 text-center">
                          <div className="text-lg font-bold text-green-600">{qualityReport.validCases || 0}</div>
                          <div className="text-xs text-muted-foreground">有效用例</div>
                        </div>
                        <div className="rounded-md bg-yellow-500/10 p-2 text-center">
                          <div className="text-lg font-bold text-yellow-600">{qualityReport.warningCases || 0}</div>
                          <div className="text-xs text-muted-foreground">警告用例</div>
                        </div>
                        <div className="rounded-md bg-red-500/10 p-2 text-center">
                          <div className="text-lg font-bold text-red-600">{qualityReport.invalidCases || 0}</div>
                          <div className="text-xs text-muted-foreground">无效用例</div>
                        </div>
                      </div>
                      {qualityReport.issues && qualityReport.issues.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">发现的问题：</h5>
                          <ul className="space-y-1">
                            {qualityReport.issues.slice(0, 5).map((issue: any, idx: number) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${
                                  issue.severity === 'high' ? 'bg-red-500' : 
                                  issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`} />
                                {issue.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* 批量智能生成 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FlaskConical className="h-4 w-4" /> 批量智能生成
              </CardTitle>
              <Badge variant="outline">{detailDataset?.testCases?.length || 0} 条用例</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">场景描述 *</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={batchGenPrompt}
                    onChange={(e) => setBatchGenPrompt(e.target.value)}
                    placeholder="描述 AI 智能体的使用场景，例如：&#10;我们是一个生鲜电商平台的客服智能体，需要处理用户的订单查询、退换货、商品咨询等问题..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">生成数量</label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      step="10"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={batchGenCount}
                      onChange={(e) => setBatchGenCount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Persona 数</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={batchGenPersonas}
                      onChange={(e) => setBatchGenPersonas(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchGenEdgeCases}
                        onChange={(e) => setBatchGenEdgeCases(e.target.checked)}
                        className="rounded border-input"
                      />
                      <Zap className="h-3.5 w-3.5 text-warning" />
                      包含边缘用例
                    </label>
                  </div>
                </div>
                <Button
                  onClick={handleBatchGenerate}
                  disabled={!batchGenPrompt || batchGenLoading}
                  className="w-full gap-2"
                >
                  {batchGenLoading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> AI 批量生成中...</>
                  ) : (
                    <><FlaskConical className="h-4 w-4" /> 一键批量生成 {batchGenCount} 条用例</>
                  )}
                </Button>
              </div>

              {batchGenResult && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> 生成完成
                    </h4>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                      导入 {batchGenResult.importedCount} 条
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-md bg-muted/50 p-2 text-center">
                      <div className="text-lg font-bold">{batchGenResult.result?.summary?.totalPersonas || 0}</div>
                      <div className="text-xs text-muted-foreground">Persona</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2 text-center">
                      <div className="text-lg font-bold">{batchGenResult.result?.summary?.totalTestCases || 0}</div>
                      <div className="text-xs text-muted-foreground">总用例</div>
                    </div>
                    <div className="rounded-md bg-yellow-500/10 p-2 text-center">
                      <div className="text-lg font-bold text-yellow-600">{batchGenResult.result?.summary?.edgeCaseCount || 0}</div>
                      <div className="text-xs text-muted-foreground">边缘用例</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 评测集验证 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" /> 评测集验证
              </CardTitle>
              {detailDataset?.validationStatus && (
                <Badge variant={
                  detailDataset.validationStatus === 'validated' ? 'default' :
                  detailDataset.validationStatus === 'rejected' ? 'destructive' :
                  detailDataset.validationStatus === 'validating' ? 'secondary' : 'outline'
                }>
                  {detailDataset.validationStatus === 'validated' ? '已验证' :
                   detailDataset.validationStatus === 'rejected' ? '已拒绝' :
                   detailDataset.validationStatus === 'validating' ? '验证中' : '草稿'}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 验证操作按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={validating || detailDataset?.validationStatus === 'validated'}
                  className="gap-1"
                >
                  {validating ? (
                    <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> 验证中...</>
                  ) : (
                    <><Play className="h-3 w-3" /> 执行验证</>
                  )}
                </Button>
                {detailDataset?.validationStatus === 'draft' && validationReport && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleApprove}
                      className="gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-3 w-3" /> 审批通过
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectOpen(true)}
                      className="gap-1"
                    >
                      <XCircle className="h-3 w-3" /> 拒绝
                    </Button>
                  </>
                )}
              </div>

              {/* 验证报告 */}
              {validationReport && (
                <div className="space-y-4">
                  {/* 综合质量分 */}
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-3">综合质量评估</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{(validationReport.overallQuality * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">综合质量分</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{(validationReport.coverageScore * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">覆盖度</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{(validationReport.discriminationScore * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">区分度</div>
                      </div>
                    </div>
                  </div>

                  {/* 难度分布 */}
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-3">难度分布</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{validationReport.difficultyDistribution.easy}</div>
                        <div className="text-xs text-muted-foreground">简单</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{validationReport.difficultyDistribution.medium}</div>
                        <div className="text-xs text-muted-foreground">中等</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{validationReport.difficultyDistribution.hard}</div>
                        <div className="text-xs text-muted-foreground">困难</div>
                      </div>
                    </div>
                  </div>

                  {/* 问题用例 */}
                  {validationReport.problematicCases.length > 0 && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning" /> 问题用例 ({validationReport.problematicCases.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {validationReport.problematicCases.slice(0, 5).map((pc, idx) => (
                          <div key={idx} className="rounded-md bg-muted/50 p-2 text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                pc.issue === 'too_easy' ? 'default' :
                                pc.issue === 'too_hard' ? 'destructive' : 'secondary'
                              } className="text-xs">
                                {pc.issue === 'too_easy' ? '过易' :
                                 pc.issue === 'too_hard' ? '过难' :
                                 pc.issue === 'low_discrimination' ? '区分度低' : '重复意图'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{pc.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 建议 */}
                  {validationReport.suggestions.length > 0 && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-3">改进建议</h4>
                      <ul className="space-y-2">
                        {validationReport.suggestions.map((s, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝原因 Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝数据集</DialogTitle>
            <DialogDescription>请输入拒绝原因</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">拒绝原因</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={aiGenerateOpen} onOpenChange={setAiGenerateOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI 智能生成
            </DialogTitle>
            <DialogDescription>
              输入测试问题，AI 将生成多个候选答案供你选择
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* 输入区域 */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">测试问题 *</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={aiGenerateInput}
                  onChange={(e) => setAiGenerateInput(e.target.value)}
                  placeholder="例如：我们门店蔬菜损耗率达到18%，请分析原因和改善建议"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">参考上下文（可选）</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={aiGenerateContext}
                  onChange={(e) => setAiGenerateContext(e.target.value)}
                  placeholder="提供相关背景信息，帮助 AI 生成更准确的答案"
                />
              </div>
              <Button 
                onClick={handleAiGenerate} 
                disabled={!aiGenerateInput || aiGenerateLoading}
                className="w-full gap-2"
              >
                {aiGenerateLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> 生成候选答案
                  </>
                )}
              </Button>
            </div>

            {/* 生成结果 */}
            {aiGenerateResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">候选答案 ({aiGenerateResult.candidates?.length || 0})</h4>
                  {aiGenerateResult.recommendation !== undefined && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                      推荐答案 #{aiGenerateResult.recommendation + 1}
                    </Badge>
                  )}
                </div>
                
                {aiGenerateResult.candidates?.map((candidate: any, index: number) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      aiGenerateResult.recommendation === index ? 'border-primary border-2' : ''
                    }`}
                    onClick={() => handleSelectCandidate(candidate, index)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">答案 #{index + 1}</Badge>
                            <Badge variant="secondary" className="text-xs">{candidate.style}</Badge>
                            {aiGenerateResult.recommendation === index && (
                              <Badge className="bg-green-500/10 text-green-600 text-xs">推荐</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm bg-muted/50 rounded-md p-3">{candidate.text}</p>
                        {candidate.scores && (
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>准确性: {(candidate.scores.accuracy * 100).toFixed(0)}%</span>
                            <span>完整性: {(candidate.scores.completeness * 100).toFixed(0)}%</span>
                            <span>质量: {(candidate.scores.quality * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiGenerateOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Version Dialog */}
      <Dialog open={createVersionOpen} onOpenChange={setCreateVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" /> 创建版本
            </DialogTitle>
            <DialogDescription>为当前数据集创建新版本</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">版本名称 *</label>
              <Input
                value={versionFormData.name}
                onChange={(e) => setVersionFormData({ ...versionFormData, name: e.target.value })}
                placeholder="例如：v1.0.0 初始版本"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">版本描述</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={versionFormData.description}
                onChange={(e) => setVersionFormData({ ...versionFormData, description: e.target.value })}
                placeholder="描述此版本的变更内容..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateVersionOpen(false)}>取消</Button>
            <Button onClick={handleCreateVersion} disabled={!versionFormData.name}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 智能批量生成 Dialog */}
      <Dialog open={syntheticOpen} onOpenChange={setSyntheticOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" /> 智能批量生成
            </DialogTitle>
            <DialogDescription>
              {syntheticStep === 'config' && '配置生成参数，AI 将基于用户画像自动生成评测用例'}
              {syntheticStep === 'preview' && `预览生成结果，共 ${syntheticResult?.testCases?.length || 0} 条用例`}
              {syntheticStep === 'done' && '生成完成'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {syntheticStep === 'config' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">场景描述 / Prompt 模板 *</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={syntheticConfig.prompt}
                    onChange={(e) => setSyntheticConfig({ ...syntheticConfig, prompt: e.target.value })}
                    placeholder="描述 AI 智能体的使用场景，例如：&#10;我们是一个生鲜电商平台的客服智能体，需要处理用户的订单查询、退换货、商品咨询等问题..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Persona 数量
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={syntheticConfig.numPersonas}
                      onChange={(e) => setSyntheticConfig({ ...syntheticConfig, numPersonas: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">每 Persona 用例数</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={syntheticConfig.numTestCasesPerPersona}
                      onChange={(e) => setSyntheticConfig({ ...syntheticConfig, numTestCasesPerPersona: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">额外指令（可选）</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={syntheticConfig.instructions}
                    onChange={(e) => setSyntheticConfig({ ...syntheticConfig, instructions: e.target.value })}
                    placeholder="例如：重点关注生鲜配送延迟和退款场景..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">语言</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={syntheticConfig.language}
                      onChange={(e) => setSyntheticConfig({ ...syntheticConfig, language: e.target.value })}
                    >
                      <option value="中文">中文</option>
                      <option value="英文">英文</option>
                      <option value="中英混合">中英混合</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syntheticConfig.edgeCases}
                        onChange={(e) => setSyntheticConfig({ ...syntheticConfig, edgeCases: e.target.checked })}
                        className="rounded border-input"
                      />
                      <Zap className="h-3.5 w-3.5 text-warning" />
                      包含边缘/对抗用例
                    </label>
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    预计生成 <strong className="text-foreground">
                      {parseInt(syntheticConfig.numPersonas) * parseInt(syntheticConfig.numTestCasesPerPersona) + (syntheticConfig.edgeCases ? 5 : 0)}
                    </strong> 条测试用例
                    （{syntheticConfig.numPersonas} 个 Persona × {syntheticConfig.numTestCasesPerPersona} 条/Persona{syntheticConfig.edgeCases ? ' + 5 条边缘用例' : ''}）
                  </p>
                </div>
              </div>
            )}

            {syntheticStep === 'preview' && syntheticResult && (
              <div className="space-y-4">
                {/* Persona 概览 */}
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" /> 生成的用户画像 ({syntheticResult.personas?.length || 0})
                  </h4>
                  <div className="grid gap-2">
                    {syntheticResult.personas?.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-md bg-muted/30 p-2">
                        <Badge variant="outline" className="shrink-0">{p.name}</Badge>
                        <span className="text-xs text-muted-foreground truncate">{p.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 测试用例预览 */}
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> 测试用例 ({syntheticResult.testCases?.length || 0})
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {syntheticResult.testCases?.map((tc: any, i: number) => (
                      <div key={i} className="rounded-md border p-2.5 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={tc.category === 'edge_case' ? 'destructive' : tc.category === 'adversarial' ? 'default' : 'secondary'} className="text-xs">
                            {tc.category === 'edge_case' ? '边缘' : tc.category === 'adversarial' ? '对抗' : '普通'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{tc.difficulty}</Badge>
                          <span className="text-xs text-muted-foreground">{tc.personaName}</span>
                        </div>
                        <p className="text-xs">{tc.input}</p>
                        {tc.expectedBehavior && (
                          <p className="text-xs text-muted-foreground mt-1">期望: {tc.expectedBehavior}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 统计摘要 */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <div className="text-lg font-bold">{syntheticResult.summary?.totalPersonas || 0}</div>
                    <div className="text-xs text-muted-foreground">Persona</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <div className="text-lg font-bold">{syntheticResult.summary?.totalTestCases || 0}</div>
                    <div className="text-xs text-muted-foreground">总用例</div>
                  </div>
                  <div className="rounded-md bg-yellow-500/10 p-2 text-center">
                    <div className="text-lg font-bold text-yellow-600">{syntheticResult.summary?.edgeCaseCount || 0}</div>
                    <div className="text-xs text-muted-foreground">边缘用例</div>
                  </div>
                  <div className="rounded-md bg-green-500/10 p-2 text-center">
                    <div className="text-lg font-bold text-green-600">{Object.keys(syntheticResult.summary?.categories || {}).length}</div>
                    <div className="text-xs text-muted-foreground">分类数</div>
                  </div>
                </div>
              </div>
            )}

            {syntheticStep === 'done' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium">生成完成</h4>
                  <p className="text-sm text-muted-foreground">
                    已成功将 {syntheticResult?.testCases?.length || 0} 条测试用例导入数据集
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {syntheticStep === 'config' && (
              <>
                <Button variant="outline" onClick={() => setSyntheticOpen(false)}>取消</Button>
                <Button onClick={handleSyntheticPreview} disabled={!syntheticConfig.prompt || syntheticLoading} className="gap-2">
                  {syntheticLoading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> AI 生成中...</>
                  ) : (
                    <><FlaskConical className="h-4 w-4" /> 预览生成结果</>
                  )}
                </Button>
              </>
            )}
            {syntheticStep === 'preview' && (
              <>
                <Button variant="outline" onClick={() => setSyntheticStep('config')}>返回配置</Button>
                <Button onClick={handleSyntheticImport} disabled={syntheticLoading} className="gap-2">
                  {syntheticLoading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> 导入中...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> 导入到数据集</>
                  )}
                </Button>
              </>
            )}
            {syntheticStep === 'done' && (
              <Button onClick={() => setSyntheticOpen(false)}>关闭</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
