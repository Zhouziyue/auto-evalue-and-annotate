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
  Trophy,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
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
  { key: '/leaderboard', icon: Trophy, label: '排行榜' },
  { key: '/observability', icon: Activity, label: '可观测性' },
]

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const currentPage = menuItems.find((item) => item.key === location.pathname)

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavigate = (key: string) => {
    navigate(key)
    setSearchOpen(false)
    setSearchQuery('')
  }

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
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Version */}
        {!collapsed && (
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">v1.100</div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {currentPage?.label || '看板'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">搜索页面...</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ⌘K
                </kbd>
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-md border bg-popover p-2 shadow-lg">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="搜索页面..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    {filteredMenuItems.map(item => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNavigate(item.key)}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
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
