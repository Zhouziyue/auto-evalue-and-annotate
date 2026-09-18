import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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
  Menu,
  X,
} from 'lucide-react'

// 规范 §7.1: 后台应用标准布局
// 侧边栏 w:240px(折叠64px) | 顶栏 h:56px | 内容区 padding:24px
const menuItems = [
  { key: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { key: '/skills', icon: AppWindow, labelKey: 'nav.skills' },
  { key: '/agents', icon: Bot, labelKey: 'nav.agents' },
  { key: '/datasets', icon: Database, labelKey: 'nav.datasets' },
  { key: '/eval-runs', icon: PlayCircle, labelKey: 'nav.evalRuns' },
  { key: '/annotations', icon: Tag, labelKey: 'nav.annotations' },
  { key: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { key: '/pipelines', icon: GitBranch, labelKey: 'nav.pipelines' },
  { key: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' },
  { key: '/observability', icon: Activity, labelKey: 'nav.observability' },
]

function MainLayout() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 路由变化时关闭移动端侧边栏
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const currentPage = menuItems.find((item) => item.key === location.pathname)

  // 处理不在 menuItems 中的页面标题
  const getPageTitle = () => {
    if (currentPage) return t(currentPage.labelKey)
    if (location.pathname === '/settings') return t('common.settings')
    return t('nav.dashboard')
  }

  const filteredMenuItems = menuItems.filter(item =>
    t(item.labelKey).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavigate = (key: string) => {
    navigate(key)
    setSearchOpen(false)
    setSearchQuery('')
  }

  // 菜单渲染
  const renderMenu = () => (
    <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.key
        return (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.key)}
            title={(collapsed || isMobile) ? t(item.labelKey) : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
              'transition-colors duration-150',
              isActive
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {(!collapsed && !isMobile) && <span className="truncate">{t(item.labelKey)}</span>}
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* ===== Mobile Overlay ===== */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-[width] duration-300 ease-in-out',
          // 移动端: fixed overlay
          isMobile && cn(
            'fixed inset-y-0 left-0 z-50 w-60',
            'transform transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          ),
          // 桌面端: 正常流
          !isMobile && (collapsed ? 'w-16' : 'w-60')
        )}
      >
        {/* Logo — h:56px 与顶栏对齐 */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-bold text-foreground truncate">
            {t('app.title')}
          </span>
          {/* 移动端关闭按钮 */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="关闭侧边栏"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {/* 桌面端折叠按钮 */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'ml-auto flex h-7 w-7 items-center justify-center rounded-md',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                'transition-colors duration-150'
              )}
              aria-label={collapsed ? t('common.expand') : t('common.collapse')}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Menu */}
        {renderMenu()}

        {/* Version */}
        {(!collapsed || isMobile) && (
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">{t('app.version')}</div>
          </div>
        )}
      </aside>

      {/* ===== Main Content ===== */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header — h:56px */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            {/* 移动端汉堡菜单 */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
                aria-label="打开菜单"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Global Search */}
            <div className="relative">
              <button
                onClick={() => {
                  setSearchOpen(!searchOpen)
                  if (searchOpen) setSearchQuery('') // 关闭搜索框时清空搜索内容
                }}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md border border-border',
                  'bg-background px-3 text-sm text-muted-foreground',
                  'hover:border-primary/50 hover:text-foreground',
                  'transition-colors duration-150'
                )}
                aria-label={t('common.search')}
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">{t('common.search')}</span>
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-popover p-2 shadow-lg animate-toast-in">
                  <div className="flex items-center gap-2 border-b border-border-light pb-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder={t('common.search')}
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
                          {t(item.labelKey)}
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
              onClick={() => navigate('/settings')}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
              aria-label={t('common.settings')}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content — 规范 §7.3: padding:24px (p-6) */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
