import { ChevronDown, UserCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppShellHeaderProps {
  activeClassName: string
  loading: boolean
  isMePage: boolean
  isTransitioning: boolean
  swipeGestureVisible: boolean
  transitionKind: string
  currentSceneRouteKind: string
  onOpenClassPanel: () => void
  onNavigateMore: () => void
}

export default function AppShellHeader({
  activeClassName,
  loading,
  isMePage,
  isTransitioning,
  swipeGestureVisible,
  transitionKind,
  currentSceneRouteKind,
  onOpenClassPanel,
  onNavigateMore,
}: AppShellHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const observerTarget = headerRef.current
    if (!observerTarget) return

    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--header-height', `${entry.contentRect.height}px`)
    })

    observer.observe(observerTarget)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const timeLabel = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 shrink-0 border-b border-[var(--outline)]/60 bg-[var(--surface)]/92 backdrop-blur-[10px]"
      data-transitioning={isTransitioning || swipeGestureVisible ? 'true' : 'false'}
      data-transition-kind={transitionKind}
      data-route-kind={currentSceneRouteKind}
    >
      <div className="mx-auto w-full max-w-[var(--app-max-width)] px-[var(--page-x)] pb-2.5 pt-[calc(var(--safe-top)+10px)]">
        <div className="flex items-center justify-between gap-2 rounded-[18px] border border-[var(--outline)]/70 bg-[var(--surface)]/96 px-2.5 py-2 shadow-[0_6px_18px_rgba(94,79,52,0.04)]">
          <div className="rounded-[12px] px-2 py-1 text-[11px] font-medium tabular-nums leading-none text-[var(--on-surface-muted)]">
            {timeLabel}
          </div>

          <Button
            type="button"
            onClick={onOpenClassPanel}
            variant="ghost"
            className={cn(
              'min-w-0 flex-1 justify-between rounded-[14px] border-transparent bg-transparent text-left shadow-none hover:bg-transparent focus-visible:bg-transparent active:bg-transparent [&_span]:leading-none',
              isMePage ? 'h-9.5 px-2.5' : 'h-10 px-2.5'
            )}
            aria-label="打开班级快捷入口"
          >
            <span className="min-w-0 flex flex-1 items-center gap-2 text-left">
              <span className="block truncate text-[15px] font-semibold leading-none tracking-[-0.02em] text-[var(--on-surface)]">
                {(activeClassName.trim() || '') || (loading ? '加载中…' : '未命名班级')}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.8} />
          </Button>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant={isMePage ? 'secondary' : 'ghost'}
              onClick={onNavigateMore}
              aria-label="进入我"
              className={cn(
                'h-11 min-w-[56px] rounded-[14px] px-3 text-[14px] font-semibold shadow-none [&_span]:leading-none',
                isMePage && 'bg-[var(--primary-container)] text-[var(--primary)]'
              )}
            >
              <UserCircle2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
              我
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
