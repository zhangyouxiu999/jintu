import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/** 弹窗内容区：统一小字号，padding 20px，区块 gap 12px；与 AlertDialog 一致 */
const dialogContentBase =
  'fixed z-[110] flex flex-col gap-3 left-1/2 right-auto top-1/2 bottom-auto w-[min(calc(100vw-2rem),28rem)] max-w-md max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-5 text-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] opacity-0 transition-opacity duration-150 ease-out data-[state=open]:opacity-100'

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-[110] bg-black/45 opacity-0 transition-opacity duration-150 ease-out data-[state=open]:opacity-100',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          dialogContentBase,
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 flex min-h-10 min-w-10 items-center justify-center rounded-full text-[var(--on-surface-muted)] focus:outline-none disabled:pointer-events-none [&_svg]:size-5">
          <XIcon />
          <span className="sr-only">关闭</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-dialog-title leading-tight', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-caption', className)}
      {...props}
    />
  )
}

/** 从下向上的抽屉内容区：复用 Dialog 的 Portal/Overlay，内容固定到底部、全宽、圆角顶边、滑入动画 */
function DialogContentBottomSheet({
  className,
  children,
  showHandle = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showHandle?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay className="z-[100]" />
      <DialogPrimitive.Content
        data-slot="dialog-content-bottom-sheet"
        className={cn(
          'fixed left-0 right-0 bottom-0 z-[100] flex max-h-[90dvh] w-full flex-col',
          'rounded-t-[20px] border-0 bg-[var(--surface)] p-0 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]',
          'translate-y-full transition-transform duration-300 ease-out data-[state=open]:translate-y-0',
          'pb-[env(safe-area-inset-bottom,0px)]',
          className
        )}
        {...props}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-2">
          <div className="flex flex-1 justify-center">
            {showHandle ? (
              <div className="h-1 w-10 shrink-0 rounded-full bg-[var(--outline-variant)]" aria-hidden />
            ) : null}
          </div>
          <DialogPrimitive.Close
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-muted)] transition-colors focus:outline-none disabled:pointer-events-none"
            aria-label="关闭"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </DialogPrimitive.Close>
          {showHandle ? <div className="w-10 shrink-0" aria-hidden /> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentBottomSheet,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
