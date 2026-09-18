import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToastActions } from '@/components/ui/toast'
import { Bell, Send, Save } from 'lucide-react'
import axios from 'axios'

interface AlertConfig {
  id: string
  channel: string
  webhookKey: string
  passRateThreshold: number
  enabled: boolean
}

export default function Settings() {
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [webhookKey, setWebhookKey] = useState('')
  const [threshold, setThreshold] = useState(80)
  const [enabled, setEnabled] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toastSuccess, toastError, toastWarning } = useToastActions()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/alert/config')
      if (res.data) {
        setConfig(res.data)
        setWebhookKey(res.data.webhookKey)
        setThreshold(res.data.passRateThreshold)
        setEnabled(res.data.enabled)
      }
    } catch (e) {
      // 没有配置时返回空，不报错
    }
  }

  const handleSave = async () => {
    if (!webhookKey) {
      toastWarning('请输入 Webhook Key')
      return
    }
    setSaving(true)
    try {
      await axios.put('/api/alert/config', {
        webhookKey,
        passRateThreshold: threshold,
        enabled,
      })
      toastSuccess('告警配置已保存')
    } catch (e) {
      toastError('保存失败')
    }
    setSaving(false)
  }

  const handleTest = async () => {
    if (!webhookKey) {
      toastWarning('请先输入 Webhook Key')
      return
    }
    setTesting(true)
    try {
      // 先保存再测试
      await axios.put('/api/alert/config', { webhookKey, passRateThreshold: threshold, enabled })
      const res = await axios.post('/api/alert/test')
      if (res.data.success) {
        toastSuccess('测试消息已发送')
      } else {
        toastError(res.data.message || '发送失败')
      }
    } catch (e) {
      toastError('测试失败')
    }
    setTesting(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> 告警通知配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 企业微信 Webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium">企业微信机器人 Webhook Key</label>
            <Input
              value={webhookKey}
              onChange={(e) => setWebhookKey(e.target.value)}
              placeholder="输入企业微信机器人的 Webhook Key"
            />
            <p className="text-xs text-muted-foreground">
              在企业微信群中添加机器人，获取 Webhook 地址中的 key 参数
            </p>
          </div>

          {/* 通过率阈值 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">通过率告警阈值 (%)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 80)}
            />
            <p className="text-xs text-muted-foreground">
              当评测通过率低于此阈值时，自动发送告警通知
            </p>
          </div>

          {/* 启用开关 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">启用告警</label>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                enabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">{enabled ? '已启用' : '已禁用'}</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? '保存中...' : '保存配置'}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              <Send className="mr-2 h-4 w-4" />
              {testing ? '发送中...' : '测试连通性'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. 在企业微信群聊中添加群机器人，获取 Webhook 地址</p>
          <p>2. 将 Webhook 地址中 <code className="rounded bg-muted px-1">key=</code> 后面的值填入上方输入框</p>
          <p>3. 设置通过率阈值，当评测结果低于阈值时自动告警</p>
          <p>4. 点击"测试连通性"验证配置是否正确</p>
        </CardContent>
      </Card>
    </div>
  )
}
