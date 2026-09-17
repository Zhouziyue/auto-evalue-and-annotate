import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitBranch } from 'lucide-react'

const presets = [
  { name: '快速评测', desc: '执行 → 规则评测 → 出报告', nodes: 3 },
  { name: '完整评测', desc: '执行 → 规则评测 → AI评测 → 标注 → 修复 → 再验证', nodes: 6 },
  { name: '回归评测', desc: '执行 → 对比上一版本 → 告警', nodes: 3 },
]

export default function Pipelines() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> 评测流水线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {presets.map((p) => (
              <div key={p.name} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  <Badge variant="secondary">{p.nodes} 节点</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
