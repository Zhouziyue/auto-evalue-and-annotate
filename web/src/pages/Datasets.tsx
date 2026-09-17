import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Database } from 'lucide-react'
import axios from 'axios'

interface Dataset {
  id: string
  name: string
  description: string | null
  category: string | null
  _count?: { testCases: number }
  createdAt: string
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', category: '' })

  const fetchDatasets = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/datasets')
      setDatasets(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchDatasets() }, [])

  const handleCreate = async () => {
    try {
      await axios.post('/api/datasets', formData)
      setModalOpen(false)
      setFormData({ name: '', description: '', category: '' })
      fetchDatasets()
    } catch (e: any) {
      alert(e?.response?.data?.message || '创建失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> 评测数据集</CardTitle>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建数据集
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="text-center">用例数</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">加载中...</TableCell></TableRow>
              ) : datasets.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                datasets.map((ds) => (
                  <TableRow key={ds.id}>
                    <TableCell className="font-medium">{ds.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{ds.description || '-'}</TableCell>
                    <TableCell>{ds.category ? <Badge variant="outline">{ds.category}</Badge> : '-'}</TableCell>
                    <TableCell className="text-center">{ds._count?.testCases || 0}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(ds.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建数据集</DialogTitle>
            <DialogDescription>创建评测数据集</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
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
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
