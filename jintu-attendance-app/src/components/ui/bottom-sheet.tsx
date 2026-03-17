import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface BottomSheetContentProps {
  className?: string
  /** 标题文案，居中显示；不传则不显示标题栏 */
  title?: string
  showCloseButton?: boolean
  onClose?: () => void
  children: React.ReactNode
}

/** 从下向上的抽屉（不依赖 Radix），通过 createPortal 挂载到 body */
function BottomSheetContent({
  className,
  children,
  title = '我的',
  showCloseButton = true,
  onClose,
}: BottomSheetContentProps) {
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--outline-variant)] bg-transparent px-4 py-3">
        <div className="w-10 shrink-0" aria-hidden />
        <h2 className="min-w-0 flex-1 text-center text-[17px] font-semibold text-[var(--on-surface)]">
          {title}
        </h2>
        {showCloseButton && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--on-surface-muted)] transition-colors active:opacity-80"
            aria-label="关闭"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : (
          <div className="w-10 shrink-0" aria-hidden />
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}

function BottomSheetRoot({ open, onOpenChange, children }: BottomSheetProps) {
  const [visible, setVisible] = React.useState(false)
  const handleClose = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const t = requestAnimationFrame(() => setVisible(true))
      return () => {
        cancelAnimationFrame(t)
        document.body.style.overflow = prev
        setVisible(false)
      }
    } else {
      setVisible(false)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col items-stretch justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="我的"
    >
      {/* 遮罩：点击关闭 */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45 transition-opacity duration-200 ease-out"
        aria-label="关闭"
        onClick={handleClose}
      />
      {/* 抽屉面板：从下向上滑入 */}
      <div
        className={cn(
          'relative z-10 flex max-h-[90dvh] w-full flex-col transition-transform duration-300 ease-out',
          'rounded-t-[20px] bg-[var(--surface)] shadow-[0_-4px_24px_rgba(0,0,0,0.12)]',
          'pb-[env(safe-area-inset-bottom,0px)]',
          visible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

/** 组合使用：BottomSheet 包住 BottomSheetContent + 内容 */
const BottomSheet = BottomSheetRoot

export { BottomSheet, BottomSheetContent }
