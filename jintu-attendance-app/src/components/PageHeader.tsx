import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const headerBase =
  'glass-bar sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-[var(--outline-variant)] px-[var(--page-x)] py-2 shadow-elevation-1'
const headerStyle = { paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' } as const

export interface PageHeaderProps {
  /** 标题（必填） */
  title: string
  /** 点击返回时调用；不传则不渲染返回按钮（如首页） */
  onBack?: () => void
  /** 标题右侧区域（如导出按钮） */
  right?: React.ReactNode
  /** 标题的额外 class */
  titleClassName?: string
  /** header 的额外 class */
  className?: string
}

/**
 * 通用页面顶栏：可选返回按钮 + 标题 + 可选右侧区域。
 * 与各页现有的 glass-bar + ChevronLeft + h1 样式一致，便于统一替换。
 */
export function PageHeader({ title, onBack, right, titleClassName, className }: PageHeaderProps) {
  return (
    <header className={cn(headerBase, className)} style={headerStyle}>
      {onBack != null ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full text-[var(--on-surface-variant)] active:scale-95 active:bg-[var(--surface-hover)]"
          onClick={onBack}
          aria-label="返回"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      ) : (
        <div className="w-10 shrink-0" aria-hidden />
      )}
      <h1 className={cn('min-w-0 flex-1 truncate text-title font-semibold text-[var(--on-surface)]', titleClassName)}>
        {title}
      </h1>
      {right != null ? <div className="shrink-0">{right}</div> : null}
    </header>
  )
}

export default PageHeader
