import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToastActions } from '@/components/ui/toast'
import { Plus, Trophy, Eye } from 'lucide-react'
import axios from 'axios'

export default function EloRating() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [battles, setBattles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ modelA: '', modelB: '', winner: 'A' })
  const { toastSuccess, toastError } = useToastActions()

  useEffect(() => {
    fetchLeaderboard()
    fetchBattles()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/eval/elo/leaderboard')
      setLeaderboard(res.data || [])
    } catch (e) {
      setLeaderboard([])
    }
    setLoading(false)
  }

  const fetchBattles = async () => {
    try {
      const res = await axios.get('/api/eval/elo/battles')
      setBattles(res.data || [])
    } catch (e) {
      setBattles([])
    }
  }

  const handleRecordBattle = async () => {
    if (!formData.modelA || !formData.modelB) return
    try {
      await axios.post('/api/eval/elo/battles', {
        modelA: formData.modelA,
        modelB: formData.modelB,
        winner: formData.winner,
      })
      toastSuccess('对战记录已保存')
      setCreateOpen(false)
      setFormData({ modelA: '', modelB: '', winner: 'A' })
      fetchLeaderboard()
      fetchBattles()
    } catch (e: any) {
      toastError(e?.response?.data?.message || '记录失败')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Elo 排行榜
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 记录对战
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>Elo 评分</TableHead>
                <TableHead>胜</TableHead>
                <TableHead>负</TableHead>
                <TableHead>平</TableHead>
                <TableHead>胜率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    暂无排行数据
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((model, i) => (
                  <TableRow key={model.model}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {i === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {i === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                        {i === 2 && <Trophy className="h-4 w-4 text-amber-600" />}
                        <span className="font-medium">#{i + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{model.model}</TableCell>
                    <TableCell><Badge variant="outline">{model.rating.toFixed(0)}</Badge></TableCell>
                    <TableCell className="text-green-600">{model.wins}</TableCell>
                    <TableCell className="text-red-600">{model.losses}</TableCell>
                    <TableCell>{model.draws}</TableCell>
                    <TableCell>{(model.winRate * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近对战</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型 A</TableHead>
                <TableHead>模型 B</TableHead>
                <TableHead>胜者</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {battles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    暂无对战记录
                  </TableCell>
                </TableRow>
              ) : (
                battles.slice(0, 10).map((battle, i) => (
                  <TableRow key={i}>
                    <TableCell>{battle.modelA}</TableCell>
                    <TableCell>{battle.modelB}</TableCell>
                    <TableCell>
                      <Badge className={battle.winner === 'tie' ? 'bg-gray-500/10' : 'bg-green-500/10 text-green-600'}>
                        {battle.winner === 'tie' ? '平局' : battle.winner === 'A' ? battle.modelA : battle.modelB}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(battle.createdAt).toLocaleString()}</TableCell>
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
            <DialogTitle>记录对战</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">模型 A *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.modelA}
                onChange={(e) => setFormData({ ...formData, modelA: e.target.value })}
                placeholder="模型A名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">模型 B *</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.modelB}
                onChange={(e) => setFormData({ ...formData, modelB: e.target.value })}
                placeholder="模型B名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">胜者</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.winner}
                onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
              >
                <option value="A">模型 A</option>
                <option value="B">模型 B</option>
                <option value="tie">平局</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleRecordBattle} disabled={!formData.modelA || !formData.modelB}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
