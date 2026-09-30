import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import AnnotationOverview from '@/components/annotations/AnnotationOverview'
import AnnotationWorkbench from '@/components/annotations/AnnotationWorkbench'
import AnnotationDashboard from '@/components/annotations/AnnotationDashboard'

// 标注管理：总览 / 标注工作台 / 一致性质量看板 三视图
export default function Annotations() {
  const [tab, setTab] = useState('overview')
  const [workbenchStatus, setWorkbenchStatus] = useState<string>('pending')

  // 从总览/看板跳转到工作台并带入状态筛选
  const goWorkbench = (status?: string) => {
    setWorkbenchStatus(status || 'pending')
    setTab('workbench')
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="overview">标注总览</TabsTrigger>
        <TabsTrigger value="workbench">标注工作台</TabsTrigger>
        <TabsTrigger value="dashboard">质量看板</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <AnnotationOverview onGoWorkbench={goWorkbench} />
      </TabsContent>
      <TabsContent value="workbench">
        <AnnotationWorkbench initialStatus={workbenchStatus} />
      </TabsContent>
      <TabsContent value="dashboard">
        <AnnotationDashboard onGoWorkbench={goWorkbench} />
      </TabsContent>
    </Tabs>
  )
}
