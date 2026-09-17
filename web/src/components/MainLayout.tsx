import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  AppWindow,
  Bot,
  Database,
  PlayCircle,
  Tag,
  BarChart3,
  GitBranch,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const menuItems = [
  { key: '/dashboard', icon: LayoutDashboard, label: '看板' },
  { key: '/skills', icon: AppWindow, label: '技能管理' },
  { key: '/agents', icon: Bot, label: '智能体管理' },
  { key: '/datasets', icon: Database, label: '评测数据集' },
  { key: '/eval-runs', icon: PlayCircle, label: '评测执行' },
  { key: '/annotations', icon: Tag, label: '标注管理' },
  { key: '/reports', icon: BarChart3, label: '评测报告' },
  { key: '/pipelines', icon: GitBranch, label: '流水线' },
]

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!collapsed && <span className="text-lg font-bold">技能评测系统</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto rounded-md p-1 hover:bg-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.key
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center border-b bg-background px-6">
          <h1 className="text-lg font-semibold">
            {menuItems.find((item) => item.key === location.pathname)?.label || '看板'}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
