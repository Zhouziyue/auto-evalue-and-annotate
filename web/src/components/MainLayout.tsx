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
  Settings,
} from 'lucide-react'

// 规范 §7.1: 后台应用标准布局
// 侧边栏 w:240px(折叠64px) | 顶栏 h:56px | 内容区 padding:24px
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
    <div className="flex min-h-screen bg-secondary/30">
      {/* ===== Sidebar ===== */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo — h:56px 与顶栏对齐 */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!collapsed && (
            <span className="text-lg font-bold text-foreground truncate">
              技能评测系统
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'ml-auto flex h-7 w-7 items-center justify-center rounded-md',
              'text-muted-foreground hover:bg-accent hover:text-foreground',
              'transition-colors duration-150'
            )}
            aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.key
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                  'transition-colors duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
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

      {/* ===== Main Content ===== */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header — h:56px */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-6 shadow-xs">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">
              {currentPage?.label || '看板'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md border border-border',
                  'bg-background px-3 text-sm text-muted-foreground',
                  'hover:border-primary/50 hover:text-foreground',
                  'transition-colors duration-150'
                )}
                aria-label="搜索页面"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">搜索页面...</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-popover p-2 shadow-lg animate-toast-in">
                  <div className="flex items-center gap-2 border-b border-border-light pb-2">
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
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors duration-150"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </button>
                      )
                    })}
                    {filteredMenuItems.length === 0 && (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        未找到匹配页面
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
              aria-label="系统设置"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content — 规范 §7.3: padding:24px (p-6) */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
