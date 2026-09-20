import { useState, useEffect, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { LucideIcon } from 'lucide-react'
import axios from 'axios'

// ===== Types =====
export interface StatCard {
  label: string
  value: string | number
  icon: LucideIcon
  sub?: string
}

export interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}

// ===== Stats Grid =====
export function StatsGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((s, i) => {
        const Icon = s.icon
        return (
          <Card key={i} className="hover:shadow-sm transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ===== Empty State =====
export function EmptyState({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <TableRow>
      <TableCell colSpan={10} className="text-center">
        <div className="py-12">
          <Icon className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ===== Data Table =====
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyIcon,
  emptyTitle,
  emptyDesc,
  keyField,
}: {
  columns: Column<T>[]
  data: T[]
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDesc: string
  keyField: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(col => (
            <TableHead key={col.key} className={col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}>
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} desc={emptyDesc} />
        ) : (
          data.map((item, idx) => (
            <TableRow key={item[keyField] || idx} className="hover:bg-muted/50 transition-colors duration-150">
              {columns.map(col => (
                <TableCell key={col.key} className={col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}>
                  {col.render ? col.render(item) : (item[col.key] ?? '-')}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

// ===== Status Badge =====
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'default' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: '活跃' },
    running: { variant: 'default', label: '运行中' },
    completed: { variant: 'default', label: '已完成' },
    success: { variant: 'default', label: '成功' },
    passed: { variant: 'default', label: '通过' },
    enabled: { variant: 'default', label: '已启用' },
    inactive: { variant: 'outline', label: '未激活' },
    pending: { variant: 'outline', label: '待处理' },
    draft: { variant: 'outline', label: '草稿' },
    paused: { variant: 'outline', label: '已暂停' },
    stopped: { variant: 'outline', label: '已停止' },
    disabled: { variant: 'outline', label: '已禁用' },
    failed: { variant: 'destructive', label: '失败' },
    error: { variant: 'destructive', label: '错误' },
    cancelled: { variant: 'destructive', label: '已取消' },
    archived: { variant: 'outline', label: '已归档' },
  }
  const cfg = map[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

// ===== Score Text =====
export function ScoreText({ value }: { value: number }) {
  if (typeof value !== 'number' || isNaN(value)) return <span className="font-bold text-muted-foreground">-</span>
  const pct = (value * 100).toFixed(1)
  const cls = value >= 0.8 ? 'text-success' : value >= 0.6 ? 'text-warning' : 'text-destructive'
  return <span className={`font-bold ${cls}`}>{pct}%</span>
}

// ===== useApi hook =====
export function useApi<T>(fetcher: () => Promise<any>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetcher()
        if (!cancelled) setData(res.data ?? res)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, deps)

  return { data, loading, setData }
}

// ===== useApiList hook =====
export function useApiList<T>(fetcher: () => Promise<any>, deps: any[] = []) {
  const [list, setList] = useState<T[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetcher()
        if (!cancelled) setList(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, deps)

  return { list, loading, setList }
}

export { Card, CardContent, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, axios }
