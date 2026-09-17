import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag } from 'lucide-react'

export default function Annotations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> 标注管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="py-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">暂无标注数据</p>
          <p className="mt-2 text-sm text-muted-foreground">完成评测后，可在此进行 AI 预标注和人工复核</p>
        </div>
      </CardContent>
    </Card>
  )
}
