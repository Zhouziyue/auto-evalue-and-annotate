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
  ChevronDown,
  Search,
  Settings,
  Menu,
  X,
  Grid3X3,
  Shield,
  MessageSquare,
  Eye,
  Scale,
  FlaskConical,
  Zap,
  DollarSign,
  Award,
  TrendingDown,
  Camera,
  Clock,
  FileText,
  Send,
  Timer,
  Wifi,
  Layers,
  GitMerge,
  ArrowLeftRight,
  Bell,
  Users,
  Filter,
  CheckCircle,
  Workflow,
  Cog,
  Globe,
  Building,
  HardDrive,
  RotateCcw,
  Microscope,
  ShieldOff,
  Gauge,
  Languages,
  FileOutput,
  GitCommit,
  PieChart,
  Map,
  HelpCircle,
  Cpu,
  Network,
  Package,
} from 'lucide-react'

interface MenuItem {
  key: string
  icon: React.ComponentType<{ className?: string }>
  labelKey: string
}

interface MenuGroup {
  labelKey: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    labelKey: 'nav.groupOverview',
    items: [
      { key: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    ],
  },
  {
    labelKey: 'nav.groupResources',
    items: [
      { key: '/skills', icon: AppWindow, labelKey: 'nav.skills' },
      { key: '/agents', icon: Bot, labelKey: 'nav.agents' },
      { key: '/datasets', icon: Database, labelKey: 'nav.datasets' },
      { key: '/eval-runs', icon: PlayCircle, labelKey: 'nav.evalRuns' },
      { key: '/annotations', icon: Tag, labelKey: 'nav.annotations' },
      { key: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
      { key: '/pipelines', icon: GitBranch, labelKey: 'nav.pipelines' },
    ],
  },
  {
    labelKey: 'nav.groupEvalCore',
    items: [
      { key: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' },
      { key: '/observability', icon: Activity, labelKey: 'nav.observability' },
      { key: '/matrix', icon: Grid3X3, labelKey: 'nav.matrix' },
      { key: '/redteam', icon: Shield, labelKey: 'nav.redteam' },
      { key: '/rag', icon: MessageSquare, labelKey: 'nav.rag' },
      { key: '/conversation', icon: MessageSquare, labelKey: 'nav.conversation' },
      { key: '/traces', icon: Eye, labelKey: 'nav.traces' },
    ],
  },
  {
    labelKey: 'nav.groupAdvanced',
    items: [
      { key: '/multimodal', icon: Camera, labelKey: 'nav.multimodal' },
      { key: '/llm-judge', icon: Scale, labelKey: 'nav.llmJudge' },
      { key: '/guardrails', icon: Shield, labelKey: 'nav.guardrails' },
      { key: '/ab-tests', icon: ArrowLeftRight, labelKey: 'nav.abTests' },
      { key: '/prompt-optimize', icon: Zap, labelKey: 'nav.promptOptimize' },
      { key: '/cost-tracking', icon: DollarSign, labelKey: 'nav.costTracking' },
      { key: '/benchmark', icon: Award, labelKey: 'nav.benchmark' },
      { key: '/elo-rating', icon: Trophy, labelKey: 'nav.eloRating' },
      { key: '/regression', icon: TrendingDown, labelKey: 'nav.regression' },
      { key: '/snapshots', icon: Camera, labelKey: 'nav.snapshots' },
      { key: '/semantic-cache', icon: Clock, labelKey: 'nav.semanticCache' },
      { key: '/templates', icon: FileText, labelKey: 'nav.templates' },
    ],
  },
  {
    labelKey: 'nav.groupOps',
    items: [
      { key: '/webhooks', icon: Send, labelKey: 'nav.webhooks' },
      { key: '/scheduler', icon: Timer, labelKey: 'nav.scheduler' },
      { key: '/online-eval', icon: Wifi, labelKey: 'nav.onlineEval' },
      { key: '/synthetic-data', icon: FlaskConical, labelKey: 'nav.syntheticData' },
      { key: '/workflows', icon: Workflow, labelKey: 'nav.workflows' },
      { key: '/data-lineage', icon: GitMerge, labelKey: 'nav.dataLineage' },
      { key: '/model-comparison', icon: ArrowLeftRight, labelKey: 'nav.modelComparison' },
      { key: '/alert-rules', icon: Bell, labelKey: 'nav.alertRules' },
      { key: '/permissions', icon: Users, labelKey: 'nav.permissions' },
      { key: '/data-sampling', icon: Filter, labelKey: 'nav.dataSampling' },
      { key: '/data-quality', icon: CheckCircle, labelKey: 'nav.dataQuality' },
      { key: '/task-orchestration', icon: Workflow, labelKey: 'nav.taskOrchestration' },
    ],
  },
  {
    labelKey: 'nav.groupPlatform',
    items: [
      { key: '/config', icon: Cog, labelKey: 'nav.config' },
      { key: '/search', icon: Search, labelKey: 'nav.search' },
      { key: '/tenants', icon: Building, labelKey: 'nav.tenants' },
      { key: '/eval-cache', icon: HardDrive, labelKey: 'nav.evalCache' },
      { key: '/prompt-version', icon: FileText, labelKey: 'nav.promptVersion' },
      { key: '/replay', icon: RotateCcw, labelKey: 'nav.replay' },
      { key: '/experiments', icon: Microscope, labelKey: 'nav.experiments' },
      { key: '/anonymization', icon: ShieldOff, labelKey: 'nav.anonymization' },
      { key: '/rate-limiting', icon: Gauge, labelKey: 'nav.rateLimiting' },
      { key: '/data-augmentation', icon: Layers, labelKey: 'nav.dataAugmentation' },
      { key: '/multilingual', icon: Languages, labelKey: 'nav.multilingual' },
      { key: '/report-gen', icon: FileOutput, labelKey: 'nav.reportGen' },
      { key: '/data-versioning', icon: GitCommit, labelKey: 'nav.dataVersioning' },
      { key: '/metric-attribution', icon: PieChart, labelKey: 'nav.metricAttribution' },
      { key: '/scenarios', icon: Map, labelKey: 'nav.scenarios' },
      { key: '/result-explanation', icon: HelpCircle, labelKey: 'nav.resultExplanation' },
      { key: '/distillation', icon: Cpu, labelKey: 'nav.distillation' },
      { key: '/federated', icon: Network, labelKey: 'nav.federated' },
      { key: '/model-registry', icon: Package, labelKey: 'nav.modelRegistry' },
    ],
  },
]

const allMenuItems = menuGroups.flatMap(g => g.items)

function MainLayout() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    menuGroups.forEach(g => { init[g.labelKey] = true })
    return init
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const currentPage = allMenuItems.find(item => item.key === location.pathname)

  const getPageTitle = () => {
    if (currentPage) return t(currentPage.labelKey)
    if (location.pathname === '/settings') return t('common.settings')
    return t('nav.dashboard')
  }

  const filteredItems = allMenuItems.filter(item =>
    t(item.labelKey).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavigate = (key: string) => {
    navigate(key)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const renderMenu = () => (
    <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
      {menuGroups.map(group => {
        const isExpanded = expandedGroups[group.labelKey]
        const groupHasActive = group.items.some(item => location.pathname === item.key)
        return (
          <div key={group.labelKey} className="mb-1">
            {(!collapsed && !isMobile) && (
              <button
                onClick={() => toggleGroup(group.labelKey)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider',
                  'text-muted-foreground/70 hover:text-muted-foreground hover:bg-accent/50',
                  'transition-colors duration-150'
                )}
              >
                <span className={cn(groupHasActive && 'text-primary')}>{t(group.labelKey)}</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
              </button>
            )}
            {(isExpanded || collapsed || isMobile) && (
              <div className="mt-0.5 space-y-0.5">
                {group.items.map(item => {
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
                      <Icon className="h-4 w-5 shrink-0" />
                      {(!collapsed && !isMobile) && <span className="truncate">{t(item.labelKey)}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-[width] duration-300 ease-in-out',
          isMobile && cn(
            'fixed inset-y-0 left-0 z-50 w-60',
            'transform transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          ),
          !isMobile && (collapsed ? 'w-16' : 'w-60')
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-bold text-foreground truncate">
            {t('app.title')}
          </span>
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent" aria-label="关闭侧边栏">
              <X className="h-4 w-4" />
            </button>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn('ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150')}
              aria-label={collapsed ? t('common.expand') : t('common.collapse')}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {renderMenu()}

        {(!collapsed || isMobile) && (
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">{t('app.version')}</div>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150" aria-label="打开菜单">
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block"><ThemeToggle /></div>
            <div className="relative">
              <button
                onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery('') }}
                className={cn('flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors duration-150')}
                aria-label={t('common.search')}
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">{t('common.search')}</span>
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-popover p-2 shadow-lg animate-toast-in">
                  <div className="flex items-center gap-2 border-b border-border-light pb-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input autoFocus className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder={t('common.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    {filteredItems.map(item => {
                      const Icon = item.icon
                      return (
                        <button key={item.key} onClick={() => handleNavigate(item.key)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors duration-150">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {t(item.labelKey)}
                        </button>
                      )
                    })}
                    {filteredItems.length === 0 && <div className="py-4 text-center text-sm text-muted-foreground">未找到匹配页面</div>}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/settings')} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150" aria-label={t('common.settings')}>
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
