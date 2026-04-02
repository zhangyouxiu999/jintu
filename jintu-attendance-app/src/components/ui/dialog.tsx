import * as React from 'react'
import { XIcon, X } from 'lucide-react'
import { Dialog as TamaguiDialog } from 'tamagui'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  return React.useContext(DialogContext)
}

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof TamaguiDialog>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? Boolean(openProp) : uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <TamaguiDialog data-slot="dialog" modal open={open} onOpenChange={handleOpenChange} {...props}>
        {children}
      </TamaguiDialog>
    </DialogContext.Provider>
  )
}

function DialogTrigger(props: React.ComponentProps<typeof TamaguiDialog.Trigger>) {
  return <TamaguiDialog.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: React.ComponentProps<typeof TamaguiDialog.Portal>) {
  return <TamaguiDialog.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof TamaguiDialog.Close>) {
  return <TamaguiDialog.Close data-slot="dialog-close" {...props} />
}

/** 弹窗内容区：统一小字号，padding 20px，区块 gap 12px；与 AlertDialog 一致 */
const dialogContentBase =
  'fixed left-1/2 right-auto top-1/2 bottom-auto z-[110] flex w-[min(calc(100vw-2rem),28rem)] max-h-[85vh] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-auto rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-5 text-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] opacity-0 transition-opacity duration-150 ease-out data-[state=open]:opacity-100'

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof TamaguiDialog.Overlay>) {
  return (
    <TamaguiDialog.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-[110] bg-black/45 opacity-0 transition-opacity duration-150 ease-out data-[state=open]:opacity-100',
        className
      )}
      {...(props as object)}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TamaguiDialog.Content>) {
  const dialogContext = useDialogContext()
  if (!dialogContext?.open) return null

  return (
    <DialogPortal>
      <DialogOverlay key="dialog-overlay" />
      <TamaguiDialog.Content
        key="dialog-content"
        data-slot="dialog-content"
        className={cn(
          dialogContentBase,
          'relative',
          className
        )}
        {...(props as object)}
      >
        {children}
        <TamaguiDialog.Close
          data-slot="dialog-close"
          aria-label="关闭"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--on-surface-muted)] focus:outline-none disabled:pointer-events-none [&_svg]:size-5"
        >
          <XIcon />
          <span className="sr-only">关闭</span>
        </TamaguiDialog.Close>
      </TamaguiDialog.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-left', className)}
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
}: React.ComponentProps<typeof TamaguiDialog.Title>) {
  return (
    <TamaguiDialog.Title
      data-slot="dialog-title"
      className={cn('m-0 pr-12 text-[18px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--on-surface)] break-words', className)}
      {...(props as object)}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof TamaguiDialog.Description>) {
  return (
    <TamaguiDialog.Description
      data-slot="dialog-description"
      className={cn('m-0 text-[14px] leading-6 text-[var(--on-surface-muted)] break-words', className)}
      {...(props as object)}
    />
  )
}

/** 从下向上的抽屉内容区：复用 Dialog 的 Portal/Overlay，内容固定到底部、全宽、圆角顶边、滑入动画 */
function DialogContentBottomSheet({
  className,
  children,
  showHandle = true,
  ...props
}: React.ComponentProps<typeof TamaguiDialog.Content> & { showHandle?: boolean }) {
  const dialogContext = useDialogContext()
  if (!dialogContext?.open) return null

  return (
    <DialogPortal>
      <DialogOverlay key="dialog-bottom-sheet-overlay" className="z-[100]" />
      <TamaguiDialog.Content
        key="dialog-bottom-sheet-content"
        data-slot="dialog-content-bottom-sheet"
        className={cn(
          'fixed left-0 right-0 bottom-0 z-[100] flex max-h-[90dvh] w-full flex-col',
          'rounded-t-[20px] border-0 bg-[var(--surface)] p-0 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]',
          'translate-y-full transition-transform duration-300 ease-out data-[state=open]:translate-y-0',
          'pb-[env(safe-area-inset-bottom,0px)]',
          'relative',
          className
        )}
        {...(props as object)}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-2">
          <div className="flex flex-1 justify-center">
            {showHandle ? (
              <div className="h-1 w-10 shrink-0 rounded-full bg-[var(--outline-variant)]" aria-hidden />
            ) : null}
          </div>
          <TamaguiDialog.Close
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--on-surface-muted)] transition-colors focus:outline-none disabled:pointer-events-none"
            aria-label="关闭"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </TamaguiDialog.Close>
          {showHandle ? <div className="w-10 shrink-0" aria-hidden /> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </TamaguiDialog.Content>
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
