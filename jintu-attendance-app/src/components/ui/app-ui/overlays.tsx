import * as React from 'react'
import { Dialog, DialogContentBottomSheet, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

function SheetContainer({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="px-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
      <DialogHeader className="px-1 pb-4 pt-1 text-left sm:text-left">
        <DialogTitle className="text-[18px] font-semibold text-[var(--on-surface)]">
          {title}
        </DialogTitle>
        {description ? (
          <DialogDescription className="text-[14px] leading-6 text-[var(--on-surface-muted)]">
            {description}
          </DialogDescription>
        ) : null}
      </DialogHeader>
      {children}
    </div>
  )
}

export function OverflowSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentBottomSheet className={cn('max-h-[72vh]', className)}>
        <SheetContainer title={title}>{children}</SheetContainer>
      </DialogContentBottomSheet>
    </Dialog>
  )
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentBottomSheet className={cn('max-h-[78vh]', className)}>
        <SheetContainer title={title} description={description}>
          {children}
        </SheetContainer>
      </DialogContentBottomSheet>
    </Dialog>
  )
}
