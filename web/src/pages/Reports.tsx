import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function Reports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> 评测报告</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="py-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">暂无评测报告</p>
          <p className="mt-2 text-sm text-muted-foreground">完成评测后，可在此查看详细报告</p>
        </div>
      </CardContent>
    </Card>
  )
}
