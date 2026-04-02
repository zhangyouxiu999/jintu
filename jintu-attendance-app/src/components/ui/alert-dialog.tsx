import * as React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Alert 内容区：padding 20px，区块 gap 12px，与 Dialog 统一 */
const AlertDialogContext = React.createContext<{ onOpenChange?: (open: boolean) => void } | null>(null)

function AlertDialog({ children, onOpenChange, ...props }: React.ComponentProps<typeof Dialog>) {
  return (
    <AlertDialogContext.Provider value={{ onOpenChange }}>
      <Dialog {...props} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </AlertDialogContext.Provider>
  )
}

function AlertDialogPortal(props: React.ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-portal" {...props} />
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-overlay" className={className} {...props} />
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      role="alertdialog"
      aria-modal="true"
      data-slot="alert-dialog-content"
      className={cn(className)}
      {...props}
    />
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <DialogHeader data-slot="alert-dialog-header" className={className} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle data-slot="alert-dialog-title" className={cn('text-dialog-title', className)} {...props} />
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription data-slot="alert-dialog-description" className={cn('text-caption', className)} {...props} />
}

function AlertDialogAction({
  className,
  variant = 'default',
  onClick,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>) {
  const alertDialogContext = React.useContext(AlertDialogContext)

  return (
    <Button
      type="button"
      data-slot="button"
      variant={variant ?? 'default'}
      size="default"
      className={cn('min-h-11 px-4 text-[14px] font-medium sm:min-w-[96px]', className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          alertDialogContext?.onOpenChange?.(false)
        }
      }}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  onClick,
  ...props
}: React.ComponentProps<'button'>) {
  const alertDialogContext = React.useContext(AlertDialogContext)

  return (
    <Button
      type="button"
      data-slot="button"
      variant="outline"
      size="default"
      className={cn('min-h-11 px-4 text-[14px] font-medium sm:min-w-[96px]', className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          alertDialogContext?.onOpenChange?.(false)
        }
      }}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
