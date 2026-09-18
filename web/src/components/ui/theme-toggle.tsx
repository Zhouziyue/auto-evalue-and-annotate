import { useTheme } from '@/components/theme-provider'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: '亮色' },
    { value: 'dark', icon: Moon, label: '暗色' },
    { value: 'system', icon: Monitor, label: '跟随系统' },
  ]

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-sm transition-colors duration-150',
            theme === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          aria-label={label}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}
