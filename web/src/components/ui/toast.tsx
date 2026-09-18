// Toast 组件 — 规范 §8.3: Toast 规范
// 位置: 顶部居中 | 自动关闭: success/info 3s, warning/error 5s
import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
  leaving?: boolean
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback: 返回空函数，避免未包裹 Provider 时报错
    return { toast: (_type: ToastType, _msg: string) => {} }
  }
  return ctx
}

// 便捷方法
export function useToastActions() {
  const { toast } = useToast()
  return {
    toastSuccess: (msg: string) => toast('success', msg, 3000),
    toastError: (msg: string) => toast('error', msg, 5000),
    toastWarning: (msg: string) => toast('warning', msg, 5000),
    toastInfo: (msg: string) => toast('info', msg, 3000),
  }
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-success/30 bg-success-light text-success',
  error: 'border-destructive/30 bg-error-light text-destructive',
  warning: 'border-warning/30 bg-warning-light text-warning',
  info: 'border-info/30 bg-info-light text-info',
}

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 150) // 等动画结束
  }, [])

  const toast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const autoDuration = duration ?? (type === 'error' || type === 'warning' ? 5000 : 3000)

    setToasts(prev => [...prev, { id, type, message, duration: autoDuration }])

    if (autoDuration > 0) {
      setTimeout(() => removeToast(id), autoDuration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Container — 顶部居中 */}
      <div
        aria-live="polite"
        className="fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm',
              'min-w-[280px] max-w-[480px] text-sm font-medium',
              typeStyles[t.type],
              t.leaving ? 'animate-toast-out' : 'animate-toast-in',
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs">
              {typeIcons[t.type]}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="关闭"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
