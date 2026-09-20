import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Eye, GitBranch, ArrowRight } from 'lucide-react'
import axios from 'axios'

export default function DataLineage() {
  const [nodes, setNodes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [lineage, setLineage] = useState<any>(null)
  const { toastError } = useToastActions()

  useEffect(() => { fetchNodes() }, [])

  const fetchNodes = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/lineage/nodes')
      setNodes(res.data || [])
    } catch (e) {
      setNodes([])
    }
    setLoading(false)
  }

  const fetchLineage = async (id: string) => {
    try {
      const res = await axios.get(`/api/eval/lineage/${id}/full`)
      setLineage(res.data)
    } catch (e) {
      toastError('获取血缘失败')
    }
  }

  const openDetail = async (node: any) => {
    setSelectedNode(node)
    setDetailOpen(true)
    await fetchLineage(node.id)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2"><GitBranch className="h-5 w-5" /> 数据血缘</h3>
      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    暂无节点
                  </TableCell>
                </TableRow>
              ) : (
                nodes.map(node => (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium">{node.name}</TableCell>
                    <TableCell><Badge variant="outline">{node.type}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{node.description || '-'}</TableCell>
                    <TableCell>{new Date(node.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(node)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>数据血缘详情</DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">名称</label>
                  <p className="mt-1 text-sm">{selectedNode.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">类型</label>
                  <p className="mt-1"><Badge>{selectedNode.type}</Badge></p>
                </div>
              </div>
              {lineage && (
                <div className="space-y-4">
                  {lineage.upstream && lineage.upstream.length > 0 && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 rotate-180" /> 上游依赖
                      </label>
                      <div className="mt-2 space-y-1">
                        {lineage.upstream.map((u: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                            <Badge variant="outline">{u.type}</Badge>
                            <span className="text-sm">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {lineage.downstream && lineage.downstream.length > 0 && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" /> 下游依赖
                      </label>
                      <div className="mt-2 space-y-1">
                        {lineage.downstream.map((d: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                            <Badge variant="outline">{d.type}</Badge>
                            <span className="text-sm">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
